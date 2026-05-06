import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { InventoryDemo } from "./inventory-demo";

const steps = [
  { n: 1, title: "Aggiungi un articolo al magazzino", body: "Crea una scheda articolo con nome, categoria, SKU, costo di acquisto e prezzo di vendita. Imposta la quantità minima per ricevere un avviso quando le scorte sono in esaurimento." },
  { n: 2, title: "Registra un movimento", body: "Ogni carico (acquisto) o scarico (utilizzo, vendita) viene registrato come movimento. Indica quantità, tipo (carico/scarico) e una nota opzionale. Lo stock si aggiorna in tempo reale." },
  { n: 3, title: "Monitora le scorte minime", body: "Gli articoli con quantità inferiore al minimo impostato appaiono evidenziati in rosso nella lista. Un colpo d'occhio ti dice cosa ordinare al fornitore." },
  { n: 4, title: "Collega al fornitore", body: "Puoi associare ogni articolo a un fornitore e creare ordini di acquisto direttamente dalla scheda articolo, senza dover passare dalla sezione Fornitori." },
];

export default function InventoryGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/guide"><button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"><ArrowLeft className="h-3.5 w-3.5" /> Guida</button></Link>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-orange-100 p-1.5"><Package className="h-4 w-4 text-orange-600" /></div>
          <h1 className="text-xl font-bold">Magazzino</h1>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-base">Come funziona</h2>
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">{s.n}</div>
              <div><p className="font-medium text-sm">{s.title}</p><p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div><h2 className="font-semibold text-base">Prova subito</h2><p className="text-xs text-muted-foreground mt-0.5">Demo interattiva — nessun dato reale viene salvato</p></div>
        <InventoryDemo />
      </div>
      <div className="flex justify-end">
        <Link href="/inventory" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">Vai al Magazzino reale →</Link>
      </div>
    </div>
  );
}
