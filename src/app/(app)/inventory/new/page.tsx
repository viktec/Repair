"use client";

import { useActionState } from "react";
import { createInventoryItemAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewInventoryItemPage() {
  const [state, action, pending] = useActionState(createInventoryItemAction, null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Magazzino
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Nuovo ricambio</h1>
      </div>

      <form action={action} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Informazioni articolo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" placeholder="es. Schermo iPhone 14 Pro" required />
              {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU / Codice interno</Label>
                <Input id="sku" name="sku" placeholder="SCH-IP14P-BLK" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="barcode">Barcode / EAN</Label>
                <Input id="barcode" name="barcode" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" name="category" placeholder="Schermi, Batterie, Connettori..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Posizione magazzino</Label>
                <Input id="location" name="location" placeholder="Scaffale A3" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compatibleBrands">Marchi compatibili</Label>
              <Input id="compatibleBrands" name="compatibleBrands" placeholder="Apple, Samsung..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compatibleModels">Modelli compatibili</Label>
              <Input id="compatibleModels" name="compatibleModels" placeholder="iPhone 14 Pro, iPhone 14 Pro Max..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Giacenza e prezzi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Giacenza iniziale</Label>
                <Input id="quantity" name="quantity" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minQuantity">Scorta minima</Label>
                <Input id="minQuantity" name="minQuantity" type="number" min="0" defaultValue="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="costPriceCents">Prezzo acquisto (€)</Label>
                <Input id="costPriceCents" name="costPriceCents" type="number" step="0.01" min="0" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sellPriceCents">Prezzo vendita (€)</Label>
                <Input id="sellPriceCents" name="sellPriceCents" type="number" step="0.01" min="0" placeholder="0.00" />
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
              placeholder="Note interne..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/inventory"><Button type="button" variant="outline">Annulla</Button></Link>
          <Button type="submit" disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salva ricambio
          </Button>
        </div>
      </form>
    </div>
  );
}
