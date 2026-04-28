import Link from "next/link";
import { formatDate } from "@/lib/utils";

type Ticket = {
  id: string;
  ticketNumber: number;
  deviceBrand: string | null;
  deviceModel: string | null;
  faultDescription: string;
  createdAt: Date;
  customerName: string | null;
  statusName: string | null;
  statusColor: string | null;
  statusId: string | null;
};

type Status = {
  id: string;
  name: string;
  color: string | null;
};

export function KanbanBoard({ tickets, statuses }: { tickets: Ticket[]; statuses: Status[] }) {
  const byStatus = new Map<string | null, Ticket[]>();
  byStatus.set(null, []);
  for (const s of statuses) byStatus.set(s.id, []);
  for (const t of tickets) {
    const key = t.statusId ?? null;
    if (!byStatus.has(key)) byStatus.set(key, []);
    byStatus.get(key)!.push(t);
  }

  const columns = [
    ...statuses.map((s) => ({ id: s.id, name: s.name, color: s.color, tickets: byStatus.get(s.id) ?? [] })),
    ...(byStatus.get(null)!.length > 0
      ? [{ id: null, name: "Senza stato", color: null, tickets: byStatus.get(null)! }]
      : []),
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.id ?? "none"} className="flex w-64 shrink-0 flex-col rounded-xl bg-slate-100">
          {/* Column header */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: col.color ?? "#94a3b8" }}
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 flex-1 truncate">
              {col.name}
            </span>
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              {col.tickets.length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-2 px-2 pb-2">
            {col.tickets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">
                Nessun ticket
              </div>
            ) : (
              col.tickets.map((t) => (
                <Link key={t.id} href={`/tickets/${t.id}`}>
                  <div className="rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-slate-200">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-mono text-[11px] font-medium text-muted-foreground">
                        #{String(t.ticketNumber).padStart(4, "0")}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70 shrink-0">
                        {formatDate(t.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-foreground leading-tight">
                      {[t.deviceBrand, t.deviceModel].filter(Boolean).join(" ") || "Dispositivo"}
                    </p>
                    {t.customerName && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.customerName}</p>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.faultDescription}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
