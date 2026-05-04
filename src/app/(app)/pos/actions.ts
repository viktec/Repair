"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posSessions, posTransactions } from "@/db/schema";
import { eq, and, isNull, sum, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function openSessionAction(openingCashCents: number) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  // Controlla se c'è già una sessione aperta
  const [existing] = await db
    .select({ id: posSessions.id })
    .from(posSessions)
    .where(and(eq(posSessions.organizationId, orgId), isNull(posSessions.closedAt)))
    .limit(1);

  if (existing) return { error: "Esiste già una sessione cassa aperta." };

  await db.insert(posSessions).values({
    organizationId: orgId,
    openedBy: session.user.id as string,
    openingCashCents,
  });

  revalidatePath("/pos");
  return { ok: true };
}

export async function closeSessionAction(sessionId: string, closingCashCents: number, notes?: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [existing] = await db
    .select({ id: posSessions.id })
    .from(posSessions)
    .where(and(eq(posSessions.id, sessionId), eq(posSessions.organizationId, orgId), isNull(posSessions.closedAt)))
    .limit(1);

  if (!existing) return { error: "Sessione non trovata o già chiusa." };

  await db
    .update(posSessions)
    .set({ closedAt: new Date(), closingCashCents, notes: notes || null })
    .where(eq(posSessions.id, sessionId));

  revalidatePath("/pos");
  revalidatePath("/pos/sessions");
  return { ok: true, sessionId };
}

export async function markZReportPrintedAction(sessionId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  await db
    .update(posSessions)
    .set({ zReportPrintedAt: new Date() })
    .where(and(eq(posSessions.id, sessionId), eq(posSessions.organizationId, orgId)));

  revalidatePath("/pos/sessions");
  return { ok: true };
}

export async function getSessionTotals(sessionId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const rows = await db
    .select({
      paymentMethod: posTransactions.paymentMethod,
      total: sum(posTransactions.totalCents),
      qty: count(),
    })
    .from(posTransactions)
    .where(
      and(
        eq(posTransactions.sessionId, sessionId),
        eq(posTransactions.organizationId, orgId),
        eq(posTransactions.status, "completed"),
      )
    )
    .groupBy(posTransactions.paymentMethod);

  return rows;
}
