import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, customDeviceModels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { SettingsForm } from "./settings-form";
import { CustomModelsTable } from "./custom-models-table";
import { ChangePasswordForm } from "./change-password-form";
import { can } from "@/lib/permissions";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;
  const role = session.user.role;
  const isOwner = can.editOrgSettings(role);

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

  const customModels = isOwner
    ? await db
        .select()
        .from(customDeviceModels)
        .where(eq(customDeviceModels.organizationId, orgId))
        .orderBy(customDeviceModels.brand, customDeviceModels.model)
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Impostazioni</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isOwner
            ? "Dati del tuo centro di riparazione, branding e preferenze."
            : "Preferenze personali del tuo account."}
        </p>
      </div>

      {isOwner && (
        <>
          <SettingsForm org={org} />
          {customModels.length > 0 && <CustomModelsTable models={customModels} />}

          {/* Team management link */}
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Gestione team</p>
                <p className="text-xs text-muted-foreground">Visualizza e gestisci i membri del tuo centro</p>
              </div>
            </div>
            <Link
              href="/settings/team"
              className="text-sm font-medium text-primary hover:underline"
            >
              Vai al team →
            </Link>
          </div>
        </>
      )}

      <ChangePasswordForm />
    </div>
  );
}
