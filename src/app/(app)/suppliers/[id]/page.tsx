import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suppliers, inventoryItems } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.organizationId, orgId), isNull(suppliers.deletedAt)))
    .limit(1);
  if (!supplier) notFound();

  const items = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      sku: inventoryItems.sku,
      quantity: inventoryItems.quantity,
      sellPriceCents: inventoryItems.sellPriceCents,
    })
    .from(inventoryItems)
    .where(and(eq(inventoryItems.supplierId, id), eq(inventoryItems.organizationId, orgId), isNull(inventoryItems.deletedAt)))
    .orderBy(inventoryItems.name);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/suppliers">
          <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" />Fornitori</Button>
        </Link>
        <h1 className="text-xl font-bold">{supplier.name}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Contatti</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {supplier.email && (
                <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Mail className="h-4 w-4" />{supplier.email}
                </a>
              )}
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />{supplier.phone}
                </a>
              )}
              {supplier.website && (
                <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                  <Globe className="h-4 w-4" />{supplier.website}
                </a>
              )}
              {supplier.address && <p className="text-muted-foreground">{supplier.address}</p>}
              {supplier.notes && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Note</p>
                  <p>{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ricambi associati ({items.length})
                </CardTitle>
                <Link href="/inventory/new">
                  <Button size="sm" variant="outline">+ Aggiungi ricambio</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nessun ricambio associato a questo fornitore.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2">Articolo</th>
                      <th className="pb-2 text-center">Giacenza</th>
                      <th className="pb-2 text-right">Prezzo vendita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2">
                          <Link href={`/inventory/${item.id}`} className="font-medium hover:underline">{item.name}</Link>
                          {item.sku && <p className="text-xs font-mono text-muted-foreground">{item.sku}</p>}
                        </td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">{item.sellPriceCents != null ? formatCurrency(item.sellPriceCents) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
