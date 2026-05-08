import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, ticketStatuses, stores, organizations, memberships, users, tickets } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewTicketForm } from "./form";
import { hasPlan } from "@/lib/permissions";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [org] = await db
    .select({ plan: organizations.plan })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const isBusiness = hasPlan(org?.plan, "business");

  const [customerList, statusList, storeList, teamMembers, faultRows] = await Promise.all([
    db
      .select({ id: customers.id, name: customers.name, phone: customers.phone })
      .from(customers)
      .where(eq(customers.organizationId, orgId))
      .orderBy(customers.name),
    db
      .select({ id: ticketStatuses.id, name: ticketStatuses.name })
      .from(ticketStatuses)
      .where(eq(ticketStatuses.organizationId, orgId))
      .orderBy(ticketStatuses.sortOrder),
    isBusiness
      ? db
          .select({ id: stores.id, name: stores.name })
          .from(stores)
          .where(eq(stores.organizationId, orgId))
          .orderBy(stores.name)
      : Promise.resolve([]),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .innerJoin(memberships, and(eq(memberships.userId, users.id), eq(memberships.organizationId, orgId)))
      .orderBy(users.name),
    db
      .select({ fault: tickets.faultDescription, cnt: sql<number>`count(*)` })
      .from(tickets)
      .where(and(
        eq(tickets.organizationId, orgId),
        isNull(tickets.deletedAt),
        sql`${tickets.faultDescription} is not null and ${tickets.faultDescription} != ''`,
      ))
      .groupBy(tickets.faultDescription)
      .orderBy(sql`count(*) desc`)
      .limit(12),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tickets">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Ticket
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Nuovo ticket</h1>
      </div>

      <NewTicketForm customers={customerList} statuses={statusList} stores={storeList} teamMembers={teamMembers} faultSuggestions={faultRows.map((r) => r.fault!)} />
    </div>
  );
}
