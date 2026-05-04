import { db } from "@/lib/db";
import { requirePlan } from "@/lib/require-plan";
import { posSessions, posTransactions, users } from "@/db/schema";
import { eq, and, isNotNull, sum, count, desc } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SessionsPage() {
  const session = await requirePlan("pro");
  const orgId = session.user.organizationId!;

  // Sessioni chiuse, più recenti prima
  const closedSessions = await db
    .select({
      id: posSessions.id,
      openedAt: posSessions.openedAt,
      closedAt: posSessions.closedAt,
      openingCashCents: posSessions.openingCashCents,
      closingCashCents: posSessions.closingCashCents,
      notes: posSessions.notes,
      zReportPrintedAt: posSessions.zReportPrintedAt,
      openedByName: users.name,
    })
    .from(posSessions)
    .leftJoin(users, eq(users.id, posSessions.openedBy))
    .where(and(eq(posSessions.organizationId, orgId), isNotNull(posSessions.closedAt)))
    .orderBy(desc(posSessions.closedAt))
    .limit(50);

  // Totali per ogni sessione
  const sessionIds = closedSessions.map((s) => s.id);
  type SessionTotals = { cash: number; card: number; other: number; txCount: number };
  const totalsMap: Record<string, SessionTotals> = {};

  for (const sid of sessionIds) {
    const rows = await db
      .select({
        paymentMethod: posTransactions.paymentMethod,
        total: sum(posTransactions.totalCents),
        qty: count(),
      })
      .from(posTransactions)
      .where(
        and(
          eq(posTransactions.sessionId, sid),
          eq(posTransactions.organizationId, orgId),
          eq(posTransactions.status, "completed"),
        )
      )
      .groupBy(posTransactions.paymentMethod);

    let cash = 0, card = 0, other = 0, txCount = 0;
    for (const r of rows) {
      const amt = Number(r.total ?? 0);
      txCount += Number(r.qty ?? 0);
      if (r.paymentMethod === "cash") cash += amt;
      else if (r.paymentMethod === "card") card += amt;
      else other += amt;
    }
    totalsMap[sid] = { cash, card, other, txCount };
  }

  const dtFmt = new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/pos">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Cassa
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Storico sessioni cassa</h1>
      </div>

      {closedSessions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-2 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-medium">Nessuna sessione chiusa</p>
            <p className="text-sm text-muted-foreground">Le sessioni compariranno qui dopo la chiusura giornaliera.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {closedSessions.map((s) => {
            const t = totalsMap[s.id] ?? { cash: 0, card: 0, other: 0, txCount: 0 };
            const grandTotal = t.cash + t.card + t.other;
            const expectedCash = s.openingCashCents + t.cash;
            const diff = s.closingCashCents != null ? s.closingCashCents - expectedCash : null;
            return (
              <Card key={s.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">
                          {s.openedAt ? dtFmt.format(new Date(s.openedAt)) : "—"}
                        </span>
                        <span className="text-muted-foreground text-xs">→</span>
                        <span className="font-medium text-sm">
                          {s.closedAt ? dtFmt.format(new Date(s.closedAt)) : "—"}
                        </span>
                        {s.openedByName && (
                          <span className="text-xs text-muted-foreground">· {s.openedByName}</span>
                        )}
                        {s.zReportPrintedAt && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Printer className="h-3 w-3" />Stampato
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Transazioni: </span>
                          <span className="font-medium">{t.txCount}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Totale: </span>
                          <span className="font-medium">{formatCurrency(grandTotal)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Contanti: </span>
                          <span className="font-medium">{formatCurrency(t.cash)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Carta: </span>
                          <span className="font-medium">{formatCurrency(t.card)}</span>
                        </div>
                        {t.other > 0 && (
                          <div>
                            <span className="text-muted-foreground">Altro: </span>
                            <span className="font-medium">{formatCurrency(t.other)}</span>
                          </div>
                        )}
                      </div>
                      {diff !== null && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Differenza cassa: </span>
                          <span className={diff === 0 ? "text-green-600 font-medium" : diff > 0 ? "text-blue-600 font-medium" : "text-destructive font-medium"}>
                            {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                          </span>
                        </div>
                      )}
                      {s.notes && (
                        <p className="text-xs text-muted-foreground italic">Note: {s.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/pos/sessions/${s.id}/report-z`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Printer className="h-3.5 w-3.5" />Report Z
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
