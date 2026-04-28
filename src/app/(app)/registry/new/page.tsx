"use client";

import { useActionState } from "react";
import { createRegistryEntryAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewRegistryEntryPage() {
  const [state, action, pending] = useActionState(createRegistryEntryAction, null);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/registry">
          <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />Registro</Button>
        </Link>
        <h1 className="text-xl font-bold">Nuova registrazione usato</h1>
      </div>

      <div className="rounded-md border bg-amber-50 border-amber-200 px-4 py-3 text-sm text-amber-800">
        Verificare attentamente i dati prima di salvare. La registrazione non può essere modificata o eliminata.
      </div>

      <form action={action} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Articolo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Data operazione <span className="text-destructive">*</span></Label>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrizione articolo <span className="text-destructive">*</span></Label>
              <Input id="description" name="description" placeholder="es. Smartphone Apple iPhone 13, colore blu" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imeiOrSerial">IMEI / Numero seriale</Label>
              <Input id="imeiOrSerial" name="imeiOrSerial" placeholder="es. 350000000000000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="purchasePriceCents">Prezzo acquisto (€)</Label>
                <Input id="purchasePriceCents" name="purchasePriceCents" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sellPriceCents">Prezzo vendita (€)</Label>
                <Input id="sellPriceCents" name="sellPriceCents" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Controparte</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="counterpartyName">Nome e cognome <span className="text-destructive">*</span></Label>
              <Input id="counterpartyName" name="counterpartyName" placeholder="Mario Rossi" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="counterpartyDocType">Tipo documento <span className="text-destructive">*</span></Label>
                <select
                  id="counterpartyDocType"
                  name="counterpartyDocType"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="carta_identita">Carta d&apos;identità</option>
                  <option value="patente">Patente</option>
                  <option value="passaporto">Passaporto</option>
                  <option value="altro">Altro</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="counterpartyDocNumber">Numero documento <span className="text-destructive">*</span></Label>
                <Input id="counterpartyDocNumber" name="counterpartyDocNumber" placeholder="AB1234567" required />
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
              placeholder="Note aggiuntive..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/registry"><Button type="button" variant="outline">Annulla</Button></Link>
          <Button type="submit" disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Registra (definitivo)
          </Button>
        </div>
      </form>
    </div>
  );
}
