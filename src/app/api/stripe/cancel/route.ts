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
    .select({ stripeSubscriptionId: organizations.stripeSubscriptionId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org?.stripeSubscriptionId) {
    return NextResponse.json({ error: "Nessun abbonamento attivo" }, { status: 400 });
  }

  const sub = await stripe.subscriptions.update(org.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  const periodEndTs = sub.items.data[0]?.current_period_end ?? 0;
  const periodEnd = periodEndTs ? new Date(periodEndTs * 1000) : null;

  await db
    .update(organizations)
    .set({
      stripeCancelAtPeriodEnd: true,
      stripeCurrentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));

  return NextResponse.json({
    ok: true,
    periodEnd: periodEnd?.toISOString() ?? null,
  });
}
