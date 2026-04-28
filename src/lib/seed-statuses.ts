"use server";

import { db } from "./db";
import { ticketStatuses } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULTS = [
  { name: "In attesa",     color: "#6B7280", sortOrder: 0, isDefault: true,  isFinal: false },
  { name: "Diagnosi",      color: "#F59E0B", sortOrder: 1, isDefault: false, isFinal: false },
  { name: "In riparazione",color: "#3B82F6", sortOrder: 2, isDefault: false, isFinal: false },
  { name: "Pronto",        color: "#10B981", sortOrder: 3, isDefault: false, isFinal: false },
  { name: "Consegnato",    color: "#8B5CF6", sortOrder: 4, isDefault: false, isFinal: true  },
];

export async function ensureDefaultStatuses(orgId: string) {
  const existing = await db
    .select({ id: ticketStatuses.id })
    .from(ticketStatuses)
    .where(eq(ticketStatuses.organizationId, orgId))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(ticketStatuses).values(
    DEFAULTS.map((s) => ({ ...s, organizationId: orgId })),
  );
}
