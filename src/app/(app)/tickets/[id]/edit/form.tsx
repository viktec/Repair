"use client";

import { useActionState } from "react";
import { updateTicketFieldsAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { DEVICE_BRANDS, DEVICE_MODELS } from "@/lib/devices";
import { useState } from "react";
import Link from "next/link";

type Ticket = {
  id: string;
  ticketNumber: number;
  customerId: string | null;
  deviceBrand: string | null;
  deviceModel: string | null;
  deviceImei: string | null;
  deviceSerial: string | null;
  devicePatternLock: string | null;
  accessories: string | null;
  deviceCondition: string | null;
  faultDescription: string | null;
  estimatedCost: number | null;
};

type Customer = { id: string; name: string; phone: string | null };

export function EditTicketForm({ ticket, customers }: { ticket: Ticket; customers: Customer[] }) {
  const [state, action, pending] = useActionState(updateTicketFieldsAction, null);
  const [selectedBrand, setSelectedBrand] = useState(ticket.deviceBrand ?? "");

  const modelSuggestions = selectedBrand && DEVICE_MODELS[selectedBrand]
    ? DEVICE_MODELS[selectedBrand]
    : Object.values(DEVICE_MODELS).flat();

  const estimatedDefault = ticket.estimatedCost != null
    ? (ticket.estimatedCost / 100).toFixed(2)
    : "";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="ticketId" value={ticket.id} />

      {/* Cliente */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="customerId">Cliente</Label>
            <select
              id="customerId"
              name="customerId"
              defaultValue={ticket.customerId ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Nessun cliente —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.phone ? ` · ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Dispositivo */}
      <Card>
        <CardHeader><CardTitle className="text-base">Dispositivo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <datalist id="brand-list">{DEVICE_BRANDS.map((b) => <option key={b} value={b} />)}</datalist>
          <datalist id="model-list">{modelSuggestions.map((m) => <option key={m} value={m} />)}</datalist>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deviceBrand">Marca</Label>
              <Input
                id="deviceBrand"
                name="deviceBrand"
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
                list="model-list"
                autoComplete="off"
                defaultValue={ticket.deviceModel ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deviceImei">IMEI</Label>
              <Input id="deviceImei" name="deviceImei" placeholder="15 cifre" maxLength={20} defaultValue={ticket.deviceImei ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deviceSerial">Numero di serie</Label>
              <Input id="deviceSerial" name="deviceSerial" placeholder="S/N" defaultValue={ticket.deviceSerial ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="devicePatternLock">PIN / Pattern sblocco</Label>
              <Input id="devicePatternLock" name="devicePatternLock" defaultValue={ticket.devicePatternLock ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accessories">Accessori consegnati</Label>
              <Input id="accessories" name="accessories" defaultValue={ticket.accessories ?? ""} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deviceCondition">Condizioni estetiche</Label>
            <Input id="deviceCondition" name="deviceCondition" defaultValue={ticket.deviceCondition ?? ""} />
          </div>
        </CardContent>
      </Card>

      {/* Intervento */}
      <Card>
        <CardHeader><CardTitle className="text-base">Intervento</CardTitle></CardHeader>
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
              defaultValue={ticket.faultDescription ?? ""}
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
              defaultValue={estimatedDefault}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href={`/tickets/${ticket.id}`}>
          <Button type="button" variant="outline">Annulla</Button>
        </Link>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salva modifiche
        </Button>
      </div>
    </form>
  );
}
