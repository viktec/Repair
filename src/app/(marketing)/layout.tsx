"use client";

import Link from "next/link";
import { useState } from "react";
import { Wrench, Menu, X, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/funzionalita", label: "Funzionalità" },
  { href: "/novita",       label: "Novità" },
  { href: "/blog",         label: "Blog" },
];

function MarketingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">My-Repair</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(l.href)
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-50"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Accedi
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Prova gratis →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden rounded-md p-1.5 text-muted-foreground hover:bg-slate-100"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white px-4 pb-4 pt-2 space-y-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-slate-50"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t mt-2 flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-center border rounded-md hover:bg-slate-50">Accedi</Link>
            <Link href="/register" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-semibold text-center bg-primary text-white rounded-md hover:bg-primary/90">Prova gratis →</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t bg-slate-900 py-12 text-slate-400">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Wrench className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white">My-Repair</span>
            </div>
            <p className="text-xs leading-relaxed">
              Il gestionale per centri di riparazione smartphone, tablet, PC e TV. Fatto in Italia.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Prodotto</p>
            <div className="space-y-2 text-xs">
              <Link href="/funzionalita" className="block hover:text-white transition-colors">Funzionalità</Link>
              <Link href="/#pricing" className="block hover:text-white transition-colors">Prezzi</Link>
              <Link href="/novita" className="block hover:text-white transition-colors">Novità</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Risorse</p>
            <div className="space-y-2 text-xs">
              <Link href="/blog" className="block hover:text-white transition-colors">Blog</Link>
              <Link href="/register" className="block hover:text-white transition-colors">Inizia gratis</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Legale</p>
            <div className="space-y-2 text-xs">
              <Link href="/privacy" className="block hover:text-white transition-colors">Privacy policy</Link>
              <Link href="/terms" className="block hover:text-white transition-colors">Termini di servizio</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs">© {new Date().getFullYear()} My-Repair. Tutti i diritti riservati.</p>
          <p className="text-xs">Fatto con cura per i riparatori italiani 🇮🇹</p>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
