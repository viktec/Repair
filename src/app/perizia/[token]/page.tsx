import { db } from "@/lib/db";
import { deviceAppraisals, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SurveyForm } from "./survey-form";
import { PeriziaPublicShell } from "@/components/perizia-public-shell";

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [row] = await db
    .select({
      id: deviceAppraisals.id,
      brand: deviceAppraisals.brand,
      model: deviceAppraisals.model,
      storageGb: deviceAppraisals.storageGb,
      color: deviceAppraisals.color,
      imei: deviceAppraisals.imei,
      status: deviceAppraisals.status,
      surveyCompletedAt: deviceAppraisals.surveyCompletedAt,
      orgName: organizations.name,
      orgLogoUrl: organizations.brandingLogoUrl,
      orgColor: organizations.brandingPrimaryColor,
    })
    .from(deviceAppraisals)
    .leftJoin(organizations, eq(organizations.id, deviceAppraisals.organizationId))
    .where(eq(deviceAppraisals.surveyToken, token))
    .limit(1);

  if (!row) notFound();

  const alreadyCompleted = row.surveyCompletedAt != null;
  const primaryColor = row.orgColor ?? "#0D8F7A";

  return (
    <PeriziaPublicShell
      orgName={row.orgName ?? "Centro Riparazioni"}
      logoUrl={row.orgLogoUrl ?? null}
      primaryColor={primaryColor}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Questionario dispositivo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rispondi alle domande per ricevere una valutazione del tuo dispositivo. Ci vorranno circa 2 minuti.
          </p>
        </div>

        <SurveyForm
          token={token}
          brand={row.brand}
          model={row.model}
          storageGb={row.storageGb}
          color={row.color}
          imei={row.imei}
          alreadyCompleted={alreadyCompleted}
          primaryColor={primaryColor}
        />
      </div>
    </PeriziaPublicShell>
  );
}
