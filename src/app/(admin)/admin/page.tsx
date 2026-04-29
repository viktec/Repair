import { db } from "@/lib/db";
import { organizations, users, tickets } from "@/db/schema";
import { count, isNull, eq } from "drizzle-orm";
import Link from "next/link";
import { Building2, Users, Ticket, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [orgCount, userCount, ticketCount] = await Promise.all([
    db.select({ total: count() }).from(organizations).then((r) => r[0].total),
    db.select({ total: count() }).from(users).then((r) => r[0].total),
    db
      .select({ total: count() })
      .from(tickets)
      .where(isNull(tickets.deletedAt))
      .then((r) => r[0].total),
  ]);

  const planBreakdown = await db
    .select({ plan: organizations.plan, total: count() })
    .from(organizations)
    .groupBy(organizations.plan);

  const statusBreakdown = await db
    .select({ status: organizations.subscriptionStatus, total: count() })
    .from(organizations)
    .groupBy(organizations.subscriptionStatus);

  const recentOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      plan: organizations.plan,
      subscriptionStatus: organizations.subscriptionStatus,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .orderBy(organizations.createdAt)
    .limit(10);

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
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Panoramica di tutti i tenant</p>
      </div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Organizzazioni</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{orgCount}</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              {planBreakdown.map((p) => (
                <span key={p.plan} className={`rounded-full px-2 py-0.5 text-xs font-medium ${planColors[p.plan]}`}>
                  {p.plan.toUpperCase()} ×{p.total}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utenti</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{userCount}</p>
            <div className="mt-2 flex gap-2 flex-wrap">
              {statusBreakdown.map((s) => (
                <span key={s.status} className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[s.status]}`}>
                  {s.status} ×{s.total}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket totali</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{ticketCount}</p>
            <p className="mt-2 text-xs text-muted-foreground">Su tutti i tenant attivi</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent orgs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Organizzazioni recenti</h2>
          <Link href="/admin/orgs" className="text-sm text-primary hover:underline">
            Vedi tutte →
          </Link>
        </div>
        <div className="rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Piano</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3">Registrato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {recentOrgs.map((org) => (
                <tr key={org.id} className="border-b last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium">{org.name}</td>
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
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(org.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orgs/${org.id}`} className="text-xs text-primary hover:underline">
                      Gestisci →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
