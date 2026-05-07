import { db } from "@/lib/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SelfServiceForm } from "./self-service-form";
import { Wrench } from "lucide-react";

export default async function SelfServiceAppraisalPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;

  const [org] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) notFound();

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">{org.name}</span>
        </div>
        <p className="text-center text-sm text-muted-foreground mb-8">Valutazione dispositivo usato</p>

        <div className="rounded-2xl bg-white border shadow-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold">Richiedi una valutazione</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Inserisci i dati del dispositivo e i tuoi contatti. Riceverai un'offerta indicativa entro poche ore.
            </p>
          </div>

          <SelfServiceForm orgId={orgId} />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by my-repair.it
        </p>
      </div>
    </div>
  );
}
