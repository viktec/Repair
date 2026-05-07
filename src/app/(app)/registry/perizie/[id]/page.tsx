import { requirePlan } from "@/lib/require-plan";
import { db } from "@/lib/db";
import { deviceAppraisals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppraisalDetail } from "./appraisal-detail";

export default async function AppraisalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePlan("business");
  if (!can.accessRegistry(session.user.role)) redirect("/dashboard");
  const orgId = session.user.organizationId!;

  const [appraisal] = await db
    .select()
    .from(deviceAppraisals)
    .where(and(eq(deviceAppraisals.id, id), eq(deviceAppraisals.organizationId, orgId)))
    .limit(1);

  if (!appraisal) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/registry/perizie">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Perizie
          </Button>
        </Link>
        <h1 className="text-xl font-bold">
          {appraisal.brand} {appraisal.model}
          {appraisal.storageGb ? ` ${appraisal.storageGb}` : ""}
        </h1>
      </div>
      <AppraisalDetail appraisal={appraisal} />
    </div>
  );
}
