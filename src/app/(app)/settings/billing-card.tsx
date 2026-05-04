"use client";

import { useState } from "react";
import { CreditCard, Loader2, ExternalLink, AlertTriangle, Gift } from "lucide-react";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

export function BillingCard({
  plan,
  subscriptionStatus,
  trialEndsAt,
  hasStripeCustomer,
  hasStripeSubscription,
  cancelAtPeriodEnd,
  currentPeriodEnd,
}: {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  hasStripeCustomer: boolean;
  hasStripeSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelled, setCancelled] = useState(cancelAtPeriodEnd);
  const [periodEnd, setPeriodEnd] = useState(currentPeriodEnd);

  const statusInfo = STATUS_LABELS[subscriptionStatus] ?? STATUS_LABELS.canceled;

  const trialDaysLeft =
    subscriptionStatus === "trial" && trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

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

  async function handleCancel() {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setCancelled(true);
        setPeriodEnd(data.periodEnd);
        setConfirmCancel(false);
      } else {
        alert(data.error ?? "Errore durante la cancellazione. Riprova.");
      }
    } catch {
      alert("Errore durante la cancellazione. Riprova.");
    } finally {
      setCancelLoading(false);
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
        {/* Plan + status */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              {plan === "gift" && <Gift className="h-3.5 w-3.5 text-primary" />}
              <p className="text-sm font-medium text-foreground">Piano {PLAN_LABELS[plan] ?? plan}</p>
            </div>
            {trialDaysLeft !== null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {trialDaysLeft === 0 ? "Scade oggi" : `${trialDaysLeft} ${trialDaysLeft === 1 ? "giorno" : "giorni"} rimanenti`}
              </p>
            )}
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Cancellation notice */}
        {cancelled && periodEnd && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Abbonamento in cancellazione. Accesso garantito fino al <strong>{formatDate(periodEnd)}</strong>.
            </span>
          </div>
        )}

        {/* Actions */}
        {plan !== "gift" && (
          <div className="flex flex-wrap gap-2">
            {hasStripeSubscription && hasStripeCustomer && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="gap-2"
                >
                  {portalLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5" />
                  )}
                  Gestisci pagamento
                </Button>

                {!cancelled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmCancel(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Cancella abbonamento
                  </Button>
                )}
              </>
            )}

            {!hasStripeSubscription && (
              <Link href="/upgrade">
                <Button size="sm">Attiva piano</Button>
              </Link>
            )}
          </div>
        )}

        {plan === "gift" && (
          <p className="text-xs text-muted-foreground">Piano sponsorizzato — nessun pagamento richiesto.</p>
        )}

        {/* Confirm cancel dialog */}
        {confirmCancel && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <p className="text-sm font-medium text-destructive">Conferma cancellazione</p>
            <p className="text-xs text-muted-foreground">
              L&apos;abbonamento non si rinnoverà. Continuerai ad avere accesso fino alla fine del periodo già pagato.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelLoading}
                className="gap-1.5"
              >
                {cancelLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Sì, cancella
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmCancel(false)}
                disabled={cancelLoading}
              >
                Annulla
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
