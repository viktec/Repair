"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, customDeviceModels, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPresignedUploadUrl } from "@/lib/storage";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { can } from "@/lib/permissions";

export async function updateOrganizationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  if (!can.editOrgSettings(session.user.role)) throw new Error("Non autorizzato");

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
  if (!can.editOrgSettings(session.user.role)) throw new Error("Non autorizzato");

  const key = `logos/${session.user.organizationId}/${randomUUID()}.${fileName.split(".").pop()}`;
  const { url } = await getPresignedUploadUrl(key, true, contentType);
  return { uploadUrl: url, key };
}

export async function saveLogoUrl(storageKey: string) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  if (!can.editOrgSettings(session.user.role)) throw new Error("Non autorizzato");

  const { getPublicUrl } = await import("@/lib/storage");
  const logoUrl = getPublicUrl(storageKey);

  await db
    .update(organizations)
    .set({ brandingLogoUrl: logoUrl, updatedAt: new Date() })
    .where(eq(organizations.id, session.user.organizationId));

  revalidatePath("/settings");
}

export async function changePasswordAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Tutti i campi sono obbligatori." };
  }
  if (newPassword.length < 8) {
    return { error: "La nuova password deve essere di almeno 8 caratteri." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Le password non coincidono." };
  }

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.passwordHash) return { error: "Utente non trovato." };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Password attuale non corretta." };

  const newHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return { ok: true };
}

export async function deleteCustomModelAction(modelId: string) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  if (!can.editOrgSettings(session.user.role)) throw new Error("Non autorizzato");

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
