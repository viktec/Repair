import { db } from "@/lib/db";
import {
  supportInterventions,
  customerContracts,
  customers,
  organizations,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "./print-button";

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} ${h === 1 ? "ora" : "ore"}`;
  return `${h} ${h === 1 ? "ora" : "ore"} ${m} min`;
}

function formatTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatInterventionDate(date: Date | string | null): string {
  if (!date) return "—";
  return formatDate(date);
}

export default async function PrintVerbale({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  // Fetch intervention
  const [intervention] = await db
    .select({
      id: supportInterventions.id,
      organizationId: supportInterventions.organizationId,
      contractId: supportInterventions.contractId,
      interventionNumber: supportInterventions.interventionNumber,
      title: supportInterventions.title,
      description: supportInterventions.description,
      type: supportInterventions.type,
      isUrgent: supportInterventions.isUrgent,
      startTime: supportInterventions.startTime,
      endTime: supportInterventions.endTime,
      rawMinutes: supportInterventions.rawMinutes,
      billableMinutes: supportInterventions.billableMinutes,
      technicianName: supportInterventions.technicianName,
      location: supportInterventions.location,
      clientSignedAt: supportInterventions.clientSignedAt,
      clientSignatureData: supportInterventions.clientSignatureData,
      status: supportInterventions.status,
      notes: supportInterventions.notes,
      createdAt: supportInterventions.createdAt,
    })
    .from(supportInterventions)
    .where(eq(supportInterventions.id, id))
    .limit(1);

  if (!intervention) notFound();

  // Fetch contract (with token-based access check)
  const [contract] = await db
    .select({
      id: customerContracts.id,
      customerId: customerContracts.customerId,
      contractNumber: customerContracts.contractNumber,
      startDate: customerContracts.startDate,
      endDate: customerContracts.endDate,
      totalMinutes: customerContracts.totalMinutes,
      usedMinutes: customerContracts.usedMinutes,
      clientPortalToken: customerContracts.clientPortalToken,
    })
    .from(customerContracts)
    .where(eq(customerContracts.id, intervention.contractId))
    .limit(1);

  if (!contract) notFound();

  // Access control: must either have matching token or be authenticated via session
  // Token check (public access via ?token=)
  const hasValidToken = token && token === contract.clientPortalToken;

  if (!hasValidToken) {
    // Try session auth
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user?.organizationId || session.user.organizationId !== intervention.organizationId) {
      const { redirect } = await import("next/navigation");
      redirect("/login");
    }
  }

  // Fetch customer
  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
    })
    .from(customers)
    .where(eq(customers.id, contract.customerId))
    .limit(1);

  // Fetch organization
  const [org] = await db
    .select({
      name: organizations.name,
      address: organizations.address,
      city: organizations.city,
      postalCode: organizations.postalCode,
      phone: organizations.phone,
      brandingLogoUrl: organizations.brandingLogoUrl,
      brandingPrimaryColor: organizations.brandingPrimaryColor,
    })
    .from(organizations)
    .where(eq(organizations.id, intervention.organizationId))
    .limit(1);

  const primary = org?.brandingPrimaryColor ?? "#0D8F7A";

  const tipoLabel =
    intervention.type === "remote"
      ? "REMOTO"
      : intervention.type === "phone"
        ? "TELEFONICO"
        : "IN SEDE";

  const tipoIntervento = intervention.isUrgent ? "STRAORDINARIO" : "ORDINARIO";

  const interventionDateRaw = intervention.startTime ?? intervention.createdAt;
  const interventionDateFormatted = formatInterventionDate(interventionDateRaw);

  // Ora fine: usa endTime salvato oppure calcola da startTime + rawMinutes
  const computedEndTime = intervention.endTime ??
    (intervention.startTime
      ? new Date(new Date(intervention.startTime).getTime() + intervention.rawMinutes * 60 * 1000)
      : null);

  const oreResidue = contract.totalMinutes - contract.usedMinutes;

  const backUrl = `/support/contracts/${intervention.contractId}`;

  return (
    <>
      <style>{`
        @page { size: A4; margin: 20mm; }
        body { font-family: Georgia, 'Times New Roman', serif; }
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top bar — screen only */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <a
          href={backUrl}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Torna all&apos;intervento
        </a>
        <PrintButton label="Stampa / Salva PDF" />
      </div>

      {/* A4 document */}
      <div
        className="mx-auto max-w-2xl bg-white px-10 py-8 print:px-0 print:py-0 print:max-w-none mt-16 print:mt-0"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between pb-5" style={{ borderBottom: `2px solid ${primary}` }}>
          <div>
            {org?.brandingLogoUrl ? (
              <img
                src={org.brandingLogoUrl}
                alt={org?.name ?? "Logo"}
                style={{ height: 56, width: "auto", objectFit: "contain", marginBottom: 4 }}
              />
            ) : (
              <p style={{ fontFamily: "sans-serif", fontSize: 24, fontWeight: 700, color: primary, margin: 0 }}>
                {org?.name ?? "Centro Assistenza"}
              </p>
            )}
          </div>
          <div style={{ textAlign: "right", fontFamily: "sans-serif" }}>
            <p style={{ fontSize: 11, color: "#666", margin: 0 }}>Intervento</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: primary, margin: "2px 0 0" }}>
              #{intervention.interventionNumber}
            </p>
          </div>
        </div>

        {/* ── TITOLO DOCUMENTO ── */}
        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <p style={{ fontFamily: "sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: 1, margin: 0 }}>
            VERBALE PRESTAZIONE
          </p>
          <p style={{ fontFamily: "sans-serif", fontSize: 12, color: "#555", margin: "2px 0 0" }}>
            Contratti di assistenza
          </p>
        </div>

        {/* ── SEPARATORE ── */}
        <hr style={{ border: "none", borderTop: `1px solid ${primary}`, margin: "0 0 16px" }} />

        {/* ── DESCRIZIONE / TIPO INTERVENTO ── */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 6px" }}>
            DESCRIZIONE
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ fontFamily: "sans-serif", fontSize: 14, fontWeight: 700, margin: 0 }}>
              INTERVENTO
            </p>
            <span
              style={{
                fontFamily: "sans-serif",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: 4,
                backgroundColor: intervention.isUrgent ? "#dc2626" : primary,
                color: "#fff",
                letterSpacing: 0.5,
              }}
            >
              {tipoIntervento}
            </span>
            <span
              style={{
                fontFamily: "sans-serif",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 4,
                border: `1px solid ${primary}`,
                color: primary,
              }}
            >
              {tipoLabel}
            </span>
          </div>
        </div>

        {/* ── GRIGLIA AZIENDA / CONTRATTO / DATA ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 16, fontFamily: "sans-serif" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 2px" }}>
              AZIENDA
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              {customer?.name ?? "—"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 2px" }}>
              CONTRATTO
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              {contract.contractNumber}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 2px" }}>
              DATA
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              {interventionDateFormatted}
            </p>
          </div>
        </div>

        {/* ── ORARI ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 16, fontFamily: "sans-serif" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 2px" }}>
              ORA INIZIO INTERVENTO
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              {formatTime(intervention.startTime)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 2px" }}>
              ORA FINE INTERVENTO
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              {formatTime(computedEndTime)}
            </p>
          </div>
        </div>

        {/* ── LUOGO ── */}
        {intervention.location && (
          <div style={{ marginBottom: 16, fontFamily: "sans-serif" }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 2px" }}>
              LUOGO INTERVENTO
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{intervention.location}</p>
          </div>
        )}

        {/* ── INTERVENTO ESEGUITO ── */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 6px" }}>
            INTERVENTO ESEGUITO
          </p>
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 4,
              padding: "10px 14px",
              backgroundColor: "#fafafa",
              minHeight: 60,
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {intervention.description ?? intervention.title}
          </div>
        </div>

        {/* ── ORE DA SCALARE / TECNICO ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 20, fontFamily: "sans-serif" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 2px" }}>
              ORE DA SCALARE
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: primary, margin: 0 }}>
              {formatMinutes(intervention.billableMinutes)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 2px" }}>
              NOME TECNICO
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              {intervention.technicianName ?? "—"}
            </p>
          </div>
        </div>

        {/* ── SEPARATORE ── */}
        <hr style={{ border: "none", borderTop: `1px solid ${primary}`, margin: "0 0 16px" }} />

        {/* ── DICHIARAZIONE ── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            CON LA PRESENTE, L&apos;AZIENDA CLIENTE CONFERMA CHE L&apos;INTERVENTO È STATO EFFETTUATO COME
            DESCRITTO E CHE LE ORE INDICATE DI CUI SOPRA, VERRANNO SCALATE DAL MONTE ORE TOTALE
            COME DA CONTRATTO STIPULATO.
          </p>
        </div>

        {/* ── FIRME ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 40px", marginBottom: 24, fontFamily: "sans-serif" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 6px" }}>
              LUOGO E DATA
            </p>
            {intervention.location ? (
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px" }}>{intervention.location}</p>
            ) : null}
            <p style={{ fontSize: 12, margin: "0 0 20px" }}>{interventionDateFormatted}</p>
            <div style={{ borderBottom: "1px solid #999", marginBottom: 4 }} />
            <p style={{ fontSize: 10, color: "#888", margin: 0 }}>___________________</p>
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 6px" }}>
              FIRMA CLIENTE
            </p>
            {intervention.clientSignatureData ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={intervention.clientSignatureData}
                  alt="Firma cliente"
                  style={{ height: 60, maxWidth: "100%", objectFit: "contain", display: "block", marginBottom: 4 }}
                />
                <p style={{ fontSize: 9, color: "#666", margin: 0 }}>
                  Firmato digitalmente il {new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(intervention.clientSignedAt!))}
                </p>
              </>
            ) : (
              <>
                <div style={{ height: 60, borderBottom: "1px solid #999", marginBottom: 4 }} />
                <p style={{ fontSize: 10, color: "#888", margin: 0 }}>___________________</p>
              </>
            )}
          </div>
        </div>

        {/* ── NOTE PER VARIANTI ── */}
        <div style={{ marginBottom: 20, fontFamily: "sans-serif" }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#888", margin: "0 0 6px" }}>
            NOTE PER EVENTUALI VARIANTI
          </p>
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 4,
              minHeight: 50,
              padding: "8px 12px",
              backgroundColor: "#fafafa",
            }}
          />
        </div>

        {/* ── TESTO LEGALE ── */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 4,
            padding: "10px 14px",
            backgroundColor: "#f8f8f8",
            marginBottom: 20,
          }}
        >
          <p style={{ fontFamily: "sans-serif", fontSize: 9, color: "#777", lineHeight: 1.6, margin: 0 }}>
            Il presente contratto si rinnova tacitamente allo scadere di un anno dalla data di stipula, salvo disdetta scritta da inviare almeno 30 giorni prima della scadenza.
            Le ore in eccedenza rispetto al monte ore contrattuale non potranno essere cumulate e saranno fatturate separatamente alle condizioni in vigore al momento dell&apos;erogazione.
            In caso di mancato utilizzo del monte ore entro la scadenza contrattuale, le ore residue non daranno diritto a rimborso né a compensazione.
          </p>
        </div>

        {/* ── RIEPILOGO MONTE ORE ── */}
        <div
          style={{
            border: `1px solid ${primary}40`,
            borderRadius: 6,
            padding: "14px 18px",
            backgroundColor: `${primary}08`,
            marginBottom: 24,
            fontFamily: "sans-serif",
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: primary, margin: "0 0 10px" }}>
            Riepilogo monte ore
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
            <div>
              <p style={{ fontSize: 10, color: "#888", margin: "0 0 2px" }}>Ore totali contratto</p>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{formatMinutes(contract.totalMinutes)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: "#888", margin: "0 0 2px" }}>Ore utilizzate</p>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{formatMinutes(contract.usedMinutes)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: "#888", margin: "0 0 2px" }}>Ore residue</p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  margin: 0,
                  color: oreResidue <= 0 ? "#dc2626" : primary,
                }}
              >
                {formatMinutes(Math.max(0, oreResidue))}
              </p>
            </div>
          </div>
        </div>

        {/* ── SEPARATORE ── */}
        <hr style={{ border: "none", borderTop: `1px solid ${primary}`, margin: "0 0 14px" }} />

        {/* ── FOOTER ORGANIZZAZIONE ── */}
        <div style={{ textAlign: "center", fontFamily: "sans-serif", fontSize: 11, color: "#555" }}>
          <p style={{ margin: "0 0 2px", fontWeight: 600 }}>
            PRESTAZIONE ESEGUITA PER CONTO DI {org?.name?.toUpperCase() ?? "—"}
            {org?.address || org?.city
              ? ` — ${[org?.address, org?.city].filter(Boolean).join(", ")}`
              : ""}
          </p>
          <p style={{ margin: 0, color: "#777" }}>
            {org?.phone && <>CONTATTI: {org.phone}</>}
          </p>
        </div>

      </div>
    </>
  );
}
