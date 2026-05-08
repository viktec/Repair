import { requirePlan } from "@/lib/require-plan";
import { db } from "@/lib/db";
import { deviceAppraisals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import Link from "next/link";
import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SelfServiceLinkBox } from "./self-service-link-box";
import { PeriziaRowActions } from "./perizia-row-actions";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Bozza", color: "bg-slate-100 text-slate-600" },
  survey_sent: { label: "Survey inviato", color: "bg-blue-100 text-blue-700" },
  survey_completed: { label: "Survey compilato", color: "bg-amber-100 text-amber-700" },
  ai_evaluated: { label: "Valutato AI", color: "bg-purple-100 text-purple-700" },
  approved: { label: "Approvato", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rifiutato", color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancellato", color: "bg-red-50 text-red-400" },
};

function fmt(cents: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default async function PerizieListPage() {
  const session = await requirePlan("business");
  if (!can.accessRegistry(session.user.role)) redirect("/dashboard");
  const orgId = session.user.organizationId!;

  const perizie = await db
    .select()
    .from(deviceAppraisals)
    .where(eq(deviceAppraisals.organizationId, orgId))
    .orderBy(desc(deviceAppraisals.createdAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perizie Usato</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Valutazione dispositivi usati con questionario cliente e AI
          </p>
        </div>
        <Link href="/registry/perizie/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />Nuova perizia
          </Button>
        </Link>
      </div>

      <SelfServiceLinkBox orgId={orgId} />

      {perizie.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Wrench className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold">Nessuna perizia</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea una perizia, manda il link al cliente e ottieni una valutazione AI.
            </p>
            <Link href="/registry/perizie/new" className="mt-4">
              <Button className="gap-2"><Plus className="h-4 w-4" />Nuova perizia</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Dispositivo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3 text-right">Offerta</th>
                <th className="px-4 py-3 text-right">Data</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {perizie.map((p) => {
                const st = STATUS_LABELS[p.status] ?? { label: p.status, color: "bg-slate-100 text-slate-600" };
                const offer = p.finalValuationCents != null
                  ? fmt(p.finalValuationCents + p.tradeInBonusCents)
                  : null;
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {p.brand} {p.model}{p.storageGb ? ` ${p.storageGb}` : ""}
                      </p>
                      {p.color && <p className="text-xs text-muted-foreground">{p.color}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{p.customerName ?? <span className="italic text-slate-400">—</span>}</p>
                      {p.customerPhone && <p className="text-xs">{p.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {offer ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                      {new Intl.DateTimeFormat("it-IT").format(new Date(p.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PeriziaRowActions id={p.id} status={p.status} />
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
