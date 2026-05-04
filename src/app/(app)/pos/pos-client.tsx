"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openSessionAction, closeSessionAction } from "./actions";
import { Loader2 } from "lucide-react";

// ─── Apri sessione ────────────────────────────────────────────────────────────

export function OpenSessionButton() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(value || "0") * 100);
    startTransition(async () => {
      const res = await openSessionAction(cents);
      if (res && "error" in res) {
        setError(res.error ?? "Errore sconosciuto");
      } else {
        setOpen(false);
        setError(null);
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="default">
        Apri cassa
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="opening-float">Fondo cassa iniziale (€)</Label>
        <Input
          id="opening-float"
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-40"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Conferma apertura
        </Button>
        <Button type="button" variant="outline" onClick={() => { setOpen(false); setError(null); }}>
          Annulla
        </Button>
      </div>
    </form>
  );
}

// ─── Chiudi sessione (Report Z) ───────────────────────────────────────────────

interface CloseSessionButtonProps {
  sessionId: string;
  openingCashCents: number;
  totalCashCents: number;
}

export function CloseSessionButton({ sessionId, openingCashCents, totalCashCents }: CloseSessionButtonProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(
    ((openingCashCents + totalCashCents) / 100).toFixed(2)
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(value || "0") * 100);
    startTransition(async () => {
      const res = await closeSessionAction(sessionId, cents, notes);
      if (res && "error" in res) {
        setError(res.error ?? "Errore sconosciuto");
      } else if (res && "sessionId" in res) {
        router.push(`/pos/sessions/${res.sessionId}/report-z`);
      } else {
        setOpen(false);
        setError(null);
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="destructive">
        Chiudi cassa (Z)
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-card p-4">
      <p className="text-sm font-medium text-destructive">Chiusura cassa — Report Z</p>
      <div className="space-y-1.5">
        <Label htmlFor="closing-float">Fondo cassa finale contato (€)</Label>
        <Input
          id="closing-float"
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-40"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="close-notes">Note (opzionale)</Label>
        <Input
          id="close-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="es. discrepanza banconote..."
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} variant="destructive" className="gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Conferma chiusura
        </Button>
        <Button type="button" variant="outline" onClick={() => { setOpen(false); setError(null); }}>
          Annulla
        </Button>
      </div>
    </form>
  );
}
