"use client";

import { useState } from "react";
import { CheckCircle2, Package } from "lucide-react";

const SUPPLIERS = [
  { id: 1, name: "Distributech SRL", email: "ordini@distributech.it", terms: "30gg fine mese" },
  { id: 2, name: "PhoneParts Italia", email: "shop@phoneparts.it", terms: "Pagamento anticipato" },
];

const CATALOG = [
  { name: "Batteria iPhone 14", sku: "BAT-IPH14", price: 18.5 },
  { name: "Display Samsung S22", sku: "DSP-SAM-S22", price: 54.0 },
  { name: "Cavo flex camera", sku: "FLEX-CAM-01", price: 7.2 },
];

type OrderItem = { name: string; sku: string; price: number; qty: number };

export function SuppliersDemo() {
  const [selected, setSelected] = useState<number | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [sent, setSent] = useState(false);

  function toggleItem(item: (typeof CATALOG)[0]) {
    setItems((prev) => {
      const ex = prev.find((i) => i.sku === item.sku);
      if (ex) return prev.filter((i) => i.sku !== item.sku);
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function changeQty(sku: string, delta: number) {
    setItems((prev) => prev.map((i) => i.sku === sku ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">Ordine inviato a {SUPPLIERS.find(s => s.id === selected)?.name}!</p>
        </div>
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          {items.map((i) => <div key={i.sku} className="flex justify-between"><span>{i.qty}× {i.name}</span><span>€{(i.price * i.qty).toFixed(2)}</span></div>)}
          <div className="border-t pt-2 flex justify-between font-bold"><span>Totale ordine</span><span>€{total.toFixed(2)}</span></div>
        </div>
        <button onClick={() => { setSent(false); setItems([]); setSelected(null); }} className="text-xs text-primary hover:underline">← Ricomincia demo</button>
      </div>
    );
  }

  if (selected) {
    const supplier = SUPPLIERS.find(s => s.id === selected)!;
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-amber-50 border-amber-200 px-4 py-3">
          <p className="text-sm font-semibold">{supplier.name}</p>
          <p className="text-xs text-muted-foreground">{supplier.email} · {supplier.terms}</p>
        </div>
        <p className="text-xs font-medium text-muted-foreground">Seleziona gli articoli da ordinare:</p>
        <div className="space-y-2">
          {CATALOG.map((item) => {
            const inOrder = items.find(i => i.sku === item.sku);
            return (
              <div key={item.sku} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${inOrder ? "border-primary/50 bg-primary/5" : "hover:bg-slate-50"}`} onClick={() => toggleItem(item)}>
                <input type="checkbox" readOnly checked={!!inOrder} className="h-4 w-4 accent-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                </div>
                <p className="text-sm font-bold">€{item.price.toFixed(2)}</p>
                {inOrder && (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => changeQty(item.sku, -1)} className="rounded border px-1.5 text-xs">−</button>
                    <span className="text-xs font-medium w-4 text-center">{inOrder.qty}</span>
                    <button onClick={() => changeQty(item.sku, 1)} className="rounded border px-1.5 text-xs">+</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {items.length > 0 && (
          <button onClick={() => setSent(true)} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <Package className="h-4 w-4" /> Invia ordine (€{total.toFixed(2)}) →
          </button>
        )}
        <button onClick={() => { setSelected(null); setItems([]); }} className="text-xs text-primary hover:underline">← Cambia fornitore</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Seleziona un fornitore per creare un ordine:</p>
      {SUPPLIERS.map((s) => (
        <button key={s.id} onClick={() => setSelected(s.id)} className="w-full text-left rounded-lg border p-4 hover:border-primary hover:bg-primary/5 transition-colors">
          <p className="font-medium text-sm">{s.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{s.email} · {s.terms}</p>
        </button>
      ))}
    </div>
  );
}
