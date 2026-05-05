"use client";

import { useState, useRef, useTransition } from "react";
import { Loader2, Send, Paperclip, X, CheckCircle2, Clock, Zap } from "lucide-react";

type Props = {
  token: string;
  primaryColor: string;
  urgencySurchargePercent: number;
};

type SuccessResult = { interventionId: string; interventionNumber: string };

export function ClientPortalForm({ token, primaryColor, urgencySurchargePercent }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const allowed = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type),
    );
    setPhotos((prev) => [...prev, ...allowed].slice(0, 3));
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Il titolo è obbligatorio."); return; }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("token", token);
      formData.set("title", title.trim());
      formData.set("description", description.trim());
      formData.set("isUrgent", isUrgent ? "true" : "false");
      for (const photo of photos) formData.append("photos", photo);

      const res = await fetch("/api/support/client-request", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Errore durante l'invio. Riprova.");
        return;
      }
      setSuccess({ interventionId: data.interventionId, interventionNumber: data.interventionNumber });
    });
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: primaryColor + "20" }}
          >
            <CheckCircle2 className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <p className="text-base font-semibold text-foreground">
            Richiesta inviata con successo!
          </p>
          <p className="text-sm text-muted-foreground">
            Il nostro team ti contatterà a breve.
          </p>
          <p className="text-xs text-muted-foreground">
            Numero intervento: <span className="font-medium">{success.interventionNumber}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-foreground">Apri nuova richiesta</p>

      <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Le richieste vengono prese in carico entro <strong>24–72 ore</strong> dalla ricezione.
          Il primo tecnico disponibile ti contatterà per procedere con l&apos;assistenza.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Titolo */}
        <div className="space-y-1.5">
          <label htmlFor="req-title" className="text-sm font-medium text-foreground">
            Titolo <span className="text-red-500">*</span>
          </label>
          <input
            id="req-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es: Stampante non risponde, Email non funziona…"
            maxLength={200}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
          />
        </div>

        {/* Descrizione */}
        <div className="space-y-1.5">
          <label htmlFor="req-desc" className="text-sm font-medium text-foreground">
            Descrizione del problema
          </label>
          <textarea
            id="req-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrivi il problema nel dettaglio: quando si verifica, cosa hai già provato…"
            rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 resize-none"
            style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
          />
        </div>

        {/* Urgenza */}
        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Richiesta urgente</span>
            </div>
          </label>
          {isUrgent ? (
            <div className="ml-7 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-2 text-xs text-amber-800 leading-relaxed">
              <strong>Presa in carico entro 24 ore.</strong>
              {urgencySurchargePercent > 0
                ? ` Le ore di intervento verranno maggiorate del ${urgencySurchargePercent}% per la gestione urgente.`
                : " Comporta una maggiorazione sulle ore di intervento."}
            </div>
          ) : (
            <p className="ml-7 text-xs text-muted-foreground">
              Spunta solo se il problema blocca l&apos;operatività. Le richieste urgenti hanno una maggiorazione{urgencySurchargePercent > 0 ? ` del ${urgencySurchargePercent}%` : ""} sulle ore.
            </p>
          )}
        </div>

        {/* Foto allegate */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">
            Foto allegate{" "}
            <span className="text-xs font-normal text-muted-foreground">(max 3)</span>
          </p>

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photos.map((f, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-white"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 3 && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-muted-foreground hover:border-slate-400 hover:bg-slate-50 transition-colors w-full"
              >
                <Paperclip className="h-4 w-4" />
                Aggiungi foto
              </button>
            </>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: primaryColor }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Invia richiesta
        </button>
      </form>
    </div>
  );
}
