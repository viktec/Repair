import { db } from "@/lib/db";
import { requirePlan } from "@/lib/require-plan";
import { posSessions, posTransactions, users, organizations } from "@/db/schema";
import { eq, and, sum, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { PrintButton } from "../../print-button";
import { MarkZPrintedButton } from "./mark-z-printed-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReportZPage({ params }: Props) {
  const { id } = await params;
  const session = await requirePlan("pro");
  const orgId = session.user.organizationId!;

  const [posSession] = await db
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
    .where(and(eq(posSessions.id, id), eq(posSessions.organizationId, orgId)))
    .limit(1);

  if (!posSession) notFound();

  // Solo sessioni chiuse possono avere il report Z
  if (!posSession.closedAt) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3 print:hidden">
          <Link href="/pos">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />Cassa
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Report Z</h1>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-800 font-medium">Sessione ancora aperta</p>
            <p className="text-sm text-amber-700 mt-1">Il Report Z è disponibile solo dopo la chiusura della cassa.</p>
            <div className="mt-4">
              <Link href={`/pos/sessions/${id}/report-x`}>
                <Button variant="outline" size="sm">Visualizza Report X (situazione corrente)</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [org] = await db
    .select({ name: organizations.name, vatNumber: organizations.vatNumber, address: organizations.address, city: organizations.city })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

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
  const expectedCash = posSession.openingCashCents + totalCash;
  const diff = posSession.closingCashCents != null ? posSession.closingCashCents - expectedCash : null;

  const dtFmt = new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeStyle: "short" });
  const dtShort = new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Navigazione — nascosta in stampa */}
      <div className="flex items-center gap-3 print:hidden">
        <Link href="/pos/sessions">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Storico
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Report Z — Chiusura cassa</h1>
        <Badge variant="secondary">Sessione chiusa</Badge>
        {posSession.zReportPrintedAt && (
          <Badge variant="outline" className="text-xs">Stampato</Badge>
        )}
      </div>

      {/* Contenuto stampabile */}
      <div className="print:block">
        {/* Intestazione visibile solo in stampa */}
        <div className="hidden print:block mb-6 border-b pb-4">
          {org && (
            <>
              <h2 className="text-lg font-bold">{org.name}</h2>
              {org.vatNumber && <p className="text-sm">P.IVA: {org.vatNumber}</p>}
              {(org.address || org.city) && (
                <p className="text-sm">{[org.address, org.city].filter(Boolean).join(" — ")}</p>
              )}
            </>
          )}
          <h1 className="text-2xl font-bold mt-3">REPORT Z — CHIUSURA CASSA</h1>
          <p className="text-sm text-muted-foreground">
            Stampato il {dtFmt.format(new Date())}
          </p>
        </div>

        {/* Dati sessione */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dati sessione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Apertura cassa</span>
              <span>{dtShort.format(new Date(posSession.openedAt))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chiusura cassa</span>
              <span>{posSession.closedAt ? dtShort.format(new Date(posSession.closedAt)) : "—"}</span>
            </div>
            {posSession.openedByName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operatore</span>
                <span>{posSession.openedByName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fondo cassa iniziale</span>
              <span className="font-medium">{formatCurrency(posSession.openingCashCents)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Incassi per metodo */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Incassi per metodo di pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2">Metodo</th>
                  <th className="pb-2 text-center">Transazioni</th>
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
                  <td className="pt-2">Totale generale</td>
                  <td className="pt-2 text-center">{totalCount}</td>
                  <td className="pt-2 text-right">{formatCurrency(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        {/* Quadratura cassa */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Quadratura cassa contanti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fondo cassa iniziale</span>
              <span>{formatCurrency(posSession.openingCashCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">+ Contanti incassati</span>
              <span>{formatCurrency(totalCash)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">= Cassa attesa</span>
              <span className="font-medium">{formatCurrency(expectedCash)}</span>
            </div>
            {posSession.closingCashCents != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cassa contata</span>
                <span className="font-medium">{formatCurrency(posSession.closingCashCents)}</span>
              </div>
            )}
            {diff !== null && (
              <div className="flex justify-between border-t pt-2 font-semibold text-base">
                <span>Differenza</span>
                <span className={diff === 0 ? "text-green-600" : diff > 0 ? "text-blue-600" : "text-destructive"}>
                  {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                </span>
              </div>
            )}
            {posSession.notes && (
              <div className="mt-2 rounded border bg-muted/40 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">Note: </span>
                <span className="text-xs">{posSession.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Firma — solo stampa */}
        <div className="hidden print:flex mt-12 gap-16 text-sm">
          <div>
            <div className="border-t border-black w-48 pt-1 mt-8">Firma operatore</div>
          </div>
          <div>
            <div className="border-t border-black w-48 pt-1 mt-8">Firma responsabile</div>
          </div>
        </div>
      </div>

      {/* Azioni — nascoste in stampa */}
      <div className="flex gap-2 justify-end print:hidden">
        <MarkZPrintedButton sessionId={id} alreadyPrinted={!!posSession.zReportPrintedAt} />
        <PrintButton label="Stampa Report Z" />
      </div>
    </div>
  );
}
