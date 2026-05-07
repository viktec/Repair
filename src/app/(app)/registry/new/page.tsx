import { requirePlan } from "@/lib/require-plan";
import { db } from "@/lib/db";
import { deviceAppraisals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegistryForm } from "./registry-form";

export type RegistryDefaults = {
  description: string;
  imeiOrSerial: string;
  purchasePriceCents: string;
  counterpartyName: string;
  appraisalId: string;
};

export default async function NewRegistryEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ perizia?: string }>;
}) {
  const { perizia: appraisalId } = await searchParams;
  const session = await requirePlan("business");
  if (!can.accessRegistry(session.user.role)) redirect("/dashboard");
  const orgId = session.user.organizationId!;

  let defaults: RegistryDefaults | null = null;

  if (appraisalId) {
    const [appraisal] = await db
      .select({
        id: deviceAppraisals.id,
        brand: deviceAppraisals.brand,
        model: deviceAppraisals.model,
        storageGb: deviceAppraisals.storageGb,
        color: deviceAppraisals.color,
        imei: deviceAppraisals.imei,
        serialNumber: deviceAppraisals.serialNumber,
        customerName: deviceAppraisals.customerName,
        finalValuationCents: deviceAppraisals.finalValuationCents,
        tradeInBonusCents: deviceAppraisals.tradeInBonusCents,
        status: deviceAppraisals.status,
        registryEntryId: deviceAppraisals.registryEntryId,
      })
      .from(deviceAppraisals)
      .where(and(eq(deviceAppraisals.id, appraisalId), eq(deviceAppraisals.organizationId, orgId)))
      .limit(1);

    if (appraisal && appraisal.status === "approved" && !appraisal.registryEntryId) {
      const description = [appraisal.brand, appraisal.model, appraisal.storageGb, appraisal.color]
        .filter(Boolean)
        .join(" ");
      const imeiOrSerial = appraisal.imei ?? appraisal.serialNumber ?? "";
      const totalCents = (appraisal.finalValuationCents ?? 0) + appraisal.tradeInBonusCents;
      defaults = {
        description,
        imeiOrSerial,
        purchasePriceCents: totalCents > 0 ? (totalCents / 100).toFixed(2) : "",
        counterpartyName: appraisal.customerName ?? "",
        appraisalId: appraisal.id,
      };
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={defaults ? `/registry/perizie/${defaults.appraisalId}` : "/registry"}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            {defaults ? "Perizia" : "Registro"}
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Nuova registrazione usato</h1>
      </div>

      {defaults && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          Dati pre-compilati dalla perizia approvata — aggiungi solo il documento d&apos;identità.
        </div>
      )}

      <div className="rounded-md border bg-amber-50 border-amber-200 px-4 py-3 text-sm text-amber-800">
        Verificare attentamente i dati prima di salvare. La registrazione non può essere modificata o eliminata.
      </div>

      <RegistryForm defaults={defaults} />
    </div>
  );
}
