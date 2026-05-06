"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function MagicCallback() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const next = searchParams.get("next") ?? "/dashboard";
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(true);
      return;
    }
    signIn("magic", { token, callbackUrl: next }).then((result) => {
      if ((result as { error?: string } | undefined)?.error) setError(true);
    });
  }, [token, next]);

  if (error) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-destructive font-medium">Link non valido o scaduto.</p>
        <a href="/login" className="text-sm underline text-muted-foreground">
          Torna al login
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      Accesso in corso…
    </div>
  );
}

export default function MagicCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Caricamento…
        </div>
      }>
        <MagicCallback />
      </Suspense>
    </div>
  );
}
