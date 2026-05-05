"use client";

import { useActionState, useState, useRef, useTransition, useEffect } from "react";
import { createInterventionAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, ImagePlus, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { calcBillableMinutes, formatMinutes, type PackageSnapshot } from "@/lib/support-utils";

// ─── Tipi ────────────────────────────────────────────────────────────────────

type Contract = {
  id: string;
  contractNumber: string;
  customerName: string;
  totalMinutes: number;
  usedMinutes: number;
  status: string;
  packageSnapshot: PackageSnapshot | null;
};

type Props = {
  contracts: Contract[];
  preselectedContractId?: string;
};

const TYPES = [
  { value: "onsite", label: "In presenza", icon: "🏢" },
  { value: "remote", label: "Teleassistenza", icon: "💻" },
  { value: "phone", label: "Telefonica", icon: "📞" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "lab", label: "In laboratorio", icon: "🔧" },
  { value: "other", label: "Altro", icon: "📋" },
] as const;

const DEFAULT_SNAPSHOT: PackageSnapshot = {
  phoneRoundingMinutes: 5,
  remoteRoundingMinutes: 10,
  emailRoundingMinutes: 10,
  callFeeMinutes: 10,
  urgencySurchargePercent: 0,
};

// ─── Preview minuti ───────────────────────────────────────────────────────────

function MinutesPreview({
  rawMinutes,
  type,
  isUrgent,
  snapshot,
  remainingBefore,
}: {
  rawMinutes: number;
  type: string;
  isUrgent: boolean;
  snapshot: PackageSnapshot;
  remainingBefore: number;
}) {
  if (rawMinutes <= 0) return null;

  let rounded = rawMinutes;
  let roundingStep = 0;
  if (type === "phone") { roundingStep = snapshot.phoneRoundingMinutes; rounded = Math.ceil(rawMinutes / roundingStep) * roundingStep; }
  else if (type === "remote") { roundingStep = snapshot.remoteRoundingMinutes; rounded = Math.ceil(rawMinutes / roundingStep) * roundingStep; }
  else if (type === "email") { roundingStep = snapshot.emailRoundingMinutes; rounded = Math.ceil(rawMinutes / roundingStep) * roundingStep; }

  const withCallFee = rounded + snapshot.callFeeMinutes;
  let urgencyAdd = 0;
  let total = withCallFee;
  if (isUrgent && snapshot.urgencySurchargePercent > 0) {
    total = Math.ceil(withCallFee * (1 + snapshot.urgencySurchargePercent / 100));
    urgencyAdd = total - withCallFee;
  }

  const remainingAfter = Math.max(0, remainingBefore - total);
  const isOverBudget = total > remainingBefore;

  return (
    <div className={`rounded-lg border p-3 space-y-1.5 text-sm ${isOverBudget ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-2">
        Riepilogo minuti
      </p>
      <Row label="Durata effettiva" value={formatMinutes(rawMinutes)} />
      {roundingStep > 0 && rounded !== rawMinutes && (
        <Row label={`Dopo arrotondamento (ogni ${roundingStep} min)`} value={formatMinutes(rounded)} />
      )}
      {snapshot.callFeeMinutes > 0 && (
        <Row label="Diritto di chiamata" value={`+${formatMinutes(snapshot.callFeeMinutes)}`} />
      )}
      {isUrgent && urgencyAdd > 0 && (
        <Row label={`Maggiorazione urgenza (+${snapshot.urgencySurchargePercent}%)`} value={`+${formatMinutes(urgencyAdd)}`} />
      )}
      <div className="border-t border-amber-300 pt-1.5 mt-1.5">
        <Row label="Totale da scalare" value={formatMinutes(total)} bold />
      </div>
      {isOverBudget ? (
        <p className="flex items-center gap-1 text-xs text-red-700 font-medium mt-1">
          <AlertTriangle className="h-3 w-3" />
          Supera i minuti disponibili ({formatMinutes(remainingBefore)} rimanenti)
        </p>
      ) : (
        <Row label="Ore rimaste dopo" value={formatMinutes(remainingAfter)} />
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-amber-700">{label}</span>
      <span className={`text-amber-900 ${bold ? "font-bold" : "font-medium"}`}>{value}</span>
    </div>
  );
}

// ─── Form principale ──────────────────────────────────────────────────────────

export function InterventionForm({ contracts, preselectedContractId }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createInterventionAction, null);

  const [contractId, setContractId] = useState(preselectedContractId ?? "");
  const [type, setType] = useState<string>("onsite");
  const [isUrgent, setIsUrgent] = useState(false);
  const [durationMode, setDurationMode] = useState<"minutes" | "time">("minutes");
  const [rawMinutesInput, setRawMinutesInput] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [previewPhotos, setPreviewPhotos] = useState<{ name: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Redireziona dopo creazione
  const [, startTransition] = useTransition();
  useEffect(() => {
    if (state && "interventionId" in state) {
      startTransition(() => {
        router.push(`/support/interventions/${state.interventionId}`);
      });
    }
  }, [state, router]);

  const selectedContract = contracts.find((c) => c.id === contractId);
  const snapshot = selectedContract?.packageSnapshot ?? DEFAULT_SNAPSHOT;
  const remainingBefore = selectedContract
    ? Math.max(0, selectedContract.totalMinutes - selectedContract.usedMinutes)
    : 0;

  // Calcola rawMinutes dalla modalità selezionata
  let rawMinutes = 0;
  if (durationMode === "minutes") {
    rawMinutes = parseInt(rawMinutesInput, 10) || 0;
  } else if (startTime && endTime) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    rawMinutes = Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const current = previewPhotos.length;
    const remaining = 5 - current;
    const toAdd = Array.from(files).slice(0, remaining);
    setPreviewPhotos((prev) => [
      ...prev,
      ...toAdd.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    ]);
  }

  function removePhoto(idx: number) {
    setPreviewPhotos((prev) => prev.filter((_, i) => i !== idx));
    // Reset input file così non invierà il file rimosso
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const hasErrors = state && "errors" in state && state.errors;
  const hasError = state && "error" in state && state.error;

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {/* Contratto */}
      <Card>
        <CardHeader><CardTitle className="text-base">Contratto <span className="text-destructive">*</span></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {hasErrors && (state as { errors: Record<string, string[]> }).errors?.contractId && (
            <p className="text-xs text-destructive">{(state as { errors: Record<string, string[]> }).errors.contractId[0]}</p>
          )}
          <input type="hidden" name="contractId" value={contractId} />
          <select
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Seleziona contratto —</option>
            {contracts.map((c) => {
              const remaining = Math.max(0, c.totalMinutes - c.usedMinutes);
              const label = `${c.customerName} · ${c.contractNumber} · ${formatMinutes(remaining)} rimanenti`;
              return (
                <option key={c.id} value={c.id} disabled={c.status === "exhausted"}>
                  {label}{c.status === "exhausted" ? " [ESAURITO]" : ""}
                </option>
              );
            })}
          </select>

          {selectedContract && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <p className="font-medium text-emerald-800">{selectedContract.customerName}</p>
              <p className="text-xs text-emerald-600">
                {selectedContract.contractNumber} · {formatMinutes(remainingBefore)} rimanenti su {formatMinutes(selectedContract.totalMinutes)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipo intervento */}
      <Card>
        <CardHeader><CardTitle className="text-base">Tipo intervento</CardTitle></CardHeader>
        <CardContent>
          <input type="hidden" name="type" value={type} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  type === t.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Urgente */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isUrgent"
                name="isUrgent"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              <Label htmlFor="isUrgent" className="cursor-pointer">Intervento urgente</Label>
            </div>
            {isUrgent && snapshot.urgencySurchargePercent > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                maggiorazione +{snapshot.urgencySurchargePercent}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Durata */}
      <Card>
        <CardHeader><CardTitle className="text-base">Durata <span className="text-destructive">*</span></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <input type="hidden" name="rawMinutes" value={rawMinutes > 0 ? rawMinutes : ""} />

          {/* Tab modalità */}
          <div className="flex rounded-lg border border-input overflow-hidden w-fit">
            <button
              type="button"
              onClick={() => setDurationMode("minutes")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                durationMode === "minutes" ? "bg-primary text-white" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              Inserisci minuti
            </button>
            <button
              type="button"
              onClick={() => setDurationMode("time")}
              className={`px-3 py-1.5 text-sm font-medium border-l transition-colors ${
                durationMode === "time" ? "bg-primary text-white" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              Ora inizio / fine
            </button>
          </div>

          {durationMode === "minutes" ? (
            <div className="space-y-1.5">
              <Label htmlFor="minutesInput">Minuti effettivi</Label>
              <Input
                id="minutesInput"
                type="number"
                min="1"
                max="480"
                placeholder="es. 45"
                value={rawMinutesInput}
                onChange={(e) => setRawMinutesInput(e.target.value)}
                className="max-w-[160px]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Inizio</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">Fine</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              {startTime && endTime && rawMinutes > 0 && (
                <p className="col-span-2 text-xs text-muted-foreground">
                  Durata calcolata: {formatMinutes(rawMinutes)}
                </p>
              )}
            </div>
          )}

          {hasErrors && (state as { errors: Record<string, string[]> }).errors?.rawMinutes && (
            <p className="text-xs text-destructive">{(state as { errors: Record<string, string[]> }).errors.rawMinutes[0]}</p>
          )}

          {/* Preview minuti */}
          {contractId && rawMinutes > 0 && (
            <MinutesPreview
              rawMinutes={rawMinutes}
              type={type}
              isUrgent={isUrgent}
              snapshot={snapshot}
              remainingBefore={remainingBefore}
            />
          )}
        </CardContent>
      </Card>

      {/* Contenuto */}
      <Card>
        <CardHeader><CardTitle className="text-base">Dettagli</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Titolo intervento <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              name="title"
              maxLength={200}
              placeholder="es. Aggiornamento software, risoluzione anomalia rete…"
              required
            />
            {hasErrors && (state as { errors: Record<string, string[]> }).errors?.title && (
              <p className="text-xs text-destructive">{(state as { errors: Record<string, string[]> }).errors.title[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrizione intervento</Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Intervento eseguito: descrizione dettagliata delle attività svolte…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Note aggiuntive</Label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              placeholder="Note interne (non visibili al cliente)…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="occurredAt">Data e ora intervento</Label>
            <Input
              id="occurredAt"
              name="occurredAt"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Foto */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Foto</CardTitle>
            <span className="text-xs text-muted-foreground">{previewPhotos.length}/5</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {previewPhotos.map((p, i) => (
              <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border">
                <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {previewPhotos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 text-muted-foreground hover:border-primary/50 hover:text-primary"
              >
                <ImagePlus className="h-4 w-4" />
                <span className="text-[9px]">Aggiungi</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            name="photos"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* Errore globale */}
      {hasError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(state as { error: string }).error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        {contractId ? (
          <Link href={`/support/contracts/${contractId}`}>
            <Button type="button" variant="outline">Annulla</Button>
          </Link>
        ) : (
          <Link href="/support/interventions">
            <Button type="button" variant="outline">Annulla</Button>
          </Link>
        )}
        <Button type="submit" disabled={pending || !contractId || rawMinutes <= 0} className="gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Salva intervento
        </Button>
      </div>
    </form>
  );
}
