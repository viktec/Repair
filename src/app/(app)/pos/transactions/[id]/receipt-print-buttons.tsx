"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function ReceiptPrintButtons({ transactionId }: { transactionId: string }) {
  const base = `/print/pos/transactions/${transactionId}`;

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" className="gap-2" onClick={() => window.open(base, "_blank")}>
        <Printer className="h-4 w-4" />
        Stampa A4
      </Button>
      <Button variant="outline" className="gap-2" onClick={() => window.open(`${base}?format=thermal`, "_blank")}>
        <Printer className="h-4 w-4" />
        Stampa termica
      </Button>
    </div>
  );
}
