import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suppliers, inventoryItems } from "@/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function SuppliersPage() {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const rows = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      email: suppliers.email,
      phone: suppliers.phone,
      createdAt: suppliers.createdAt,
    })
    .from(suppliers)
    .where(and(eq(suppliers.organizationId, orgId), isNull(suppliers.deletedAt)))
    .orderBy(suppliers.name);

  const itemCounts = await db
    .select({ supplierId: inventoryItems.supplierId, total: count() })
    .from(inventoryItems)
    .where(and(eq(inventoryItems.organizationId, orgId), isNull(inventoryItems.deletedAt)))
    .groupBy(inventoryItems.supplierId);
  const countMap = new Map(itemCounts.map((r) => [r.supplierId, r.total]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fornitori</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rows.length} fornitori</p>
        </div>
        <Link href="/suppliers/new">
          <Button className="gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" />Nuovo fornitore</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Truck className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold">Nessun fornitore</h2>
            <Link href="/suppliers/new" className="mt-4">
              <Button className="gap-2"><Plus className="h-4 w-4" />Aggiungi fornitore</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Fornitore</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telefono</th>
                <th className="px-4 py-3 text-center">Ricambi</th>
                <th className="px-4 py-3">Aggiunto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-center">{countMap.get(s.id) ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/suppliers/${s.id}`}>
                      <Button variant="outline" size="sm">Apri</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
