import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, memberships } from "@/db/schema";
import { sendMagicLinkEmail } from "@/lib/email";

// POST /api/auth/magic — genera token e invia email
export async function POST(req: NextRequest) {
  let email: string | null = null;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email : null;
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email obbligatoria" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  // Rispondiamo sempre ok — non rivelare se l'email esiste
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minuti

    await db.update(users).set({
      magicLinkToken: hashedToken,
      magicLinkExpiresAt: expiresAt,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    await sendMagicLinkEmail({ to: normalizedEmail, token: rawToken });
  }

  return NextResponse.json({ ok: true });
}

// GET /api/auth/magic?token=... — verifica token, redirect alla pagina di callback
export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL ?? "https://app.my-repair.it";
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=token_mancante", appUrl));
  }

  // Verifica rapida che il token esista (la verifica definitiva avviene nel provider "magic")
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const [user] = await db
    .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.magicLinkToken, hashedToken))
    .limit(1);

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=link_scaduto", appUrl));
  }

  const [membership] = await db
    .select({ organizationId: memberships.organizationId })
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1);

  const next = user.isSuperAdmin ? "/admin" : (membership?.organizationId ? "/dashboard" : "/pending");

  // Redirect alla pagina di callback con il token raw — la pagina chiama signIn("magic")
  return NextResponse.redirect(
    new URL(
      `/auth/magic-callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`,
      appUrl
    )
  );
}
