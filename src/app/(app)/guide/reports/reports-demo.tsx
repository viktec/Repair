"use client";

import { useState } from "react";

type Period = "7d" | "30d" | "month";

const DATA: Record<Period, { tickets: number; closed: number; revenue: number; avgDays: number; completion: number }> = {
  "7d":    { tickets: 23, closed: 18, revenue: 1840, avgDays: 1.8, completion: 78 },
  "30d":   { tickets: 94, closed: 81, revenue: 7620, avgDays: 2.1, completion: 86 },
  "month": { tickets: 67, closed: 59, revenue: 5490, avgDays: 1.9, completion: 88 },
};

const PERIOD_LABELS: Record<Period, string> = { "7d": "Ultimi 7 giorni", "30d": "Ultimi 30 giorni", "month": "Questo mese" };

const TECHNICIANS = [
  { name: "Marco R.", tickets: 31, avg: "1.7g", rate: 92 },
  { name: "Sara B.", tickets: 28, avg: "2.1g", rate: 86 },
  { name: "Luca M.", tickets: 22, avg: "2.4g", rate: 81 },
];

export function ReportsDemo() {
  const [period, setPeriod] = useState<Period>("30d");
  const d = DATA[period];

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${period === p ? "bg-primary text-white" : "border text-muted-foreground hover:bg-slate-50"}`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Ticket aperti", value: d.tickets, sub: "+12% vs periodo prec.", color: "text-blue-600" },
          { label: "Ticket chiusi", value: d.closed, sub: `${d.completion}% completamento`, color: "text-emerald-600" },
          { label: "Fatturato est.", value: `€${d.revenue.toLocaleString("it-IT")}`, sub: "incasso stimato", color: "text-primary" },
          { label: "Tempo medio", value: `${d.avgDays}g`, sub: "dalla creazione alla chiusura", color: "text-orange-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border bg-slate-50/60 p-3">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 border-b">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Performance tecnici</p>
        </div>
        <div className="divide-y">
          {TECHNICIANS.map((t) => (
            <div key={t.name} className="flex items-center gap-4 px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{t.name[0]}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.tickets} ticket · media {t.avg}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-600">{t.rate}%</p>
                <p className="text-[10px] text-muted-foreground">completamento</p>
              </div>
              <div className="w-16">
                <div className="h-1.5 bg-slate-200 rounded-full">
                  <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${t.rate}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
