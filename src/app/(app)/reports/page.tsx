import { db } from "@/lib/db";
import { requirePlan } from "@/lib/require-plan";
import { tickets, ticketStatuses, ticketParts } from "@/db/schema";
import { eq, and, isNull, gte, count, sum, avg, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ReportsTabs } from "./reports-tabs";
import type { MarginRow, FaultRow, AvgTimeRow, AvgTimeMonthRow, PeriodPoint } from "./charts";
import type { TechPerfRow } from "./reports-tabs";

type Period = "30d" | "90d" | "180d" | "365d";

function trunc(s: string | null | undefined, maxLen = 40): string {
  if (!s) return "Guasto non specificato";
  return s.length > maxLen ? s.slice(0, maxLen - 1) + "…" : s;
}

function periodStart(period: Period): Date {
  const d = new Date();
  switch (period) {
    case "90d":  d.setDate(d.getDate() - 90);  break;
    case "180d": d.setDate(d.getDate() - 180); break;
    case "365d": d.setDate(d.getDate() - 365); break;
    default:     d.setDate(d.getDate() - 30);  break;
  }
  return d;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await requirePlan("pro");
  if (!can.accessReports(session.user.role)) redirect("/dashboard");
  const orgId = session.user.organizationId!;

  const params = await searchParams;
  const validPeriods: Period[] = ["30d", "90d", "180d", "365d"];
  const period: Period = validPeriods.includes(params.period as Period)
    ? (params.period as Period)
    : "30d";

  const now = new Date();
  const since = periodStart(period);
  const currentYear = now.getFullYear();

  // ─── KPI riepilogo ────────────────────────────────────────────────────────
  const [totalTickets, recentTickets, avgCostRow] = await Promise.all([
    db.select({ c: count() }).from(tickets)
      .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)))
      .then((r) => Number(r[0].c)),

    db.select({ c: count() }).from(tickets)
      .where(and(
        eq(tickets.organizationId, orgId),
        isNull(tickets.deletedAt),
        gte(tickets.createdAt, since),
      ))
      .then((r) => Number(r[0].c)),

    db.select({ a: sql<number>`avg(coalesce(${tickets.finalCost}, ${tickets.estimatedCost}))` }).from(tickets)
      .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
      .where(and(
        eq(tickets.organizationId, orgId),
        isNull(tickets.deletedAt),
        isNull(tickets.quoteRejectedAt),
        eq(ticketStatuses.isFinal, true),
        sql`coalesce(${tickets.finalCost}, ${tickets.estimatedCost}) > 0`,
      ))
      .then((r) => Number(r[0].a ?? 0)),
  ]);

  // ─── Tab 1: Margini ricambi — top 10 nel periodo ──────────────────────────
  const marginsRaw = await db
    .select({
      name: ticketParts.description,
      qty: sql<number>`cast(sum(${ticketParts.quantity}) as int)`,
      totalCostCents: sql<number>`sum(${ticketParts.unitCostCents} * ${ticketParts.quantity})`,
      totalRevenueCents: sql<number>`sum(${ticketParts.unitSellCents} * ${ticketParts.quantity})`,
    })
    .from(ticketParts)
    .leftJoin(tickets, eq(tickets.id, ticketParts.ticketId))
    .where(and(
      eq(tickets.organizationId, orgId),
      isNull(tickets.deletedAt),
      gte(ticketParts.createdAt, since),
    ))
    .groupBy(ticketParts.description)
    .orderBy(sql`sum((${ticketParts.unitSellCents} - ${ticketParts.unitCostCents}) * ${ticketParts.quantity}) desc`)
    .limit(10);

  const margins: MarginRow[] = marginsRaw.map((r) => {
    const cost = Number(r.totalCostCents ?? 0);
    const rev = Number(r.totalRevenueCents ?? 0);
    const margin = rev - cost;
    const pct = cost > 0 ? (margin / cost) * 100 : 0;
    return {
      name: r.name,
      qty: Number(r.qty),
      totalCostCents: cost,
      totalRevenueCents: rev,
      marginCents: margin,
      marginPct: pct,
    };
  });

  // ─── Tab 2: Top guasti — top 10 nel periodo ───────────────────────────────
  const faultsRaw = await db
    .select({
      fault: tickets.faultDescription,
      c: count(),
    })
    .from(tickets)
    .where(and(
      eq(tickets.organizationId, orgId),
      isNull(tickets.deletedAt),
      gte(tickets.createdAt, since),
    ))
    .groupBy(tickets.faultDescription)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  const faults: FaultRow[] = faultsRaw.map((r) => ({
    fault: trunc(r.fault),
    count: Number(r.c),
  }));

  // ─── Tab 3: Tempo medio riparazione ───────────────────────────────────────
  const avgByBrandRaw = await db
    .select({
      brand: tickets.deviceBrand,
      avgDays: sql<number>`avg(extract(epoch from (coalesce(${tickets.deliveredAt}, ${tickets.updatedAt}) - ${tickets.createdAt})) / 86400)`,
    })
    .from(tickets)
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(
      eq(tickets.organizationId, orgId),
      isNull(tickets.deletedAt),
      eq(ticketStatuses.isFinal, true),
      gte(tickets.createdAt, since),
    ))
    .groupBy(tickets.deviceBrand)
    .orderBy(sql`avg(extract(epoch from (coalesce(${tickets.deliveredAt}, ${tickets.updatedAt}) - ${tickets.createdAt})) / 86400) desc`)
    .limit(10);

  const avgByBrand: AvgTimeRow[] = avgByBrandRaw.map((r) => ({
    label: r.brand ?? "Marca non specificata",
    avgDays: Math.round(Number(r.avgDays ?? 0) * 10) / 10,
  }));

  const avgByMonthRaw = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${tickets.createdAt}), 'Mon YY')`,
      avgDays: sql<number>`avg(extract(epoch from (coalesce(${tickets.deliveredAt}, ${tickets.updatedAt}) - ${tickets.createdAt})) / 86400)`,
    })
    .from(tickets)
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(
      eq(tickets.organizationId, orgId),
      isNull(tickets.deletedAt),
      eq(ticketStatuses.isFinal, true),
      sql`${tickets.createdAt} >= now() - interval '12 months'`,
    ))
    .groupBy(sql`date_trunc('month', ${tickets.createdAt})`)
    .orderBy(sql`date_trunc('month', ${tickets.createdAt})`);

  const avgByMonth: AvgTimeMonthRow[] = avgByMonthRaw.map((r) => ({
    month: r.month,
    avgDays: Math.round(Number(r.avgDays ?? 0) * 10) / 10,
  }));

  // ─── Tab 4: Confronto periodi (ultimi 3 anni, per mese) ───────────────────
  const periodRaw = await db
    .select({
      yr: sql<number>`extract(year from ${tickets.createdAt})`,
      mo: sql<number>`extract(month from ${tickets.createdAt})`,
      moLabel: sql<string>`to_char(date_trunc('month', ${tickets.createdAt}), 'Mon')`,
      revenue: sql<number>`coalesce(sum(coalesce(${tickets.finalCost}, ${tickets.estimatedCost})), 0)`,
    })
    .from(tickets)
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(
      eq(tickets.organizationId, orgId),
      isNull(tickets.deletedAt),
      isNull(tickets.quoteRejectedAt),
      eq(ticketStatuses.isFinal, true),
      sql`${tickets.createdAt} >= now() - interval '3 years'`,
    ))
    .groupBy(sql`extract(year from ${tickets.createdAt}), extract(month from ${tickets.createdAt}), date_trunc('month', ${tickets.createdAt})`)
    .orderBy(sql`extract(year from ${tickets.createdAt}), extract(month from ${tickets.createdAt})`);

  const monthMap = new Map<number, { label: string; curr: number; prev: number; twoPrev: number }>();
  for (const r of periodRaw) {
    const yr = Number(r.yr);
    const mo = Number(r.mo);
    const rev = Number(r.revenue);
    if (!monthMap.has(mo)) {
      monthMap.set(mo, { label: r.moLabel, curr: 0, prev: 0, twoPrev: 0 });
    }
    const entry = monthMap.get(mo)!;
    if (yr === currentYear) entry.curr = rev;
    else if (yr === currentYear - 1) entry.prev = rev;
    else if (yr === currentYear - 2) entry.twoPrev = rev;
  }

  const periodData: PeriodPoint[] = Array.from({ length: 12 }, (_, i) => i + 1)
    .filter((mo) => monthMap.has(mo))
    .map((mo) => {
      const e = monthMap.get(mo)!;
      return {
        month: e.label,
        currentYear: e.curr,
        prevYear: e.prev,
        twoPrevYear: e.twoPrev,
      };
    });

  const currMo = now.getMonth() + 1;
  const curr = monthMap.get(currMo);
  const yoyDelta = curr && curr.prev > 0
    ? Math.round(((curr.curr - curr.prev) / curr.prev) * 100)
    : null;

  // ─── Tab 5: Performance tecnici ───────────────────────────────────────────
  const techPerfRaw = await db
    .select({
      techName: tickets.assignedUserName,
      total: sql<number>`cast(count(*) as int)`,
      closed: sql<number>`cast(count(*) filter (where ${ticketStatuses.isFinal} = true) as int)`,
      avgDays: sql<number>`round(avg(extract(epoch from (coalesce(${tickets.deliveredAt}, ${tickets.updatedAt}) - ${tickets.createdAt})) / 86400) filter (where ${ticketStatuses.isFinal} = true), 1)`,
    })
    .from(tickets)
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(
      eq(tickets.organizationId, orgId),
      isNull(tickets.deletedAt),
      gte(tickets.createdAt, since),
    ))
    .groupBy(tickets.assignedUserName)
    .orderBy(sql`count(*) desc`);

  const techPerf: TechPerfRow[] = techPerfRaw.map((r) => ({
    techName: r.techName ?? "Non assegnato",
    total: Number(r.total),
    closed: Number(r.closed),
    avgDays: r.avgDays != null ? Number(r.avgDays) : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Report avanzati</h1>
        <p className="mt-1 text-sm text-muted-foreground">Analisi approfondita — piano Pro</p>
      </div>

      {/* KPI riepilogo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ticket totali</p>
            <p className="mt-1 text-3xl font-bold">{totalTickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Nel periodo selezionato</p>
            <p className="mt-1 text-3xl font-bold">{recentTickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Costo medio riparazione</p>
            <p className="mt-1 text-3xl font-bold">
              {avgCostRow > 0 ? formatCurrency(Math.round(avgCostRow)) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <ReportsTabs
        currentYear={currentYear}
        yoyDelta={yoyDelta}
        margins={margins}
        faults={faults}
        avgByBrand={avgByBrand}
        avgByMonth={avgByMonth}
        periodData={periodData}
        techPerf={techPerf}
        initialPeriod={period}
      />
    </div>
  );
}
