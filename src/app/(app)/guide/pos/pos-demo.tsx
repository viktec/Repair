"use client";

import { useState } from "react";
import { Plus, Minus, Trash2, CheckCircle2 } from "lucide-react";

const PRODUCTS = [
  { id: 1, name: "Cavo USB-C originale", price: 14.9 },
  { id: 2, name: "Cover iPhone 14 silicone", price: 19.9 },
  { id: 3, name: "Caricatore 20W", price: 24.9 },
  { id: 4, name: "Vetro temperato universale", price: 9.9 },
  { id: 5, name: "Batteria Samsung S21", price: 39.9 },
];

type CartItem = { id: number; name: string; price: number; qty: number };
type Phase = "cart" | "checkout" | "receipt";

export function PosDemo() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [phase, setPhase] = useState<Phase>("cart");
  const [payment, setPayment] = useState<"cash" | "card">("card");

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function addProduct(p: (typeof PRODUCTS)[0]) {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex) return prev.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
  }

  function changeQty(id: number, delta: number) {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter((i) => i.qty > 0));
  }

  if (phase === "receipt") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">Vendita registrata — {payment === "cash" ? "Contanti" : "Carta"} €{total.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scontrino</p>
          {cart.map((i) => (
            <div key={i.id} className="flex justify-between text-sm">
              <span>{i.qty}× {i.name}</span>
              <span className="font-medium">€{(i.price * i.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Totale</span><span>€{total.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={() => { setCart([]); setPhase("cart"); }} className="w-full rounded-md border py-2 text-sm font-medium hover:bg-slate-50 transition-colors">Nuova vendita →</button>
      </div>
    );
  }

  if (phase === "checkout") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium">Metodo di pagamento</p>
        <div className="grid grid-cols-2 gap-3">
          {(["cash", "card"] as const).map((m) => (
            <button key={m} onClick={() => setPayment(m)} className={`rounded-lg border-2 py-3 text-sm font-medium transition-colors ${payment === m ? "border-primary bg-primary/5 text-primary" : "border-slate-200"}`}>
              {m === "cash" ? "Contanti" : "Carta / POS"}
            </button>
          ))}
        </div>
        <div className="rounded-lg bg-slate-50 border p-3 flex justify-between font-bold">
          <span>Totale</span><span>€{total.toFixed(2)}</span>
        </div>
        <button onClick={() => setPhase("receipt")} className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Incassa €{total.toFixed(2)} →</button>
        <button onClick={() => setPhase("cart")} className="text-xs text-primary hover:underline">← Torna al carrello</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Articoli disponibili</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRODUCTS.map((p) => (
          <button key={p.id} onClick={() => addProduct(p)} className="rounded-lg border p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors group">
            <p className="text-xs font-medium group-hover:text-primary leading-tight">{p.name}</p>
            <p className="text-sm font-bold text-primary mt-1">€{p.price.toFixed(2)}</p>
          </button>
        ))}
      </div>
      {cart.length > 0 && (
        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carrello</p>
          {cart.map((i) => (
            <div key={i.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 truncate">{i.name}</span>
              <button onClick={() => changeQty(i.id, -1)} className="rounded p-0.5 hover:bg-slate-100"><Minus className="h-3 w-3" /></button>
              <span className="w-4 text-center font-medium">{i.qty}</span>
              <button onClick={() => changeQty(i.id, 1)} className="rounded p-0.5 hover:bg-slate-100"><Plus className="h-3 w-3" /></button>
              <span className="w-14 text-right font-medium">€{(i.price * i.qty).toFixed(2)}</span>
              <button onClick={() => setCart((c) => c.filter((x) => x.id !== i.id))} className="text-destructive hover:text-destructive/70"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-bold text-sm">
            <span>Totale</span><span>€{total.toFixed(2)}</span>
          </div>
          <button onClick={() => setPhase("checkout")} className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Procedi al pagamento →</button>
        </div>
      )}
      {cart.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Clicca su un articolo per aggiungerlo al carrello</p>}
    </div>
  );
}
