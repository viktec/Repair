"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { seedDefaultPackagesAction } from "./packages/actions";

export function SeedPackagesButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSeed() {
    startTransition(async () => {
      const result = await seedDefaultPackagesAction();
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleSeed} disabled={isPending} variant="default" size="sm" className="gap-2 shrink-0">
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Carica pacchetti predefiniti
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
