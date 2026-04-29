"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { tickets, ticketParts, inventoryItems, inventoryMovements } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type AddPartInput = {
  ticketId: string;
  inventoryItemId: string | null;
  description: string;
  quantity: number;
  unitCostCents: number;
  unitSellCents: number;
};

export async function addPartAction(data: AddPartInput) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autorizzato" };
  const orgId = session.user.organizationId;

  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(and(eq(tickets.id, data.ticketId), eq(tickets.organizationId, orgId)))
    .limit(1);
  if (!ticket) return { error: "Ticket non trovato" };

  await db.insert(ticketParts).values({
    ticketId: data.ticketId,
    inventoryItemId: data.inventoryItemId,
    description: data.description,
    quantity: data.quantity,
    unitCostCents: data.unitCostCents,
    unitSellCents: data.unitSellCents,
  });

  if (data.inventoryItemId) {
    await db
      .update(inventoryItems)
      .set({ quantity: sql`quantity - ${data.quantity}`, updatedAt: new Date() })
      .where(and(eq(inventoryItems.id, data.inventoryItemId), eq(inventoryItems.organizationId, orgId)));

    await db.insert(inventoryMovements).values({
      organizationId: orgId,
      itemId: data.inventoryItemId,
      type: "out",
      quantity: data.quantity,
      ticketId: data.ticketId,
      createdBy: session.user.id,
    });
  }

  revalidatePath(`/tickets/${data.ticketId}`);
  return { ok: true };
}

export async function removePartAction(partId: string, ticketId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autorizzato" };
  const orgId = session.user.organizationId;

  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.organizationId, orgId)))
    .limit(1);
  if (!ticket) return { error: "Ticket non trovato" };

  const [part] = await db
    .select()
    .from(ticketParts)
    .where(and(eq(ticketParts.id, partId), eq(ticketParts.ticketId, ticketId)))
    .limit(1);
  if (!part) return { error: "Ricambio non trovato" };

  await db.delete(ticketParts).where(eq(ticketParts.id, partId));

  if (part.inventoryItemId) {
    await db
      .update(inventoryItems)
      .set({ quantity: sql`quantity + ${part.quantity}`, updatedAt: new Date() })
      .where(and(eq(inventoryItems.id, part.inventoryItemId), eq(inventoryItems.organizationId, orgId)));

    await db.insert(inventoryMovements).values({
      organizationId: orgId,
      itemId: part.inventoryItemId,
      type: "in",
      quantity: part.quantity,
      ticketId,
      notes: "Rimosso da ticket",
      createdBy: session.user.id,
    });
  }

  revalidatePath(`/tickets/${ticketId}`);
  return { ok: true };
}
