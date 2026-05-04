import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { hasPlan } from "./permissions";

export async function requirePlan(minPlan: "pro" | "business") {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const [org] = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, session.user.organizationId))
    .limit(1);
  if (!hasPlan(org?.plan, minPlan)) redirect("/upgrade");
  return session;
}
