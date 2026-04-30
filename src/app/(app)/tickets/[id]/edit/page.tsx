import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, customers, ticketStatuses } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditTicketForm } from "./form";

export default async function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const [ticket] = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      customerId: tickets.customerId,
      deviceBrand: tickets.deviceBrand,
      deviceModel: tickets.deviceModel,
      deviceImei: tickets.deviceImei,
      deviceSerial: tickets.deviceSerial,
      devicePatternLock: tickets.devicePatternLock,
      accessories: tickets.accessories,
      deviceCondition: tickets.deviceCondition,
      faultDescription: tickets.faultDescription,
      estimatedCost: tickets.estimatedCost,
    })
    .from(tickets)
    .where(and(eq(tickets.id, id), eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)))
    .limit(1);

  if (!ticket) notFound();

  const [customerList, statuses] = await Promise.all([
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/tickets/${id}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Ticket #{String(ticket.ticketNumber).padStart(4, "0")}
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Modifica ticket</h1>
      </div>

      <EditTicketForm ticket={ticket} customers={customerList} />
    </div>
  );
}
