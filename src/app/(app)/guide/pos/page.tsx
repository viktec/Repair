import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { PosDemo } from "./pos-demo";

const steps = [
  { n: 1, title: "Apri una sessione di cassa", body: "Prima di qualsiasi vendita devi aprire una sessione inserendo il fondo cassa iniziale (i contanti presenti in cassa all'apertura). Il sistema registra ora e operatore di apertura." },
  { n: 2, title: "Aggiungi articoli alla vendita", body: "Cerca articoli dal magazzino, da una lista predefinita o inserisci manualmente descrizione e prezzo. Puoi modificare quantità e applicare sconti su singoli articoli." },
  { n: 3, title: "Incassa e scegli il metodo di pagamento", body: "Seleziona tra contanti, carta o bonifico. Per i contanti il sistema calcola il resto automaticamente. Ogni transazione è registrata con marca temporale." },
  { n: 4, title: "Chiudi la sessione con il report Z", body: "A fine giornata chiudi la sessione. Il sistema genera il report Z con il totale venduto suddiviso per metodo di pagamento. Puoi stamparlo o scaricarlo." },
];

export default function PosGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/guide"><button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5" /> Guida</button></Link>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-100 p-1.5"><ShoppingCart className="h-4 w-4 text-emerald-600" /></div>
          <h1 className="text-xl font-bold">Cassa POS</h1>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-base">Come funziona</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{s.n}</div>
              <div><p className="font-medium text-sm">{s.title}</p><p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div><h2 className="font-semibold text-base">Prova subito</h2><p className="text-xs text-muted-foreground mt-0.5">Demo interattiva — nessun dato reale viene salvato</p></div>
        <PosDemo />
      </div>
      <div className="flex justify-end">
        <Link href="/pos" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Vai alla Cassa POS reale →</Link>
      </div>
    </div>
  );
}
