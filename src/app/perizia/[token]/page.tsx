import { db } from "@/lib/db";
import { deviceAppraisals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SurveyForm } from "./survey-form";
import { Wrench } from "lucide-react";

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [appraisal] = await db
    .select({
      id: deviceAppraisals.id,
      brand: deviceAppraisals.brand,
      model: deviceAppraisals.model,
      storageGb: deviceAppraisals.storageGb,
      status: deviceAppraisals.status,
      surveyCompletedAt: deviceAppraisals.surveyCompletedAt,
    })
    .from(deviceAppraisals)
    .where(eq(deviceAppraisals.surveyToken, token))
    .limit(1);

  if (!appraisal) notFound();

  const alreadyCompleted = appraisal.surveyCompletedAt != null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Valutazione Usato</span>
        </div>

        <div className="rounded-2xl bg-white border shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold">Questionario dispositivo</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Rispondi alle domande per ricevere una valutazione del tuo dispositivo. Ci vorranno circa 2 minuti.
            </p>
          </div>

          <SurveyForm
            token={token}
            brand={appraisal.brand}
            model={appraisal.model}
            storageGb={appraisal.storageGb}
            alreadyCompleted={alreadyCompleted}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by my-repair.it
        </p>
      </div>
    </div>
  );
}
