"use client";

import { useActionState } from "react";
import { createSelfServiceAppraisalAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function SelfServiceForm({ orgId, primaryColor = "#0D8F7A" }: { orgId: string; primaryColor?: string }) {
  const bound = createSelfServiceAppraisalAction.bind(null, orgId);
  const [state, action, pending] = useActionState(bound, null);

  return (
    <form action={action} className="space-y-6">
      {/* Dispositivo */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground mb-1">Dispositivo</legend>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="brand">Marca <span className="text-destructive">*</span></Label>
            <Input id="brand" name="brand" placeholder="Apple, Samsung, Sony…" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">Modello <span className="text-destructive">*</span></Label>
            <Input id="model" name="model" placeholder="iPhone 14, Galaxy S22…" required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="storageGb">Storage <span className="text-destructive">*</span></Label>
            <Input id="storageGb" name="storageGb" placeholder="128GB" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="color">Colore <span className="text-destructive">*</span></Label>
            <Input id="color" name="color" placeholder="Nero" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="imei">IMEI <span className="text-destructive">*</span></Label>
            <Input id="imei" name="imei" placeholder="35000…" inputMode="numeric" required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="serialNumber">Numero seriale (S/N)</Label>
          <Input id="serialNumber" name="serialNumber" placeholder="es. C02XK1ABFVH3" className="font-mono" />
          <p className="text-xs text-muted-foreground">
            Trovi IMEI e S/N nelle impostazioni del dispositivo oppure sulla scatola originale.
          </p>
        </div>
      </fieldset>

      <hr />

      {/* Contatti */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground mb-1">I tuoi contatti</legend>

        <div className="space-y-1.5">
          <Label htmlFor="customerName">Nome e cognome <span className="text-destructive">*</span></Label>
          <Input id="customerName" name="customerName" placeholder="Mario Rossi" required autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customerPhone">Numero di telefono <span className="text-destructive">*</span></Label>
          <Input
            id="customerPhone"
            name="customerPhone"
            placeholder="+39 333 000 0000"
            required
            type="tel"
            autoComplete="tel"
            inputMode="tel"
          />
          <p className="text-xs text-muted-foreground">
            Ti contatteremo su questo numero con la nostra offerta via WhatsApp.
          </p>
        </div>
      </fieldset>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ backgroundColor: primaryColor }}
      >
        {pending && <Loader2 className="h-5 w-5 animate-spin" />}
        Continua →
      </button>

      <p className="text-center text-xs text-muted-foreground">
        I tuoi dati vengono usati esclusivamente per la valutazione del dispositivo.
      </p>
    </form>
  );
}
