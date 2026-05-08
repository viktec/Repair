"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelAppraisalAction, deleteAppraisalAction } from "./[id]/actions";
import { Button } from "@/components/ui/button";
import { Ban, Trash2 } from "lucide-react";
import Link from "next/link";

export function PeriziaRowActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isFinal = ["approved", "rejected", "cancelled"].includes(status);
  const isCancelled = status === "cancelled";

  function handleCancel() {
    if (!confirm("Annullare questa perizia? Il cliente ha rinunciato.")) return;
    startTransition(async () => {
      await cancelAppraisalAction(id);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Eliminare definitivamente questa perizia? L'operazione non è reversibile.")) return;
    startTransition(async () => {
      await deleteAppraisalAction(id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/registry/perizie/${id}`}>
        <Button variant="outline" size="sm">Apri</Button>
      </Link>
      {!isFinal && (
        <Button
          size="icon" variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          disabled={isPending}
          onClick={handleCancel}
          title="Annulla perizia"
        >
          <Ban className="h-3.5 w-3.5" />
        </Button>
      )}
      {isCancelled && (
        <Button
          size="icon" variant="ghost"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          disabled={isPending}
          onClick={handleDelete}
          title="Elimina definitivamente"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
