import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posTransactions, customers, posSessions } from "@/db/schema";
import { eq, and, desc, sum, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ShoppingCart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PosPage() {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySummary] = await db
    .select({ total: sum(posTransactions.totalCents), qty: count() })
    .from(posTransactions)
    .where(and(
      eq(posTransactions.organizationId, orgId),
      eq(posTransactions.status, "completed"),
    ));

  const recent = await db
    .select({
      id: posTransactions.id,
      totalCents: posTransactions.totalCents,
      paymentMethod: posTransactions.paymentMethod,
      status: posTransactions.status,
      receiptNumber: posTransactions.receiptNumber,
      createdAt: posTransactions.createdAt,
      customerName: customers.name,
    })
    .from(posTransactions)
    .leftJoin(customers, eq(customers.id, posTransactions.customerId))
    .where(eq(posTransactions.organizationId, orgId))
    .orderBy(desc(posTransactions.createdAt))
    .limit(20);

  const methodLabels: Record<string, string> = {
    cash: "Contanti",
    card: "Carta",
    transfer: "Bonifico",
    mixed: "Misto",
    other: "Altro",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cassa POS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestione incassi e transazioni</p>
        </div>
        <Link href="/pos/new">
          <Button className="gap-2"><Plus className="h-4 w-4" />Nuova vendita</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Totale incassato</p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {formatCurrency(Number(todaySummary?.total ?? 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Numero transazioni</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{todaySummary?.qty ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Ultime transazioni</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="font-medium">Nessuna transazione</p>
              <p className="text-sm text-muted-foreground mt-1">Registra la prima vendita con il pulsante "Nuova vendita".</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2">Scontrino</th>
                  <th className="pb-2">Cliente</th>
                  <th className="pb-2">Pagamento</th>
                  <th className="pb-2 text-right">Importo</th>
                  <th className="pb-2 text-right">Data</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs text-muted-foreground">
                      {t.receiptNumber ? `#${String(t.receiptNumber).padStart(4, "0")}` : "—"}
                    </td>
                    <td className="py-2">{t.customerName ?? <span className="italic text-muted-foreground/50">—</span>}</td>
                    <td className="py-2 text-muted-foreground">{methodLabels[t.paymentMethod] ?? t.paymentMethod}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(t.totalCents)}</td>
                    <td className="py-2 text-right text-muted-foreground">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
