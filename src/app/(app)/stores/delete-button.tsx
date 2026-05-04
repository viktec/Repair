"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteStoreAction } from "./actions";

export function DeleteStoreButton({
  storeId,
  storeName,
  ticketCount,
}: {
  storeId: string;
  storeName: string;
  ticketCount: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (ticketCount > 0) {
    return (
      <Button variant="outline" size="sm" disabled title={`Ha ${ticketCount} ticket associati`}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    );
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteStoreAction(storeId);
      if (result && "error" in result) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={handleDelete}
          className="gap-1"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Conferma
        </Button>
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Annulla
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirming(true)}
      className="text-destructive hover:bg-destructive/5 hover:text-destructive"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
