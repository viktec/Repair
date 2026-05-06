"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posTransactions, posTransactionItems, posSessions, inventoryItems } from "@/db/schema";
import { eq, and, isNull, max, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const itemSchema = z.object({
  inventoryItemId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPriceCents: z.coerce.number().int().min(0),
  discountPct: z.coerce.number().int().min(0).max(100).default(0),
  totalCents: z.coerce.number().int().min(0),
});

export async function createTransactionAction(_prev: { error: string } | null, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [activeSession] = await db
    .select({ id: posSessions.id })
    .from(posSessions)
    .where(and(eq(posSessions.organizationId, orgId), isNull(posSessions.closedAt)))
    .limit(1);

  if (!activeSession) return { error: "Nessuna sessione cassa aperta." };

  const paymentMethod = (formData.get("paymentMethod") as string) || "cash";
  const customerId = (formData.get("customerId") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  // Parse items
  const rawItems: z.infer<typeof itemSchema>[] = [];
  let i = 0;
  while (formData.has(`items[${i}][description]`)) {
    const raw = {
      inventoryItemId: formData.get(`items[${i}][inventoryItemId]`) as string,
      description: formData.get(`items[${i}][description]`) as string,
      quantity: formData.get(`items[${i}][quantity]`) as string,
      unitPriceCents: formData.get(`items[${i}][unitPriceCents]`) as string,
      discountPct: formData.get(`items[${i}][discountPct]`) as string,
      totalCents: formData.get(`items[${i}][totalCents]`) as string,
    };
    const parsed = itemSchema.safeParse(raw);
    if (!parsed.success) return { error: `Riga ${i + 1} non valida.` };
    rawItems.push(parsed.data);
    i++;
  }

  if (rawItems.length === 0) return { error: "Aggiungi almeno un articolo." };

  const totalCents = rawItems.reduce((s, it) => s + it.totalCents, 0);

  // Next receipt number
  const [{ maxNum }] = await db
    .select({ maxNum: max(posTransactions.receiptNumber) })
    .from(posTransactions)
    .where(eq(posTransactions.organizationId, orgId));

  const receiptNumber = (maxNum ?? 0) + 1;

  const [tx] = await db
    .insert(posTransactions)
    .values({
      organizationId: orgId,
      sessionId: activeSession.id,
      customerId: customerId || null,
      totalCents,
      discountCents: 0,
      paymentMethod: paymentMethod as "cash" | "card" | "transfer" | "mixed" | "other",
      status: "completed",
      notes: notes || null,
      receiptNumber,
    })
    .returning({ id: posTransactions.id });

  await db.insert(posTransactionItems).values(
    rawItems.map((it) => ({
      transactionId: tx.id,
      inventoryItemId: it.inventoryItemId || null,
      description: it.description,
      quantity: it.quantity,
      unitPriceCents: it.unitPriceCents,
      discountPct: it.discountPct,
      totalCents: it.totalCents,
    })),
  );

  // Decrement inventory for linked items
  for (const it of rawItems) {
    if (it.inventoryItemId) {
      await db
        .update(inventoryItems)
        .set({ quantity: sql`${inventoryItems.quantity} - ${it.quantity}` })
        .where(and(eq(inventoryItems.id, it.inventoryItemId), eq(inventoryItems.organizationId, orgId)));
    }
  }

  revalidatePath("/pos");
  revalidatePath("/inventory");
  redirect("/pos");
}
