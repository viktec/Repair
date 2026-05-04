"use client";

import { useState } from "react";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const PLAN_LABELS: Record<string, string> = {
  start: "Start",
  pro: "Pro",
  business: "Business",
  gift: "Omaggio",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trial: { label: "Trial", color: "text-amber-600 bg-amber-50" },
  active: { label: "Attivo", color: "text-green-700 bg-green-50" },
  past_due: { label: "Pagamento in sospeso", color: "text-red-700 bg-red-50" },
  canceled: { label: "Cancellato", color: "text-slate-600 bg-slate-100" },
};

export function BillingCard({
  plan,
  subscriptionStatus,
  trialEndsAt,
  hasStripeCustomer,
  hasStripeSubscription,
}: {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  hasStripeCustomer: boolean;
  hasStripeSubscription: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const statusInfo = STATUS_LABELS[subscriptionStatus] ?? STATUS_LABELS.canceled;

  const trialDaysLeft =
    subscriptionStatus === "trial" && trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert("Errore. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Abbonamento</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Piano {PLAN_LABELS[plan] ?? plan}</p>
            {trialDaysLeft !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {trialDaysLeft === 0
                  ? "Scade oggi"
                  : `${trialDaysLeft} ${trialDaysLeft === 1 ? "giorno" : "giorni"} rimanenti`}
              </p>
            )}
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {plan !== "gift" && (
          <div className="flex flex-wrap gap-2">
            {hasStripeSubscription && hasStripeCustomer ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePortal}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                Gestisci abbonamento
              </Button>
            ) : null}
            <Link href="/upgrade">
              <Button variant={hasStripeSubscription ? "ghost" : "default"} size="sm">
                {hasStripeSubscription ? "Cambia piano" : "Attiva piano"}
              </Button>
            </Link>
          </div>
        )}
        {plan === "gift" && (
          <p className="text-xs text-muted-foreground">Piano sponsorizzato — nessun pagamento richiesto.</p>
        )}
      </CardContent>
    </Card>
  );
}
