"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suppliers, supplierOrders, supplierOrderItems, inventoryItems } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createOrderAction(supplierId: string, _prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  // Verify supplier belongs to org
  const [supplier] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.organizationId, orgId), isNull(suppliers.deletedAt)))
    .limit(1);
  if (!supplier) return { error: "Fornitore non trovato" };

  const notes = (formData.get("notes") as string) || null;
  const expectedAt = formData.get("expectedAt") as string;

  // Collect items from formData: items[0][description], items[0][qty], items[0][itemId], items[0][unitCost]
  const items: { description: string; quantityOrdered: number; itemId: string | null; unitCostCents: number | null }[] = [];
  let i = 0;
  while (formData.has(`items[${i}][description]`)) {
    const description = (formData.get(`items[${i}][description]`) as string).trim();
    const qty = parseInt(formData.get(`items[${i}][qty]`) as string, 10);
    const itemId = (formData.get(`items[${i}][itemId]`) as string) || null;
    const unitCostStr = formData.get(`items[${i}][unitCost]`) as string;
    const unitCostCents = unitCostStr ? Math.round(parseFloat(unitCostStr) * 100) : null;
    if (description && qty > 0) {
      items.push({ description, quantityOrdered: qty, itemId, unitCostCents });
    }
    i++;
  }

  if (items.length === 0) return { error: "Aggiungi almeno un articolo all'ordine" };

  const [order] = await db
    .insert(supplierOrders)
    .values({
      organizationId: orgId,
      supplierId,
      notes,
      expectedAt: expectedAt ? new Date(expectedAt) : null,
    })
    .returning({ id: supplierOrders.id });

  if (items.length > 0) {
    await db.insert(supplierOrderItems).values(
      items.map((item) => ({
        orderId: order.id,
        itemId: item.itemId,
        description: item.description,
        quantityOrdered: item.quantityOrdered,
        unitCostCents: item.unitCostCents,
      })),
    );
  }

  revalidatePath(`/suppliers/${supplierId}`);
  redirect(`/suppliers/${supplierId}/orders/${order.id}`);
}
