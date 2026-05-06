"use client";

import { useActionState } from "react";
import { createSupplierAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewSupplierPage() {
  const [state, action, pending] = useActionState(createSupplierAction, null);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/suppliers">
          <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />Fornitori</Button>
        </Link>
        <h1 className="text-xl font-bold">Nuovo fornitore</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Dati fornitore</CardTitle></CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" required />
              {state?.errors?.name && <p className="text-xs text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Sito web</Label>
              <Input id="website" name="website" placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Indirizzo</Label>
              <Input id="address" name="address" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentTerms">Condizioni di pagamento</Label>
              <textarea id="paymentTerms" name="paymentTerms" rows={2} placeholder="Es. 30 giorni fine mese, bonifico bancario…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Note</Label>
              <textarea id="notes" name="notes" rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex justify-end gap-3">
              <Link href="/suppliers"><Button type="button" variant="outline">Annulla</Button></Link>
              <Button type="submit" disabled={pending} className="gap-2">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salva fornitore
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
