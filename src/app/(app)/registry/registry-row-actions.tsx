"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRegistryEntryAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export function RegistryRowActions({ entryId }: { entryId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Eliminare questa registrazione? L'operazione non è reversibile.")) return;
    startTransition(async () => {
      await deleteRegistryEntryAction(entryId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/registry/${entryId}/edit`}>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </Link>
      <Button
        size="icon" variant="ghost"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
        disabled={isPending}
        onClick={handleDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
