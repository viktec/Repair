import Link from "next/link";
import { ArrowLeft, Headset } from "lucide-react";
import { SupportDemo } from "./support-demo";

const steps = [
  { n: 1, title: "Crea pacchetti di assistenza", body: "Definisci i tuoi pacchetti (es. Piano Basic, Piano Pro) con prezzo, durata in mesi, numero di interventi inclusi e descrizione. I clienti potranno poi sottoscriverli." },
  { n: 2, title: "Attiva un contratto cliente", body: "Dalla scheda cliente o dalla sezione Assistenza, attiva un contratto associandolo a un pacchetto. Il sistema traccia data di inizio, scadenza e interventi residui." },
  { n: 3, title: "Registra gli interventi", body: "Per ogni visita on-site o intervento eseguito, crea un record con data, ore lavorate, descrizione e ricambi usati. Il cliente può firmare digitalmente il verbale dal suo smartphone." },
  { n: 4, title: "Monitora i contratti in scadenza", body: "La dashboard Assistenza mostra i contratti in scadenza nei prossimi 30 giorni così puoi contattare proattivamente il cliente per il rinnovo." },
];

export default function SupportGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/guide"><button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5" /> Guida</button></Link>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-teal-100 p-1.5"><Headset className="h-4 w-4 text-teal-600" /></div>
          <h1 className="text-xl font-bold">Assistenza clienti</h1>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-base">Come funziona</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{s.n}</div>
              <div><p className="font-medium text-sm">{s.title}</p><p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div><h2 className="font-semibold text-base">Prova subito</h2><p className="text-xs text-muted-foreground mt-0.5">Demo interattiva — nessun dato reale viene salvato</p></div>
        <SupportDemo />
      </div>
      <div className="flex justify-end">
        <Link href="/support" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Vai all'Assistenza reale →</Link>
      </div>
    </div>
  );
}
