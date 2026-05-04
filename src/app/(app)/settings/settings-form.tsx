"use client";

import { useTransition, useRef, useState } from "react";
import { updateOrganizationAction, getLogoUploadUrl, saveLogoUrl } from "./actions";
import { toJpeg } from "@/lib/image-convert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Loader2, Upload, X, Bot } from "lucide-react";
import { hasPlan } from "@/lib/permissions";

const DEFAULT_WA_TEMPLATE = `Salve {{nome}}!
Il suo {{dispositivo}} è ora in stato: *{{stato}}*.
Può seguire l'avanzamento qui: {{link_tracking}}

— {{nome_negozio}}`;

const WA_PRESETS = [
  { label: "Ricevuto", body: "Ciao {{nome}}, abbiamo ricevuto il tuo {{dispositivo}} e lo mettiamo in lavorazione. Tieni d'occhio lo stato qui: {{link_tracking}}\n— {{nome_negozio}}" },
  { label: "Preventivo pronto", body: "Ciao {{nome}}, il preventivo per {{dispositivo}} è pronto. Puoi vederlo qui: {{link_tracking}}\nContattaci per approvarlo.\n— {{nome_negozio}}" },
  { label: "Pronto per il ritiro", body: "Ciao {{nome}}, ottima notizia! {{dispositivo}} è riparato e pronto per il ritiro. Dettagli: {{link_tracking}}\n— {{nome_negozio}}" },
  { label: "Non riparabile", body: "Ciao {{nome}}, purtroppo {{dispositivo}} non è riparabile. Ti spieghiamo i motivi di persona. Info: {{link_tracking}}\n— {{nome_negozio}}" },
  { label: "Promemoria ritiro", body: "Ciao {{nome}}, ti ricordiamo che {{dispositivo}} è pronto da ritirare da qualche giorno. Passa quando vuoi! {{link_tracking}}\n— {{nome_negozio}}" },
];

type Org = {
  name: string;
  phone: string | null;
  whatsappPhone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  vatNumber: string | null;
  brandingPrimaryColor: string | null;
  brandingLogoUrl: string | null;
  whatsappTemplate: string | null;
  googleReviewUrl: string | null;
  termsAndConditions: string | null;
  vatRate: number;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  plan: string | null;
};

export function SettingsForm({ org }: { org: Org }) {
  const isBusiness = hasPlan(org.plan, "business");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState(org.brandingLogoUrl ?? "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [waTemplate, setWaTemplate] = useState(org.whatsappTemplate ?? DEFAULT_WA_TEMPLATE);
  const [botActivating, setBotActivating] = useState(false);
  const [botStatus, setBotStatus] = useState<"idle" | "ok" | "error">("idle");
  const [botError, setBotError] = useState("");

  function handleSave(formData: FormData) {
    startTransition(async () => {
      await updateOrganizationAction(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  async function handleActivateBot() {
    setBotActivating(true);
    setBotStatus("idle");
    setBotError("");
    try {
      const res = await fetch("/api/telegram/setup", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setBotStatus("ok");
      } else {
        setBotStatus("error");
        setBotError(data.error ?? "Errore sconosciuto");
      }
    } catch {
      setBotStatus("error");
      setBotError("Errore di rete. Riprova.");
    } finally {
      setBotActivating(false);
    }
  }

  async function handleLogoUpload(rawFile: File) {
    setUploadingLogo(true);
    try {
      const file = await toJpeg(rawFile);
      const { uploadUrl, key } = await getLogoUploadUrl(file.name, "image/jpeg");
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": "image/jpeg" } });
      await saveLogoUrl(key);
      const { getPublicUrl } = await import("@/lib/storage");
      setLogoUrl(getPublicUrl(key));
    } catch {
      alert("Errore nel caricamento del logo. Riprova.");
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <form action={handleSave} className="space-y-6">
      {/* Dati negozio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati centro di riparazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome attività <span className="text-destructive">*</span></Label>
            <Input id="name" name="name" defaultValue={org.name} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={org.phone ?? ""} placeholder="+39 02 0000000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsappPhone">
                WhatsApp <span className="text-xs text-muted-foreground">(per il tracking cliente)</span>
              </Label>
              <Input id="whatsappPhone" name="whatsappPhone" type="tel" defaultValue={org.whatsappPhone ?? ""} placeholder="+39 333 000 0000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="address">Indirizzo</Label>
              <Input id="address" name="address" defaultValue={org.address ?? ""} placeholder="Via Roma, 1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">Città</Label>
              <Input id="city" name="city" defaultValue={org.city ?? ""} placeholder="Milano" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="postalCode">CAP</Label>
              <Input id="postalCode" name="postalCode" defaultValue={org.postalCode ?? ""} placeholder="20100" maxLength={5} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vatNumber">P. IVA / C.F.</Label>
              <Input id="vatNumber" name="vatNumber" defaultValue={org.vatNumber ?? ""} placeholder="IT12345678901" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vatRate">Aliquota IVA (%)</Label>
              <Input id="vatRate" name="vatRate" type="number" min="0" max="99" defaultValue={org.vatRate} placeholder="22" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative">
                  <img src={logoUrl} alt="Logo" className="h-14 w-auto max-w-[160px] rounded-lg border object-contain p-1" />
                  <button
                    type="button"
                    onClick={() => { setLogoUrl(""); saveLogoUrl(""); }}
                    className="absolute -right-2 -top-2 rounded-full bg-white border p-0.5 text-muted-foreground shadow-sm hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-14 w-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-muted-foreground/50">
                  <span className="text-xs">Nessun logo</span>
                </div>
              )}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="gap-1.5"
                >
                  {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {logoUrl ? "Cambia logo" : "Carica logo"}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">PNG o SVG, sfondo trasparente consigliato</p>
              </div>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
            />
          </div>

          <Separator />

          {/* Colore primario */}
          <div className="space-y-1.5">
            <Label htmlFor="brandingPrimaryColor">Colore primario</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="brandingPrimaryColor"
                name="brandingPrimaryColor"
                defaultValue={org.brandingPrimaryColor ?? "#0D8F7A"}
                className="h-10 w-16 cursor-pointer rounded-md border p-1"
              />
              <p className="text-xs text-muted-foreground">
                Usato nell'header della pagina tracking e nelle ricevute
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template WhatsApp + Google */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Messaggi WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="googleReviewUrl">Link recensione Google</Label>
            <Input
              id="googleReviewUrl"
              name="googleReviewUrl"
              type="url"
              defaultValue={org.googleReviewUrl ?? ""}
              placeholder="https://g.page/r/..."
            />
            <p className="text-xs text-muted-foreground">
              Incolla il link diretto alla tua pagina Google Reviews. Viene usato nel template "Richiedere recensione".
            </p>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="whatsappTemplate">Template aggiornamento stato</Label>
            <p className="text-xs text-muted-foreground">
              Variabili:{" "}
              {["{{nome}}", "{{dispositivo}}", "{{stato}}", "{{numero_ticket}}", "{{link_tracking}}", "{{nome_negozio}}"].map((v) => (
                <code key={v} className="rounded bg-slate-100 px-1 text-xs mr-1">{v}</code>
              ))}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WA_PRESETS.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setWaTemplate(p.body)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <textarea
              id="whatsappTemplate"
              name="whatsappTemplate"
              value={waTemplate}
              onChange={(e) => setWaTemplate(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifiche Telegram + Bot BI — Business only */}
      <Card className={!isBusiness ? "opacity-60" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Telegram — Notifiche e Bot BI</CardTitle>
            {!isBusiness && (
              <a href="/upgrade" className="text-xs font-medium text-primary hover:underline">Piano Business →</a>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isBusiness ? (
            <p className="text-sm text-muted-foreground">
              Le notifiche Telegram e il bot BI sono disponibili nel piano Business. <a href="/upgrade" className="text-primary hover:underline font-medium">Aggiorna il piano</a> per configurarli.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Ricevi notifiche quando un cliente accetta o rifiuta un preventivo e chiedi al bot dati in tempo reale (es. &quot;quanti ticket oggi?&quot;, &quot;fatturato questo mese?&quot;).
              </p>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-slate-700">Come configurare:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Cerca <code className="rounded bg-white border px-1">@BotFather</code> su Telegram, digita <code className="rounded bg-white border px-1">/newbot</code> e segui le istruzioni per ottenere il <strong>Bot Token</strong>.</li>
                  <li>Avvia il tuo bot (cerca il suo username su Telegram e clicca Start).</li>
                  <li>Apri <code className="rounded bg-white border px-1">api.telegram.org/bot&#123;TOKEN&#125;/getUpdates</code> nel browser per trovare il tuo <strong>Chat ID</strong> (numero nel campo <code className="rounded bg-white border px-1">chat.id</code>).</li>
                  <li>Incolla Token e Chat ID qui sotto, salva le impostazioni, poi clicca <strong>Attiva Bot Telegram</strong>.</li>
                </ol>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="telegramBotToken">Bot Token</Label>
                  <Input
                    id="telegramBotToken"
                    name="telegramBotToken"
                    type="password"
                    defaultValue={org.telegramBotToken ?? ""}
                    placeholder="123456789:AAF..."
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telegramChatId">Chat ID</Label>
                  <Input
                    id="telegramChatId"
                    name="telegramChatId"
                    defaultValue={org.telegramChatId ?? ""}
                    placeholder="-100123456789"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={botActivating}
                  onClick={handleActivateBot}
                  className="gap-2"
                >
                  {botActivating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  Attiva Bot Telegram
                </Button>
                {botStatus === "ok" && (
                  <span className="flex items-center gap-1 text-xs text-green-700">
                    <Check className="h-3.5 w-3.5" /> Bot attivato con successo!
                  </span>
                )}
                {botStatus === "error" && (
                  <span className="text-xs text-destructive">{botError}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Salva prima le impostazioni con Token e Chat ID, poi clicca il bottone per registrare il webhook Telegram.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Termini e condizioni */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Termini e condizioni</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Questi termini vengono mostrati al cliente quando accetta un preventivo da remoto. Lascia vuoto per usare i termini di default.
          </p>
          <textarea
            id="termsAndConditions"
            name="termsAndConditions"
            defaultValue={org.termsAndConditions ?? ""}
            rows={12}
            placeholder="Inserisci i tuoi termini e condizioni di assistenza..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saved ? "Salvato!" : "Salva impostazioni"}
        </Button>
      </div>
    </form>
  );
}
