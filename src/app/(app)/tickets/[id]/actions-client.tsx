"use client";

import { useState, useTransition } from "react";
import { updateTicketStatusAction, updateTicketNotesAction, sendStatusEmailAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, ExternalLink, Loader2, Mail, Printer, QrCode, MessageSquare } from "lucide-react";

type Status = { id: string; name: string; color: string };

type WaTemplate = { label: string; text: string };

type Props = {
  ticketId: string;
  currentStatusId: string | null;
  statuses: Status[];
  internalNotes: string;
  trackingUrl: string;
  waTemplates: WaTemplate[];
  customerPhone: string | null;
  printUrl: string;
  hasCustomerEmail: boolean;
};

export function TicketActions({
  ticketId,
  currentStatusId,
  statuses,
  internalNotes,
  trackingUrl,
  waTemplates,
  customerPhone,
  printUrl,
  hasCustomerEmail,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState(currentStatusId ?? "");
  const [notes, setNotes] = useState(internalNotes);
  const [notesSaved, setNotesSaved] = useState(false);
  const [copied, setCopied] = useState<"url" | number | null>(null);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);

  function handleStatusChange(statusId: string) {
    setSelectedStatus(statusId);
    startTransition(async () => {
      await updateTicketStatusAction(ticketId, statusId);
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      await updateTicketNotesAction(ticketId, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    });
  }

  function handleSendEmail() {
    setEmailState("sending");
    setEmailError(null);
    startTransition(async () => {
      const res = await sendStatusEmailAction(ticketId);
      if (res.ok) {
        setEmailState("ok");
        setTimeout(() => setEmailState("idle"), 3000);
      } else {
        setEmailState("err");
        setEmailError(res.error ?? "Errore invio email");
        setTimeout(() => setEmailState("idle"), 4000);
      }
    });
  }

  async function copyToClipboard(text: string, key: "url" | number) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function buildWaLink(text: string) {
    if (!customerPhone) return null;
    return `https://wa.me/${customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
  }

  return (
    <>
      {/* Stato */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Cambia stato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStatusChange(s.id)}
              disabled={isPending}
              className="flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-50"
              style={
                selectedStatus === s.id
                  ? { borderColor: s.color, backgroundColor: s.color + "15" }
                  : {}
              }
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="flex-1 text-left font-medium">{s.name}</span>
              {selectedStatus === s.id && (
                <Check className="h-3.5 w-3.5" style={{ color: s.color }} />
              )}
              {isPending && selectedStatus === s.id && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Note interne */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Note interne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Note visibili solo allo staff..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveNotes}
            disabled={isPending}
            className="gap-1.5"
          >
            {notesSaved ? (
              <><Check className="h-3.5 w-3.5 text-emerald-600" /> Salvato</>
            ) : (
              "Salva note"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tracking QR */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Link tracking cliente</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="break-all rounded bg-slate-50 px-2 py-1.5 font-mono text-xs text-muted-foreground">
            {trackingUrl}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() => copyToClipboard(trackingUrl, "url")}
            >
              {copied === "url" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "url" ? "Copiato!" : "Copia link"}
            </Button>
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Stampa ricevuta */}
      <a href={printUrl} target="_blank" rel="noopener noreferrer" className="block">
        <Button variant="outline" className="w-full gap-2">
          <Printer className="h-4 w-4" />
          Stampa ricevuta
        </Button>
      </a>

      {/* Email cliente */}
      {hasCustomerEmail && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Email cliente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Invia un&apos;email con lo stato attuale e il link di tracking.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5"
              onClick={handleSendEmail}
              disabled={isPending || emailState === "sending"}
            >
              {emailState === "sending" ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Invio in corso…</>
              ) : emailState === "ok" ? (
                <><Check className="h-3.5 w-3.5 text-emerald-600" /> Email inviata!</>
              ) : (
                <><Mail className="h-3.5 w-3.5" /> Invia aggiornamento</>
              )}
            </Button>
            {emailState === "err" && emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* WhatsApp templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Messaggi WhatsApp</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Tab template */}
          <div className="flex flex-wrap gap-1">
            {waTemplates.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveTemplate(i)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeTemplate === i
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <pre className="whitespace-pre-wrap rounded bg-slate-50 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
            {waTemplates[activeTemplate]?.text ?? ""}
          </pre>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() => copyToClipboard(waTemplates[activeTemplate]?.text ?? "", activeTemplate)}
            >
              {copied === activeTemplate ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === activeTemplate ? "Copiato!" : "Copia testo"}
            </Button>
            {customerPhone && (
              <a href={buildWaLink(waTemplates[activeTemplate]?.text ?? "") ?? "#"} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="gap-1.5 bg-[#25D366] hover:bg-[#1ebe57] text-white">
                  Apri WA
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
