import Link from "next/link";
import { ArrowRight, ChevronRight, Wrench, Users, QrCode, Package, BarChart3, Headset, Zap, FileSignature, Shield } from "lucide-react";

const features = [
  {
    slug: "ticket",
    icon: Wrench,
    color: "bg-blue-50 text-blue-600",
    title: "Gestione Ticket",
    tagline: "Dal banco al cliente, tutto tracciato",
    desc: "Crea ticket in 30 secondi con foto, IMEI e descrizione del guasto. Il cliente riceve un QR per seguire lo stato in tempo reale senza chiamare.",
    highlights: ["Foto pre/durante/post riparazione", "QR tracking pubblico", "Firma digitale accettazione", "Notifiche email automatiche"],
  },
  {
    slug: "clienti",
    icon: Users,
    color: "bg-violet-50 text-violet-600",
    title: "Clienti",
    tagline: "Ogni cliente, tutta la sua storia",
    desc: "Scheda cliente completa con storico ticket, contatti e consenso GDPR registrato. Crea un cliente al volo direttamente dal ticket.",
    highlights: ["Storico ticket completo", "GDPR integrato", "Ricerca per nome/telefono/email", "Crea dal ticket senza uscire"],
  },
  {
    slug: "cassa",
    icon: QrCode,
    color: "bg-emerald-50 text-emerald-600",
    title: "Cassa POS",
    tagline: "Incassa veloce, chiudi la giornata",
    desc: "Apri una sessione di cassa, aggiungi articoli, incassa e chiudi con il report Z. Contanti, carta o bonifico.",
    highlights: ["Sessioni di cassa con report Z", "Contanti, carta, bonifico", "Scontrino A4 o termica", "Storico transazioni completo"],
  },
  {
    slug: "magazzino",
    icon: Package,
    color: "bg-orange-50 text-orange-600",
    title: "Magazzino",
    tagline: "Scorte sempre sotto controllo",
    desc: "Gestisci i ricambi con movimenti in/out, soglie minime e alert automatici. Collega ogni articolo al fornitore.",
    highlights: ["Alert scorte minime", "Movimenti carico/scarico", "Collegato ai fornitori", "Import da fattura fornitore"],
  },
  {
    slug: "report",
    icon: BarChart3,
    color: "bg-rose-50 text-rose-600",
    title: "Report",
    tagline: "Dati veri per decisioni migliori",
    desc: "KPI mensili, fatturato, performance tecnici e dispositivi più riparati. Seleziona il periodo e confronta con quello precedente.",
    highlights: ["KPI: ticket, fatturato, tempi", "Performance per tecnico", "Dispositivi più riparati", "Confronto periodo precedente"],
  },
  {
    slug: "assistenza",
    icon: Headset,
    color: "bg-teal-50 text-teal-600",
    title: "Assistenza Business",
    tagline: "Contratti ore per clienti aziendali",
    desc: "Pacchetti di assistenza mensili per clienti business. Interventi on-site con verbale digitale firmato dal cliente sul suo smartphone.",
    highlights: ["Pacchetti ore mensili", "Verbale firmato digitalmente", "Portale cliente dedicato", "Storico interventi completo"],
  },
  {
    slug: "imei",
    icon: Zap,
    color: "bg-cyan-50 text-cyan-600",
    title: "Storico IMEI",
    tagline: "Ogni dispositivo ha la sua storia",
    desc: "Cerca qualsiasi dispositivo per IMEI e vedi in un secondo tutti i ticket associati. Ideale per la consulenza al banco.",
    highlights: ["Ricerca istantanea per IMEI", "Tutti i ticket del dispositivo", "Link diretto al ticket", "Storico multi-sede"],
  },
  {
    slug: "fornitori",
    icon: FileSignature,
    color: "bg-amber-50 text-amber-600",
    title: "Fornitori",
    tagline: "Ordina ricambi senza perdere tempo",
    desc: "Gestisci i tuoi fornitori, crea ordini d'acquisto e traccia le consegne. Genera PDF ordine da inviare via email.",
    highlights: ["Anagrafica fornitori", "Ordini d'acquisto con PDF", "Stato consegna tracciato", "Collegato al magazzino"],
  },
  {
    slug: "registro",
    icon: Shield,
    color: "bg-indigo-50 text-indigo-600",
    title: "Registro Usato",
    tagline: "Conformità normativa senza carta",
    desc: "Registro digitale per l'acquisto e vendita di dispositivi usati. Obbligatorio per i rivenditori, finalmente semplice da tenere.",
    highlights: ["Registro acquisti con IMEI", "Documento venditore registrato", "Export CSV per autorità", "Timestamp immutabile"],
  },
];

export default function FunzionalitaPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="container text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Funzionalità</p>
          <h1 className="text-4xl font-bold mb-4">Tutto quello che serve a un centro di riparazione</h1>
          <p className="text-muted-foreground leading-relaxed">
            Ogni funzionalità ha una demo interattiva. Provala subito, senza registrarti,
            per capire come funziona prima di iscriverti.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container max-w-5xl mx-auto space-y-6">
          {features.map((f, i) => (
            <Link
              key={f.slug}
              href={`/funzionalita/${f.slug}`}
              className="group flex flex-col sm:flex-row items-start gap-5 rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${f.color}`}>
                <f.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">{f.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.tagline}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {f.highlights.map((h) => (
                    <span key={h} className="text-[11px] bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{h}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50 border-t">
        <div className="container text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Convinto? Inizia oggi.</h2>
          <p className="text-muted-foreground text-sm mb-6">14 giorni gratis, nessuna carta di credito. Configura il tuo centro in 5 minuti.</p>
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
