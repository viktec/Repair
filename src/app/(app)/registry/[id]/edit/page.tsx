import { db } from "@/lib/db";
import { usedItemsRegistry } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { requirePlan } from "@/lib/require-plan";
import { can } from "@/lib/permissions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditRegistryForm } from "./edit-form";
import { RegistryPhotoUpload } from "../registry-photo-upload";
import { getPresignedDownloadUrl } from "@/lib/storage";

export default async function EditRegistryEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePlan("business");
  if (!can.accessRegistry(session.user.role)) redirect("/dashboard");
  const orgId = session.user.organizationId!;
  const { id } = await params;

  const [entry] = await db
    .select()
    .from(usedItemsRegistry)
    .where(and(eq(usedItemsRegistry.id, id), eq(usedItemsRegistry.organizationId, orgId)))
    .limit(1);

  if (!entry) notFound();

  const photoKeys: string[] = entry.photoKeys ? JSON.parse(entry.photoKeys) : [];
  const initialPhotos = await Promise.all(
    photoKeys.map(async (key) => ({ key, url: await getPresignedDownloadUrl(key) })),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/registry">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />Registro
          </Button>
        </Link>
        <h1 className="text-xl font-bold">
          Modifica #{String(entry.counter).padStart(4, "0")}
        </h1>
      </div>
      <EditRegistryForm entry={entry} />
      <RegistryPhotoUpload entryId={entry.id} initialPhotos={initialPhotos} />
    </div>
  );
}
