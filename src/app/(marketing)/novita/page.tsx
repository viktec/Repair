import type { Metadata } from "next";
import { ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Novità — Aggiornamenti e nuove funzionalità",
  description:
    "Scopri gli ultimi aggiornamenti di My-Repair: nuove funzionalità, miglioramenti e correzioni per il tuo gestionale centri di riparazione smartphone, PC e TV.",
  keywords: [
    "aggiornamenti gestionale riparazioni", "novità software riparazione",
    "changelog My-Repair", "nuove funzionalità gestionale officina",
  ],
  alternates: { canonical: "https://my-repair.it/novita" },
  openGraph: {
    title: "Novità | My-Repair",
    description:
      "Ultimi aggiornamenti di My-Repair: nuove funzionalità, miglioramenti e correzioni per il gestionale centri di riparazione.",
    url: "https://my-repair.it/novita",
  },
};

type Release = {
  version: string;
  date: string;
  label?: "new" | "fix" | "improved";
  title: string;
  changes: { type: "new" | "fix" | "improved"; text: string }[];
};

const releases: Release[] = [
  {
    version: "1.5",
    date: "2025-05-01",
    label: "new",
    title: "Registro Usato & Permessi granulari",
    changes: [
      { type: "new", text: "Registro Usato: acquisto e vendita di dispositivi con IMEI, documento venditore e export CSV" },
      { type: "new", text: "Permessi granulari: ogni ruolo (tecnico, front-desk) ha visibilità controllata sui moduli" },
      { type: "new", text: "Log attività: storico completo delle azioni degli utenti del team" },
      { type: "improved", text: "Sidebar dinamica: mostra solo i moduli accessibili al ruolo dell'utente" },
    ],
  },
  {
    version: "1.4",
    date: "2025-04-15",
    label: "new",
    title: "Report avanzati & Storico IMEI",
    changes: [
      { type: "new", text: "Report mensili con KPI: ticket, fatturato, tempo medio e confronto periodo precedente" },
      { type: "new", text: "Performance per tecnico: ticket aperti/chiusi e tempo medio per riparazione" },
      { type: "new", text: "Storico IMEI: cerca qualsiasi dispositivo per IMEI e vedi tutti i ticket" },
      { type: "improved", text: "Export CSV da qualsiasi tabella (clienti, magazzino, report)" },
    ],
  },
  {
    version: "1.3",
    date: "2025-03-20",
    label: "new",
    title: "Cassa POS & Fornitori",
    changes: [
      { type: "new", text: "Cassa POS con sessioni, report Z e scontrino A4 o termica" },
      { type: "new", text: "Metodi di pagamento: contanti, carta, bonifico per ogni transazione" },
      { type: "new", text: "Anagrafica fornitori con ordini d'acquisto e PDF generato automaticamente" },
      { type: "improved", text: "Magazzino collegato: i movimenti si aggiornano su ordine e vendita" },
    ],
  },
  {
    version: "1.2",
    date: "2025-02-10",
    label: "new",
    title: "Assistenza Business & Verbale digitale",
    changes: [
      { type: "new", text: "Assistenza Business: contratti ore mensili per clienti aziendali" },
      { type: "new", text: "Verbale intervento: il cliente firma direttamente dal suo smartphone via link" },
      { type: "new", text: "PDF verbale firmato scaricabile e allegato automaticamente all'intervento" },
      { type: "improved", text: "Portale cliente dedicato per seguire lo stato del contratto" },
    ],
  },
  {
    version: "1.1",
    date: "2025-01-15",
    label: "improved",
    title: "Magazzino, inviti team & dashboard",
    changes: [
      { type: "new", text: "Magazzino con soglie minime, alert automatici e storico movimenti" },
      { type: "new", text: "Inviti team via email: il collaboratore accetta e accede direttamente" },
      { type: "improved", text: "Dashboard con KPI giornalieri: ticket aperti, da consegnare, fatturato del mese" },
      { type: "fix", text: "Notifiche email al cliente per aggiornamento stato ticket" },
    ],
  },
  {
    version: "1.0",
    date: "2024-12-01",
    label: "new",
    title: "Lancio — Ticket, Clienti & QR tracking",
    changes: [
      { type: "new", text: "Gestione ticket con foto pre/post riparazione, IMEI e preventivo" },
      { type: "new", text: "QR code pubblico per il cliente: segue lo stato in tempo reale senza login" },
      { type: "new", text: "Firma digitale modulo di accettazione su tablet o smartphone" },
      { type: "new", text: "Scheda clienti con storico ticket completo e consenso GDPR" },
    ],
  },
];

const TYPE_STYLE: Record<string, string> = {
  new:      "bg-emerald-100 text-emerald-700",
  fix:      "bg-red-100 text-red-700",
  improved: "bg-blue-100 text-blue-700",
};
const TYPE_LABEL: Record<string, string> = {
  new: "Nuovo", fix: "Fix", improved: "Migliorato",
};

const LABEL_STYLE: Record<string, string> = {
  new:      "bg-emerald-500 text-white",
  fix:      "bg-red-500 text-white",
  improved: "bg-blue-500 text-white",
};

export default function NovitaPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="container text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-medium mb-5">
            <Zap className="h-3.5 w-3.5" />
            Aggiornamenti continui
          </div>
          <h1 className="text-4xl font-bold mb-4">Novità di My-Repair</h1>
          <p className="text-muted-foreground leading-relaxed">
            Nuove funzionalità, miglioramenti e fix. My-Repair cresce ogni settimana
            grazie al feedback dei centri di riparazione italiani.
          </p>
        </div>
      </section>

      {/* Releases */}
      <section className="py-16">
        <div className="container max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-slate-200 hidden sm:block" />

            <div className="space-y-12">
              {releases.map((r) => (
                <div key={r.version} className="flex flex-col sm:flex-row gap-6">
                  {/* Date + version */}
                  <div className="sm:w-[80px] shrink-0 text-right">
                    <p className="text-xs font-semibold text-foreground">v{r.version}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(r.date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {r.label && (
                      <span className={`mt-1.5 inline-block text-[10px] font-bold rounded-full px-2 py-0.5 ${LABEL_STYLE[r.label]}`}>
                        {TYPE_LABEL[r.label]}
                      </span>
                    )}
                  </div>

                  {/* Dot */}
                  <div className="hidden sm:flex items-start justify-center w-4 shrink-0 mt-0.5">
                    <span className="h-3 w-3 rounded-full bg-primary border-2 border-white shadow" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-2xl border bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-foreground mb-3">{r.title}</h2>
                    <ul className="space-y-2">
                      {r.changes.map((c, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className={`shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 mt-0.5 ${TYPE_STYLE[c.type]}`}>
                            {TYPE_LABEL[c.type]}
                          </span>
                          <span className="text-sm text-foreground leading-snug">{c.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50 border-t">
        <div className="container text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Nuove funzioni ogni mese</h2>
          <p className="text-muted-foreground text-sm mb-6">
            My-Repair evolve con le esigenze reali dei centri di riparazione. 14 giorni gratis per provare tutto.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Inizia gratis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
