"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  supportInterventions,
  customerContracts,
  supportPackages,
  users,
} from "@/db/schema";
import { eq, and, max } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { calcBillableMinutes, type PackageSnapshot } from "@/lib/support-utils";
import { getPresignedUploadUrl } from "@/lib/storage";
import { randomUUID } from "crypto";

// ─── Schema ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  contractId: z.string().uuid("Contratto obbligatorio"),
  title: z.string().min(1, "Titolo obbligatorio").max(200),
  description: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(["onsite", "remote", "phone", "email", "lab", "other"]),
  isUrgent: z.coerce.boolean(),
  rawMinutes: z.coerce.number().int().min(1, "Durata obbligatoria"),
  occurredAt: z.string().optional(),
});

export type CreateInterventionState = {
  errors?: Record<string, string[]>;
  error?: string;
} | null;

// ─── createInterventionAction ─────────────────────────────────────────────────

export async function createInterventionAction(
  _prev: CreateInterventionState,
  formData: FormData,
): Promise<CreateInterventionState | { interventionId: string; remainingMinutes: number }> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const raw = Object.fromEntries(formData);
  // isUrgent arriva come "on" da checkbox o mancante
  raw.isUrgent = raw.isUrgent === "on" ? "true" : "false";

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { contractId, title, description, notes, type, isUrgent, rawMinutes } = parsed.data;
  const occurredAt = parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : new Date();

  // Verifica contratto appartiene all'org
  const [contract] = await db
    .select({
      id: customerContracts.id,
      totalMinutes: customerContracts.totalMinutes,
      usedMinutes: customerContracts.usedMinutes,
      packageSnapshot: customerContracts.packageSnapshot,
      status: customerContracts.status,
    })
    .from(customerContracts)
    .where(and(eq(customerContracts.id, contractId), eq(customerContracts.organizationId, orgId)))
    .limit(1);

  if (!contract) return { error: "Contratto non trovato" };
  if (contract.status === "exhausted") return { error: "Il contratto ha esaurito i minuti disponibili" };

  // Leggi snapshot dal contratto (se presente) oppure usa valori di default
  const snap = (contract.packageSnapshot as PackageSnapshot | null) ?? {
    phoneRoundingMinutes: 5,
    remoteRoundingMinutes: 10,
    emailRoundingMinutes: 10,
    callFeeMinutes: 10,
    urgencySurchargePercent: 0,
  };

  const billableMinutes = calcBillableMinutes(rawMinutes, type, snap, isUrgent);

  // Numero sequenziale interventi per org: I-0001, I-0002…
  const [maxRow] = await db
    .select({ max: max(supportInterventions.interventionNumber) })
    .from(supportInterventions)
    .where(eq(supportInterventions.organizationId, orgId));

  let nextSeq = 1;
  if (maxRow?.max) {
    const numeric = parseInt(maxRow.max.replace(/\D/g, ""), 10);
    if (!isNaN(numeric)) nextSeq = numeric + 1;
  }
  const interventionNumber = `I-${String(nextSeq).padStart(4, "0")}`;

  // Tecnico loggato
  const [techUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const technicianName = techUser?.name ?? session.user.name ?? null;

  // Upload foto (array di File, max 5)
  const photoFiles = formData.getAll("photos") as File[];
  const uploadedKeys: string[] = [];

  for (const file of photoFiles.slice(0, 5)) {
    if (!(file instanceof File) || file.size === 0) continue;
    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `interventions/${contractId}/${randomUUID()}.${ext}`;
    const { url } = await getPresignedUploadUrl(key, false, file.type || "image/jpeg");
    const buf = await file.arrayBuffer();
    await fetch(url, {
      method: "PUT",
      body: buf,
      headers: { "Content-Type": file.type || "image/jpeg" },
    });
    uploadedKeys.push(key);
  }

  // Inserimento intervento
  const [intervention] = await db
    .insert(supportInterventions)
    .values({
      organizationId: orgId,
      contractId,
      interventionNumber,
      title,
      description: description || null,
      notes: notes || null,
      type,
      isUrgent,
      rawMinutes,
      billableMinutes,
      technicianId: session.user.id,
      technicianName: technicianName ?? null,
      status: "completed",
      openedBy: "technician",
      photos: uploadedKeys,
      startTime: occurredAt,
    })
    .returning({ id: supportInterventions.id });

  // Aggiorna usedMinutes e status contratto
  const newUsed = contract.usedMinutes + billableMinutes;
  const newStatus = newUsed >= contract.totalMinutes ? "exhausted" : "active";

  await db
    .update(customerContracts)
    .set({ usedMinutes: newUsed, status: newStatus, updatedAt: new Date() })
    .where(eq(customerContracts.id, contractId));

  revalidatePath("/support/interventions");
  revalidatePath(`/support/contracts/${contractId}`);

  return {
    interventionId: intervention.id,
    remainingMinutes: Math.max(0, contract.totalMinutes - newUsed),
  };
}

// ─── updateInterventionStatusAction ──────────────────────────────────────────

export async function updateInterventionStatusAction(
  id: string,
  status: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  await db
    .update(supportInterventions)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(supportInterventions.id, id),
        eq(supportInterventions.organizationId, session.user.organizationId),
      ),
    );

  revalidatePath(`/support/interventions/${id}`);
}

// ─── deleteInterventionAction ─────────────────────────────────────────────────
// Solo admin+, solo entro 24h dalla creazione

export async function deleteInterventionAction(
  id: string,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const role = session.user.role ?? "";
  if (!["admin", "owner"].includes(role)) return { error: "Non autorizzato" };

  const [intervention] = await db
    .select({
      id: supportInterventions.id,
      contractId: supportInterventions.contractId,
      billableMinutes: supportInterventions.billableMinutes,
      createdAt: supportInterventions.createdAt,
    })
    .from(supportInterventions)
    .where(and(eq(supportInterventions.id, id), eq(supportInterventions.organizationId, orgId)))
    .limit(1);

  if (!intervention) return { error: "Intervento non trovato" };

  const ageMs = Date.now() - new Date(intervention.createdAt).getTime();
  if (ageMs > 24 * 60 * 60 * 1000) {
    return { error: "Impossibile annullare: sono trascorse più di 24 ore dalla creazione" };
  }

  // Ripristina minuti sul contratto
  const [contract] = await db
    .select({ usedMinutes: customerContracts.usedMinutes, totalMinutes: customerContracts.totalMinutes })
    .from(customerContracts)
    .where(eq(customerContracts.id, intervention.contractId))
    .limit(1);

  if (contract) {
    const restored = Math.max(0, contract.usedMinutes - intervention.billableMinutes);
    const newStatus = restored < contract.totalMinutes ? "active" : "exhausted";
    await db
      .update(customerContracts)
      .set({ usedMinutes: restored, status: newStatus, updatedAt: new Date() })
      .where(eq(customerContracts.id, intervention.contractId));
  }

  await db
    .delete(supportInterventions)
    .where(and(eq(supportInterventions.id, id), eq(supportInterventions.organizationId, orgId)));

  revalidatePath("/support/interventions");
  revalidatePath(`/support/contracts/${intervention.contractId}`);
  return {};
}
