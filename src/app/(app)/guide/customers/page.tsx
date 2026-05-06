import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { CustomerDemo } from "./customer-demo";

const steps = [
  { n: 1, title: "Aggiungi un cliente", body: "Vai su Clienti → Nuovo cliente. Inserisci nome, telefono, email e un'eventuale nota. Puoi anche creare un cliente direttamente dalla schermata di creazione ticket senza uscire dal flusso." },
  { n: 2, title: "Consulta la scheda cliente", body: "Ogni cliente ha una scheda con tutti i ticket storici, i contatti e la data dell'ultimo accesso. Da qui puoi aprire un nuovo ticket, inviare messaggi WhatsApp o modificare i dati." },
  { n: 3, title: "Gestisci il consenso GDPR", body: "Durante la creazione puoi registrare il consenso al trattamento dati. La data di firma viene salvata e appare nella scheda cliente per eventuali verifiche." },
  { n: 4, title: "Cerca e filtra i clienti", body: "Usa la barra di ricerca per trovare clienti per nome, telefono o email. I clienti con più ticket sono evidenziati per una consultazione rapida." },
];

export default function CustomersGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/guide">
          <button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" /> Guida
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-violet-100 p-1.5">
            <Users className="h-4 w-4 text-violet-600" />
          </div>
          <h1 className="text-xl font-bold">Clienti</h1>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-base">Come funziona</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{s.n}</div>
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="font-semibold text-base">Prova subito</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Demo interattiva — nessun dato reale viene salvato</p>
        </div>
        <CustomerDemo />
      </div>

      <div className="flex justify-end">
        <Link href="/customers/new" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
          Vai ai Clienti reali →
        </Link>
      </div>
    </div>
  );
}
