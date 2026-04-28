"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Stampa / Salva PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
