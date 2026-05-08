"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deviceAppraisals } from "@/db/schema";
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

Devi valutare questo dispositivo e fornire un prezzo di acquisto equo (quanto il negozio pagherebbe al cliente).

PRIMA di valutare, usa il tool web_search per cercare i prezzi correnti su BackMarket Italia, eBay.it e Subito.it per questo modello specifico (es: query "${appraisal.brand} ${appraisal.model}${appraisal.storageGb ? ` ${appraisal.storageGb}` : ""} usato prezzo Italia"). Questo ti darà dati aggiornati sui prezzi di mercato reali.

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

Dopo la ricerca web, calcola il prezzo di acquisto considerando:
- Il negozio rivende con margine 30-40% (per test, pulizia, garanzia)
- Se non funziona: 10-20% del valore base
- Schermo rotto: -25-40%; in frantumi: -50%
- Batteria iPhone <80%: -15-25%; <70%: -30-40%
- Batteria scarsa (livello): -10-20%
- Finanziamento/abbonamento operatore: potenziali vincoli di sblocco, valuta con cautela
- Prova di acquisto presente: +valore di rivendita (certificabile)
- Sii prudente: meglio valutare leggermente meno che perdere soldi

Rispondi SOLO con JSON valido, niente testo prima o dopo, niente markdown:
{"valuationCents": <intero in centesimi>, "reasoning": "<spiegazione in italiano con riferimento ai prezzi trovati online, max 150 parole>"}`;

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
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userContent }];
  let raw = "";

  try {
    for (let iter = 0; iter < 8; iter++) {
      const resp = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: "web_search_20250305" }] as any,
        messages,
      });

      const texts = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      if (texts) raw = texts;

      if (resp.stop_reason === "end_turn" || resp.stop_reason === "max_tokens") break;

      if (resp.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: resp.content });
        const toolUses = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
        if (toolUses.length > 0) {
          messages.push({
            role: "user",
            content: toolUses.map((b) => ({
              type: "tool_result" as const,
              tool_use_id: b.id,
              content: "Search completed.",
            })),
          });
        }
      }
    }
  } catch {
    // web_search not available — fallback to plain call without tools
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

  let parsed: { valuationCents: number; reasoning: string };
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    parsed = JSON.parse(jsonMatch[0]);
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
