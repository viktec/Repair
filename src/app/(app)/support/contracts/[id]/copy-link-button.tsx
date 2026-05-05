"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageCircle } from "lucide-react";

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
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text =
      `Buongiorno ${customerName},\n\n` +
      `da oggi è attivo il suo contratto di assistenza *${contractNumber}* con ${orgName}.\n\n` +
      `Può accedere in qualsiasi momento al suo portale personale per:\n` +
      `• consultare le ore di assistenza disponibili\n` +
      `• vedere lo storico degli interventi\n` +
      `• aprire una nuova richiesta di assistenza\n\n` +
      `👉 ${portalUrl}\n\n` +
      `Siamo a sua disposizione per qualsiasi necessità.\n\n` +
      `${orgName}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-emerald-600" />
        : <MessageCircle className="h-3.5 w-3.5" />}
      {copied ? "Messaggio copiato!" : "Copia messaggio WhatsApp"}
    </button>
  );
}
