"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, tickets, ticketPhotos, activityLogs } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { deleteObjects } from "@/lib/storage";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";

const customerSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  phone: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  notes: z.string().optional(),
  gdprConsent: z.string().optional(),
});

type CustomerState = {
  errors?: Record<string, string[]>;
} | null;

export async function createCustomerAction(
  _prev: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, phone, email, notes, gdprConsent } = parsed.data;

  await db.insert(customers).values({
    organizationId: session.user.organizationId,
    name,
    phone: phone || null,
    email: email || null,
    notes: notes || null,
    gdprConsentAt: gdprConsent === "on" ? new Date() : null,
  });

  logActivity({
    orgId: session.user.organizationId,
    action: "customer.create",
    entityType: "customer",
  }).catch(() => {});

  revalidatePath("/customers");
  redirect("/customers");
}

export async function createCustomerInlineAction(data: {
  name: string;
  phone: string;
  email: string;
  gdprConsent: boolean;
}): Promise<{ id: string; name: string; phone: string | null } | { error: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autenticato" };

  if (!data.name.trim()) return { error: "Il nome è obbligatorio" };

  const [created] = await db
    .insert(customers)
    .values({
      organizationId: session.user.organizationId,
      name: data.name.trim(),
      phone: data.phone || null,
      email: data.email || null,
      gdprConsentAt: data.gdprConsent ? new Date() : null,
    })
    .returning({ id: customers.id, name: customers.name, phone: customers.phone });

  revalidatePath("/customers");
  revalidatePath("/tickets/new");
  return created;
}

export async function updateCustomerAction(customerId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const { name, phone, email, notes } = parsed.data;

  await db
    .update(customers)
    .set({
      name,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
    })
    .where(and(eq(customers.id, customerId), eq(customers.organizationId, session.user.organizationId)));

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

export async function deleteCustomerAction(customerId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!can.delete(session.user.role)) throw new Error("Non autorizzato");

  const orgId = session.user.organizationId;

  // Verify ownership before touching anything
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
    .limit(1);
  if (!customer) throw new Error("Cliente non trovato");

  // Delete S3 photos from this customer's tickets
  const customerTickets = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(and(eq(tickets.customerId, customerId), eq(tickets.organizationId, orgId)));

  if (customerTickets.length > 0) {
    const ticketIds = customerTickets.map((t) => t.id);
    const photos = await db
      .select({ storageKey: ticketPhotos.storageKey, isPublic: ticketPhotos.isPublic })
      .from(ticketPhotos)
      .where(inArray(ticketPhotos.ticketId, ticketIds));

    if (photos.length > 0) {
      await deleteObjects(photos.map((p) => ({ key: p.storageKey, isPublic: p.isPublic })));
    }
  }

  // Remove activity log entries that reference this customer
  await db
    .delete(activityLogs)
    .where(and(eq(activityLogs.entityType, "customer"), eq(activityLogs.entityId, customerId)));

  // Delete the customer (FK cascade handles contracts; tickets/pos set null automatically)
  await db
    .delete(customers)
    .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)));

  logActivity({
    orgId,
    action: "customer.delete",
    entityType: "customer",
    entityId: customerId,
  }).catch(() => {});

  revalidatePath("/customers");
}
