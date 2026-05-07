"use client";

import { useActionState } from "react";
import { submitSurveyAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  token: string;
  brand: string;
  model: string;
  storageGb: string | null;
  alreadyCompleted: boolean;
};

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
      {options.map((o) => (
        <label key={o.value} className="cursor-pointer">
          <input type="radio" name={name} value={o.value} required={required} className="peer sr-only" />
          <div className="rounded-lg border-2 border-input px-3 py-2.5 text-center text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-slate-50">
            <p className="font-medium">{o.label}</p>
            {o.sub && <p className="text-[11px] text-muted-foreground mt-0.5">{o.sub}</p>}
          </div>
        </label>
      ))}
    </div>
  );
}

export function SurveyForm({ token, brand, model, storageGb, alreadyCompleted }: Props) {
  const boundAction = submitSurveyAction.bind(null, token);
  const [state, action, pending] = useActionState(boundAction, null);

  if (alreadyCompleted || state?.done) {
    return (
      <div className="flex flex-col items-center py-12 text-center gap-4">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold">Grazie!</h2>
        <p className="text-muted-foreground max-w-xs">
          Le tue risposte sono state inviate. Ti contatteremo presto con la nostra valutazione.
        </p>
      </div>
    );
  }

  const deviceName = [brand, model, storageGb].filter(Boolean).join(" ");

  return (
    <form action={action} className="space-y-7">
      <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary font-medium">
        Dispositivo: {deviceName}
      </div>

      {/* 1. Funziona? */}
      <section className="space-y-3">
        <h3 className="font-semibold">Il dispositivo si accende e funziona?</h3>
        <RadioGroup
          name="works"
          options={[
            { value: "yes", label: "Sì", sub: "Si avvia normalmente" },
            { value: "no", label: "No", sub: "Non si accende" },
          ]}
        />
      </section>

      {/* 2. Schermo */}
      <section className="space-y-3">
        <h3 className="font-semibold">Stato dello schermo</h3>
        <RadioGroup
          name="screenCondition"
          options={[
            { value: "perfect", label: "Perfetto", sub: "Nessun graffio" },
            { value: "minor_scratches", label: "Graffi lievi", sub: "Solo graffi superficiali" },
            { value: "cracked", label: "Vetro rotto", sub: "Schermo rotto ma funziona" },
            { value: "shattered", label: "In frantumi", sub: "Display rotto o non funziona" },
          ]}
        />
      </section>

      {/* 3. Corpo */}
      <section className="space-y-3">
        <h3 className="font-semibold">Stato del corpo / scocca</h3>
        <RadioGroup
          name="bodyCondition"
          options={[
            { value: "excellent", label: "Ottimo", sub: "Come nuovo" },
            { value: "good", label: "Buono", sub: "Qualche segno d'uso" },
            { value: "fair", label: "Discreto", sub: "Ammaccature visibili" },
            { value: "poor", label: "Pessimo", sub: "Molto danneggiato" },
          ]}
        />
      </section>

      {/* 4. Batteria */}
      <section className="space-y-3">
        <h3 className="font-semibold">Stato della batteria</h3>
        <RadioGroup
          name="batteryHealth"
          options={[
            { value: "great", label: "Ottima", sub: "Dura tutto il giorno" },
            { value: "good", label: "Buona", sub: "Qualche calo" },
            { value: "fair", label: "Discreta", sub: "Si scarica spesso" },
            { value: "poor", label: "Scarsa", sub: "Dura poche ore" },
          ]}
        />
      </section>

      {/* 5. Anno acquisto */}
      <section className="space-y-3">
        <h3 className="font-semibold">Anno di acquisto (approssimativo)</h3>
        <select
          name="purchaseYear"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Non ricordo</option>
          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </section>

      {/* 6. Accessori */}
      <section className="space-y-3">
        <h3 className="font-semibold">Accessori inclusi</h3>
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
      </section>

      {/* 7. Intenzione */}
      <section className="space-y-3">
        <h3 className="font-semibold">Cosa vorresti fare?</h3>
        <RadioGroup
          name="intent"
          options={[
            { value: "sell", label: "Venderlo", sub: "Ricevo contanti" },
            { value: "trade_in", label: "Permutarlo", sub: "Lo cambio con un altro" },
            { value: "both", label: "Decido dopo", sub: "Valuto entrambe" },
          ]}
        />
      </section>

      {/* 8. Aspettativa */}
      <section className="space-y-3">
        <h3 className="font-semibold">
          Quanto ti aspetti di ricevere? <span className="text-sm font-normal text-muted-foreground">(opzionale)</span>
        </h3>
        <div className="relative max-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
          <input
            type="number"
            name="customerExpectedCents"
            min="0"
            step="1"
            placeholder="0"
            className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>

      {/* 9. Note libere */}
      <section className="space-y-3">
        <h3 className="font-semibold">
          Vuoi aggiungere qualcosa? <span className="text-sm font-normal text-muted-foreground">(opzionale)</span>
        </h3>
        <textarea
          name="customerNotes"
          rows={3}
          placeholder="Eventuali difetti, storia del dispositivo, motivazione della vendita…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </section>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full h-12 text-base gap-2">
        {pending && <Loader2 className="h-5 w-5 animate-spin" />}
        Invia risposte
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Le tue risposte vengono utilizzate solo per la valutazione del dispositivo.
      </p>
    </form>
  );
}
