import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerContracts, customers, supportPackages, supportInterventions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/lib/support-utils";
import { formatDate } from "@/lib/utils";
import { hasMinRole } from "@/lib/permissions";
import { ContractActions } from "./contract-actions";
import { CopyLinkButton } from "./copy-link-button";

const STATUS_LABELS: Record<string, string> = {
  active: "Attivo",
  expired: "Scaduto",
  exhausted: "Esaurito",
  suspended: "Sospeso",
};

const STATUS_STYLES: Record<string, string> = {
  active: "text-emerald-700 border-emerald-300 bg-emerald-50",
  expired: "text-slate-600 border-slate-300 bg-slate-50",
  exhausted: "text-red-700 border-red-300 bg-red-50",
  suspended: "text-amber-700 border-amber-300 bg-amber-50",
};

const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  onsite: "In sede",
  remote: "Remoto",
  phone: "Telefono",
  email: "Email",
  lab: "Laboratorio",
  other: "Altro",
};

const INTERVENTION_STATUS_LABELS: Record<string, string> = {
  open: "Aperto",
  in_progress: "In corso",
  completed: "Completato",
  cancelled: "Annullato",
};

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;
  const isAdmin = hasMinRole(session.user.role, "admin");

  const [contract] = await db
    .select({
      id: customerContracts.id,
      contractNumber: customerContracts.contractNumber,
      status: customerContracts.status,
      totalMinutes: customerContracts.totalMinutes,
      usedMinutes: customerContracts.usedMinutes,
      startDate: customerContracts.startDate,
      endDate: customerContracts.endDate,
      clientPortalToken: customerContracts.clientPortalToken,
      notes: customerContracts.notes,
      customerName: customers.name,
      packageName: supportPackages.name,
    })
    .from(customerContracts)
    .innerJoin(customers, eq(customers.id, customerContracts.customerId))
    .leftJoin(supportPackages, eq(supportPackages.id, customerContracts.packageId))
    .where(and(eq(customerContracts.id, id), eq(customerContracts.organizationId, orgId)))
    .limit(1);

  if (!contract) notFound();

  const interventions = await db
    .select({
      id: supportInterventions.id,
      interventionNumber: supportInterventions.interventionNumber,
      title: supportInterventions.title,
      type: supportInterventions.type,
      status: supportInterventions.status,
      billableMinutes: supportInterventions.billableMinutes,
      technicianName: supportInterventions.technicianName,
      createdAt: supportInterventions.createdAt,
    })
    .from(supportInterventions)
    .where(and(eq(supportInterventions.contractId, id), eq(supportInterventions.organizationId, orgId)))
    .orderBy(desc(supportInterventions.createdAt))
    .limit(10);

  const remaining = contract.totalMinutes - contract.usedMinutes;
  const pct = contract.totalMinutes > 0 ? Math.max(0, (remaining / contract.totalMinutes) * 100) : 0;
  const now = new Date();
  const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/c/${contract.clientPortalToken}`;

  const barColor = pct < 10 ? "bg-red-500" : pct < 25 ? "bg-amber-400" : "bg-primary";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/support/contracts">
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
              <ArrowLeft className="h-3.5 w-3.5" />
              Contratti
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{contract.customerName}</h1>
              <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_STYLES[contract.status] ?? ""}`}>
                {STATUS_LABELS[contract.status] ?? contract.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {contract.contractNumber} · {contract.packageName ?? "Pacchetto non disponibile"}
            </p>
          </div>
        </div>
        {isAdmin && (
          <ContractActions
            id={id}
            status={contract.status}
            currentNotes={contract.notes ?? ""}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4">
          {/* Ore counter */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ore residue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{formatMinutes(remaining)}</p>
              <p className="text-sm text-muted-foreground mt-1">di {formatMinutes(contract.totalMinutes)} totali</p>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Utilizzate: {formatMinutes(contract.usedMinutes)}
              </p>
            </CardContent>
          </Card>

          {/* Scadenza */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scadenza</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatDate(contract.endDate)}</p>
              <p className={`text-sm mt-0.5 ${daysLeft <= 7 ? "text-red-600 font-medium" : daysLeft <= 30 ? "text-amber-600" : "text-muted-foreground"}`}>
                {daysLeft > 0 ? `${daysLeft} giorni rimanenti` : "Scaduto"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Inizio: {formatDate(contract.startDate)}</p>
            </CardContent>
          </Card>

          {/* Portale cliente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Portale cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono break-all">/c/{contract.clientPortalToken}</p>
              <div className="flex gap-2">
                <CopyLinkButton url={portalUrl} />
                <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Apri
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          {contract.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — interventi */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Ultimi interventi</h2>
            <Link href={`/support/interventions/new?contractId=${id}`}>
              <Button size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                Nuovo intervento
              </Button>
            </Link>
          </div>

          {interventions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-10 text-center">
                <p className="text-sm text-muted-foreground">Nessun intervento registrato</p>
                <Link href={`/support/interventions/new?contractId=${id}`} className="mt-3">
                  <Button variant="outline" size="sm">Registra il primo intervento</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Titolo</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Tecnico</th>
                        <th className="px-4 py-3 text-right">Min. scalati</th>
                        <th className="px-4 py-3">Stato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interventions.map((iv) => (
                        <tr key={iv.id} className="border-b last:border-0 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(iv.createdAt)}</td>
                          <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">{iv.title}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{INTERVENTION_TYPE_LABELS[iv.type] ?? iv.type}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{iv.technicianName ?? "—"}</td>
                          <td className="px-4 py-3 text-right font-medium">{iv.billableMinutes}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              iv.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                              iv.status === "open" ? "bg-amber-50 text-amber-700" :
                              iv.status === "in_progress" ? "bg-blue-50 text-blue-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {INTERVENTION_STATUS_LABELS[iv.status] ?? iv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
