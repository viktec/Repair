import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, tickets, customers, ticketStatuses } from "@/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket, Users, Package, TrendingUp, ArrowRight, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.organizationId) redirect("/onboarding");
  const orgId = session.user.organizationId;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) redirect("/login");
  if (!org.onboardingCompletedAt) redirect("/onboarding");

  const [ticketCount, customerCount, openTicketCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(tickets)
      .where(and(eq(tickets.organizationId, orgId), isNull(tickets.deletedAt)))
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.organizationId, orgId))
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(tickets)
      .leftJoin(ticketStatuses, eq(ticketStatuses.id, tickets.statusId))
      .where(
        and(
          eq(tickets.organizationId, orgId),
          isNull(tickets.deletedAt),
          eq(ticketStatuses.isFinal, false),
        ),
      )
      .then((r) => r[0].count),
  ]);

  const stats = [
    { label: "Ticket aperti", value: String(openTicketCount), icon: Ticket, color: "text-blue-600" },
    { label: "Clienti", value: String(customerCount), icon: Users, color: "text-emerald-600" },
    { label: "Ricambi in magazzino", value: "—", icon: Package, color: "text-amber-600" },
    { label: "Ticket totali", value: String(ticketCount), icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Ciao, {session.user.name?.split(" ")[0] ?? "benvenuto"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ecco il riepilogo di {org.name} per oggi.
        </p>
      </div>

      {/* Trial banner */}
      {org.subscriptionStatus === "trial" && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <span>⏳</span>
            <span>
              Sei in periodo di prova.{" "}
              <strong>14 giorni rimasti</strong> — nessuna carta richiesta.
            </span>
          </div>
          <Badge variant="outline" className="border-amber-400 text-amber-700 text-xs">
            Trial
          </Badge>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Disponibile quando crei i primi ticket
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state CTA */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Il tuo laboratorio digitale è pronto.
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Crea il primo ticket per iniziare. Inserisci il dispositivo, le foto del danno, e il tuo
            cliente riceverà automaticamente il link di tracking.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/tickets/new">
              <Button className="gap-2">
                <Ticket className="h-4 w-4" />
                Nuovo ticket
              </Button>
            </Link>
            <Link href="/customers/new">
              <Button variant="outline" className="gap-2">
                Aggiungi cliente
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
