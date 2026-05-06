import { requirePlan } from "@/lib/require-plan";
import { db } from "@/lib/db";
import { posSessions, inventoryItems, customers } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PosSellForm } from "./pos-sell-form";

export default async function PosNewPage() {
  const session = await requirePlan("pro");
  const orgId = session.user.organizationId!;

  const [activeSession] = await db
    .select({ id: posSessions.id })
    .from(posSessions)
    .where(and(eq(posSessions.organizationId, orgId), isNull(posSessions.closedAt)))
    .limit(1);

  if (!activeSession) redirect("/pos");

  const [catalogItems, customerList] = await Promise.all([
    db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        sku: inventoryItems.sku,
        sellPriceCents: inventoryItems.sellPriceCents,
        quantity: inventoryItems.quantity,
      })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.organizationId, orgId), isNull(inventoryItems.deletedAt)))
      .orderBy(inventoryItems.name),
    db
      .select({ id: customers.id, name: customers.name, phone: customers.phone })
      .from(customers)
      .where(eq(customers.organizationId, orgId))
      .orderBy(customers.name),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/pos">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Cassa
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Nuova vendita</h1>
      </div>

      <PosSellForm catalogItems={catalogItems} customers={customerList} />
    </div>
  );
}
