import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inventoryItems } from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { LabelsPrintClient } from "./labels-print-client";

export default async function PrintLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;

  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const ids = (idsParam ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (ids.length === 0) notFound();

  const items = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      sellPriceCents: inventoryItems.sellPriceCents,
      category: inventoryItems.category,
    })
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.organizationId, orgId),
        isNull(inventoryItems.deletedAt),
        inArray(inventoryItems.id, ids),
      ),
    );

  if (items.length === 0) notFound();

  const labelItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku ?? null,
    sellPriceCents: item.sellPriceCents ?? null,
    category: item.category ?? null,
    barcodeValue: item.sku ?? item.id.replace(/-/g, "").substring(0, 16).toUpperCase(),
    priceFormatted: item.sellPriceCents != null ? formatCurrency(item.sellPriceCents) : null,
  }));

  return <LabelsPrintClient items={labelItems} />;
}
