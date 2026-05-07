"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const APP_HOST = "app.my-repair.it";

export function SelfServiceLinkBox({ orgId }: { orgId: string }) {
  const url = `https://${APP_HOST}/perizia/nuova/${orgId}`;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          Link self-service per i clienti
        </p>
        <p className="text-sm font-mono truncate text-foreground">{url}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Il cliente inserisce autonomamente i dati del dispositivo e risponde al questionario.
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={copy} className="gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiato" : "Copia"}
        </Button>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Apri
          </Button>
        </a>
      </div>
    </div>
  );
}
