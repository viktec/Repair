"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, Printer, ShoppingCart } from "lucide-react";
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
  supplierId: string | null;
  supplierName: string | null;
  costFormatted: string | null;
  sellFormatted: string | null;
};

type SupplierGroup = {
  supplierId: string;
  supplierName: string;
  itemIds: string[];
};

function openLabels(ids: string[]) {
  window.open(`/print/labels?ids=${ids.join(",")}`, "_blank");
}

function buildSupplierGroups(items: InventoryItem[], selected: Set<string>): SupplierGroup[] {
  const map = new Map<string, SupplierGroup>();
  for (const item of items) {
    if (!selected.has(item.id) || !item.supplierId || !item.supplierName) continue;
    if (!map.has(item.supplierId)) {
      map.set(item.supplierId, { supplierId: item.supplierId, supplierName: item.supplierName, itemIds: [] });
    }
    map.get(item.supplierId)!.itemIds.push(item.id);
  }
  return Array.from(map.values());
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
  const supplierGroups = buildSupplierGroups(items, selected);
  const selectedWithoutSupplier = Array.from(selected).filter(
    (id) => !items.find((it) => it.id === id)?.supplierId,
  ).length;

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
                  ref={(el) => { if (el) el.indeterminate = indeterminate; }}
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
              const isZero = item.quantity === 0;
              const isLow = !isZero && item.quantity <= item.minQuantity && item.minQuantity > 0;
              const isChecked = selected.has(item.id);
              return (
                <tr
                  key={item.id}
                  className={`border-b last:border-0 hover:bg-slate-50/50 ${
                    isChecked ? "bg-primary/5" : isZero ? "bg-red-50/40" : ""
                  }`}
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
                    {isZero ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Esaurito
                        </span>
                        {item.minQuantity > 0 && (
                          <p className="text-[10px] text-muted-foreground">min: {item.minQuantity}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`font-bold ${isLow ? "text-amber-600" : "text-foreground"}`}>
                          {item.quantity}
                        </span>
                        {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        {item.minQuantity > 0 && (
                          <p className="hidden" />
                        )}
                      </div>
                    )}
                    {!isZero && item.minQuantity > 0 && (
                      <p className="text-[10px] text-muted-foreground">min: {item.minQuantity}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.costFormatted ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{item.sellFormatted ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {item.supplierName ?? <span className="italic text-slate-400">—</span>}
                  </td>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-3 rounded-xl border bg-white px-5 py-3 shadow-lg max-w-[90vw]">
          <span className="text-sm font-medium text-foreground">
            {selected.size} {selected.size === 1 ? "articolo" : "articoli"} selezionati
          </span>

          {/* Etichette */}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => openLabels(Array.from(selected))}
          >
            <Printer className="h-3.5 w-3.5" />
            Stampa etichette
          </Button>

          {/* Crea ordine per fornitore */}
          {supplierGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ShoppingCart className="h-3.5 w-3.5" /> Crea ordine:
              </span>
              {supplierGroups.map((g) => (
                <Link
                  key={g.supplierId}
                  href={`/suppliers/${g.supplierId}/orders/new?itemIds=${g.itemIds.join(",")}`}
                >
                  <Button size="sm" className="gap-1.5 h-7 text-xs">
                    {g.supplierName}
                    <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                      {g.itemIds.length}
                    </span>
                  </Button>
                </Link>
              ))}
              {selectedWithoutSupplier > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  +{selectedWithoutSupplier} senza fornitore
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            Annulla
          </button>
        </div>
      )}
    </div>
  );
}
