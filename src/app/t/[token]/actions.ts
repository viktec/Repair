"use server";

import { db } from "@/lib/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function acceptQuoteAction(token: string) {
  const [ticket] = await db
    .select({ id: tickets.id, estimatedCost: tickets.estimatedCost, quoteAcceptedAt: tickets.quoteAcceptedAt, quoteRejectedAt: tickets.quoteRejectedAt })
    .from(tickets)
    .where(eq(tickets.qrToken, token))
    .limit(1);

  if (!ticket || ticket.estimatedCost == null) return;
  if (ticket.quoteAcceptedAt || ticket.quoteRejectedAt) return;

  await db
    .update(tickets)
    .set({ quoteAcceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(tickets.qrToken, token));

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
