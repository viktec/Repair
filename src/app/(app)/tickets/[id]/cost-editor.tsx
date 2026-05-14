"use client";

import { useState, useTransition } from "react";
import { updateTicketCostAction, rejectQuoteAction } from "../actions";
import { Pencil, Check, X, Loader2, Copy, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuoteType = "definitive" | "provisional";

type Props = {
  ticketId: string;
  estimatedCost: number | null;
  finalCost: number | null;
  depositCents: number | null;
  quoteType: QuoteType;
  accepted: boolean;
  rejected: boolean;
  customerPhone: string | null;
  customerName: string | null;
  orgName: string | null;
  orgPhone: string | null;
};

function fmt(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function toInput(cents: number | null) {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

const DISCLAIMER_DEFINITIVE =
  "Il preventivo indicato si riferisce esclusivamente alle lavorazioni e ai ricambi descritti nel presente documento. Eventuali ulteriori problematiche riscontrate durante la riparazione saranno comunicate preventivamente al cliente prima di procedere.";

const DISCLAIMER_PROVISIONAL =
  "⚠️ Preventivo provvisorio — I costi indicati si riferiscono esclusivamente alle lavorazioni descritte. In fase di riparazione potrebbero emergere ulteriori danni non visibili in questa fase diagnostica, che verranno comunicati e preventivati separatamente prima di procedere.";

export function CostEditor({
  ticketId,
  estimatedCost,
  finalCost,
  depositCents,
  quoteType,
  accepted,
  rejected,
  customerPhone,
  customerName,
  orgName,
  orgPhone,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [estValue, setEstValue] = useState(toInput(estimatedCost));
  const [finalValue, setFinalValue] = useState(toInput(finalCost));
  const [depositValue, setDepositValue] = useState(toInput(depositCents));
  const [currentQuoteType, setCurrentQuoteType] = useState<QuoteType>(quoteType);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateTicketCostAction(ticketId, estValue, finalValue, depositValue, currentQuoteType);
      setEditing(false);
    });
  }

  function handleReject() {
    if (!window.confirm("Segnare il preventivo come rifiutato? Il ticket verrà escluso dal fatturato.")) return;
    startTransition(async () => {
      await rejectQuoteAction(ticketId);
    });
  }

  function handleCancel() {
    setEstValue(toInput(estimatedCost));
    setFinalValue(toInput(finalCost));
    setDepositValue(toInput(depositCents));
    setCurrentQuoteType(quoteType);
    setEditing(false);
  }

  const inputCls =
    "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  const base = finalCost ?? estimatedCost;
  const saldo = base != null && depositCents != null ? base - depositCents : null;

  // Deposit request message
  const depositAmountCents = estimatedCost ? Math.ceil(estimatedCost / 2) : null;
  const depositFormatted = depositAmountCents ? fmt(depositAmountCents) : null;
  const depositWaText = depositFormatted && customerName
    ? `Gentile ${customerName},\n\nper procedere con la riparazione del suo dispositivo è richiesto un acconto pari al 50% del preventivo (${depositFormatted}).\n\nLa preghiamo di passare in negozio per versare l'acconto prima che venga avviata la lavorazione.\n\nGrazie,\n${orgName ?? ""}\n${orgPhone ?? ""}`.trim()
    : null;

  async function copyDepositText() {
    if (!depositWaText) return;
    await navigator.clipboard.writeText(depositWaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openDepositWa() {
    if (!depositWaText) return;
    const phone = customerPhone ? customerPhone.replace(/\D/g, "") : "";
    const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(depositWaText)}`, "_blank");
  }

  if (editing) {
    return (
      <div className="space-y-4">
        {/* Quote type toggle */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo preventivo</p>
          <div className="flex gap-2">
            {(["definitive", "provisional"] as QuoteType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCurrentQuoteType(t)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  currentQuoteType === t
                    ? t === "provisional"
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {t === "definitive" ? "Definitivo" : "Provvisorio"}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preventivo (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={estValue}
              onChange={(e) => setEstValue(e.target.value)}
              placeholder="0.00"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Costo finale (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={finalValue}
              onChange={(e) => setFinalValue(e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Acconto (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={depositValue}
              onChange={(e) => setDepositValue(e.target.value)}
              placeholder="0.00"
              className={inputCls}
            />
          </div>
        </div>

        {/* Disclaimer preview */}
        <div className={`rounded-md border p-3 text-xs leading-relaxed ${
          currentQuoteType === "provisional"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-slate-200 bg-slate-50 text-slate-600"
        }`}>
          {currentQuoteType === "provisional" ? DISCLAIMER_PROVISIONAL : DISCLAIMER_DEFINITIVE}
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending} className="gap-1.5">
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Salva
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Annulla
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quote type badge */}
      {estimatedCost != null && (
        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          quoteType === "provisional"
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-slate-50 text-slate-600 border border-slate-200"
        }`}>
          {quoteType === "provisional" ? "⚠️ Preventivo provvisorio" : "✓ Preventivo definitivo"}
        </div>
      )}

      {/* Cost row */}
      <div className="flex gap-8 flex-wrap items-start">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preventivo</p>
            <button
              onClick={() => setEditing(true)}
              className="rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground"
              title="Modifica prezzi"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-1 font-medium">
            {estimatedCost != null ? fmt(estimatedCost) : <span className="italic text-muted-foreground">Non impostato</span>}
          </p>
          {estimatedCost != null && (
            <div className="mt-1">
              {accepted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  ✅ Accettato dal cliente
                </span>
              )}
              {rejected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  ❌ Rifiutato dal cliente
                </span>
              )}
              {!accepted && !rejected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  ⏳ In attesa risposta
                </span>
              )}
            </div>
          )}
          {estimatedCost != null && !accepted && !rejected && (
            <button
              onClick={handleReject}
              disabled={isPending}
              className="mt-2 text-xs text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
            >
              Rifiutato / Riconsegnato
            </button>
          )}
          {estimatedCost == null && (
            <button
              onClick={() => setEditing(true)}
              className="mt-1 text-xs text-primary underline-offset-2 hover:underline"
            >
              + Aggiungi preventivo
            </button>
          )}
        </div>

        {finalCost != null && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Costo finale</p>
            <p className="mt-1 font-medium">{fmt(finalCost)}</p>
          </div>
        )}

        {depositCents != null && depositCents > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acconto</p>
            <p className="mt-1 font-medium text-emerald-700">{fmt(depositCents)}</p>
          </div>
        )}

        {depositCents == null && (
          <button
            onClick={() => setEditing(true)}
            className="mt-5 text-xs text-muted-foreground underline-offset-2 hover:underline hover:text-foreground"
          >
            + Aggiungi acconto
          </button>
        )}
      </div>

      {/* Saldo */}
      {saldo != null && (
        <div className="rounded-lg border bg-slate-50 px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Saldo da pagare</span>
          <span className={`text-base font-bold ${saldo <= 0 ? "text-emerald-700" : "text-foreground"}`}>
            {saldo <= 0 ? "Saldato ✅" : fmt(saldo)}
          </span>
        </div>
      )}

      {/* Disclaimer */}
      {estimatedCost != null && (
        <div className={`rounded-md border p-3 text-xs leading-relaxed ${
          quoteType === "provisional"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-slate-200 bg-slate-50 text-slate-600"
        }`}>
          {quoteType === "provisional" ? DISCLAIMER_PROVISIONAL : DISCLAIMER_DEFINITIVE}
        </div>
      )}

      {/* Deposit request (remote) */}
      {estimatedCost != null && depositAmountCents != null && finalCost == null && (depositCents == null || depositCents === 0) && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-800">Richiesta acconto (50%)</p>
          <pre className="whitespace-pre-wrap text-xs text-blue-900 font-sans leading-relaxed">
            {depositWaText}
          </pre>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 border-blue-300 text-blue-700 hover:bg-blue-100" onClick={copyDepositText}>
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copiato!" : "Copia testo"}
            </Button>
            {customerPhone && (
              <Button size="sm" className="gap-1.5 text-xs h-7 bg-green-600 hover:bg-green-700" onClick={openDepositWa}>
                <MessageSquare className="h-3 w-3" />
                Apri WhatsApp
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
