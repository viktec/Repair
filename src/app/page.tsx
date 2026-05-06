import Link from "next/link";
import { Wrench, QrCode, Package, Zap, Shield, ArrowRight, Star, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingSection } from "./pricing-section";

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
  {
    icon: FileSignature,
    title: "Contratti di assistenza Business",
    desc: "Gestisci pacchetti ore mensili per clienti business. Portale dedicato con storico interventi, prenotazione visite gratuite e firma digitale del verbale direttamente sul telefono del cliente.",
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
            <span className="text-lg font-bold text-foreground">My-Repair</span>
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
      <PricingSection />

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
            <span className="text-sm font-semibold text-white">My-Repair</span>
          </div>
          <p className="text-xs">
            © {new Date().getFullYear()} My-Repair. Fatto con cura per i riparatori italiani.
          </p>
          <div className="flex gap-4 text-xs">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Termini</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
