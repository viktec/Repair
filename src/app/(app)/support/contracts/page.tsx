import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customerContracts, customers, supportPackages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/lib/support-utils";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  active: "Attivo",
  expired: "Scaduto",
  exhausted: "Esaurito",
  suspended: "Sospeso",
};

const STATUS_STYLES: Record<string, string> = {
  active: "text-emerald-700 border-emerald-300 bg-emerald-50",
  expired: "text-slate-600 border-slate-300 bg-slate-50",
  exhausted: "text-red-700 border-red-300 bg-red-50",
  suspended: "text-amber-700 border-amber-300 bg-amber-50",
};

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;

  const conditions = [eq(customerContracts.organizationId, orgId)];
  if (status && ["active", "expired", "exhausted", "suspended"].includes(status)) {
    conditions.push(eq(customerContracts.status, status));
  }

  const contracts = await db
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
    .where(and(...conditions))
    .orderBy(customerContracts.createdAt);

  const filterOptions = [
    { label: "Tutti", value: "" },
    { label: "Attivi", value: "active" },
    { label: "Scaduti", value: "expired" },
    { label: "Esauriti", value: "exhausted" },
    { label: "Sospesi", value: "suspended" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/support" className="text-muted-foreground hover:text-foreground text-sm">Assistenza</Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold text-foreground">Contratti</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {contracts.length} {contracts.length === 1 ? "contratto" : "contratti"}
          </p>
        </div>
        <Link href="/support/contracts/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo contratto
          </Button>
        </Link>
      </div>

      {/* Filtri stato */}
      <div className="flex flex-wrap gap-1.5">
        {filterOptions.map((opt) => (
          <Link key={opt.value} href={opt.value ? `/support/contracts?status=${opt.value}` : "/support/contracts"}>
            <span className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${(status ?? "") === opt.value ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {opt.label}
            </span>
          </Link>
        ))}
      </div>

      {contracts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <p className="font-medium text-muted-foreground">Nessun contratto trovato</p>
            {!status && (
              <Link href="/support/contracts/new" className="mt-4">
                <Button variant="outline" size="sm">Crea il primo contratto</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Pacchetto</th>
                <th className="px-4 py-3 w-44">Ore rimaste</th>
                <th className="px-4 py-3">Scadenza</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const remaining = c.totalMinutes - c.usedMinutes;
                const pct = c.totalMinutes > 0 ? Math.max(0, (remaining / c.totalMinutes) * 100) : 0;

                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-muted-foreground">{c.contractNumber}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{c.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.packageName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatMinutes(remaining)}</span>
                          <span>{formatMinutes(c.totalMinutes)}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200">
                          <div
                            className={`h-1.5 rounded-full transition-all ${pct < 10 ? "bg-red-500" : pct < 25 ? "bg-amber-400" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(c.endDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${STATUS_STYLES[c.status] ?? ""}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
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
  );
}
