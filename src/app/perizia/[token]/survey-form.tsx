"use client";

import { useActionState, useState, useRef } from "react";
import { submitSurveyAction, getAppraisalPhotoUploadUrl, saveAppraisalPhoto } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Camera, X, ImagePlus } from "lucide-react";
import { getPublicUrl } from "@/lib/storage";

type Props = {
  token: string;
  brand: string;
  model: string;
  storageGb: string | null;
  color: string | null;
  imei: string | null;
  alreadyCompleted: boolean;
  primaryColor?: string;
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

export function SurveyForm({ token, brand, model, storageGb, color, imei, alreadyCompleted, primaryColor = "#0D8F7A" }: Props) {
  const boundAction = submitSurveyAction.bind(null, token);
  const [state, action, pending] = useActionState(boundAction, null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= 5) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowed.includes(file.type)) {
      setPhotoError("Formato non supportato (usa JPG, PNG o WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Foto troppo grande (max 10MB).");
      return;
    }

    setPhotoError(null);
    setUploading(true);
    try {
      const res = await getAppraisalPhotoUploadUrl(token, file.name, file.type);
      if (res.error || !res.uploadUrl || !res.key) {
        setPhotoError(res.error ?? "Errore upload.");
        return;
      }
      await fetch(res.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      await saveAppraisalPhoto(token, res.key);
      setPhotos((prev) => [...prev, res.key!]);
    } catch {
      setPhotoError("Errore durante il caricamento. Riprova.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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

  const modelStartsWithBrand = brand && (model?.toLowerCase().startsWith(brand.toLowerCase()) ?? false);
  const deviceName = [!modelStartsWithBrand && brand, model, storageGb].filter(Boolean).join(" ");
  const isIphone = brand.toLowerCase().includes("iphone") || model.toLowerCase().includes("iphone");

  return (
    <form action={action} className="space-y-7">
      <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary font-medium">
        Dispositivo: {deviceName}
      </div>

      {/* 0. Dettagli dispositivo */}
      <section className="space-y-3">
        <h3 className="font-semibold">Dettagli dispositivo</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Storage <span className="text-destructive">*</span>
            </label>
            <input
              name="storageGb"
              required
              defaultValue={storageGb ?? ""}
              placeholder="es. 128GB"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Colore <span className="text-destructive">*</span>
            </label>
            <input
              name="color"
              required
              defaultValue={color ?? ""}
              placeholder="es. Nero"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            IMEI <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground">
            Puoi trovarlo digitando <strong>*#06#</strong> sul telefono oppure in Impostazioni → Informazioni.
          </p>
          <input
            name="imei"
            required
            defaultValue={imei ?? ""}
            placeholder="es. 350000000000000"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>

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

      {/* 4b. Percentuale batteria (solo iPhone) */}
      {isIphone && (
        <section className="space-y-3">
          <h3 className="font-semibold">
            Percentuale stato batteria <span className="text-sm font-normal text-muted-foreground">(solo iPhone)</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Vai in <strong>Impostazioni → Batteria → Stato batteria e ricarica</strong> e inserisci la percentuale che vedi.
          </p>
          <div className="relative max-w-[140px]">
            <input
              type="number"
              name="batteryPercentage"
              min="1"
              max="100"
              step="1"
              placeholder="es. 87"
              className="w-full rounded-lg border border-input bg-background px-3 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
          </div>
        </section>
      )}

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

      {/* 6b. Metodo di acquisto */}
      <section className="space-y-3">
        <h3 className="font-semibold">Come è stato acquistato? <span className="text-destructive">*</span></h3>
        <RadioGroup
          name="purchaseMethod"
          options={[
            { value: "cash", label: "Contanti" },
            { value: "card", label: "Carta" },
            { value: "carrier_plan", label: "Abbonamento operatore" },
            { value: "financing", label: "Finanziamento" },
          ]}
        />
      </section>

      {/* 6c. Dove è stato acquistato */}
      <section className="space-y-3">
        <h3 className="font-semibold">Dove è stato acquistato? <span className="text-destructive">*</span></h3>
        <RadioGroup
          name="purchasePlace"
          options={[
            { value: "physical", label: "Negozio fisico", sub: "Es. Unieuro, Apple Store…" },
            { value: "online", label: "Online", sub: "Es. Amazon, sito ufficiale…" },
          ]}
        />
      </section>

      {/* 6d. Prova di acquisto */}
      <section className="space-y-3">
        <h3 className="font-semibold">
          Hai la prova di acquisto? <span className="text-sm font-normal text-muted-foreground">(opzionale)</span>
        </h3>
        <p className="text-xs text-muted-foreground">Scontrino, fattura o ricevuta.</p>
        <RadioGroup
          name="hasProofOfPurchase"
          required={false}
          options={[
            { value: "yes", label: "Sì, ce l'ho" },
            { value: "no", label: "No, non ce l'ho" },
          ]}
        />
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
          Quanto ti aspetti di ricevere? <span className="text-destructive">*</span>
        </h3>
        <div className="relative max-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
          <input
            type="number"
            name="customerExpectedCents"
            min="0"
            step="1"
            placeholder="0"
            required
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

      {/* Foto dispositivo */}
      <section className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Foto del dispositivo
          <span className="text-sm font-normal text-muted-foreground">(opzionale, max 5)</span>
        </h3>
        <p className="text-sm text-muted-foreground">
          Carica foto della scocca, schermo e danni visibili — aiuta a ottenere una valutazione più precisa.
        </p>

        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((key, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPublicUrl(key)}
                  alt={`Foto ${i + 1}`}
                  className="h-20 w-20 rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center shadow"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {photos.length < 5 && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? "Caricamento…" : "Aggiungi foto"}
            </Button>
          </>
        )}

        {photoError && <p className="text-sm text-destructive">{photoError}</p>}
      </section>

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
        Invia risposte
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Le tue risposte vengono utilizzate solo per la valutazione del dispositivo.
      </p>
    </form>
  );
}
