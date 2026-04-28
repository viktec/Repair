"use client";

import { useState, useTransition } from "react";
import { addMovementAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";

export function MovementForm({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [type, setType] = useState("in");
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    const n = parseInt(qty);
    if (!n || n <= 0) return;
    startTransition(async () => {
      await addMovementAction(itemId, type, n, notes);
      setDone(true);
      setNotes("");
      setTimeout(() => setDone(false), 2000);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Registra movimento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="in">Carico (+)</option>
            <option value="out">Scarico (−)</option>
            <option value="adjustment">Rettifica inventario</option>
            <option value="sale">Vendita (−)</option>
            <option value="return">Reso (+)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Quantità</Label>
          <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Note (opzionale)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="es. Ordine #123" />
        </div>
        <Button className="w-full gap-1.5" onClick={handleSubmit} disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : null}
          {done ? "Salvato!" : "Registra"}
        </Button>
      </CardContent>
    </Card>
  );
}
