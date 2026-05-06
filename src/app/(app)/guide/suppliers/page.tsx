import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { SuppliersDemo } from "./suppliers-demo";

const steps = [
  { n: 1, title: "Aggiungi un fornitore", body: "Registra i tuoi fornitori con nome, email, telefono, partita IVA e condizioni di pagamento. Puoi aggiungere note interne e i tempi medi di consegna." },
  { n: 2, title: "Crea un ordine di acquisto", body: "Dal pannello fornitore clicca 'Nuovo ordine'. Aggiungi gli articoli con quantità e prezzo unitario. L'ordine viene salvato con stato 'Inviato' e puoi generare un PDF da inviare via email." },
  { n: 3, title: "Ricevi la merce e aggiorna il magazzino", body: "Quando arriva la merce, cambia lo stato dell'ordine in 'Ricevuto'. Se usi la funzione di importazione fattura, il sistema aggiorna automaticamente le quantità a magazzino." },
];

export default function SuppliersGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/guide"><button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5" /> Guida</button></Link>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-100 p-1.5"><Truck className="h-4 w-4 text-amber-600" /></div>
          <h1 className="text-xl font-bold">Fornitori</h1>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-base">Come funziona</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">{s.n}</div>
              <div><p className="font-medium text-sm">{s.title}</p><p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div><h2 className="font-semibold text-base">Prova subito</h2><p className="text-xs text-muted-foreground mt-0.5">Demo interattiva — nessun dato reale viene salvato</p></div>
        <SuppliersDemo />
      </div>
      <div className="flex justify-end">
        <Link href="/suppliers" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Vai ai Fornitori reali →</Link>
      </div>
    </div>
  );
}
