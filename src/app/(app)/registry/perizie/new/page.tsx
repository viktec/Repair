"use client";

import { useActionState, useState } from "react";
import { createAppraisalAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

function RadioGroup({
  name,
  options,
  required = true,
}: {
  name: string;
  options: { value: string; label: string; sub?: string }[];
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((o, i) => (
        <label key={o.value} className="relative cursor-pointer">
          <input type="radio" name={name} value={o.value} required={required && i === 0} className="peer sr-only" />
          <div className="rounded-lg border-2 border-input px-3 py-2.5 text-center text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-slate-50">
            <p className="font-medium">{o.label}</p>
            {o.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{o.sub}</p>}
          </div>
        </label>
      ))}
    </div>
  );
}

export default function NewAppraisalPage() {
  const [state, action, pending] = useActionState(createAppraisalAction, null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const isIphone = brand.toLowerCase().includes("iphone") || model.toLowerCase().includes("iphone");
  const currentYear = new Date().getFullYear();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/registry/perizie">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Perizie
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Nuova perizia usato</h1>
      </div>

      <form action={action} className="space-y-4">

        {/* Dispositivo */}
        <Card>
          <CardHeader><CardTitle className="text-base">Dispositivo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="brand">Marca <span className="text-destructive">*</span></Label>
                <Input
                  id="brand" name="brand" placeholder="Apple, Samsung…" required
                  value={brand} onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Modello <span className="text-destructive">*</span></Label>
                <Input
                  id="model" name="model" placeholder="iPhone 14, Galaxy S22…" required
                  value={model} onChange={(e) => setModel(e.target.value)}
                />
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
                <Input id="imei" name="imei" placeholder="350000…" required className="font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="serialNumber">Numero seriale</Label>
              <Input id="serialNumber" name="serialNumber" placeholder="opzionale" className="font-mono" />
            </div>
          </CardContent>
        </Card>

        {/* Cliente */}
        <Card>
          <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Nome e cognome</Label>
                <Input id="customerName" name="customerName" placeholder="Mario Rossi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerPhone">Telefono</Label>
                <Input id="customerPhone" name="customerPhone" placeholder="+39 333…" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Condizioni */}
        <Card>
          <CardHeader><CardTitle className="text-base">Condizioni dispositivo</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Si accende e funziona? <span className="text-destructive">*</span></Label>
              <RadioGroup name="works" options={[
                { value: "yes", label: "Sì", sub: "Si avvia normalmente" },
                { value: "no", label: "No", sub: "Non si accende" },
              ]} />
            </div>
            <div className="space-y-2">
              <Label>Schermo <span className="text-destructive">*</span></Label>
              <RadioGroup name="screenCondition" options={[
                { value: "perfect", label: "Perfetto", sub: "Nessun graffio" },
                { value: "minor_scratches", label: "Graffi lievi", sub: "Solo superficiali" },
                { value: "cracked", label: "Vetro rotto", sub: "Funziona ancora" },
                { value: "shattered", label: "In frantumi", sub: "Non funziona" },
              ]} />
            </div>
            <div className="space-y-2">
              <Label>Corpo / scocca <span className="text-destructive">*</span></Label>
              <RadioGroup name="bodyCondition" options={[
                { value: "excellent", label: "Ottimo", sub: "Come nuovo" },
                { value: "good", label: "Buono", sub: "Qualche segno" },
                { value: "fair", label: "Discreto", sub: "Ammaccature visibili" },
                { value: "poor", label: "Pessimo", sub: "Molto danneggiato" },
              ]} />
            </div>
            <div className="space-y-2">
              <Label>Batteria <span className="text-destructive">*</span></Label>
              <RadioGroup name="batteryHealth" options={[
                { value: "great", label: "Ottima", sub: "Dura tutto il giorno" },
                { value: "good", label: "Buona", sub: "Qualche calo" },
                { value: "fair", label: "Discreta", sub: "Si scarica spesso" },
                { value: "poor", label: "Scarsa", sub: "Dura poche ore" },
              ]} />
            </div>
            {isIphone && (
              <div className="space-y-1.5">
                <Label htmlFor="batteryPercentage">
                  Percentuale batteria <span className="text-sm font-normal text-muted-foreground">(iPhone — Impostazioni → Batteria → Stato batteria)</span>
                </Label>
                <div className="relative max-w-[140px]">
                  <Input
                    id="batteryPercentage" name="batteryPercentage"
                    type="number" min="1" max="100" placeholder="es. 87"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acquisto */}
        <Card>
          <CardHeader><CardTitle className="text-base">Storia e acquisto</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Anno di acquisto</Label>
              <select
                name="purchaseYear"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Non specificato</option>
                {Array.from({ length: 10 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Accessori presenti</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 hover:bg-slate-50">
                  <input type="checkbox" name="hasCharger" className="accent-primary h-4 w-4" />
                  <span className="text-sm font-medium">Caricatore originale</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 hover:bg-slate-50">
                  <input type="checkbox" name="hasOriginalBox" className="accent-primary h-4 w-4" />
                  <span className="text-sm font-medium">Scatola originale</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Metodo di acquisto <span className="text-destructive">*</span></Label>
              <RadioGroup name="purchaseMethod" options={[
                { value: "cash", label: "Contanti" },
                { value: "card", label: "Carta" },
                { value: "carrier_plan", label: "Abbonamento operatore" },
                { value: "financing", label: "Finanziamento" },
              ]} />
            </div>
            <div className="space-y-2">
              <Label>Dove è stato acquistato <span className="text-destructive">*</span></Label>
              <RadioGroup name="purchasePlace" options={[
                { value: "physical", label: "Negozio fisico", sub: "Es. Apple Store, Unieuro" },
                { value: "online", label: "Online", sub: "Es. Amazon, sito ufficiale" },
              ]} />
            </div>
            <div className="space-y-2">
              <Label>Prova di acquisto <span className="text-sm font-normal text-muted-foreground">(opzionale)</span></Label>
              <RadioGroup name="hasProofOfPurchase" required={false} options={[
                { value: "yes", label: "Sì, ce l'ha" },
                { value: "no", label: "No" },
              ]} />
            </div>
          </CardContent>
        </Card>

        {/* Intenzione */}
        <Card>
          <CardHeader><CardTitle className="text-base">Intenzione e aspettativa</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Cosa vuole fare il cliente? <span className="text-destructive">*</span></Label>
              <RadioGroup name="intent" options={[
                { value: "sell", label: "Vendere", sub: "Riceve contanti" },
                { value: "trade_in", label: "Permuta", sub: "Lo cambia con altro" },
                { value: "both", label: "Decide dopo", sub: "Valuta entrambe" },
              ]} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerExpectedCents">
                Quanto si aspetta di ricevere <span className="text-destructive">*</span>
              </Label>
              <div className="relative max-w-[180px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="customerExpectedCents" name="customerExpectedCents"
                  type="number" min="0" step="1" placeholder="0"
                  required className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerNotes">Note aggiuntive</Label>
              <textarea
                id="customerNotes" name="customerNotes" rows={3}
                placeholder="Eventuali difetti, storia del dispositivo, motivazione della vendita…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
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
