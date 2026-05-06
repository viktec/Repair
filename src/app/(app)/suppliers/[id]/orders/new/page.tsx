import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suppliers, inventoryItems } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewOrderForm } from "./new-order-form";

export default async function NewOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [supplier] = await db
    .select({ id: suppliers.id, name: suppliers.name })
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, orgId), isNull(suppliers.deletedAt)))
    .limit(1);
  if (!supplier) notFound();

  const inventoryList = await db
    .select({ id: inventoryItems.id, name: inventoryItems.name, sku: inventoryItems.sku, costPriceCents: inventoryItems.costPriceCents })
    .from(inventoryItems)
    .where(and(eq(inventoryItems.organizationId, orgId), isNull(inventoryItems.deletedAt)))
    .orderBy(inventoryItems.name);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/suppliers/${id}`}>
          <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />{supplier.name}</Button>
        </Link>
        <h1 className="text-xl font-bold">Nuovo ordine d&apos;acquisto</h1>
      </div>
      <NewOrderForm supplierId={id} inventoryItems={inventoryList} />
    </div>
  );
}
