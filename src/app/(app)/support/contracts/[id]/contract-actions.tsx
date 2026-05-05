"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { updateContractNotesAction, updateContractStatusAction } from "../actions";

type Status = "active" | "expired" | "exhausted" | "suspended";

export function ContractActions({
  id,
  status,
  currentNotes,
}: {
  id: string;
  status: string;
  currentNotes: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(currentNotes);

  function handleStatusChange(newStatus: Status) {
    startTransition(async () => {
      await updateContractStatusAction(id, newStatus);
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      await updateContractNotesAction(id, notes);
      setShowNotes(false);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2 flex-wrap justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowNotes(!showNotes)} disabled={isPending}>
          Modifica note
        </Button>
        {status === "active" && (
          <Button
            variant="outline"
            size="sm"
            className="text-amber-700 border-amber-300 hover:bg-amber-50"
            onClick={() => handleStatusChange("suspended")}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sospendi"}
          </Button>
        )}
        {status === "suspended" && (
          <Button
            variant="outline"
            size="sm"
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            onClick={() => handleStatusChange("active")}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Riattiva"}
          </Button>
        )}
      </div>

      {showNotes && (
        <div className="w-full max-w-sm space-y-2 mt-1">
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note sul contratto..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowNotes(false)}>Annulla</Button>
            <Button size="sm" onClick={handleSaveNotes} disabled={isPending} className="gap-1.5">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Salva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
