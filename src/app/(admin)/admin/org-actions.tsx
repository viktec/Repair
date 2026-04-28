"use client";

import { useState, useTransition } from "react";
import { updateOrgPlanAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Loader2 } from "lucide-react";

type Plan = "solo" | "pro" | "business";
type Status = "trial" | "active" | "past_due" | "canceled";

export function AdminOrgActions({
  orgId,
  currentPlan,
  currentStatus,
  currentNotes,
}: {
  orgId: string;
  currentPlan: Plan;
  currentStatus: Status;
  currentNotes: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [plan, setPlan] = useState(currentPlan);
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes);

  function handleSave() {
    startTransition(async () => {
      await updateOrgPlanAction(orgId, plan, status, notes);
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1500);
    });
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(!open)}>
        Gestisci <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-64 rounded-lg border bg-white p-4 shadow-lg space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Piano</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as Plan)}
              className="w-full rounded border px-2 py-1.5 text-sm"
            >
              <option value="solo">Solo</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Stato</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded border px-2 py-1.5 text-sm"
            >
              <option value="trial">Trial</option>
              <option value="active">Attivo</option>
              <option value="past_due">Scaduto</option>
              <option value="canceled">Cancellato</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Note admin</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note interne..."
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 gap-1" onClick={handleSave} disabled={isPending}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
              {saved ? "Salvato!" : "Salva"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
          </div>
        </div>
      )}
    </div>
  );
}
