"use client";

import { useState, useActionState, useCallback } from "react";
import { createTransactionAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Loader2, ShoppingCart, User } from "lucide-react";

type CatalogItem = {
  id: string;
  name: string;
  sku: string | null;
  sellPriceCents: number | null;
  quantity: number;
};

type Customer = { id: string; name: string; phone: string | null };

type CartLine = {
  inventoryItemId: string | null;
  description: string;
  qty: number;
  unitPriceCents: number;
  discountPct: number;
};

function lineTotalCents(l: CartLine): number {
  return Math.round(l.unitPriceCents * l.qty * (1 - l.discountPct / 100));
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

const PAYMENT_METHODS = [
  { key: "cash", label: "Contanti" },
  { key: "card", label: "Carta" },
  { key: "transfer", label: "Bonifico" },
  { key: "other", label: "Altro" },
] as const;

export function PosSellForm({
  catalogItems,
  customers,
}: {
  catalogItems: CatalogItem[];
  customers: Customer[];
}) {
  const [state, action, pending] = useActionState(createTransactionAction, null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [notes, setNotes] = useState("");

  const filtered = catalogItems.filter((it) => {
    const q = search.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      (it.sku?.toLowerCase().includes(q) ?? false)
    );
  });

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone?.includes(customerSearch) ?? false),
  );

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const addFromCatalog = useCallback((item: CatalogItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.inventoryItemId === item.id);
      if (idx >= 0) {
        return prev.map((l, i) => i === idx ? { ...l, qty: l.qty + 1 } : l);
      }
      return [...prev, {
        inventoryItemId: item.id,
        description: item.name,
        qty: 1,
        unitPriceCents: item.sellPriceCents ?? 0,
        discountPct: 0,
      }];
    });
  }, []);

  function addManualLine() {
    setCart((prev) => [...prev, { inventoryItemId: null, description: "", qty: 1, unitPriceCents: 0, discountPct: 0 }]);
  }

  function updateLine(i: number, patch: Partial<CartLine>) {
    setCart((prev) => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }

  function removeLine(i: number) {
    setCart((prev) => prev.filter((_, idx) => idx !== i));
  }

  const grandTotal = cart.reduce((s, l) => s + lineTotalCents(l), 0);

  return (
    <form action={action} className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Hidden fields */}
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="notes" value={notes} />
      {cart.map((l, i) => (
        <span key={i}>
          <input type="hidden" name={`items[${i}][inventoryItemId]`} value={l.inventoryItemId ?? ""} />
          <input type="hidden" name={`items[${i}][description]`} value={l.description} />
          <input type="hidden" name={`items[${i}][quantity]`} value={l.qty} />
          <input type="hidden" name={`items[${i}][unitPriceCents]`} value={l.unitPriceCents} />
          <input type="hidden" name={`items[${i}][discountPct]`} value={l.discountPct} />
          <input type="hidden" name={`items[${i}][totalCents]`} value={lineTotalCents(l)} />
        </span>
      ))}

      {/* ── Sinistra: catalogo ── */}
      <div className="flex flex-col gap-3 lg:w-[360px] shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome o SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-lg border bg-white overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nessun articolo trovato</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addFromCatalog(item)}
                className="w-full text-left px-4 py-2.5 border-b last:border-0 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.sku && <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {item.sellPriceCents != null ? formatCents(item.sellPriceCents) : "—"}
                    </p>
                    <p className={`text-[10px] ${item.quantity === 0 ? "text-red-500" : "text-muted-foreground"}`}>
                      {item.quantity === 0 ? "Esaurito" : `Disp.: ${item.quantity}`}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addManualLine} className="gap-1.5 w-full">
          <Plus className="h-3.5 w-3.5" />Riga libera
        </Button>
      </div>

      {/* ── Destra: carrello + checkout ── */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">

        {/* Carrello */}
        <div className="rounded-lg border bg-white overflow-hidden">
          {/* Intestazione */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_110px_70px_32px] gap-2 px-4 py-2 bg-slate-50 border-b text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Articolo</span>
            <span className="text-center">Qtà</span>
            <span className="text-right">Prezzo</span>
            <span className="text-right">Sconto %</span>
            <span />
          </div>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <ShoppingCart className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Carrello vuoto — aggiungi articoli dal catalogo</p>
            </div>
          ) : (
            cart.map((l, i) => (
              <div key={i} className="grid sm:grid-cols-[1fr_80px_110px_70px_32px] gap-2 items-center px-4 py-2 border-b last:border-0">
                <Input
                  value={l.description}
                  onChange={(e) => updateLine(i, { description: e.target.value })}
                  placeholder="Descrizione"
                  className="text-sm"
                  required
                />
                <Input
                  type="number"
                  min="1"
                  value={l.qty}
                  onChange={(e) => updateLine(i, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="text-center"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(l.unitPriceCents / 100).toFixed(2)}
                    onChange={(e) => updateLine(i, { unitPriceCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                    className="pl-7 text-right"
                  />
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={l.discountPct}
                    onChange={(e) => updateLine(i, { discountPct: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    className="text-center pr-6"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}

          {/* Totale */}
          {cart.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t flex flex-col items-end gap-1">
              {cart.map((l, i) => l.discountPct > 0 && (
                <p key={i} className="text-xs text-muted-foreground">
                  {l.description}: {formatCents(lineTotalCents(l))} (−{l.discountPct}%)
                </p>
              ))}
              <p className="text-lg font-bold">
                Totale: <span className="text-primary">{formatCents(grandTotal)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Cliente (opzionale) */}
        <div className="rounded-lg border bg-white px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <User className="h-3.5 w-3.5" />
              Cliente
              <span className="text-muted-foreground font-normal">(opzionale)</span>
            </Label>
            {customerId && (
              <button
                type="button"
                onClick={() => { setCustomerId(""); setCustomerSearch(""); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Rimuovi
              </button>
            )}
          </div>
          {selectedCustomer ? (
            <div className="text-sm font-medium">{selectedCustomer.name}{selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ""}</div>
          ) : (
            <div className="relative">
              <Input
                placeholder="Cerca cliente…"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerPicker(true); }}
                onFocus={() => setShowCustomerPicker(true)}
                onBlur={() => setTimeout(() => setShowCustomerPicker(false), 150)}
              />
              {showCustomerPicker && customerSearch && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-md border bg-white shadow-lg max-h-40 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Nessun cliente trovato</p>
                  ) : (
                    filteredCustomers.slice(0, 8).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={() => { setCustomerId(c.id); setCustomerSearch(""); setShowCustomerPicker(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b last:border-0"
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.phone && <span className="text-muted-foreground ml-2 text-xs">{c.phone}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metodo pagamento */}
        <div className="rounded-lg border bg-white px-4 py-3 space-y-2">
          <Label className="text-sm font-medium">Metodo di pagamento</Label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setPaymentMethod(m.key)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  paymentMethod === m.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-white hover:bg-slate-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="rounded-lg border bg-white px-4 py-3 space-y-1.5">
          <Label htmlFor="pos-notes" className="text-sm font-medium">Note <span className="text-muted-foreground font-normal">(opzionale)</span></Label>
          <textarea
            id="pos-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Note interne o per il cliente…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        {/* Submit */}
        <Button
          type="submit"
          disabled={pending || cart.length === 0}
          className="w-full h-12 text-base font-semibold gap-2"
        >
          {pending && <Loader2 className="h-5 w-5 animate-spin" />}
          Completa vendita · {formatCents(grandTotal)}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          La vendita verrà registrata nella sessione corrente e le giacenze aggiornate.
        </p>
      </div>
    </form>
  );
}
