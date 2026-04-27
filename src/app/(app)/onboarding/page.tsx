"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Loader2, Store, Palette, ListChecks, Rocket } from "lucide-react";
import { completeOnboardingAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Il tuo negozio", icon: Store },
  { id: 2, label: "Branding", icon: Palette },
  { id: 3, label: "Stati ticket", icon: ListChecks },
  { id: 4, label: "Sei pronto!", icon: Rocket },
];

const DEFAULT_STATUSES = [
  { id: "1", name: "In attesa", color: "#94a3b8" },
  { id: "2", name: "Diagnosi", color: "#f59e0b" },
  { id: "3", name: "In riparazione", color: "#3b82f6" },
  { id: "4", name: "Pronto", color: "#10b981" },
  { id: "5", name: "Consegnato", color: "#6b7280" },
  { id: "6", name: "Annullato", color: "#ef4444" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    shopName: "",
    phone: "",
    address: "",
    city: "",
    brandingPrimaryColor: "#0D8F7A",
  });
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [newStatus, setNewStatus] = useState("");

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function addStatus() {
    if (!newStatus.trim()) return;
    setStatuses((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newStatus.trim(), color: "#6366f1" },
    ]);
    setNewStatus("");
  }

  function removeStatus(id: string) {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
  }

  function handleFinish() {
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await completeOnboardingAction(fd);
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Configura il tuo laboratorio</h1>
          <p className="mt-1 text-muted-foreground">
            Passo {step} di {STEPS.length}
          </p>
        </div>

        {/* Progress + steps */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="mt-4 flex justify-between">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    step > s.id
                      ? "border-primary bg-primary text-white"
                      : step === s.id
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span className="hidden text-[10px] text-muted-foreground sm:block">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Dati del negozio</h2>
              <p className="text-sm text-muted-foreground">
                Appariranno su ricevute e pagina tracking cliente.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="shopName">Nome del negozio *</Label>
                <Input
                  id="shopName"
                  name="shopName"
                  value={form.shopName}
                  onChange={handleChange}
                  placeholder="Riparazioni Marco"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+39 02 1234567"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="address">Indirizzo</Label>
                  <Input
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Via Roma 1"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="city">Città</Label>
                  <Input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Milano"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Branding</h2>
              <p className="text-sm text-muted-foreground">
                Il colore principale appare su ricevute e tracking.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="brandingPrimaryColor">Colore principale</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="brandingPrimaryColor"
                    name="brandingPrimaryColor"
                    type="color"
                    value={form.brandingPrimaryColor}
                    onChange={handleChange}
                    className="h-10 w-16 cursor-pointer rounded-md border p-1"
                  />
                  <Input
                    value={form.brandingPrimaryColor}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, brandingPrimaryColor: e.target.value }))
                    }
                    className="font-mono uppercase"
                    maxLength={7}
                  />
                </div>
              </div>
              <div
                className="rounded-lg p-4 text-white text-sm font-medium"
                style={{ backgroundColor: form.brandingPrimaryColor }}
              >
                Anteprima colore — {form.shopName || "Il tuo negozio"}
              </div>
              <p className="text-xs text-muted-foreground">
                Logo e font personalizzati disponibili nelle impostazioni dopo la registrazione.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Stati del ticket</h2>
              <p className="text-sm text-muted-foreground">
                Questi sono gli stati predefiniti. Puoi modificarli nelle impostazioni.
              </p>
              <div className="flex flex-col gap-2">
                {statuses.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    {statuses.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeStatus(s.id)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Rimuovi
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nuovo stato..."
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStatus()}
                />
                <Button type="button" variant="outline" onClick={addStatus}>
                  Aggiungi
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Sei operativo! 🎉</h2>
              <p className="text-muted-foreground">
                Il tuo laboratorio digitale è pronto. Crea il primo ticket per iniziare.
              </p>
              <div className="rounded-lg border bg-slate-50 p-4 text-left text-sm space-y-2">
                <p className="font-medium">Cosa fare adesso:</p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    Crea il tuo primo ticket di prova
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    Testa il QR tracking dal punto di vista del cliente
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    Carica il logo del negozio nelle impostazioni
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Indietro
            </Button>

            {step < STEPS.length ? (
              <Button onClick={() => setStep((s) => s + 1)} className="gap-2">
                Continua
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Vai alla dashboard
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
