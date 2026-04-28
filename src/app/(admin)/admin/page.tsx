import { db } from "@/lib/db";
import { organizations, memberships, tickets } from "@/db/schema";
import { eq, count, isNull } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AdminOrgActions } from "./org-actions";

export default async function AdminOrgsPage() {
  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      plan: organizations.plan,
      subscriptionStatus: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt,
      adminNotes: organizations.adminNotes,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .orderBy(organizations.createdAt);

  // Count members + tickets per org
  const [memberCounts, ticketCounts] = await Promise.all([
    db.select({ orgId: memberships.organizationId, total: count() })
      .from(memberships)
      .groupBy(memberships.organizationId),
    db.select({ orgId: tickets.organizationId, total: count() })
      .from(tickets)
      .where(isNull(tickets.deletedAt))
      .groupBy(tickets.organizationId),
  ]);

  const memberMap = new Map(memberCounts.map((r) => [r.orgId, r.total]));
  const ticketMap = new Map(ticketCounts.map((r) => [r.orgId, r.total]));

  const planColors: Record<string, string> = {
    solo: "bg-slate-100 text-slate-700",
    pro: "bg-blue-100 text-blue-700",
    business: "bg-purple-100 text-purple-700",
  };

  const statusColors: Record<string, string> = {
    trial: "bg-yellow-100 text-yellow-700",
    active: "bg-emerald-100 text-emerald-700",
    past_due: "bg-red-100 text-red-700",
    canceled: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizzazioni</h1>
          <p className="mt-1 text-sm text-muted-foreground">{orgs.length} tenant registrati</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Organizzazione</th>
              <th className="px-4 py-3">Piano</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Utenti</th>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Registrato</th>
              <th className="px-4 py-3">Scadenza trial</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-b last:border-0 hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{org.slug}</p>
                  {org.adminNotes && (
                    <p className="mt-0.5 text-xs text-amber-600 italic">{org.adminNotes}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${planColors[org.plan]}`}>
                    {org.plan.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[org.subscriptionStatus]}`}>
                    {org.subscriptionStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{memberMap.get(org.id) ?? 0}</td>
                <td className="px-4 py-3 text-center">{ticketMap.get(org.id) ?? 0}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(org.createdAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {org.trialEndsAt ? formatDate(org.trialEndsAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  <AdminOrgActions
                    orgId={org.id}
                    currentPlan={org.plan}
                    currentStatus={org.subscriptionStatus}
                    currentNotes={org.adminNotes ?? ""}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
