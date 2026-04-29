"use client";

import { useTransition, useState, useRef } from "react";
import { acceptQuoteAction, rejectQuoteAction } from "./actions";
import { CheckCircle2, XCircle, Loader2, Euro, ScrollText, ChevronDown } from "lucide-react";

const DEFAULT_TERMS = `TERMINI E CONDIZIONI DI ASSISTENZA

• Sarà effettuata una tempestiva diagnosi seguita dalla comunicazione del preventivo di spesa.
• L'accettazione, anche verbale, del preventivo viene considerata come ordine.
• I tempi di attesa per gli interventi variano dai 2 ai 12 giorni lavorativi.
• Il pagamento dovrà essere effettuato a riparazione avvenuta direttamente in negozio.
• È consigliabile effettuare un backup dei dati prima della consegna del dispositivo. Non ci assumiamo alcuna responsabilità per eventuali perdite di dati durante la riparazione.
• In caso di danneggiamenti irreversibili durante la diagnosi, non ci assumiamo alcuna responsabilità. Il cliente accetta che un dispositivo malfunzionante potrebbe essere ritirato anche completamente non funzionante.
• La garanzia sul ricambio e sulla manodopera ha validità 3 mesi dalla data di riparazione.
• La garanzia non si applica su interventi software, su dispositivi venuti a contatto con liquidi e su interventi hardware al solo fine di recupero dati.
• Il terminale rimarrà in giacenza gratuita per 7 giorni dalla comunicazione di riparazione avvenuta, oltre i quali verrà aggiunta una diaria di €1 per ogni giorno successivo.
• Dopo 90 giorni di giacenza, come previsto dalla legge, il dispositivo diverrà di proprietà del centro riparazioni.

LIMITAZIONI DI GARANZIA
• Rotture causate da incidenti, cadute, schiacciamento o uso improprio
• Rotture di vetri e cristalli
• Degrado naturale causato dal tempo
• Prodotti con evidenti segni di manomissione
• Visibili difetti di conformità non dichiarati entro 5gg lavorativi dalla consegna

N.B.: LEGGERE ATTENTAMENTE I PRESENTI TERMINI E CONDIZIONI. IL CENTRO RIPARAZIONI SI ESIME DA OGNI RESPONSABILITÀ PER EVENTUALI DANNI ACCIDENTALI DOVUTI ALLA SOLA APERTURA DEL DISPOSITIVO, QUALORA ESSO PRESENTASSE GIÀ ANOMALIE DI FUNZIONAMENTO O DANNI PREESISTENTI NON DICHIARATI AL MOMENTO DELLA CONSEGNA.

Dichiaro di aver letto e accetto integralmente i presenti termini e condizioni di assistenza.`;

type Props = {
  token: string;
  estimatedCost: number;
  accepted: boolean;
  rejected: boolean;
  primaryColor: string;
  termsAndConditions: string | null;
};

export function QuoteSection({ token, estimatedCost, accepted, rejected, primaryColor, termsAndConditions }: Props) {
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<"quote" | "terms" | "accepted" | "rejected">(
    accepted ? "accepted" : rejected ? "rejected" : "quote",
  );
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const terms = termsAndConditions ?? DEFAULT_TERMS;
  const formatted = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(estimatedCost / 100);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    if (atBottom) setScrolledToBottom(true);
  }

  function scrollDown() {
    scrollRef.current?.scrollBy({ top: 300, behavior: "smooth" });
  }

  function handleAccept() {
    startTransition(async () => {
      await acceptQuoteAction(token);
      setPhase("accepted");
    });
  }

  function handleReject() {
    if (!confirm("Sei sicuro di voler rifiutare il preventivo? Il centro sarà avvisato.")) return;
    startTransition(async () => {
      await rejectQuoteAction(token);
      setPhase("rejected");
    });
  }

  if (phase === "accepted") {
    return (
      <div className="rounded-2xl bg-emerald-50 p-5 shadow-sm border border-emerald-200">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800">Preventivo accettato ✅</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Hai autorizzato la riparazione per <strong>{formatted}</strong> e accettato i termini e condizioni. Procederemo a breve!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "rejected") {
    return (
      <div className="rounded-2xl bg-red-50 p-5 shadow-sm border border-red-200">
        <div className="flex items-start gap-3">
          <XCircle className="h-6 w-6 shrink-0 text-red-500 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Riparazione non autorizzata</p>
            <p className="text-sm text-red-700 mt-0.5">Hai rifiutato il preventivo. Contattaci per discutere alternative.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Fase T&C ─────────────────────────────────────────────────────────────
  if (phase === "terms") {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
          <p className="font-semibold text-foreground">Termini e Condizioni</p>
        </div>

        <p className="text-xs text-muted-foreground">
          Leggi attentamente i termini prima di procedere. Scorri fino in fondo per poter accettare.
        </p>

        {/* Scrollable T&C box */}
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-64 overflow-y-auto rounded-xl border bg-slate-50 p-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono"
          >
            {terms}
          </div>

          {/* Freccia "scorri" visibile finché non arriva in fondo */}
          {!scrolledToBottom && (
            <button
              onClick={scrollDown}
              className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white border px-2 py-1 text-xs text-muted-foreground shadow-sm animate-bounce"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Scorri
            </button>
          )}
        </div>

        {/* Checkbox — disabilitata finché non ha scrollato */}
        <label className={`flex items-start gap-3 cursor-pointer rounded-xl border p-3 transition-colors ${scrolledToBottom ? "hover:bg-slate-50" : "opacity-40 pointer-events-none"}`}>
          <input
            type="checkbox"
            checked={termsChecked}
            onChange={(e) => setTermsChecked(e.target.checked)}
            disabled={!scrolledToBottom}
            className="mt-0.5 h-4 w-4 shrink-0 accent-current"
            style={{ accentColor: primaryColor }}
          />
          <span className="text-sm font-medium text-foreground">
            Ho letto e accetto integralmente i termini e condizioni di assistenza. Autorizzo la riparazione per <strong>{formatted}</strong>.
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPhase("quote")}
            disabled={isPending}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            ← Torna indietro
          </button>
          <button
            onClick={handleAccept}
            disabled={!termsChecked || isPending}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30"
            style={{ backgroundColor: primaryColor }}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Conferma e firma
          </button>
        </div>
      </div>
    );
  }

  // ── Fase preventivo ───────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: primaryColor + "20" }}>
          <Euro className="h-4 w-4" style={{ color: primaryColor }} />
        </div>
        <p className="font-semibold text-foreground">Preventivo ricevuto</p>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Abbiamo completato la diagnosi del tuo dispositivo. Ecco il costo stimato della riparazione:
      </p>

      <div className="rounded-xl px-5 py-4 text-center mb-5" style={{ backgroundColor: primaryColor + "12" }}>
        <p className="text-3xl font-bold" style={{ color: primaryColor }}>{formatted}</p>
        <p className="text-xs text-muted-foreground mt-1">Costo stimato riparazione (IVA inclusa)</p>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Cliccando "Autorizza" potrai leggere e accettare i termini e condizioni prima di confermare.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleReject}
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
          Non autorizzare
        </button>
        <button
          onClick={() => setPhase("terms")}
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          <CheckCircle2 className="h-4 w-4" />
          Autorizza
        </button>
      </div>
    </div>
  );
}
