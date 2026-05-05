"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageCircle, X } from "lucide-react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiato!" : "Copia link"}
    </Button>
  );
}

function buildTemplate(customerName: string, contractNumber: string, orgName: string, portalUrl: string) {
  return (
    `Buongiorno ${customerName},\n\n` +
    `da oggi è attivo il suo contratto di assistenza *${contractNumber}* con ${orgName}.\n\n` +
    `Può accedere in qualsiasi momento al suo portale personale per:\n` +
    `• consultare le ore di assistenza disponibili\n` +
    `• vedere lo storico degli interventi\n` +
    `• aprire una nuova richiesta di assistenza\n\n` +
    `👉 ${portalUrl}\n\n` +
    `Siamo a sua disposizione per qualsiasi necessità.\n\n` +
    `${orgName}`
  );
}

export function WhatsAppContractButton({
  customerName,
  contractNumber,
  orgName,
  portalUrl,
}: {
  customerName: string;
  contractNumber: string;
  orgName: string;
  portalUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  function handleOpen() {
    setText(buildTemplate(customerName, contractNumber, orgName, portalUrl));
    setOpen(true);
    setCopied(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-1">
      {!open ? (
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Messaggio WhatsApp
        </button>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Anteprima messaggio</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] py-2 text-xs font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiato!" : "Copia messaggio"}
          </button>
        </div>
      )}
    </div>
  );
}
