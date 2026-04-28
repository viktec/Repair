import Link from "next/link";
import { Check, Wrench, QrCode, Package, Zap, Shield, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: Wrench,
    title: "Addio alle chat WhatsApp",
    desc: "Foto pre/post, IMEI, note tecniche e stato tutto dentro al ticket. Mai più scrollare 50 chat per trovare cosa.",
  },
  {
    icon: QrCode,
    title: "Il cliente si aggiorna da solo",
    desc: "Ogni ticket ha un QR code. Il cliente apre il link e vede lo stato in tempo reale. Zero telefonate 'è pronto?'.",
  },
  {
    icon: Package,
    title: "Magazzino sempre sotto controllo",
    desc: "Scorte, alert soglie minime, ordini fornitori con stato. Saprai sempre cosa ordinare prima di rimanerne senza.",
  },
  {
    icon: Zap,
    title: "Veloce al banco",
    desc: "Nuovo ticket in 30 secondi. Ricevuta A4 o termica con un click. Firma digitale direttamente sul tablet.",
  },
  {
    icon: Shield,
    title: "Firma digitale e liberatorie",
    desc: "Fai firmare l'accettazione al cliente sul tablet. Il PDF viene allegato al ticket automaticamente.",
  },
  {
    icon: Star,
    title: "Branding tuo",
    desc: "Logo, colori e dati del negozio su ogni ricevuta, ogni tracking page. Il cliente vede te, non il software.",
  },
];

const plans = [
  {
    id: "solo",
    name: "Solo",
    tagline: "Per chi al banco è da solo",
    price: "14,90",
    highlight: false,
    features: [
      "Fino a 5.000 ticket",
      "1 negozio",
      "Clienti illimitati",
      "IMEI, pattern lock, foto pre/post",
      "Tracking cliente con QR",
      "Template WhatsApp (copia/incolla)",
      "Storico riparazioni per IMEI",
      "Ricevute A4 e termiche",
      "Firma digitale su tablet",
      "Branding personalizzato",
    ],
    cta: "Inizia con Solo",
    ctaHref: "/register",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Aggiunge magazzino, ordini e documenti",
    price: "19,90",
    highlight: true,
    badge: "🔥 Più scelto",
    features: [
      "Fino a 10.000 ticket",
      "1 negozio",
      "Tutto di Solo, più:",
      "Magazzino ricambi completo",
      "Alert scorte minime + varianti",
      "Smart Tags e filtri rapidi",
      "POS / Cassa (non fiscale)",
      "Ordini Fornitori",
      "Sezione Documenti",
      "Report e KPI",
      "Export CSV/Excel",
    ],
    cta: "Scegli Pro",
    ctaHref: "/register?plan=pro",
  },
  {
    id: "business",
    name: "Business",
    tagline: "Aggiunge AI, automazioni e multi-sede",
    price: "25,90",
    highlight: false,
    features: [
      "Ticket illimitati",
      "Fino a 2 negozi inclusi (+10€/sede)",
      "Tutto di Pro, più:",
      "Importa Fattura AI (carico magazzino)",
      "Bot Telegram con BI conversazionale",
      "Notifiche Push sul telefono",
      "Dashboard multi-sede centralizzata",
      "Trasferimenti stock tra sedi",
      "Registro Usato Art.36",
      "Ruoli e permessi granulari",
      "Supporto prioritario",
    ],
    cta: "Scegli Business",
    ctaHref: "/register?plan=business",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">Repair</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Accedi
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Prova gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 py-24 text-white md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(13,143,122,0.25),transparent_60%)]" />
        <div className="container relative text-center">
          <Badge className="mb-6 border-teal-500/30 bg-teal-500/10 text-teal-300">
            14 giorni gratis — nessuna carta di credito
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Il laboratorio di riparazione,{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              finalmente ordinato.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
            Ticket, foto pre/post, tracking cliente e magazzino ricambi. Tutto in un posto.
            Smetti di cercare tra 50 chat WhatsApp.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base font-semibold">
                Inizia gratis 14 giorni
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10"
              >
                Vedi i piani
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Tutto quello che ti serve, niente di più
            </h2>
            <p className="mt-4 text-muted-foreground">
              Progettato per chi ripara smartphone, tablet, PC e TV. Da chi conosce il lavoro.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl bg-white p-6 shadow-sm border">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">Piani semplici</h2>
            <p className="mt-4 text-muted-foreground">
              Parti con Solo, scala quando ne hai bisogno. Nessun lock-in.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-primary bg-primary shadow-xl shadow-primary/20 text-white"
                    : "bg-white"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-6">
                  <h3
                    className={`text-xl font-bold ${plan.highlight ? "text-white" : "text-foreground"}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${plan.highlight ? "text-white/80" : "text-muted-foreground"}`}
                  >
                    {plan.tagline}
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-foreground"}`}
                    >
                      €{plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>
                      /mese
                    </span>
                  </div>
                </div>

                <Link href={plan.ctaHref} className="mb-8">
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "secondary" : "default"}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="flex flex-col gap-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? "text-white/80" : "text-primary"}`}
                      />
                      <span className={plan.highlight ? "text-white/90" : "text-foreground"}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-sm text-muted-foreground">
            Più di 3 sedi o esigenze particolari?{" "}
            <a href="mailto:info@my-repair.it" className="text-primary font-medium underline-offset-4 hover:underline">
              Contattaci per un piano Enterprise
            </a>
          </p>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-gradient-to-r from-teal-700 to-emerald-600 py-20 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Pronto a lavorare meglio?
          </h2>
          <p className="mt-4 text-white/80">
            Configura il tuo laboratorio in 5 minuti. Inizia gratis, nessuna carta richiesta.
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg" variant="secondary" className="h-12 px-10 text-base font-semibold text-primary">
              Inizia ora — è gratis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-900 py-10 text-slate-400">
        <div className="container flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Wrench className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Repair</span>
          </div>
          <p className="text-xs">
            © {new Date().getFullYear()} Repair. Fatto con cura per i riparatori italiani.
          </p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Termini</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
