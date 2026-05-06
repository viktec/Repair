"use client";

import { useState, useActionState } from "react";
import { createOrderAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";

type InventoryItem = { id: string; name: string; sku: string | null; costPriceCents: number | null };
type OrderLine = { description: string; qty: number; itemId: string; unitCost: string };
type PrefilledItem = { itemId: string; description: string; qty: number; unitCost: string };

function emptyLine(): OrderLine {
  return { description: "", qty: 1, itemId: "", unitCost: "" };
}

export function NewOrderForm({
  supplierId,
  inventoryItems,
  prefilledItems = [],
}: {
  supplierId: string;
  inventoryItems: InventoryItem[];
  prefilledItems?: PrefilledItem[];
}) {
  const boundAction = createOrderAction.bind(null, supplierId);
  const [state, action, pending] = useActionState(boundAction, null);
  const [lines, setLines] = useState<OrderLine[]>(
    prefilledItems.length > 0
      ? prefilledItems.map((p) => ({ description: p.description, qty: p.qty, itemId: p.itemId, unitCost: p.unitCost }))
      : [emptyLine()],
  );

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof OrderLine, value: string | number) {
    setLines((prev) =>
      prev.map((l, idx) => {
        if (idx !== i) return l;
        const updated = { ...l, [field]: value };
        // Auto-fill cost and description from inventory selection
        if (field === "itemId" && typeof value === "string" && value) {
          const item = inventoryItems.find((it) => it.id === value);
          if (item) {
            updated.description = item.name;
            updated.unitCost = item.costPriceCents != null ? (item.costPriceCents / 100).toFixed(2) : "";
          }
        }
        return updated;
      }),
    );
  }

  return (
    <form action={action} className="space-y-5">
      {/* Hidden lines data */}
      {lines.map((l, i) => (
        <span key={i}>
          <input type="hidden" name={`items[${i}][description]`} value={l.description} />
          <input type="hidden" name={`items[${i}][qty]`} value={l.qty} />
          <input type="hidden" name={`items[${i}][itemId]`} value={l.itemId} />
          <input type="hidden" name={`items[${i}][unitCost]`} value={l.unitCost} />
        </span>
      ))}

      {/* Info ordine */}
      <Card>
        <CardHeader><CardTitle className="text-base">Informazioni ordine</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expectedAt">Consegna attesa</Label>
              <Input id="expectedAt" name="expectedAt" type="date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Note</Label>
            <textarea id="notes" name="notes" rows={2} placeholder="Note per il fornitore…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </CardContent>
      </Card>

      {/* Articoli */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Articoli da ordinare</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addLine} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />Aggiungi riga
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {state?.error && <p className="text-xs text-destructive">{state.error}</p>}

          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_1fr_80px_120px_32px] gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground pb-1 border-b">
            <span>Dal catalogo</span>
            <span>Descrizione</span>
            <span className="text-center">Qtà</span>
            <span className="text-right">Costo unitario</span>
            <span />
          </div>

          {lines.map((l, i) => (
            <div key={i} className="grid sm:grid-cols-[1fr_1fr_80px_120px_32px] gap-2 items-start">
              {/* Selezione dal catalogo */}
              <div>
                <Label className="sm:hidden text-xs text-muted-foreground">Dal catalogo</Label>
                <select
                  value={l.itemId}
                  onChange={(e) => updateLine(i, "itemId", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Manuale —</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}{item.sku ? ` (${item.sku})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {/* Descrizione */}
              <div>
                <Label className="sm:hidden text-xs text-muted-foreground">Descrizione</Label>
                <Input
                  value={l.description}
                  onChange={(e) => updateLine(i, "description", e.target.value)}
                  placeholder="Nome articolo"
                  required
                />
              </div>
              {/* Quantità */}
              <div>
                <Label className="sm:hidden text-xs text-muted-foreground">Qtà</Label>
                <Input
                  type="number"
                  min="1"
                  value={l.qty}
                  onChange={(e) => updateLine(i, "qty", parseInt(e.target.value) || 1)}
                  className="text-center"
                />
              </div>
              {/* Costo unitario */}
              <div>
                <Label className="sm:hidden text-xs text-muted-foreground">Costo unitario (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={l.unitCost}
                  onChange={(e) => updateLine(i, "unitCost", e.target.value)}
                  placeholder="0.00"
                  className="text-right"
                />
              </div>
              {/* Rimuovi */}
              <div className="flex items-start pt-0.5">
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Totale stimato */}
          {lines.some((l) => l.unitCost) && (
            <div className="border-t pt-3 flex justify-end">
              <p className="text-sm font-medium">
                Totale stimato:{" "}
                <span className="text-foreground font-bold">
                  €{lines.reduce((sum, l) => sum + (parseFloat(l.unitCost || "0") * l.qty), 0).toFixed(2)}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()}>Annulla</Button>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Crea ordine
        </Button>
      </div>
    </form>
  );
}
