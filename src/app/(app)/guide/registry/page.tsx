import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { RegistryDemo } from "./registry-demo";

const steps = [
  { n: 1, title: "Registra l'acquisto di un usato", body: "Quando acquisti un dispositivo usato da un privato, compila il registro obbligatorio: tipo di dispositivo, marca, modello, IMEI/seriale, prezzo pagato, documento d'identità del venditore." },
  { n: 2, title: "Rispetta gli obblighi normativi", body: "Il registro usato è obbligatorio per i rivenditori di dispositivi elettronici usati in base al D.Lgs. 114/1998 e alle normative locali. Ogni entry viene salvata con timestamp immutabile." },
  { n: 3, title: "Registra la vendita", body: "Quando rivendi il dispositivo, aggiorna il registro con la data di vendita e il prezzo. Il sistema mantiene lo storico completo per eventuali verifiche delle forze dell'ordine." },
  { n: 4, title: "Esporta per la Polizia", body: "Puoi esportare il registro in formato CSV per le comunicazioni periodiche all'autorità di pubblica sicurezza, in conformità con le normative vigenti." },
];

export default function RegistryGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/guide"><button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5" /> Guida</button></Link>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-100 p-1.5"><BookOpen className="h-4 w-4 text-indigo-600" /></div>
          <h1 className="text-xl font-bold">Registro Usato</h1>
        </div>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
        <BookOpen className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Nota legale:</strong> Il Registro Usato è soggetto alle normative locali. Verifica con un consulente legale gli obblighi specifici applicabili alla tua attività.
        </p>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-base">Come funziona</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{s.n}</div>
              <div><p className="font-medium text-sm">{s.title}</p><p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div><h2 className="font-semibold text-base">Prova subito</h2><p className="text-xs text-muted-foreground mt-0.5">Demo interattiva — nessun dato reale viene salvato</p></div>
        <RegistryDemo />
      </div>
      <div className="flex justify-end">
        <Link href="/registry" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Vai al Registro Usato reale →</Link>
      </div>
    </div>
  );
}
