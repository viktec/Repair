"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function RegistryDemo() {
  const [phase, setPhase] = useState<"form" | "saved">("form");
  const [device, setDevice] = useState("iPhone 13");
  const [imei, setImei] = useState("353879110000001");
  const [price, setPrice] = useState("120");
  const [seller, setSeller] = useState("Giuseppe Verdi");
  const [doc, setDoc] = useState("CI AA1234567");

  if (phase === "saved") {
    const now = new Date();
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">Registrazione completata e salvata nel registro.</p>
        </div>
        <div className="rounded-lg border divide-y text-sm">
          {[
            ["Dispositivo", device],
            ["IMEI / Seriale", imei],
            ["Prezzo acquisto", `€${parseFloat(price).toFixed(2)}`],
            ["Venditore", seller],
            ["Documento", doc],
            ["Data registrazione", now.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })],
            ["Stato", "Acquistato — in giacenza"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setPhase("form")} className="text-xs text-primary hover:underline">← Ricomincia demo</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Dispositivo *</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={device} onChange={e => setDevice(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">IMEI / Seriale *</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm font-mono" value={imei} onChange={e => setImei(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Prezzo acquisto (€) *</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm" type="number" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nome venditore *</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={seller} onChange={e => setSeller(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Documento identità *</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={doc} onChange={e => setDoc(e.target.value)} placeholder="CI / Passaporto" />
        </div>
      </div>
      <button
        onClick={() => setPhase("saved")}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        Registra acquisto →
      </button>
    </div>
  );
}
