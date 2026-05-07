import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SelfServiceForm } from "./self-service-form";
import { PeriziaPublicShell } from "@/components/perizia-public-shell";

export default async function SelfServiceAppraisalPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;

  const [org] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      brandingLogoUrl: organizations.brandingLogoUrl,
      brandingPrimaryColor: organizations.brandingPrimaryColor,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) notFound();

  const primaryColor = org.brandingPrimaryColor ?? "#0D8F7A";

  return (
    <PeriziaPublicShell
      orgName={org.name}
      logoUrl={org.brandingLogoUrl ?? null}
      primaryColor={primaryColor}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Richiedi una valutazione</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inserisci i dati del dispositivo e i tuoi contatti. Riceverai un&apos;offerta indicativa entro poche ore.
          </p>
        </div>

        <SelfServiceForm orgId={orgId} primaryColor={primaryColor} />
      </div>
    </PeriziaPublicShell>
  );
}
