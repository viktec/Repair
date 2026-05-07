"use server";

import { db } from "@/lib/db";
import { deviceAppraisals, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function createSelfServiceAppraisalAction(
  orgId: string,
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const [org] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return { error: "Link non valido." };

  const brand = (formData.get("brand") as string)?.trim();
  const model = (formData.get("model") as string)?.trim();
  const storageGb = (formData.get("storageGb") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || null;
  const imei = (formData.get("imei") as string)?.trim() || null;
  const serialNumber = (formData.get("serialNumber") as string)?.trim() || null;
  const customerName = (formData.get("customerName") as string)?.trim() || null;
  const customerPhone = (formData.get("customerPhone") as string)?.trim() || null;

  if (!brand || !model) return { error: "Marca e modello sono obbligatori." };
  if (!customerName || !customerPhone) return { error: "Nome e numero di telefono sono obbligatori." };

  const surveyToken = crypto.randomUUID().replace(/-/g, "");

  await db.insert(deviceAppraisals).values({
    organizationId: orgId,
    surveyToken,
    brand,
    model,
    storageGb,
    color,
    imei,
    serialNumber,
    customerName,
    customerPhone,
    status: "draft",
  });

  redirect(`/perizia/${surveyToken}`);
}
