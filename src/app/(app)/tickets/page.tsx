import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function TicketsPage() {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

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
    })
    .from(tickets)
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)))
    .orderBy(tickets.ticketNumber);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ticket</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "ticket" : "ticket"} totali
          </p>
        </div>
        <Link href="/tickets/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo ticket
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <TicketIcon className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Nessun ticket ancora</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Crea il primo ticket per tracciare una riparazione.
            </p>
            <Link href="/tickets/new" className="mt-6">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crea ticket
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border bg-white">
          <table className="w-full text-sm">
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
                      <Button variant="outline" size="sm">
                        Apri
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
