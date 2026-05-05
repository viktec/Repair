import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerContracts, customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterventionForm } from "./intervention-form";
import type { PackageSnapshot } from "@/lib/support-utils";

export default async function NewInterventionPage({
  searchParams,
}: {
  searchParams: Promise<{ contractId?: string }>;
}) {
  const { contractId: preselectedContractId } = await searchParams;

  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const rows = await db
    .select({
      id: customerContracts.id,
      contractNumber: customerContracts.contractNumber,
      totalMinutes: customerContracts.totalMinutes,
      usedMinutes: customerContracts.usedMinutes,
      status: customerContracts.status,
      packageSnapshot: customerContracts.packageSnapshot,
      customerName: customers.name,
    })
    .from(customerContracts)
    .innerJoin(customers, eq(customers.id, customerContracts.customerId))
    .where(
      and(
        eq(customerContracts.organizationId, orgId),
        // mostra anche exhausted così l'utente capisce perché non può selezionarli
      ),
    )
    .orderBy(customerContracts.createdAt);

  const contracts = rows.map((r) => ({
    id: r.id,
    contractNumber: r.contractNumber,
    customerName: r.customerName ?? "Cliente sconosciuto",
    totalMinutes: r.totalMinutes,
    usedMinutes: r.usedMinutes,
    status: r.status,
    packageSnapshot: (r.packageSnapshot as PackageSnapshot | null),
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={preselectedContractId ? `/support/contracts/${preselectedContractId}` : "/support/interventions"}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            {preselectedContractId ? "Contratto" : "Interventi"}
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nuovo intervento</h1>
          <p className="text-sm text-muted-foreground">Registra un intervento di assistenza</p>
        </div>
      </div>

      <InterventionForm
        contracts={contracts}
        preselectedContractId={preselectedContractId}
      />
    </div>
  );
}
