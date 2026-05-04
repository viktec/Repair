import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ticketTags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { can } from "@/lib/permissions";
import { TagsManager } from "./tags-manager";

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!can.delete(session.user.role)) redirect("/settings");
  const orgId = session.user.organizationId;

  const tags = await db
    .select({ id: ticketTags.id, name: ticketTags.name, color: ticketTags.color })
    .from(ticketTags)
    .where(eq(ticketTags.organizationId, orgId))
    .orderBy(ticketTags.name);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Impostazioni
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Etichette</h1>
          <p className="text-sm text-muted-foreground">
            {tags.length} etichett{tags.length === 1 ? "a" : "e"} configurat{tags.length === 1 ? "a" : "e"}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 border p-4 flex items-start gap-3 text-sm text-muted-foreground">
        <Tag className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
        <p>
          Le etichette ti permettono di categorizzare i ticket per tipo di riparazione, priorità o qualsiasi altra classificazione utile.
          Puoi assegnarle direttamente dal dettaglio del ticket e filtrare la lista ticket per etichetta.
        </p>
      </div>

      <TagsManager initialTags={tags} />
    </div>
  );
}
