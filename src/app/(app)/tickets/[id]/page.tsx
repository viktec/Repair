import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses, organizations, ticketPhotos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatCurrency } from "@/lib/utils";
import { TicketActions } from "./actions-client";
import { PhotoUpload } from "./photo-upload";
import { getPublicUrl, getPresignedDownloadUrl } from "@/lib/storage";
import { ensureDefaultStatuses } from "@/lib/seed-statuses";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  await ensureDefaultStatuses(orgId);

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
      quoteAcceptedAt: tickets.quoteAcceptedAt,
      quoteRejectedAt: tickets.quoteRejectedAt,
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
    .select({
      name: organizations.name,
      phone: organizations.phone,
      whatsappTemplate: organizations.whatsappTemplate,
      googleReviewUrl: organizations.googleReviewUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const rawPhotos = await db
    .select()
    .from(ticketPhotos)
    .where(eq(ticketPhotos.ticketId, id));

  const photosWithUrls = await Promise.all(
    rawPhotos.map(async (p) => ({
      ...p,
      url: p.isPublic
        ? getPublicUrl(p.storageKey)
        : await getPresignedDownloadUrl(p.storageKey),
    })),
  );

  const displayPhotos = photosWithUrls.filter((p) => p.photoType !== "signature");
  const signaturePhoto = photosWithUrls.find((p) => p.photoType === "signature");
  const signatureUrl = signaturePhoto?.url ?? null;

  const trackingUrl = `${process.env.TRACKING_URL ?? "https://t.my-repair.it"}/${ticket.qrToken}`;
  const printUrl = `/print/tickets/${ticket.id}`;

  const firstName = ticket.customerName?.split(" ")[0] ?? "cliente";
  const device = [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || "dispositivo";
  const num = String(ticket.ticketNumber).padStart(4, "0");
  const estimatedStr = ticket.estimatedCost != null
    ? new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(ticket.estimatedCost / 100)
    : "";

  const orgName = org?.name ?? "il nostro centro";
  const googleLink = org?.googleReviewUrl ?? "";

  function fillTemplate(tpl: string) {
    return tpl
      .replace(/\{\{nome\}\}/g, firstName)
      .replace(/\{\{dispositivo\}\}/g, device)
      .replace(/\{\{stato\}\}/g, ticket.statusName ?? "—")
      .replace(/\{\{link_tracking\}\}/g, trackingUrl)
      .replace(/\{\{numero_ticket\}\}/g, num)
      .replace(/\{\{preventivo\}\}/g, estimatedStr)
      .replace(/\{\{nome_negozio\}\}/g, orgName)
      .replace(/\{\{link_google\}\}/g, googleLink);
  }

  const waTemplates = [
    {
      label: "Aggiornamento stato",
      text: fillTemplate(org?.whatsappTemplate ??
        `Salve {{nome}}!\nIl suo {{dispositivo}} (ticket #{{numero_ticket}}) è ora in stato: *{{stato}}*.\nSegua l'avanzamento qui: {{link_tracking}}\n\n— {{nome_negozio}}`),
    },
    {
      label: "Preventivo",
      text: fillTemplate(
        `Salve {{nome}}, da {{nome_negozio}} abbiamo completato la diagnosi del suo {{dispositivo}}.\n\n*Preventivo: {{preventivo}}*\n\nPuò accettare e seguire il ticket qui: {{link_tracking}}\n\nCi faccia sapere se procedere. Grazie!`),
    },
    {
      label: "Pronto per ritiro",
      text: fillTemplate(
        `Buone notizie {{nome}}! 🎉\nDa {{nome_negozio}}: il suo {{dispositivo}} è *pronto per il ritiro*. ✅\n\nPuò passare quando preferisce.\nDettagli ticket: {{link_tracking}}\n\nGrazie per averci scelto!`),
    },
    {
      label: "Richiedere recensione",
      text: fillTemplate(
        googleLink
          ? `Salve {{nome}}, grazie per aver scelto {{nome_negozio}}! 😊\nSperiamo sia soddisfatto della riparazione del suo {{dispositivo}}.\n\nSe ha un momento, ci farebbe un enorme favore:\n⭐ Lasci una recensione su Google: {{link_google}}\n\nGrazie di cuore! — {{nome_negozio}}`
          : `Salve {{nome}}, grazie per aver scelto {{nome_negozio}}! 😊\nSperiamo sia soddisfatto della riparazione del suo {{dispositivo}}.\n\nSe ha un momento, ci farebbe un grande favore lasciando una recensione su Google.\n\nGrazie di cuore! — {{nome_negozio}}`),
    },
  ];

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
              <div className="flex gap-8 flex-wrap">
                {ticket.estimatedCost != null && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preventivo</p>
                    <p className="mt-1 font-medium">{formatCurrency(ticket.estimatedCost)}</p>
                    {ticket.quoteAcceptedAt && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        ✅ Accettato dal cliente
                      </span>
                    )}
                    {ticket.quoteRejectedAt && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        ❌ Rifiutato dal cliente
                      </span>
                    )}
                    {!ticket.quoteAcceptedAt && !ticket.quoteRejectedAt && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        ⏳ In attesa risposta
                      </span>
                    )}
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
            waTemplates={waTemplates}
            customerPhone={ticket.customerPhone ?? null}
            printUrl={printUrl}
            hasCustomerEmail={!!ticket.customerEmail}
          />
          <PhotoUpload ticketId={ticket.id} initialPhotos={displayPhotos} />
          <SignatureReadOnly signatureUrl={signatureUrl} />
        </div>
      </div>
    </div>
  );
}

function SignatureReadOnly({ signatureUrl }: { signatureUrl: string | null }) {
  return (
    <div className="rounded-lg border bg-white p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Firma cliente</span>
        {signatureUrl && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Firmato
          </span>
        )}
      </div>
      {signatureUrl ? (
        <img src={signatureUrl} alt="Firma cliente" className="w-full rounded-lg border bg-slate-50 object-contain" style={{ maxHeight: 120 }} />
      ) : (
        <p className="text-xs text-muted-foreground italic">Nessuna firma raccolta — la firma viene acquisita durante la creazione del ticket.</p>
      )}
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
