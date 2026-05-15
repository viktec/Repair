import type { Metadata } from "next";
import Link from "next/link";
import {
  Wrench, QrCode, Package, Zap, Shield, ArrowRight,
  FileSignature, BarChart3, Users, Headset, ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { PricingSection } from "@/app/pricing-section";
import { db } from "@/lib/db";
import { platformConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "My-Repair — Gestionale per centri di riparazione smartphone, PC e TV",
  description:
    "Gestionale italiano per centri di riparazione. Ticket, magazzino ricambi, cassa POS, firma digitale, fatture, perizie usato e registro. Prova gratis 14 giorni, nessuna carta di credito.",
  keywords: [
    "gestionale riparazioni", "software gestionale centro riparazione",
    "gestionale riparazioni smartphone", "gestionale riparazioni computer",
    "gestionale riparazioni televisori", "software officina cellulari",
    "magazzino ricambi", "carico scarico merce", "ticket riparazione",
    "registro usato dispositivi", "perizie usato", "cassa pos riparazione",
    "fatture riparazione", "IMEI tracking", "firma digitale accettazione",
  ],
  alternates: { canonical: "https://my-repair.it/" },
  openGraph: {
    title: "My-Repair — Gestionale per centri di riparazione smartphone, PC e TV",
    description:
      "Ticket, magazzino ricambi, cassa POS, firma digitale e registro usato. Tutto in un posto. Prova gratis 14 giorni.",
    url: "https://my-repair.it/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "My-Repair",
      url: "https://my-repair.it",
      description:
        "Gestionale italiano per centri di riparazione smartphone, PC e TV. Ticket, magazzino ricambi, cassa POS, firma digitale, perizie usato e registro.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "it",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "14 giorni di prova gratuita senza carta di credito",
      },
      featureList: [
        "Gestione ticket riparazione",
        "Magazzino ricambi con carico e scarico",
        "Cassa POS integrata",
        "QR tracking pubblico per il cliente",
        "Firma digitale modulo accettazione",
        "Registro usato conforme normativa",
        "Perizie dispositivi usati",
        "Storico IMEI dispositivi",
        "Report e statistiche",
        "Fatture e preventivi",
        "Notifiche email automatiche",
        "Gestione team con permessi per ruolo",
      ],
    },
    {
      "@type": "Organization",
      name: "My-Repair",
      url: "https://my-repair.it",
      description: "Software gestionale per centri di riparazione italiano",
    },
  ],
};

const features = [
  { slug: "ticket",     icon: Wrench,         title: "Gestione Ticket",         desc: "Crea ticket in 30 secondi. Foto pre/post, IMEI, stato e QR code inclusi." },
  { slug: "clienti",    icon: Users,          title: "Clienti",                 desc: "Scheda cliente con storico completo, consenso GDPR e contatti rapidi." },
  { slug: "cassa",      icon: QrCode,         title: "Cassa POS",               desc: "Apri sessioni di cassa, incassa e chiudi con il report Z. Scontrino in un click." },
  { slug: "magazzino",  icon: Package,        title: "Magazzino",               desc: "Scorte, soglie minime e movimenti. Ordina dal fornitore quando serve." },
  { slug: "report",     icon: BarChart3,      title: "Report",                  desc: "KPI, fatturato, performance tecnici. Dati veri per decisioni migliori." },
  { slug: "assistenza", icon: Headset,        title: "Assistenza Business",     desc: "Contratti ore, interventi on-site, verbale digitale firmato dal cliente." },
  { slug: "imei",       icon: Zap,            title: "Storico IMEI",            desc: "Cerca qualsiasi dispositivo per IMEI e vedi tutta la storia in un secondo." },
  { slug: "fornitori",  icon: FileSignature,  title: "Fornitori",               desc: "Gestisci fornitori, crea ordini e tieni traccia delle consegne." },
  { slug: "registro",   icon: Shield,         title: "Registro Usato",          desc: "Conformità normativa per l'acquisto e vendita di dispositivi usati." },
];

const whyUs = [
  "Nessun limite di ticket nel piano Pro",
  "QR tracking pubblico per ogni ticket",
  "Firma digitale su tablet o smartphone",
  "Notifiche email automatiche al cliente",
  "Foto pre/durante/post riparazione",
  "Magazzino con soglie e alert automatici",
  "Team illimitato con permessi per ruolo",
  "Installato in 5 minuti, dati sempre tuoi",
];

export default async function MarketingHome() {
  let showPricing = false;
  try {
    const [configRow] = await db.select().from(platformConfig).where(eq(platformConfig.id, 1)).limit(1);
    showPricing = configRow?.showPricing ?? false;
  } catch {
    // DB non disponibile in fase di build — default a false
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 py-24 text-white md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(13,143,122,0.3),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(13,143,122,0.15),transparent_50%)]" />

        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-300 mb-8">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span></span>
              14 giorni gratis — nessuna carta di credito
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Il gestionale che{" "}
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                i riparatori usano davvero
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
              Ticket, foto pre/post, tracking cliente, magazzino ricambi, cassa POS e firma digitale.
              Tutto connesso. Tutto veloce. Smetti di gestire il lavoro su WhatsApp.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Inizia gratis — 14 giorni
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/funzionalita"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 text-base text-white hover:bg-white/10 transition-colors"
              >
                Scopri le funzionalità
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-5 text-xs text-slate-500">
              Nessuna carta di credito · Dati cancellabili in qualsiasi momento · Hosting in Europa
            </p>
          </div>
        </div>
      </section>

      {/* Pain → Solution */}
      <section className="py-16 bg-white">
        <div className="container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-4">Senza My-Repair</p>
              <ul className="space-y-2.5 text-sm text-red-800">
                {["Chat WhatsApp con foto e descrizioni perse", "Foglio Excel per i ticket, aggiornato a caso", "Il cliente chiama ogni giorno per sapere lo stato", "Non sai mai quante batterie hai in magazzino", "La firma del cliente? Un pezzo di carta da qualche parte"].map(p => (
                  <li key={p} className="flex items-start gap-2"><span className="text-red-400 mt-0.5 shrink-0">✗</span>{p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4">Con My-Repair</p>
              <ul className="space-y-2.5 text-sm text-emerald-800">
                {["Ticket con foto, IMEI e stato in 30 secondi", "Il cliente vede lo stato in tempo reale via QR", "Magazzino aggiornato ad ogni riparazione", "Firma digitale allegata al ticket automaticamente", "Report mensile: quanti ticket, quanto fatturato"].map(p => (
                  <li key={p} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 bg-slate-50">
        <div className="container">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Funzionalità</p>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Tutto quello che ti serve, niente di più
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Progettato per chi ripara smartphone, tablet, PC e TV. Ogni funzionalità ha una demo interattiva — provala prima di iscriverti.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Link
                key={f.slug}
                href={`/funzionalita/${f.slug}`}
                className="group rounded-xl bg-white p-6 shadow-sm border hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Guarda la demo <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/funzionalita" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              Vedi tutte le funzionalità <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why us checklist */}
      <section className="py-20 bg-white">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Perché scegliere My-Repair</h2>
          <p className="text-muted-foreground mb-10">Non è il software più complesso del mercato. È quello che usi davvero ogni giorno.</p>
          <div className="grid sm:grid-cols-2 gap-3 text-left">
            {whyUs.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border bg-slate-50 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      {showPricing ? (
        <PricingSection />
      ) : (
        <section id="pricing" className="py-20 bg-gradient-to-b from-white to-slate-50">
          <div className="container text-center max-w-2xl mx-auto">
            <span className="inline-block rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold text-emerald-700 mb-4">
              Accesso gratuito
            </span>
            <h2 className="text-3xl font-bold md:text-4xl">Inizia gratis, subito</h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Nessuna carta di credito. Nessun impegno. Attivo in 5 minuti.
            </p>
            <ul className="mt-8 flex flex-col sm:flex-row justify-center gap-4 text-sm text-muted-foreground">
              {["Ticket illimitati", "Clienti illimitati", "Magazzino e cassa inclusi", "Supporto via email"].map((f) => (
                <li key={f} className="flex items-center gap-1.5 justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="mt-10 inline-block">
              <button className="rounded-xl bg-primary px-10 py-4 text-base font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors">
                Crea il tuo account gratis →
              </button>
            </Link>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-teal-700 to-emerald-600 py-20 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Pronto a lavorare meglio?</h2>
          <p className="mt-4 text-white/80 max-w-lg mx-auto">
            Configura il tuo laboratorio in 5 minuti. 14 giorni gratis, nessuna carta richiesta.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-10 py-3.5 text-base font-semibold text-primary hover:bg-white/90 transition-colors shadow-lg"
          >
            Inizia ora — è gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
