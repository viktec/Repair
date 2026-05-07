"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inventoryItems, inventoryMovements, inventoryMovementTypeEnum } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { sendPushToOrgMembers } from "@/lib/push";

const itemSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  sku: z.string().optional(),
  category: z.string().optional(),
  compatibleBrands: z.string().optional(),
  compatibleModels: z.string().optional(),
  barcode: z.string().optional(),
  quantity: z.coerce.number().int().min(0).default(0),
  minQuantity: z.coerce.number().int().min(0).default(0),
  costPriceCents: z.string().optional(),
  sellPriceCents: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  supplierId: z.string().uuid().optional().or(z.literal("")),
});

export async function createInventoryItemAction(_prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const costCents = d.costPriceCents ? Math.round(parseFloat(d.costPriceCents) * 100) : null;
  const sellCents = d.sellPriceCents ? Math.round(parseFloat(d.sellPriceCents) * 100) : null;

  await db.insert(inventoryItems).values({
    organizationId: orgId,
    supplierId: d.supplierId || null,
    name: d.name,
    sku: d.sku || null,
    category: d.category || null,
    compatibleBrands: d.compatibleBrands || null,
    compatibleModels: d.compatibleModels || null,
    barcode: d.barcode || null,
    quantity: d.quantity,
    minQuantity: d.minQuantity,
    costPriceCents: costCents,
    sellPriceCents: sellCents,
    location: d.location || null,
    notes: d.notes || null,
  });

  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function updateInventoryItemAction(id: string, _prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const costCents = d.costPriceCents ? Math.round(parseFloat(d.costPriceCents) * 100) : null;
  const sellCents = d.sellPriceCents ? Math.round(parseFloat(d.sellPriceCents) * 100) : null;

  await db
    .update(inventoryItems)
    .set({
      supplierId: d.supplierId || null,
      name: d.name,
      sku: d.sku || null,
      category: d.category || null,
      compatibleBrands: d.compatibleBrands || null,
      compatibleModels: d.compatibleModels || null,
      barcode: d.barcode || null,
      minQuantity: d.minQuantity,
      costPriceCents: costCents,
      sellPriceCents: sellCents,
      location: d.location || null,
      notes: d.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.organizationId, orgId)));

  revalidatePath(`/inventory/${id}`);
  revalidatePath("/inventory");
  redirect(`/inventory/${id}`);
}

export async function addMovementAction(itemId: string, type: string, qty: number, notes: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [item] = await db
    .select({ quantity: inventoryItems.quantity, name: inventoryItems.name })
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.organizationId, orgId)))
    .limit(1);

  if (!item) return;

  const delta = type === "out" || type === "sale" ? -Math.abs(qty) : Math.abs(qty);
  const newQty = Math.max(0, item.quantity + delta);

  await db.insert(inventoryMovements).values({
    organizationId: orgId,
    itemId,
    type: type as typeof inventoryMovementTypeEnum.enumValues[number],
    quantity: Math.abs(qty),
    notes: notes || null,
    createdBy: session.user.id as string,
  });

  await db
    .update(inventoryItems)
    .set({ quantity: newQty, updatedAt: new Date() })
    .where(eq(inventoryItems.id, itemId));

  if (newQty === 0 && delta < 0) {
    void sendPushToOrgMembers(orgId, {
      title: "Articolo esaurito",
      body: `${item.name} — scorta a zero`,
      url: `/inventory/${itemId}`,
    });
  }

  revalidatePath(`/inventory/${itemId}`);
}

export async function deleteInventoryItemAction(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!can.delete(session.user.role)) throw new Error("Non autorizzato");

  await db
    .update(inventoryItems)
    .set({ deletedAt: new Date() })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.organizationId, session.user.organizationId)));

  revalidatePath("/inventory");
  redirect("/inventory");
}
