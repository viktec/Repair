"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportInterventions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPresignedUploadUrl, deleteObjects } from "@/lib/storage";
import { randomUUID } from "crypto";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function getInterventionUploadUrl(
  interventionId: string,
  fileName: string,
  contentType: string,
) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  if (!ALLOWED_IMAGE_TYPES.has(contentType)) throw new Error("Tipo file non supportato.");

  const [intervention] = await db
    .select({ id: supportInterventions.id })
    .from(supportInterventions)
    .where(
      and(
        eq(supportInterventions.id, interventionId),
        eq(supportInterventions.organizationId, session.user.organizationId),
      ),
    )
    .limit(1);

  if (!intervention) throw new Error("Intervento non trovato");

  const ext = fileName.split(".").pop() ?? "jpg";
  const key = `interventions/${interventionId}/${randomUUID()}.${ext}`;
  const { url } = await getPresignedUploadUrl(key, false, contentType);
  return { uploadUrl: url, key };
}

export async function saveInterventionPhoto(interventionId: string, key: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  await db
    .update(supportInterventions)
    .set({
      photos: sql`array_append(${supportInterventions.photos}, ${key})`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(supportInterventions.id, interventionId),
        eq(supportInterventions.organizationId, session.user.organizationId),
      ),
    );

  revalidatePath(`/support/interventions/${interventionId}`);
}

export async function deleteInterventionPhoto(interventionId: string, key: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  await db
    .update(supportInterventions)
    .set({
      photos: sql`array_remove(${supportInterventions.photos}, ${key})`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(supportInterventions.id, interventionId),
        eq(supportInterventions.organizationId, session.user.organizationId),
      ),
    );

  await deleteObjects([{ key, isPublic: false }]);

  revalidatePath(`/support/interventions/${interventionId}`);
}
