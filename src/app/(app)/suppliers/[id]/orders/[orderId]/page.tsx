import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { supplierOrders, supplierOrderItems, suppliers, inventoryItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { OrderActions } from "./order-actions";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:              { label: "Bozza",                color: "bg-slate-100 text-slate-700" },
  ordered:            { label: "Ordinato",             color: "bg-blue-100 text-blue-700" },
  partially_received: { label: "Ricevuto parzialmente", color: "bg-amber-100 text-amber-700" },
  received:           { label: "Ricevuto",             color: "bg-emerald-100 text-emerald-700" },
  cancelled:          { label: "Annullato",            color: "bg-red-100 text-red-700" },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string; orderId: string }> }) {
  const { id: supplierId, orderId } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [order] = await db
    .select()
    .from(supplierOrders)
    .where(and(eq(supplierOrders.id, orderId), eq(supplierOrders.organizationId, orgId)))
    .limit(1);
  if (!order) notFound();

  const [supplier] = await db
    .select({ id: suppliers.id, name: suppliers.name, website: suppliers.website })
    .from(suppliers)
    .where(eq(suppliers.id, supplierId))
    .limit(1);

  const items = await db
    .select({
      id: supplierOrderItems.id,
      description: supplierOrderItems.description,
      quantityOrdered: supplierOrderItems.quantityOrdered,
      quantityReceived: supplierOrderItems.quantityReceived,
      unitCostCents: supplierOrderItems.unitCostCents,
      itemId: supplierOrderItems.itemId,
      itemName: inventoryItems.name,
    })
    .from(supplierOrderItems)
    .leftJoin(inventoryItems, eq(inventoryItems.id, supplierOrderItems.itemId))
    .where(eq(supplierOrderItems.orderId, orderId));

  const s = STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-700" };
  const totalCents = items.reduce((sum, it) => sum + ((it.unitCostCents ?? 0) * it.quantityOrdered), 0);
  const canReceive = order.status === "ordered" || order.status === "partially_received";
  const canMarkOrdered = order.status === "draft";
  const canCancel = order.status === "draft" || order.status === "ordered";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/suppliers/${supplierId}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />{supplier?.name ?? "Fornitore"}
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Ordine d&apos;acquisto</h1>
        <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${s.color}`}>{s.label}</span>
      </div>

      {/* Info ordine */}
      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">Creato il</p>
          <p className="font-medium">{order.createdAt.toLocaleDateString("it-IT")}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">Consegna attesa</p>
          <p className="font-medium">
            {order.expectedAt ? (
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{order.expectedAt.toLocaleDateString("it-IT")}</span>
            ) : "Non specificata"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">Totale stimato</p>
          <p className="font-medium">{totalCents > 0 ? formatCurrency(totalCents) : "—"}</p>
        </div>
      </div>

      {order.notes && (
        <div className="rounded-lg border bg-slate-50 px-4 py-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">Note</p>
          <p>{order.notes}</p>
        </div>
      )}

      {/* Articoli */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Articoli ({items.length})</CardTitle>
            {supplier?.website && order.status !== "cancelled" && (
              <a href={supplier.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                <Package className="h-3.5 w-3.5" />Vai al sito fornitore →
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="pb-2">Articolo</th>
                <th className="pb-2 text-center">Ordinato</th>
                <th className="pb-2 text-center">Ricevuto</th>
                <th className="pb-2 text-right">Costo unit.</th>
                <th className="pb-2 text-right">Totale</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const allReceived = item.quantityReceived >= item.quantityOrdered;
                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2.5">
                      <p className="font-medium">{item.description}</p>
                      {item.itemName && item.itemName !== item.description && (
                        <p className="text-xs text-muted-foreground">→ {item.itemName}</p>
                      )}
                    </td>
                    <td className="py-2.5 text-center">{item.quantityOrdered}</td>
                    <td className="py-2.5 text-center">
                      <span className={`font-medium ${allReceived ? "text-emerald-600" : item.quantityReceived > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {item.quantityReceived}
                        {allReceived && <CheckCircle2 className="h-3.5 w-3.5 inline ml-1" />}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {item.unitCostCents != null ? formatCurrency(item.unitCostCents) : "—"}
                    </td>
                    <td className="py-2.5 text-right font-medium">
                      {item.unitCostCents != null ? formatCurrency(item.unitCostCents * item.quantityOrdered) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Azioni */}
      <OrderActions
        supplierId={supplierId}
        orderId={orderId}
        items={items.map((it) => ({ id: it.id, description: it.description, quantityOrdered: it.quantityOrdered, quantityReceived: it.quantityReceived }))}
        canMarkOrdered={canMarkOrdered}
        canReceive={canReceive}
        canCancel={canCancel}
      />
    </div>
  );
}
