"use server";

import { db } from "@/lib/db";
import { organizations, memberships, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user.isSuperAdmin) redirect("/dashboard");
}

export async function approveOrgAction(orgId: string) {
  await requireSuperAdmin();

  await db
    .update(organizations)
    .set({ registrationStatus: "approved", rejectionReason: null, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));

  const owner = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .innerJoin(memberships, eq(memberships.userId, users.id))
    .where(eq(memberships.organizationId, orgId))
    .limit(1)
    .then((r) => r[0]);

  if (owner?.email) {
    sendApprovalEmail({ to: owner.email, name: owner.name ?? owner.email }).catch(() => {});
  }

  revalidatePath("/admin/orgs");
  revalidatePath(`/admin/orgs/${orgId}`);
}

export async function rejectOrgAction(orgId: string, reason: string) {
  await requireSuperAdmin();

  await db
    .update(organizations)
    .set({
      registrationStatus: "rejected",
      rejectionReason: reason || null,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));

  const owner = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .innerJoin(memberships, eq(memberships.userId, users.id))
    .where(eq(memberships.organizationId, orgId))
    .limit(1)
    .then((r) => r[0]);

  if (owner?.email) {
    sendRejectionEmail({ to: owner.email, name: owner.name ?? owner.email, reason }).catch(() => {});
  }

  revalidatePath("/admin/orgs");
  revalidatePath(`/admin/orgs/${orgId}`);
}

export async function updateOrgNotesAction(orgId: string, notes: string) {
  await requireSuperAdmin();

  await db
    .update(organizations)
    .set({ adminNotes: notes || null, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));

  revalidatePath(`/admin/orgs/${orgId}`);
}
