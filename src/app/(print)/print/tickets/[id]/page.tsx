import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses, organizations, ticketPhotos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getPublicUrl, getPresignedDownloadUrl } from "@/lib/storage";
import { PrintButton } from "./print-button";

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const { id } = await params;
  const { format } = await searchParams;
  const isThermal = format === "thermal";

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
      createdAt: tickets.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerEmail: customers.email,
      statusName: ticketStatuses.name,
    })
    .from(tickets)
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(eq(tickets.id, id), eq(tickets.organizationId, orgId)))
    .limit(1);

  if (!ticket) notFound();

  const [org] = await db
    .select({
      name: organizations.name,
      phone: organizations.phone,
      address: organizations.address,
      city: organizations.city,
      brandingPrimaryColor: organizations.brandingPrimaryColor,
      brandingLogoUrl: organizations.brandingLogoUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const rawPhotos = await db
    .select()
    .from(ticketPhotos)
    .where(eq(ticketPhotos.ticketId, id));

  const signaturePhoto = rawPhotos.find((p) => p.photoType === "signature");
  const signatureUrl = signaturePhoto
    ? signaturePhoto.isPublic
      ? getPublicUrl(signaturePhoto.storageKey)
      : await getPresignedDownloadUrl(signaturePhoto.storageKey)
    : null;

  const primary = org?.brandingPrimaryColor ?? "#0D8F7A";
  const device = [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || "—";
  const ticketNum = `#${String(ticket.ticketNumber).padStart(4, "0")}`;

  if (isThermal) {
    return (
      <>
        <style>{`
          @page { size: 58mm auto; margin: 4mm; }
          body { font-family: monospace; font-size: 11px; }
        `}</style>
        <div className="print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-white px-4 py-2 shadow-sm text-sm">
          <a href={`/tickets/${id}`} className="text-muted-foreground hover:underline">← Torna</a>
          <PrintButton label="Stampa termica" />
        </div>
        <div style={{ width: "58mm", padding: "4mm", fontFamily: "monospace", fontSize: 11, marginTop: 44 }} className="print:mt-0">
          <p style={{ textAlign: "center", fontWeight: "bold", fontSize: 13 }}>{org?.name ?? "Centro Riparazioni"}</p>
          {org?.phone && <p style={{ textAlign: "center" }}>{org.phone}</p>}
          {(org?.address || org?.city) && (
            <p style={{ textAlign: "center", fontSize: 10 }}>{[org.address, org.city].filter(Boolean).join(", ")}</p>
          )}
          <p style={{ textAlign: "center", borderTop: "1px dashed #000", borderBottom: "1px dashed #000", margin: "4px 0", padding: "2px 0", fontWeight: "bold" }}>
            RICEVUTA RIPARAZIONE {ticketNum}
          </p>
          <p style={{ fontSize: 10 }}>{formatDate(ticket.createdAt)}</p>
          {ticket.statusName && <p><strong>Stato:</strong> {ticket.statusName}</p>}
          <p style={{ borderTop: "1px dashed #000", marginTop: 4, paddingTop: 4 }}>
            <strong>Cliente:</strong> {ticket.customerName ?? "—"}
          </p>
          {ticket.customerPhone && <p>{ticket.customerPhone}</p>}
          <p style={{ borderTop: "1px dashed #000", marginTop: 4, paddingTop: 4 }}>
            <strong>Dispositivo:</strong> {device}
          </p>
          {ticket.deviceImei && <p>IMEI: {ticket.deviceImei}</p>}
          {ticket.deviceSerial && <p>S/N: {ticket.deviceSerial}</p>}
          <p style={{ borderTop: "1px dashed #000", marginTop: 4, paddingTop: 4 }}>
            <strong>Problema:</strong>
          </p>
          <p style={{ fontSize: 10 }}>{ticket.faultDescription}</p>
          {ticket.estimatedCost != null && (
            <p style={{ borderTop: "1px dashed #000", marginTop: 4, paddingTop: 4 }}>
              <strong>Preventivo: {formatCurrency(ticket.estimatedCost)}</strong>
            </p>
          )}
          {ticket.finalCost != null && (
            <p><strong>Importo finale: {formatCurrency(ticket.finalCost)}</strong></p>
          )}
          {signatureUrl && (
            <div style={{ borderTop: "1px dashed #000", marginTop: 4, paddingTop: 4 }}>
              <p><strong>Firma cliente:</strong></p>
              <img src={signatureUrl} alt="Firma" style={{ width: "100%", maxHeight: 40, objectFit: "contain" }} />
            </div>
          )}
          {!signatureUrl && (
            <div style={{ borderTop: "1px dashed #000", marginTop: 8, paddingTop: 8 }}>
              <p>Firma cliente: _______________</p>
              <p style={{ marginTop: 8 }}>Firma tecnico: _______________</p>
            </div>
          )}
          <p style={{ borderTop: "1px dashed #000", marginTop: 8, paddingTop: 4, textAlign: "center", fontSize: 9 }}>
            my-repair.it — Conservare come prova di consegna
          </p>
        </div>
      </>
    );
  }

  // Formato A4
  return (
    <>
      <style>{`@page { size: A4; margin: 15mm; }`}</style>
      {/* Barra azioni — solo a schermo */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <a href={`/tickets/${id}`} className="text-sm text-muted-foreground hover:underline">
            ← Torna al ticket
          </a>
          <a href={`/print/tickets/${id}?format=thermal`} className="text-sm text-primary hover:underline">
            Formato termico (58mm)
          </a>
        </div>
        <PrintButton label="Stampa / Salva PDF" />
      </div>

      {/* Ricevuta A4 */}
      <div className="mx-auto max-w-2xl bg-white px-10 py-8 print:px-0 print:py-0 print:max-w-none mt-14 print:mt-0">

        <div className="flex items-start justify-between pb-5 border-b" style={{ borderColor: primary + "40" }}>
          <div className="flex items-center gap-3">
            {org?.brandingLogoUrl ? (
              <img src={org.brandingLogoUrl} alt={org.name} className="h-10 w-auto object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: primary }}>
                <span className="text-white font-bold text-lg">R</span>
              </div>
            )}
            <div>
              <p className="font-bold text-lg">{org?.name ?? "Centro Riparazioni"}</p>
              {org?.phone && <p className="text-sm text-muted-foreground">{org.phone}</p>}
              {(org?.address || org?.city) && (
                <p className="text-sm text-muted-foreground">{[org.address, org.city].filter(Boolean).join(", ")}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: primary }}>{ticketNum}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Ricevuta di riparazione</p>
            <p className="text-sm text-muted-foreground">{formatDate(ticket.createdAt)}</p>
          </div>
        </div>

        {ticket.statusName && (
          <div className="mt-4 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white" style={{ backgroundColor: primary }}>
            {ticket.statusName}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Cliente</p>
            <p className="font-semibold">{ticket.customerName ?? "—"}</p>
            {ticket.customerPhone && <p className="text-sm text-muted-foreground">{ticket.customerPhone}</p>}
            {ticket.customerEmail && <p className="text-sm text-muted-foreground">{ticket.customerEmail}</p>}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Dispositivo</p>
            <p className="font-semibold">{device}</p>
            {ticket.deviceImei && <p className="text-sm text-muted-foreground">IMEI: {ticket.deviceImei}</p>}
            {ticket.deviceSerial && <p className="text-sm text-muted-foreground">S/N: {ticket.deviceSerial}</p>}
            {ticket.accessories && <p className="text-sm text-muted-foreground">Accessori: {ticket.accessories}</p>}
            {ticket.deviceCondition && <p className="text-sm text-muted-foreground">Condizioni: {ticket.deviceCondition}</p>}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Problema segnalato dal cliente</p>
          <p className="text-sm rounded-lg bg-slate-50 p-3 border">{ticket.faultDescription}</p>
        </div>

        {(ticket.estimatedCost != null || ticket.finalCost != null) && (
          <div className="mt-5 rounded-lg border p-4 bg-slate-50">
            <div className="flex gap-8">
              {ticket.estimatedCost != null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Preventivo</p>
                  <p className="text-lg font-bold">{formatCurrency(ticket.estimatedCost)}</p>
                </div>
              )}
              {ticket.finalCost != null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Importo finale</p>
                  <p className="text-lg font-bold">{formatCurrency(ticket.finalCost)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {signatureUrl ? (
          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Firma cliente</p>
            <div className="rounded-lg border bg-slate-50 p-2 inline-block">
              <img src={signatureUrl} alt="Firma" className="h-20 w-auto object-contain" />
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Firma cliente</p>
              <div className="mt-6 border-b border-slate-300" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Firma tecnico</p>
              <div className="mt-6 border-b border-slate-300" />
            </div>
          </div>
        )}

        {ticket.internalNotes && (
          <div className="mt-5 print:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Note interne</p>
            <p className="text-sm">{ticket.internalNotes}</p>
          </div>
        )}

        <div className="mt-10 pt-4 border-t text-center text-xs text-muted-foreground/60">
          Gestito con my-repair.it — Conservare questo documento come prova di consegna
        </div>
      </div>
    </>
  );
}
