import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses } from "@/db/schema";
import { eq, and, isNull, ilike } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function ImeiSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ imei?: string }>;
}) {
  const { imei } = await searchParams;
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const rows = imei
    ? await db
        .select({
          id: tickets.id,
          ticketNumber: tickets.ticketNumber,
          deviceBrand: tickets.deviceBrand,
          deviceModel: tickets.deviceModel,
          deviceImei: tickets.deviceImei,
          faultDescription: tickets.faultDescription,
          createdAt: tickets.createdAt,
          customerName: customers.name,
          customerPhone: customers.phone,
          statusName: ticketStatuses.name,
          statusColor: ticketStatuses.color,
        })
        .from(tickets)
        .leftJoin(customers, eq(customers.id, tickets.customerId))
        .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
        .where(
          and(
            eq(tickets.organizationId, orgId),
            isNull(tickets.deletedAt),
            ilike(tickets.deviceImei, `%${imei}%`),
          ),
        )
        .orderBy(tickets.createdAt)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Storico IMEI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cerca tutte le riparazioni associate a un numero IMEI.
        </p>
      </div>

      <form method="GET" className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            name="imei"
            defaultValue={imei ?? ""}
            placeholder="Inserisci IMEI o seriale..."
            className="w-full rounded-md border border-input bg-white pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </div>
        <Button type="submit">Cerca</Button>
        {imei && (
          <Link href="/imei">
            <Button type="button" variant="outline">Azzera</Button>
          </Link>
        )}
      </form>

      {imei && rows.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed bg-white py-16 text-center">
          <Smartphone className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold">Nessuna riparazione trovata</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nessun ticket associato all&apos;IMEI <span className="font-mono">{imei}</span>
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "riparazione trovata" : "riparazioni trovate"} per IMEI{" "}
            <span className="font-mono font-medium text-foreground">{imei}</span>
          </p>
          <div className="rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">IMEI</th>
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
                    <td className="px-4 py-3 font-mono font-medium">
                      #{String(t.ticketNumber).padStart(4, "0")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.deviceImei}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{t.customerName ?? "—"}</div>
                      {t.customerPhone && <div className="text-xs">{t.customerPhone}</div>}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {[t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="max-w-[180px] px-4 py-3 text-muted-foreground">
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
                          className="text-xs"
                        >
                          {t.statusName}
                        </Badge>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
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
        </div>
      )}

      {!imei && (
        <div className="flex flex-col items-center rounded-xl border border-dashed bg-white py-20 text-center">
          <Smartphone className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold">Ricerca per IMEI</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Inserisci un numero IMEI o seriale per trovare tutte le riparazioni associate a quel dispositivo.
          </p>
        </div>
      )}
    </div>
  );
}
