"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deviceAppraisals, organizations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";
import { getObjectBuffer } from "@/lib/storage";

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

  const [org] = await db
    .select({ perizieMarginPercent: organizations.perizieMarginPercent })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  const marginPercent = org?.perizieMarginPercent ?? 45;
  const offerPercent = 100 - marginPercent;

  const accessories = [
    appraisal.hasCharger && "caricatore originale",
    appraisal.hasOriginalBox && "scatola originale",
  ]
    .filter(Boolean)
    .join(", ") || "nessuno";

  const intentMap: Record<string, string> = { sell: "solo vendita", trade_in: "permuta", both: "vendita o permuta" };

  const modelStartsWithBrand = appraisal.model?.toLowerCase().startsWith(appraisal.brand.toLowerCase()) ?? false;
  const deviceName = [
    !modelStartsWithBrand && appraisal.brand,
    appraisal.model,
    appraisal.storageGb,
    appraisal.color,
  ].filter(Boolean).join(" ");

  const PURCHASE_METHOD_LABELS: Record<string, string> = {
    cash: "Contanti",
    card: "Carta",
    carrier_plan: "Abbonamento operatore",
    financing: "Finanziamento",
  };
  const PURCHASE_PLACE_LABELS: Record<string, string> = {
    physical: "Negozio fisico",
    online: "Online",
  };

  const prompt = `Sei un esperto di compravendita dispositivi usati per centri riparazione italiani.

Valuta questo dispositivo e indica il prezzo di acquisto equo (quanto il negozio pagherebbe al cliente).

Dispositivo: ${deviceName}
${appraisal.imei ? `IMEI: ${appraisal.imei}` : ""}
Funziona regolarmente: ${appraisal.works ? "Sì" : "No"}
Schermo: ${appraisal.screenCondition ? SCREEN_LABELS[appraisal.screenCondition] ?? appraisal.screenCondition : "non specificato"}
Corpo/scocca: ${appraisal.bodyCondition ? BODY_LABELS[appraisal.bodyCondition] ?? appraisal.bodyCondition : "non specificato"}
Batteria (livello): ${appraisal.batteryHealth ? BATTERY_LABELS[appraisal.batteryHealth] ?? appraisal.batteryHealth : "non specificata"}
${appraisal.batteryPercentage != null ? `Batteria (percentuale): ${appraisal.batteryPercentage}%` : ""}
Anno acquisto approssimativo: ${appraisal.purchaseYear ?? "non specificato"}
Accessori presenti: ${accessories}
Metodo di acquisto: ${appraisal.purchaseMethod ? PURCHASE_METHOD_LABELS[appraisal.purchaseMethod] ?? appraisal.purchaseMethod : "non specificato"}
Luogo di acquisto: ${appraisal.purchasePlace ? PURCHASE_PLACE_LABELS[appraisal.purchasePlace] ?? appraisal.purchasePlace : "non specificato"}
Prova di acquisto: ${appraisal.hasProofOfPurchase === true ? "Sì" : appraisal.hasProofOfPurchase === false ? "No" : "non specificato"}
Intenzione cliente: ${appraisal.intent ? intentMap[appraisal.intent] ?? appraisal.intent : "non specificata"}
Aspettativa cliente: ${appraisal.customerExpectedCents != null ? fmt(appraisal.customerExpectedCents) : "non specificata"}
Note del cliente: ${appraisal.customerNotes ?? "nessuna"}
${appraisal.photoKeys ? `\nIl cliente ha caricato delle foto del dispositivo — analizzale per verificare le condizioni dichiarate.` : ""}

PRIMA di rispondere, cerca i prezzi attuali su BackMarket Italia, eBay.it e Subito.it per questo modello specifico.

Poi calcola i tre valori separati:

1. resaleCents — prezzo di rivendita di mercato IN CONDIZIONI PERFETTE (es. iPhone 12 Pro Max 256GB = ~320€). Considera le detrazioni per condizioni NON perfette qui solo se non richiedono riparazione (es. graffi estetici lievi).

2. repairCostsCents — costi stimati per i componenti/riparazioni necessari prima della rivendita (es. batteria <80% = ~50€, schermo rotto = ~80-150€ a seconda del modello). Metti 0 se non serve nulla.
   Se batteria <80% iPhone: repairCostsCents ≥ 4500 (costo minimo ricambio).
   Se non funziona: riduci resaleCents del 50%.

Rispondi SOLO con un oggetto JSON valido, senza testo prima o dopo, senza markdown:
{"resaleCents": <intero>, "repairCostsCents": <intero>, "reasoning": "<spiegazione italiana con prezzi trovati online, max 150 parole>"}`;

  // Load photos for vision
  const photoKeys: string[] = appraisal.photoKeys ? JSON.parse(appraisal.photoKeys) : [];
  const photoImages: Anthropic.Base64ImageSource[] = [];
  for (const key of photoKeys.slice(0, 4)) {
    const buf = await getObjectBuffer(key, true);
    if (buf) {
      const ext = key.split(".").pop()?.toLowerCase() ?? "jpg";
      const mt =
        ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
      photoImages.push({ type: "base64", media_type: mt as Anthropic.Base64ImageSource["media_type"], data: buf.toString("base64") });
    }
  }

  const userContent: Anthropic.MessageParam["content"] = [
    { type: "text", text: prompt },
    ...photoImages.map((src): Anthropic.ImageBlockParam => ({ type: "image", source: src })),
  ];

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let raw = "";

  try {
    // web_search_20250305 is a server-side Anthropic tool — one call, no manual loop needed
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: "web_search_20250305" }] as any,
      messages: [{ role: "user", content: userContent }],
    });
    raw = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch {
    // web_search not enabled on this key — fallback to plain call
    try {
      const resp = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: userContent }],
      });
      raw = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
    } catch {
      return { error: "Errore chiamata AI. Riprova." };
    }
  }

  let parsed: { resaleCents?: number; repairCostsCents?: number; reasoning: string };
  try {
    // Strip markdown code fences if the model wraps output in ```json ... ```
    let text = raw.trim();
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) text = fenced[1].trim();

    // Bracket-matching extraction of the first complete JSON object
    const start = text.indexOf("{");
    if (start === -1) throw new Error("No JSON");
    let depth = 0;
    let end = -1;
    for (let i = start; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end === -1) throw new Error("Unclosed JSON");
    parsed = JSON.parse(text.substring(start, end + 1));
    if (typeof parsed.reasoning !== "string") throw new Error();
  } catch {
    return { error: "Risposta AI non valida. Riprova." };
  }

  const resale = parsed.resaleCents != null ? Math.round(parsed.resaleCents) : null;
  const repairs = parsed.repairCostsCents != null ? Math.round(parsed.repairCostsCents) : 0;
  const netResale = resale != null ? resale - repairs : null;
  // Step 1: what the device is worth to the shop (after margin on net resale)
  const aiEstimate = netResale != null ? Math.round(netResale * offerPercent / 100) : null;
  // Step 2: what the shop offers the customer (after margin again — customer offer is margin% less than shop value)
  const customerOffer = aiEstimate != null ? Math.round(aiEstimate * offerPercent / 100) : null;

  if (customerOffer == null) return { error: "Risposta AI non valida. Riprova." };

  await db
    .update(deviceAppraisals)
    .set({
      aiResaleCents: resale,
      aiRepairCostsCents: repairs > 0 ? repairs : null,
      aiEstimateCents: aiEstimate,
      aiValuationCents: customerOffer,
      aiReasoning: parsed.reasoning,
      aiEvaluatedAt: new Date(),
      finalValuationCents: customerOffer,
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

export async function cancelAppraisalAction(appraisalId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autenticato." };
  const orgId = session.user.organizationId;

  await db
    .update(deviceAppraisals)
    .set({ status: "cancelled", updatedAt: new Date() })
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

export async function deleteAppraisalAction(appraisalId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autenticato." };
  const orgId = session.user.organizationId;

  await db
    .delete(deviceAppraisals)
    .where(and(eq(deviceAppraisals.id, appraisalId), eq(deviceAppraisals.organizationId, orgId)));

  revalidatePath("/registry/perizie");
  redirect("/registry/perizie");
}

export async function setImeiStatusAction(
  appraisalId: string,
  status: "clean" | "blocked" | "unknown",
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { error: "Non autenticato." };
  const orgId = session.user.organizationId;

  await db
    .update(deviceAppraisals)
    .set({ imeiCheckStatus: status, updatedAt: new Date() })
    .where(and(eq(deviceAppraisals.id, appraisalId), eq(deviceAppraisals.organizationId, orgId)));

  revalidatePath(`/registry/perizie/${appraisalId}`);
  return {};
}
