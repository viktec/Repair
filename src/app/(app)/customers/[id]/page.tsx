import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, tickets, ticketStatuses } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, FileText, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { CustomerEditForm } from "./customer-edit-form";
import { DeleteCustomerButton } from "./delete-button";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;
  const role = session.user.role;

  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.organizationId, orgId)))
    .limit(1);

  if (!customer) notFound();

  const customerTickets = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      faultDescription: tickets.faultDescription,
      finalCost: tickets.finalCost,
      estimatedCost: tickets.estimatedCost,
      createdAt: tickets.createdAt,
      statusName: ticketStatuses.name,
      statusColor: ticketStatuses.color,
    })
    .from(tickets)
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(eq(tickets.customerId, id), eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)))
    .orderBy(desc(tickets.createdAt));

  const totalSpent = customerTickets.reduce((sum, t) => sum + (t.finalCost ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/customers">
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <ArrowLeft className="h-3.5 w-3.5" />
              Clienti
            </Button>
          </Link>
          <h1 className="text-xl font-bold truncate">{customer.name}</h1>
        </div>
        {can.delete(role) && <DeleteCustomerButton customerId={id} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Contatti</CardTitle></CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {customer.phone ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href={`tel:${customer.phone}`} className="hover:text-foreground transition-colors">{customer.phone}</a>
                </div>
              ) : null}
              {customer.email ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${customer.email}`} className="hover:text-foreground transition-colors truncate">{customer.email}</a>
                </div>
              ) : null}
              {!customer.phone && !customer.email && (
                <p className="text-muted-foreground italic text-xs">Nessun contatto registrato</p>
              )}
              {customer.gdprConsentAt && (
                <div className="flex items-center gap-2 text-emerald-600 border-t pt-2.5 mt-2.5">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="text-xs">Consenso GDPR — {formatDate(customer.gdprConsentAt)}</span>
                </div>
              )}
              {customer.notes && (
                <div className="flex items-start gap-2 text-muted-foreground border-t pt-2.5 mt-2.5">
                  <StickyNote className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{customerTickets.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Riparazioni</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSpent > 0 ? formatCurrency(totalSpent) : "—"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Spesa totale</p>
              </div>
            </CardContent>
          </Card>

          <CustomerEditForm customer={{ id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, notes: customer.notes }} />
        </div>

        {/* Storico riparazioni */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Storico riparazioni</CardTitle>
              {customerTickets.length > 0 && (
                <Link href={`/tickets?customer=${id}`}>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    Vedi con filtri →
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {customerTickets.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Nessuna riparazione registrata per questo cliente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3">N°</th>
                        <th className="px-4 py-3">Dispositivo</th>
                        <th className="px-4 py-3">Guasto</th>
                        <th className="px-4 py-3">Stato</th>
                        <th className="px-4 py-3 text-right">Importo</th>
                        <th className="px-4 py-3">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerTickets.map((t) => {
                        const device = [t.deviceBrand, t.deviceModel].filter(Boolean).join(" ");
                        const cost = t.finalCost ?? t.estimatedCost;
                        return (
                          <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <Link href={`/tickets/${t.id}`} className="font-mono text-xs font-bold text-primary hover:underline">
                                #{String(t.ticketNumber).padStart(4, "0")}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {device || <span className="italic text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate text-xs">
                              {t.faultDescription}
                            </td>
                            <td className="px-4 py-3">
                              {t.statusName ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={t.statusColor ? { color: t.statusColor, borderColor: `${t.statusColor}50` } : undefined}
                                >
                                  {t.statusName}
                                </Badge>
                              ) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium">
                              {cost != null ? (
                                <span className={t.finalCost == null ? "text-muted-foreground" : ""}>
                                  {formatCurrency(cost)}
                                </span>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                              {formatDate(t.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
