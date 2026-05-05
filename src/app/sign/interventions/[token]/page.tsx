import { db } from "@/lib/db";
import { supportInterventions, customerContracts, customers, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Wrench } from "lucide-react";
import { SignaturePad } from "./signature-pad";

function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(date));
}

export default async function SignInterventionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [intervention] = await db
    .select({
      id: supportInterventions.id,
      organizationId: supportInterventions.organizationId,
      contractId: supportInterventions.contractId,
      interventionNumber: supportInterventions.interventionNumber,
      title: supportInterventions.title,
      description: supportInterventions.description,
      technicianName: supportInterventions.technicianName,
      startTime: supportInterventions.startTime,
      endTime: supportInterventions.endTime,
      rawMinutes: supportInterventions.rawMinutes,
      billableMinutes: supportInterventions.billableMinutes,
      location: supportInterventions.location,
      clientSignedAt: supportInterventions.clientSignedAt,
      status: supportInterventions.status,
    })
    .from(supportInterventions)
    .where(eq(supportInterventions.clientSignatureToken, token))
    .limit(1);

  if (!intervention) notFound();

  const [contract] = await db
    .select({ customerId: customerContracts.customerId, contractNumber: customerContracts.contractNumber })
    .from(customerContracts)
    .where(eq(customerContracts.id, intervention.contractId))
    .limit(1);

  const [customer] = contract
    ? await db
        .select({ name: customers.name })
        .from(customers)
        .where(eq(customers.id, contract.customerId))
        .limit(1)
    : [null];

  const [org] = await db
    .select({ name: organizations.name, logoUrl: organizations.brandingLogoUrl, primaryColor: organizations.brandingPrimaryColor })
    .from(organizations)
    .where(eq(organizations.id, intervention.organizationId))
    .limit(1);

  const primaryColor = org?.primaryColor ?? "#0D8F7A";
  const alreadySigned = !!intervention.clientSignedAt;

  const interventionDate = intervention.startTime ?? null;
  const endTime = intervention.endTime ??
    (intervention.startTime
      ? new Date(new Date(intervention.startTime).getTime() + intervention.rawMinutes * 60 * 1000)
      : null);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex h-14 items-center gap-2.5 px-5 text-white shadow-sm" style={{ backgroundColor: primaryColor }}>
        {org?.logoUrl ? (
          <img src={org.logoUrl} alt="" className="h-7 w-auto object-contain" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
            <Wrench className="h-3.5 w-3.5" />
          </div>
        )}
        <span className="font-semibold">{org?.name ?? "Centro Assistenza"}</span>
      </header>

      <main className="mx-auto max-w-md space-y-3 p-4 pt-5">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs text-muted-foreground">Verbale intervento</p>
          <h1 className="mt-1 text-lg font-bold">{intervention.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{intervention.interventionNumber}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3 text-sm">
          {customer?.name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-medium">{customer.name}</span>
            </div>
          )}
          {intervention.technicianName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tecnico</span>
              <span className="font-medium">{intervention.technicianName}</span>
            </div>
          )}
          {intervention.location && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Luogo</span>
              <span className="font-medium">{intervention.location}</span>
            </div>
          )}
          {interventionDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inizio</span>
              <span className="font-medium">{formatDateTime(interventionDate)}</span>
            </div>
          )}
          {endTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fine</span>
              <span className="font-medium">{formatDateTime(endTime)}</span>
            </div>
          )}
          {intervention.description && (
            <div>
              <p className="text-muted-foreground mb-1">Descrizione</p>
              <p className="text-sm bg-slate-50 rounded p-2 whitespace-pre-wrap">{intervention.description}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          {alreadySigned ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-base font-semibold text-emerald-700">Verbale già firmato</p>
              <p className="text-xs text-muted-foreground">
                Firmato il {formatDateTime(intervention.clientSignedAt)}
              </p>
            </div>
          ) : (
            <SignaturePad
              token={token}
              interventionNumber={intervention.interventionNumber}
              title={intervention.title}
              primaryColor={primaryColor}
            />
          )}
        </div>
      </main>
    </div>
  );
}
