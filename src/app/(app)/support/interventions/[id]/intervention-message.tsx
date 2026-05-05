"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageSquare, Mail, FileText } from "lucide-react";

type Tab = "whatsapp" | "email" | "verbale";

interface Props {
  whatsappText: string;
  emailText: string;
  verbaleUrl: string;
  whatsappPhone: string | null;
}

function CopyTextButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiato!" : "Copia testo"}
    </Button>
  );
}

export function InterventionMessage({ whatsappText, emailText, verbaleUrl, whatsappPhone }: Props) {
  const [active, setActive] = useState<Tab>("whatsapp");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { id: "email", label: "Email", icon: Mail },
    { id: "verbale", label: "Verbale", icon: FileText },
  ];

  const waLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappText)}`
    : null;

  return (
    <div className="space-y-3">
      {/* Tab buttons */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              active === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "whatsapp" && (
        <div className="space-y-3">
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 border rounded-md p-4 font-sans leading-relaxed">
            {whatsappText}
          </pre>
          <div className="flex gap-2 flex-wrap">
            <CopyTextButton text={whatsappText} />
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Apri WhatsApp
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      {active === "email" && (
        <div className="space-y-3">
          <pre className="whitespace-pre-wrap text-sm bg-slate-50 border rounded-md p-4 font-sans leading-relaxed">
            {emailText}
          </pre>
          <CopyTextButton text={emailText} />
        </div>
      )}

      {active === "verbale" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Genera il verbale PDF dell&apos;intervento da stampare o inviare al cliente.
          </p>
          <a href={verbaleUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Stampa / Scarica Verbale
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
