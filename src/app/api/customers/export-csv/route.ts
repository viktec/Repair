import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, tickets } from "@/db/schema";
import { eq, count, isNull, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const orgId = session.user.organizationId;

  const rows = await db
    .select({
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      gdprConsentAt: customers.gdprConsentAt,
      createdAt: customers.createdAt,
      ticketCount: count(tickets.id),
    })
    .from(customers)
    .leftJoin(tickets, and(eq(tickets.customerId, customers.id), isNull(tickets.deletedAt)))
    .where(eq(customers.organizationId, orgId))
    .groupBy(customers.id)
    .orderBy(customers.name);

  const header = ["Nome", "Telefono", "Email", "Consenso GDPR", "N° Ticket", "Data registrazione"];

  const lines = rows.map((r) => [
    `"${(r.name ?? "").replace(/"/g, '""')}"`,
    r.phone ?? "",
    r.email ?? "",
    r.gdprConsentAt ? new Date(r.gdprConsentAt).toLocaleDateString("it-IT") : "No",
    String(r.ticketCount),
    r.createdAt ? new Date(r.createdAt).toLocaleDateString("it-IT") : "",
  ].join(";"));

  const csv = [header.join(";"), ...lines].join("\r\n");
  const bom = "﻿";

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clienti-${new Date().getFullYear()}.csv"`,
    },
  });
}
