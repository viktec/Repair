"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, customDeviceModels } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPresignedUploadUrl } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function updateOrganizationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const whatsappPhone = formData.get("whatsappPhone") as string;
  const address = formData.get("address") as string;
  const city = formData.get("city") as string;
  const postalCode = formData.get("postalCode") as string;
  const vatNumber = formData.get("vatNumber") as string;
  const brandingPrimaryColor = formData.get("brandingPrimaryColor") as string;
  const whatsappTemplate = formData.get("whatsappTemplate") as string;

  await db
    .update(organizations)
    .set({
      name: name || undefined,
      phone: phone || null,
      whatsappPhone: whatsappPhone || null,
      address: address || null,
      city: city || null,
      postalCode: postalCode || null,
      vatNumber: vatNumber || null,
      brandingPrimaryColor: brandingPrimaryColor || undefined,
      whatsappTemplate: whatsappTemplate || null,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, session.user.organizationId));

  revalidatePath("/settings");
}

export async function getLogoUploadUrl(fileName: string, contentType: string) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");

  const key = `logos/${session.user.organizationId}/${randomUUID()}.${fileName.split(".").pop()}`;
  const { url } = await getPresignedUploadUrl(key, true, contentType);
  return { uploadUrl: url, key };
}

export async function saveLogoUrl(storageKey: string) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");

  const { getPublicUrl } = await import("@/lib/storage");
  const logoUrl = getPublicUrl(storageKey);

  await db
    .update(organizations)
    .set({ brandingLogoUrl: logoUrl, updatedAt: new Date() })
    .where(eq(organizations.id, session.user.organizationId));

  revalidatePath("/settings");
}

export async function deleteCustomModelAction(modelId: string) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");

  await db
    .delete(customDeviceModels)
    .where(
      and(
        eq(customDeviceModels.id, modelId),
        eq(customDeviceModels.organizationId, session.user.organizationId),
      ),
    );

  revalidatePath("/settings");
}
