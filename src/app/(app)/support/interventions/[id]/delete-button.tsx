"use client";

import { useState, useTransition } from "react";
import { deleteInterventionAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteInterventionButton({
  interventionId,
  contractId,
}: {
  interventionId: string;
  contractId: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteInterventionAction(interventionId);
      if (result.error) {
        setError(result.error);
        setConfirm(false);
      } else {
        router.push(`/support/contracts/${contractId}`);
      }
    });
  }

  if (error) {
    return (
      <p className="text-xs text-destructive">{error}</p>
    );
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Conferma annullamento?</span>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="gap-1.5"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Sì, annulla
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>
          No
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-destructive hover:text-destructive hover:border-destructive/50"
      onClick={() => setConfirm(true)}
    >
      <Trash2 className="h-3.5 w-3.5" />
      Annulla intervento
    </Button>
  );
}
