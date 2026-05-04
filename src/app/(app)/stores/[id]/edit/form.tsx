"use client";

import { useActionState } from "react";
import { updateStoreAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

type Store = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
};

export function EditStoreForm({ store }: { store: Store }) {
  const boundAction = updateStoreAction.bind(null, store.id);
  const [state, action, pending] = useActionState(boundAction, null);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/stores">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Sedi
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Modifica sede</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati sede</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Nome sede <span className="text-destructive">*</span>
              </Label>
              <Input id="name" name="name" required defaultValue={store.name} />
              {state && "errors" in state && state.errors?.name && (
                <p className="text-xs text-destructive">{state.errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Indirizzo</Label>
              <Input id="address" name="address" defaultValue={store.address ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={store.phone ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={store.email ?? ""} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Link href="/stores">
                <Button type="button" variant="outline">
                  Annulla
                </Button>
              </Link>
              <Button type="submit" disabled={pending} className="gap-2">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salva modifiche
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
