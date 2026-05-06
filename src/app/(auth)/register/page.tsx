"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type StepNum = 1 | 2 | 3 | 4;

interface WizardData {
  name: string; email: string; password: string; confirmPassword: string;
  shopName: string; legalName: string; vatNumber: string; sdiCode: string; pec: string; phone: string;
  address: string; postalCode: string; city: string; province: string;
  sameAsLegal: boolean;
  operativeAddress: string; operativePostalCode: string; operativeCity: string; operativeProvince: string;
}

const STEPS: { num: StepNum; label: string }[] = [
  { num: 1, label: "Account" },
  { num: 2, label: "Centro" },
  { num: 3, label: "Sede legale" },
  { num: 4, label: "Sede operativa" },
];

function Field({
  label, id, value, onChange, error, hint, type = "text",
  placeholder, autoComplete, maxLength, required,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  error?: string; hint?: string; type?: string; placeholder?: string;
  autoComplete?: string; maxLength?: number; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <Input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        maxLength={maxLength}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<StepNum>(1);
  const [data, setData] = useState<WizardData>({
    name: "", email: "", password: "", confirmPassword: "",
    shopName: "", legalName: "", vatNumber: "", sdiCode: "", pec: "", phone: "",
    address: "", postalCode: "", city: "", province: "",
    sameAsLegal: false,
    operativeAddress: "", operativePostalCode: "", operativeCity: "", operativeProvince: "",
  });
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof WizardData>(field: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
    setStepErrors((prev) => { const n = { ...prev }; delete n[field as string]; return n; });
  }

  function validateStep(): boolean {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (data.name.trim().length < 2) errs.name = "Almeno 2 caratteri";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errs.email = "Email non valida";
      if (data.password.length < 8) errs.password = "Almeno 8 caratteri";
      if (data.password !== data.confirmPassword) errs.confirmPassword = "Le password non coincidono";
    }
    if (step === 2) {
      if (data.shopName.trim().length < 2) errs.shopName = "Obbligatorio (min. 2 caratteri)";
    }
    if (step === 3) {
      if (!data.address.trim()) errs.address = "Obbligatorio";
      if (!data.city.trim()) errs.city = "Obbligatorio";
      if (!data.postalCode.trim()) errs.postalCode = "Obbligatorio";
    }
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep()) setStep((s) => (s + 1) as StepNum);
  }

  function handleBack() {
    setStepErrors({});
    setStep((s) => (s - 1) as StepNum);
  }

  function handleSubmit() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", data.name.trim());
      fd.append("email", data.email.trim().toLowerCase());
      fd.append("password", data.password);
      fd.append("shopName", data.shopName.trim());
      if (data.legalName.trim()) fd.append("legalName", data.legalName.trim());
      if (data.vatNumber.trim()) fd.append("vatNumber", data.vatNumber.trim());
      if (data.sdiCode.trim()) fd.append("sdiCode", data.sdiCode.trim());
      if (data.pec.trim()) fd.append("pec", data.pec.trim());
      if (data.phone.trim()) fd.append("phone", data.phone.trim());
      if (data.address.trim()) fd.append("address", data.address.trim());
      if (data.postalCode.trim()) fd.append("postalCode", data.postalCode.trim());
      if (data.city.trim()) fd.append("city", data.city.trim());
      if (data.province.trim()) fd.append("province", data.province.trim().toUpperCase());

      const opAddr = data.sameAsLegal ? data.address : data.operativeAddress;
      const opCity = data.sameAsLegal ? data.city : data.operativeCity;
      const opPostal = data.sameAsLegal ? data.postalCode : data.operativePostalCode;
      const opProv = data.sameAsLegal ? data.province : data.operativeProvince;
      if (opAddr.trim()) fd.append("operativeAddress", opAddr.trim());
      if (opCity.trim()) fd.append("operativeCity", opCity.trim());
      if (opPostal.trim()) fd.append("operativePostalCode", opPostal.trim());
      if (opProv.trim()) fd.append("operativeProvince", opProv.trim().toUpperCase());

      const result = await registerAction(null, fd);
      if (result?.errors) {
        const flat = Object.values(result.errors).flat();
        setFormError(flat[0] ?? "Errore durante la registrazione.");
      }
    });
  }

  return (
    <div className="w-full max-w-lg">
      {/* Verification notice */}
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Accesso riservato ai professionisti</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            I dati aziendali saranno verificati dal nostro team prima dell&apos;attivazione.
            Riceverai una conferma entro 24 ore lavorative.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        {/* Step indicator */}
        <div className="flex items-center px-6 py-4 border-b bg-slate-50/60 gap-1">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors border",
                  step === s.num
                    ? "bg-primary border-primary text-white"
                    : step > s.num
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-white border-slate-200 text-slate-400"
                )}>
                  {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  step === s.num ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 mx-2 h-px",
                  step > s.num ? "bg-primary/30" : "bg-slate-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div className="mb-1">
                <h2 className="text-base font-semibold">Il tuo account</h2>
                <p className="text-sm text-muted-foreground">Credenziali di accesso personali</p>
              </div>
              <Field
                label="Nome e cognome" id="name" value={data.name} required
                onChange={(v) => set("name", v)} placeholder="Marco Rossi"
                autoComplete="name" error={stepErrors.name}
              />
              <Field
                label="Email" id="email" type="email" value={data.email} required
                onChange={(v) => set("email", v)} placeholder="marco@negozio.it"
                autoComplete="email" error={stepErrors.email}
              />
              <Field
                label="Password" id="password" type="password" value={data.password} required
                onChange={(v) => set("password", v)} placeholder="Minimo 8 caratteri"
                autoComplete="new-password" error={stepErrors.password}
              />
              <Field
                label="Conferma password" id="confirmPassword" type="password" value={data.confirmPassword} required
                onChange={(v) => set("confirmPassword", v)} placeholder="Ripeti la password"
                autoComplete="new-password" error={stepErrors.confirmPassword}
              />
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-1">
                <h2 className="text-base font-semibold">Il tuo centro</h2>
                <p className="text-sm text-muted-foreground">Informazioni sul centro di riparazione</p>
              </div>
              <Field
                label="Nome commerciale" id="shopName" value={data.shopName} required
                onChange={(v) => set("shopName", v)} placeholder="Riparazioni Marco"
                hint="Il nome visibile ai tuoi clienti" error={stepErrors.shopName}
              />
              <Field
                label="Ragione sociale" id="legalName" value={data.legalName}
                onChange={(v) => set("legalName", v)} placeholder="Marco Rossi S.r.l. (facoltativo)"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Partita IVA" id="vatNumber" value={data.vatNumber}
                  onChange={(v) => set("vatNumber", v)} placeholder="12345678901"
                />
                <Field
                  label="Codice SDI" id="sdiCode" value={data.sdiCode}
                  onChange={(v) => set("sdiCode", v)} placeholder="0000000"
                />
              </div>
              <Field
                label="PEC" id="pec" type="email" value={data.pec}
                onChange={(v) => set("pec", v)} placeholder="fatture@pec.negozio.it"
              />
              <Field
                label="Telefono" id="phone" type="tel" value={data.phone}
                onChange={(v) => set("phone", v)} placeholder="+39 333 1234567"
                autoComplete="tel"
              />
            </>
          )}

          {step === 3 && (
            <>
              <div className="mb-1">
                <h2 className="text-base font-semibold">Sede legale</h2>
                <p className="text-sm text-muted-foreground">Indirizzo registrato dell&apos;attività</p>
              </div>
              <Field
                label="Indirizzo" id="address" value={data.address} required
                onChange={(v) => set("address", v)} placeholder="Via Roma, 1"
                autoComplete="street-address" error={stepErrors.address}
              />
              <div className="grid grid-cols-[90px_1fr_70px] gap-3">
                <Field
                  label="CAP" id="postalCode" value={data.postalCode} required
                  onChange={(v) => set("postalCode", v)} placeholder="00100"
                  autoComplete="postal-code" maxLength={5} error={stepErrors.postalCode}
                />
                <Field
                  label="Città" id="city" value={data.city} required
                  onChange={(v) => set("city", v)} placeholder="Roma"
                  autoComplete="address-level2" error={stepErrors.city}
                />
                <Field
                  label="Prov." id="province" value={data.province}
                  onChange={(v) => set("province", v.toUpperCase().slice(0, 2))}
                  placeholder="RM" maxLength={2}
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="mb-1">
                <h2 className="text-base font-semibold">Sede operativa</h2>
                <p className="text-sm text-muted-foreground">Dove si trova fisicamente il tuo centro</p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={data.sameAsLegal}
                  onChange={(e) => set("sameAsLegal", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-primary cursor-pointer"
                />
                <span className="text-sm">Coincide con la sede legale</span>
              </label>
              {!data.sameAsLegal && (
                <div className="space-y-4 pt-1">
                  <Field
                    label="Indirizzo" id="operativeAddress" value={data.operativeAddress}
                    onChange={(v) => set("operativeAddress", v)} placeholder="Via Roma, 1"
                    autoComplete="street-address"
                  />
                  <div className="grid grid-cols-[90px_1fr_70px] gap-3">
                    <Field
                      label="CAP" id="operativePostalCode" value={data.operativePostalCode}
                      onChange={(v) => set("operativePostalCode", v)} placeholder="00100"
                      autoComplete="postal-code" maxLength={5}
                    />
                    <Field
                      label="Città" id="operativeCity" value={data.operativeCity}
                      onChange={(v) => set("operativeCity", v)} placeholder="Roma"
                      autoComplete="address-level2"
                    />
                    <Field
                      label="Prov." id="operativeProvince" value={data.operativeProvince}
                      onChange={(v) => set("operativeProvince", v.toUpperCase().slice(0, 2))}
                      placeholder="RM" maxLength={2}
                    />
                  </div>
                </div>
              )}
              {formError && (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t px-6 py-4 bg-slate-50/40">
          {step > 1 ? (
            <Button variant="ghost" size="sm" onClick={handleBack} disabled={isPending}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
            </Button>
          ) : (
            <div />
          )}
          {step < 4 ? (
            <Button size="sm" onClick={handleNext}>
              Avanti <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crea account
            </Button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Hai già un account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Accedi
        </Link>
      </p>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Registrandoti accetti i{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
          Termini di servizio
        </Link>{" "}
        e la{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          Privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
