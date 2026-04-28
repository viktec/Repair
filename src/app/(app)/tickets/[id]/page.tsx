import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses, organizations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatCurrency } from "@/lib/utils";
import { TicketActions } from "./actions-client";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [ticket] = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      deviceImei: tickets.deviceImei,
      deviceSerial: tickets.deviceSerial,
      devicePatternLock: tickets.devicePatternLock,
      accessories: tickets.accessories,
      deviceCondition: tickets.deviceCondition,
      faultDescription: tickets.faultDescription,
      internalNotes: tickets.internalNotes,
      estimatedCost: tickets.estimatedCost,
      finalCost: tickets.finalCost,
      qrToken: tickets.qrToken,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerEmail: customers.email,
      statusId: ticketStatuses.id,
      statusName: ticketStatuses.name,
      statusColor: ticketStatuses.color,
    })
    .from(tickets)
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(eq(tickets.id, id), eq(tickets.organizationId, orgId)))
    .limit(1);

  if (!ticket) notFound();

  const allStatuses = await db
    .select({ id: ticketStatuses.id, name: ticketStatuses.name, color: ticketStatuses.color })
    .from(ticketStatuses)
    .where(eq(ticketStatuses.organizationId, orgId))
    .orderBy(ticketStatuses.sortOrder);

  const [org] = await db
    .select({ phone: organizations.phone })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const trackingUrl = `${process.env.TRACKING_URL ?? "https://t.my-repair.it"}/${ticket.qrToken}`;

  const whatsappTemplate = [
    `Salve${ticket.customerName ? ` ${ticket.customerName.split(" ")[0]}` : ""}!`,
    `Il suo ${[ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || "dispositivo"} è ora in stato: *${ticket.statusName ?? "—"}*.`,
    `Può seguire l'avanzamento qui: ${trackingUrl}`,
    org?.phone ? `Per info: ${org.phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const waLink = `https://wa.me/${ticket.customerPhone?.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappTemplate)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tickets">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Ticket
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Ticket #{String(ticket.ticketNumber).padStart(4, "0")}
            </h1>
            <p className="text-sm text-muted-foreground">
              Creato il {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>
        {ticket.statusName && (
          <Badge
            style={ticket.statusColor ? {
              backgroundColor: ticket.statusColor + "20",
              color: ticket.statusColor,
              borderColor: ticket.statusColor + "40",
            } : undefined}
            variant="outline"
            className="text-sm font-medium"
          >
            {ticket.statusName}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Colonna principale */}
        <div className="space-y-4 lg:col-span-2">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {ticket.customerName ? (
                <>
                  <p className="font-medium text-foreground">{ticket.customerName}</p>
                  {ticket.customerPhone && <p className="text-muted-foreground">{ticket.customerPhone}</p>}
                  {ticket.customerEmail && <p className="text-muted-foreground">{ticket.customerEmail}</p>}
                </>
              ) : (
                <p className="italic text-muted-foreground">Nessun cliente associato</p>
              )}
            </CardContent>
          </Card>

          {/* Dispositivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Dispositivo</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <InfoRow label="Marca" value={ticket.deviceBrand} />
                <InfoRow label="Modello" value={ticket.deviceModel} />
                <InfoRow label="IMEI" value={ticket.deviceImei} />
                <InfoRow label="Seriale" value={ticket.deviceSerial} />
                <InfoRow label="PIN / Pattern" value={ticket.devicePatternLock} />
                <InfoRow label="Accessori" value={ticket.accessories} />
                <div className="col-span-2">
                  <InfoRow label="Condizioni estetiche" value={ticket.deviceCondition} />
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Guasto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Guasto e intervento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrizione guasto</p>
                <p className="mt-1 text-foreground">{ticket.faultDescription}</p>
              </div>
              <Separator />
              <div className="flex gap-8">
                {ticket.estimatedCost != null && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preventivo</p>
                    <p className="mt-1 font-medium">{formatCurrency(ticket.estimatedCost)}</p>
                  </div>
                )}
                {ticket.finalCost != null && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Costo finale</p>
                    <p className="mt-1 font-medium">{formatCurrency(ticket.finalCost)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonna laterale */}
        <div className="space-y-4">
          <TicketActions
            ticketId={ticket.id}
            currentStatusId={ticket.statusId ?? null}
            statuses={allStatuses}
            internalNotes={ticket.internalNotes ?? ""}
            trackingUrl={trackingUrl}
            whatsappTemplate={whatsappTemplate}
            waLink={ticket.customerPhone ? waLink : null}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}
