"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { deletePackageAction, togglePackageActiveAction } from "./actions";

export function PackageActions({ id, isActive, name }: { id: string; isActive: boolean; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`Eliminare il pacchetto "${name}"? L'operazione è irreversibile.`)) return;
    startTransition(async () => {
      const result = await deletePackageAction(id);
      if (result?.error) setError(result.error);
    });
  }

  function handleToggle() {
    startTransition(async () => {
      await togglePackageActiveAction(id, !isActive);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-600 max-w-[200px] text-right">{error}</span>}
      <Button variant="ghost" size="sm" onClick={handleToggle} disabled={isPending}>
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (isActive ? "Disattiva" : "Attiva")}
      </Button>
      <Link href={`/support/packages/${id}/edit`}>
        <Button variant="outline" size="sm">Modifica</Button>
      </Link>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete} disabled={isPending}>
        Elimina
      </Button>
    </div>
  );
}
