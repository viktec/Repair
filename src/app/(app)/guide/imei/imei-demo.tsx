"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const DEMO_IMEI = "350000000000001";

const MOCK_RESULT = {
  imei: DEMO_IMEI,
  device: "iPhone 14 Pro · Space Black",
  tickets: [
    { id: "#042", date: "12 feb 2026", fault: "Sostituzione display", status: "Consegnato", technician: "Marco R.", cost: "€149.90" },
    { id: "#017", date: "03 nov 2025", fault: "Sostituzione batteria", status: "Consegnato", technician: "Sara B.", cost: "€79.90" },
  ],
};

export function ImeiDemo() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<typeof MOCK_RESULT | null>(null);
  const [notFound, setNotFound] = useState(false);

  function search() {
    setNotFound(false);
    setResult(null);
    if (query.trim() === DEMO_IMEI) {
      setResult(MOCK_RESULT);
    } else if (query.trim().length >= 5) {
      setNotFound(true);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Usa l'IMEI di esempio: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">{DEMO_IMEI}</code></p>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Inserisci IMEI (15 cifre)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResult(null); setNotFound(false); }}
          onKeyDown={(e) => e.key === "Enter" && search()}
          maxLength={15}
        />
        <button
          onClick={search}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <Search className="h-3.5 w-3.5" /> Cerca
        </button>
      </div>

      {notFound && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
          Nessun ticket trovato per questo IMEI.
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-cyan-50 border-cyan-200 px-4 py-3">
            <p className="text-xs text-cyan-700 font-medium">Dispositivo trovato</p>
            <p className="text-sm font-semibold text-cyan-900 mt-0.5">{result.device}</p>
            <p className="text-xs text-cyan-700 mt-0.5 font-mono">IMEI: {result.imei}</p>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{result.tickets.length} ticket trovati</p>
            </div>
            <div className="divide-y">
              {result.tickets.map((t) => (
                <div key={t.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">{t.id}</span>
                      <span className="text-sm font-medium truncate">{t.fault}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.date} · {t.technician}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">{t.status}</span>
                    <p className="text-xs font-bold mt-1">{t.cost}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
