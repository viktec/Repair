"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stores, tickets } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasPlan } from "@/lib/permissions";
import { organizations } from "@/db/schema";

async function requireOwnerBusiness() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  if (session.user.role !== "owner") redirect("/stores");

  const [org] = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!hasPlan(org?.plan, "business")) redirect("/upgrade");

  return { orgId };
}

export async function createStoreAction(_prev: unknown, formData: FormData) {
  const { orgId } = await requireOwnerBusiness();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { errors: { name: ["Nome obbligatorio"] } };

  await db.insert(stores).values({
    organizationId: orgId,
    name,
    address: (formData.get("address") as string) || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    isDefault: false,
  });

  revalidatePath("/stores");
  redirect("/stores");
}

export async function updateStoreAction(id: string, _prev: unknown, formData: FormData) {
  const { orgId } = await requireOwnerBusiness();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { errors: { name: ["Nome obbligatorio"] } };

  await db
    .update(stores)
    .set({
      name,
      address: (formData.get("address") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      updatedAt: new Date(),
    })
    .where(and(eq(stores.id, id), eq(stores.organizationId, orgId)));

  revalidatePath("/stores");
  revalidatePath(`/stores/${id}/edit`);
  redirect("/stores");
}

export async function deleteStoreAction(id: string) {
  const { orgId } = await requireOwnerBusiness();

  // Non eliminare se ha ticket associati
  const [ticketCount] = await db
    .select({ total: count() })
    .from(tickets)
    .where(and(eq(tickets.storeId, id), eq(tickets.organizationId, orgId)));

  if ((ticketCount?.total ?? 0) > 0) {
    return { error: "Non puoi eliminare una sede con ticket associati." };
  }

  await db.delete(stores).where(and(eq(stores.id, id), eq(stores.organizationId, orgId)));

  revalidatePath("/stores");
  redirect("/stores");
}
