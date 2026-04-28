import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inventoryItems, inventoryMovements, suppliers } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MovementForm } from "./movement-form";

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [item] = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      category: inventoryItems.category,
      compatibleBrands: inventoryItems.compatibleBrands,
      compatibleModels: inventoryItems.compatibleModels,
      barcode: inventoryItems.barcode,
      quantity: inventoryItems.quantity,
      minQuantity: inventoryItems.minQuantity,
      costPriceCents: inventoryItems.costPriceCents,
      sellPriceCents: inventoryItems.sellPriceCents,
      location: inventoryItems.location,
      notes: inventoryItems.notes,
      updatedAt: inventoryItems.updatedAt,
      supplierName: suppliers.name,
    })
    .from(inventoryItems)
    .leftJoin(suppliers, eq(suppliers.id, inventoryItems.supplierId))
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.organizationId, orgId), isNull(inventoryItems.deletedAt)))
    .limit(1);

  if (!item) notFound();

  const movements = await db
    .select()
    .from(inventoryMovements)
    .where(eq(inventoryMovements.itemId, id))
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(50);

  const isLow = item.quantity <= item.minQuantity;

  const movementLabels: Record<string, string> = {
    in: "Carico",
    out: "Scarico",
    adjustment: "Rettifica",
    sale: "Vendita",
    return: "Reso",
  };

  const movementColors: Record<string, string> = {
    in: "text-emerald-600",
    return: "text-emerald-600",
    out: "text-red-600",
    sale: "text-red-600",
    adjustment: "text-blue-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />Magazzino</Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{item.name}</h1>
            {item.sku && <p className="text-sm text-muted-foreground font-mono">{item.sku}</p>}
          </div>
        </div>
        {isLow && (
          <Badge variant="outline" className="gap-1.5 border-amber-300 bg-amber-50 text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Scorta bassa
          </Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Info */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Dettagli</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {item.category && <><dt className="text-muted-foreground">Categoria</dt><dd className="font-medium">{item.category}</dd></>}
                {item.barcode && <><dt className="text-muted-foreground">Barcode</dt><dd className="font-mono text-xs">{item.barcode}</dd></>}
                {item.location && <><dt className="text-muted-foreground">Posizione</dt><dd>{item.location}</dd></>}
                {item.supplierName && <><dt className="text-muted-foreground">Fornitore</dt><dd>{item.supplierName}</dd></>}
                {item.compatibleBrands && <><dt className="text-muted-foreground">Marchi compatibili</dt><dd>{item.compatibleBrands}</dd></>}
                {item.compatibleModels && <><dt className="col-span-2 text-muted-foreground">Modelli compatibili</dt><dd className="col-span-2">{item.compatibleModels}</dd></>}
                {item.notes && <><dt className="col-span-2 text-muted-foreground">Note</dt><dd className="col-span-2">{item.notes}</dd></>}
              </dl>
            </CardContent>
          </Card>

          {/* Movimenti */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Storico movimenti</CardTitle></CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nessun movimento registrato.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2">Tipo</th>
                      <th className="pb-2 text-right">Qty</th>
                      <th className="pb-2">Note</th>
                      <th className="pb-2 text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">
                          <span className={movementColors[m.type] ?? "text-foreground"}>
                            {movementLabels[m.type] ?? m.type}
                          </span>
                        </td>
                        <td className={`py-2 text-right font-mono font-bold ${movementColors[m.type]}`}>
                          {m.type === "out" || m.type === "sale" ? "-" : "+"}{m.quantity}
                        </td>
                        <td className="py-2 text-muted-foreground">{m.notes ?? "—"}</td>
                        <td className="py-2 text-right text-muted-foreground">{formatDate(m.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Giacenza */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Giacenza</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-bold ${isLow ? "text-red-600" : "text-foreground"}`}>
                  {item.quantity}
                </span>
                <span className="text-sm text-muted-foreground mb-1">pezzi</span>
              </div>
              <p className="text-xs text-muted-foreground">Scorta minima: {item.minQuantity}</p>
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prezzo acquisto</span>
                  <span className="font-medium">{item.costPriceCents != null ? formatCurrency(item.costPriceCents) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prezzo vendita</span>
                  <span className="font-medium">{item.sellPriceCents != null ? formatCurrency(item.sellPriceCents) : "—"}</span>
                </div>
                {item.costPriceCents != null && item.sellPriceCents != null && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Margine</span>
                    <span className="font-medium">{formatCurrency(item.sellPriceCents - item.costPriceCents)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Movimento rapido */}
          <MovementForm itemId={item.id} />
        </div>
      </div>
    </div>
  );
}
