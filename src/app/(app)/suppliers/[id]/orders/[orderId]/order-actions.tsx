"use client";

import { useState, useTransition } from "react";
import { markOrderedAction, cancelOrderAction, receiveItemsAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Truck, CheckCircle2, X } from "lucide-react";

type Item = { id: string; description: string; quantityOrdered: number; quantityReceived: number };

type Props = {
  supplierId: string;
  orderId: string;
  items: Item[];
  canMarkOrdered: boolean;
  canReceive: boolean;
  canCancel: boolean;
};

export function OrderActions({ supplierId, orderId, items, canMarkOrdered, canReceive, canCancel }: Props) {
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((it) => [it.id, String(Math.max(0, it.quantityOrdered - it.quantityReceived))])),
  );
  const [isPending, startTransition] = useTransition();

  function handleMarkOrdered() {
    startTransition(() => markOrderedAction(supplierId, orderId));
  }

  function handleCancel() {
    if (!confirm("Annullare questo ordine?")) return;
    startTransition(() => cancelOrderAction(supplierId, orderId));
  }

  function handleReceive(formData: FormData) {
    // Inject receivedQtys into formData
    for (const [itemId, qty] of Object.entries(receivedQtys)) {
      formData.set(`received_${itemId}`, qty);
    }
    startTransition(() => receiveItemsAction(supplierId, orderId, null, formData));
  }

  if (!canMarkOrdered && !canReceive && !canCancel) return null;

  return (
    <div className="space-y-3">
      {canMarkOrdered && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleMarkOrdered} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            Segna come ordinato
          </Button>
          {canCancel && (
            <Button onClick={handleCancel} disabled={isPending} variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
              <X className="h-4 w-4" />Annulla ordine
            </Button>
          )}
        </div>
      )}

      {canReceive && !showReceiveForm && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowReceiveForm(true)} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />Registra ricevimento
          </Button>
          {canCancel && (
            <Button onClick={handleCancel} disabled={isPending} variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
              <X className="h-4 w-4" />Annulla ordine
            </Button>
          )}
        </div>
      )}

      {canReceive && showReceiveForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />Registra ricevimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleReceive} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Inserisci le quantità ricevute ora. Il magazzino verrà aggiornato automaticamente per gli articoli collegati al catalogo.
              </p>
              <div className="space-y-3">
                {items.map((item) => {
                  const remaining = Math.max(0, item.quantityOrdered - item.quantityReceived);
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="flex-1 text-sm">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Già ricevuti: {item.quantityReceived}/{item.quantityOrdered} · Rimanenti: {remaining}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max={remaining}
                        value={receivedQtys[item.id] ?? "0"}
                        onChange={(e) => setReceivedQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-20 text-center"
                        disabled={remaining === 0}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowReceiveForm(false)}>Annulla</Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Conferma ricevimento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
