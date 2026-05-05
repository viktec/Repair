"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, CheckCircle2, Clock, Loader2, X } from "lucide-react";
import { clientBookCheckVisitAction } from "@/app/(app)/support/contracts/check-visits-actions";

type Props = {
  token: string;
  primaryColor: string;
  freeVisitsPerPeriod: number;
  freeVisitPeriodMonths: number;
  isEligible: boolean;
  nextEligibleDate: Date | null;
  pendingVisit: { preferredDate1: Date; preferredDate2: Date | null } | null;
};

function fmt(d: Date) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export function CheckVisitForm({
  token,
  primaryColor,
  freeVisitsPerPeriod,
  freeVisitPeriodMonths,
  isEligible,
  nextEligibleDate,
  pendingVisit,
}: Props) {
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!date1) { setError("Inserisci almeno una data preferita."); return; }
    if (date2 && date2 <= date1) { setError("La seconda data deve essere successiva alla prima."); return; }

    startTransition(async () => {
      const result = await clientBookCheckVisitAction(token, date1, date2 || null, notes);
      if (!result.ok) {
        setError(result.error ?? "Errore durante la prenotazione. Riprova.");
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: primaryColor + "20" }}>
            <CheckCircle2 className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <p className="text-base font-semibold">Richiesta di visita inviata!</p>
          <p className="text-sm text-muted-foreground">
            Ti contatteremo per confermare la data. Ricorda che i tempi di risposta sono di 24–72 ore.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-5 w-5" style={{ color: primaryColor }} />
        <p className="text-sm font-semibold text-foreground">Visita di controllo gratuita</p>
      </div>

      <p className="text-xs text-muted-foreground">
        Il tuo contratto include <strong>{freeVisitsPerPeriod} visita{freeVisitsPerPeriod > 1 ? " gratuita" : " gratuita"}</strong> ogni{" "}
        <strong>{freeVisitPeriodMonths} mesi</strong>. La visita non consuma le tue ore.
      </p>

      {pendingVisit ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
          <p className="font-semibold">Hai già una visita in attesa di conferma</p>
          <p>Prima data proposta: <strong>{fmt(new Date(pendingVisit.preferredDate1))}</strong></p>
          {pendingVisit.preferredDate2 && (
            <p>Seconda data proposta: <strong>{fmt(new Date(pendingVisit.preferredDate2))}</strong></p>
          )}
          <p className="text-amber-700">Ti contatteremo a breve per confermare.</p>
        </div>
      ) : !isEligible ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5" />
            Visita non ancora disponibile
          </div>
          {nextEligibleDate && (
            <p>Prossima visita gratuita disponibile dal <strong>{fmt(nextEligibleDate)}</strong>.</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-2.5 flex items-start gap-2 text-xs text-blue-800">
            <CalendarCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Proponi 1 o 2 date preferite. Ci riserviamo di confermare la più adatta.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Prima data preferita <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={date1}
              min={today}
              onChange={(e) => setDate1(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Seconda data (opzionale)
            </label>
            <div className="relative">
              <input
                type="date"
                value={date2}
                min={date1 || today}
                onChange={(e) => setDate2(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2"
              />
              {date2 && (
                <button
                  type="button"
                  onClick={() => setDate2("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Note (opzionale)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es: preferibilmente di mattina, zona ufficio B..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: primaryColor }}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
            Prenota visita gratuita
          </button>
        </form>
      )}
    </div>
  );
}
