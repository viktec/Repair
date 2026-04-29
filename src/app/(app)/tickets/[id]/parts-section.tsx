"use client";

import { useState, useTransition } from "react";
import { addPartAction, removePartAction } from "./parts-actions";
import { Package, Plus, Trash2, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Part = {
  id: string;
  description: string;
  quantity: number;
  unitCostCents: number;
  unitSellCents: number;
  inventoryItemId: string | null;
};

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  costPriceCents: number | null;
  sellPriceCents: number | null;
  category: string | null;
};

type Props = {
  ticketId: string;
  initialParts: Part[];
  inventoryItems: InventoryItem[];
  finalCost: number | null;
  vatRate: number;
};

function fmt(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function TicketPartsSection({ ticketId, initialParts, inventoryItems, finalCost, vatRate }: Props) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "inventory" | "manual">("idle");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");
  const [sell, setSell] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered =
    query.length > 1
      ? inventoryItems.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
      : [];

  function selectItem(item: InventoryItem) {
    setSelected(item);
    setQuery(item.name);
    setCost(item.costPriceCents != null ? (item.costPriceCents / 100).toFixed(2) : "0.00");
    setSell(item.sellPriceCents != null ? (item.sellPriceCents / 100).toFixed(2) : "0.00");
  }

  function resetForm() {
    setMode("idle");
    setQuery("");
    setSelected(null);
    setQty("1");
    setCost("");
    setSell("");
    setDesc("");
    setError(null);
  }

  function handleAdd() {
    const description = mode === "inventory" ? (selected?.name ?? query.trim()) : desc.trim();
    const quantity = parseInt(qty, 10);
    const unitCostCents = Math.round(parseFloat(cost || "0") * 100);
    const unitSellCents = Math.round(parseFloat(sell || "0") * 100);

    if (!description || quantity < 1) {
      setError("Descrizione e quantità obbligatorie.");
      return;
    }
    if (mode === "inventory" && !selected) {
      setError("Seleziona un ricambio dalla lista.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await addPartAction({
        ticketId,
        inventoryItemId: mode === "inventory" ? (selected?.id ?? null) : null,
        description,
        quantity,
        unitCostCents,
        unitSellCents,
      });
      if (res.error) {
        setError(res.error);
      } else {
        resetForm();
      }
    });
  }

  function handleRemove(partId: string) {
    startTransition(async () => {
      await removePartAction(partId, ticketId);
    });
  }

  const totalCostCents = initialParts.reduce((s, p) => s + p.unitCostCents * p.quantity, 0);
  const totalSellCents = initialParts.reduce((s, p) => s + p.unitSellCents * p.quantity, 0);
  const totalNetSell = Math.round(totalSellCents / (1 + vatRate / 100));
  const marginCents = totalNetSell - totalCostCents;
  const marginPct = totalNetSell > 0 ? Math.round((marginCents / totalNetSell) * 100) : 0;

  const inputCls =
    "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Ricambi usati</CardTitle>
          </div>
          {mode === "idle" && (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => setMode("inventory")}>
                <Plus className="h-3 w-3" /> Magazzino
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => setMode("manual")}>
                <Plus className="h-3 w-3" /> Manuale
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Parts list */}
        {initialParts.length === 0 && mode === "idle" && (
          <p className="text-xs italic text-muted-foreground">Nessun ricambio aggiunto.</p>
        )}

        {initialParts.length > 0 && (
          <div className="space-y-1.5">
            {initialParts.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.quantity} × {fmt(p.unitSellCents)} ={" "}
                    <span className="font-medium text-foreground">{fmt(p.quantity * p.unitSellCents)}</span>
                    <span className="ml-2 text-slate-400">costo: {fmt(p.unitCostCents * p.quantity)}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(p.id)}
                  disabled={isPending}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Margine summary */}
        {initialParts.length > 0 && (
          <div className="space-y-1 rounded-md bg-slate-50 px-3 py-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Costo acquisto ricambi</span>
              <span>{fmt(totalCostCents)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ricavo ricambi (IVA {vatRate}% incl.)</span>
              <span>{fmt(totalSellCents)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ricavo netto (IVA esclusa)</span>
              <span>{fmt(totalNetSell)}</span>
            </div>
            <div
              className={`flex justify-between border-t pt-1 font-semibold ${
                marginCents >= 0 ? "text-emerald-700" : "text-red-700"
              }`}
            >
              <span>Margine ricambi</span>
              <span>
                {fmt(marginCents)} ({marginPct}%)
              </span>
            </div>
            {finalCost != null && totalSellCents > 0 && (
              <div className="flex justify-between border-t pt-1 text-muted-foreground">
                <span>Manodopera stimata</span>
                <span>{fmt(finalCost - totalSellCents)}</span>
              </div>
            )}
          </div>
        )}

        {/* Add from inventory */}
        {mode === "inventory" && (
          <div className="space-y-2.5 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Dal magazzino</p>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelected(null);
                }}
                placeholder="Cerca ricambio nel magazzino…"
                className={inputCls}
                autoFocus
              />
              {filtered.length > 0 && !selected && (
                <div className="absolute z-10 mt-0.5 w-full rounded-md border bg-white shadow-lg">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectItem(item)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.category && (
                          <span className="ml-1.5 text-xs text-muted-foreground">{item.category}</span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-xs ${item.quantity <= 0 ? "text-red-500" : "text-muted-foreground"}`}
                      >
                        {item.quantity <= 0 ? "Esaurito" : `Disp: ${item.quantity}`}
                        {item.sellPriceCents ? ` · ${fmt(item.sellPriceCents)}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Qtà</label>
                  <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Costo acq. (€)</label>
                  <input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Prezzo vend. (€)</label>
                  <input type="number" step="0.01" min="0" value={sell} onChange={(e) => setSell(e.target.value)} className={inputCls} />
                </div>
              </div>
            )}

            {error && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}

            <Button size="sm" className="w-full gap-1.5" onClick={handleAdd} disabled={isPending || !selected}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Aggiungi al ticket
            </Button>
          </div>
        )}

        {/* Add manual */}
        {mode === "manual" && (
          <div className="space-y-2.5 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Ricambio manuale</p>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Descrizione</label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Es. Schermo iPhone 13"
                className={inputCls}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Qtà</label>
                <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Costo acq. (€)</label>
                <input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Prezzo vend. (€)</label>
                <input type="number" step="0.01" min="0" value={sell} onChange={(e) => setSell(e.target.value)} placeholder="0.00" className={inputCls} />
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}

            <Button size="sm" className="w-full gap-1.5" onClick={handleAdd} disabled={isPending || !desc.trim()}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Aggiungi al ticket
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
