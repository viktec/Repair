import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suppliers, inventoryItems } from "@/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewOrderForm } from "./new-order-form";

export default async function NewOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ itemIds?: string }>;
}) {
  const { id } = await params;
  const { itemIds } = await searchParams;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [supplier] = await db
    .select({ id: suppliers.id, name: suppliers.name })
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, orgId), isNull(suppliers.deletedAt)))
    .limit(1);
  if (!supplier) notFound();

  const prefilledIds = itemIds
    ? itemIds.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const [inventoryList, prefilledItems] = await Promise.all([
    db
      .select({ id: inventoryItems.id, name: inventoryItems.name, sku: inventoryItems.sku, costPriceCents: inventoryItems.costPriceCents })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.organizationId, orgId), isNull(inventoryItems.deletedAt)))
      .orderBy(inventoryItems.name),
    prefilledIds.length > 0
      ? db
          .select({ id: inventoryItems.id, name: inventoryItems.name, costPriceCents: inventoryItems.costPriceCents, quantity: inventoryItems.quantity, minQuantity: inventoryItems.minQuantity })
          .from(inventoryItems)
          .where(and(
            eq(inventoryItems.organizationId, orgId),
            isNull(inventoryItems.deletedAt),
            inArray(inventoryItems.id, prefilledIds),
          ))
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/suppliers/${id}`}>
          <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />{supplier.name}</Button>
        </Link>
        <h1 className="text-xl font-bold">Nuovo ordine d&apos;acquisto</h1>
      </div>
      {prefilledItems.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {prefilledItems.length} articoli pre-compilati dal magazzino
        </div>
      )}
      <NewOrderForm
        supplierId={id}
        inventoryItems={inventoryList}
        prefilledItems={prefilledItems.map((it) => ({
          itemId: it.id,
          description: it.name,
          qty: Math.max(1, (it.minQuantity ?? 0) - (it.quantity ?? 0)),
          unitCost: it.costPriceCents != null ? (it.costPriceCents / 100).toFixed(2) : "",
        }))}
      />
    </div>
  );
}
