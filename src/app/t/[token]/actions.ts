"use server";

import { db } from "@/lib/db";
import { tickets, ticketPhotos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getPresignedUploadUrl } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function getSignatureUploadUrl(token: string) {
  const [ticket] = await db
    .select({ id: tickets.id, estimatedCost: tickets.estimatedCost, quoteAcceptedAt: tickets.quoteAcceptedAt, quoteRejectedAt: tickets.quoteRejectedAt })
    .from(tickets)
    .where(eq(tickets.qrToken, token))
    .limit(1);

  if (!ticket || ticket.estimatedCost == null) throw new Error("Ticket non trovato");
  if (ticket.quoteAcceptedAt || ticket.quoteRejectedAt) throw new Error("Preventivo già processato");

  const key = `tickets/${ticket.id}/signature_${randomUUID()}.png`;
  const { url } = await getPresignedUploadUrl(key, false, "image/png");
  return { uploadUrl: url, key };
}

export async function acceptQuoteAction(token: string, signatureKey?: string) {
  const [ticket] = await db
    .select({ id: tickets.id, estimatedCost: tickets.estimatedCost, quoteAcceptedAt: tickets.quoteAcceptedAt, quoteRejectedAt: tickets.quoteRejectedAt })
    .from(tickets)
    .where(eq(tickets.qrToken, token))
    .limit(1);

  if (!ticket || ticket.estimatedCost == null) return;
  if (ticket.quoteAcceptedAt || ticket.quoteRejectedAt) return;

  const now = new Date();
  await db
    .update(tickets)
    .set({ quoteAcceptedAt: now, quoteTermsAcceptedAt: now, updatedAt: now })
    .where(eq(tickets.qrToken, token));

  if (signatureKey) {
    await db.insert(ticketPhotos).values({
      ticketId: ticket.id,
      storageKey: signatureKey,
      photoType: "signature",
      isPublic: false,
    });
  }

  revalidatePath(`/t/${token}`);
}

export async function rejectQuoteAction(token: string) {
  const [ticket] = await db
    .select({ id: tickets.id, estimatedCost: tickets.estimatedCost, quoteAcceptedAt: tickets.quoteAcceptedAt, quoteRejectedAt: tickets.quoteRejectedAt })
    .from(tickets)
    .where(eq(tickets.qrToken, token))
    .limit(1);

  if (!ticket || ticket.estimatedCost == null) return;
  if (ticket.quoteAcceptedAt || ticket.quoteRejectedAt) return;

  await db
    .update(tickets)
    .set({ quoteRejectedAt: new Date(), updatedAt: new Date() })
    .where(eq(tickets.qrToken, token));

  revalidatePath(`/t/${token}`);
}
