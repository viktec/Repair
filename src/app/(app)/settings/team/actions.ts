"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberships, users, organizations, organizationInvites } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { can, type Role } from "@/lib/permissions";
import { sendInviteEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { logActivity } from "@/lib/activity";

function assertOwner(role: string | null | undefined) {
  if (!can.manageTeam(role)) throw new Error("Solo il proprietario può gestire il team.");
}

export async function updateMemberRoleAction(userId: string, newRole: Role) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  assertOwner(session.user.role);

  if (userId === session.user.id) throw new Error("Non puoi cambiare il tuo stesso ruolo.");

  const validRoles: Role[] = ["owner", "admin", "technician", "front_desk"];
  if (!validRoles.includes(newRole)) throw new Error("Ruolo non valido.");

  const [target] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);

  await db
    .update(memberships)
    .set({ role: newRole })
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, session.user.organizationId),
      ),
    );

  logActivity({
    orgId: session.user.organizationId,
    action: "team.role_change",
    entityType: "member",
    entityLabel: target?.name ?? target?.email ?? userId,
    metadata: { newRole },
  }).catch(() => {});

  revalidatePath("/settings/team");
}

export async function removeMemberAction(userId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  assertOwner(session.user.role);

  if (userId === session.user.id) throw new Error("Non puoi rimuovere te stesso.");

  const [target] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);

  await db
    .delete(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, session.user.organizationId),
      ),
    );

  logActivity({
    orgId: session.user.organizationId,
    action: "team.remove",
    entityType: "member",
    entityLabel: target?.name ?? target?.email ?? userId,
  }).catch(() => {});

  revalidatePath("/settings/team");
}

export type InviteState = { error?: string; success?: boolean } | null;

export async function inviteMemberAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  assertOwner(session.user.role);
  const orgId = session.user.organizationId;

  const email = (formData.get("email") as string | null)?.toLowerCase().trim() ?? "";
  const role = formData.get("role") as Role;

  if (!email) return { error: "Email obbligatoria" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Email non valida" };

  const validRoles: Role[] = ["admin", "technician", "front_desk"];
  if (!validRoles.includes(role)) return { error: "Ruolo non valido" };

  // Already a member?
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    const [existingMembership] = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(and(eq(memberships.userId, existingUser.id), eq(memberships.organizationId, orgId)))
      .limit(1);
    if (existingMembership) return { error: "Questo utente è già nel team" };
  }

  // Remove any previous pending invite for same email+org
  await db
    .delete(organizationInvites)
    .where(and(eq(organizationInvites.organizationId, orgId), eq(organizationInvites.email, email)));

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(organizationInvites).values({ organizationId: orgId, email, role, token, expiresAt });

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const appUrl = process.env.APP_URL ?? "https://app.my-repair.it";
  await sendInviteEmail({
    to: email,
    orgName: org?.name ?? "il team",
    inviterName: session.user.name ?? "Il proprietario",
    role,
    inviteUrl: `${appUrl}/invite/${token}`,
  });

  logActivity({
    orgId,
    action: "team.invite",
    entityType: "member",
    entityLabel: email,
    metadata: { role },
  }).catch(() => {});

  revalidatePath("/settings/team");
  return { success: true };
}

export async function cancelInviteAction(inviteId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  assertOwner(session.user.role);

  await db
    .delete(organizationInvites)
    .where(
      and(
        eq(organizationInvites.id, inviteId),
        eq(organizationInvites.organizationId, session.user.organizationId),
      ),
    );

  revalidatePath("/settings/team");
}
