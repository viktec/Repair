"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, ticketStatuses, customDeviceModels } from "@/db/schema";
import { eq, and, max } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { generateQrToken } from "@/lib/utils";
import { DEVICE_MODELS } from "@/lib/devices";

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
  if (!session?.user.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const parsed = ticketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

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
  if (!session?.user.organizationId) redirect("/login");

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

export async function updateTicketNotesAction(ticketId: string, notes: string) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");

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
