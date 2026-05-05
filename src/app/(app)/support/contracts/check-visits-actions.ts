"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contractCheckVisits, customerContracts } from "@/db/schema";
import { eq, and, gte, ne, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateCheckVisitStatusAction(
  visitId: string,
  status: "confirmed" | "completed" | "cancelled",
  scheduledAt?: string,
  adminNotes?: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [visit] = await db
    .select({ id: contractCheckVisits.id, contractId: contractCheckVisits.contractId })
    .from(contractCheckVisits)
    .where(and(eq(contractCheckVisits.id, visitId), eq(contractCheckVisits.organizationId, orgId)))
    .limit(1);

  if (!visit) return { error: "Visita non trovata" };

  await db
    .update(contractCheckVisits)
    .set({
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      adminNotes: adminNotes || null,
      updatedAt: new Date(),
    })
    .where(eq(contractCheckVisits.id, visitId));

  revalidatePath(`/support/contracts/${visit.contractId}`);
  return {};
}

export async function clientBookCheckVisitAction(
  token: string,
  preferredDate1: string,
  preferredDate2: string | null,
  clientNotes: string,
): Promise<{ ok: boolean; error?: string; visitId?: string }> {
  const [contract] = await db
    .select({
      id: customerContracts.id,
      organizationId: customerContracts.organizationId,
      status: customerContracts.status,
      freeVisitsEnabled: customerContracts.freeVisitsEnabled,
      freeVisitsPerPeriod: customerContracts.freeVisitsPerPeriod,
      freeVisitPeriodMonths: customerContracts.freeVisitPeriodMonths,
      endDate: customerContracts.endDate,
    })
    .from(customerContracts)
    .where(eq(customerContracts.clientPortalToken, token))
    .limit(1);

  if (!contract) return { ok: false, error: "Contratto non trovato" };
  if (contract.status !== "active") return { ok: false, error: "Contratto non attivo" };
  if (!contract.freeVisitsEnabled) return { ok: false, error: "Visite gratuite non abilitate" };

  // Controllo eligibilità: quante visite non-cancelled nel periodo corrente
  const periodStart = new Date();
  periodStart.setMonth(periodStart.getMonth() - contract.freeVisitPeriodMonths);

  const [{ used }] = await db
    .select({ used: count(contractCheckVisits.id) })
    .from(contractCheckVisits)
    .where(
      and(
        eq(contractCheckVisits.contractId, contract.id),
        gte(contractCheckVisits.createdAt, periodStart),
        ne(contractCheckVisits.status, "cancelled"),
      ),
    );

  if ((used ?? 0) >= contract.freeVisitsPerPeriod) {
    return { ok: false, error: "Hai già utilizzato le visite gratuite per questo periodo" };
  }

  const [visit] = await db
    .insert(contractCheckVisits)
    .values({
      organizationId: contract.organizationId,
      contractId: contract.id,
      preferredDate1: new Date(preferredDate1),
      preferredDate2: preferredDate2 ? new Date(preferredDate2) : null,
      clientNotes: clientNotes || null,
      status: "pending",
      openedBy: "client",
    })
    .returning({ id: contractCheckVisits.id });

  revalidatePath(`/support/contracts/${contract.id}`);
  return { ok: true, visitId: visit.id };
}
