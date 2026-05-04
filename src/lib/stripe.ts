import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia" as const,
});

export const PRICE_IDS = {
  start: {
    monthly: process.env.STRIPE_PRICE_START_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_START_ANNUAL ?? "",
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
  },
  business: {
    monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? "",
    annual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL ?? "",
  },
} as const;

export type Plan = keyof typeof PRICE_IDS;
export type Billing = "monthly" | "annual";

export function getPlanFromPriceId(priceId: string): Plan | null {
  for (const [plan, prices] of Object.entries(PRICE_IDS)) {
    if (prices.monthly === priceId || prices.annual === priceId) {
      return plan as Plan;
    }
  }
  return null;
}

export function stripeStatusToLocal(
  status: Stripe.Subscription.Status,
): "trial" | "active" | "past_due" | "canceled" {
  if (status === "active" || status === "trialing") return "active";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  return "past_due";
}
