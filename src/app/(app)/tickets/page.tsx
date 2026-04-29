import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses } from "@/db/schema";
import { eq, and, isNull, ilike, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Ticket as TicketIcon, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ViewToggle } from "./view-toggle";
import { KanbanBoard } from "./kanban-board";
import { Suspense } from "react";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; status?: string; imei?: string; year?: string }>;
}) {
  const { view, q, status, imei, year } = await searchParams;
  const isKanban = view === "kanban";

  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [statuses, yearsResult] = await Promise.all([
    db
      .select({ id: ticketStatuses.id, name: ticketStatuses.name, color: ticketStatuses.color })
      .from(ticketStatuses)
      .where(eq(ticketStatuses.organizationId, orgId))
      .orderBy(ticketStatuses.sortOrder),
    db
      .selectDistinct({ year: sql<number>`extract(year from ${tickets.createdAt})::integer` })
      .from(tickets)
      .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)))
      .orderBy(sql`extract(year from ${tickets.createdAt}) desc`),
  ]);
  const availableYears = yearsResult.map((r) => r.year);

  // Build where conditions
  const conditions = [eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)];
  if (status) conditions.push(eq(tickets.statusId, status));
  if (imei) conditions.push(ilike(tickets.deviceImei, `%${imei}%`));
  if (year) conditions.push(sql`extract(year from ${tickets.createdAt})::integer = ${parseInt(year, 10)}`);
  if (q) {
    conditions.push(
      or(
        ilike(tickets.deviceBrand, `%${q}%`),
        ilike(tickets.deviceModel, `%${q}%`),
        ilike(tickets.faultDescription, `%${q}%`),
        ilike(tickets.deviceImei, `%${q}%`),
        ilike(customers.name, `%${q}%`),
        ilike(customers.phone, `%${q}%`),
      )!,
    );
  }

  const rows = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      faultDescription: tickets.faultDescription,
      createdAt: tickets.createdAt,
      customerName: customers.name,
      statusName: ticketStatuses.name,
      statusColor: ticketStatuses.color,
      statusId: tickets.statusId,
    })
    .from(tickets)
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(...conditions))
    .orderBy(tickets.ticketNumber);

  const isFiltered = !!(q || status || imei || year);

  function buildUrl(params: { view?: string; q?: string; status?: string; imei?: string; year?: string }) {
    const p = new URLSearchParams();
    if (params.view) p.set("view", params.view);
    if (params.q) p.set("q", params.q);
    if (params.status) p.set("status", params.status);
    if (params.imei) p.set("imei", params.imei);
    if (params.year) p.set("year", params.year);
    const s = p.toString();
    return s ? `/tickets?${s}` : "/tickets";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ticket</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {isFiltered ? "risultati" : "ticket totali"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Suspense>
            <ViewToggle current={isKanban ? "kanban" : "list"} />
          </Suspense>
          <a href={`/api/tickets/export${year ? `?year=${year}` : ""}`} download>
            <Button variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Esporta ZIP</span>
            </Button>
          </a>
          <Link href="/tickets/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">Nuovo ticket</span>
              <span className="xs:hidden">Nuovo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtro anno */}
      {availableYears.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <Link href={buildUrl({ view, q, status, imei, year: undefined })}>
            <span className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${!year ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              Tutti
            </span>
          </Link>
          {availableYears.map((y) => (
            <Link key={y} href={buildUrl({ view, q, status, imei, year: String(y) })}>
              <span className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${year === String(y) ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {y}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Filtri */}
      <form method="GET" className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {view && <input type="hidden" name="view" value={view} />}
        {year && <input type="hidden" name="year" value={year} />}
        <div className="relative flex-1 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cerca cliente, dispositivo, guasto, IMEI…"
            className="w-full rounded-md border border-input bg-white pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <select
            name="status"
            defaultValue={status ?? ""}
            className="flex-1 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Tutti gli stati</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">Filtra</Button>
          {isFiltered && (
            <Link href="/tickets">
              <Button type="button" variant="ghost" size="sm">Azzera</Button>
            </Link>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <TicketIcon className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">
              {isFiltered ? "Nessun risultato" : "Nessun ticket ancora"}
            </h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {isFiltered ? "Prova a modificare i filtri di ricerca." : "Crea il primo ticket per tracciare una riparazione."}
            </p>
            {!isFiltered && (
              <Link href="/tickets/new" className="mt-6">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crea ticket
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : isKanban ? (
        <KanbanBoard tickets={rows} statuses={statuses} />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="sm:hidden space-y-2">
            {rows.map((t) => (
              <Link key={t.id} href={`/tickets/${t.id}`}>
                <div className="rounded-lg border bg-white p-4 hover:bg-slate-50/50 active:bg-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-foreground">
                      #{String(t.ticketNumber).padStart(4, "0")}
                    </span>
                    {t.statusName && (
                      <Badge
                        style={t.statusColor ? {
                          backgroundColor: t.statusColor + "20",
                          color: t.statusColor,
                          borderColor: t.statusColor + "40",
                        } : undefined}
                        variant="outline"
                        className="text-xs font-medium shrink-0"
                      >
                        {t.statusName}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 font-medium text-foreground">
                    {[t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">{t.customerName ?? "—"}</p>
                  {t.faultDescription && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{t.faultDescription}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Dispositivo</th>
                  <th className="px-4 py-3">Guasto</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-medium text-foreground">
                      #{String(t.ticketNumber).padStart(4, "0")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.customerName ?? <span className="italic text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {[t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") || (
                        <span className="italic text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-muted-foreground">
                      <span className="line-clamp-1">{t.faultDescription}</span>
                    </td>
                    <td className="px-4 py-3">
                      {t.statusName ? (
                        <Badge
                          style={t.statusColor ? {
                            backgroundColor: t.statusColor + "20",
                            color: t.statusColor,
                            borderColor: t.statusColor + "40",
                          } : undefined}
                          variant="outline"
                          className="text-xs font-medium"
                        >
                          {t.statusName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/tickets/${t.id}`}>
                        <Button variant="outline" size="sm">Apri</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
