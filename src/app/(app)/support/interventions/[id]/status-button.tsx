"use client";

import { useState, useTransition } from "react";
import { updateInterventionStatusAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

const STATUSES = [
  { value: "open", label: "Aperto" },
  { value: "in_progress", label: "In corso" },
  { value: "completed", label: "Completato" },
] as const;

export function StatusButton({
  interventionId,
  currentStatus,
}: {
  interventionId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(newStatus: string) {
    setStatus(newStatus);
    startTransition(async () => {
      await updateInterventionStatusAction(interventionId, newStatus);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => handleChange(s.value)}
          disabled={isPending || status === s.value}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default ${
            status === s.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {isPending && status !== s.value ? null : status === s.value ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          {isPending && status === s.value ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {s.label}
        </button>
      ))}
    </div>
  );
}
