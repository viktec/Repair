"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, AlertTriangle, Clock } from "lucide-react";
import { Sidebar } from "./sidebar";
import { UserMenu } from "./user-menu";
import Link from "next/link";

export function AppShell({
  children,
  userName,
  userEmail,
  role,
  plan,
  subscriptionStatus,
  trialDaysLeft,
  isPastDue,
  hasStripeCustomer,
  allowedModules,
}: {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  role?: string | null;
  plan?: string | null;
  subscriptionStatus?: string | null;
  trialDaysLeft?: number | null;
  isPastDue?: boolean;
  hasStripeCustomer?: boolean;
  allowedModules?: string[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("[sw] registration failed", err);
      });
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out lg:relative lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar role={role} plan={plan} subscriptionStatus={subscriptionStatus} trialDaysLeft={trialDaysLeft} allowedModules={allowedModules} />
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 lg:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Apri menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <UserMenu name={userName} email={userEmail} />
        </header>

        {/* Trial banner */}
        {trialDaysLeft !== null && trialDaysLeft !== undefined && (
          <div className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                {trialDaysLeft === 0
                  ? "Il tuo trial scade oggi."
                  : `${trialDaysLeft} ${trialDaysLeft === 1 ? "giorno" : "giorni"} al termine del trial.`}
              </span>
            </div>
            <Link href="/upgrade" className="font-semibold underline underline-offset-2 shrink-0">
              Attiva piano →
            </Link>
          </div>
        )}

        {/* Past-due banner */}
        {isPastDue && (
          <div className="flex items-center justify-between gap-3 bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Pagamento fallito. Aggiorna il metodo di pagamento per continuare.</span>
            </div>
            {hasStripeCustomer && (
              <PortalButton />
            )}
          </div>
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="font-semibold underline underline-offset-2 shrink-0 disabled:opacity-50"
    >
      {loading ? "Caricamento..." : "Gestisci pagamento →"}
    </button>
  );
}
