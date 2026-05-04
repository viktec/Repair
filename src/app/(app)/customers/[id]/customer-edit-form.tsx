"use client";

import { useState, useTransition } from "react";
import { updateCustomerAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Pencil } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export function CustomerEditForm({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateCustomerAction(customer.id, fd);
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1500);
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
        Modifica dati
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Modifica cliente</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nome e cognome *</Label>
            <Input id="edit-name" name="name" defaultValue={customer.name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Telefono</Label>
            <Input id="edit-phone" name="phone" type="tel" defaultValue={customer.phone ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" name="email" type="email" defaultValue={customer.email ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Note interne</Label>
            <textarea
              id="edit-notes"
              name="notes"
              rows={2}
              defaultValue={customer.notes ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Annulla</Button>
            <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
              {saved ? "Salvato!" : "Salva"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
