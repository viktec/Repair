import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { usedItemsRegistry } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

const DOC_LABELS: Record<string, string> = {
  carta_identita: "Carta d'identità",
  patente: "Patente",
  passaporto: "Passaporto",
  altro: "Altro",
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const orgId = session.user.organizationId;

  const rows = await db
    .select()
    .from(usedItemsRegistry)
    .where(eq(usedItemsRegistry.organizationId, orgId))
    .orderBy(asc(usedItemsRegistry.counter));

  const header = ["N°", "Data", "Descrizione", "IMEI/Seriale", "Controparte", "Tipo documento", "N° documento", "Acquisto (€)", "Vendita (€)", "Note"];

  const lines = rows.map((r) => [
    String(r.counter).padStart(4, "0"),
    new Date(r.date).toLocaleDateString("it-IT"),
    `"${r.description.replace(/"/g, '""')}"`,
    r.imeiOrSerial ?? "",
    `"${r.counterpartyName.replace(/"/g, '""')}"`,
    DOC_LABELS[r.counterpartyDocType] ?? r.counterpartyDocType,
    r.counterpartyDocNumber,
    r.purchasePriceCents != null ? (r.purchasePriceCents / 100).toFixed(2) : "",
    r.sellPriceCents != null ? (r.sellPriceCents / 100).toFixed(2) : "",
    `"${(r.notes ?? "").replace(/"/g, '""')}"`,
  ].join(";"));

  const csv = [header.join(";"), ...lines].join("\r\n");
  const bom = "﻿";

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registro-usato-${new Date().getFullYear()}.csv"`,
    },
  });
}
