"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

type Item = { id: number; name: string; sku: string; qty: number; min: number; price: number };

const INITIAL: Item[] = [
  { id: 1, name: "Batteria iPhone 14", sku: "BAT-IPH14", qty: 8, min: 5, price: 29.9 },
  { id: 2, name: "Display Samsung S22", sku: "DSP-SAM-S22", qty: 2, min: 3, price: 89.9 },
  { id: 3, name: "Cavo flex microfono", sku: "FLEX-MIC-01", qty: 15, min: 5, price: 4.5 },
];

export function InventoryDemo() {
  const [items, setItems] = useState<Item[]>(INITIAL);
  const [selected, setSelected] = useState<number | null>(null);
  const [amount, setAmount] = useState("5");
  const [type, setType] = useState<"in" | "out">("in");
  const [done, setDone] = useState(false);

  function applyMovement() {
    const n = parseInt(amount) || 0;
    if (!n || !selected) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === selected
          ? { ...i, qty: Math.max(0, i.qty + (type === "in" ? n : -n)) }
          : i
      )
    );
    setDone(true);
    setTimeout(() => { setDone(false); setSelected(null); setAmount("5"); }, 2000);
  }

  return (
    <div className="space-y-4">
      <div className="divide-y rounded-lg border overflow-hidden">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => { setSelected(item.id); setDone(false); }}
            className={`flex items-center gap-4 p-3 cursor-pointer transition-colors ${selected === item.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-slate-50"}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.sku}</p>
            </div>
            <div className="flex items-center gap-2">
              {item.qty < item.min && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
              <div className="text-right">
                <p className={`text-sm font-bold ${item.qty < item.min ? "text-amber-600" : "text-foreground"}`}>{item.qty} pz</p>
                <p className="text-xs text-muted-foreground">min {item.min}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="rounded-lg border p-4 space-y-3 bg-slate-50/50">
          <p className="text-sm font-medium">
            Movimento: <strong>{items.find((i) => i.id === selected)?.name}</strong>
          </p>
          <div className="flex gap-2">
            {(["in", "out"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-medium transition-colors ${type === t ? (t === "in" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-500 bg-rose-50 text-rose-700") : "border-slate-200 text-slate-500"}`}
              >
                {t === "in" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {t === "in" ? "Carico" : "Scarico"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={applyMovement}
              className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              {done ? "✓ Aggiornato!" : "Registra movimento"}
            </button>
          </div>
        </div>
      )}

      {!selected && <p className="text-xs text-muted-foreground text-center py-1">Clicca su un articolo per registrare un movimento</p>}
    </div>
  );
}
