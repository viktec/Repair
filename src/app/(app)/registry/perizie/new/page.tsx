"use client";

import { useActionState } from "react";
import { createAppraisalAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewAppraisalPage() {
  const [state, action, pending] = useActionState(createAppraisalAction, null);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/registry/perizie">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Perizie
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Nuova perizia usato</h1>
      </div>

      <form action={action} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Dispositivo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="brand">Marca <span className="text-destructive">*</span></Label>
                <Input id="brand" name="brand" placeholder="Apple, Samsung…" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Modello <span className="text-destructive">*</span></Label>
                <Input id="model" name="model" placeholder="iPhone 14, Galaxy S22…" required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="storageGb">Storage</Label>
                <Input id="storageGb" name="storageGb" placeholder="128GB" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color">Colore</Label>
                <Input id="color" name="color" placeholder="Nero" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="imei">IMEI</Label>
                <Input id="imei" name="imei" placeholder="350000…" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Nome</Label>
                <Input id="customerName" name="customerName" placeholder="Mario Rossi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerPhone">Telefono</Label>
                <Input id="customerPhone" name="customerPhone" placeholder="+39 333…" />
              </div>
            </div>
          </CardContent>
        </Card>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end gap-3">
          <Link href="/registry/perizie"><Button type="button" variant="outline">Annulla</Button></Link>
          <Button type="submit" disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Crea perizia
          </Button>
        </div>
      </form>
    </div>
  );
}
