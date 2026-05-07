"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deviceAppraisals } from "@/db/schema";
import { redirect } from "next/navigation";

export async function createAppraisalAction(_prev: { error: string } | null, formData: FormData) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  // Dispositivo
  const brand = (formData.get("brand") as string)?.trim();
  const model = (formData.get("model") as string)?.trim();
  const storageGb = (formData.get("storageGb") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || null;
  const imei = (formData.get("imei") as string)?.trim() || null;
  const serialNumber = (formData.get("serialNumber") as string)?.trim() || null;

  if (!brand || !model) return { error: "Marca e modello sono obbligatori." };
  if (!storageGb) return { error: "Lo storage è obbligatorio." };
  if (!color) return { error: "Il colore è obbligatorio." };
  if (!imei) return { error: "L'IMEI è obbligatorio." };

  // Cliente
  const customerName = (formData.get("customerName") as string)?.trim() || null;
  const customerPhone = (formData.get("customerPhone") as string)?.trim() || null;

  // Condizioni
  const works = formData.get("works") === "yes";
  const screenCondition = formData.get("screenCondition") as string;
  const bodyCondition = formData.get("bodyCondition") as string;
  const batteryHealth = formData.get("batteryHealth") as string;
  const batteryPctRaw = formData.get("batteryPercentage") as string;
  const batteryPercentage = batteryPctRaw ? Math.min(100, Math.max(1, parseInt(batteryPctRaw))) : null;

  const validScreen = ["perfect", "minor_scratches", "cracked", "shattered"];
  const validBody = ["excellent", "good", "fair", "poor"];
  const validBattery = ["great", "good", "fair", "poor"];
  if (!validScreen.includes(screenCondition)) return { error: "Seleziona lo stato dello schermo." };
  if (!validBody.includes(bodyCondition)) return { error: "Seleziona lo stato del corpo." };
  if (!validBattery.includes(batteryHealth)) return { error: "Seleziona lo stato della batteria." };

  // Acquisto
  const purchaseYearRaw = formData.get("purchaseYear") as string;
  const purchaseYear = purchaseYearRaw ? parseInt(purchaseYearRaw) : null;
  const hasCharger = formData.get("hasCharger") === "on";
  const hasOriginalBox = formData.get("hasOriginalBox") === "on";
  const purchaseMethod = formData.get("purchaseMethod") as string;
  const purchasePlace = formData.get("purchasePlace") as string;
  const proofRaw = formData.get("hasProofOfPurchase") as string;
  const hasProofOfPurchase = proofRaw === "yes" ? true : proofRaw === "no" ? false : null;

  const validPurchaseMethod = ["cash", "card", "carrier_plan", "financing"];
  const validPurchasePlace = ["physical", "online"];
  if (!validPurchaseMethod.includes(purchaseMethod)) return { error: "Seleziona il metodo di acquisto." };
  if (!validPurchasePlace.includes(purchasePlace)) return { error: "Seleziona dove è stato acquistato." };

  // Intenzione cliente
  const intent = formData.get("intent") as string;
  const expectedRaw = formData.get("customerExpectedCents") as string;
  if (!expectedRaw) return { error: "Inserisci l'importo che il cliente si aspetta." };
  const customerExpectedCents = Math.round(parseFloat(expectedRaw) * 100);
  const customerNotes = (formData.get("customerNotes") as string)?.trim() || null;

  const validIntent = ["sell", "trade_in", "both"];
  if (!validIntent.includes(intent)) return { error: "Seleziona l'intenzione del cliente." };

  const surveyToken = crypto.randomUUID().replace(/-/g, "");

  const [row] = await db
    .insert(deviceAppraisals)
    .values({
      organizationId: orgId,
      surveyToken,
      brand,
      model,
      storageGb,
      color,
      imei,
      serialNumber,
      customerName,
      customerPhone,
      works,
      screenCondition: screenCondition as "perfect" | "minor_scratches" | "cracked" | "shattered",
      bodyCondition: bodyCondition as "excellent" | "good" | "fair" | "poor",
      batteryHealth: batteryHealth as "great" | "good" | "fair" | "poor",
      batteryPercentage,
      purchaseYear,
      hasCharger,
      hasOriginalBox,
      purchaseMethod: purchaseMethod as "cash" | "card" | "carrier_plan" | "financing",
      purchasePlace: purchasePlace as "physical" | "online",
      hasProofOfPurchase,
      intent: intent as "sell" | "trade_in" | "both",
      customerExpectedCents,
      customerNotes,
      surveyCompletedAt: new Date(),
      status: "survey_completed",
    })
    .returning({ id: deviceAppraisals.id });

  redirect(`/registry/perizie/${row.id}`);
}
