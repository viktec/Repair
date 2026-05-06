import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, customDeviceModels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, CreditCard, CheckCircle, Tag, ShieldCheck, Activity } from "lucide-react";
import { SettingsForm } from "./settings-form";
import { CustomModelsTable } from "./custom-models-table";
import { ChangePasswordForm } from "./change-password-form";
import { can } from "@/lib/permissions";
import { BillingCard } from "./billing-card";
import { PushNotificationsCard } from "./push-notifications";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;
  const role = session.user.role;
  const isOwner = can.editOrgSettings(role);
  const canManageTags = can.delete(role);

  const { checkout } = await searchParams;

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
      googleReviewUrl: organizations.googleReviewUrl,
      termsAndConditions: organizations.termsAndConditions,
      vatRate: organizations.vatRate,
      telegramBotToken: organizations.telegramBotToken,
      telegramChatId: organizations.telegramChatId,
      plan: organizations.plan,
      subscriptionStatus: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt,
      stripeCustomerId: organizations.stripeCustomerId,
      stripeSubscriptionId: organizations.stripeSubscriptionId,
      stripeCancelAtPeriodEnd: organizations.stripeCancelAtPeriodEnd,
      stripeCurrentPeriodEnd: organizations.stripeCurrentPeriodEnd,
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

      {/* Checkout success banner */}
      {checkout === "success" && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
          <span>Pagamento confermato! Il tuo piano è ora attivo. Benvenuto!</span>
        </div>
      )}

      {isOwner && (
        <>
          <SettingsForm org={org} />
          {customModels.length > 0 && <CustomModelsTable models={customModels} />}

          {/* Billing card */}
          <BillingCard
            plan={org.plan}
            subscriptionStatus={org.subscriptionStatus}
            trialEndsAt={org.trialEndsAt ? org.trialEndsAt.toISOString() : null}
            hasStripeCustomer={!!org.stripeCustomerId}
            hasStripeSubscription={!!org.stripeSubscriptionId}
            cancelAtPeriodEnd={org.stripeCancelAtPeriodEnd}
            currentPeriodEnd={org.stripeCurrentPeriodEnd ? org.stripeCurrentPeriodEnd.toISOString() : null}
          />

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
            <Link href="/settings/team" className="text-sm font-medium text-primary hover:underline">
              Vai al team →
            </Link>
          </div>

          {/* Permissions link */}
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Permessi per ruolo</p>
                <p className="text-xs text-muted-foreground">Configura quali sezioni sono visibili per tecnici e reception</p>
              </div>
            </div>
            <Link href="/settings/permissions" className="text-sm font-medium text-primary hover:underline">
              Configura →
            </Link>
          </div>

          {/* Activity log link */}
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Log attività</p>
                <p className="text-xs text-muted-foreground">Monitora le azioni recenti del tuo team</p>
              </div>
            </div>
            <Link href="/settings/activity" className="text-sm font-medium text-primary hover:underline">
              Visualizza →
            </Link>
          </div>
        </>
      )}

      {/* Tags management link — visible to admin+ */}
      {canManageTags && (
        <div className="rounded-lg border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Etichette ticket</p>
              <p className="text-xs text-muted-foreground">Crea e gestisci le etichette per categorizzare i ticket</p>
            </div>
          </div>
          <Link
            href="/settings/tags"
            className="text-sm font-medium text-primary hover:underline"
          >
            Gestisci →
          </Link>
        </div>
      )}

      <ChangePasswordForm />
      <PushNotificationsCard />
    </div>
  );
}
