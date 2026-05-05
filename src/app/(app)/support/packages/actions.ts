"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportPackages, customerContracts } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasMinRole } from "@/lib/permissions";

const packageSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  totalMinutes: z.coerce.number().min(1, "Le ore devono essere almeno 1"),
  priceCents: z.coerce.number().min(0),
  urgencySurchargePercent: z.coerce.number().min(0).max(100),
  priorityLevel: z.coerce.number().min(1).max(4),
  phoneRoundingMinutes: z.coerce.number().min(0),
  remoteRoundingMinutes: z.coerce.number().min(0),
  emailRoundingMinutes: z.coerce.number().min(0),
  callFeeMinutes: z.coerce.number().min(0),
  description: z.string().optional(),
});

type PackageState = {
  errors?: Record<string, string[]>;
  error?: string;
} | null;

export async function createPackageAction(
  _prev: PackageState,
  formData: FormData,
): Promise<PackageState> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!hasMinRole(session.user.role, "admin")) return { error: "Non autorizzato" };

  const raw = Object.fromEntries(formData);
  const parsed = packageSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { name, totalMinutes, priceCents, urgencySurchargePercent, priorityLevel,
    phoneRoundingMinutes, remoteRoundingMinutes, emailRoundingMinutes, callFeeMinutes, description } = parsed.data;

  await db.insert(supportPackages).values({
    organizationId: session.user.organizationId,
    name,
    totalMinutes,
    priceCents,
    urgencySurchargePercent,
    priorityLevel,
    phoneRoundingMinutes,
    remoteRoundingMinutes,
    emailRoundingMinutes,
    callFeeMinutes,
    description: description || null,
    isActive: true,
  });

  revalidatePath("/support/packages");
  redirect("/support/packages");
}

export async function updatePackageAction(
  id: string,
  _prev: PackageState,
  formData: FormData,
): Promise<PackageState> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!hasMinRole(session.user.role, "admin")) return { error: "Non autorizzato" };

  const raw = Object.fromEntries(formData);
  const parsed = packageSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { name, totalMinutes, priceCents, urgencySurchargePercent, priorityLevel,
    phoneRoundingMinutes, remoteRoundingMinutes, emailRoundingMinutes, callFeeMinutes, description } = parsed.data;

  await db
    .update(supportPackages)
    .set({
      name,
      totalMinutes,
      priceCents,
      urgencySurchargePercent,
      priorityLevel,
      phoneRoundingMinutes,
      remoteRoundingMinutes,
      emailRoundingMinutes,
      callFeeMinutes,
      description: description || null,
    })
    .where(and(eq(supportPackages.id, id), eq(supportPackages.organizationId, session.user.organizationId)));

  revalidatePath("/support/packages");
  redirect("/support/packages");
}

export async function togglePackageActiveAction(id: string, isActive: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!hasMinRole(session.user.role, "admin")) return;

  await db
    .update(supportPackages)
    .set({ isActive })
    .where(and(eq(supportPackages.id, id), eq(supportPackages.organizationId, session.user.organizationId)));

  revalidatePath("/support/packages");
}

export async function deletePackageAction(id: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!hasMinRole(session.user.role, "admin")) return { error: "Non autorizzato" };

  const [{ activeContracts }] = await db
    .select({ activeContracts: count(customerContracts.id) })
    .from(customerContracts)
    .where(
      and(
        eq(customerContracts.packageId, id),
        eq(customerContracts.organizationId, session.user.organizationId),
        eq(customerContracts.status, "active"),
      ),
    );

  if (activeContracts > 0) {
    return { error: "Impossibile eliminare: ci sono contratti attivi che usano questo pacchetto." };
  }

  await db
    .delete(supportPackages)
    .where(and(eq(supportPackages.id, id), eq(supportPackages.organizationId, session.user.organizationId)));

  revalidatePath("/support/packages");
  return {};
}

export async function seedDefaultPackagesAction(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!hasMinRole(session.user.role, "admin")) return { error: "Non autorizzato" };

  const orgId = session.user.organizationId;

  const existing = await db
    .select({ id: supportPackages.id })
    .from(supportPackages)
    .where(eq(supportPackages.organizationId, orgId))
    .limit(1);

  if (existing.length > 0) {
    return { error: "Esistono già pacchetti per questa organizzazione." };
  }

  await db.insert(supportPackages).values([
    {
      organizationId: orgId,
      name: "BASIC",
      totalMinutes: 600,
      priceCents: 59900,
      urgencySurchargePercent: 25,
      priorityLevel: 4,
      phoneRoundingMinutes: 5,
      remoteRoundingMinutes: 10,
      emailRoundingMinutes: 10,
      callFeeMinutes: 10,
      deliveryFeeMinutes: 0,
      isActive: true,
    },
    {
      organizationId: orgId,
      name: "BRONZE",
      totalMinutes: 1500,
      priceCents: 99900,
      urgencySurchargePercent: 20,
      priorityLevel: 3,
      phoneRoundingMinutes: 5,
      remoteRoundingMinutes: 10,
      emailRoundingMinutes: 10,
      callFeeMinutes: 10,
      deliveryFeeMinutes: 0,
      isActive: true,
    },
    {
      organizationId: orgId,
      name: "SILVER",
      totalMinutes: 2700,
      priceCents: 149900,
      urgencySurchargePercent: 15,
      priorityLevel: 2,
      phoneRoundingMinutes: 5,
      remoteRoundingMinutes: 10,
      emailRoundingMinutes: 10,
      callFeeMinutes: 10,
      deliveryFeeMinutes: 0,
      isActive: true,
    },
    {
      organizationId: orgId,
      name: "GOLD",
      totalMinutes: 3900,
      priceCents: 199900,
      urgencySurchargePercent: 10,
      priorityLevel: 1,
      phoneRoundingMinutes: 5,
      remoteRoundingMinutes: 10,
      emailRoundingMinutes: 10,
      callFeeMinutes: 10,
      deliveryFeeMinutes: 0,
      isActive: true,
    },
  ]);

  revalidatePath("/support/packages");
  return {};
}
