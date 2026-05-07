"use client";

import React, { useState, useTransition } from "react";
import {
  evaluateWithAIAction,
  updateAppraisalAction,
  approveAppraisalAction,
  rejectAppraisalAction,
  markSurveySentAction,
  setImeiStatusAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Sparkles, CheckCircle2, X, Copy, MessageCircle,
  Send, Loader2, Check, BookOpen, ShieldCheck, ShieldX, ShieldQuestion, ExternalLink,
} from "lucide-react";

const APP_HOST = "app.my-repair.it";

function fmt(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Bozza", color: "bg-slate-100 text-slate-600 border-slate-200" },
  survey_sent: { label: "Survey inviato", color: "bg-blue-50 text-blue-700 border-blue-200" },
  survey_completed: { label: "Survey compilato", color: "bg-amber-50 text-amber-700 border-amber-200" },
  ai_evaluated: { label: "Valutato AI", color: "bg-purple-50 text-purple-700 border-purple-200" },
  approved: { label: "Approvato", color: "bg-green-50 text-green-700 border-green-200" },
  rejected: { label: "Rifiutato", color: "bg-red-50 text-red-700 border-red-200" },
};

const SCREEN_LABELS: Record<string, string> = {
  perfect: "Perfetto",
  minor_scratches: "Graffi leggeri",
  cracked: "Vetro rotto",
  shattered: "Display in frantumi",
};
const BODY_LABELS: Record<string, string> = {
  excellent: "Eccellente",
  good: "Buono",
  fair: "Discreto",
  poor: "Pessimo",
};
const BATTERY_LABELS: Record<string, string> = {
  great: "Ottima",
  good: "Buona",
  fair: "Discreta",
  poor: "Scarsa",
};
const INTENT_LABELS: Record<string, string> = {
  sell: "Solo vendita",
  trade_in: "Permuta",
  both: "Vendita o permuta",
};
const PURCHASE_METHOD_LABELS: Record<string, string> = {
  cash: "Contanti",
  card: "Carta",
  carrier_plan: "Abbonamento operatore",
  financing: "Finanziamento",
};
const PURCHASE_PLACE_LABELS: Record<string, string> = {
  physical: "Negozio fisico",
  online: "Online",
};
const IMEI_STATUS: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  clean: { label: "Libero", color: "text-green-700 bg-green-50 border-green-200", Icon: ShieldCheck },
  blocked: { label: "Bloccato", color: "text-red-700 bg-red-50 border-red-200", Icon: ShieldX },
  unknown: { label: "Non verificato", color: "text-slate-600 bg-slate-50 border-slate-200", Icon: ShieldQuestion },
};

type Appraisal = {
  id: string;
  surveyToken: string;
  status: string;
  brand: string;
  model: string;
  storageGb: string | null;
  color: string | null;
  imei: string | null;
  customerName: string | null;
  customerPhone: string | null;
  intent: string | null;
  works: boolean | null;
  screenCondition: string | null;
  bodyCondition: string | null;
  batteryHealth: string | null;
  purchaseYear: number | null;
  hasCharger: boolean;
  hasOriginalBox: boolean;
  customerExpectedCents: number | null;
  customerNotes: string | null;
  surveyCompletedAt: Date | null;
  aiValuationCents: number | null;
  aiReasoning: string | null;
  finalValuationCents: number | null;
  tradeInBonusCents: number;
  adminNotes: string | null;
  approvedAt: Date | null;
  registryEntryId: string | null;
  purchaseMethod: string | null;
  purchasePlace: string | null;
  hasProofOfPurchase: boolean | null;
  batteryPercentage: number | null;
  imeiCheckStatus: string | null;
};

export function AppraisalDetail({ appraisal }: { appraisal: Appraisal }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(
    !!appraisal.surveyCompletedAt && appraisal.finalValuationCents == null,
  );
  const [finalVal, setFinalVal] = useState(
    appraisal.finalValuationCents != null ? (appraisal.finalValuationCents / 100).toFixed(2) : "",
  );
  const [tradeInBonus, setTradeInBonus] = useState(
    appraisal.tradeInBonusCents > 0 ? (appraisal.tradeInBonusCents / 100).toFixed(2) : "",
  );
  const [adminNotes, setAdminNotes] = useState(appraisal.adminNotes ?? "");
  const [copied, setCopied] = useState<string | null>(null);

  const surveyUrl = `https://${APP_HOST}/perizia/${appraisal.surveyToken}`;
  const resultUrl = `https://${APP_HOST}/perizia/${appraisal.surveyToken}/valutazione`;
  const brand = appraisal.brand ?? "";
  const modelStartsWithBrand = brand && (appraisal.model?.toLowerCase().startsWith(brand.toLowerCase()) ?? false);
  const deviceName = [!modelStartsWithBrand && brand, appraisal.model, appraisal.storageGb].filter(Boolean).join(" ");

  const surveyWa = `Ciao${appraisal.customerName ? ` ${appraisal.customerName.split(" ")[0]}` : ""}, per valutare il tuo ${deviceName} ti chiedo di compilare questo breve questionario (2 minuti):\n${surveyUrl}`;
  const resultWa = `Ciao${appraisal.customerName ? ` ${appraisal.customerName.split(" ")[0]}` : ""}, la valutazione del tuo ${deviceName} è pronta! Puoi visualizzare l'offerta qui:\n${resultUrl}`;

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleEvaluate() {
    setError(null);
    startTransition(async () => {
      const res = await evaluateWithAIAction(appraisal.id);
      if (res.error) setError(res.error);
      else {
        setEditMode(true);
      }
    });
  }

  function handleSaveEdit() {
    const fd = new FormData();
    fd.set("finalValuationCents", finalVal);
    fd.set("tradeInBonusCents", tradeInBonus);
    fd.set("adminNotes", adminNotes);
    startTransition(async () => {
      const res = await updateAppraisalAction(appraisal.id, fd);
      if (res.error) setError(res.error);
      else setEditMode(false);
    });
  }

  function handleApprove() {
    startTransition(async () => {
      const res = await approveAppraisalAction(appraisal.id);
      if (res.error) setError(res.error);
    });
  }

  function handleReject() {
    if (!confirm("Rifiutare questa perizia?")) return;
    startTransition(async () => {
      const res = await rejectAppraisalAction(appraisal.id);
      if (res.error) setError(res.error);
    });
  }

  function handleMarkSent() {
    startTransition(async () => {
      const res = await markSurveySentAction(appraisal.id);
      if (res.error) setError(res.error);
    });
  }

  function handleSetImeiStatus(status: "clean" | "blocked" | "unknown") {
    startTransition(async () => {
      const res = await setImeiStatusAction(appraisal.id, status);
      if (res.error) setError(res.error);
    });
  }

  const st = STATUS_LABELS[appraisal.status] ?? { label: appraisal.status, color: "bg-slate-100 text-slate-600 border-slate-200" };
  const totalOffer = (appraisal.finalValuationCents ?? 0) + appraisal.tradeInBonusCents;

  return (
    <div className="space-y-5">
      {error && <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>}

      {/* Info dispositivo + status */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold">{deviceName}{appraisal.color ? ` · ${appraisal.color}` : ""}</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {appraisal.imei && (
              <div>
                <p className="text-xs text-muted-foreground">IMEI</p>
                <p className="font-mono font-medium">{appraisal.imei}</p>
              </div>
            )}
            {appraisal.customerName && (
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{appraisal.customerName}</p>
              </div>
            )}
            {appraisal.customerPhone && (
              <div>
                <p className="text-xs text-muted-foreground">Telefono</p>
                <p className="font-medium">{appraisal.customerPhone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 1 — Invia survey */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
            Invia questionario al cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-slate-50 border px-3 py-2 font-mono text-xs break-all">{surveyUrl}</div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm" variant="outline" className="gap-1.5"
              onClick={() => copyText(surveyUrl, "surveyUrl")}
            >
              {copied === "surveyUrl" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              Copia link
            </Button>
            <Button
              size="sm" variant="outline" className="gap-1.5"
              onClick={() => copyText(surveyWa, "surveyWa")}
            >
              {copied === "surveyWa" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <MessageCircle className="h-3.5 w-3.5" />}
              Copia testo WhatsApp
            </Button>
            {appraisal.customerPhone && (
              <a
                href={`https://wa.me/${appraisal.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(surveyWa)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" className="gap-1.5 bg-[#25D366] hover:bg-[#22c55e] text-white">
                  <Send className="h-3.5 w-3.5" />Apri WhatsApp
                </Button>
              </a>
            )}
            {appraisal.status === "draft" && (
              <Button size="sm" variant="ghost" disabled={isPending} onClick={handleMarkSent} className="text-muted-foreground">
                Segna come inviato
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risposte survey */}
      {appraisal.surveyCompletedAt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
              Risposte del cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Funziona</p>
                <p className="font-medium">{appraisal.works ? "Sì" : "No"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Schermo</p>
                <p className="font-medium">{appraisal.screenCondition ? SCREEN_LABELS[appraisal.screenCondition] : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Corpo</p>
                <p className="font-medium">{appraisal.bodyCondition ? BODY_LABELS[appraisal.bodyCondition] : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Batteria{appraisal.batteryPercentage != null ? ` (${appraisal.batteryPercentage}%)` : ""}
                </p>
                <p className="font-medium">{appraisal.batteryHealth ? BATTERY_LABELS[appraisal.batteryHealth] : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Anno acquisto</p>
                <p className="font-medium">{appraisal.purchaseYear ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Intenzione</p>
                <p className="font-medium">{appraisal.intent ? INTENT_LABELS[appraisal.intent] : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Accessori</p>
                <p className="font-medium">
                  {[appraisal.hasCharger && "Caricatore", appraisal.hasOriginalBox && "Scatola"].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Aspettativa cliente</p>
                <p className="font-medium">
                  {appraisal.customerExpectedCents != null ? fmt(appraisal.customerExpectedCents) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Metodo acquisto</p>
                <p className="font-medium">
                  {appraisal.purchaseMethod ? PURCHASE_METHOD_LABELS[appraisal.purchaseMethod] ?? "—" : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Luogo acquisto</p>
                <p className="font-medium">
                  {appraisal.purchasePlace ? PURCHASE_PLACE_LABELS[appraisal.purchasePlace] ?? "—" : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prova acquisto</p>
                <p className="font-medium">
                  {appraisal.hasProofOfPurchase === true ? "Sì" : appraisal.hasProofOfPurchase === false ? "No" : "—"}
                </p>
              </div>
            </div>
            {appraisal.customerNotes && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Note cliente</p>
                <p className="text-sm mt-0.5 italic">&ldquo;{appraisal.customerNotes}&rdquo;</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* IMEI check */}
      {appraisal.imei && appraisal.surveyCompletedAt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {appraisal.imeiCheckStatus
                ? (() => {
                    const s = IMEI_STATUS[appraisal.imeiCheckStatus];
                    return s ? <s.Icon className="h-4 w-4" /> : null;
                  })()
                : <ShieldQuestion className="h-4 w-4 text-muted-foreground" />}
              Verifica IMEI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-mono text-sm tracking-wider">{appraisal.imei}</p>
            {appraisal.imeiCheckStatus && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${IMEI_STATUS[appraisal.imeiCheckStatus]?.color}`}>
                {appraisal.imeiCheckStatus === "clean" && <ShieldCheck className="h-3.5 w-3.5" />}
                {appraisal.imeiCheckStatus === "blocked" && <ShieldX className="h-3.5 w-3.5" />}
                {appraisal.imeiCheckStatus === "unknown" && <ShieldQuestion className="h-3.5 w-3.5" />}
                {IMEI_STATUS[appraisal.imeiCheckStatus]?.label ?? appraisal.imeiCheckStatus}
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://www.imei.info/?imei=${appraisal.imei}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />imei.info
                </Button>
              </a>
              <a
                href={`https://imeipro.info/?imei=${appraisal.imei}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />imeipro.info
                </Button>
              </a>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 border-t">
              <p className="text-xs text-muted-foreground w-full">Dopo aver verificato, segna il risultato:</p>
              <Button
                size="sm"
                variant={appraisal.imeiCheckStatus === "clean" ? "default" : "outline"}
                className="gap-1.5"
                disabled={isPending}
                onClick={() => handleSetImeiStatus("clean")}
              >
                <ShieldCheck className="h-3.5 w-3.5" />Libero
              </Button>
              <Button
                size="sm"
                variant={appraisal.imeiCheckStatus === "blocked" ? "destructive" : "outline"}
                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
                disabled={isPending}
                onClick={() => handleSetImeiStatus("blocked")}
              >
                <ShieldX className="h-3.5 w-3.5" />Bloccato
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-muted-foreground"
                disabled={isPending}
                onClick={() => handleSetImeiStatus("unknown")}
              >
                <ShieldQuestion className="h-3.5 w-3.5" />Non verificato
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 — Valutazione AI + modifica admin */}
      {appraisal.surveyCompletedAt && appraisal.status !== "rejected" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
              Valutazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI button */}
            {!appraisal.aiValuationCents && (
              <Button onClick={handleEvaluate} disabled={isPending} className="gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Valuta con AI
              </Button>
            )}

            {appraisal.aiValuationCents != null && (
              <div className="rounded-md bg-purple-50 border border-purple-200 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Suggerimento AI</p>
                <p className="text-xl font-bold text-purple-700">{fmt(appraisal.aiValuationCents)}</p>
                {appraisal.aiReasoning && <p className="text-sm text-purple-600/80 mt-1">{appraisal.aiReasoning}</p>}
                <Button
                  size="sm" variant="ghost" className="mt-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                  onClick={handleEvaluate} disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Rivaluta
                </Button>
              </div>
            )}

            {/* Admin edit */}
            {editMode ? (
                <div className="space-y-3 rounded-md border p-4">
                  <p className="text-sm font-medium">Modifica offerta</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Offerta base (€)</Label>
                      <Input
                        type="number" min="0" step="0.01"
                        value={finalVal}
                        onChange={(e) => setFinalVal(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Bonus permuta (€)</Label>
                      <Input
                        type="number" min="0" step="0.01"
                        value={tradeInBonus}
                        onChange={(e) => setTradeInBonus(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Note interne</Label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={isPending} className="gap-1.5">
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Salva
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Annulla</Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Offerta base</p>
                      <p className="text-2xl font-bold">
                        {appraisal.finalValuationCents != null ? fmt(appraisal.finalValuationCents) : "—"}
                      </p>
                    </div>
                    {appraisal.tradeInBonusCents > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">+ Bonus permuta</p>
                        <p className="text-lg font-semibold text-green-600">+{fmt(appraisal.tradeInBonusCents)}</p>
                        <p className="text-xs text-muted-foreground">= {fmt(totalOffer)}</p>
                      </div>
                    )}
                  </div>
                  {appraisal.adminNotes && (
                    <p className="text-xs text-muted-foreground italic">{appraisal.adminNotes}</p>
                  )}
                  {appraisal.status !== "approved" && (
                    <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>Modifica offerta</Button>
                  )}
                </div>
              )
            }

            {/* Approva / Rifiuta */}
            {appraisal.finalValuationCents != null && appraisal.status !== "approved" && appraisal.status !== "rejected" && !editMode && (
              <div className="flex gap-3">
                <Button onClick={handleApprove} disabled={isPending} className="gap-2">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approva offerta
                </Button>
                <Button onClick={handleReject} disabled={isPending} variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
                  <X className="h-4 w-4" />Rifiuta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Registra nel Registro Usato */}
      {appraisal.status === "approved" && (
        <Card className={appraisal.registryEntryId ? "border-slate-200 bg-slate-50/50" : "border-primary/20"}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Registro Usato
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appraisal.registryEntryId ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Già registrata nel Registro Usato
                </span>
                <Link href="/registry" className="text-sm text-primary hover:underline">Vedi registro →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Il cliente è venuto in negozio? Importa la perizia nel Registro Usato — i dati del dispositivo
                  e il prezzo saranno pre-compilati, ti servirà solo il documento d&apos;identità.
                </p>
                <Link href={`/registry/new?perizia=${appraisal.id}`}>
                  <Button className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Importa in Registro Usato
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4 — Invia risultato */}
      {appraisal.status === "approved" && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Offerta approvata — Invia al cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-white border px-3 py-2 font-mono text-xs break-all">{resultUrl}</div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm" variant="outline" className="gap-1.5"
                onClick={() => copyText(resultUrl, "resultUrl")}
              >
                {copied === "resultUrl" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                Copia link risultato
              </Button>
              <Button
                size="sm" variant="outline" className="gap-1.5"
                onClick={() => copyText(resultWa, "resultWa")}
              >
                {copied === "resultWa" ? <Check className="h-3.5 w-3.5 text-green-600" /> : <MessageCircle className="h-3.5 w-3.5" />}
                Copia testo WhatsApp
              </Button>
              {appraisal.customerPhone && (
                <a
                  href={`https://wa.me/${appraisal.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(resultWa)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" className="gap-1.5 bg-[#25D366] hover:bg-[#22c55e] text-white">
                    <Send className="h-3.5 w-3.5" />Apri WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
