import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  supportInterventions,
  customerContracts,
  customers,
  organizations,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, User, AlertTriangle, Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { formatMinutes, calcBillableBreakdown, type PackageSnapshot } from "@/lib/support-utils";
import { getPresignedDownloadUrl } from "@/lib/storage";
import { InterventionMessage } from "./intervention-message";
import { StatusButton } from "./status-button";
import { DeleteInterventionButton } from "./delete-button";
import { can } from "@/lib/permissions";

const TYPE_LABELS: Record<string, string> = {
  onsite: "In sede",
  remote: "Remoto",
  phone: "Telefonico",
  email: "Email",
  lab: "Laboratorio",
  other: "Altro",
};

function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function InterventionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [intervention] = await db
    .select({
      id: supportInterventions.id,
      contractId: supportInterventions.contractId,
      interventionNumber: supportInterventions.interventionNumber,
      title: supportInterventions.title,
      description: supportInterventions.description,
      type: supportInterventions.type,
      isUrgent: supportInterventions.isUrgent,
      applyCallFee: supportInterventions.applyCallFee,
      rawMinutes: supportInterventions.rawMinutes,
      billableMinutes: supportInterventions.billableMinutes,
      technicianName: supportInterventions.technicianName,
      status: supportInterventions.status,
      startTime: supportInterventions.startTime,
      openedBy: supportInterventions.openedBy,
      notes: supportInterventions.notes,
      location: supportInterventions.location,
      clientSignatureToken: supportInterventions.clientSignatureToken,
      clientSignedAt: supportInterventions.clientSignedAt,
      createdAt: supportInterventions.createdAt,
    })
    .from(supportInterventions)
    .where(and(eq(supportInterventions.id, id), eq(supportInterventions.organizationId, orgId)))
    .limit(1);

  if (!intervention) notFound();

  const [contract] = await db
    .select({
      id: customerContracts.id,
      contractNumber: customerContracts.contractNumber,
      totalMinutes: customerContracts.totalMinutes,
      usedMinutes: customerContracts.usedMinutes,
      endDate: customerContracts.endDate,
      clientPortalToken: customerContracts.clientPortalToken,
      customerId: customerContracts.customerId,
      packageId: customerContracts.packageId,
      packageSnapshot: customerContracts.packageSnapshot,
    })
    .from(customerContracts)
    .where(eq(customerContracts.id, intervention.contractId))
    .limit(1);

  if (!contract) notFound();

  const [customer] = await db
    .select({ id: customers.id, name: customers.name, phone: customers.phone, email: customers.email })
    .from(customers)
    .where(eq(customers.id, contract.customerId))
    .limit(1);

  const [org] = await db
    .select({ name: organizations.name, phone: organizations.phone })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const snap = (contract.packageSnapshot as PackageSnapshot | null) ?? {
    phoneRoundingMinutes: 5,
    remoteRoundingMinutes: 10,
    emailRoundingMinutes: 10,
    callFeeMinutes: 10,
    urgencySurchargePercent: 0,
  };
  const breakdown = calcBillableBreakdown(
    intervention.rawMinutes,
    intervention.type,
    snap,
    intervention.isUrgent,
    intervention.applyCallFee,
  );

  const appUrl = process.env.APP_URL ?? "https://app.my-repair.it";
  const portalUrl = `${appUrl}/c/${contract.clientPortalToken}`;
  const verbaleUrl = `/print/support/interventions/${id}`;
  const signUrl = intervention.clientSignatureToken
    ? `${appUrl}/sign/interventions/${intervention.clientSignatureToken}`
    : null;

  const interventionDate = intervention.startTime ?? intervention.createdAt;
  const dateFormatted = formatDateTime(interventionDate);

  const remaining = Math.max(0, contract.totalMinutes - contract.usedMinutes);
  const customerLabel = customer?.name ?? "Cliente";

  const descSnippet = intervention.description
    ? intervention.description.length > 100
      ? intervention.description.substring(0, 100) + "..."
      : intervention.description
    : intervention.title;

  const billableFormatted = formatMinutes(intervention.billableMinutes);
  const remainingFormatted = formatMinutes(remaining);
  const totalFormatted = formatMinutes(contract.totalMinutes);
  const endDateFormatted = formatDate(contract.endDate);

  const whatsappText = `Gentile ${customerLabel},
con la presente confermiamo l'intervento effettuato in data ${dateFormatted}:

📋 ${intervention.title}
${descSnippet}

⏱ Ore scalate: ${billableFormatted}
📊 Monte ore residuo: ${remainingFormatted} su ${totalFormatted}
📅 Contratto valido fino al: ${endDateFormatted}

Per il dettaglio completo: ${portalUrl}

${org?.name ?? ""}
${org?.phone ?? ""}`.trim();

  const emailText = `Gentile ${customerLabel},

con la presente confermiamo l'intervento effettuato in data ${dateFormatted}.

Titolo: ${intervention.title}
${intervention.description ? `Descrizione: ${descSnippet}\n` : ""}
Ore scalate: ${billableFormatted}
Monte ore residuo: ${remainingFormatted} su ${totalFormatted}
Contratto valido fino al: ${endDateFormatted}

Per il dettaglio completo e lo storico degli interventi, visiti il portale cliente:
${portalUrl}

Cordiali saluti,
${org?.name ?? ""}
${org?.phone ?? ""}`.trim();

  const canEdit = true; // accesso controllato server-side nell'action

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href={`/support/contracts/${intervention.contractId}`}>
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0 mt-0.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Contratto
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold truncate">{intervention.title}</h1>
          <p className="text-sm text-muted-foreground font-mono">{intervention.interventionNumber}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={verbaleUrl} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Verbale PDF
            </Button>
          </Link>
          {canEdit && (
            <Link href={`/support/interventions/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Modifica
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Dettagli</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{dateFormatted}</span>
              </div>
              {intervention.technicianName && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span>{intervention.technicianName}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className="text-xs">{TYPE_LABELS[intervention.type] ?? intervention.type}</Badge>
                {intervention.isUrgent && (
                  <Badge variant="outline" className="text-xs text-red-600 border-red-300 bg-red-50 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Urgente
                  </Badge>
                )}
              </div>
              <div className="border-t pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tempo effettivo</span>
                  <span className="font-medium">{formatMinutes(breakdown.raw)}</span>
                </div>
                {breakdown.roundingStep > 0 && breakdown.rounded !== breakdown.raw && (
                  <div className="flex justify-between text-amber-700">
                    <span>Arrotondamento (ogni {breakdown.roundingStep} min)</span>
                    <span>→ {formatMinutes(breakdown.rounded)}</span>
                  </div>
                )}
                {breakdown.callFee > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Dir. chiamata/connessione</span>
                    <span>+{formatMinutes(breakdown.callFee)}</span>
                  </div>
                )}
                {breakdown.urgencyAdd > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Maggiorazione urgenza ({snap.urgencySurchargePercent}%)</span>
                    <span>+{formatMinutes(breakdown.urgencyAdd)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1.5 mt-0.5">
                  <span className="text-muted-foreground font-semibold">Totale scalato</span>
                  <span className="font-bold text-primary text-sm">{billableFormatted}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Contratto</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Numero</span>
                <span className="font-mono font-medium">{contract.contractNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scadenza</span>
                <span>{endDateFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ore residue</span>
                <span className="font-medium">{remainingFormatted}</span>
              </div>
              <Link href={`/support/contracts/${contract.id}`} className="block mt-2">
                <Button variant="outline" size="sm" className="w-full text-xs">Vai al contratto →</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {intervention.description && (
            <Card>
              <CardHeader><CardTitle className="text-base">Descrizione</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{intervention.description}</p>
              </CardContent>
            </Card>
          )}

          {intervention.notes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Note interne</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{intervention.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Messaggio per il cliente</CardTitle>
                {intervention.clientSignedAt && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Firmato digitalmente
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <InterventionMessage
                whatsappText={whatsappText}
                emailText={emailText}
                verbaleUrl={verbaleUrl}
                whatsappPhone={customer?.phone ?? null}
                signUrl={signUrl}
                clientSignedAt={intervention.clientSignedAt}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
