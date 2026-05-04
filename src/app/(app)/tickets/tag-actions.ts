"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { tickets, ticketTags, ticketTagAssignments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions";

export async function getOrgTagsAction() {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autorizzato" };
  const orgId = session.user.organizationId;

  const tags = await db
    .select({ id: ticketTags.id, name: ticketTags.name, color: ticketTags.color })
    .from(ticketTags)
    .where(eq(ticketTags.organizationId, orgId))
    .orderBy(ticketTags.name);

  return { tags };
}

export async function createTagAction(name: string, color: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autorizzato" };
  if (!can.delete(session.user.role)) return { error: "Permessi insufficienti" };
  const orgId = session.user.organizationId;

  const trimmed = name.trim().slice(0, 50);
  if (!trimmed) return { error: "Nome obbligatorio" };

  const [tag] = await db
    .insert(ticketTags)
    .values({ organizationId: orgId, name: trimmed, color })
    .returning({ id: ticketTags.id, name: ticketTags.name, color: ticketTags.color });

  revalidatePath("/settings/tags");
  return { tag };
}

export async function deleteTagAction(tagId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autorizzato" };
  if (!can.delete(session.user.role)) return { error: "Permessi insufficienti" };
  const orgId = session.user.organizationId;

  await db
    .delete(ticketTags)
    .where(and(eq(ticketTags.id, tagId), eq(ticketTags.organizationId, orgId)));

  revalidatePath("/settings/tags");
  revalidatePath("/tickets");
  return { ok: true };
}

export async function addTagToTicketAction(ticketId: string, tagId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autorizzato" };
  const orgId = session.user.organizationId;

  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.organizationId, orgId)))
    .limit(1);
  if (!ticket) return { error: "Ticket non trovato" };

  const [tag] = await db
    .select({ id: ticketTags.id })
    .from(ticketTags)
    .where(and(eq(ticketTags.id, tagId), eq(ticketTags.organizationId, orgId)))
    .limit(1);
  if (!tag) return { error: "Etichetta non trovata" };

  await db
    .insert(ticketTagAssignments)
    .values({ ticketId, tagId })
    .onConflictDoNothing();

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { ok: true };
}

export async function removeTagFromTicketAction(ticketId: string, tagId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autorizzato" };
  const orgId = session.user.organizationId;

  const [ticket] = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.organizationId, orgId)))
    .limit(1);
  if (!ticket) return { error: "Ticket non trovato" };

  await db
    .delete(ticketTagAssignments)
    .where(
      and(
        eq(ticketTagAssignments.ticketId, ticketId),
        eq(ticketTagAssignments.tagId, tagId),
      ),
    );

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { ok: true };
}
