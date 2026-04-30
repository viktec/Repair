"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, ticketStatuses, customDeviceModels, customers, organizations } from "@/db/schema";
import { eq, and, max, count, isNull } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateQrToken } from "@/lib/utils";
import { DEVICE_MODELS } from "@/lib/devices";
import { sendStatusEmail } from "@/lib/email";

const ticketSchema = z.object({
  customerId: z.string().uuid().optional().or(z.literal("")),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().optional(),
  deviceImei: z.string().optional(),
  deviceSerial: z.string().optional(),
  devicePatternLock: z.string().optional(),
  accessories: z.string().optional(),
  deviceCondition: z.string().optional(),
  faultDescription: z.string().min(1, "Descrizione guasto obbligatoria"),
  estimatedCost: z.string().optional(),
});

type TicketState = { errors?: Record<string, string[]> } | { ticketId: string } | null;

export async function createTicketAction(
  _prev: TicketState,
  formData: FormData,
): Promise<TicketState> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const parsed = ticketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  const TICKET_LIMIT = 5000;
  const [countRow] = await db
    .select({ total: count() })
    .from(tickets)
    .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)));
  if ((countRow?.total ?? 0) >= TICKET_LIMIT) {
    return { errors: { faultDescription: [`Limite di ${TICKET_LIMIT} ticket raggiunto per questo account.`] } };
  }

  const [defaultStatus] = await db
    .select({ id: ticketStatuses.id })
    .from(ticketStatuses)
    .where(and(eq(ticketStatuses.organizationId, orgId), eq(ticketStatuses.isDefault, true)))
    .limit(1);

  const [maxRow] = await db
    .select({ max: max(tickets.ticketNumber) })
    .from(tickets)
    .where(eq(tickets.organizationId, orgId));

  const nextNumber = (maxRow?.max ?? 0) + 1;

  const estimatedCents = data.estimatedCost
    ? Math.round(parseFloat(data.estimatedCost) * 100)
    : null;

  const [ticket] = await db
    .insert(tickets)
    .values({
      organizationId: orgId,
      customerId: data.customerId || null,
      statusId: defaultStatus?.id ?? null,
      ticketNumber: nextNumber,
      deviceBrand: data.deviceBrand || null,
      deviceModel: data.deviceModel || null,
      deviceImei: data.deviceImei || null,
      deviceSerial: data.deviceSerial || null,
      devicePatternLock: data.devicePatternLock || null,
      accessories: data.accessories || null,
      deviceCondition: data.deviceCondition || null,
      faultDescription: data.faultDescription,
      estimatedCost: estimatedCents,
      qrToken: generateQrToken(),
    })
    .returning({ id: tickets.id });

  // Salva brand/model custom se non sono nel database statico
  if (data.deviceBrand && data.deviceModel) {
    const staticModels = DEVICE_MODELS[data.deviceBrand] ?? [];
    if (!staticModels.includes(data.deviceModel)) {
      await db
        .insert(customDeviceModels)
        .values({ organizationId: orgId, brand: data.deviceBrand, model: data.deviceModel })
        .onConflictDoNothing();
    }
  }

  revalidatePath("/tickets");
  return { ticketId: ticket.id };
}

export async function updateTicketStatusAction(ticketId: string, statusId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  await db
    .update(tickets)
    .set({ statusId, updatedAt: new Date() })
    .where(
      and(
        eq(tickets.id, ticketId),
        eq(tickets.organizationId, session.user.organizationId),
      ),
    );

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

export async function sendStatusEmailAction(ticketId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [row] = await db
    .select({
      ticketNumber: tickets.ticketNumber,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      qrToken: tickets.qrToken,
      customerEmail: customers.email,
      customerName: customers.name,
      statusName: ticketStatuses.name,
    })
    .from(tickets)
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(eq(tickets.id, ticketId), eq(tickets.organizationId, orgId)))
    .limit(1);

  if (!row) return { ok: false, error: "Ticket non trovato" };
  if (!row.customerEmail) return { ok: false, error: "Il cliente non ha un'email" };

  const [org] = await db
    .select({ name: organizations.name, phone: organizations.phone })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const trackingUrl = `${process.env.TRACKING_URL ?? "https://t.my-repair.it"}/${row.qrToken}`;
  const device = [row.deviceBrand, row.deviceModel].filter(Boolean).join(" ") || "Dispositivo";

  return sendStatusEmail({
    to: row.customerEmail,
    customerName: row.customerName,
    ticketNumber: row.ticketNumber,
    device,
    statusName: row.statusName ?? "In lavorazione",
    trackingUrl,
    orgName: org?.name ?? "Centro Riparazioni",
    orgPhone: org?.phone,
  });
}

export async function updateTicketCostAction(
  ticketId: string,
  estimatedCostEuros: string,
  finalCostEuros: string,
) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const estimatedCents = estimatedCostEuros
    ? Math.round(parseFloat(estimatedCostEuros) * 100)
    : null;
  const finalCents = finalCostEuros ? Math.round(parseFloat(finalCostEuros) * 100) : null;

  await db
    .update(tickets)
    .set({ estimatedCost: estimatedCents, finalCost: finalCents, updatedAt: new Date() })
    .where(and(eq(tickets.id, ticketId), eq(tickets.organizationId, session.user.organizationId)));

  revalidatePath(`/tickets/${ticketId}`);
}

export async function updateTicketNotesAction(ticketId: string, notes: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  await db
    .update(tickets)
    .set({ internalNotes: notes, updatedAt: new Date() })
    .where(
      and(
        eq(tickets.id, ticketId),
        eq(tickets.organizationId, session.user.organizationId),
      ),
    );

  revalidatePath(`/tickets/${ticketId}`);
}

export async function updateTicketFieldsAction(
  _prev: { errors?: Record<string, string[]> } | null,
  formData: FormData,
): Promise<{ errors?: Record<string, string[]> } | null> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const ticketId = formData.get("ticketId") as string;
  const parsed = ticketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const data = parsed.data;
  const estimatedCents = data.estimatedCost
    ? Math.round(parseFloat(data.estimatedCost) * 100)
    : null;

  await db
    .update(tickets)
    .set({
      customerId: data.customerId || null,
      deviceBrand: data.deviceBrand || null,
      deviceModel: data.deviceModel || null,
      deviceImei: data.deviceImei || null,
      deviceSerial: data.deviceSerial || null,
      devicePatternLock: data.devicePatternLock || null,
      accessories: data.accessories || null,
      deviceCondition: data.deviceCondition || null,
      faultDescription: data.faultDescription,
      estimatedCost: estimatedCents,
      updatedAt: new Date(),
    })
    .where(and(eq(tickets.id, ticketId), eq(tickets.organizationId, orgId)));

  revalidatePath(`/tickets/${ticketId}`);
  redirect(`/tickets/${ticketId}`);
}

export async function deleteTicketAction(ticketId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  await db
    .update(tickets)
    .set({ deletedAt: new Date() })
    .where(and(eq(tickets.id, ticketId), eq(tickets.organizationId, orgId)));

  redirect("/tickets");
}
