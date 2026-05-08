"use client";

import { useActionState } from "react";
import { updateRegistryEntryAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type Entry = {
  id: string;
  date: Date;
  description: string;
  imeiOrSerial: string | null;
  counterpartyName: string;
  counterpartyDocType: string;
  counterpartyDocNumber: string;
  purchasePriceCents: number | null;
  sellPriceCents: number | null;
  notes: string | null;
};

export function EditRegistryForm({ entry }: { entry: Entry }) {
  const boundAction = updateRegistryEntryAction.bind(null, entry.id);
  const [state, action, pending] = useActionState(boundAction, null);

  const dateStr = new Date(entry.date).toISOString().split("T")[0];

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Articolo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Data operazione <span className="text-destructive">*</span></Label>
            <Input id="date" name="date" type="date" defaultValue={dateStr} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrizione articolo <span className="text-destructive">*</span></Label>
            <Input id="description" name="description" defaultValue={entry.description} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imeiOrSerial">IMEI / Numero seriale</Label>
            <Input id="imeiOrSerial" name="imeiOrSerial" defaultValue={entry.imeiOrSerial ?? ""} className="font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="purchasePriceCents">Prezzo acquisto (€)</Label>
              <Input
                id="purchasePriceCents" name="purchasePriceCents" type="number" step="0.01" min="0"
                defaultValue={entry.purchasePriceCents != null ? (entry.purchasePriceCents / 100).toFixed(2) : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sellPriceCents">Prezzo vendita (€)</Label>
              <Input
                id="sellPriceCents" name="sellPriceCents" type="number" step="0.01" min="0"
                defaultValue={entry.sellPriceCents != null ? (entry.sellPriceCents / 100).toFixed(2) : ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Controparte</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="counterpartyName">Nome e cognome <span className="text-destructive">*</span></Label>
            <Input id="counterpartyName" name="counterpartyName" defaultValue={entry.counterpartyName} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="counterpartyDocType">Tipo documento <span className="text-destructive">*</span></Label>
              <select
                id="counterpartyDocType" name="counterpartyDocType" required
                defaultValue={entry.counterpartyDocType}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Seleziona —</option>
                <option value="carta_identita">Carta d&apos;identità</option>
                <option value="patente">Patente</option>
                <option value="passaporto">Passaporto</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="counterpartyDocNumber">Numero documento <span className="text-destructive">*</span></Label>
              <Input id="counterpartyDocNumber" name="counterpartyDocNumber" defaultValue={entry.counterpartyDocNumber} required className="font-mono" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Note</CardTitle></CardHeader>
        <CardContent>
          <textarea
            name="notes"
            rows={3}
            defaultValue={entry.notes ?? ""}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </CardContent>
      </Card>

      {state != null && typeof state === "object" && "error" in state && (
        <p className="text-sm text-destructive">{String((state as { error: string }).error)}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/registry">
          <Button type="button" variant="outline">Annulla</Button>
        </Link>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salva modifiche
        </Button>
      </div>
    </form>
  );
}
