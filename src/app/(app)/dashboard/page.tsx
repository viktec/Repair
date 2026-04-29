import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  organizations, tickets, customers, ticketStatuses, inventoryItems,
} from "@/db/schema";
import { eq, and, isNull, count, sum, avg, sql, lte, gte, lt, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Ticket, Users, Package, TrendingUp, ArrowRight, Wrench,
  AlertTriangle, Euro, CheckCircle2, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "./revenue-chart";

function formatEur(cents: number | null) {
  if (!cents) return "€0";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/onboarding");
  const orgId = session.user.organizationId;

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org) redirect("/login");
  if (!org.onboardingCompletedAt) redirect("/onboarding");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    openTicketCount,
    closedThisMonth,
    newCustomersThisMonth,
    revenueThisMonth,
    revenueLastMonth,
    avgTicketValue,
    lowStockItems,
    revenueByMonth,
    statusBreakdown,
  ] = await Promise.all([
    // Ticket aperti (stati non finali)
    db.select({ c: count() }).from(tickets)
      .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
      .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt), eq(ticketStatuses.isFinal, false)))
      .then((r) => r[0].c),

    // Ticket chiusi questo mese
    db.select({ c: count() }).from(tickets)
      .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
      .where(and(
        eq(tickets.organizationId, orgId),
        isNull(tickets.deletedAt),
        eq(ticketStatuses.isFinal, true),
        gte(tickets.updatedAt, startOfMonth),
      ))
      .then((r) => r[0].c),

    // Nuovi clienti questo mese
    db.select({ c: count() }).from(customers)
      .where(and(eq(customers.organizationId, orgId), gte(customers.createdAt, startOfMonth)))
      .then((r) => r[0].c),

    // Fatturato mese corrente
    db.select({ total: sum(tickets.finalCost) }).from(tickets)
      .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
      .where(and(
        eq(tickets.organizationId, orgId),
        isNull(tickets.deletedAt),
        eq(ticketStatuses.isFinal, true),
        gte(tickets.updatedAt, startOfMonth),
      ))
      .then((r) => Number(r[0].total ?? 0)),

    // Fatturato mese scorso (per confronto)
    db.select({ total: sum(tickets.finalCost) }).from(tickets)
      .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
      .where(and(
        eq(tickets.organizationId, orgId),
        isNull(tickets.deletedAt),
        eq(ticketStatuses.isFinal, true),
        gte(tickets.updatedAt, startOfLastMonth),
        lt(tickets.updatedAt, startOfMonth),
      ))
      .then((r) => Number(r[0].total ?? 0)),

    // Valore medio ticket (con finalCost)
    db.select({ avg: avg(tickets.finalCost) }).from(tickets)
      .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt), gt(tickets.finalCost, 0)))
      .then((r) => Number(r[0].avg ?? 0)),

    // Prodotti sotto scorta minima
    db.select({ id: inventoryItems.id, name: inventoryItems.name, quantity: inventoryItems.quantity, minQuantity: inventoryItems.minQuantity })
      .from(inventoryItems)
      .where(and(
        eq(inventoryItems.organizationId, orgId),
        isNull(inventoryItems.deletedAt),
        sql`${inventoryItems.quantity} <= ${inventoryItems.minQuantity}`,
      ))
      .limit(5),

    // Andamento fatturato ultimi 6 mesi
    db.select({
      month: sql<string>`to_char(date_trunc('month', ${tickets.createdAt}), 'Mon')`,
      revenue: sql<number>`coalesce(sum(${tickets.finalCost}), 0)`,
      count: count(),
    })
      .from(tickets)
      .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
      .where(and(
        eq(tickets.organizationId, orgId),
        isNull(tickets.deletedAt),
        sql`${tickets.createdAt} >= now() - interval '6 months'`,
      ))
      .groupBy(sql`date_trunc('month', ${tickets.createdAt})`)
      .orderBy(sql`date_trunc('month', ${tickets.createdAt})`),

    // Ticket per stato
    db.select({ statusName: ticketStatuses.name, statusColor: ticketStatuses.color, c: count() })
      .from(tickets)
      .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
      .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt), eq(ticketStatuses.isFinal, false)))
      .groupBy(ticketStatuses.name, ticketStatuses.color)
      .orderBy(sql`count(*) desc`)
      .limit(6),
  ]);

  const revenueDelta = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : null;

  const kpis = [
    {
      label: "Fatturato mese",
      value: formatEur(revenueThisMonth),
      sub: revenueDelta !== null ? `${revenueDelta >= 0 ? "+" : ""}${revenueDelta}% vs mese scorso` : "Primo mese",
      icon: Euro,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Ticket aperti",
      value: String(openTicketCount),
      sub: `${closedThisMonth} chiusi questo mese`,
      icon: Ticket,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Valore medio",
      value: formatEur(Math.round(avgTicketValue)),
      sub: "Per riparazione completata",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Nuovi clienti",
      value: String(newCustomersThisMonth),
      sub: "Questo mese",
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Ciao, {session.user.name?.split(" ")[0] ?? "benvenuto"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dashboard di {org.name}
          </p>
        </div>
        <Link href="/tickets/new">
          <Button className="gap-2" size="sm">
            <Ticket className="h-4 w-4" />
            Nuovo ticket
          </Button>
        </Link>
      </div>

      {/* Trial banner */}
      {org.subscriptionStatus === "trial" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Clock className="h-4 w-4" />
            <span>Sei in periodo di prova — nessuna carta richiesta.</span>
          </div>
          <Badge variant="outline" className="border-amber-400 text-amber-700 text-xs">Trial</Badge>
        </div>
      )}

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
                  <p className="mt-1 text-2xl font-bold">{k.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{k.sub}</p>
                </div>
                <div className={`rounded-lg p-2 ${k.bg}`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Grafico fatturato */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Andamento fatturato — ultimi 6 mesi</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueByMonth.map((r) => ({
              month: r.month,
              revenue: Number(r.revenue),
              count: Number(r.count),
            }))} />
          </CardContent>
        </Card>

        {/* Ticket per stato */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket aperti per stato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statusBreakdown.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nessun ticket aperto</p>
            ) : (
              statusBreakdown.map((s) => (
                <div key={s.statusName} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.statusColor ?? "#6B7280" }} />
                    <span className="truncate text-sm">{s.statusName ?? "—"}</span>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{s.c}</span>
                </div>
              ))
            )}
            <div className="pt-2">
              <Link href="/tickets" className="text-xs text-primary hover:underline">
                Vedi tutti i ticket →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert scorte */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-medium text-amber-700">
                  Scorte critiche ({lowStockItems.length} prodotti)
                </CardTitle>
              </div>
              <Link href="/inventory?low=1" className="text-xs text-primary hover:underline">
                Vedi tutto →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.quantity === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.quantity === 0 ? "Esaurito" : `${item.quantity} / min ${item.minQuantity}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Azioni rapide */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/tickets/new", icon: Ticket, label: "Nuovo ticket", desc: "Apri una nuova riparazione" },
          { href: "/inventory", icon: Package, label: "Magazzino", desc: "Gestisci scorte e ricambi" },
          { href: "/customers", icon: Users, label: "Clienti", desc: "Anagrafica e storico" },
        ].map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 pt-4 pb-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
