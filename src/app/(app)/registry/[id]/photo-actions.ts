"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { usedItemsRegistry } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPresignedUploadUrl } from "@/lib/storage";
import { randomUUID } from "crypto";

const MAX_PHOTOS = 10;

export async function getRegistryPhotoUploadUrl(entryId: string, contentType: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  if (contentType !== "image/jpeg") throw new Error("Tipo file non supportato.");

  const [entry] = await db
    .select({ id: usedItemsRegistry.id, photoKeys: usedItemsRegistry.photoKeys })
    .from(usedItemsRegistry)
    .where(and(eq(usedItemsRegistry.id, entryId), eq(usedItemsRegistry.organizationId, orgId)))
    .limit(1);

  if (!entry) throw new Error("Voce non trovata");

  const existing: string[] = entry.photoKeys ? JSON.parse(entry.photoKeys) : [];
  if (existing.length >= MAX_PHOTOS) throw new Error(`Massimo ${MAX_PHOTOS} foto per voce.`);

  const key = `registry/${entryId}/${randomUUID()}.jpg`;
  const { url } = await getPresignedUploadUrl(key, false, contentType);
  return { uploadUrl: url, key };
}

export async function saveRegistryPhoto(entryId: string, key: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [entry] = await db
    .select({ id: usedItemsRegistry.id, photoKeys: usedItemsRegistry.photoKeys })
    .from(usedItemsRegistry)
    .where(and(eq(usedItemsRegistry.id, entryId), eq(usedItemsRegistry.organizationId, orgId)))
    .limit(1);

  if (!entry) throw new Error("Voce non trovata");

  const existing: string[] = entry.photoKeys ? JSON.parse(entry.photoKeys) : [];
  if (existing.length >= MAX_PHOTOS) throw new Error(`Massimo ${MAX_PHOTOS} foto per voce.`);

  const updated = [...existing, key];
  await db
    .update(usedItemsRegistry)
    .set({ photoKeys: JSON.stringify(updated) })
    .where(and(eq(usedItemsRegistry.id, entryId), eq(usedItemsRegistry.organizationId, orgId)));

  revalidatePath(`/registry/${entryId}/edit`);
}

export async function deleteRegistryPhoto(entryId: string, key: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [entry] = await db
    .select({ id: usedItemsRegistry.id, photoKeys: usedItemsRegistry.photoKeys })
    .from(usedItemsRegistry)
    .where(and(eq(usedItemsRegistry.id, entryId), eq(usedItemsRegistry.organizationId, orgId)))
    .limit(1);

  if (!entry) throw new Error("Voce non trovata");

  const existing: string[] = entry.photoKeys ? JSON.parse(entry.photoKeys) : [];
  const updated = existing.filter((k) => k !== key);
  await db
    .update(usedItemsRegistry)
    .set({ photoKeys: JSON.stringify(updated) })
    .where(and(eq(usedItemsRegistry.id, entryId), eq(usedItemsRegistry.organizationId, orgId)));

  revalidatePath(`/registry/${entryId}/edit`);
}
