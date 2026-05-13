"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, ticketPhotos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPresignedUploadUrl } from "@/lib/storage";
import { randomUUID } from "crypto";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function getUploadUrl(
  ticketId: string,
  fileName: string,
  contentType: string,
  photoType: "pre" | "during" | "post" | "signature",
  isPublic: boolean,
) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const isAllowed = photoType === "signature"
    ? contentType === "image/png"
    : ALLOWED_IMAGE_TYPES.has(contentType);
  if (!isAllowed) throw new Error("Tipo file non supportato.");

  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.organizationId, session.user.organizationId)))
    .limit(1);

  if (!ticket) throw new Error("Ticket non trovato");

  const ext = fileName.split(".").pop() ?? "jpg";
  const key = `tickets/${ticketId}/${photoType}_${randomUUID()}.${ext}`;

  const { url } = await getPresignedUploadUrl(key, isPublic, contentType);
  return { uploadUrl: url, key, isPublic };
}

export async function savePhoto(
  ticketId: string,
  key: string,
  photoType: "pre" | "during" | "post" | "signature",
  isPublic: boolean,
) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  await db.insert(ticketPhotos).values({
    ticketId,
    storageKey: key,
    photoType,
    isPublic,
  });

  revalidatePath(`/tickets/${ticketId}`);
}

export async function deletePhoto(ticketId: string, photoId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  await db
    .delete(ticketPhotos)
    .where(and(eq(ticketPhotos.id, photoId), eq(ticketPhotos.ticketId, ticketId)));

  revalidatePath(`/tickets/${ticketId}`);
}
