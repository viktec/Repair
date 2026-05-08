import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Guide e consigli per centri di riparazione",
  description:
    "Guide pratiche per gestire meglio il tuo centro di riparazione: ticket, GDPR, registro usato, QR tracking, cassa POS e firma digitale. Consigli concreti da chi conosce il settore.",
  keywords: [
    "blog gestionale riparazioni", "guida centro riparazione",
    "GDPR centro riparazione", "registro usato smartphone",
    "QR tracking riparazione", "cassa pos riparazione",
    "firma digitale modulo accettazione", "gestione ticket riparazione",
    "software riparazione smartphone", "consigli officina cellulari",
  ],
  alternates: { canonical: "https://my-repair.it/blog" },
  openGraph: {
    title: "Blog — Guide per centri di riparazione | My-Repair",
    description:
      "Guide pratiche su ticket, GDPR, registro usato, QR tracking e cassa POS per centri di riparazione smartphone, PC e TV.",
    url: "https://my-repair.it/blog",
  },
};

type Post = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readMin: number;
};

const posts: Post[] = [
  {
    slug: "come-gestire-i-ticket-in-un-centro-di-riparazione",
    category: "Gestione",
    title: "Come gestire i ticket di riparazione senza perdere tempo",
    excerpt: "Dal foglio Excel al software dedicato: come un centro di riparazione professionale gestisce 50+ ticket al giorno senza chaos.",
    date: "2025-04-28",
    readMin: 6,
  },
  {
    slug: "gdpr-centri-riparazione-cosa-sapere",
    category: "Normativa",
    title: "GDPR per i centri di riparazione: cosa devi sapere nel 2025",
    excerpt: "La privacy del cliente è obbligatoria. Ecco cosa registrare, come ottenere il consenso e come My-Repair ti semplifica la conformità.",
    date: "2025-04-10",
    readMin: 8,
  },
  {
    slug: "registro-usato-obblighi-rivenditori",
    category: "Normativa",
    title: "Registro Usato: obblighi per chi compra e vende dispositivi",
    excerpt: "Chi acquista dispositivi usati dai privati è soggetto a obblighi normativi precisi. Scopri come tenerli in regola digitalmente.",
    date: "2025-03-22",
    readMin: 5,
  },
  {
    slug: "come-aumentare-le-riparazioni-con-il-qr-tracking",
    category: "Marketing",
    title: "Il QR tracking aumenta la fiducia del cliente (e le recensioni)",
    excerpt: "Quando il cliente può seguire lo stato della riparazione in tempo reale, smette di chiamare — e lascia più recensioni positive.",
    date: "2025-03-05",
    readMin: 4,
  },
  {
    slug: "cassa-pos-centro-riparazione-come-funziona",
    category: "Gestione",
    title: "Cassa POS integrata: perché i migliori centri di riparazione la usano",
    excerpt: "Dall'incasso al report Z, una cassa POS integrata nel gestionale elimina doppio lavoro e errori di riconciliazione.",
    date: "2025-02-18",
    readMin: 5,
  },
  {
    slug: "firma-digitale-modulo-accettazione",
    category: "Tecnologia",
    title: "Firma digitale del modulo di accettazione: vale legalmente?",
    excerpt: "Sì, vale. Ecco perché la firma su tablet è giuridicamente equiparata a quella su carta, e come implementarla correttamente.",
    date: "2025-02-03",
    readMin: 7,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Gestione: "bg-blue-100 text-blue-700",
  Normativa: "bg-amber-100 text-amber-700",
  Marketing: "bg-violet-100 text-violet-700",
  Tecnologia: "bg-emerald-100 text-emerald-700",
};

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <>
      {/* Hero */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="container text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-medium mb-5">
            <BookOpen className="h-3.5 w-3.5" />
            Blog My-Repair
          </div>
          <h1 className="text-4xl font-bold mb-4">Risorse per riparatori</h1>
          <p className="text-muted-foreground leading-relaxed">
            Guide pratiche, consigli di gestione e aggiornamenti normativi per i centri di riparazione italiani.
          </p>
        </div>
      </section>

      {/* Featured */}
      <section className="py-12">
        <div className="container max-w-5xl mx-auto">
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-3 bg-gradient-to-br from-slate-800 to-slate-900 p-8 flex flex-col justify-between min-h-[240px]">
                <span className={`self-start text-[11px] font-semibold rounded-full px-2.5 py-1 ${CATEGORY_COLORS[featured.category] ?? "bg-slate-100 text-slate-700"}`}>
                  {featured.category}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight mb-2">{featured.title}</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">{featured.excerpt}</p>
                </div>
              </div>
              <div className="md:col-span-2 p-8 flex flex-col justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{new Date(featured.date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readMin} min</span>
                </div>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mt-4"
                >
                  Leggi l&apos;articolo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-16">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-xl border bg-white p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${CATEGORY_COLORS[post.category] ?? "bg-slate-100 text-slate-700"}`}>
                    {post.category}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readMin} min
                  </span>
                </div>
                <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{post.excerpt}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(post.date).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50 border-t">
        <div className="container text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-3">Vuoi provare My-Repair?</h2>
          <p className="text-muted-foreground text-sm mb-6">
            14 giorni gratis. Nessuna carta di credito. Tutto quello che leggi sul blog, già incluso.
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
