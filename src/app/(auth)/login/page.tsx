"use client";

import { useActionState, useState, Suspense } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

type MagicState = "idle" | "loading" | "sent";

function UrlErrorBanner() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  if (!urlError) return null;

  const message =
    urlError === "link_scaduto"
      ? "Il link di accesso è scaduto o già utilizzato. Richiedine uno nuovo."
      : "Link non valido.";

  return (
    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>
  );
}

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, null);
  const [magicEmail, setMagicEmail] = useState("");
  const [magicState, setMagicState] = useState<MagicState>("idle");
  const [magicError, setMagicError] = useState<string | null>(null);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail || magicState === "loading") return;
    setMagicState("loading");
    setMagicError(null);

    try {
      const res = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: magicEmail }),
      });
      if (!res.ok) throw new Error();
      setMagicState("sent");
    } catch {
      setMagicError("Errore nell'invio. Riprova tra qualche istante.");
      setMagicState("idle");
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Accedi</CardTitle>
        <CardDescription>Inserisci email e password del tuo account</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nome@negozio.it"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Password dimenticata?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <Suspense fallback={null}>
            <UrlErrorBanner />
          </Suspense>

          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Accedi
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">oppure</span>
          </div>
        </div>

        {magicState === "sent" ? (
          <div className="rounded-md bg-primary/10 px-4 py-3 text-sm text-primary text-center">
            Controlla la tua email — il link scade in 10 minuti.
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <Label htmlFor="magic-email">Accedi senza password</Label>
            <Input
              id="magic-email"
              type="email"
              placeholder="nome@negozio.it"
              autoComplete="email"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              required
            />
            {magicError && (
              <p className="text-sm text-destructive">{magicError}</p>
            )}
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={magicState === "loading"}
            >
              {magicState === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invia link di accesso
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Non hai un account?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Registrati gratis
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          {" · "}
          <Link href="/terms" className="hover:underline">Termini di servizio</Link>
        </p>
      </CardContent>
    </Card>
  );
}
