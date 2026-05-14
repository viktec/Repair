"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function ReceiptPrintButtons() {
  function printA4() {
    window.print();
  }

  function printThermal() {
    const style = document.createElement("style");
    style.textContent = "@page { size: 58mm auto; margin: 0; }";
    document.head.appendChild(style);
    document.body.classList.add("thermal-print");
    window.addEventListener("afterprint", () => {
      document.body.classList.remove("thermal-print");
      style.remove();
    }, { once: true });
    window.print();
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" className="gap-2" onClick={printA4}>
        <Printer className="h-4 w-4" />
        Stampa A4
      </Button>
      <Button variant="outline" className="gap-2" onClick={printThermal}>
        <Printer className="h-4 w-4" />
        Stampa termica
      </Button>
    </div>
  );
}
