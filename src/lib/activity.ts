import { db } from "@/lib/db";
import { activityLogs } from "@/db/schema";
import { auth } from "@/lib/auth";

interface LogParams {
  orgId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogParams): Promise<void> {
  try {
    const session = await auth();
    await db.insert(activityLogs).values({
      orgId: params.orgId,
      userId: session?.user?.id ?? null,
      userName: session?.user?.name ?? null,
      userEmail: session?.user?.email ?? null,
      action: params.action,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      entityLabel: params.entityLabel ?? null,
      metadata: params.metadata ?? null,
    });
  } catch {
    // fire-and-forget: never throw from logging
  }
}

export const ACTION_LABELS: Record<string, string> = {
  "ticket.create":                "Ticket creato",
  "ticket.status_change":         "Stato ticket aggiornato",
  "ticket.delete":                "Ticket eliminato",
  "customer.create":              "Cliente creato",
  "customer.delete":              "Cliente eliminato",
  "team.invite":                  "Membro invitato",
  "team.remove":                  "Membro rimosso",
  "team.role_change":             "Ruolo aggiornato",
  "inventory.movement":           "Movimento magazzino",
  "pos.session_open":             "Sessione POS aperta",
  "pos.session_close":            "Sessione POS chiusa",
  "support.intervention_create":  "Intervento creato",
  "permissions.update":           "Permessi aggiornati",
};
