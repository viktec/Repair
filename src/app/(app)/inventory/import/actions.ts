"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { eq, and, isNull, ilike, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inventoryItems, inventoryMovements, suppliers } from "@/db/schema";

export type ParsedItem = {
  name_it: string;
  category: string;
  qty: number;
  unit_cost_cents: number;
  confidence: number;
  sku: string | null;
  compatible_brands: string | null;
  compatible_models: string | null;
  matched_item_id: string | null;
  matched_item_name: string | null;
};

export type ParseResult =
  | { ok: true; items: ParsedItem[]; supplierName: string | null }
  | { ok: false; error: string };

export type ConfirmedItem = {
  name_it: string;
  category: string;
  qty: number;
  unit_cost_cents: number;
  sku: string | null;
  compatible_brands: string | null;
  compatible_models: string | null;
  matched_item_id: string | null;
};

const PROMPT = `Sei un assistente per centri di riparazione italiani. Analizza questa fattura fornitore ed estrai ogni riga prodotto.

Per ogni prodotto restituisci un oggetto JSON con:
- name_it: nome in italiano compatto (es. "Display LCD iPhone 13 Pro Max Incell", "Batteria Apple Watch 1 42MM"). Rimuovi parole superflue: "Replacement", "For", "Compatible With", "OEM", "Assembly". Mantieni tipo (Incell, OLED, Originale).
- category: una di queste categorie: "Display", "Batterie", "Ricambi", "Accessori", "Utensili", "Altro"
- qty: quantità (intero)
- unit_cost_cents: prezzo unitario netto in centesimi (intero). Usa il prezzo NETTO, senza IVA.
- confidence: numero tra 0 e 1 (1 = certezza assoluta, <0.7 = da verificare)
- sku: eventuale codice SKU/articolo se presente, altrimenti null
- compatible_brands: marca compatibile (es. "Apple", "Samsung") o null
- compatible_models: modello compatibile (es. "iPhone 13 Pro Max") o null

Se riesci a identificare il nome del fornitore dalla fattura, includilo come primo elemento speciale: {"_supplier": "Nome Fornitore"}

Rispondi SOLO con un array JSON valido, senza testo aggiuntivo, senza markdown, senza backtick.
Esempio: [{"name_it":"Display LCD iPhone 13 Pro Max Incell","category":"Display","qty":5,"unit_cost_cents":6850,"confidence":0.97,"sku":null,"compatible_brands":"Apple","compatible_models":"iPhone 13 Pro Max"}]`;

function extractKeywords(name: string): string {
  const stopwords = new Set(["per", "con", "del", "della", "di", "da", "il", "la", "le", "lo", "e", "a"]);
  const words = name
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w.toLowerCase()));
  return words.slice(0, 3).join(" ");
}

export async function parseInvoiceAction(formData: FormData): Promise<ParseResult> {
  const session = await auth();
  if (!session?.user?.organizationId) return { ok: false, error: "Non autenticato." };
  const orgId = session.user.organizationId;

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Nessun file ricevuto." };

  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!ALLOWED_TYPES.includes(file.type))
    return { ok: false, error: "Formato non supportato. Carica un PDF, JPEG, PNG o WEBP." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "File troppo grande. Massimo 10MB." };

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const isPdf = file.type === "application/pdf";

  let rawText: string;
  try {
    const fileContent = isPdf
      ? {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64,
          },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: file.type as "image/jpeg" | "image/png" | "image/webp",
            data: base64,
          },
        };

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            fileContent,
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
    const block = response.content[0];
    rawText = block.type === "text" ? block.text.trim() : "";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: "Errore analisi AI: " + message };
  }

  let parsed: unknown[];
  try {
    let text = rawText.trim();
    // Strip markdown code fences if the model wraps output in ```json ... ```
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/s);
    if (fenced) text = fenced[1].trim();
    parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error();
  } catch {
    return { ok: false, error: "Risposta AI non valida. Riprova." };
  }

  let supplierName: string | null = null;
  const supplierEntry = parsed.find(
    (e): e is { _supplier: string } =>
      typeof e === "object" && e !== null && "_supplier" in e,
  );
  if (supplierEntry) supplierName = supplierEntry._supplier ?? null;

  const rawItems = parsed.filter(
    (e): e is Record<string, unknown> =>
      typeof e === "object" && e !== null && !("_supplier" in e),
  );

  if (rawItems.length === 0) return { ok: false, error: "Nessun prodotto trovato nella fattura." };

  const items: ParsedItem[] = await Promise.all(
    rawItems.map(async (raw) => {
      const name_it = String(raw.name_it ?? "");
      const keywords = extractKeywords(name_it);

      let matched_item_id: string | null = null;
      let matched_item_name: string | null = null;

      if (keywords.length > 0) {
        const [match] = await db
          .select({ id: inventoryItems.id, name: inventoryItems.name })
          .from(inventoryItems)
          .where(
            and(
              eq(inventoryItems.organizationId, orgId),
              isNull(inventoryItems.deletedAt),
              ilike(inventoryItems.name, `%${keywords}%`),
            ),
          )
          .limit(1);

        if (match) {
          matched_item_id = match.id;
          matched_item_name = match.name;
        }
      }

      return {
        name_it,
        category: String(raw.category ?? "Altro"),
        qty: Number(raw.qty ?? 0),
        unit_cost_cents: Number(raw.unit_cost_cents ?? 0),
        confidence: Number(raw.confidence ?? 0),
        sku: raw.sku != null ? String(raw.sku) : null,
        compatible_brands: raw.compatible_brands != null ? String(raw.compatible_brands) : null,
        compatible_models: raw.compatible_models != null ? String(raw.compatible_models) : null,
        matched_item_id,
        matched_item_name,
      };
    }),
  );

  return { ok: true, items, supplierName };
}

export async function confirmImportAction(
  items: ConfirmedItem[],
  supplierName: string | null,
): Promise<{ ok: boolean; count: number; supplierId: string | null }> {
  const session = await auth();
  if (!session?.user?.organizationId) return { ok: false, count: 0, supplierId: null };
  const orgId = session.user.organizationId;

  let supplierId: string | null = null;

  if (supplierName) {
    const [existing] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(
        and(
          eq(suppliers.organizationId, orgId),
          isNull(suppliers.deletedAt),
          ilike(suppliers.name, supplierName),
        ),
      )
      .limit(1);

    if (existing) {
      supplierId = existing.id;
    } else {
      const [created] = await db
        .insert(suppliers)
        .values({ organizationId: orgId, name: supplierName })
        .returning({ id: suppliers.id });
      supplierId = created?.id ?? null;
    }
  }

  const userId = session.user.id as string;

  for (const item of items) {
    if (item.matched_item_id) {
      await db
        .update(inventoryItems)
        .set({
          quantity: sql`${inventoryItems.quantity} + ${item.qty}`,
          costPriceCents: item.unit_cost_cents,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryItems.id, item.matched_item_id),
            eq(inventoryItems.organizationId, orgId),
          ),
        );
      await db.insert(inventoryMovements).values({
        organizationId: orgId,
        itemId: item.matched_item_id,
        type: "in",
        quantity: item.qty,
        notes: supplierName ? `Importazione fattura: ${supplierName}` : "Importazione fattura AI",
        createdBy: userId,
      });
    } else {
      const [newItem] = await db.insert(inventoryItems).values({
        organizationId: orgId,
        supplierId,
        name: item.name_it,
        category: item.category || null,
        sku: item.sku,
        compatibleBrands: item.compatible_brands,
        compatibleModels: item.compatible_models,
        quantity: item.qty,
        costPriceCents: item.unit_cost_cents,
      }).returning({ id: inventoryItems.id });
      if (newItem) {
        await db.insert(inventoryMovements).values({
          organizationId: orgId,
          itemId: newItem.id,
          type: "in",
          quantity: item.qty,
          notes: supplierName ? `Importazione fattura: ${supplierName}` : "Importazione fattura AI",
          createdBy: userId,
        });
      }
    }
  }

  revalidatePath("/inventory");
  return { ok: true, count: items.length, supplierId };
}
