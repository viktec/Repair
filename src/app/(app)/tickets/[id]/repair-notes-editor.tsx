"use client";

import { useState, useTransition } from "react";
import { updateRepairNotesAction } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Loader2, Check } from "lucide-react";

export function RepairNotesEditor({
  ticketId,
  initialNotes,
}: {
  ticketId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateRepairNotesAction(ticketId, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const isDirty = notes !== initialNotes;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Diagnosi / Note riparazione
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Descrivi la diagnosi effettuata, i componenti sostituiti, le operazioni eseguite… Queste note appaiono sulla ricevuta cliente."
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Visibili sulla ricevuta cliente</p>
          <Button
            size="sm"
            variant={saved ? "default" : "outline"}
            onClick={handleSave}
            disabled={isPending || !isDirty}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <Check className="h-3.5 w-3.5" />
            ) : null}
            {saved ? "Salvato" : "Salva"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
