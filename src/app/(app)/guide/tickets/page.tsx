import Link from "next/link";
import { ArrowLeft, Ticket } from "lucide-react";
import { TicketDemo } from "./ticket-demo";

const steps = [
  {
    n: 1,
    title: "Crea un nuovo ticket",
    body: "Vai su Ticket → Nuovo ticket. Inserisci il cliente (o creane uno al volo), il dispositivo (marca, modello, IMEI), la descrizione del guasto e il preventivo stimato. Ogni ticket riceve un numero progressivo e un QR code univoco.",
  },
  {
    n: 2,
    title: "Assegna e aggiorna lo stato",
    body: "Lo stato riflette la fase della riparazione. Puoi usare gli stati predefiniti (In attesa, Diagnosi, In riparazione, Pronto, Consegnato) o crearne di personalizzati in Impostazioni. Il cliente riceve un'email automatica a ogni cambio stato.",
  },
  {
    n: 3,
    title: "Tieni traccia con il QR code",
    body: "Ogni ticket ha un link pubblico che il cliente può aprire per vedere lo stato in tempo reale, le foto del dispositivo e i tuoi messaggi. Nessun accesso richiesto — basta scansionare il QR.",
  },
  {
    n: 4,
    title: "Comunica via WhatsApp o email",
    body: "Dal dettaglio ticket puoi copiare un messaggio preformattato per WhatsApp, inviare un'email di aggiornamento stato, oppure generare e far firmare digitalmente il verbale di intervento.",
  },
];

export default function TicketsGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/guide">
          <button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" /> Guida
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-100 p-1.5">
            <Ticket className="h-4 w-4 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold">Gestione Ticket</h1>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-base">Come funziona</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {s.n}
              </div>
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
        <TicketDemo />
      </div>

      <div className="flex justify-end">
        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Vai ai Ticket reali →
        </Link>
      </div>
    </div>
  );
}
