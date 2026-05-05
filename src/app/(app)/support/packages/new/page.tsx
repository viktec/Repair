"use client";

import { useActionState } from "react";
import { createPackageAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewPackagePage() {
  const [state, action, pending] = useActionState(
    async (prev: { errors?: Record<string, string[]>; error?: string } | null, formData: FormData) => {
      // Convert hours to minutes and euros to cents before sending
      const hours = parseFloat(formData.get("hours") as string) || 0;
      const euros = parseFloat(formData.get("priceEuros") as string) || 0;
      formData.set("totalMinutes", String(Math.round(hours * 60)));
      formData.set("priceCents", String(Math.round(euros * 100)));
      return createPackageAction(prev, formData);
    },
    null,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/support/packages">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Pacchetti
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Nuovo pacchetto</h1>
      </div>

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{state.error}</div>
      )}

      <form action={action} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informazioni generali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome pacchetto <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" placeholder="es. SILVER" required />
              {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="hours">Ore totali <span className="text-destructive">*</span></Label>
                <Input id="hours" name="hours" type="number" min="0.5" step="0.5" placeholder="45" required />
                {state?.errors?.totalMinutes && <p className="text-xs text-destructive">{state.errors.totalMinutes[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priceEuros">Prezzo (€)</Label>
                <Input id="priceEuros" name="priceEuros" type="number" min="0" step="0.01" placeholder="149.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="urgencySurchargePercent">Maggiorazione urgenza (%)</Label>
                <Input id="urgencySurchargePercent" name="urgencySurchargePercent" type="number" min="0" max="100" defaultValue="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priorityLevel">Livello priorità (1=alta, 4=bassa)</Label>
                <Input id="priorityLevel" name="priorityLevel" type="number" min="1" max="4" defaultValue="4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrizione</Label>
              <textarea
                id="description"
                name="description"
                rows={2}
                placeholder="Descrizione opzionale del pacchetto..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arrotondamento e diritti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phoneRoundingMinutes">Arrot. telefono (min)</Label>
                <Input id="phoneRoundingMinutes" name="phoneRoundingMinutes" type="number" min="0" defaultValue="5" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="remoteRoundingMinutes">Arrot. remoto (min)</Label>
                <Input id="remoteRoundingMinutes" name="remoteRoundingMinutes" type="number" min="0" defaultValue="10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emailRoundingMinutes">Arrot. email (min)</Label>
                <Input id="emailRoundingMinutes" name="emailRoundingMinutes" type="number" min="0" defaultValue="10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="callFeeMinutes">Diritto di chiamata (min)</Label>
              <Input id="callFeeMinutes" name="callFeeMinutes" type="number" min="0" defaultValue="10" />
              <p className="text-xs text-muted-foreground">Minuti aggiuntivi applicati a ogni intervento telefonico.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/support/packages">
            <Button type="button" variant="outline">Annulla</Button>
          </Link>
          <Button type="submit" disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salva pacchetto
          </Button>
        </div>
      </form>
    </div>
  );
}
