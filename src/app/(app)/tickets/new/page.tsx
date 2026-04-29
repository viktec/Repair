import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, ticketStatuses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewTicketForm } from "./form";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [customerList, statusList] = await Promise.all([
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

      <NewTicketForm customers={customerList} statuses={statusList} />
    </div>
  );
}
