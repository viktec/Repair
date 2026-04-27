"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(registerAction, null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Crea account</CardTitle>
        <CardDescription>14 giorni gratis — nessuna carta di credito</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Il tuo nome</Label>
            <Input
              id="name"
              name="name"
              placeholder="Marco Rossi"
              autoComplete="name"
              required
            />
            {state?.errors?.name && (
              <p className="text-xs text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shopName">Nome del negozio</Label>
            <Input
              id="shopName"
              name="shopName"
              placeholder="Riparazioni Marco"
              required
            />
            {state?.errors?.shopName && (
              <p className="text-xs text-destructive">{state.errors.shopName[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="marco@negozio.it"
              autoComplete="email"
              required
            />
            {state?.errors?.email && (
              <p className="text-xs text-destructive">{state.errors.email[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimo 8 caratteri"
              autoComplete="new-password"
              required
            />
            {state?.errors?.password && (
              <p className="text-xs text-destructive">{state.errors.password[0]}</p>
            )}
          </div>

          {state?.errors?._form && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.errors._form[0]}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crea account
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Registrandoti accetti i{" "}
            <a href="#" className="underline underline-offset-2">
              Termini di servizio
            </a>{" "}
            e la{" "}
            <a href="#" className="underline underline-offset-2">
              Privacy policy
            </a>
            .
          </p>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hai già un account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Accedi
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
