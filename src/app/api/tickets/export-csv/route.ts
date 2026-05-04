import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const orgId = session.user.organizationId;

  const rows = await db
    .select({
      ticketNumber: tickets.ticketNumber,
      createdAt: tickets.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      deviceImei: tickets.deviceImei,
      faultDescription: tickets.faultDescription,
      statusName: ticketStatuses.name,
      estimatedCost: tickets.estimatedCost,
      finalCost: tickets.finalCost,
    })
    .from(tickets)
    .leftJoin(customers, eq(customers.id, tickets.customerId))
    .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
    .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)))
    .orderBy(tickets.ticketNumber);

  const header = ["Numero", "Data", "Cliente", "Telefono", "Marca", "Modello", "IMEI", "Guasto", "Stato", "Preventivo (€)", "Finale (€)"];

  const lines = rows.map((r) => [
    String(r.ticketNumber).padStart(4, "0"),
    r.createdAt ? new Date(r.createdAt).toLocaleDateString("it-IT") : "",
    r.customerName ?? "",
    r.customerPhone ?? "",
    r.deviceBrand ?? "",
    r.deviceModel ?? "",
    r.deviceImei ?? "",
    `"${(r.faultDescription ?? "").replace(/"/g, '""')}"`,
    r.statusName ?? "",
    r.estimatedCost != null ? (r.estimatedCost / 100).toFixed(2) : "",
    r.finalCost != null ? (r.finalCost / 100).toFixed(2) : "",
  ].join(";"));

  const csv = [header.join(";"), ...lines].join("\r\n");
  const bom = "﻿";

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ticket-${new Date().getFullYear()}.csv"`,
    },
  });
}
