import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orgId = session.user.organizationId;
  if (!orgId) {
    // super admin non ha org: il middleware dovrebbe già bloccarlo, ma per sicurezza
    redirect(session.user.isSuperAdmin ? "/admin" : "/login");
  }

  const [org] = await db
    .select({ registrationStatus: organizations.registrationStatus })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org || org.registrationStatus !== "approved") redirect("/pending");

  return (
    <AppShell userName={session.user.name} userEmail={session.user.email} role={session.user.role}>
      {children}
    </AppShell>
  );
}
