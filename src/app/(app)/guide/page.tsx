import Link from "next/link";
import {
  Ticket, Users, ShoppingCart, Package, BarChart3,
  Headset, Smartphone, Truck, BookOpen, ChevronRight,
} from "lucide-react";

const guides = [
  {
    href: "/guide/tickets",
    icon: Ticket,
    title: "Gestione Ticket",
    description: "Crea ticket di riparazione, assegna stati, monitora i progressi e comunica con il cliente.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/guide/customers",
    icon: Users,
    title: "Clienti",
    description: "Registra i tuoi clienti, consulta lo storico ticket e gestisci il consenso GDPR.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    href: "/guide/pos",
    icon: ShoppingCart,
    title: "Cassa POS",
    description: "Apri sessioni di cassa, aggiungi articoli, incassa e chiudi con il report Z.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/guide/inventory",
    icon: Package,
    title: "Magazzino",
    description: "Gestisci le scorte di ricambi, registra movimenti in entrata e uscita.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    href: "/guide/reports",
    icon: BarChart3,
    title: "Report",
    description: "Analizza le performance del centro: ticket chiusi, fatturato, tempi di riparazione.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    href: "/guide/support",
    icon: Headset,
    title: "Assistenza clienti",
    description: "Gestisci contratti di assistenza, pacchetti servizi e interventi on-site.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    href: "/guide/imei",
    icon: Smartphone,
    title: "Storico IMEI",
    description: "Cerca dispositivi per IMEI e consulta lo storico completo degli interventi.",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    href: "/guide/suppliers",
    icon: Truck,
    title: "Fornitori",
    description: "Gestisci i tuoi fornitori e crea ordini di acquisto ricambi.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    href: "/guide/registry",
    icon: BookOpen,
    title: "Registro Usato",
    description: "Registra l'acquisto e vendita di dispositivi usati per conformità normativa.",
    color: "bg-indigo-50 text-indigo-600",
  },
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Guida a My-Repair</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Scopri come usare ogni funzionalità con spiegazioni passo per passo e demo interattive.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group rounded-xl border bg-white p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${g.color} mb-3`}>
              <g.icon className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {g.title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{g.description}</p>
            <div className="mt-3 flex items-center text-xs font-medium text-primary">
              Scopri come <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
