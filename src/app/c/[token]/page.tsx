import { db } from "@/lib/db";
import { customerContracts, customers, organizations, supportInterventions, contractCheckVisits } from "@/db/schema";
import { eq, desc, and, gte, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Wrench, Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { formatMinutes } from "@/lib/support-utils";
import { ClientPortalForm } from "./client-portal-form";
import { CheckVisitForm } from "./check-visit-form";

const TYPE_LABELS: Record<string, string> = {
  onsite: "In presenza",
  remote: "Teleassistenza",
  phone: "Telefonica",
  email: "Email",
  lab: "Laboratorio",
  other: "Altro",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "In attesa", color: "#f59e0b" },
  in_progress: { label: "In lavorazione", color: "#3b82f6" },
  completed: { label: "Completato", color: "#10b981" },
  cancelled: { label: "Annullato", color: "#6b7280" },
};

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [contract] = await db
    .select({
      id: customerContracts.id,
      contractNumber: customerContracts.contractNumber,
      totalMinutes: customerContracts.totalMinutes,
      usedMinutes: customerContracts.usedMinutes,
      status: customerContracts.status,
      endDate: customerContracts.endDate,
      organizationId: customerContracts.organizationId,
      customerName: customers.name,
      freeVisitsEnabled: customerContracts.freeVisitsEnabled,
      freeVisitsPerPeriod: customerContracts.freeVisitsPerPeriod,
      freeVisitPeriodMonths: customerContracts.freeVisitPeriodMonths,
    })
    .from(customerContracts)
    .leftJoin(customers, eq(customers.id, customerContracts.customerId))
    .where(eq(customerContracts.clientPortalToken, token))
    .limit(1);

  if (!contract) notFound();

  const [org] = await db
    .select({
      name: organizations.name,
      logoUrl: organizations.brandingLogoUrl,
      primaryColor: organizations.brandingPrimaryColor,
      phone: organizations.phone,
    })
    .from(organizations)
    .where(eq(organizations.id, contract.organizationId))
    .limit(1);

  const interventions = await db
    .select({
      id: supportInterventions.id,
      interventionNumber: supportInterventions.interventionNumber,
      title: supportInterventions.title,
      description: supportInterventions.description,
      type: supportInterventions.type,
      billableMinutes: supportInterventions.billableMinutes,
      technicianName: supportInterventions.technicianName,
      status: supportInterventions.status,
      createdAt: supportInterventions.createdAt,
    })
    .from(supportInterventions)
    .where(eq(supportInterventions.contractId, contract.id))
    .orderBy(desc(supportInterventions.createdAt));

  // Visite gratuite: calcola eligibilità
  let isVisitEligible = false;
  let nextEligibleDate: Date | null = null;
  let pendingVisit: { preferredDate1: Date; preferredDate2: Date | null } | null = null;

  if (contract.freeVisitsEnabled) {
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - contract.freeVisitPeriodMonths);

    const recentVisits = await db
      .select({
        id: contractCheckVisits.id,
        status: contractCheckVisits.status,
        preferredDate1: contractCheckVisits.preferredDate1,
        preferredDate2: contractCheckVisits.preferredDate2,
        createdAt: contractCheckVisits.createdAt,
      })
      .from(contractCheckVisits)
      .where(
        and(
          eq(contractCheckVisits.contractId, contract.id),
          gte(contractCheckVisits.createdAt, periodStart),
          ne(contractCheckVisits.status, "cancelled"),
        ),
      )
      .orderBy(desc(contractCheckVisits.createdAt));

    const usedThisPeriod = recentVisits.length;
    isVisitEligible = usedThisPeriod < contract.freeVisitsPerPeriod;

    const pending = recentVisits.find(v => v.status === "pending");
    if (pending) {
      pendingVisit = { preferredDate1: pending.preferredDate1, preferredDate2: pending.preferredDate2 };
    }

    if (!isVisitEligible && recentVisits.length > 0) {
      const oldest = recentVisits[recentVisits.length - 1];
      const next = new Date(oldest.createdAt);
      next.setMonth(next.getMonth() + contract.freeVisitPeriodMonths);
      nextEligibleDate = next;
    }
  }

  const primaryColor = org?.primaryColor ?? "#0D8F7A";
  const remaining = contract.totalMinutes - contract.usedMinutes;
  const pct =
    contract.totalMinutes > 0
      ? Math.max(0, Math.min(100, (remaining / contract.totalMinutes) * 100))
      : 0;

  // Badge contratto
  const contractBadge = (() => {
    if (contract.status === "exhausted")
      return { label: "Ore esaurite", bg: "#fee2e2", text: "#dc2626" };
    if (
      contract.status === "expired" ||
      new Date(contract.endDate) < new Date()
    )
      return { label: "Scaduto", bg: "#f3f4f6", text: "#6b7280" };
    return { label: "Attivo", bg: "#dcfce7", text: "#16a34a" };
  })();

  // Colore progress bar
  const barColor =
    pct > 50 ? "#10b981" : pct > 20 ? "#f59e0b" : "#ef4444";

  const isActive =
    contract.status === "active" && new Date(contract.endDate) >= new Date();

  const pendingInterventions = interventions.filter(
    (i) => i.status === "open" || i.status === "in_progress",
  );
  const completedInterventions = interventions.filter(
    (i) => i.status === "completed",
  );

  const clientLabel = contract.customerName || "Cliente";

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header
        className="flex h-14 items-center justify-between px-5 text-white shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2.5">
          {org?.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={org?.name ?? ""}
              className="h-7 w-auto object-contain"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
              <Wrench className="h-3.5 w-3.5" />
            </div>
          )}
          <span className="font-semibold">{org?.name ?? "Centro Assistenza"}</span>
        </div>
        <span className="text-xs opacity-70">Portale Assistenza</span>
      </header>

      <main className="mx-auto max-w-md space-y-3 p-4 pt-5">
        {/* Intestazione cliente */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-muted-foreground">Contratto {contract.contractNumber}</p>
          <h1 className="mt-1 text-lg font-bold text-foreground">{clientLabel}</h1>
        </div>

        {/* Box stato contratto */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          {/* Badge stato */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: contractBadge.bg, color: contractBadge.text }}
            >
              {contractBadge.label}
            </span>
            <span className="text-xs text-muted-foreground">
              Valido fino al {formatDate(contract.endDate)}
            </span>
          </div>

          {/* Ore rimaste — grande */}
          <div className="mb-1">
            <span
              className="text-3xl font-bold"
              style={{ color: barColor }}
            >
              {formatMinutes(Math.max(0, remaining))}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">rimaste</span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            su un totale di {formatMinutes(contract.totalMinutes)}
          </p>

          {/* Progress bar */}
          <div className="h-3 w-full rounded-full bg-slate-200">
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{formatMinutes(contract.usedMinutes)} usate</span>
            <span>{Math.round(pct)}%</span>
          </div>
        </div>

        {/* Richieste in corso */}
        {pendingInterventions.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Richieste in corso</p>
            <div className="space-y-3">
              {pendingInterventions.map((i) => {
                const s = STATUS_LABELS[i.status] ?? STATUS_LABELS.open;
                return (
                  <div
                    key={i.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {i.status === "in_progress" ? (
                          <Clock className="h-4 w-4 shrink-0" style={{ color: s.color }} />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0" style={{ color: s.color }} />
                        )}
                        <p className="text-sm font-medium text-foreground">{i.title}</p>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: s.color + "20", color: s.color }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i.description && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{i.description}</p>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Aperto il {formatDate(i.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form nuova richiesta */}
        {isActive && (
          <ClientPortalForm token={token} primaryColor={primaryColor} />
        )}

        {/* Visita di controllo gratuita */}
        {contract.freeVisitsEnabled && (
          <CheckVisitForm
            token={token}
            primaryColor={primaryColor}
            freeVisitsPerPeriod={contract.freeVisitsPerPeriod}
            freeVisitPeriodMonths={contract.freeVisitPeriodMonths}
            isEligible={isVisitEligible}
            nextEligibleDate={nextEligibleDate}
            pendingVisit={pendingVisit}
          />
        )}

        {/* Storico interventi completati */}
        {completedInterventions.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">Storico interventi</p>
            <div className="space-y-3">
              {completedInterventions.map((i) => (
                <div
                  key={i.id}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <p className="text-sm font-medium text-foreground">{i.title}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted-foreground">
                      {TYPE_LABELS[i.type] ?? i.type}
                    </span>
                  </div>
                  {i.description && (
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{i.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(i.createdAt)}</span>
                    <span className="font-medium">
                      {i.billableMinutes > 0 ? formatMinutes(i.billableMinutes) : "—"}
                      {i.technicianName ? ` · ${i.technicianName}` : ""}
                    </span>
                  </div>
                  <a
                    href={`/print/support/interventions/${i.id}?token=${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-muted-foreground hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="h-3 w-3" />
                    Verbale
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {interventions.length === 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm text-center">
            <p className="text-sm text-muted-foreground">Nessun intervento registrato.</p>
          </div>
        )}

        {/* Contatti */}
        {org?.phone && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-foreground">Contatti</p>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <a
                href={`tel:${org.phone}`}
                className="block font-medium"
                style={{ color: primaryColor }}
              >
                {org.phone}
              </a>
            </div>
          </div>
        )}

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Gestito con{" "}
          <a href="https://my-repair.it" className="underline">
            my-repair.it
          </a>
        </p>
      </main>
    </div>
  );
}
