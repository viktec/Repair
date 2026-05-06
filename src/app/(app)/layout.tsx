import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppShell } from "@/components/layout/app-shell";
import { getModulesForRole, type RolePermissions } from "@/lib/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orgId = session.user.organizationId;
  if (!orgId) {
    redirect(session.user.isSuperAdmin ? "/admin" : "/login");
  }

  const [org] = await db
    .select({
      registrationStatus: organizations.registrationStatus,
      plan: organizations.plan,
      subscriptionStatus: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt,
      stripeCustomerId: organizations.stripeCustomerId,
      rolePermissions: organizations.rolePermissions,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org || org.registrationStatus !== "approved") redirect("/pending");

  const now = Date.now();
  const isTrialExpired =
    org.subscriptionStatus === "trial" &&
    org.trialEndsAt !== null &&
    new Date(org.trialEndsAt).getTime() < now;

  const isHardBlocked = isTrialExpired || org.subscriptionStatus === "canceled";
  if (isHardBlocked && org.plan !== "gift") redirect("/upgrade");

  // past_due: show banner (AppShell handles it) — don't hard-block, Stripe retries for days
  const isPastDue = org.subscriptionStatus === "past_due";

  const trialDaysLeft =
    org.subscriptionStatus === "trial" && org.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(org.trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24)))
      : null;

  const allowedModules = getModulesForRole(
    session.user.role,
    org.rolePermissions as RolePermissions | null,
  );

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      role={session.user.role}
      plan={org.plan}
      subscriptionStatus={org.subscriptionStatus}
      trialDaysLeft={trialDaysLeft}
      isPastDue={isPastDue}
      hasStripeCustomer={!!org.stripeCustomerId}
      allowedModules={allowedModules}
    >
      {children}
    </AppShell>
  );
}
