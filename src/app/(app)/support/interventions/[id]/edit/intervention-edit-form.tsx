"use client";

import { useActionState, useState } from "react";
import { updateInterventionAction, type UpdateInterventionState } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { calcBillableMinutes, formatMinutes, type PackageSnapshot } from "@/lib/support-utils";

const TYPES = [
  { value: "onsite", label: "In presenza" },
  { value: "remote", label: "Teleassistenza" },
  { value: "phone", label: "Telefonica" },
  { value: "email", label: "Email" },
  { value: "lab", label: "In laboratorio" },
  { value: "other", label: "Altro" },
] as const;

const DEFAULT_SNAPSHOT: PackageSnapshot = {
  phoneRoundingMinutes: 5,
  remoteRoundingMinutes: 10,
  emailRoundingMinutes: 10,
  callFeeMinutes: 10,
  urgencySurchargePercent: 0,
};

type Props = {
  id: string;
  defaultValues: {
    title: string;
    description: string | null;
    notes: string | null;
    type: string;
    isUrgent: boolean;
    applyCallFee: boolean;
    rawMinutes: number;
    startTime: Date | string | null;
  };
  packageSnapshot: PackageSnapshot | null;
  contractRemainingMinutes: number;
  currentBillableMinutes: number;
};

export function InterventionEditForm({
  id,
  defaultValues,
  packageSnapshot,
  contractRemainingMinutes,
  currentBillableMinutes,
}: Props) {
  const boundAction = updateInterventionAction.bind(null, id);
  const [state, action, pending] = useActionState<UpdateInterventionState, FormData>(boundAction, null);

  const snap = packageSnapshot ?? DEFAULT_SNAPSHOT;
  const [rawMinutes, setRawMinutes] = useState(defaultValues.rawMinutes);
  const [type, setType] = useState(defaultValues.type);
  const [isUrgent, setIsUrgent] = useState(defaultValues.isUrgent);
  const [applyCallFee, setApplyCallFee] = useState(defaultValues.applyCallFee);

  const newBillable = calcBillableMinutes(rawMinutes, type, snap, isUrgent, applyCallFee);
  const diff = newBillable - currentBillableMinutes;
  const newRemaining = contractRemainingMinutes - diff;
  const isOverBudget = newRemaining < 0;

  const startTimeValue = defaultValues.startTime
    ? new Date(defaultValues.startTime).toISOString().slice(0, 16)
    : "";

  const errors = (state && "errors" in state && state.errors) ? state.errors : {};
  const globalError = (state && "error" in state && state.error) ? state.error : null;

  return (
    <form action={action} className="space-y-6">
      {globalError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Titolo *</Label>
        <Input id="title" name="title" defaultValue={defaultValues.title} required maxLength={200} />
        {errors.title && <p className="text-xs text-destructive">{errors.title[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <textarea id="description" name="description" defaultValue={defaultValues.description ?? ""} rows={3} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
      </div>

      {/* Tipo */}
      <div className="space-y-2">
        <Label>Tipo intervento *</Label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <label
              key={t.value}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                type === t.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t.value}
                className="sr-only"
                checked={type === t.value}
                onChange={() => setType(t.value)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {/* Diritto di chiamata */}
      {["phone", "remote", "email"].includes(type) && snap.callFeeMinutes > 0 && (
        <div className="flex items-center gap-3">
          <input
            id="applyCallFee"
            name="applyCallFee"
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={applyCallFee}
            onChange={(e) => setApplyCallFee(e.target.checked)}
          />
          <label htmlFor="applyCallFee" className="text-sm cursor-pointer">
            Applica diritto di chiamata
            <span className="ml-1.5 text-xs text-muted-foreground">(+{formatMinutes(snap.callFeeMinutes)})</span>
          </label>
        </div>
      )}

      {/* Urgenza */}
      <div className="flex items-center gap-3">
        <input
          id="isUrgent"
          name="isUrgent"
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={isUrgent}
          onChange={(e) => setIsUrgent(e.target.checked)}
        />
        <Label htmlFor="isUrgent" className="cursor-pointer">
          Intervento urgente
          {isUrgent && snap.urgencySurchargePercent > 0 && (
            <span className="ml-2 text-xs text-amber-600">(+{snap.urgencySurchargePercent}% maggiorazione)</span>
          )}
        </Label>
      </div>

      {/* Minuti */}
      <div className="space-y-2">
        <Label htmlFor="rawMinutes">Durata effettiva (minuti) *</Label>
        <Input
          id="rawMinutes"
          name="rawMinutes"
          type="number"
          min={1}
          step={1}
          value={rawMinutes}
          onChange={(e) => setRawMinutes(Math.max(1, parseInt(e.target.value) || 1))}
          required
        />
        {errors.rawMinutes && <p className="text-xs text-destructive">{errors.rawMinutes[0]}</p>}
      </div>

      {/* Preview differenza */}
      {rawMinutes > 0 && (
        <div className={`rounded-lg border p-3 text-sm space-y-1 ${isOverBudget ? "border-red-300 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-2">Riepilogo modifica</p>
          <div className="flex justify-between text-xs">
            <span className="text-blue-700">Minuti scalati prima</span>
            <span className="font-medium text-blue-900">{formatMinutes(currentBillableMinutes)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-blue-700">Minuti scalati dopo</span>
            <span className="font-medium text-blue-900">{formatMinutes(newBillable)}</span>
          </div>
          {diff !== 0 && (
            <div className="flex justify-between text-xs border-t border-blue-200 pt-1 mt-1">
              <span className="text-blue-700">Differenza</span>
              <span className={`font-bold ${diff > 0 ? "text-red-700" : "text-green-700"}`}>
                {diff > 0 ? "+" : ""}{formatMinutes(diff)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs border-t border-blue-200 pt-1">
            <span className="text-blue-700">Ore rimaste dopo</span>
            <span className={`font-bold ${isOverBudget ? "text-red-700" : "text-blue-900"}`}>
              {isOverBudget ? "Saldo negativo!" : formatMinutes(newRemaining)}
            </span>
          </div>
          {isOverBudget && (
            <p className="flex items-center gap-1 text-xs text-red-700 font-medium mt-1">
              <AlertTriangle className="h-3 w-3" />
              Supera i minuti disponibili
            </p>
          )}
        </div>
      )}

      {/* Data/ora */}
      <div className="space-y-2">
        <Label htmlFor="occurredAt">Data e ora intervento</Label>
        <Input id="occurredAt" name="occurredAt" type="datetime-local" defaultValue={startTimeValue} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Note interne</Label>
        <textarea id="notes" name="notes" defaultValue={defaultValues.notes ?? ""} rows={2} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salva modifiche
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Annulla
        </Button>
      </div>
    </form>
  );
}
