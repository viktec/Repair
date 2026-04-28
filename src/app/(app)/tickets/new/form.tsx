"use client";

import { useActionState, useState, useTransition, useRef } from "react";
import { createTicketAction } from "../actions";
import { createCustomerInlineAction } from "../../customers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus, Check, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { DEVICE_BRANDS, DEVICE_MODELS } from "@/lib/devices";

type Customer = { id: string; name: string; phone: string | null };

type Props = {
  customers: Customer[];
  statuses: { id: string; name: string }[];
};

export function NewTicketForm({ customers: initialCustomers }: Props) {
  const [state, action, pending] = useActionState(createTicketAction, null);
  const [selectedBrand, setSelectedBrand] = useState("");

  // Customer state
  const [customerList, setCustomerList] = useState<Customer[]>(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  // New customer form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGdpr, setNewGdpr] = useState(false);
  const [savingCustomer, startSavingCustomer] = useTransition();
  const [customerError, setCustomerError] = useState("");

  const modelSuggestions =
    selectedBrand && DEVICE_MODELS[selectedBrand]
      ? DEVICE_MODELS[selectedBrand]
      : Object.values(DEVICE_MODELS).flat();

  function handleCustomerSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === "__new__") {
      setShowNewCustomer(true);
      setSelectedCustomerId("");
    } else {
      setSelectedCustomerId(val);
      setShowNewCustomer(false);
    }
  }

  function handleCancelNewCustomer() {
    setShowNewCustomer(false);
    setSelectedCustomerId("");
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewGdpr(false);
    setCustomerError("");
  }

  function handleSaveCustomer() {
    setCustomerError("");
    startSavingCustomer(async () => {
      const result = await createCustomerInlineAction({
        name: newName,
        phone: newPhone,
        email: newEmail,
        gdprConsent: newGdpr,
      });

      if ("error" in result) {
        setCustomerError(result.error);
        return;
      }

      setCustomerList((prev) => [...prev, result]);
      setSelectedCustomerId(result.id);
      setShowNewCustomer(false);
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewGdpr(false);
    });
  }

  const selectedCustomer = customerList.find((c) => c.id === selectedCustomerId);

  return (
    <form action={action} className="space-y-4">
      {/* hidden input per customerId effettivo */}
      <input type="hidden" name="customerId" value={selectedCustomerId} />

      {/* Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">

          {/* Cliente selezionato — mostra riepilogo */}
          {selectedCustomer && !showNewCustomer ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-emerald-800">{selectedCustomer.name}</p>
                {selectedCustomer.phone && (
                  <p className="text-xs text-emerald-600">{selectedCustomer.phone}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerId("")}
                className="ml-2 rounded-full p-1 text-emerald-600 hover:bg-emerald-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : !showNewCustomer ? (
            <div className="space-y-1.5">
              <Label htmlFor="customerSelect">Cerca cliente</Label>
              <select
                id="customerSelect"
                onChange={handleCustomerSelect}
                value=""
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Seleziona cliente —</option>
                <option value="__new__">✚ Nuovo cliente…</option>
                {customerList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.phone ? ` · ${c.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Pannello nuovo cliente inline */}
          {showNewCustomer && (
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <UserPlus className="h-4 w-4" />
                  Nuovo cliente
                </div>
                <button
                  type="button"
                  onClick={handleCancelNewCustomer}
                  className="rounded-full p-1 text-muted-foreground hover:bg-black/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newName">
                  Nome e cognome <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Mario Rossi"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newPhone">Telefono</Label>
                  <Input
                    id="newPhone"
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+39 333 000 0000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newEmail">Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="mario@esempio.it"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="newGdpr"
                  checked={newGdpr}
                  onChange={(e) => setNewGdpr(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                />
                <Label htmlFor="newGdpr" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
                  Consenso GDPR fornito dal cliente
                </Label>
              </div>

              {customerError && (
                <p className="text-xs text-destructive">{customerError}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCancelNewCustomer}>
                  Annulla
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingCustomer || !newName.trim()}
                  onClick={handleSaveCustomer}
                  className="gap-1.5"
                >
                  {savingCustomer ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Salva e seleziona
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispositivo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dispositivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <datalist id="brand-list">
            {DEVICE_BRANDS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          <datalist id="model-list">
            {modelSuggestions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deviceBrand">Marca</Label>
              <Input
                id="deviceBrand"
                name="deviceBrand"
                placeholder="Apple, Samsung…"
                list="brand-list"
                autoComplete="off"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deviceModel">Modello</Label>
              <Input
                id="deviceModel"
                name="deviceModel"
                placeholder="iPhone 15, Galaxy S24…"
                list="model-list"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deviceImei">IMEI</Label>
              <Input id="deviceImei" name="deviceImei" placeholder="15 cifre" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deviceSerial">Numero di serie</Label>
              <Input id="deviceSerial" name="deviceSerial" placeholder="S/N" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="devicePatternLock">PIN / Pattern sblocco</Label>
              <Input
                id="devicePatternLock"
                name="devicePatternLock"
                placeholder="Solo se fornito dal cliente"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accessories">Accessori consegnati</Label>
              <Input id="accessories" name="accessories" placeholder="Cover, caricatore…" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deviceCondition">Condizioni estetiche</Label>
            <Input
              id="deviceCondition"
              name="deviceCondition"
              placeholder="Graffi, crepe, ammaccature…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Guasto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Intervento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="faultDescription">
              Descrizione guasto <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="faultDescription"
              name="faultDescription"
              rows={3}
              required
              placeholder="Schermo rotto, non si accende, batteria scarica…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {state?.errors?.faultDescription && (
              <p className="text-xs text-destructive">{state.errors.faultDescription[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="estimatedCost">Preventivo (€)</Label>
            <Input
              id="estimatedCost"
              name="estimatedCost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="max-w-[160px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/tickets">
          <Button type="button" variant="outline">
            Annulla
          </Button>
        </Link>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Crea ticket
        </Button>
      </div>
    </form>
  );
}
