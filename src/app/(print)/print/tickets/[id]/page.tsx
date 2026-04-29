import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses, organizations, ticketPhotos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getPublicUrl, getPresignedDownloadUrl } from "@/lib/storage";
import { PrintButton } from "./print-button";

type DocType = "ricevuta" | "preventivo" | "accettazione" | "liberatoria";

const DOC_LABELS: Record<DocType, string> = {
  ricevuta: "Ricevuta di riparazione",
  preventivo: "Preventivo di riparazione",
  accettazione: "Accettazione riparazione",
  liberatoria: "Liberatoria e consenso dati",
};

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string; doc?: string }>;
}) {
  const { id } = await params;
  const { format, doc: docParam } = await searchParams;
  const isThermal = format === "thermal";
  const doc: DocType = ["ricevuta", "preventivo", "accettazione", "liberatoria"].includes(docParam ?? "")
    ? (docParam as DocType)
    : "ricevuta";

  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
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
      vatNumber: organizations.vatNumber,
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
  const today = formatDate(new Date().toISOString());

  // ── Thermal ─────────────────────────────────────────────────────────────────
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

  // ── Shared header component ─────────────────────────────────────────────────
  const OrgHeader = () => (
    <div className="flex items-start justify-between pb-5 border-b" style={{ borderColor: primary + "40" }}>
      <div className="flex items-center gap-3">
        {org?.brandingLogoUrl ? (
          <img src={org.brandingLogoUrl} alt={org?.name} className="h-10 w-auto object-contain" />
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
          {org?.vatNumber && <p className="text-xs text-muted-foreground">P.IVA {org.vatNumber}</p>}
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold" style={{ color: primary }}>{ticketNum}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{DOC_LABELS[doc]}</p>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>
    </div>
  );

  const CustomerDeviceGrid = () => (
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
  );

  const SignatureBox = ({ label = "Firma e data cliente" }: { label?: string }) => (
    signatureUrl ? (
      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
        <div className="rounded-lg border bg-slate-50 p-2 inline-block">
          <img src={signatureUrl} alt="Firma" className="h-20 w-auto object-contain" />
        </div>
      </div>
    ) : (
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
          <div className="mt-8 border-b border-slate-300" />
          <p className="text-xs text-muted-foreground mt-1">Data: ______________</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Firma tecnico</p>
          <div className="mt-8 border-b border-slate-300" />
          <p className="text-xs text-muted-foreground mt-1">Data: ______________</p>
        </div>
      </div>
    )
  );

  const PageFooter = () => (
    <div className="mt-10 pt-4 border-t text-center text-xs text-muted-foreground/60">
      Gestito con my-repair.it — {DOC_LABELS[doc]} {ticketNum}
    </div>
  );

  // ── A4 documents ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@page { size: A4; margin: 15mm; }`}</style>

      {/* Top bar — screen only */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <a href={`/tickets/${id}`} className="text-muted-foreground hover:underline">← Torna al ticket</a>
          <span className="text-slate-300">|</span>
          {(["ricevuta", "preventivo", "accettazione", "liberatoria"] as DocType[]).map((d) => (
            <a
              key={d}
              href={`/print/tickets/${id}?doc=${d}`}
              className={`capitalize hover:underline ${doc === d ? "font-semibold text-primary" : "text-muted-foreground"}`}
            >
              {DOC_LABELS[d]}
            </a>
          ))}
          <a href={`/print/tickets/${id}?format=thermal`} className="text-muted-foreground hover:underline">Termico (58mm)</a>
        </div>
        <PrintButton label="Stampa / Salva PDF" />
      </div>

      <div className="mx-auto max-w-2xl bg-white px-10 py-8 print:px-0 print:py-0 print:max-w-none mt-14 print:mt-0">

        {/* ── RICEVUTA ─────────────────────────────────────────────────── */}
        {doc === "ricevuta" && (
          <>
            <OrgHeader />
            {ticket.statusName && (
              <div className="mt-4 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white" style={{ backgroundColor: primary }}>
                {ticket.statusName}
              </div>
            )}
            <CustomerDeviceGrid />
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
            <SignatureBox />
            {ticket.internalNotes && (
              <div className="mt-5 print:hidden">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Note interne</p>
                <p className="text-sm">{ticket.internalNotes}</p>
              </div>
            )}
            <PageFooter />
          </>
        )}

        {/* ── PREVENTIVO ───────────────────────────────────────────────── */}
        {doc === "preventivo" && (
          <>
            <OrgHeader />
            <CustomerDeviceGrid />
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Problema segnalato</p>
              <p className="text-sm rounded-lg bg-slate-50 p-3 border">{ticket.faultDescription}</p>
            </div>
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Dettaglio preventivo</p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2" style={{ borderColor: primary + "40" }}>
                    <th className="text-left py-2 font-semibold">Descrizione</th>
                    <th className="text-right py-2 font-semibold w-28">Importo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-muted-foreground">Diagnosi e intervento — {device}</td>
                    <td className="py-2.5 text-right font-medium">
                      {ticket.estimatedCost != null ? formatCurrency(ticket.estimatedCost) : "Da definire"}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-3 font-bold">Totale stimato</td>
                    <td className="pt-3 text-right font-bold text-lg" style={{ color: primary }}>
                      {ticket.estimatedCost != null ? formatCurrency(ticket.estimatedCost) : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Il presente preventivo è puramente indicativo e valido per 30 giorni dalla data di emissione.
              L&apos;importo finale potrebbe variare a seguito di diagnosi approfondita.
              Eventuali parti di ricambio non incluse saranno preventivate separatamente.
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Risposta del cliente</p>
              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <span className="h-4 w-4 border border-slate-400 rounded inline-block" />
                  Accetto il preventivo e autorizzo la riparazione
                </label>
                <label className="flex items-center gap-2">
                  <span className="h-4 w-4 border border-slate-400 rounded inline-block" />
                  Rifiuto il preventivo
                </label>
              </div>
            </div>
            <SignatureBox label="Firma e data cliente" />
            <PageFooter />
          </>
        )}

        {/* ── ACCETTAZIONE ─────────────────────────────────────────────── */}
        {doc === "accettazione" && (
          <>
            <OrgHeader />
            <div className="mt-5">
              <p className="text-sm leading-relaxed">
                Il/La sottoscritto/a <strong>{ticket.customerName ?? "___________________________"}</strong>{" "}
                {ticket.customerPhone ? `(tel. ${ticket.customerPhone})` : ""} autorizza{" "}
                <strong>{org?.name ?? "il centro di riparazione"}</strong> a effettuare l&apos;intervento di
                riparazione sul seguente dispositivo:
              </p>
            </div>
            <div className="mt-4 rounded-lg border bg-slate-50 p-4 text-sm space-y-1.5">
              <div className="flex gap-4"><span className="font-medium w-28">Dispositivo:</span><span>{device}</span></div>
              {ticket.deviceImei && <div className="flex gap-4"><span className="font-medium w-28">IMEI:</span><span>{ticket.deviceImei}</span></div>}
              {ticket.deviceSerial && <div className="flex gap-4"><span className="font-medium w-28">Seriale:</span><span>{ticket.deviceSerial}</span></div>}
              {ticket.deviceCondition && <div className="flex gap-4"><span className="font-medium w-28">Condizioni:</span><span>{ticket.deviceCondition}</span></div>}
              {ticket.accessories && <div className="flex gap-4"><span className="font-medium w-28">Accessori:</span><span>{ticket.accessories}</span></div>}
              <div className="flex gap-4 pt-1 border-t border-slate-200"><span className="font-medium w-28">Problema:</span><span>{ticket.faultDescription}</span></div>
              {ticket.estimatedCost != null && (
                <div className="flex gap-4"><span className="font-medium w-28">Preventivo:</span><span className="font-semibold">{formatCurrency(ticket.estimatedCost)}</span></div>
              )}
            </div>
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Il cliente dichiara di:</p>
              <ul className="space-y-2 text-sm">
                {[
                  "Essere il legittimo proprietario del dispositivo o di avere diritto di farlo riparare.",
                  "Aver letto e accettato le condizioni di servizio del centro riparazioni.",
                  "Essere stato informato dei costi stimati e di autorizzare l'intervento.",
                  "Essere consapevole che la riparazione potrebbe comportare la perdita di dati presenti sul dispositivo.",
                  "Essere consapevole che, se l'intervento si rivela impossibile o antieconomico, potrà essere addebitato il costo di diagnosi.",
                ].map((clause, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 h-3.5 w-3.5 shrink-0 border border-slate-400 rounded" />
                    <span>{clause}</span>
                  </li>
                ))}
              </ul>
            </div>
            <SignatureBox label="Firma e data cliente" />
            <PageFooter />
          </>
        )}

        {/* ── LIBERATORIA ──────────────────────────────────────────────── */}
        {doc === "liberatoria" && (
          <>
            <OrgHeader />
            <div className="mt-5">
              <p className="text-sm leading-relaxed">
                Il/La sottoscritto/a <strong>{ticket.customerName ?? "___________________________"}</strong>{" "}
                (di seguito &quot;Cliente&quot;), consegna a <strong>{org?.name ?? "il centro di riparazione"}</strong>{" "}
                (di seguito &quot;Centro&quot;) il dispositivo <strong>{device}</strong>{" "}
                {ticket.deviceImei ? `(IMEI: ${ticket.deviceImei})` : ticket.deviceSerial ? `(S/N: ${ticket.deviceSerial})` : ""}{" "}
                per attività di diagnosi e/o riparazione, e dichiara quanto segue:
              </p>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-1">1. Trattamento dati personali (D.Lgs. 196/2003 — GDPR 679/2016)</p>
                <p className="text-muted-foreground leading-relaxed">
                  Il Cliente prende atto che i propri dati personali (nome, telefono, email) saranno trattati dal Centro
                  esclusivamente per la gestione del servizio di riparazione e per comunicazioni relative allo stato del
                  dispositivo. I dati non saranno ceduti a terzi. Il titolare del trattamento è {org?.name ?? "il Centro"}.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">2. Accesso ai dati del dispositivo</p>
                <p className="text-muted-foreground leading-relaxed">
                  Il Cliente autorizza espressamente il personale tecnico ad accedere al dispositivo — inclusi file,
                  impostazioni e applicazioni — nella misura strettamente necessaria all&apos;esecuzione dell&apos;intervento.
                  Il Centro si impegna a non copiare, divulgare o utilizzare i dati personali presenti sul dispositivo
                  per scopi diversi dalla riparazione.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">3. Rischio perdita dati</p>
                <p className="text-muted-foreground leading-relaxed">
                  Il Cliente è consapevole che alcune operazioni di riparazione (es. ripristino firmware, sostituzione
                  memoria) possono comportare la cancellazione totale o parziale dei dati. Il Centro non è responsabile
                  per la perdita di dati non precedentemente salvati dal Cliente (backup). Si consiglia di effettuare
                  una copia dei dati prima della consegna.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">4. Dispositivo non ritirato</p>
                <p className="text-muted-foreground leading-relaxed">
                  Il Cliente prende atto che, in caso di mancato ritiro entro 90 giorni dalla comunicazione di
                  disponibilità, il Centro potrà procedere allo smaltimento o alienazione del dispositivo, previa
                  ulteriore comunicazione scritta, con esclusione di qualsiasi responsabilità.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">5. Garanzia sull&apos;intervento</p>
                <p className="text-muted-foreground leading-relaxed">
                  Salvo diverso accordo scritto, la garanzia sull&apos;intervento eseguito è di 90 giorni e copre
                  esclusivamente il difetto riparato. Danni fisici successivi, infiltrazioni di liquidi o manomissioni
                  non sono coperti dalla garanzia.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground">
              Il Cliente dichiara di aver letto e compreso la presente liberatoria e di sottoscriverla liberamente e
              consapevolmente. La firma equivale ad accettazione integrale delle condizioni sopra riportate.
            </div>
            <SignatureBox label="Firma e data cliente (per accettazione)" />
            <PageFooter />
          </>
        )}

      </div>
    </>
  );
}
