import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { ReportsDemo } from "./reports-demo";

const steps = [
  { n: 1, title: "Seleziona il periodo", body: "Scegli il range temporale da analizzare: oggi, ultimi 7 giorni, questo mese, o un intervallo personalizzato. I dati si aggiornano in tempo reale." },
  { n: 2, title: "Analizza i KPI principali", body: "Ticket creati e chiusi, tempo medio di riparazione, fatturato stimato e incassato tramite POS, tasso di completamento. Ogni metrica confrontata con il periodo precedente." },
  { n: 3, title: "Consulta il dettaglio per tecnico", body: "Vedi quanti ticket ha gestito ogni membro del team, il tempo medio e la percentuale di ticket chiusi entro la scadenza stimata." },
  { n: 4, title: "Analizza i dispositivi più riparati", body: "Scopri quali brand e modelli entrano più spesso in riparazione, e quali guasti sono più frequenti — utile per ottimizzare lo stock di ricambi." },
];

export default function ReportsGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/guide"><button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5" /> Guida</button></Link>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-rose-100 p-1.5"><BarChart3 className="h-4 w-4 text-rose-600" /></div>
          <h1 className="text-xl font-bold">Report</h1>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-base">Come funziona</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">{s.n}</div>
              <div><p className="font-medium text-sm">{s.title}</p><p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div><h2 className="font-semibold text-base">Prova subito</h2><p className="text-xs text-muted-foreground mt-0.5">Demo interattiva con dati di esempio</p></div>
        <ReportsDemo />
      </div>
      <div className="flex justify-end">
        <Link href="/reports" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Vai ai Report reali →</Link>
      </div>
    </div>
  );
}
