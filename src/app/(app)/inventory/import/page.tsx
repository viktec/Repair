import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ImportClient } from "./import-client";

export default async function ImportInvoicePage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Importa fattura AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Carica il PDF di una fattura fornitore — Claude leggerà i prodotti e li aggiungerà al magazzino.
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
