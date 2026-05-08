"use client";

import { useState, useTransition } from "react";
import { updateInterventionStatusAction } from "../actions";
import { Check, Loader2, Pencil, MessageSquare, Copy, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  interventionId: string;
  initialStatus: string;
  rawMinutes: number;
  editUrl: string;
  signUrl: string | null;
  clientSignedAt: Date | null;
  signWaText: string;
  whatsappPhone: string | null;
  verbaleUrl: string;
};

const STEPS = [
  { label: "Ricevuto" },
  { label: "In lavorazione" },
  { label: "Completato" },
  { label: "Firmato" },
];

function currentStepIndex(status: string, isSigned: boolean) {
  if (isSigned) return 3;
  if (status === "completed") return 2;
  if (status === "in_progress") return 1;
  return 0;
}

export function WorkflowPanel({
  interventionId,
  initialStatus,
  rawMinutes,
  editUrl,
  signUrl,
  clientSignedAt,
  signWaText,
  whatsappPhone,
  verbaleUrl,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const isSigned = !!clientSignedAt;
  const stepIdx = currentStepIndex(status, isSigned);

  function changeStatus(newStatus: string) {
    setStatus(newStatus);
    startTransition(async () => {
      await updateInterventionStatusAction(interventionId, newStatus);
    });
  }

  async function copySign() {
    await navigator.clipboard.writeText(signWaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openSignWa() {
    const phone = whatsappPhone ? whatsappPhone.replace(/\D/g, "") : "";
    const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(signWaText)}`, "_blank");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Gestione intervento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Step indicator */}
        <div className="flex items-start">
          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-1 items-start">
              <div className="flex flex-col items-center w-full">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  i < stepIdx
                    ? "bg-primary text-primary-foreground"
                    : i === stepIdx
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-slate-200 text-slate-400"
                }`}>
                  {i < stepIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <p className={`mt-1.5 text-xs text-center leading-tight ${i === stepIdx ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 mt-3.5 flex-1 mx-0.5 shrink-0 ${i < stepIdx ? "bg-primary" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 0: Aperto ── */}
        {status === "open" && (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              Prendi in carico il ticket per segnalare che è in lavorazione, poi modifica per inserire durata, tecnico e luogo.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" disabled={isPending} onClick={() => changeStatus("in_progress")} className="gap-1.5">
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Prendi in carico
              </Button>
              <Link href={editUrl}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Modifica ticket
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ── Step 1: In lavorazione ── */}
        {status === "in_progress" && (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              Modifica il ticket per aggiungere durata, tecnico e luogo. Poi segnalo come completato.
            </p>
            {rawMinutes === 0 && (
              <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Durata ancora 0 — inserisci i minuti prima di completare.
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <Link href={editUrl}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" />
                  Modifica
                </Button>
              </Link>
              <Button
                size="sm"
                disabled={isPending || rawMinutes === 0}
                onClick={() => changeStatus("completed")}
                className="gap-1.5"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Segna completato
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Completato, in attesa firma ── */}
        {status === "completed" && !isSigned && (
          <div className="space-y-3 pt-1">
            <p className="text-sm text-muted-foreground">
              Invia il link al cliente per raccogliere la firma digitale sul verbale.
            </p>
            <pre className="whitespace-pre-wrap text-xs bg-slate-50 border rounded-md p-3 font-sans leading-relaxed">
              {signUrl
                ? signWaText
                : "Link di firma non disponibile — salva una modifica al ticket per generarlo."}
            </pre>
            {signUrl && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={copySign}>
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiato!" : "Copia testo"}
                </Button>
                <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={openSignWa}>
                  <MessageSquare className="h-3.5 w-3.5" />
                  Apri WhatsApp
                </Button>
              </div>
            )}
            {signUrl && (
              <p className="text-xs text-muted-foreground">
                Link diretto:{" "}
                <a href={signUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">
                  {signUrl}
                </a>
              </p>
            )}
          </div>
        )}

        {/* ── Step 3: Firmato ── */}
        {status === "completed" && isSigned && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Verbale firmato dal cliente</p>
                  <p className="text-xs text-emerald-700">
                    {new Intl.DateTimeFormat("it-IT", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                      timeZone: "Europe/Rome",
                    }).format(new Date(clientSignedAt!))}
                  </p>
                </div>
              </div>
              <a href={verbaleUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <FileText className="h-3.5 w-3.5" />
                  Scarica verbale
                </Button>
              </a>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
