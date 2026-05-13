"use client";

import { useState, useTransition } from "react";
import { updateTicketCostAction } from "../actions";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  ticketId: string;
  estimatedCost: number | null;
  finalCost: number | null;
  depositCents: number | null;
  accepted: boolean;
  rejected: boolean;
};

function fmt(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function toInput(cents: number | null) {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

export function CostEditor({ ticketId, estimatedCost, finalCost, depositCents, accepted, rejected }: Props) {
  const [editing, setEditing] = useState(false);
  const [estValue, setEstValue] = useState(toInput(estimatedCost));
  const [finalValue, setFinalValue] = useState(toInput(finalCost));
  const [depositValue, setDepositValue] = useState(toInput(depositCents));
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateTicketCostAction(ticketId, estValue, finalValue, depositValue);
      setEditing(false);
    });
  }

  function handleCancel() {
    setEstValue(toInput(estimatedCost));
    setFinalValue(toInput(finalCost));
    setDepositValue(toInput(depositCents));
    setEditing(false);
  }

  const inputCls =
    "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  // Saldo: base is finalCost if set, otherwise estimatedCost
  const base = finalCost ?? estimatedCost;
  const saldo = base != null && depositCents != null ? base - depositCents : null;

  if (editing) {
    return (
      <div className="space-y-3">
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

      {saldo != null && (
        <div className="rounded-lg border bg-slate-50 px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Saldo da pagare</span>
          <span className={`text-base font-bold ${saldo <= 0 ? "text-emerald-700" : "text-foreground"}`}>
            {saldo <= 0 ? "Saldato ✅" : fmt(saldo)}
          </span>
        </div>
      )}
    </div>
  );
}
