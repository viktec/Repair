import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, tickets, ticketStatuses, customerContracts, supportPackages, supportInterventions } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, FileText, StickyNote, Headset, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { formatMinutes } from "@/lib/support-utils";
import { can } from "@/lib/permissions";
import { CustomerEditForm } from "./customer-edit-form";
import { DeleteCustomerButton } from "./delete-button";
import { CopyButton } from "./copy-button";

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

  // Contratto assistenza attivo
  const [activeContract] = await db
    .select({
      id: customerContracts.id,
      contractNumber: customerContracts.contractNumber,
      totalMinutes: customerContracts.totalMinutes,
      usedMinutes: customerContracts.usedMinutes,
      status: customerContracts.status,
      endDate: customerContracts.endDate,
      clientPortalToken: customerContracts.clientPortalToken,
      packageName: supportPackages.name,
    })
    .from(customerContracts)
    .leftJoin(supportPackages, eq(supportPackages.id, customerContracts.packageId))
    .where(and(eq(customerContracts.customerId, id), eq(customerContracts.organizationId, orgId), eq(customerContracts.status, "active")))
    .limit(1);

  const lastInterventions = activeContract
    ? await db
        .select({
          id: supportInterventions.id,
          title: supportInterventions.title,
          type: supportInterventions.type,
          billableMinutes: supportInterventions.billableMinutes,
          createdAt: supportInterventions.createdAt,
        })
        .from(supportInterventions)
        .where(eq(supportInterventions.contractId, activeContract.id))
        .orderBy(desc(supportInterventions.createdAt))
        .limit(5)
    : [];

  const appUrl = process.env.APP_URL ?? "https://app.my-repair.it";

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

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
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

        {/* Contratto Assistenza */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Headset className="h-4 w-4 text-muted-foreground" />
                Contratto Assistenza
              </CardTitle>
              {!activeContract && (
                <Link href={`/support/contracts/new?customerId=${id}`}>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Crea contratto
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {!activeContract ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">
                  Nessun contratto attivo per questo cliente.
                </p>
              ) : (() => {
                const remaining = activeContract.totalMinutes - activeContract.usedMinutes;
                const pct = activeContract.totalMinutes > 0
                  ? Math.max(0, (remaining / activeContract.totalMinutes) * 100)
                  : 0;
                const portalUrl = `${appUrl}/c/${activeContract.clientPortalToken}`;
                const TYPE_LABELS: Record<string, string> = {
                  onsite: "In sede", remote: "Remoto", phone: "Telefono",
                  email: "Email", lab: "Laboratorio", other: "Altro",
                };
                return (
                  <div className="space-y-4">
                    {/* Info contratto */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Pacchetto</p>
                        <p className="font-medium">{activeContract.packageName ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">N° contratto</p>
                        <p className="font-medium font-mono">{activeContract.contractNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Scadenza</p>
                        <p className="font-medium">{formatDate(activeContract.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ore residue</p>
                        <p className="font-medium">{formatMinutes(remaining)} / {formatMinutes(activeContract.totalMinutes)}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded-full bg-slate-200">
                        <div
                          className={`h-2 rounded-full transition-all ${pct < 10 ? "bg-red-500" : pct < 25 ? "bg-amber-400" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% delle ore ancora disponibili</p>
                    </div>
                    {/* Link portale + azioni */}
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/support/contracts/${activeContract.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          Vai al contratto →
                        </Button>
                      </Link>
                      <Link href={`/support/contracts/${activeContract.id}?newIntervention=1`}>
                        <Button size="sm" className="gap-1.5 text-xs">
                          <Plus className="h-3 w-3" />
                          Nuovo intervento
                        </Button>
                      </Link>
                      <CopyButton text={portalUrl} label="Copia link portale" />
                    </div>
                    {/* Ultimi 5 interventi */}
                    {lastInterventions.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ultimi interventi</p>
                        <div className="space-y-1">
                          {lastInterventions.map((iv) => (
                            <div key={iv.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-muted-foreground whitespace-nowrap">{formatDate(iv.createdAt)}</span>
                                <Badge variant="outline" className="text-[10px] shrink-0">{TYPE_LABELS[iv.type] ?? iv.type}</Badge>
                                <span className="truncate text-foreground">{iv.title}</span>
                              </div>
                              <span className="text-muted-foreground shrink-0 ml-2">{formatMinutes(iv.billableMinutes)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
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
