"use client";

import { useState, useTransition } from "react";
import { updateCheckVisitStatusAction } from "../check-visits-actions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Calendar, Loader2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

type Visit = {
  id: string;
  status: string;
  preferredDate1: Date;
  preferredDate2: Date | null;
  scheduledAt: Date | null;
  clientNotes: string | null;
  adminNotes: string | null;
  createdAt: Date;
};

function fmt(d: Date | string) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "In attesa",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confermata", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "Completata", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Annullata",  cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

export function VisitCard({
  visit,
  customerName,
  customerPhone,
}: {
  visit: Visit;
  customerName: string;
  customerPhone: string | null;
}) {
  const [scheduledDate, setScheduledDate] = useState(
    visit.scheduledAt ? new Date(visit.scheduledAt).toISOString().split("T")[0] : "",
  );
  const [adminNotes, setAdminNotes] = useState(visit.adminNotes ?? "");
  const [expanded, setExpanded] = useState(visit.status === "pending");
  const [isPending, startTransition] = useTransition();

  const s = STATUS_LABELS[visit.status] ?? STATUS_LABELS.pending;
  const isTerminal = visit.status === "completed" || visit.status === "cancelled";

  function handleAction(status: "confirmed" | "completed" | "cancelled") {
    startTransition(async () => {
      await updateCheckVisitStatusAction(visit.id, status, scheduledDate || undefined, adminNotes || undefined);
    });
  }

  function openWhatsApp() {
    const d1 = fmt(visit.preferredDate1);
    const d2 = visit.preferredDate2 ? ` o ${fmt(visit.preferredDate2)}` : "";
    const sched = scheduledDate ? fmt(scheduledDate) : "[DATA DA CONFERMARE]";
    const text = `Buongiorno ${customerName},\n\nle scriviamo riguardo alla richiesta di visita di controllo gratuita inclusa nel suo contratto di assistenza.\n\nHa indicato come date preferite: ${d1}${d2}.\n\nAbbiamo fissato la visita per il *${sched}*.\n\nPuò confermare rispondendo a questo messaggio? La ringraziamo.`;
    const phone = customerPhone ? customerPhone.replace(/\D/g, "") : "";
    const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${s.cls}`}>
            {s.label}
          </span>
          <span className="text-sm text-muted-foreground">
            Richiesta il {fmt(visit.createdAt)}
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Prima data preferita</p>
              <p className="font-medium">{fmt(visit.preferredDate1)}</p>
            </div>
            {visit.preferredDate2 && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Seconda data preferita</p>
                <p className="font-medium">{fmt(visit.preferredDate2)}</p>
              </div>
            )}
          </div>

          {visit.clientNotes && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Note del cliente</p>
              <p className="text-sm bg-slate-50 rounded p-2">{visit.clientNotes}</p>
            </div>
          )}

          {!isTerminal && (
            <>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Data programmata</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Note interne (opzionale)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <button
                type="button"
                onClick={openWhatsApp}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Apri in WhatsApp
              </button>

              <div className="flex gap-2 pt-1">
                {visit.status === "pending" && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={isPending}
                    onClick={() => handleAction("confirmed")}
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                    Conferma
                  </Button>
                )}
                {visit.status === "confirmed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    disabled={isPending}
                    onClick={() => handleAction("completed")}
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Segna completata
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                  disabled={isPending}
                  onClick={() => handleAction("cancelled")}
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Annulla
                </Button>
              </div>
            </>
          )}

          {isTerminal && visit.scheduledAt && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Data programmata</p>
              <p className="text-sm font-medium">{fmt(visit.scheduledAt)}</p>
            </div>
          )}

          {visit.adminNotes && isTerminal && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Note</p>
              <p className="text-sm">{visit.adminNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
