"use client";

import { useState } from "react";
import { Check, Loader2, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PLANS = [
  {
    id: "start" as const,
    name: "Start",
    tagline: "Per chi al banco è da solo",
    monthly: 14.9,
    annual: 149,
    features: [
      "Fino a 5.000 ticket",
      "1 negozio",
      "Clienti illimitati",
      "IMEI, foto pre/post, pattern lock",
      "Tracking cliente con QR",
      "Storico riparazioni per IMEI",
      "Ricevute A4 e termiche",
      "Firma digitale su tablet",
      "Branding personalizzato",
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    tagline: "Aggiunge magazzino, ordini e documenti",
    monthly: 19.9,
    annual: 199,
    badge: "Più scelto",
    features: [
      "Fino a 10.000 ticket",
      "1 negozio",
      "Tutto di Start, più:",
      "Magazzino ricambi completo",
      "Alert scorte minime",
      "Smart Tags e filtri rapidi",
      "POS / Cassa (non fiscale)",
      "Ordini Fornitori",
      "Sezione Documenti",
      "Report e KPI",
      "Export CSV/Excel",
    ],
  },
  {
    id: "business" as const,
    name: "Business",
    tagline: "Aggiunge AI, automazioni e multi-sede",
    monthly: 25.9,
    annual: 259,
    features: [
      "Ticket illimitati",
      "Fino a 2 negozi inclusi",
      "Tutto di Pro, più:",
      "Importa Fattura AI",
      "Bot Telegram con BI",
      "Notifiche Push",
      "Dashboard multi-sede",
      "Registro Usato Art.36",
      "Ruoli e permessi granulari",
      "Supporto prioritario",
    ],
  },
];

const PLAN_LABELS: Record<string, string> = {
  start: "Start",
  pro: "Pro",
  business: "Business",
  gift: "Omaggio",
};

type Plan = "start" | "pro" | "business" | "gift";

export function UpgradeClient({
  currentPlan,
  subscriptionStatus,
  isActive,
  isTrialExpired,
  trialDaysLeft,
  hasSubscription,
  hasStripeCustomer,
  trialEndsAt,
}: {
  currentPlan: Plan;
  subscriptionStatus: string;
  isActive: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number | null;
  hasSubscription: boolean;
  hasStripeCustomer: boolean;
  trialEndsAt: string | null;
}) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleChoose(planId: Exclude<Plan, "gift">) {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, billing }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Errore durante la creazione della sessione. Riprova.");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Errore. Riprova.");
    } finally {
      setPortalLoading(false);
    }
  }

  // Gift plan: simple informative screen
  if (currentPlan === "gift") {
    return (
      <div className="py-16 px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Piano Omaggio Business</h1>
          <p className="mt-3 text-muted-foreground text-sm">
            Hai accesso a tutte le funzionalità Business senza costi. Nessuna scadenza.
          </p>
          <Link href="/dashboard">
            <Button className="mt-8 gap-2">
              <ArrowRight className="h-4 w-4" />
              Torna alla dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Trial progress bar
  const trialPct = trialDaysLeft !== null
    ? Math.max(0, Math.min(100, (trialDaysLeft / 14) * 100))
    : null;
  const trialBarColor =
    trialDaysLeft === null ? "" :
    trialDaysLeft <= 2 ? "bg-red-500" :
    trialDaysLeft <= 5 ? "bg-amber-500" : "bg-primary";

  // Active subscription: compute approximate days in period (30 days rolling)
  // We don't store period dates, so just show "Attivo"
  const showTrialBar = subscriptionStatus === "trial" && trialPct !== null;

  return (
    <div className="py-12 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-10">
          {isTrialExpired && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-sm font-medium text-red-700">
              Il tuo trial è scaduto
            </div>
          )}
          {subscriptionStatus === "canceled" && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-sm font-medium text-red-700">
              Abbonamento cancellato
            </div>
          )}
          {isActive && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
              Piano attivo: {PLAN_LABELS[currentPlan] ?? currentPlan}
            </div>
          )}

          {/* Trial progress */}
          {showTrialBar && (
            <div className="mb-6 mx-auto max-w-sm">
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="font-medium text-foreground">Trial in corso</span>
                <span className={`font-semibold ${trialDaysLeft! <= 2 ? "text-red-600" : trialDaysLeft! <= 5 ? "text-amber-600" : "text-primary"}`}>
                  {trialDaysLeft === 0 ? "Scade oggi" : `${trialDaysLeft} ${trialDaysLeft === 1 ? "giorno" : "giorni"} rimasti`}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${trialBarColor}`}
                  style={{ width: `${trialPct}%` }}
                />
              </div>
              {trialEndsAt && (
                <p className="mt-1 text-xs text-muted-foreground text-right">
                  Scade il {new Date(trialEndsAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          )}

          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {isActive ? "Gestisci il tuo piano" : "Scegli il tuo piano"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Nessun lock-in. Puoi cambiare piano o disdire in qualsiasi momento.
          </p>

          {/* Billing toggle */}
          {!isActive && (
            <div className="mt-6 inline-flex items-center rounded-lg border bg-white p-1 gap-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  billing === "monthly" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensile
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                  billing === "annual" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annuale
                <span className={`text-xs font-bold ${billing === "annual" ? "text-white/80" : "text-primary"}`}>
                  -17%
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Active: show portal button prominently */}
        {isActive && hasStripeCustomer && (
          <div className="mb-8 text-center">
            <Button onClick={handlePortal} disabled={portalLoading} size="lg" className="gap-2">
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Gestisci abbonamento
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Cambia piano, aggiorna metodo di pagamento, scarica fatture
            </p>
          </div>
        )}

        {/* Plan cards */}
        {!isActive && (
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlan && isActive;
              const isHighlighted = plan.id === "pro";
              const price = billing === "monthly" ? plan.monthly : plan.annual;
              const suffix = billing === "monthly" ? "/mese" : "/anno";

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-7 ${
                    isHighlighted
                      ? "border-primary bg-primary text-white shadow-xl shadow-primary/20"
                      : "bg-white"
                  }`}
                >
                  {"badge" in plan && plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900">
                      {plan.badge}
                    </span>
                  )}

                  <div className="mb-5">
                    <h3 className={`text-xl font-bold ${isHighlighted ? "text-white" : "text-foreground"}`}>
                      {plan.name}
                    </h3>
                    <p className={`mt-1 text-sm ${isHighlighted ? "text-white/80" : "text-muted-foreground"}`}>
                      {plan.tagline}
                    </p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className={`text-4xl font-extrabold ${isHighlighted ? "text-white" : "text-foreground"}`}>
                        €{price.toFixed(2).replace(".", ",")}
                      </span>
                      <span className={`text-sm ${isHighlighted ? "text-white/70" : "text-muted-foreground"}`}>
                        {suffix}
                      </span>
                    </div>
                    {billing === "annual" && (
                      <p className={`mt-1 text-xs ${isHighlighted ? "text-white/70" : "text-muted-foreground"}`}>
                        pari a €{(price / 12).toFixed(2).replace(".", ",")}/mese — 2 mesi gratis
                      </p>
                    )}
                  </div>

                  <Button
                    className="mb-6 w-full"
                    variant={isHighlighted ? "secondary" : "default"}
                    onClick={() => handleChoose(plan.id)}
                    disabled={!!loading || isCurrent}
                  >
                    {loading === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      "Piano attuale"
                    ) : (
                      `Scegli ${plan.name}`
                    )}
                  </Button>

                  <ul className="flex flex-col gap-2.5 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${isHighlighted ? "text-white/80" : "text-primary"}`}
                        />
                        <span className={isHighlighted ? "text-white/90" : "text-foreground"}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Hai bisogno di più sedi o funzionalità personalizzate?{" "}
          <a href="mailto:info@my-repair.it" className="text-primary font-medium hover:underline">
            Contattaci per un piano Enterprise
          </a>
        </p>

        {!isTrialExpired && subscriptionStatus !== "canceled" && (
          <div className="mt-4 text-center">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              ← Torna alla dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
