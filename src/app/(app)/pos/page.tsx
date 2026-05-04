import Link from "next/link";
import { db } from "@/lib/db";
import { requirePlan } from "@/lib/require-plan";
import { posTransactions, customers, posSessions, users } from "@/db/schema";
import { eq, and, desc, sum, count, isNull } from "drizzle-orm";
import { ShoppingCart, Plus, History, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OpenSessionButton, CloseSessionButton } from "./pos-client";

export default async function PosPage() {
  const session = await requirePlan("pro");
  const orgId = session.user.organizationId!;

  // Sessione aperta corrente
  const [activeSession] = await db
    .select({
      id: posSessions.id,
      openedAt: posSessions.openedAt,
      openingCashCents: posSessions.openingCashCents,
      openedByName: users.name,
    })
    .from(posSessions)
    .leftJoin(users, eq(users.id, posSessions.openedBy))
    .where(and(eq(posSessions.organizationId, orgId), isNull(posSessions.closedAt)))
    .limit(1);

  // Totali sessione corrente per metodo pagamento
  let sessionTotals: { cash: number; card: number; other: number; count: number } = { cash: 0, card: 0, other: 0, count: 0 };

  if (activeSession) {
    const rows = await db
      .select({
        paymentMethod: posTransactions.paymentMethod,
        total: sum(posTransactions.totalCents),
        qty: count(),
      })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.sessionId, activeSession.id),
          eq(posTransactions.organizationId, orgId),
          eq(posTransactions.status, "completed"),
        )
      )
      .groupBy(posTransactions.paymentMethod);

    for (const r of rows) {
      const amt = Number(r.total ?? 0);
      sessionTotals.count += Number(r.qty ?? 0);
      if (r.paymentMethod === "cash") sessionTotals.cash += amt;
      else if (r.paymentMethod === "card") sessionTotals.card += amt;
      else sessionTotals.other += amt;
    }
  }

  // Ultime 20 transazioni
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

  const totalCashCents = sessionTotals.cash;
  const estimatedCashBalance = activeSession
    ? activeSession.openingCashCents + totalCashCents
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cassa POS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestione incassi e transazioni</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pos/sessions">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <History className="h-4 w-4" />Storico
            </Button>
          </Link>
          {activeSession && (
            <Link href={`/pos/sessions/${activeSession.id}/report-x`}>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <BarChart2 className="h-4 w-4" />Report X
              </Button>
            </Link>
          )}
          <Link href="/pos/new">
            <Button className="gap-2 w-full sm:w-auto" disabled={!activeSession}>
              <Plus className="h-4 w-4" />Nuova vendita
            </Button>
          </Link>
        </div>
      </div>

      {/* Stato sessione */}
      {!activeSession ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Cassa chiusa</Badge>
              <p className="text-sm text-muted-foreground">Apri la cassa per registrare nuove vendite.</p>
            </div>
            <OpenSessionButton />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-green-500/15 text-green-700 border-green-500/30">Cassa aperta</Badge>
              <span className="text-sm text-muted-foreground">
                Dal {formatDate(activeSession.openedAt)}
                {activeSession.openedByName ? ` · ${activeSession.openedByName}` : ""}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Fondo iniziale</p>
                <p className="font-semibold">{formatCurrency(activeSession.openingCashCents)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contanti incassati</p>
                <p className="font-semibold">{formatCurrency(sessionTotals.cash)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carta</p>
                <p className="font-semibold">{formatCurrency(sessionTotals.card)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo cassa stimato</p>
                <p className="font-semibold">{formatCurrency(estimatedCashBalance)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link href={`/pos/sessions/${activeSession.id}/report-x`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart2 className="h-4 w-4" />Report X (situazione corrente)
                </Button>
              </Link>
              <CloseSessionButton
                sessionId={activeSession.id}
                openingCashCents={activeSession.openingCashCents}
                totalCashCents={totalCashCents}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiche totale */}
      {activeSession && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Totale incassato (sessione)</p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {formatCurrency(sessionTotals.cash + sessionTotals.card + sessionTotals.other)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Transazioni (sessione)</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{sessionTotals.count}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ultime transazioni */}
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
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm min-w-[480px] px-6">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
