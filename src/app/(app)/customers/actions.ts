"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

export async function deleteCustomerAction(customerId: string) {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");

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
