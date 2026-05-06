"use client";

import { useActionState } from "react";
import { registerAndAcceptAction, type AcceptState } from "./accept-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function RegisterForm({ token, email }: { token: string; email: string }) {
  const boundAction = registerAndAcceptAction.bind(null, token);
  const [state, action, pending] = useActionState<AcceptState, FormData>(boundAction, null);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          {state.success}
        </div>
        <Link
          href="/login"
          className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Vai al login →
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Crea il tuo account per accettare l&apos;invito.
      </p>

      {state?.error && (
        <p className="text-xs text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="invite-email-ro" className="text-sm">Email</Label>
        <Input id="invite-email-ro" value={email} readOnly className="bg-slate-50 text-muted-foreground" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="invite-name" className="text-sm">Nome e cognome</Label>
        <Input id="invite-name" name="name" placeholder="Mario Rossi" required maxLength={100} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="invite-password" className="text-sm">Password</Label>
        <Input
          id="invite-password"
          name="password"
          type="password"
          placeholder="Minimo 8 caratteri"
          required
          minLength={8}
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Crea account e accetta
      </Button>
    </form>
  );
}
