import { db } from "@/lib/db";
import { requirePlan } from "@/lib/require-plan";
import { usedItemsRegistry } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import Link from "next/link";
import { Plus, BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function RegistryPage() {
  const session = await requirePlan("business");
  if (!can.accessRegistry(session.user.role)) redirect("/dashboard");
  const orgId = session.user.organizationId!;

  const entries = await db
    .select()
    .from(usedItemsRegistry)
    .where(eq(usedItemsRegistry.organizationId, orgId))
    .orderBy(desc(usedItemsRegistry.date));

  const docTypeLabels: Record<string, string> = {
    carta_identita: "Carta d'identità",
    patente: "Patente",
    passaporto: "Passaporto",
    altro: "Altro",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registro Usato</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro acquisto/vendita articoli usati (Art. 126-128 TULPS)
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/registry/export-csv" download>
            <Button variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Esporta CSV</span>
            </Button>
          </a>
          <Link href="/registry/new">
            <Button className="gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" />Nuova registrazione</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-md border bg-amber-50 border-amber-200 px-4 py-3 text-sm text-amber-800">
        <strong>Attenzione:</strong> Il registro è obbligatorio per legge. I dati inseriti non possono essere modificati o eliminati. Assicurarsi di inserire dati corretti e verificati.
      </div>

      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h2 className="text-lg font-semibold">Registro vuoto</h2>
            <p className="mt-1 text-sm text-muted-foreground">Aggiungi la prima registrazione di acquisto/vendita usato.</p>
            <Link href="/registry/new" className="mt-4">
              <Button className="gap-2"><Plus className="h-4 w-4" />Nuova registrazione</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Articolo</th>
                <th className="px-4 py-3">IMEI/Seriale</th>
                <th className="px-4 py-3">Controparte</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3 text-right">Acquisto</th>
                <th className="px-4 py-3 text-right">Vendita</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono font-bold text-muted-foreground">
                    #{String(e.counter).padStart(4, "0")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Intl.DateTimeFormat("it-IT").format(new Date(e.date))}
                  </td>
                  <td className="px-4 py-3 font-medium">{e.description}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.imeiOrSerial ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.counterpartyName}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    <p>{docTypeLabels[e.counterpartyDocType]}</p>
                    <p className="font-mono">{e.counterpartyDocNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {e.purchasePriceCents != null ? formatCurrency(e.purchasePriceCents) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {e.sellPriceCents != null ? formatCurrency(e.sellPriceCents) : "—"}
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
