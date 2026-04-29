"use client";

import { useTransition, useState } from "react";
import { acceptQuoteAction, rejectQuoteAction } from "./actions";
import { CheckCircle2, XCircle, Loader2, Euro } from "lucide-react";

type Props = {
  token: string;
  estimatedCost: number;
  accepted: boolean;
  rejected: boolean;
  primaryColor: string;
};

export function QuoteSection({ token, estimatedCost, accepted, rejected, primaryColor }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localState, setLocalState] = useState<"idle" | "accepted" | "rejected">(
    accepted ? "accepted" : rejected ? "rejected" : "idle",
  );

  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(estimatedCost / 100);

  function handleAccept() {
    startTransition(async () => {
      await acceptQuoteAction(token);
      setLocalState("accepted");
    });
  }

  function handleReject() {
    if (!confirm("Sei sicuro di voler rifiutare il preventivo? Il negozio sarà avvisato.")) return;
    startTransition(async () => {
      await rejectQuoteAction(token);
      setLocalState("rejected");
    });
  }

  if (localState === "accepted") {
    return (
      <div className="rounded-2xl bg-emerald-50 p-5 shadow-sm border border-emerald-200">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-800">Preventivo accettato ✅</p>
            <p className="text-sm text-emerald-700">
              Hai autorizzato la riparazione per <strong>{formatted}</strong>. Procederemo a breve!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (localState === "rejected") {
    return (
      <div className="rounded-2xl bg-red-50 p-5 shadow-sm border border-red-200">
        <div className="flex items-center gap-3">
          <XCircle className="h-6 w-6 shrink-0 text-red-500" />
          <div>
            <p className="font-semibold text-red-800">Riparazione non autorizzata</p>
            <p className="text-sm text-red-700">
              Hai rifiutato il preventivo. Contattaci per discutere alternative.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: primaryColor + "20" }}
        >
          <Euro className="h-4 w-4" style={{ color: primaryColor }} />
        </div>
        <p className="font-semibold text-foreground">Preventivo ricevuto</p>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Abbiamo completato la diagnosi del tuo dispositivo. Ecco il costo stimato della riparazione:
      </p>

      <div
        className="rounded-xl px-5 py-4 text-center mb-5"
        style={{ backgroundColor: primaryColor + "12" }}
      >
        <p className="text-3xl font-bold" style={{ color: primaryColor }}>{formatted}</p>
        <p className="text-xs text-muted-foreground mt-1">Costo stimato riparazione</p>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Puoi autorizzare la riparazione direttamente da qui, oppure contattarci per maggiori informazioni.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleReject}
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Non autorizzare
        </button>
        <button
          onClick={handleAccept}
          disabled={isPending}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Autorizza
        </button>
      </div>
    </div>
  );
}
