"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { usedItemsRegistry, deviceAppraisals } from "@/db/schema";
import { eq, and, max, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createRegistryEntryAction(_prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [maxRow] = await db
    .select({ max: max(usedItemsRegistry.counter) })
    .from(usedItemsRegistry)
    .where(eq(usedItemsRegistry.organizationId, orgId));
  const nextCounter = (maxRow?.max ?? 0) + 1;

  const purchaseRaw = formData.get("purchasePriceCents") as string;
  const sellRaw = formData.get("sellPriceCents") as string;
  const appraisalId = (formData.get("appraisalId") as string) || null;

  const [entry] = await db
    .insert(usedItemsRegistry)
    .values({
      organizationId: orgId,
      counter: nextCounter,
      date: new Date(formData.get("date") as string),
      description: formData.get("description") as string,
      imeiOrSerial: (formData.get("imeiOrSerial") as string) || null,
      counterpartyName: formData.get("counterpartyName") as string,
      counterpartyDocType: formData.get("counterpartyDocType") as "carta_identita" | "patente" | "passaporto" | "altro",
      counterpartyDocNumber: formData.get("counterpartyDocNumber") as string,
      purchasePriceCents: purchaseRaw ? Math.round(parseFloat(purchaseRaw) * 100) : null,
      sellPriceCents: sellRaw ? Math.round(parseFloat(sellRaw) * 100) : null,
      notes: (formData.get("notes") as string) || null,
    })
    .returning({ id: usedItemsRegistry.id });

  // Collega la perizia alla registrazione
  if (appraisalId) {
    await db
      .update(deviceAppraisals)
      .set({ registryEntryId: entry.id, updatedAt: new Date() })
      .where(and(eq(deviceAppraisals.id, appraisalId), eq(deviceAppraisals.organizationId, orgId)));
  }

  revalidatePath("/registry");
  revalidatePath("/registry/perizie");
  redirect("/registry");
}

export async function updateRegistryEntryAction(entryId: string, _prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const purchaseRaw = formData.get("purchasePriceCents") as string;
  const sellRaw = formData.get("sellPriceCents") as string;

  await db
    .update(usedItemsRegistry)
    .set({
      date: new Date(formData.get("date") as string),
      description: formData.get("description") as string,
      imeiOrSerial: (formData.get("imeiOrSerial") as string) || null,
      counterpartyName: formData.get("counterpartyName") as string,
      counterpartyDocType: formData.get("counterpartyDocType") as "carta_identita" | "patente" | "passaporto" | "altro",
      counterpartyDocNumber: formData.get("counterpartyDocNumber") as string,
      purchasePriceCents: purchaseRaw ? Math.round(parseFloat(purchaseRaw) * 100) : null,
      sellPriceCents: sellRaw ? Math.round(parseFloat(sellRaw) * 100) : null,
      notes: (formData.get("notes") as string) || null,
    })
    .where(and(eq(usedItemsRegistry.id, entryId), eq(usedItemsRegistry.organizationId, orgId)));

  revalidatePath("/registry");
  redirect("/registry");
}

export async function deleteRegistryEntryAction(entryId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autenticato." };
  const orgId = session.user.organizationId;

  await db
    .update(deviceAppraisals)
    .set({ registryEntryId: null, updatedAt: new Date() })
    .where(and(
      eq(deviceAppraisals.registryEntryId, entryId),
      eq(deviceAppraisals.organizationId, orgId),
      isNotNull(deviceAppraisals.registryEntryId),
    ));

  await db
    .delete(usedItemsRegistry)
    .where(and(eq(usedItemsRegistry.id, entryId), eq(usedItemsRegistry.organizationId, orgId)));

  revalidatePath("/registry");
  return {};
}
