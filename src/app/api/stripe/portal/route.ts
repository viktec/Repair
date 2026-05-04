import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId;
  const [org] = await db
    .select({ stripeCustomerId: organizations.stripeCustomerId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org?.stripeCustomerId) {
    return NextResponse.json({ error: "Nessun abbonamento attivo" }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://app.my-repair.it";
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${baseUrl}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
