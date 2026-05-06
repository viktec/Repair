import Link from "next/link";
import { ArrowLeft, Smartphone } from "lucide-react";
import { ImeiDemo } from "./imei-demo";

const steps = [
  { n: 1, title: "Cerca per IMEI", body: "Inserisci l'IMEI (15 cifre, visibile digitando *#06# sul dispositivo) nella barra di ricerca. Il sistema cerca tra tutti i ticket dell'organizzazione." },
  { n: 2, title: "Vedi lo storico completo", body: "Il risultato mostra tutti i ticket associati a quel dispositivo: data, tipo di intervento, stato finale, tecnico assegnato e costo. Utile per capire se un dispositivo ha già avuto problemi precedenti." },
  { n: 3, title: "Accedi direttamente al ticket", body: "Cliccando su un ticket nella lista puoi aprirlo direttamente senza dover ricordare il numero. Velocizza la consulenza al banco." },
];

export default function ImeiGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/guide"><button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5" /> Guida</button></Link>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-cyan-100 p-1.5"><Smartphone className="h-4 w-4 text-cyan-600" /></div>
          <h1 className="text-xl font-bold">Storico IMEI</h1>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-base">Come funziona</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">{s.n}</div>
              <div><p className="font-medium text-sm">{s.title}</p><p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div><h2 className="font-semibold text-base">Prova subito</h2><p className="text-xs text-muted-foreground mt-0.5">Cerca l'IMEI di esempio per vedere la demo</p></div>
        <ImeiDemo />
      </div>
      <div className="flex justify-end">
        <Link href="/imei" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Vai allo Storico IMEI reale →</Link>
      </div>
    </div>
  );
}
