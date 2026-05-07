"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deviceAppraisals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";

function fmt(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

const SCREEN_LABELS: Record<string, string> = {
  perfect: "perfetto",
  minor_scratches: "graffi leggeri",
  cracked: "vetro rotto",
  shattered: "display in frantumi",
};
const BODY_LABELS: Record<string, string> = {
  excellent: "eccellente",
  good: "buono",
  fair: "discreto",
  poor: "pessimo",
};
const BATTERY_LABELS: Record<string, string> = {
  great: "ottima",
  good: "buona",
  fair: "discreta",
  poor: "scarsa",
};

export async function evaluateWithAIAction(appraisalId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autenticato." };
  const orgId = session.user.organizationId;

  const [appraisal] = await db
    .select()
    .from(deviceAppraisals)
    .where(and(eq(deviceAppraisals.id, appraisalId), eq(deviceAppraisals.organizationId, orgId)))
    .limit(1);

  if (!appraisal) return { error: "Perizia non trovata." };
  if (!appraisal.surveyCompletedAt) return { error: "Il cliente non ha ancora compilato il questionario." };

  const accessories = [
    appraisal.hasCharger && "caricatore originale",
    appraisal.hasOriginalBox && "scatola originale",
  ]
    .filter(Boolean)
    .join(", ") || "nessuno";

  const intentMap: Record<string, string> = { sell: "solo vendita", trade_in: "permuta", both: "vendita o permuta" };

  const prompt = `Sei un esperto di compravendita dispositivi usati per centri riparazione italiani.

Valuta questo dispositivo usato e fornisci un prezzo di acquisto equo (quanto il negozio pagherebbe al cliente):

Dispositivo: ${appraisal.brand} ${appraisal.model}${appraisal.storageGb ? ` ${appraisal.storageGb}` : ""}${appraisal.color ? ` ${appraisal.color}` : ""}
${appraisal.imei ? `IMEI: ${appraisal.imei}` : ""}
Funziona regolarmente: ${appraisal.works ? "Sì" : "No"}
Schermo: ${appraisal.screenCondition ? SCREEN_LABELS[appraisal.screenCondition] ?? appraisal.screenCondition : "non specificato"}
Corpo/scocca: ${appraisal.bodyCondition ? BODY_LABELS[appraisal.bodyCondition] ?? appraisal.bodyCondition : "non specificato"}
Batteria: ${appraisal.batteryHealth ? BATTERY_LABELS[appraisal.batteryHealth] ?? appraisal.batteryHealth : "non specificata"}
Anno acquisto approssimativo: ${appraisal.purchaseYear ?? "non specificato"}
Accessori presenti: ${accessories}
Intenzione cliente: ${appraisal.intent ? intentMap[appraisal.intent] ?? appraisal.intent : "non specificata"}
Aspettativa cliente: ${appraisal.customerExpectedCents != null ? fmt(appraisal.customerExpectedCents) : "non specificata"}
Note del cliente: ${appraisal.customerNotes ?? "nessuna"}

Considera:
- Prezzi di mercato usato italiano (BackMarket IT, eBay.it)
- Il negozio deve rivendere con margine del 30-40% per coprire test/pulizia/garanzia
- Se non funziona: valore solo come parti (10-20% del valore funzionante)
- Schermo rotto: riduzione 20-40% sul valore base
- Batteria scarsa: riduzione 10-20%
- Sii prudente: meglio una valutazione leggermente bassa che perdere soldi

Rispondi SOLO con JSON valido, niente markdown:
{"valuationCents": <intero in centesimi>, "reasoning": "<spiegazione in italiano, max 120 parole>"}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let raw: string;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    raw = (msg.content[0] as { text: string }).text.trim();
  } catch {
    return { error: "Errore chiamata AI. Riprova." };
  }

  let parsed: { valuationCents: number; reasoning: string };
  try {
    parsed = JSON.parse(raw);
    if (typeof parsed.valuationCents !== "number" || typeof parsed.reasoning !== "string") throw new Error();
  } catch {
    return { error: "Risposta AI non valida. Riprova." };
  }

  await db
    .update(deviceAppraisals)
    .set({
      aiValuationCents: Math.round(parsed.valuationCents),
      aiReasoning: parsed.reasoning,
      aiEvaluatedAt: new Date(),
      finalValuationCents: Math.round(parsed.valuationCents),
      status: "ai_evaluated",
      updatedAt: new Date(),
    })
    .where(eq(deviceAppraisals.id, appraisalId));

  revalidatePath(`/registry/perizie/${appraisalId}`);
  return {};
}

export async function updateAppraisalAction(appraisalId: string, formData: FormData): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autenticato." };
  const orgId = session.user.organizationId;

  const finalValuation = parseFloat((formData.get("finalValuationCents") as string) || "0");
  const tradeInBonus = parseFloat((formData.get("tradeInBonusCents") as string) || "0");
  const adminNotes = (formData.get("adminNotes") as string) || null;

  await db
    .update(deviceAppraisals)
    .set({
      finalValuationCents: Math.round(finalValuation * 100),
      tradeInBonusCents: Math.round(tradeInBonus * 100),
      adminNotes: adminNotes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(deviceAppraisals.id, appraisalId), eq(deviceAppraisals.organizationId, orgId)));

  revalidatePath(`/registry/perizie/${appraisalId}`);
  return {};
}

export async function approveAppraisalAction(appraisalId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autenticato." };
  const orgId = session.user.organizationId;

  await db
    .update(deviceAppraisals)
    .set({
      status: "approved",
      approvedAt: new Date(),
      approvedBy: session.user.id as string,
      updatedAt: new Date(),
    })
    .where(and(eq(deviceAppraisals.id, appraisalId), eq(deviceAppraisals.organizationId, orgId)));

  revalidatePath(`/registry/perizie/${appraisalId}`);
  return {};
}

export async function rejectAppraisalAction(appraisalId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autenticato." };
  const orgId = session.user.organizationId;

  await db
    .update(deviceAppraisals)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(and(eq(deviceAppraisals.id, appraisalId), eq(deviceAppraisals.organizationId, orgId)));

  revalidatePath(`/registry/perizie/${appraisalId}`);
  return {};
}

export async function markSurveySentAction(appraisalId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autenticato." };
  const orgId = session.user.organizationId;

  await db
    .update(deviceAppraisals)
    .set({ status: "survey_sent", updatedAt: new Date() })
    .where(and(eq(deviceAppraisals.id, appraisalId), eq(deviceAppraisals.organizationId, orgId)));

  revalidatePath(`/registry/perizie/${appraisalId}`);
  return {};
}
