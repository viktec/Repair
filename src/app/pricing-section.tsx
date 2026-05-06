"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PLANS = [
  {
    id: "start",
    name: "Start",
    tagline: "Per chi al banco è da solo",
    monthly: 9.9,
    annual: 99,
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
    cta: "Inizia con Start",
    ctaHref: "/register",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Aggiunge magazzino, ordini e documenti",
    monthly: 16.9,
    annual: 169,
    highlight: true,
    badge: "🔥 Più scelto",
    features: [
      "Fino a 10.000 ticket",
      "1 negozio",
      "Tutto di Start, più:",
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
    monthly: 25.9,
    annual: 259,
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
      "Contratti di assistenza clienti Business",
      "Portale cliente con magic link",
      "Firma digitale verbali intervento",
      "Visite di controllo gratuite",
      "Supporto prioritario",
    ],
    cta: "Scegli Business",
    ctaHref: "/register?plan=business",
  },
];

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <section id="pricing" className="py-20">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Piani semplici</h2>
          <p className="mt-4 text-muted-foreground">
            Parti con Start, scala quando ne hai bisogno. Nessun lock-in.
          </p>

          {/* Toggle */}
          <div className="mt-6 inline-flex items-center rounded-xl border bg-white p-1 gap-1 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                billing === "monthly"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensile
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
                billing === "annual"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Annuale
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  billing === "annual"
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                −17%
              </span>
            </button>
          </div>
          {billing === "annual" && (
            <p className="mt-2 text-xs text-emerald-600 font-medium">
              2 mesi gratis rispetto al mensile
            </p>
          )}
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {PLANS.map((plan) => {
            const price = billing === "monthly" ? plan.monthly : plan.annual;
            const suffix = billing === "monthly" ? "/mese" : "/anno";
            const perMonth = billing === "annual"
              ? (plan.annual / 12).toFixed(2).replace(".", ",")
              : null;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-primary bg-primary shadow-xl shadow-primary/20 text-white"
                    : "bg-white"
                }`}
              >
                {"badge" in plan && plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900">
                    {plan.badge}
                  </span>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${plan.highlight ? "text-white" : "text-foreground"}`}>
                    {plan.name}
                  </h3>
                  <p className={`mt-1 text-sm ${plan.highlight ? "text-white/80" : "text-muted-foreground"}`}>
                    {plan.tagline}
                  </p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-foreground"}`}>
                      €{price.toFixed(2).replace(".", ",")}
                    </span>
                    <span className={`text-sm ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>
                      {suffix}
                    </span>
                  </div>
                  {perMonth && (
                    <p className={`mt-1 text-xs ${plan.highlight ? "text-white/70" : "text-muted-foreground"}`}>
                      pari a €{perMonth}/mese · 2 mesi gratis
                    </p>
                  )}
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
            );
          })}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Più di 3 sedi o esigenze particolari?{" "}
          <a href="mailto:info@my-repair.it" className="text-primary font-medium underline-offset-4 hover:underline">
            Contattaci per un piano Enterprise
          </a>
        </p>
      </div>
    </section>
  );
}
