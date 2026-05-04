import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanFromPriceId, stripeStatusToLocal } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { sendNewSubscriptionEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;
        const orgId = session.metadata?.orgId;
        if (!orgId) break;

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = sub.items.data[0]?.price.id ?? "";
        const plan = getPlanFromPriceId(priceId) ?? "start";

        await db
          .update(organizations)
          .set({
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            stripePriceId: priceId,
            subscriptionStatus: "active",
            plan,
            trialEndsAt: null,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, orgId));

        const [org] = await db
          .select({ name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, orgId))
          .limit(1);
        if (org) {
          await sendNewSubscriptionEmail({
            shopName: org.name,
            ownerEmail: session.customer_email ?? "",
            plan,
            orgId,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id ?? "";
        const plan = getPlanFromPriceId(priceId);
        const status = stripeStatusToLocal(sub.status);

        await db
          .update(organizations)
          .set({
            stripePriceId: priceId,
            subscriptionStatus: status,
            ...(plan ? { plan } : {}),
            updatedAt: new Date(),
          })
          .where(eq(organizations.stripeSubscriptionId, sub.id));
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await db
          .update(organizations)
          .set({ subscriptionStatus: "canceled", updatedAt: new Date() })
          .where(eq(organizations.stripeSubscriptionId, sub.id));
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (!customerId) break;
        await db
          .update(organizations)
          .set({ subscriptionStatus: "active", updatedAt: new Date() })
          .where(eq(organizations.stripeCustomerId, customerId));
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (!customerId) break;
        await db
          .update(organizations)
          .set({ subscriptionStatus: "past_due", updatedAt: new Date() })
          .where(eq(organizations.stripeCustomerId, customerId));
        break;
      }
    }
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
