"use client";

import { useState, useTransition } from "react";
import { updateOrgPlanAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Settings } from "lucide-react";

type Plan = "solo" | "pro" | "business";
type Status = "trial" | "active" | "past_due" | "canceled";

export function OrgEditForm({
  orgId,
  currentPlan,
  currentStatus,
  currentNotes,
  currentTrialEndsAt,
}: {
  orgId: string;
  currentPlan: Plan;
  currentStatus: Status;
  currentNotes: string;
  currentTrialEndsAt: string;
}) {
  const [plan, setPlan] = useState(currentPlan);
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [trialEndsAt, setTrialEndsAt] = useState(currentTrialEndsAt);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateOrgPlanAction(orgId, plan, status, notes, trialEndsAt || null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Impostazioni tenant</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Piano</Label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as Plan)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="solo">Solo</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Stato abbonamento</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="trial">Trial</option>
              <option value="active">Attivo</option>
              <option value="past_due">Scaduto</option>
              <option value="canceled">Cancellato</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Scadenza trial</Label>
          <Input
            type="date"
            value={trialEndsAt}
            onChange={(e) => setTrialEndsAt(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Note admin (interne)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note interne sul cliente..."
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Salvato!" : "Salva modifiche"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
