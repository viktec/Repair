import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { supportPackages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/lib/support-utils";
import { formatCurrency } from "@/lib/utils";
import { hasMinRole } from "@/lib/permissions";
import { PackageActions } from "./package-actions";

export default async function PackagesPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  const orgId = session.user.organizationId;
  const isAdmin = hasMinRole(session.user.role, "admin");

  const packages = await db
    .select()
    .from(supportPackages)
    .where(eq(supportPackages.organizationId, orgId))
    .orderBy(supportPackages.priorityLevel);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/support" className="text-muted-foreground hover:text-foreground text-sm">Assistenza</Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-2xl font-bold text-foreground">Pacchetti</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {packages.length} {packages.length === 1 ? "pacchetto" : "pacchetti"} configurati
          </p>
        </div>
        {isAdmin && (
          <Link href="/support/packages/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuovo pacchetto
            </Button>
          </Link>
        )}
      </div>

      {packages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Headset className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Nessun pacchetto ancora</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Crea il primo pacchetto di assistenza o carica i preset dalla dashboard.
            </p>
            {isAdmin && (
              <Link href="/support/packages/new" className="mt-6">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crea pacchetto
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Ore totali</th>
                <th className="px-4 py-3">Prezzo</th>
                <th className="px-4 py-3">Urgenza</th>
                <th className="px-4 py-3">Priorità</th>
                <th className="px-4 py-3">Stato</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-b last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-foreground">{pkg.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatMinutes(pkg.totalMinutes)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(pkg.priceCents)}</td>
                  <td className="px-4 py-3 text-muted-foreground">+{pkg.urgencySurchargePercent}%</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      P{pkg.priorityLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {pkg.isActive ? (
                      <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-300 bg-emerald-50">Attivo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-slate-500">Inattivo</Badge>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <PackageActions id={pkg.id} isActive={pkg.isActive} name={pkg.name} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
