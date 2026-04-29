import { db } from "@/lib/db";
import { users, memberships, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { Shield } from "lucide-react";

export default async function AdminUsersPage() {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isSuperAdmin: users.isSuperAdmin,
      createdAt: users.createdAt,
      orgName: organizations.name,
      orgPlan: organizations.plan,
      role: memberships.role,
    })
    .from(users)
    .leftJoin(memberships, eq(memberships.userId, users.id))
    .leftJoin(organizations, eq(organizations.id, memberships.organizationId))
    .orderBy(users.createdAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utenti</h1>
        <p className="mt-1 text-sm text-muted-foreground">{rows.length} utenti totali</p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Utente</th>
              <th className="px-4 py-3">Organizzazione</th>
              <th className="px-4 py-3">Ruolo</th>
              <th className="px-4 py-3">Registrato</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {u.isSuperAdmin && <Shield className="h-3.5 w-3.5 text-primary" />}
                    <div>
                      <p className="font-medium">{u.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {u.orgName ? (
                    <div>
                      <p className="font-medium">{u.orgName}</p>
                      <p className="text-xs text-muted-foreground uppercase">{u.orgPlan}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.isSuperAdmin ? "Super Admin" : u.role ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
