"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations, platformConfig } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function assertSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const [user] = await db
    .select({ isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user?.isSuperAdmin) redirect("/dashboard");
}

export async function updateOrgPlanAction(
  orgId: string,
  plan: "start" | "pro" | "business" | "gift",
  subscriptionStatus: "trial" | "active" | "past_due" | "canceled",
  adminNotes: string,
  trialEndsAt: string | null,
) {
  await assertSuperAdmin();
  const isGift = plan === "gift";
  await db
    .update(organizations)
    .set({
      plan,
      subscriptionStatus: isGift ? "active" : subscriptionStatus,
      adminNotes: adminNotes || null,
      trialEndsAt: isGift ? null : (trialEndsAt ? new Date(trialEndsAt) : null),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
  revalidatePath("/admin");
  revalidatePath(`/admin/orgs/${orgId}`);
}

export async function setPricingVisibleAction(visible: boolean) {
  await assertSuperAdmin();
  await db
    .insert(platformConfig)
    .values({ id: 1, showPricing: visible })
    .onConflictDoUpdate({ target: platformConfig.id, set: { showPricing: visible } });
  revalidatePath("/");
  revalidatePath("/admin");
}
