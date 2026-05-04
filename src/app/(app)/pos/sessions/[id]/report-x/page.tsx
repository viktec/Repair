import { db } from "@/lib/db";
import { requirePlan } from "@/lib/require-plan";
import { posSessions, posTransactions, users } from "@/db/schema";
import { eq, and, isNull, sum, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PrintButton } from "../../print-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReportXPage({ params }: Props) {
  const { id } = await params;
  const session = await requirePlan("pro");
  const orgId = session.user.organizationId!;

  const [posSession] = await db
    .select({
      id: posSessions.id,
      openedAt: posSessions.openedAt,
      closedAt: posSessions.closedAt,
      openingCashCents: posSessions.openingCashCents,
      openedByName: users.name,
    })
    .from(posSessions)
    .leftJoin(users, eq(users.id, posSessions.openedBy))
    .where(and(eq(posSessions.id, id), eq(posSessions.organizationId, orgId)))
    .limit(1);

  if (!posSession) notFound();

  const rows = await db
    .select({
      paymentMethod: posTransactions.paymentMethod,
      total: sum(posTransactions.totalCents),
      qty: count(),
    })
    .from(posTransactions)
    .where(
      and(
        eq(posTransactions.sessionId, id),
        eq(posTransactions.organizationId, orgId),
        eq(posTransactions.status, "completed"),
      )
    )
    .groupBy(posTransactions.paymentMethod);

  const methodLabels: Record<string, string> = {
    cash: "Contanti",
    card: "Carta",
    transfer: "Bonifico",
    mixed: "Misto",
    other: "Altro",
  };

  let totalCash = 0, totalCard = 0, totalOther = 0, totalCount = 0;
  for (const r of rows) {
    const amt = Number(r.total ?? 0);
    totalCount += Number(r.qty ?? 0);
    if (r.paymentMethod === "cash") totalCash += amt;
    else if (r.paymentMethod === "card") totalCard += amt;
    else totalOther += amt;
  }

  const grandTotal = totalCash + totalCard + totalOther;
  const estimatedBalance = posSession.openingCashCents + totalCash;

  const isOpen = !posSession.closedAt;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3 print:hidden">
        <Link href="/pos">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Cassa
          </Button>
        </Link>
        <h1 className="text-xl font-bold">
          Report X — Situazione corrente
        </h1>
        <Badge variant={isOpen ? "default" : "secondary"}>
          {isOpen ? "Cassa aperta" : "Chiusa"}
        </Badge>
      </div>

      <div className="print:block">
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold">Report X — Situazione cassa</h1>
          <p className="text-sm text-muted-foreground">
            Generato il {new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeStyle: "short" }).format(new Date())}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riepilogo sessione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Apertura cassa</span>
              <span>{new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(new Date(posSession.openedAt))}</span>
            </div>
            {posSession.openedByName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Aperta da</span>
                <span>{posSession.openedByName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fondo cassa iniziale</span>
              <span className="font-medium">{formatCurrency(posSession.openingCashCents)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Incassi per metodo di pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2">Metodo</th>
                  <th className="pb-2 text-center">N. transazioni</th>
                  <th className="pb-2 text-right">Totale</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground">Nessuna transazione</td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.paymentMethod} className="border-b last:border-0">
                      <td className="py-2">{methodLabels[r.paymentMethod] ?? r.paymentMethod}</td>
                      <td className="py-2 text-center">{r.qty}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(Number(r.total ?? 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="pt-2">Totale</td>
                  <td className="pt-2 text-center">{totalCount}</td>
                  <td className="pt-2 text-right">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Saldo cassa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fondo iniziale</span>
              <span>{formatCurrency(posSession.openingCashCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">+ Contanti incassati</span>
              <span>{formatCurrency(totalCash)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2 text-base">
              <span>Saldo stimato</span>
              <span>{formatCurrency(estimatedBalance)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
