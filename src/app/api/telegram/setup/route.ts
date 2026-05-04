import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { can } from "@/lib/permissions";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ ok: false, error: "Non autenticato" }, { status: 401 });
  }
  if (!can.editOrgSettings(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Non autorizzato" }, { status: 403 });
  }

  const orgId = session.user.organizationId;

  const [org] = await db
    .select({
      telegramBotToken: organizations.telegramBotToken,
      plan: organizations.plan,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) {
    return NextResponse.json({ ok: false, error: "Organizzazione non trovata" }, { status: 404 });
  }

  if (!["business", "gift"].includes(org.plan)) {
    return NextResponse.json(
      { ok: false, error: "Il bot Telegram richiede il piano Business" },
      { status: 403 },
    );
  }

  if (!org.telegramBotToken) {
    return NextResponse.json(
      { ok: false, error: "Configura prima il Bot Token nelle impostazioni" },
      { status: 400 },
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";
  const webhookUrl = `${baseUrl}/api/telegram/webhook`;

  const res = await fetch(
    `https://api.telegram.org/bot${org.telegramBotToken}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    },
  );

  const data = (await res.json()) as { ok: boolean; description?: string };

  if (!data.ok) {
    return NextResponse.json(
      { ok: false, error: data.description ?? "Errore Telegram" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
