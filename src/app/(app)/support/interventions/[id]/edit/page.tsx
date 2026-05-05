import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportInterventions, customerContracts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type PackageSnapshot } from "@/lib/support-utils";
import { InterventionEditForm } from "./intervention-edit-form";

export default async function EditInterventionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const role = session.user.role ?? "";
  if (!["admin", "owner"].includes(role)) redirect(`/support/interventions/${id}`);

  const orgId = session.user.organizationId;

  const [intervention] = await db
    .select()
    .from(supportInterventions)
    .where(and(eq(supportInterventions.id, id), eq(supportInterventions.organizationId, orgId)))
    .limit(1);

  if (!intervention) notFound();

  const [contract] = await db
    .select({
      totalMinutes: customerContracts.totalMinutes,
      usedMinutes: customerContracts.usedMinutes,
      packageSnapshot: customerContracts.packageSnapshot,
    })
    .from(customerContracts)
    .where(eq(customerContracts.id, intervention.contractId))
    .limit(1);

  const contractRemainingMinutes = contract
    ? contract.totalMinutes - contract.usedMinutes
    : 0;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/support/interventions/${id}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna all&apos;intervento
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Modifica intervento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          #{intervention.interventionNumber} — le ore scalate dal contratto vengono ricalcolate automaticamente.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <InterventionEditForm
          id={id}
          defaultValues={{
            title: intervention.title,
            description: intervention.description,
            notes: intervention.notes,
            type: intervention.type,
            isUrgent: intervention.isUrgent,
            rawMinutes: intervention.rawMinutes,
            startTime: intervention.startTime,
          }}
          packageSnapshot={contract?.packageSnapshot as PackageSnapshot | null}
          contractRemainingMinutes={contractRemainingMinutes}
          currentBillableMinutes={intervention.billableMinutes}
        />
      </div>
    </div>
  );
}
