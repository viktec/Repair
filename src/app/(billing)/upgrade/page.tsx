import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { UpgradeClient } from "./upgrade-client";

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const orgId = session.user.organizationId;
  const [org] = await db
    .select({
      plan: organizations.plan,
      subscriptionStatus: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt,
      stripeSubscriptionId: organizations.stripeSubscriptionId,
      stripeCustomerId: organizations.stripeCustomerId,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) redirect("/login");

  const isActive = org.subscriptionStatus === "active";
  const isTrialExpired =
    org.subscriptionStatus === "trial" &&
    org.trialEndsAt !== null &&
    new Date(org.trialEndsAt).getTime() < Date.now();

  const trialDaysLeft =
    org.subscriptionStatus === "trial" && org.trialEndsAt && !isTrialExpired
      ? Math.max(0, Math.ceil((new Date(org.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

  return (
    <UpgradeClient
      currentPlan={org.plan}
      subscriptionStatus={org.subscriptionStatus}
      isActive={isActive}
      isTrialExpired={isTrialExpired}
      trialDaysLeft={trialDaysLeft}
      hasSubscription={!!org.stripeSubscriptionId}
      hasStripeCustomer={!!org.stripeCustomerId}
      trialEndsAt={org.trialEndsAt ? org.trialEndsAt.toISOString() : null}
    />
  );
}
