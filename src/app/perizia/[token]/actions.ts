"use server";

import { db } from "@/lib/db";
import { deviceAppraisals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function submitSurveyAction(
  token: string,
  _prev: { error?: string; done?: true } | null,
  formData: FormData,
): Promise<{ error?: string; done?: true }> {
  const [appraisal] = await db
    .select({ id: deviceAppraisals.id, status: deviceAppraisals.status })
    .from(deviceAppraisals)
    .where(eq(deviceAppraisals.surveyToken, token))
    .limit(1);

  if (!appraisal) return { error: "Link non valido." };
  if (appraisal.status === "approved" || appraisal.status === "rejected") {
    return { error: "Questa perizia è già stata chiusa." };
  }

  const works = formData.get("works") === "yes";
  const screenCondition = formData.get("screenCondition") as string;
  const bodyCondition = formData.get("bodyCondition") as string;
  const batteryHealth = formData.get("batteryHealth") as string;
  const purchaseYearRaw = formData.get("purchaseYear") as string;
  const purchaseYear = purchaseYearRaw ? parseInt(purchaseYearRaw) : null;
  const hasCharger = formData.get("hasCharger") === "on";
  const hasOriginalBox = formData.get("hasOriginalBox") === "on";
  const expectedRaw = formData.get("customerExpectedCents") as string;
  const customerExpectedCents = expectedRaw ? Math.round(parseFloat(expectedRaw) * 100) : null;
  const intent = formData.get("intent") as string;
  const customerNotes = (formData.get("customerNotes") as string)?.trim() || null;

  const validScreen = ["perfect", "minor_scratches", "cracked", "shattered"];
  const validBody = ["excellent", "good", "fair", "poor"];
  const validBattery = ["great", "good", "fair", "poor"];
  const validIntent = ["sell", "trade_in", "both"];

  if (!validScreen.includes(screenCondition)) return { error: "Seleziona lo stato dello schermo." };
  if (!validBody.includes(bodyCondition)) return { error: "Seleziona lo stato del corpo." };
  if (!validBattery.includes(batteryHealth)) return { error: "Seleziona lo stato della batteria." };
  if (!validIntent.includes(intent)) return { error: "Seleziona l'intenzione." };

  await db
    .update(deviceAppraisals)
    .set({
      works,
      screenCondition: screenCondition as "perfect" | "minor_scratches" | "cracked" | "shattered",
      bodyCondition: bodyCondition as "excellent" | "good" | "fair" | "poor",
      batteryHealth: batteryHealth as "great" | "good" | "fair" | "poor",
      purchaseYear,
      hasCharger,
      hasOriginalBox,
      customerExpectedCents,
      intent: intent as "sell" | "trade_in" | "both",
      customerNotes,
      surveyCompletedAt: new Date(),
      status: "survey_completed",
      updatedAt: new Date(),
    })
    .where(eq(deviceAppraisals.surveyToken, token));

  return { done: true };
}
