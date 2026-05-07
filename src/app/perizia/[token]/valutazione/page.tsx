import { db } from "@/lib/db";
import { deviceAppraisals, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { PeriziaPublicShell } from "@/components/perizia-public-shell";

function fmt(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

const INTENT_LABELS: Record<string, string> = {
  sell: "Solo vendita",
  trade_in: "Permuta",
  both: "Vendita o permuta",
};

export default async function ValutazionePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [row] = await db
    .select({
      brand: deviceAppraisals.brand,
      model: deviceAppraisals.model,
      storageGb: deviceAppraisals.storageGb,
      color: deviceAppraisals.color,
      status: deviceAppraisals.status,
      intent: deviceAppraisals.intent,
      finalValuationCents: deviceAppraisals.finalValuationCents,
      tradeInBonusCents: deviceAppraisals.tradeInBonusCents,
      adminNotes: deviceAppraisals.adminNotes,
      approvedAt: deviceAppraisals.approvedAt,
      orgName: organizations.name,
      orgLogoUrl: organizations.brandingLogoUrl,
      orgColor: organizations.brandingPrimaryColor,
      orgPhone: organizations.phone,
      orgWhatsapp: organizations.whatsappPhone,
    })
    .from(deviceAppraisals)
    .leftJoin(organizations, eq(organizations.id, deviceAppraisals.organizationId))
    .where(eq(deviceAppraisals.surveyToken, token))
    .limit(1);

  if (!row) notFound();

  const deviceName = [row.brand, row.model, row.storageGb].filter(Boolean).join(" ");
  const isApproved = row.status === "approved" && row.finalValuationCents != null;
  const isRejected = row.status === "rejected";
  const totalOffer = (row.finalValuationCents ?? 0) + row.tradeInBonusCents;
  const primaryColor = row.orgColor ?? "#0D8F7A";
  const approvedAt = row.approvedAt ? new Date(row.approvedAt) : null;
  const expiryDate = approvedAt
    ? new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(
        addDays(approvedAt, 7),
      )
    : null;
  const isExpired = approvedAt ? addDays(approvedAt, 7) < new Date() : false;

  return (
    <PeriziaPublicShell
      orgName={row.orgName ?? "Centro Riparazioni"}
      logoUrl={row.orgLogoUrl ?? null}
      primaryColor={primaryColor}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Dispositivo */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Dispositivo</p>
          <h2 className="text-lg font-bold mt-0.5">
            {deviceName}{row.color ? ` · ${row.color}` : ""}
          </h2>
          {row.intent && (
            <p className="text-sm text-muted-foreground">Intenzione: {INTENT_LABELS[row.intent] ?? row.intent}</p>
          )}
        </div>

        {isApproved && isExpired ? (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-center space-y-2">
            <Clock className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-lg font-semibold text-slate-700">Offerta scaduta</p>
            <p className="text-sm text-slate-500">
              Questa offerta era valida per 7 giorni ed è scaduta il {expiryDate}.
              Contattaci per richiedere una nuova valutazione.
            </p>
            <div className="pt-2 flex flex-col gap-3">
              {row.orgPhone && (
                <a
                  href={`tel:${row.orgPhone}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Chiamaci
                </a>
              )}
            </div>
          </div>
        ) : isApproved ? (
          <>
            {/* Offerta approvata */}
            <div
              className="rounded-xl p-5 text-center space-y-2"
              style={{ backgroundColor: `${primaryColor}12`, border: `1px solid ${primaryColor}30` }}
            >
              <CheckCircle2 className="h-10 w-10 mx-auto" style={{ color: primaryColor }} />
              <p className="text-sm font-medium" style={{ color: primaryColor }}>
                La nostra offerta
              </p>
              <p className="text-4xl font-bold" style={{ color: primaryColor }}>
                {fmt(row.finalValuationCents!)}
              </p>
              {row.tradeInBonusCents > 0 && (
                <div className="pt-2 space-y-0.5" style={{ borderTop: `1px solid ${primaryColor}30` }}>
                  <p className="text-sm" style={{ color: primaryColor }}>
                    + {fmt(row.tradeInBonusCents)} bonus permuta
                  </p>
                  <p className="text-lg font-bold" style={{ color: primaryColor }}>
                    = {fmt(totalOffer)} in caso di permuta
                  </p>
                </div>
              )}
            </div>

            {row.adminNotes && (
              <div className="rounded-lg bg-slate-50 border px-4 py-3 text-sm text-slate-600">
                <p className="font-medium mb-1">Note</p>
                <p>{row.adminNotes}</p>
              </div>
            )}

            {/* CTA + validità */}
            <div
              className="rounded-lg px-4 py-3 text-sm space-y-1"
              style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}25`, color: primaryColor }}
            >
              <p>
                Sei interessato? Recati in negozio con il dispositivo e il tuo documento d&apos;identità.
                L&apos;offerta è indicativa e sarà confermata dopo verifica fisica.
              </p>
              {expiryDate && (
                <p className="font-semibold">Offerta valida fino al {expiryDate}.</p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {row.orgPhone && (
                <a
                  href={`tel:${row.orgPhone}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Chiamaci per un appuntamento
                </a>
              )}
              {(row.orgWhatsapp || row.orgPhone) && (() => {
                const raw = (row.orgWhatsapp ?? row.orgPhone ?? "").replace(/\D/g, "").replace(/^00/, "");
                const waNumber = raw.startsWith("39") ? raw : `39${raw}`;
                const waText = encodeURIComponent(
                  `Ciao, ho visto la valutazione del mio ${deviceName} e sono interessato/a. Quando posso passare?`
                );
                return (
                  <a
                    href={`https://wa.me/${waNumber}?text=${waText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 bg-[#25D366]"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Contattaci su WhatsApp
                  </a>
                );
              })()}
            </div>
          </>
        ) : isRejected ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-center space-y-2">
            <p className="text-lg font-semibold text-red-700">Offerta non disponibile</p>
            <p className="text-sm text-red-600">
              Siamo spiacenti, in questo momento non siamo in grado di fare un&apos;offerta per questo dispositivo.
              Contattaci per maggiori informazioni.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-center space-y-3">
            <Clock className="h-10 w-10 text-amber-500 mx-auto" />
            <p className="text-lg font-semibold text-amber-700">Valutazione in corso</p>
            <p className="text-sm text-amber-600">
              Il nostro team sta analizzando le tue risposte. Riceverai presto la nostra offerta via WhatsApp.
            </p>
          </div>
        )}
      </div>
    </PeriziaPublicShell>
  );
}
