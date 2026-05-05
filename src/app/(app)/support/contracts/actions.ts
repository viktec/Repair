"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerContracts, supportPackages } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasMinRole } from "@/lib/permissions";
import { randomUUID } from "crypto";

const contractSchema = z.object({
  customerId: z.string().min(1, "Seleziona un cliente"),
  packageId: z.string().min(1, "Seleziona un pacchetto"),
  startDate: z.string().min(1, "La data di inizio è obbligatoria"),
  endDate: z.string().min(1, "La data di fine è obbligatoria"),
  freeVisitsEnabled: z.string().optional().transform(v => v === "on"),
  freeVisitsPerPeriod: z.coerce.number().int().min(1).max(12).optional().default(1),
  freeVisitPeriodMonths: z.coerce.number().int().min(1).max(12).optional().default(6),
  notes: z.string().optional(),
});

type ContractState = {
  errors?: Record<string, string[]>;
  error?: string;
} | null;

export async function createContractAction(
  _prev: ContractState,
  formData: FormData,
): Promise<ContractState> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!hasMinRole(session.user.role, "admin")) return { error: "Non autorizzato" };

  const orgId = session.user.organizationId;
  const raw = Object.fromEntries(formData);
  const parsed = contractSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { customerId, packageId, startDate, endDate, notes, freeVisitsEnabled, freeVisitsPerPeriod, freeVisitPeriodMonths } = parsed.data;

  const [pkg] = await db
    .select()
    .from(supportPackages)
    .where(and(eq(supportPackages.id, packageId), eq(supportPackages.organizationId, orgId)))
    .limit(1);

  if (!pkg) return { error: "Pacchetto non trovato" };

  const [{ total }] = await db
    .select({ total: count(customerContracts.id) })
    .from(customerContracts)
    .where(eq(customerContracts.organizationId, orgId));

  const contractNumber = `C-${String(total + 1).padStart(4, "0")}`;
  const clientPortalToken = randomUUID().replace(/-/g, "");

  await db.insert(customerContracts).values({
    organizationId: orgId,
    customerId,
    packageId,
    contractNumber,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    totalMinutes: pkg.totalMinutes,
    usedMinutes: 0,
    status: "active",
    clientPortalToken,
    freeVisitsEnabled,
    freeVisitsPerPeriod,
    freeVisitPeriodMonths,
    packageSnapshot: {
      id: pkg.id,
      name: pkg.name,
      totalMinutes: pkg.totalMinutes,
      priceCents: pkg.priceCents,
      urgencySurchargePercent: pkg.urgencySurchargePercent,
      priorityLevel: pkg.priorityLevel,
      phoneRoundingMinutes: pkg.phoneRoundingMinutes,
      remoteRoundingMinutes: pkg.remoteRoundingMinutes,
      emailRoundingMinutes: pkg.emailRoundingMinutes,
      callFeeMinutes: pkg.callFeeMinutes,
      deliveryFeeMinutes: pkg.deliveryFeeMinutes,
    },
    notes: notes || null,
  });

  revalidatePath("/support/contracts");
  revalidatePath("/support");
  redirect("/support/contracts");
}

export async function updateContractNotesAction(id: string, notes: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  await db
    .update(customerContracts)
    .set({ notes: notes || null, updatedAt: new Date() })
    .where(and(eq(customerContracts.id, id), eq(customerContracts.organizationId, session.user.organizationId)));

  revalidatePath(`/support/contracts/${id}`);
}

export async function updateContractStatusAction(
  id: string,
  status: "active" | "expired" | "exhausted" | "suspended",
): Promise<void> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!hasMinRole(session.user.role, "admin")) return;

  await db
    .update(customerContracts)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(customerContracts.id, id), eq(customerContracts.organizationId, session.user.organizationId)));

  revalidatePath(`/support/contracts/${id}`);
  revalidatePath("/support/contracts");
  revalidatePath("/support");
}
