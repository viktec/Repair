import { db } from "@/lib/db";
import { deviceAppraisals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Wrench } from "lucide-react";

function fmt(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

const INTENT_LABELS: Record<string, string> = {
  sell: "Solo vendita",
  trade_in: "Permuta",
  both: "Vendita o permuta",
};

export default async function ValutazionePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [appraisal] = await db
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
    })
    .from(deviceAppraisals)
    .where(eq(deviceAppraisals.surveyToken, token))
    .limit(1);

  if (!appraisal) notFound();

  const deviceName = [appraisal.brand, appraisal.model, appraisal.storageGb].filter(Boolean).join(" ");
  const isApproved = appraisal.status === "approved" && appraisal.finalValuationCents != null;
  const isRejected = appraisal.status === "rejected";
  const totalOffer = (appraisal.finalValuationCents ?? 0) + appraisal.tradeInBonusCents;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Valutazione Usato</span>
        </div>

        <div className="rounded-2xl bg-white border shadow-sm p-6 space-y-6">
          {/* Dispositivo */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Dispositivo</p>
            <h2 className="text-lg font-bold mt-0.5">{deviceName}{appraisal.color ? ` · ${appraisal.color}` : ""}</h2>
            {appraisal.intent && (
              <p className="text-sm text-muted-foreground">Intenzione: {INTENT_LABELS[appraisal.intent] ?? appraisal.intent}</p>
            )}
          </div>

          {isApproved ? (
            <>
              {/* Offerta approvata */}
              <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-green-700">La nostra offerta</p>
                <p className="text-4xl font-bold text-green-700">{fmt(appraisal.finalValuationCents!)}</p>
                {appraisal.tradeInBonusCents > 0 && (
                  <div className="pt-2 border-t border-green-200 space-y-0.5">
                    <p className="text-sm text-green-600">
                      + {fmt(appraisal.tradeInBonusCents)} bonus permuta
                    </p>
                    <p className="text-lg font-bold text-green-700">= {fmt(totalOffer)} in caso di permuta</p>
                  </div>
                )}
              </div>

              {appraisal.adminNotes && (
                <div className="rounded-lg bg-slate-50 border px-4 py-3 text-sm text-slate-600">
                  <p className="font-medium mb-1">Note</p>
                  <p>{appraisal.adminNotes}</p>
                </div>
              )}

              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary space-y-1">
                <p>
                  Sei interessato? Recati in negozio con il dispositivo e il tuo documento d&apos;identità.
                  L&apos;offerta è indicativa e sarà confermata dopo verifica fisica.
                </p>
                {appraisal.approvedAt && (
                  <p className="font-medium">
                    Offerta valida fino al{" "}
                    {new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(
                      new Date(new Date(appraisal.approvedAt).getTime() + 7 * 24 * 60 * 60 * 1000),
                    )}
                    .
                  </p>
                )}
              </div>
            </>
          ) : isRejected ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-center space-y-2">
              <p className="text-lg font-semibold text-red-700">Offerta non disponibile</p>
              <p className="text-sm text-red-600">
                Siamo spiacenti, in questo momento non siamo in grado di fare un&apos;offerta per questo dispositivo. Contattaci per maggiori informazioni.
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

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by my-repair.it
        </p>
      </div>
    </div>
  );
}
