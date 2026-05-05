import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supportInterventions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { token, signatureData } = body ?? {};

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token mancante" }, { status: 400 });
  }
  if (!signatureData || typeof signatureData !== "string") {
    return NextResponse.json({ error: "Firma mancante" }, { status: 400 });
  }

  const [intervention] = await db
    .select({ id: supportInterventions.id, clientSignedAt: supportInterventions.clientSignedAt })
    .from(supportInterventions)
    .where(eq(supportInterventions.clientSignatureToken, token))
    .limit(1);

  if (!intervention) {
    return NextResponse.json({ error: "Verbale non trovato" }, { status: 404 });
  }
  if (intervention.clientSignedAt) {
    return NextResponse.json({ ok: true, alreadySigned: true });
  }

  await db
    .update(supportInterventions)
    .set({
      clientSignedAt: new Date(),
      clientSignatureData: signatureData,
      updatedAt: new Date(),
    })
    .where(eq(supportInterventions.id, intervention.id));

  return NextResponse.json({ ok: true });
}
