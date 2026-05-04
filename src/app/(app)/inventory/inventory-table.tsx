"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type InventoryItem = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  quantity: number;
  minQuantity: number;
  costPriceCents: number | null;
  sellPriceCents: number | null;
  location: string | null;
  supplierName: string | null;
  costFormatted: string | null;
  sellFormatted: string | null;
};

function openLabels(ids: string[]) {
  window.open(`/print/labels?ids=${ids.join(",")}`, "_blank");
}

export function InventoryTable({ items }: { items: InventoryItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  }, [items]);

  const allChecked = selected.size === items.length && items.length > 0;
  const indeterminate = selected.size > 0 && selected.size < items.length;

  return (
    <div className="relative">
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = indeterminate;
                  }}
                  onChange={toggleAll}
                  className="accent-primary cursor-pointer"
                  aria-label="Seleziona tutti"
                />
              </th>
              <th className="px-4 py-3">Articolo</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-center">Giacenza</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Vendita</th>
              <th className="px-4 py-3">Fornitore</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.quantity <= item.minQuantity;
              const isChecked = selected.has(item.id);
              return (
                <tr
                  key={item.id}
                  className={`border-b last:border-0 hover:bg-slate-50/50 ${isChecked ? "bg-primary/5" : ""}`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(item.id)}
                      className="accent-primary cursor-pointer"
                      aria-label={`Seleziona ${item.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.name}</p>
                    {item.location && <p className="text-xs text-muted-foreground">📍 {item.location}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.category ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`font-bold ${isLow ? "text-red-600" : "text-foreground"}`}>
                        {item.quantity}
                      </span>
                      {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                    {item.minQuantity > 0 && (
                      <p className="text-[10px] text-muted-foreground">min: {item.minQuantity}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.costFormatted ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{item.sellFormatted ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{item.supplierName ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openLabels([item.id])}
                        title="Stampa etichetta"
                        className="rounded p-1 text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors"
                        aria-label="Stampa etichetta"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <Link href={`/inventory/${item.id}`}>
                        <Button variant="outline" size="sm">Apri</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Barra selezione */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-xl border bg-white px-5 py-3 shadow-lg">
          <span className="text-sm font-medium">
            {selected.size} {selected.size === 1 ? "prodotto selezionato" : "prodotti selezionati"}
          </span>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => openLabels(Array.from(selected))}
          >
            <Printer className="h-4 w-4" />
            Stampa etichette
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Annulla
          </button>
        </div>
      )}
    </div>
  );
}
