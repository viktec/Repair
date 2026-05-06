"use client";

import { useState } from "react";
import { CheckCircle2, Clock, FileText } from "lucide-react";

type Status = "open" | "in_progress" | "completed" | "signed";

const STATUS_META: Record<Status, { label: string; color: string; next?: Status; nextLabel?: string }> = {
  open:       { label: "Aperto",      color: "bg-slate-500", next: "in_progress", nextLabel: "Prendi in carico" },
  in_progress:{ label: "In corso",   color: "bg-blue-500",  next: "completed",   nextLabel: "Segna completato" },
  completed:  { label: "Completato", color: "bg-amber-500", next: "signed",      nextLabel: "Firma digitale ricevuta" },
  signed:     { label: "Firmato",    color: "bg-emerald-500" },
};

export function SupportDemo() {
  const [status, setStatus] = useState<Status>("open");
  const [hours, setHours] = useState("2");
  const meta = STATUS_META[status];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm">Intervento #001</p>
            <p className="text-xs text-muted-foreground">Cliente: Rossi Srl · 06 mag 2026</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium text-white ${meta.color}`}>{meta.label}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Tipo intervento</p>
            <p className="font-medium">Manutenzione ordinaria</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ore lavorate</p>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-16 rounded border px-2 py-0.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                min={0}
                step={0.5}
              />
            </div>
          </div>
        </div>

        <div className="rounded-md bg-slate-50 border p-3 text-sm text-muted-foreground">
          Sostituzione batteria UPS + pulizia contatti · PC sala server
        </div>

        {status === "signed" && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Verbale firmato digitalmente</p>
              <p className="text-xs text-emerald-700">06/05/2026 · Mario Rossi</p>
            </div>
            <button className="ml-auto flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:underline">
              <FileText className="h-3.5 w-3.5" /> Scarica
            </button>
          </div>
        )}
      </div>

      {meta.next && (
        <button
          onClick={() => setStatus(meta.next!)}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          {meta.nextLabel} →
        </button>
      )}

      <button onClick={() => setStatus("open")} className="text-xs text-primary hover:underline">← Ricomincia demo</button>
    </div>
  );
}
