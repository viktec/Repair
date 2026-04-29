import { db } from "@/lib/db";
import { organizations, memberships, tickets } from "@/db/schema";
import { count, isNull, sql } from "drizzle-orm";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

export default async function AdminOrgsPage() {
  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      plan: organizations.plan,
      subscriptionStatus: organizations.subscriptionStatus,
      registrationStatus: organizations.registrationStatus,
      trialEndsAt: organizations.trialEndsAt,
      adminNotes: organizations.adminNotes,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .orderBy(
      // pending first, then approved, then rejected; within each group by createdAt desc
      sql`CASE registration_status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END`,
      organizations.createdAt,
    );

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

  const pendingCount = orgs.filter((o) => o.registrationStatus === "pending").length;

  const planColors: Record<string, string> = {
    solo: "bg-slate-100 text-slate-700",
    pro: "bg-blue-100 text-blue-700",
    business: "bg-purple-100 text-purple-700",
  };

  const subStatusColors: Record<string, string> = {
    trial: "bg-yellow-100 text-yellow-700",
    active: "bg-emerald-100 text-emerald-700",
    past_due: "bg-red-100 text-red-700",
    canceled: "bg-slate-100 text-slate-500",
  };

  const regStatusConfig: Record<string, { cls: string; label: string; Icon: React.ElementType }> = {
    pending:  { cls: "bg-amber-100 text-amber-700",     label: "In attesa",  Icon: Clock },
    approved: { cls: "bg-emerald-100 text-emerald-700", label: "Approvata",  Icon: CheckCircle2 },
    rejected: { cls: "bg-red-100 text-red-700",         label: "Rifiutata",  Icon: XCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizzazioni</h1>
          <p className="mt-1 text-sm text-muted-foreground">{orgs.length} tenant registrati</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
            <Clock className="h-4 w-4" />
            <span><strong>{pendingCount}</strong> {pendingCount === 1 ? "iscrizione in attesa" : "iscrizioni in attesa"}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Organizzazione</th>
              <th className="px-4 py-3">Accesso</th>
              <th className="px-4 py-3">Piano</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Utenti</th>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Registrato</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => {
              const reg = regStatusConfig[org.registrationStatus];
              return (
                <tr
                  key={org.id}
                  className={`border-b last:border-0 hover:bg-slate-50/50 ${org.registrationStatus === "pending" ? "bg-amber-50/30" : ""}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{org.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{org.slug}</p>
                    {org.adminNotes && (
                      <p className="mt-0.5 text-xs text-amber-600 italic">{org.adminNotes}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${reg.cls}`}>
                      <reg.Icon className="h-3 w-3" />
                      {reg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${planColors[org.plan]}`}>
                      {org.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${subStatusColors[org.subscriptionStatus]}`}>
                      {org.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{memberMap.get(org.id) ?? 0}</td>
                  <td className="px-4 py-3 text-center">{ticketMap.get(org.id) ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(org.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orgs/${org.id}`} className="text-xs text-primary hover:underline font-medium">
                      Gestisci →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Nessuna organizzazione registrata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
