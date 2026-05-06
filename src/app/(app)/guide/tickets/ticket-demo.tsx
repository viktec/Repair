"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";

type Phase = "form" | "created" | "status";

const STATUSES = [
  { name: "In attesa",    color: "#6B7280" },
  { name: "Diagnosi",     color: "#F59E0B" },
  { name: "In riparazione", color: "#3B82F6" },
  { name: "Pronto",       color: "#10B981" },
  { name: "Consegnato",   color: "#8B5CF6" },
];

export function TicketDemo() {
  const [phase, setPhase] = useState<Phase>("form");
  const [statusIdx, setStatusIdx] = useState(0);
  const [device, setDevice] = useState("iPhone 14 Pro");
  const [fault, setFault] = useState("Schermo rotto — non risponde al tocco");
  const [customer] = useState("Mario Rossi");

  if (phase === "form") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Cliente</label>
            <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm">{customer}</div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Dispositivo</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Descrizione guasto</label>
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            rows={2}
            value={fault}
            onChange={(e) => setFault(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Preventivo (€)</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="89.90" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">IMEI</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="350000000000000" />
          </div>
        </div>
        <button
          onClick={() => setPhase("created")}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Crea ticket →
        </button>
      </div>
    );
  }

  if (phase === "created") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">Ticket #001 creato con successo!</p>
        </div>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Ticket</p>
              <p className="font-semibold">#001</p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: STATUSES[statusIdx].color }}
            >
              {STATUSES[statusIdx].name}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-medium">{customer}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dispositivo</p>
              <p className="font-medium">{device}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Guasto</p>
            <p className="text-sm">{fault}</p>
          </div>
        </div>
        <button
          onClick={() => setPhase("status")}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Aggiorna stato ticket →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Ticket #001 — {device}</p>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: STATUSES[statusIdx].color }}
          >
            {STATUSES[statusIdx].name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Seleziona il nuovo stato:</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setStatusIdx(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                i === statusIdx
                  ? "border-transparent text-white"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
              style={i === statusIdx ? { backgroundColor: s.color } : {}}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {statusIdx === STATUSES.length - 1 && (
        <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-violet-600" />
          <p className="text-sm text-violet-800 font-medium">Ticket completato! Il cliente ha ricevuto una notifica email.</p>
        </div>
      )}

      <button
        onClick={() => { setPhase("form"); setStatusIdx(0); }}
        className="text-xs text-primary hover:underline"
      >
        ← Ricomincia demo
      </button>
    </div>
  );
}
