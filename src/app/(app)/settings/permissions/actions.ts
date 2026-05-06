"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MODULE_IDS, type ModuleId, type RolePermissions } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

const CONFIGURABLE_ROLES = ["admin", "technician", "front_desk"] as const;

export async function savePermissionsAction(_prev: { ok?: boolean; error?: string } | null, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (session.user.role !== "owner") return { error: "Solo il proprietario può modificare i permessi." };

  const orgId = session.user.organizationId;
  const perms: RolePermissions = {};

  for (const role of CONFIGURABLE_ROLES) {
    perms[role] = MODULE_IDS.filter((mod: ModuleId) =>
      formData.get(`${role}_${mod}`) === "on"
    );
  }

  await db.update(organizations)
    .set({ rolePermissions: perms, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));

  logActivity({ orgId, action: "permissions.update" }).catch(() => {});

  return { ok: true };
}
