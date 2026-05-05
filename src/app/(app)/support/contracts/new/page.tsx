import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, supportPackages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NewContractForm } from "./new-contract-form";

export default async function NewContractPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [allCustomers, allPackages] = await Promise.all([
    db
      .select({ id: customers.id, name: customers.name, phone: customers.phone })
      .from(customers)
      .where(eq(customers.organizationId, orgId))
      .orderBy(customers.name),
    db
      .select({
        id: supportPackages.id,
        name: supportPackages.name,
        totalMinutes: supportPackages.totalMinutes,
        priceCents: supportPackages.priceCents,
      })
      .from(supportPackages)
      .where(eq(supportPackages.organizationId, orgId))
      .orderBy(supportPackages.priorityLevel),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0];

  return <NewContractForm customers={allCustomers} packages={allPackages} today={today} nextYear={nextYear} />;
}
