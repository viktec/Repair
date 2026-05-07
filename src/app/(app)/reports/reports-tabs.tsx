"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MarginsTable,
  FaultsChart,
  AvgTimeByBrandChart,
  AvgTimeTrendChart,
  PeriodCompareChart,
  type MarginRow,
  type FaultRow,
  type AvgTimeRow,
  type AvgTimeMonthRow,
  type PeriodPoint,
} from "./charts";

export type TechPerfRow = {
  techName: string;
  total: number;
  closed: number;
  avgDays: number | null;
};

export type ReportsPeriod = "30d" | "90d" | "180d" | "365d";

type Props = {
  currentYear: number;
  yoyDelta: number | null;
  margins: MarginRow[];
  faults: FaultRow[];
  avgByBrand: AvgTimeRow[];
  avgByMonth: AvgTimeMonthRow[];
  periodData: PeriodPoint[];
  techPerf: TechPerfRow[];
  initialPeriod: ReportsPeriod;
};

const TABS = [
  { key: "margins",  label: "Margini ricambi" },
  { key: "faults",   label: "Top guasti" },
  { key: "avgtime",  label: "Tempo medio" },
  { key: "compare",  label: "Confronto periodi" },
  { key: "tecnici",  label: "Performance tecnici" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const PERIOD_LABELS: Record<ReportsPeriod, string> = {
  "30d":  "Ultimi 30 giorni",
  "90d":  "Ultimi 3 mesi",
  "180d": "Ultimi 6 mesi",
  "365d": "Ultimo anno",
};

export function ReportsTabs({
  currentYear,
  yoyDelta,
  margins,
  faults,
  avgByBrand,
  avgByMonth,
  periodData,
  techPerf,
  initialPeriod,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("margins");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handlePeriodChange(value: string) {
    startTransition(() => {
      router.push(`${pathname}?period=${value}`);
    });
  }

  const showPeriodFilter = activeTab !== "compare";

  return (
    <div className="space-y-4">
      {/* Tab bar + filtro periodo */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap rounded-lg border bg-white p-1 gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === t.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-100",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {showPeriodFilter && (
          <select
            value={initialPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            disabled={isPending}
            className={cn(
              "rounded-md border bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-[180px]",
              isPending && "opacity-60",
            )}
          >
            {Object.entries(PERIOD_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        )}
      </div>

      {activeTab === "margins" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top 10 ricambi per margine — {PERIOD_LABELS[initialPeriod]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MarginsTable rows={margins} />
          </CardContent>
        </Card>
      )}

      {activeTab === "faults" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Guasti più frequenti — {PERIOD_LABELS[initialPeriod]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FaultsChart rows={faults} />
          </CardContent>
        </Card>
      )}

      {activeTab === "avgtime" && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tempo medio per marca — {PERIOD_LABELS[initialPeriod]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AvgTimeByBrandChart rows={avgByBrand} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Andamento tempo medio mensile (12 mesi)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AvgTimeTrendChart rows={avgByMonth} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "compare" && (
        <div className="space-y-4">
          {yoyDelta !== null && (
            <div className="flex gap-4 flex-wrap">
              <Card className="flex-1 min-w-[160px]">
                <CardContent className="pt-5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">YoY vs anno scorso</p>
                  <p className={`mt-1 text-2xl font-bold ${yoyDelta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {yoyDelta >= 0 ? "+" : ""}{yoyDelta}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fatturato mensile — confronto {currentYear - 2} / {currentYear - 1} / {currentYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PeriodCompareChart rows={periodData} currentYear={currentYear} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "tecnici" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Performance per tecnico — {PERIOD_LABELS[initialPeriod]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {techPerf.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4 text-center">
                Nessun dato nel periodo selezionato. Assegna i ticket ai tecnici per vedere le statistiche.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2">Tecnico</th>
                    <th className="pb-2 text-right">Ticket aperti</th>
                    <th className="pb-2 text-right">Ticket chiusi</th>
                    <th className="pb-2 text-right">Tasso chiusura</th>
                    <th className="pb-2 text-right">Tempo medio</th>
                  </tr>
                </thead>
                <tbody>
                  {techPerf.map((row) => {
                    const rate = row.total > 0 ? Math.round((row.closed / row.total) * 100) : 0;
                    return (
                      <tr key={row.techName} className="border-b last:border-0">
                        <td className="py-2.5 font-medium">{row.techName}</td>
                        <td className="py-2.5 text-right">{row.total}</td>
                        <td className="py-2.5 text-right">{row.closed}</td>
                        <td className="py-2.5 text-right">
                          <span className={cn(
                            "font-medium",
                            rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-amber-600" : "text-red-600",
                          )}>
                            {rate}%
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          {row.avgDays != null ? `${row.avgDays} gg` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
