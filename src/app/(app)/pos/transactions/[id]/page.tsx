import React from "react";
import { db } from "@/lib/db";
import { requirePlan } from "@/lib/require-plan";
import {
  posTransactions,
  posTransactionItems,
  customers,
  organizations,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ReceiptPrintButtons } from "./receipt-print-buttons";

interface Props {
  params: Promise<{ id: string }>;
}

const methodLabels: Record<string, string> = {
  cash: "Contanti",
  card: "Carta",
  transfer: "Bonifico",
  mixed: "Misto",
  other: "Altro",
};

export default async function TransactionReceiptPage({ params }: Props) {
  const { id } = await params;
  const session = await requirePlan("pro");
  const orgId = session.user.organizationId!;

  const [tx] = await db
    .select({
      id: posTransactions.id,
      receiptNumber: posTransactions.receiptNumber,
      totalCents: posTransactions.totalCents,
      paymentMethod: posTransactions.paymentMethod,
      notes: posTransactions.notes,
      createdAt: posTransactions.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(posTransactions)
    .leftJoin(customers, eq(customers.id, posTransactions.customerId))
    .where(and(eq(posTransactions.id, id), eq(posTransactions.organizationId, orgId)))
    .limit(1);

  if (!tx) notFound();

  const items = await db
    .select({
      id: posTransactionItems.id,
      description: posTransactionItems.description,
      quantity: posTransactionItems.quantity,
      unitPriceCents: posTransactionItems.unitPriceCents,
      discountPct: posTransactionItems.discountPct,
      totalCents: posTransactionItems.totalCents,
      imei: posTransactionItems.imei,
      serialNumber: posTransactionItems.serialNumber,
    })
    .from(posTransactionItems)
    .where(eq(posTransactionItems.transactionId, id));

  const [org] = await db
    .select({
      name: organizations.name,
      legalName: organizations.legalName,
      vatNumber: organizations.vatNumber,
      address: organizations.address,
      city: organizations.city,
      postalCode: organizations.postalCode,
      province: organizations.province,
      phone: organizations.phone,
      brandingLogoUrl: organizations.brandingLogoUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const dtFmt = new Intl.DateTimeFormat("it-IT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  });

  const receiptLabel = tx.receiptNumber
    ? `#${String(tx.receiptNumber).padStart(4, "0")}`
    : `—`;

  return (
    <div className="space-y-4">
      {/* Navigazione */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/pos">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Cassa
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Scontrino {receiptLabel}</h1>
        </div>
        <ReceiptPrintButtons transactionId={tx.id} />
      </div>

      {/* Scontrino */}
      <div className="mx-auto max-w-[600px] rounded-lg border bg-white p-6 shadow-sm print:max-w-none print:shadow-none print:border-0 print:p-0">

        {/* Intestazione negozio */}
        <div className="receipt-no-thermal text-center border-b pb-4 mb-4">
          {org?.brandingLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.brandingLogoUrl}
              alt="logo"
              className="receipt-logo mx-auto mb-2 h-12 object-contain"
            />
          )}
          <p className="font-bold text-base">{org?.legalName ?? org?.name}</p>
          {org?.name && org?.legalName && org.name !== org.legalName && (
            <p className="text-sm text-muted-foreground">{org.name}</p>
          )}
          {org?.vatNumber && (
            <p className="text-sm">P.IVA: {org.vatNumber}</p>
          )}
          {(org?.address || org?.city) && (
            <p className="text-sm">
              {[org.address, [org.city, org.postalCode, org.province].filter(Boolean).join(" ")].filter(Boolean).join(" — ")}
            </p>
          )}
          {org?.phone && (
            <p className="text-sm">Tel: {org.phone}</p>
          )}
        </div>

        {/* Numero scontrino e data */}
        <div className="flex justify-between text-sm mb-4">
          <span className="font-mono font-semibold">SCONTRINO {receiptLabel}</span>
          <span className="text-muted-foreground">{dtFmt.format(new Date(tx.createdAt))}</span>
        </div>

        {/* Cliente */}
        {tx.customerName && (
          <div className="text-sm mb-4">
            <span className="text-muted-foreground">Cliente: </span>
            <span className="font-medium">{tx.customerName}</span>
            {tx.customerPhone && <span className="text-muted-foreground ml-2">{tx.customerPhone}</span>}
          </div>
        )}

        {/* Articoli */}
        <table className="w-full text-sm mb-4 receipt-table">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-1 text-left font-medium">Articolo</th>
              <th className="pb-1 text-center font-medium">Qtà</th>
              <th className="pb-1 text-right font-medium">Prezzo</th>
              <th className="pb-1 text-right font-medium">Tot.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                <tr className="border-b last:border-0">
                  <td className="py-1.5 pr-2">
                    <span className="font-medium">{item.description}</span>
                    {item.discountPct > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">−{item.discountPct}%</span>
                    )}
                  </td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right text-muted-foreground">
                    {formatCurrency(item.unitPriceCents)}
                  </td>
                  <td className="py-1.5 text-right font-medium">
                    {formatCurrency(item.totalCents)}
                  </td>
                </tr>
                {(item.imei || item.serialNumber) && (
                  <tr className="border-b last:border-0">
                    <td colSpan={4} className="pb-1.5 text-xs font-mono text-muted-foreground">
                      {item.imei && <span>IMEI: {item.imei}</span>}
                      {item.imei && item.serialNumber && <span className="mx-2">·</span>}
                      {item.serialNumber && <span>S/N: {item.serialNumber}</span>}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Totale */}
        <div className="border-t pt-3 receipt-total">
          <div className="flex justify-between items-baseline">
            <span className="text-base font-semibold">TOTALE</span>
            <span className="text-xl font-bold">{formatCurrency(tx.totalCents)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>Pagamento</span>
            <span>{methodLabels[tx.paymentMethod] ?? tx.paymentMethod}</span>
          </div>
        </div>

        {/* Note */}
        {tx.notes && (
          <div className="mt-3 rounded border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {tx.notes}
          </div>
        )}

        {/* Footer scontrino */}
        <p className="mt-6 text-center text-xs text-muted-foreground">Grazie per il tuo acquisto!</p>
      </div>
    </div>
  );
}
