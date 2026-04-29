"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { can, type Role } from "@/lib/permissions";

function assertOwner(role: string | null | undefined) {
  if (!can.manageTeam(role)) throw new Error("Solo il proprietario può gestire il team.");
}

export async function updateMemberRoleAction(userId: string, newRole: Role) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  assertOwner(session.user.role);

  if (userId === session.user.id) throw new Error("Non puoi cambiare il tuo stesso ruolo.");

  const validRoles: Role[] = ["owner", "admin", "technician", "front_desk"];
  if (!validRoles.includes(newRole)) throw new Error("Ruolo non valido.");

  await db
    .update(memberships)
    .set({ role: newRole })
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, session.user.organizationId),
      ),
    );

  revalidatePath("/settings/team");
}

export async function removeMemberAction(userId: string) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  assertOwner(session.user.role);

  if (userId === session.user.id) throw new Error("Non puoi rimuovere te stesso.");

  await db
    .delete(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organizationId, session.user.organizationId),
      ),
    );

  revalidatePath("/settings/team");
}
