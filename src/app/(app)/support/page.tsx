import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerContracts, customers, supportPackages, supportInterventions } from "@/db/schema";
import { eq, and, sql, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/lib/support-utils";
import { formatDate } from "@/lib/utils";
import { SeedPackagesButton } from "./seed-packages-button";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeContractsResult, monthInterventionsResult, openInterventionsResult, contracts, packageCount] =
    await Promise.all([
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(customerContracts)
        .where(and(eq(customerContracts.organizationId, orgId), eq(customerContracts.status, "active"))),

      db
        .select({ total: sql<number>`coalesce(sum(${supportInterventions.billableMinutes}), 0)::int` })
        .from(supportInterventions)
        .innerJoin(customerContracts, eq(customerContracts.id, supportInterventions.contractId))
        .where(
          and(
            eq(supportInterventions.organizationId, orgId),
            sql`${supportInterventions.createdAt} >= ${startOfMonth}`,
          ),
        ),

      db
        .select({ total: sql<number>`count(*)::int` })
        .from(supportInterventions)
        .where(
          and(
            eq(supportInterventions.organizationId, orgId),
            or(
              eq(supportInterventions.status, "open"),
              eq(supportInterventions.status, "in_progress"),
            ),
          ),
        ),

      db
        .select({
          id: customerContracts.id,
          contractNumber: customerContracts.contractNumber,
          status: customerContracts.status,
          totalMinutes: customerContracts.totalMinutes,
          usedMinutes: customerContracts.usedMinutes,
          endDate: customerContracts.endDate,
          customerName: customers.name,
          packageName: supportPackages.name,
        })
        .from(customerContracts)
        .innerJoin(customers, eq(customers.id, customerContracts.customerId))
        .leftJoin(supportPackages, eq(supportPackages.id, customerContracts.packageId))
        .where(and(eq(customerContracts.organizationId, orgId), eq(customerContracts.status, "active")))
        .orderBy(customerContracts.endDate),

      db
        .select({ total: sql<number>`count(*)::int` })
        .from(supportPackages)
        .where(eq(supportPackages.organizationId, orgId)),
    ]);

  const activeCount = activeContractsResult[0]?.total ?? 0;
  const monthMinutes = monthInterventionsResult[0]?.total ?? 0;
  const openCount = openInterventionsResult[0]?.total ?? 0;
  const totalPackages = packageCount[0]?.total ?? 0;

  function getAlertLevel(contract: typeof contracts[number]): "red" | "yellow" | null {
    const remaining = contract.totalMinutes - contract.usedMinutes;
    const pct = contract.totalMinutes > 0 ? remaining / contract.totalMinutes : 1;
    const daysLeft = Math.ceil((new Date(contract.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (pct < 0.1 || daysLeft <= 7) return "red";
    if (pct < 0.25 || daysLeft <= 30) return "yellow";
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assistenza Business</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestione contratti e interventi di supporto</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/support/packages">
            <Button variant="outline" className="gap-2">
              <Headset className="h-4 w-4" />
              Pacchetti
            </Button>
          </Link>
          <Link href="/support/contracts/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuovo contratto
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contratti attivi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ore erogate (mese)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatMinutes(monthMinutes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Richieste aperte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{openCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Seed packages prompt */}
      {totalPackages === 0 && (
        <Card className="border-dashed border-amber-300 bg-amber-50">
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-5">
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Nessun pacchetto configurato</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Carica i pacchetti predefiniti BASIC / BRONZE / SILVER / GOLD per iniziare subito.
              </p>
            </div>
            <SeedPackagesButton />
          </CardContent>
        </Card>
      )}

      {/* Contracts list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Contratti attivi</h2>
          <Link href="/support/contracts">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              Tutti i contratti →
            </Button>
          </Link>
        </div>

        {contracts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Headset className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">Nessun contratto attivo</p>
              <Link href="/support/contracts/new" className="mt-4">
                <Button variant="outline" size="sm">Crea il primo contratto</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Pacchetto</th>
                  <th className="px-4 py-3 w-48">Ore residue</th>
                  <th className="px-4 py-3">Scadenza</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => {
                  const remaining = c.totalMinutes - c.usedMinutes;
                  const pct = c.totalMinutes > 0 ? Math.max(0, (remaining / c.totalMinutes) * 100) : 0;
                  const alert = getAlertLevel(c);
                  const daysLeft = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {alert === "red" && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-500" />}
                        {alert === "yellow" && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-400" />}
                        {c.customerName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.packageName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className={alert === "red" ? "text-red-600 font-medium" : alert === "yellow" ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                              {formatMinutes(remaining)}
                            </span>
                            <span className="text-muted-foreground">{formatMinutes(c.totalMinutes)}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-200">
                            <div
                              className={`h-1.5 rounded-full transition-all ${alert === "red" ? "bg-red-500" : alert === "yellow" ? "bg-amber-400" : "bg-primary"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <div>
                          {formatDate(c.endDate)}
                          <span className={`ml-1.5 text-xs ${daysLeft <= 7 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-muted-foreground"}`}>
                            ({daysLeft}gg)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300 bg-emerald-50">
                          Attivo
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/support/contracts/${c.id}`}>
                          <Button variant="outline" size="sm">Dettaglio</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
