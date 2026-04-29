"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suppliers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createSupplierAction(_prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const name = formData.get("name") as string;
  if (!name?.trim()) return { errors: { name: ["Nome obbligatorio"] } };

  await db.insert(suppliers).values({
    organizationId: session.user.organizationId,
    name,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    address: (formData.get("address") as string) || null,
    website: (formData.get("website") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplierAction(id: string, _prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  await db
    .update(suppliers)
    .set({
      name: formData.get("name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      website: (formData.get("website") as string) || null,
      notes: (formData.get("notes") as string) || null,
      updatedAt: new Date(),
    })
    .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, session.user.organizationId)));

  revalidatePath(`/suppliers/${id}`);
  revalidatePath("/suppliers");
}

export async function deleteSupplierAction(id: string) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  await db
    .update(suppliers)
    .set({ deletedAt: new Date() })
    .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, session.user.organizationId)));

  revalidatePath("/suppliers");
  redirect("/suppliers");
}
