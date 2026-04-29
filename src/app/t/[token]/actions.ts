"use server";

import { db } from "@/lib/db";
import { tickets, ticketPhotos, customers, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getPresignedUploadUrl } from "@/lib/storage";
import { randomUUID } from "crypto";
import { sendTelegramMessage } from "@/lib/telegram";

async function fetchTicketForQuote(token: string) {
  const [row] = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      estimatedCost: tickets.estimatedCost,
      quoteAcceptedAt: tickets.quoteAcceptedAt,
      quoteRejectedAt: tickets.quoteRejectedAt,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      organizationId: tickets.organizationId,
      customerName: customers.name,
    })
    .from(tickets)
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .where(eq(tickets.qrToken, token))
    .limit(1);
  return row ?? null;
}

async function notifyTelegram(orgId: string, message: string) {
  const [org] = await db
    .select({ telegramBotToken: organizations.telegramBotToken, telegramChatId: organizations.telegramChatId })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (org?.telegramBotToken && org?.telegramChatId) {
    await sendTelegramMessage(org.telegramBotToken, org.telegramChatId, message);
  }
}

function formatCents(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export async function getSignatureUploadUrl(token: string) {
  const ticket = await fetchTicketForQuote(token);
  if (!ticket || ticket.estimatedCost == null) throw new Error("Ticket non trovato");
  if (ticket.quoteAcceptedAt || ticket.quoteRejectedAt) throw new Error("Preventivo già processato");

  const key = `tickets/${ticket.id}/signature_${randomUUID()}.png`;
  const { url } = await getPresignedUploadUrl(key, false, "image/png");
  return { uploadUrl: url, key };
}

export async function acceptQuoteAction(token: string, signatureKey?: string) {
  const ticket = await fetchTicketForQuote(token);
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

  const num = String(ticket.ticketNumber).padStart(4, "0");
  const device = [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || "Dispositivo";
  await notifyTelegram(
    ticket.organizationId,
    `✅ <b>Preventivo ACCETTATO</b> — Ticket #${num}\n` +
    `👤 ${ticket.customerName ?? "Cliente"}\n` +
    `📱 ${device}\n` +
    `💶 ${formatCents(ticket.estimatedCost)}\n\n` +
    `Il cliente ha letto i T&C e firmato digitalmente.\nPuoi procedere con la riparazione.`,
  );

  revalidatePath(`/t/${token}`);
}

export async function rejectQuoteAction(token: string) {
  const ticket = await fetchTicketForQuote(token);
  if (!ticket || ticket.estimatedCost == null) return;
  if (ticket.quoteAcceptedAt || ticket.quoteRejectedAt) return;

  await db
    .update(tickets)
    .set({ quoteRejectedAt: new Date(), updatedAt: new Date() })
    .where(eq(tickets.qrToken, token));

  const num = String(ticket.ticketNumber).padStart(4, "0");
  const device = [ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(" ") || "Dispositivo";
  await notifyTelegram(
    ticket.organizationId,
    `❌ <b>Preventivo RIFIUTATO</b> — Ticket #${num}\n` +
    `👤 ${ticket.customerName ?? "Cliente"}\n` +
    `📱 ${device}\n` +
    `💶 ${formatCents(ticket.estimatedCost)}\n\n` +
    `Il cliente ha rifiutato il preventivo. Contattalo per discutere alternative.`,
  );

  revalidatePath(`/t/${token}`);
}
