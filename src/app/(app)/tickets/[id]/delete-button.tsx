"use client";

import { useTransition } from "react";
import { deleteTicketAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteTicketButton({ ticketId }: { ticketId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Eliminare questo ticket? L'operazione non può essere annullata.")) return;
    startTransition(() => deleteTicketAction(ticketId));
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-destructive hover:bg-destructive hover:text-white border-destructive/30"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">Elimina</span>
    </Button>
  );
}
