import { db } from "@/lib/db";
import { requirePlan } from "@/lib/require-plan";
import { stores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { EditStoreForm } from "./form";

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePlan("business");
  if (session.user.role !== "owner") redirect("/stores");

  const orgId = session.user.organizationId!;

  const [store] = await db
    .select()
    .from(stores)
    .where(and(eq(stores.id, id), eq(stores.organizationId, orgId)))
    .limit(1);

  if (!store) notFound();

  return <EditStoreForm store={store} />;
}
