"use client";

import { useState, useTransition } from "react";
import { updateTicketStatusAction, updateTicketNotesAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, ExternalLink, Loader2, QrCode } from "lucide-react";

type Status = { id: string; name: string; color: string };

type Props = {
  ticketId: string;
  currentStatusId: string | null;
  statuses: Status[];
  internalNotes: string;
  trackingUrl: string;
  whatsappTemplate: string;
  waLink: string | null;
};

export function TicketActions({
  ticketId,
  currentStatusId,
  statuses,
  internalNotes,
  trackingUrl,
  whatsappTemplate,
  waLink,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState(currentStatusId ?? "");
  const [notes, setNotes] = useState(internalNotes);
  const [notesSaved, setNotesSaved] = useState(false);
  const [copied, setCopied] = useState<"url" | "wa" | null>(null);

  function handleStatusChange(statusId: string) {
    setSelectedStatus(statusId);
    startTransition(() => {
      updateTicketStatusAction(ticketId, statusId);
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      await updateTicketNotesAction(ticketId, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    });
  }

  async function copyToClipboard(text: string, key: "url" | "wa") {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
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

      {/* WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Messaggio WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <pre className="whitespace-pre-wrap rounded bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
            {whatsappTemplate}
          </pre>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() => copyToClipboard(whatsappTemplate, "wa")}
            >
              {copied === "wa" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "wa" ? "Copiato!" : "Copia testo"}
            </Button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="gap-1.5 bg-[#25D366] hover:bg-[#1ebe57]">
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
