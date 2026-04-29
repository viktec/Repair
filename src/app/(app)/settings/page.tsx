import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, customDeviceModels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";
import { CustomModelsTable } from "./custom-models-table";
import { ChangePasswordForm } from "./change-password-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [org] = await db
    .select({
      name: organizations.name,
      phone: organizations.phone,
      whatsappPhone: organizations.whatsappPhone,
      address: organizations.address,
      city: organizations.city,
      postalCode: organizations.postalCode,
      vatNumber: organizations.vatNumber,
      brandingPrimaryColor: organizations.brandingPrimaryColor,
      brandingLogoUrl: organizations.brandingLogoUrl,
      whatsappTemplate: organizations.whatsappTemplate,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) redirect("/login");

  const customModels = await db
    .select()
    .from(customDeviceModels)
    .where(eq(customDeviceModels.organizationId, orgId))
    .orderBy(customDeviceModels.brand, customDeviceModels.model);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Impostazioni</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dati del tuo centro di riparazione, branding e preferenze.
        </p>
      </div>

      <SettingsForm org={org} />

      {customModels.length > 0 && (
        <CustomModelsTable models={customModels} />
      )}

      <ChangePasswordForm />
    </div>
  );
}
