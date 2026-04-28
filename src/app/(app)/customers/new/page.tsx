"use client";

import { useActionState } from "react";
import { createCustomerAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewCustomerPage() {
  const [state, action, pending] = useActionState(createCustomerAction, null);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/customers">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Clienti
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Nuovo cliente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati anagrafici</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Nome e cognome <span className="text-destructive">*</span>
              </Label>
              <Input id="name" name="name" placeholder="Mario Rossi" required />
              {state?.errors?.name && (
                <p className="text-xs text-destructive">{state.errors.name[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+39 333 000 0000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="mario@esempio.it" />
                {state?.errors?.email && (
                  <p className="text-xs text-destructive">{state.errors.email[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Note interne</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Note visibili solo allo staff..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-start gap-2 rounded-md border bg-slate-50 p-3">
              <input
                type="checkbox"
                id="gdprConsent"
                name="gdprConsent"
                className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
              />
              <Label htmlFor="gdprConsent" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
                Il cliente ha fornito consenso al trattamento dei dati personali (GDPR art. 6).
                La data di consenso verrà registrata automaticamente.
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/customers">
                <Button type="button" variant="outline">
                  Annulla
                </Button>
              </Link>
              <Button type="submit" disabled={pending} className="gap-2">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salva cliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
