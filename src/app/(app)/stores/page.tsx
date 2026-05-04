import { db } from "@/lib/db";
import { requirePlan } from "@/lib/require-plan";
import { stores, tickets } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteStoreButton } from "./delete-button";

export default async function StoresPage() {
  const session = await requirePlan("business");
  const orgId = session.user.organizationId!;

  const rows = await db
    .select({
      id: stores.id,
      name: stores.name,
      address: stores.address,
      phone: stores.phone,
      email: stores.email,
      isDefault: stores.isDefault,
    })
    .from(stores)
    .where(eq(stores.organizationId, orgId))
    .orderBy(stores.name);

  const ticketCounts = await db
    .select({ storeId: tickets.storeId, total: count() })
    .from(tickets)
    .where(eq(tickets.organizationId, orgId))
    .groupBy(tickets.storeId);
  const countMap = new Map(ticketCounts.map((r) => [r.storeId, r.total]));

  const isOwner = session.user.role === "owner";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sedi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "sede" : "sedi"}
          </p>
        </div>
        {isOwner && (
          <Link href="/stores/new">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Aggiungi sede
            </Button>
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Store className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold">Nessuna sede</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aggiungi la prima sede per iniziare a organizzare il lavoro per punto vendita.
            </p>
            {isOwner && (
              <Link href="/stores/new" className="mt-4">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Aggiungi sede
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Nome sede</th>
                <th className="px-4 py-3">Indirizzo</th>
                <th className="px-4 py-3">Telefono</th>
                <th className="px-4 py-3 text-center">Ticket</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium">
                    {s.name}
                    {s.isDefault && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Principale
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.address ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-center">{countMap.get(s.id) ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {isOwner && (
                        <>
                          <Link href={`/stores/${s.id}/edit`}>
                            <Button variant="outline" size="sm">Modifica</Button>
                          </Link>
                          <DeleteStoreButton
                            storeId={s.id}
                            storeName={s.name}
                            ticketCount={countMap.get(s.id) ?? 0}
                          />
                        </>
                      )}
                    </div>
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
