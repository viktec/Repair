"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deviceAppraisals } from "@/db/schema";
import { redirect } from "next/navigation";

export async function createAppraisalAction(_prev: { error: string } | null, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const brand = (formData.get("brand") as string)?.trim();
  const model = (formData.get("model") as string)?.trim();
  const storageGb = (formData.get("storageGb") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || null;
  const imei = (formData.get("imei") as string)?.trim() || null;
  const customerName = (formData.get("customerName") as string)?.trim() || null;
  const customerPhone = (formData.get("customerPhone") as string)?.trim() || null;

  if (!brand || !model) return { error: "Marca e modello sono obbligatori." };
  if (!storageGb) return { error: "Lo storage è obbligatorio." };
  if (!color) return { error: "Il colore è obbligatorio." };
  if (!imei) return { error: "L'IMEI è obbligatorio." };

  const surveyToken = crypto.randomUUID().replace(/-/g, "");

  const [row] = await db
    .insert(deviceAppraisals)
    .values({
      organizationId: orgId,
      surveyToken,
      brand,
      model,
      storageGb,
      color,
      imei,
      customerName,
      customerPhone,
      status: "draft",
    })
    .returning({ id: deviceAppraisals.id });

  redirect(`/registry/perizie/${row.id}`);
}
