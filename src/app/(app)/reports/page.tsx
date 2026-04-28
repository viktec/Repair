import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, ticketStatuses, posTransactions } from "@/db/schema";
import { eq, and, isNull, gte, count, sum, avg } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [ticketStats] = await db
    .select({ total: count(), avgCost: avg(tickets.finalCost) })
    .from(tickets)
    .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)));

  const [recentTickets] = await db
    .select({ total: count() })
    .from(tickets)
    .where(and(
      eq(tickets.organizationId, orgId),
      isNull(tickets.deletedAt),
      gte(tickets.createdAt, thirtyDaysAgo),
    ));

  const [posStats] = await db
    .select({ total: sum(posTransactions.totalCents), qty: count() })
    .from(posTransactions)
    .where(and(
      eq(posTransactions.organizationId, orgId),
      eq(posTransactions.status, "completed"),
    ));

  const statusBreakdown = await db
    .select({
      statusName: ticketStatuses.name,
      statusColor: ticketStatuses.color,
      total: count(),
    })
    .from(tickets)
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)))
    .groupBy(ticketStatuses.name, ticketStatuses.color)
    .orderBy(ticketStatuses.name);

  const totalTickets = Number(ticketStats?.total ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">Panoramica dell&apos;attività del tuo centro</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ticket totali</p>
            <p className="mt-1 text-3xl font-bold">{totalTickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ultimi 30 giorni</p>
            <p className="mt-1 text-3xl font-bold">{recentTickets?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Costo medio riparazione</p>
            <p className="mt-1 text-3xl font-bold">
              {ticketStats?.avgCost != null ? formatCurrency(Math.round(Number(ticketStats.avgCost))) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Incassi POS totali</p>
            <p className="mt-1 text-3xl font-bold">{formatCurrency(Number(posStats?.total ?? 0))}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Ticket per stato</CardTitle></CardHeader>
        <CardContent>
          {statusBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nessun dato disponibile.</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((s) => {
                const pct = totalTickets > 0 ? Math.round((Number(s.total) / totalTickets) * 100) : 0;
                return (
                  <div key={s.statusName ?? "none"}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.statusColor ?? "#94a3b8" }} />
                        <span className="font-medium">{s.statusName ?? "Senza stato"}</span>
                      </div>
                      <span className="text-muted-foreground">{s.total} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: s.statusColor ?? "#94a3b8" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
