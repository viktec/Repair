"use client";

import { useTransition } from "react";
import { setPricingVisibleAction } from "./actions";
import { Loader2 } from "lucide-react";

export function PricingToggle({ showPricing }: { showPricing: boolean }) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setPricingVisibleAction(!showPricing);
    });
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Sezione prezzi pubblica</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {showPricing ? "I piani a pagamento sono visibili sul sito marketing." : "Il sito mostra solo \"Prova gratis\", senza prezzi."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={isPending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${
          showPricing ? "bg-primary" : "bg-slate-200"
        }`}
        role="switch"
        aria-checked={showPricing}
      >
        {isPending ? (
          <Loader2 className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin text-white" />
        ) : (
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
              showPricing ? "translate-x-5" : "translate-x-0"
            }`}
          />
        )}
      </button>
    </div>
  );
}
