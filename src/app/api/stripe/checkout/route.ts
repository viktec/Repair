import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, PRICE_IDS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { plan?: string; billing?: string };
  const plan = body.plan as keyof typeof PRICE_IDS | undefined;
  const billing = body.billing as "monthly" | "annual" | undefined;

  if (!plan || !billing || !PRICE_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan or billing" }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan][billing];
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  const orgId = session.user.organizationId;
  const [org] = await db
    .select({ name: organizations.name, stripeCustomerId: organizations.stripeCustomerId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  let customerId = org.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: org.name,
      metadata: { orgId },
    });
    customerId = customer.id;
    await db
      .update(organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(organizations.id, orgId));
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://app.my-repair.it";
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { orgId, plan, billing },
    subscription_data: { metadata: { orgId, plan, billing } },
    success_url: `${baseUrl}/settings?checkout=success`,
    cancel_url: `${baseUrl}/upgrade`,
    allow_promotion_codes: true,
    locale: "it",
  });

  return NextResponse.json({ url: checkoutSession.url });
}
