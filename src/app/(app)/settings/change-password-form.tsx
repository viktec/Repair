"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Lock } from "lucide-react";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Cambia password</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {state?.ok ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            <Check className="h-4 w-4 shrink-0" />
            Password aggiornata con successo.
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Password attuale</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nuova password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">Minimo 8 caratteri.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Conferma nuova password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={pending} variant="outline" className="gap-2">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Aggiorna password
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
