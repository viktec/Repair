import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, tickets } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users, Phone, Mail, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      createdAt: customers.createdAt,
      ticketCount: count(tickets.id),
    })
    .from(customers)
    .leftJoin(tickets, eq(tickets.customerId, customers.id))
    .where(eq(customers.organizationId, session.user.organizationId))
    .groupBy(customers.id)
    .orderBy(customers.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clienti</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "cliente" : "clienti"} registrati
          </p>
        </div>
        <Link href="/customers/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nuovo cliente
          </Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Nessun cliente ancora</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Aggiungi il primo cliente per associarlo ai ticket di riparazione.
            </p>
            <Link href="/customers/new" className="mt-6">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Aggiungi cliente
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contatti</th>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Aggiunto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex flex-col gap-0.5">
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {c.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Ticket className="h-3.5 w-3.5" />
                      {c.ticketCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/tickets?customer=${c.id}`}>
                      <Button variant="outline" size="sm">
                        Ticket
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
