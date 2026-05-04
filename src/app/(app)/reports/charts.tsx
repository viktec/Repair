"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, Area, AreaChart,
} from "recharts";

function fmt(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

// ─── Tab 1: Margini ricambi ───────────────────────────────────────────────────

export type MarginRow = {
  name: string;
  marginCents: number;
  marginPct: number;
  totalRevenueCents: number;
  totalCostCents: number;
  qty: number;
};

export function MarginsTable({ rows }: { rows: MarginRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground italic">
        Nessun ricambio usato in questo periodo.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground uppercase tracking-wide">
            <th className="py-2 text-left font-medium">Ricambio</th>
            <th className="py-2 text-right font-medium">Pz.</th>
            <th className="py-2 text-right font-medium">Costo tot.</th>
            <th className="py-2 text-right font-medium">Ricavo tot.</th>
            <th className="py-2 text-right font-medium">Margine €</th>
            <th className="py-2 text-right font-medium">Margine %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
              <td className="py-2.5 font-medium max-w-[200px] truncate">{r.name}</td>
              <td className="py-2.5 text-right text-muted-foreground">{r.qty}</td>
              <td className="py-2.5 text-right text-muted-foreground">{fmt(r.totalCostCents)}</td>
              <td className="py-2.5 text-right">{fmt(r.totalRevenueCents)}</td>
              <td className={`py-2.5 text-right font-semibold ${r.marginCents >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {fmt(r.marginCents)}
              </td>
              <td className={`py-2.5 text-right font-semibold ${r.marginPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {r.marginPct.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab 2: Top guasti ────────────────────────────────────────────────────────

export type FaultRow = { fault: string; count: number };

export function FaultsChart({ rows }: { rows: FaultRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground italic">
        Nessun ticket in questo periodo.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 38)}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="fault"
          width={180}
          tick={{ fontSize: 11, fill: "#1e293b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => v.length > 28 ? v.slice(0, 27) + "…" : v}
        />
        <Tooltip
          formatter={(v) => [v, "Ticket"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
        />
        <Bar dataKey="count" fill="#0D8F7A" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Tab 3: Tempo medio riparazione ──────────────────────────────────────────

export type AvgTimeRow = { label: string; avgDays: number };
export type AvgTimeMonthRow = { month: string; avgDays: number };

export function AvgTimeByBrandChart({ rows }: { rows: AvgTimeRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground italic">
        Nessun ticket chiuso in questo periodo.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 38)}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}g`}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fontSize: 11, fill: "#1e293b" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(1)} giorni`, "Tempo medio"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
        />
        <Bar dataKey="avgDays" fill="#6366f1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AvgTimeTrendChart({ rows }: { rows: AvgTimeMonthRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground italic">
        Nessun dato disponibile.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={rows} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}g`}
          width={36}
        />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(1)} giorni`, "Tempo medio"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
        />
        <Line type="monotone" dataKey="avgDays" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Tab 4: Confronto periodi ────────────────────────────────────────────────

export type PeriodPoint = {
  month: string;
  currentYear: number;
  prevYear: number;
  twoPrevYear: number;
};

export function PeriodCompareChart({
  rows,
  currentYear,
}: {
  rows: PeriodPoint[];
  currentYear: number;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground italic">
        Nessun dato disponibile.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={rows} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colCurr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0D8F7A" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#0D8F7A" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colPrev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="col2Prev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `€${(v / 100).toFixed(0)}`}
          width={54}
        />
        <Tooltip
          formatter={(v, name) => [fmt(Number(v)), String(name)]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="twoPrevYear"
          name={`${currentYear - 2}`}
          stroke="#f59e0b"
          fill="url(#col2Prev)"
          strokeWidth={1.5}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="prevYear"
          name={`${currentYear - 1}`}
          stroke="#6366f1"
          fill="url(#colPrev)"
          strokeWidth={1.5}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="currentYear"
          name={`${currentYear}`}
          stroke="#0D8F7A"
          fill="url(#colCurr)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
