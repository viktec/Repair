import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportPackages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { hasMinRole } from "@/lib/permissions";
import { PackageEditForm } from "./package-edit-form";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!hasMinRole(session.user.role, "admin")) redirect("/support/packages");

  const [pkg] = await db
    .select()
    .from(supportPackages)
    .where(and(eq(supportPackages.id, id), eq(supportPackages.organizationId, session.user.organizationId)))
    .limit(1);

  if (!pkg) notFound();

  return <PackageEditForm pkg={pkg} />;
}
