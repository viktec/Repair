"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { supplierOrders, supplierOrderItems, inventoryItems } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function markOrderedAction(supplierId: string, orderId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  await db
    .update(supplierOrders)
    .set({ status: "ordered", orderedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(supplierOrders.id, orderId), eq(supplierOrders.organizationId, orgId)));

  revalidatePath(`/suppliers/${supplierId}/orders/${orderId}`);
}

export async function cancelOrderAction(supplierId: string, orderId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  await db
    .update(supplierOrders)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(supplierOrders.id, orderId), eq(supplierOrders.organizationId, orgId)));

  revalidatePath(`/suppliers/${supplierId}/orders/${orderId}`);
  revalidatePath(`/suppliers/${supplierId}`);
}

export async function receiveItemsAction(supplierId: string, orderId: string, _prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const orderItems = await db
    .select()
    .from(supplierOrderItems)
    .where(eq(supplierOrderItems.orderId, orderId));

  for (const item of orderItems) {
    const receivedStr = formData.get(`received_${item.id}`) as string;
    const addedNow = parseInt(receivedStr, 10);
    if (isNaN(addedNow) || addedNow <= 0) continue;

    const newTotalReceived = item.quantityReceived + addedNow;

    await db
      .update(supplierOrderItems)
      .set({ quantityReceived: newTotalReceived })
      .where(eq(supplierOrderItems.id, item.id));

    // Safely increment inventory using SQL expression
    if (item.itemId) {
      await db
        .update(inventoryItems)
        .set({ quantity: sql`${inventoryItems.quantity} + ${addedNow}` })
        .where(and(eq(inventoryItems.id, item.itemId), eq(inventoryItems.organizationId, orgId)));
    }
  }

  // Re-fetch updated items to determine new order status
  const updatedItems = await db
    .select()
    .from(supplierOrderItems)
    .where(eq(supplierOrderItems.orderId, orderId));

  const allReceived = updatedItems.every((it) => it.quantityReceived >= it.quantityOrdered);
  const anyReceived = updatedItems.some((it) => it.quantityReceived > 0);

  const newStatus: "received" | "partially_received" | "ordered" = allReceived
    ? "received"
    : anyReceived
    ? "partially_received"
    : "ordered";

  await db
    .update(supplierOrders)
    .set({
      status: newStatus,
      receivedAt: allReceived ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(supplierOrders.id, orderId), eq(supplierOrders.organizationId, orgId)));

  revalidatePath(`/suppliers/${supplierId}/orders/${orderId}`);
  revalidatePath(`/suppliers/${supplierId}`);
  revalidatePath("/inventory");
}
