import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inventoryItems, suppliers } from "@/db/schema";
import { eq, and, isNull, ilike, or, lte, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Package, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { can } from "@/lib/permissions";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; low?: string }>;
}) {
  const { q, low } = await searchParams;
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  if (!can.accessInventory(session.user.role)) redirect("/dashboard");
  const orgId = session.user.organizationId;

  const conditions = [eq(inventoryItems.organizationId, orgId), isNull(inventoryItems.deletedAt)];
  if (q) {
    conditions.push(
      or(
        ilike(inventoryItems.name, `%${q}%`),
        ilike(inventoryItems.sku, `%${q}%`),
        ilike(inventoryItems.category, `%${q}%`),
        ilike(inventoryItems.compatibleBrands, `%${q}%`),
      )!,
    );
  }
  if (low === "1") conditions.push(lte(inventoryItems.quantity, inventoryItems.minQuantity));

  const items = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      category: inventoryItems.category,
      quantity: inventoryItems.quantity,
      minQuantity: inventoryItems.minQuantity,
      costPriceCents: inventoryItems.costPriceCents,
      sellPriceCents: inventoryItems.sellPriceCents,
      location: inventoryItems.location,
      supplierName: suppliers.name,
    })
    .from(inventoryItems)
    .leftJoin(suppliers, eq(suppliers.id, inventoryItems.supplierId))
    .where(and(...conditions))
    .orderBy(inventoryItems.name);

  const lowStockCount = items.filter((i) => i.quantity <= i.minQuantity).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Magazzino</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} articoli
            {lowStockCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">· {lowStockCount} sotto scorta minima</span>
            )}
          </p>
        </div>
        <Link href="/inventory/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nuovo ricambio
          </Button>
        </Link>
      </div>

      <form method="GET" className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cerca per nome, SKU, categoria, marca..."
            className="w-full rounded-md border border-input bg-white pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm cursor-pointer">
          <input type="checkbox" name="low" value="1" defaultChecked={low === "1"} className="accent-primary" />
          Solo scorta bassa
        </label>
        <Button type="submit" variant="outline" size="sm">Filtra</Button>
        {(q || low) && <Link href="/inventory"><Button type="button" variant="ghost" size="sm">Azzera</Button></Link>}
      </form>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold">{q ? "Nessun risultato" : "Magazzino vuoto"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {q ? "Prova a modificare la ricerca." : "Aggiungi il primo ricambio al magazzino."}
            </p>
            {!q && (
              <Link href="/inventory/new" className="mt-6">
                <Button className="gap-2"><Plus className="h-4 w-4" />Aggiungi ricambio</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Articolo</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-center">Giacenza</th>
                <th className="px-4 py-3">Costo</th>
                <th className="px-4 py-3">Vendita</th>
                <th className="px-4 py-3">Fornitore</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLow = item.quantity <= item.minQuantity;
                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.name}</p>
                      {item.location && <p className="text-xs text-muted-foreground">📍 {item.location}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.category ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`font-bold ${isLow ? "text-red-600" : "text-foreground"}`}>
                          {item.quantity}
                        </span>
                        {isLow && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                      {item.minQuantity > 0 && (
                        <p className="text-[10px] text-muted-foreground">min: {item.minQuantity}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.costPriceCents != null ? formatCurrency(item.costPriceCents) : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.sellPriceCents != null ? formatCurrency(item.sellPriceCents) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{item.supplierName ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/inventory/${item.id}`}>
                        <Button variant="outline" size="sm">Apri</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
