"use client";

import { useActionState, useState } from "react";
import { createTicketAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { DEVICE_BRANDS, DEVICE_MODELS } from "@/lib/devices";

type Props = {
  customers: { id: string; name: string; phone: string | null }[];
  statuses: { id: string; name: string }[];
};

export function NewTicketForm({ customers }: Props) {
  const [state, action, pending] = useActionState(createTicketAction, null);
  const [selectedBrand, setSelectedBrand] = useState("");

  const modelSuggestions =
    selectedBrand && DEVICE_MODELS[selectedBrand]
      ? DEVICE_MODELS[selectedBrand]
      : Object.values(DEVICE_MODELS).flat();

  return (
    <form action={action} className="space-y-4">
      {/* Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="customerId">Seleziona cliente</Label>
            <select
              id="customerId"
              name="customerId"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Nessun cliente associato —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.phone ? ` · ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
          {customers.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nessun cliente registrato.{" "}
              <Link href="/customers/new" className="text-primary underline">
                Aggiungi cliente
              </Link>{" "}
              prima di creare il ticket, oppure procedi senza associarlo.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dispositivo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dispositivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* datalist brand */}
          <datalist id="brand-list">
            {DEVICE_BRANDS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>

          {/* datalist modelli (filtrato per brand selezionato) */}
          <datalist id="model-list">
            {modelSuggestions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deviceBrand">Marca</Label>
              <Input
                id="deviceBrand"
                name="deviceBrand"
                placeholder="Apple, Samsung…"
                list="brand-list"
                autoComplete="off"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deviceModel">Modello</Label>
              <Input
                id="deviceModel"
                name="deviceModel"
                placeholder="iPhone 15, Galaxy S24…"
                list="model-list"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deviceImei">IMEI</Label>
              <Input id="deviceImei" name="deviceImei" placeholder="15 cifre" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deviceSerial">Numero di serie</Label>
              <Input id="deviceSerial" name="deviceSerial" placeholder="S/N" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="devicePatternLock">PIN / Pattern sblocco</Label>
              <Input
                id="devicePatternLock"
                name="devicePatternLock"
                placeholder="Solo se fornito dal cliente"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accessories">Accessori consegnati</Label>
              <Input id="accessories" name="accessories" placeholder="Cover, caricatore…" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deviceCondition">Condizioni estetiche</Label>
            <Input
              id="deviceCondition"
              name="deviceCondition"
              placeholder="Graffi, crepe, ammaccature…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Guasto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intervento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="faultDescription">
              Descrizione guasto <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="faultDescription"
              name="faultDescription"
              rows={3}
              required
              placeholder="Schermo rotto, non si accende, batteria scarica…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {state?.errors?.faultDescription && (
              <p className="text-xs text-destructive">{state.errors.faultDescription[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="estimatedCost">Preventivo (€)</Label>
            <Input
              id="estimatedCost"
              name="estimatedCost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="max-w-[160px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/tickets">
          <Button type="button" variant="outline">
            Annulla
          </Button>
        </Link>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Crea ticket
        </Button>
      </div>
    </form>
  );
}
