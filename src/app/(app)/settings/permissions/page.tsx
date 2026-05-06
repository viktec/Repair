import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  MODULE_IDS, MODULE_LABELS, ROLE_LABELS,
  DEFAULT_ROLE_PERMISSIONS,
  type ModuleId, type RolePermissions, type Role,
} from "@/lib/permissions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PermissionsForm } from "./permissions-form";

const CONFIGURABLE_ROLES: Role[] = ["admin", "technician", "front_desk"];

export default async function PermissionsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (session.user.role !== "owner") redirect("/settings");

  const [org] = await db
    .select({ rolePermissions: organizations.rolePermissions })
    .from(organizations)
    .where(eq(organizations.id, session.user.organizationId))
    .limit(1);

  const saved = (org?.rolePermissions ?? {}) as RolePermissions;

  const current: Record<Role, ModuleId[]> = {
    owner: [...MODULE_IDS],
    admin:      saved.admin      ?? DEFAULT_ROLE_PERMISSIONS.admin!,
    technician: saved.technician ?? DEFAULT_ROLE_PERMISSIONS.technician!,
    front_desk: saved.front_desk ?? DEFAULT_ROLE_PERMISSIONS.front_desk!,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Impostazioni
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Permessi per ruolo</h1>
          <p className="text-sm text-muted-foreground">
            Configura quali sezioni sono visibili per ogni ruolo
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="py-3 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-44">
                  Sezione
                </th>
                {CONFIGURABLE_ROLES.map((role) => (
                  <th key={role} className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
                <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {ROLE_LABELS.owner}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MODULE_IDS.map((mod) => (
                <tr key={mod} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 pl-5 pr-3 text-sm font-medium text-foreground">
                    {MODULE_LABELS[mod]}
                  </td>
                  {CONFIGURABLE_ROLES.map((role) => (
                    <td key={role} className="py-3 px-4 text-center">
                      <PermissionCell
                        name={`${role}_${mod}`}
                        defaultChecked={current[role].includes(mod)}
                      />
                    </td>
                  ))}
                  <td className="py-3 px-4 text-center">
                    <span className="text-primary text-lg" title="Sempre attivo">✓</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PermissionsForm />
      </div>

      <p className="text-xs text-muted-foreground px-1">
        Il ruolo <strong>Proprietario</strong> ha sempre accesso a tutte le sezioni e non è configurabile.
        Le modifiche si applicano al prossimo accesso dei membri.
      </p>
    </div>
  );
}

function PermissionCell({ name, defaultChecked }: { name: string; defaultChecked: boolean }) {
  return (
    <label className="inline-flex cursor-pointer justify-center">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300 accent-primary cursor-pointer"
        form="permissions-form"
      />
    </label>
  );
}
