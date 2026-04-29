"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";

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
  if (!session?.user.organizationId) redirect("/login");

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
  if (!session?.user.organizationId) return { error: "Non autenticato" };

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

export async function deleteCustomerAction(customerId: string) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  if (!can.delete(session.user.role)) throw new Error("Non autorizzato");

  await db
    .delete(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.organizationId, session.user.organizationId),
      ),
    );

  revalidatePath("/customers");
}
