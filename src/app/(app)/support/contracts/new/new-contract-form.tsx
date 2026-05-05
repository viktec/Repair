"use client";

import { useActionState } from "react";
import { createContractAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { formatMinutes } from "@/lib/support-utils";
import { formatCurrency } from "@/lib/utils";

type Customer = { id: string; name: string; phone: string | null };
type Package = { id: string; name: string; totalMinutes: number; priceCents: number };

export function NewContractForm({
  customers,
  packages,
  today,
  nextYear,
}: {
  customers: Customer[];
  packages: Package[];
  today: string;
  nextYear: string;
}) {
  const [state, action, pending] = useActionState(createContractAction, null);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/support/contracts">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Contratti
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Nuovo contratto</h1>
      </div>

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{state.error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati contratto</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="customerId">Cliente <span className="text-destructive">*</span></Label>
              <select
                id="customerId"
                name="customerId"
                required
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Seleziona un cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.phone ? ` — ${c.phone}` : ""}
                  </option>
                ))}
              </select>
              {state?.errors?.customerId && <p className="text-xs text-destructive">{state.errors.customerId[0]}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="packageId">Pacchetto <span className="text-destructive">*</span></Label>
              {packages.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-md p-2 border border-amber-200">
                  Nessun pacchetto disponibile.{" "}
                  <Link href="/support/packages" className="underline">Configura i pacchetti</Link> prima di creare un contratto.
                </p>
              ) : (
                <select
                  id="packageId"
                  name="packageId"
                  required
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seleziona un pacchetto...</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatMinutes(p.totalMinutes)} — {formatCurrency(p.priceCents)}
                    </option>
                  ))}
                </select>
              )}
              {state?.errors?.packageId && <p className="text-xs text-destructive">{state.errors.packageId[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Data inizio <span className="text-destructive">*</span></Label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={today}
                  required
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {state?.errors?.startDate && <p className="text-xs text-destructive">{state.errors.startDate[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">Data fine <span className="text-destructive">*</span></Label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={nextYear}
                  required
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {state?.errors?.endDate && <p className="text-xs text-destructive">{state.errors.endDate[0]}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Note</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Note interne sul contratto..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/support/contracts">
                <Button type="button" variant="outline">Annulla</Button>
              </Link>
              <Button type="submit" disabled={pending || packages.length === 0} className="gap-2">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Crea contratto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
