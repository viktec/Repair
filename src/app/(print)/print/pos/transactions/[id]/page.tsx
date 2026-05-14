import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { posTransactions, posTransactionItems, customers, organizations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { PrintButton } from "./print-button";

const methodLabels: Record<string, string> = {
  cash: "Contanti",
  card: "Carta",
  transfer: "Bonifico",
  mixed: "Misto",
  other: "Altro",
};

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}

export default async function PosPrintPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { format } = await searchParams;
  const isThermal = format === "thermal";

  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

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
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  });

  const receiptLabel = tx.receiptNumber
    ? `#${String(tx.receiptNumber).padStart(4, "0")}`
    : "—";

  const orgName = org?.legalName ?? org?.name ?? "Centro Riparazioni";
  const orgAddress = [org?.address, [org?.city, org?.postalCode, org?.province].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  // ── Termica 58mm ─────────────────────────────────────────────────────────────
  if (isThermal) {
    return (
      <>
        <style>{`@page { size: 58mm auto; margin: 0; }`}</style>
        <div className="print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-white px-4 py-2 shadow-sm text-sm">
          <a href={`/pos/transactions/${id}`} className="text-muted-foreground hover:underline text-xs">← Torna</a>
          <PrintButton label="Stampa" />
        </div>
        <div style={{ width: "58mm", padding: "3mm", fontFamily: "monospace", fontSize: 11, marginTop: 44 }} className="print:mt-0">
          {/* Intestazione negozio */}
          <p style={{ textAlign: "center", fontWeight: "bold", fontSize: 13 }}>{orgName}</p>
          {org?.phone && <p style={{ textAlign: "center", fontSize: 10 }}>{org.phone}</p>}
          {orgAddress && <p style={{ textAlign: "center", fontSize: 10 }}>{orgAddress}</p>}
          {org?.vatNumber && <p style={{ textAlign: "center", fontSize: 10 }}>P.IVA: {org.vatNumber}</p>}

          {/* Numero e data */}
          <p style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", margin: "4px 0", padding: "2px 0", fontWeight: "bold", textAlign: "center" }}>
            SCONTRINO {receiptLabel}
          </p>
          <p style={{ fontSize: 10 }}>{dtFmt.format(new Date(tx.createdAt))}</p>

          {/* Cliente */}
          {tx.customerName && (
            <p style={{ borderTop: "1px dashed #000", marginTop: 4, paddingTop: 4 }}>
              <strong>Cliente:</strong> {tx.customerName}
              {tx.customerPhone ? ` — ${tx.customerPhone}` : ""}
            </p>
          )}

          {/* Articoli */}
          <div style={{ borderTop: "1px dashed #000", marginTop: 4, paddingTop: 4 }}>
            {items.map((item) => (
              <div key={item.id} style={{ marginBottom: 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{item.quantity}x {item.description}{item.discountPct > 0 ? ` -${item.discountPct}%` : ""}</span>
                  <span>{formatCurrency(item.totalCents)}</span>
                </div>
                {item.imei && <div style={{ fontSize: 9 }}>IMEI: {item.imei}</div>}
                {item.serialNumber && <div style={{ fontSize: 9 }}>S/N: {item.serialNumber}</div>}
              </div>
            ))}
          </div>

          {/* Totale */}
          <p style={{ borderTop: "1px dashed #000", marginTop: 4, paddingTop: 4, display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 13 }}>
            <span>TOTALE</span>
            <span>{formatCurrency(tx.totalCents)}</span>
          </p>
          <p style={{ fontSize: 10 }}>Pagamento: {methodLabels[tx.paymentMethod] ?? tx.paymentMethod}</p>

          {/* Note */}
          {tx.notes && <p style={{ borderTop: "1px dashed #000", marginTop: 4, paddingTop: 4, fontSize: 10 }}>{tx.notes}</p>}

          {/* Footer */}
          <p style={{ borderTop: "1px dashed #000", marginTop: 8, paddingTop: 4, textAlign: "center", fontSize: 9 }}>
            Grazie per il tuo acquisto!
          </p>
        </div>
      </>
    );
  }

  // ── A4 ───────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-white px-4 py-2 shadow-sm text-sm">
        <a href={`/pos/transactions/${id}`} className="text-muted-foreground hover:underline text-xs">← Torna</a>
        <PrintButton label="Stampa / Salva PDF" />
      </div>
      <div style={{ maxWidth: 560, margin: "60px auto 0", padding: "24px", fontFamily: "sans-serif", fontSize: 14 }} className="print:mt-0 print:max-w-none print:p-6">
        {/* Intestazione negozio */}
        <div style={{ textAlign: "center", borderBottom: "1px solid #eee", paddingBottom: 12, marginBottom: 12 }}>
          {org?.brandingLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.brandingLogoUrl} alt="logo" style={{ height: 48, objectFit: "contain", margin: "0 auto 8px", display: "block" }} />
          )}
          <p style={{ fontWeight: "bold", fontSize: 16 }}>{orgName}</p>
          {org?.name && org?.legalName && org.name !== org.legalName && (
            <p style={{ fontSize: 12, color: "#666" }}>{org.name}</p>
          )}
          {org?.vatNumber && <p style={{ fontSize: 12 }}>P.IVA: {org.vatNumber}</p>}
          {orgAddress && <p style={{ fontSize: 12 }}>{orgAddress}</p>}
          {org?.phone && <p style={{ fontSize: 12 }}>Tel: {org.phone}</p>}
        </div>

        {/* Numero e data */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13 }}>
          <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>SCONTRINO {receiptLabel}</span>
          <span style={{ color: "#666" }}>{dtFmt.format(new Date(tx.createdAt))}</span>
        </div>

        {/* Cliente */}
        {tx.customerName && (
          <p style={{ marginBottom: 12, fontSize: 13 }}>
            <span style={{ color: "#666" }}>Cliente: </span>
            <strong>{tx.customerName}</strong>
            {tx.customerPhone && <span style={{ color: "#666", marginLeft: 8 }}>{tx.customerPhone}</span>}
          </p>
        )}

        {/* Tabella articoli */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ddd", color: "#888", fontSize: 11, textTransform: "uppercase" }}>
              <th style={{ textAlign: "left", paddingBottom: 4 }}>Articolo</th>
              <th style={{ textAlign: "center", paddingBottom: 4 }}>Qtà</th>
              <th style={{ textAlign: "right", paddingBottom: 4 }}>Prezzo</th>
              <th style={{ textAlign: "right", paddingBottom: 4 }}>Tot.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <>
                <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "6px 4px 6px 0" }}>
                    <span style={{ fontWeight: 500 }}>{item.description}</span>
                    {item.discountPct > 0 && <span style={{ color: "#888", fontSize: 11, marginLeft: 4 }}>−{item.discountPct}%</span>}
                  </td>
                  <td style={{ textAlign: "center", padding: "6px 4px" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", padding: "6px 4px", color: "#666" }}>{formatCurrency(item.unitPriceCents)}</td>
                  <td style={{ textAlign: "right", padding: "6px 0 6px 4px", fontWeight: 500 }}>{formatCurrency(item.totalCents)}</td>
                </tr>
                {(item.imei || item.serialNumber) && (
                  <tr key={`${item.id}-s`} style={{ borderBottom: "1px solid #eee" }}>
                    <td colSpan={4} style={{ paddingBottom: 6, fontFamily: "monospace", fontSize: 11, color: "#666" }}>
                      {item.imei && `IMEI: ${item.imei}`}
                      {item.imei && item.serialNumber && " · "}
                      {item.serialNumber && `S/N: ${item.serialNumber}`}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {/* Totale */}
        <div style={{ borderTop: "2px solid #000", paddingTop: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 18 }}>
            <span>TOTALE</span>
            <span>{formatCurrency(tx.totalCents)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginTop: 4 }}>
            <span>Pagamento</span>
            <span>{methodLabels[tx.paymentMethod] ?? tx.paymentMethod}</span>
          </div>
        </div>

        {/* Note */}
        {tx.notes && (
          <p style={{ background: "#f5f5f5", padding: "8px 12px", borderRadius: 4, fontSize: 12, color: "#555", marginTop: 8 }}>{tx.notes}</p>
        )}

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#888" }}>Grazie per il tuo acquisto!</p>
      </div>
    </>
  );
}
