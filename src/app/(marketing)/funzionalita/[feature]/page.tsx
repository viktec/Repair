import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import {
  Wrench, Users, QrCode, Package, BarChart3, Headset,
  Zap, FileSignature, Shield,
} from "lucide-react";
import { DemoSection } from "./demo-section";

const FEATURES: Record<string, {
  icon: React.ElementType;
  color: string;
  title: string;
  tagline: string;
  desc: string;
  how: { step: string; text: string }[];
  highlights: string[];
}> = {
  ticket: {
    icon: Wrench,
    color: "bg-blue-50 text-blue-600",
    title: "Gestione Ticket",
    tagline: "Dal banco al cliente, tutto tracciato",
    desc: "Apri un ticket in meno di 30 secondi: seleziona il cliente, inserisci il dispositivo, l'IMEI e la descrizione del guasto. Il sistema genera automaticamente un QR code che il cliente può scansionare per seguire lo stato senza chiamarti.",
    how: [
      { step: "1", text: "Seleziona il cliente o creane uno al volo direttamente dal form" },
      { step: "2", text: "Inserisci dispositivo, IMEI, descrizione del guasto e preventivo" },
      { step: "3", text: "Allega foto pre-riparazione e fai firmare il modulo di accettazione" },
      { step: "4", text: "Aggiorna lo stato man mano — il cliente riceve email automatiche" },
    ],
    highlights: [
      "Ticket creato in 30 secondi", "QR tracking pubblico senza login", "Firma digitale accettazione",
      "Foto pre/durante/post riparazione", "Notifiche email automatiche", "Preventivo allegato al ticket",
    ],
  },
  clienti: {
    icon: Users,
    color: "bg-violet-50 text-violet-600",
    title: "Clienti",
    tagline: "Ogni cliente, tutta la sua storia",
    desc: "Scheda cliente completa con nome, telefono, email e storico di tutti i ticket. Il consenso GDPR viene registrato al primo accesso. Cerca per nome, telefono o email in tempo reale.",
    how: [
      { step: "1", text: "Cerca un cliente per nome, telefono o email — risultati istantanei" },
      { step: "2", text: "Apri la scheda: vedi tutti i ticket passati e il loro esito" },
      { step: "3", text: "Crea un nuovo cliente direttamente dal form ticket senza uscire" },
      { step: "4", text: "Consenso GDPR registrato automaticamente con timestamp" },
    ],
    highlights: [
      "Ricerca istantanea per nome/tel/email", "Storico ticket completo", "GDPR integrato con timestamp",
      "Creazione rapida dal ticket", "Contatti in un click", "Export dati clienti (CSV)",
    ],
  },
  cassa: {
    icon: QrCode,
    color: "bg-emerald-50 text-emerald-600",
    title: "Cassa POS",
    tagline: "Incassa veloce, chiudi la giornata",
    desc: "Apri una sessione di cassa, aggiungi prodotti dal catalogo o manualmente, seleziona il metodo di pagamento e stampa lo scontrino. Alla fine della giornata chiudi con il report Z.",
    how: [
      { step: "1", text: "Apri una sessione di cassa con il fondo cassa iniziale" },
      { step: "2", text: "Aggiungi articoli dal catalogo o inseriscili manualmente" },
      { step: "3", text: "Scegli il metodo: contanti, carta o bonifico" },
      { step: "4", text: "Stampa scontrino A4 o termica e chiudi la sessione con il report Z" },
    ],
    highlights: [
      "Sessioni di cassa con report Z", "Contanti, carta, bonifico", "Scontrino A4 o termica",
      "Catalogo prodotti rapido", "Storico transazioni completo", "Collegato al magazzino",
    ],
  },
  magazzino: {
    icon: Package,
    color: "bg-orange-50 text-orange-600",
    title: "Magazzino",
    tagline: "Scorte sempre sotto controllo",
    desc: "Tieni traccia di ogni ricambio con movimenti di carico e scarico. Imposta soglie minime per ogni articolo e ricevi alert automatici quando le scorte scendono. Collega ogni articolo al fornitore.",
    how: [
      { step: "1", text: "Aggiungi articoli al catalogo con codice, quantità e soglia minima" },
      { step: "2", text: "Registra movimenti di carico (da fornitore) o scarico (su ticket)" },
      { step: "3", text: "Ricevi alert automatici quando la scorta scende sotto la soglia" },
      { step: "4", text: "Visualizza lo storico completo di ogni articolo" },
    ],
    highlights: [
      "Alert scorte minime automatici", "Movimenti carico/scarico", "Collegato ai fornitori",
      "Storico movimenti completo", "Codice articolo/barcode", "Import da fattura fornitore",
    ],
  },
  report: {
    icon: BarChart3,
    color: "bg-rose-50 text-rose-600",
    title: "Report",
    tagline: "Dati veri per decisioni migliori",
    desc: "KPI mensili in un colpo d'occhio: ticket aperti/chiusi, fatturato, tempo medio di riparazione. Analizza le performance per tecnico e scopri i dispositivi più riparati nel periodo selezionato.",
    how: [
      { step: "1", text: "Seleziona il periodo: settimana, mese, trimestre o personalizzato" },
      { step: "2", text: "Leggi i KPI principali: ticket, fatturato, tempo medio" },
      { step: "3", text: "Analizza le performance per tecnico per ottimizzare il team" },
      { step: "4", text: "Confronta con il periodo precedente per vedere il trend" },
    ],
    highlights: [
      "KPI: ticket, fatturato, tempi", "Performance per tecnico", "Dispositivi più riparati",
      "Confronto periodo precedente", "Selezione periodo libera", "Export CSV",
    ],
  },
  assistenza: {
    icon: Headset,
    color: "bg-teal-50 text-teal-600",
    title: "Assistenza Business",
    tagline: "Contratti ore per clienti aziendali",
    desc: "Gestisci contratti di assistenza mensili per i tuoi clienti business. Ogni intervento on-site viene documentato con un verbale digitale che il cliente firma direttamente sul suo smartphone.",
    how: [
      { step: "1", text: "Crea un contratto con il pacchetto ore mensili concordato" },
      { step: "2", text: "Apri un intervento: data, ora, tecnico assegnato e descrizione" },
      { step: "3", text: "Il cliente firma il verbale digitale sul suo smartphone via link" },
      { step: "4", text: "Scarica il verbale firmato in PDF — ore scalate dal contratto" },
    ],
    highlights: [
      "Pacchetti ore mensili", "Verbale firmato digitalmente", "Portale cliente dedicato",
      "Storico interventi completo", "PDF scaricabile", "Alert ore residue",
    ],
  },
  imei: {
    icon: Zap,
    color: "bg-cyan-50 text-cyan-600",
    title: "Storico IMEI",
    tagline: "Ogni dispositivo ha la sua storia",
    desc: "Cerca qualsiasi dispositivo per IMEI e vedi in un secondo tutti i ticket associati, con data, tecnico e esito. Ideale per la consulenza al banco quando un cliente torna con lo stesso dispositivo.",
    how: [
      { step: "1", text: "Digita l'IMEI nella barra di ricerca (15 cifre)" },
      { step: "2", text: "Il sistema mostra tutti i ticket legati a quel dispositivo" },
      { step: "3", text: "Clicca su un ticket per vedere i dettagli completi" },
      { step: "4", text: "Funziona anche multi-sede: vedi la storia da qualsiasi laboratorio" },
    ],
    highlights: [
      "Ricerca istantanea per IMEI", "Tutti i ticket del dispositivo", "Link diretto al ticket",
      "Multi-sede", "Senza limiti di storico", "Ideale per la consulenza al banco",
    ],
  },
  fornitori: {
    icon: FileSignature,
    color: "bg-amber-50 text-amber-600",
    title: "Fornitori",
    tagline: "Ordina ricambi senza perdere tempo",
    desc: "Anagrafica fornitori con contatti, listino e storico ordini. Crea ordini d'acquisto selezionando gli articoli dal catalogo, genera il PDF e invialo via email al fornitore.",
    how: [
      { step: "1", text: "Registra i tuoi fornitori con contatti e condizioni" },
      { step: "2", text: "Crea un ordine d'acquisto selezionando gli articoli e le quantità" },
      { step: "3", text: "Genera il PDF dell'ordine e invialo via email" },
      { step: "4", text: "Traccia lo stato della consegna — il magazzino si aggiorna al ricevimento" },
    ],
    highlights: [
      "Anagrafica fornitori completa", "Ordini d'acquisto con PDF", "Stato consegna tracciato",
      "Collegato al magazzino", "Storico ordini completo", "Email ordine in un click",
    ],
  },
  registro: {
    icon: Shield,
    color: "bg-indigo-50 text-indigo-600",
    title: "Registro Usato",
    tagline: "Conformità normativa senza carta",
    desc: "Registro digitale per l'acquisto e la vendita di dispositivi usati, obbligatorio per i rivenditori. Registra IMEI, documento del venditore e genera il CSV per le autorità in qualsiasi momento.",
    how: [
      { step: "1", text: "Inserisci i dati del dispositivo: tipo, marca, modello, IMEI" },
      { step: "2", text: "Registra i dati del venditore con documento d'identità" },
      { step: "3", text: "Il timestamp viene registrato e non può essere modificato" },
      { step: "4", text: "Esporta il CSV per le autorità quando richiesto" },
    ],
    highlights: [
      "Registro acquisti con IMEI", "Documento venditore registrato", "Export CSV per autorità",
      "Timestamp immutabile", "Conforme alla normativa", "Niente carta",
    ],
  },
};

const FEATURE_ORDER = [
  "ticket", "clienti", "cassa", "magazzino", "report",
  "assistenza", "imei", "fornitori", "registro",
];

export function generateStaticParams() {
  return Object.keys(FEATURES).map((feature) => ({ feature }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ feature: string }> }
): Promise<Metadata> {
  const { feature } = await params;
  const config = FEATURES[feature];
  if (!config) return {};
  const url = `https://my-repair.it/funzionalita/${feature}`;
  return {
    title: config.title,
    description: `${config.desc} My-Repair — gestionale per centri di riparazione smartphone, PC e TV.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${config.title} | My-Repair`,
      description: config.desc,
      url,
    },
  };
}

export default async function FeaturePage({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = await params;
  const config = FEATURES[feature];
  if (!config) notFound();

  const Icon = config.icon;
  const currentIdx = FEATURE_ORDER.indexOf(feature);
  const prevSlug = currentIdx > 0 ? FEATURE_ORDER[currentIdx - 1] : null;
  const nextSlug = currentIdx < FEATURE_ORDER.length - 1 ? FEATURE_ORDER[currentIdx + 1] : null;
  const prevConfig = prevSlug ? FEATURES[prevSlug] : null;
  const nextConfig = nextSlug ? FEATURES[nextSlug] : null;

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b bg-slate-50">
        <div className="container py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/funzionalita" className="hover:text-foreground transition-colors">Funzionalità</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{config.title}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 bg-slate-50 border-b">
        <div className="container max-w-3xl mx-auto text-center">
          <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${config.color} mb-5`}>
            <Icon className="h-7 w-7" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{config.tagline}</p>
          <h1 className="text-4xl font-bold mb-4">{config.title}</h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">{config.desc}</p>
        </div>
      </section>

      {/* How it works + Demo */}
      <section className="py-16">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Steps */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-6">Come funziona</p>
              <ol className="space-y-5">
                {config.how.map((h) => (
                  <li key={h.step} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                      {h.step}
                    </span>
                    <p className="text-sm text-foreground leading-relaxed pt-0.5">{h.text}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-wrap gap-2">
                {config.highlights.map((h) => (
                  <span key={h} className="text-[11px] bg-slate-100 text-slate-600 rounded-full px-3 py-1.5 font-medium">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive demo */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">Demo interattiva</p>
              <div className="rounded-2xl border bg-white shadow-md overflow-hidden">
                {/* Fake browser bar */}
                <div className="flex items-center gap-1.5 bg-slate-100 border-b px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-slate-400 bg-white rounded px-2 py-0.5 border flex-1 max-w-[200px]">
                    app.my-repair.it
                  </span>
                </div>
                <div className="p-5">
                  <DemoSection feature={feature} />
                </div>
              </div>
              <p className="text-center text-[11px] text-muted-foreground mt-3">
                Demo completamente interattiva — nessun login richiesto
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature nav */}
      <section className="border-t py-10 bg-slate-50">
        <div className="container max-w-5xl mx-auto flex items-center justify-between gap-4">
          {prevSlug && prevConfig ? (
            <Link
              href={`/funzionalita/${prevSlug}`}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {prevConfig.title}
            </Link>
          ) : <span />}
          <Link
            href="/funzionalita"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Tutte le funzionalità
          </Link>
          {nextSlug && nextConfig ? (
            <Link
              href={`/funzionalita/${nextSlug}`}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {nextConfig.title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : <span />}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-teal-700 to-emerald-600 text-white">
        <div className="container text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Pronto a provare {config.title}?</h2>
          <p className="text-white/80 text-sm mb-6">14 giorni gratis, nessuna carta di credito. Tutto incluso.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary hover:bg-white/90 transition-colors shadow-lg"
          >
            Inizia gratis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
