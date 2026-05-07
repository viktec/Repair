"use client";

import { useActionState } from "react";
import { createRegistryEntryAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { RegistryDefaults } from "./page";

export function RegistryForm({ defaults }: { defaults: RegistryDefaults | null }) {
  const [state, action, pending] = useActionState(createRegistryEntryAction, null);
  const today = new Date().toISOString().split("T")[0];

  return (
    <form action={action} className="space-y-4">
      {defaults && <input type="hidden" name="appraisalId" value={defaults.appraisalId} />}

      <Card>
        <CardHeader><CardTitle className="text-base">Articolo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Data operazione <span className="text-destructive">*</span></Label>
            <Input id="date" name="date" type="date" defaultValue={today} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrizione articolo <span className="text-destructive">*</span></Label>
            <Input
              id="description"
              name="description"
              placeholder="es. Smartphone Apple iPhone 13, colore blu"
              defaultValue={defaults?.description ?? ""}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imeiOrSerial">IMEI / Numero seriale</Label>
            <Input
              id="imeiOrSerial"
              name="imeiOrSerial"
              placeholder="es. 350000000000000"
              defaultValue={defaults?.imeiOrSerial ?? ""}
              className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="purchasePriceCents">Prezzo acquisto (€)</Label>
              <Input
                id="purchasePriceCents"
                name="purchasePriceCents"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={defaults?.purchasePriceCents ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sellPriceCents">Prezzo vendita (€)</Label>
              <Input id="sellPriceCents" name="sellPriceCents" type="number" step="0.01" min="0" placeholder="0.00" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={defaults ? "ring-2 ring-primary/30" : ""}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Controparte
            {defaults && (
              <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Aggiungi documento
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="counterpartyName">Nome e cognome <span className="text-destructive">*</span></Label>
            <Input
              id="counterpartyName"
              name="counterpartyName"
              placeholder="Mario Rossi"
              defaultValue={defaults?.counterpartyName ?? ""}
              required
            />
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
                <option value="">— Seleziona —</option>
                <option value="carta_identita">Carta d&apos;identità</option>
                <option value="patente">Patente</option>
                <option value="passaporto">Passaporto</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="counterpartyDocNumber">Numero documento <span className="text-destructive">*</span></Label>
              <Input
                id="counterpartyDocNumber"
                name="counterpartyDocNumber"
                placeholder="AB1234567"
                required
                className="font-mono"
                autoFocus={!!defaults}
              />
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

      {state != null && typeof state === "object" && "error" in state && (
        <p className="text-sm text-destructive">{String((state as { error: string }).error)}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link href={defaults ? `/registry/perizie/${defaults.appraisalId}` : "/registry"}>
          <Button type="button" variant="outline">Annulla</Button>
        </Link>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Registra (definitivo)
        </Button>
      </div>
    </form>
  );
}
