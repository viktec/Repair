import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { ACTION_LABELS } from "@/lib/activity";
import { ArrowLeft, Activity } from "lucide-react";
import Link from "next/link";

const ENTITY_LABELS: Record<string, string> = {
  ticket: "Ticket", customer: "Cliente", member: "Membro",
  inventory_item: "Articolo magazzino", pos_session: "Sessione POS",
  intervention: "Intervento",
};

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!can.manageTeam(session.user.role)) redirect("/settings");

  const logs = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.orgId, session.user.organizationId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(200);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <button className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Impostazioni
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Log attività</h1>
          <p className="text-sm text-muted-foreground">Ultime 200 azioni del team</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <Activity className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nessuna attività registrata.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Le azioni del team appariranno qui man mano che vengono eseguite.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm divide-y">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-4 px-5 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                {(log.userName ?? log.userEmail ?? "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium">{log.userName ?? log.userEmail ?? "Utente sconosciuto"}</span>
                  <span className="text-sm text-foreground">{ACTION_LABELS[log.action] ?? log.action}</span>
                  {log.entityLabel && (
                    <span className="text-sm text-muted-foreground">
                      · {ENTITY_LABELS[log.entityType ?? ""] ?? log.entityType} <strong className="text-foreground">{log.entityLabel}</strong>
                    </span>
                  )}
                </div>
                {log.userEmail && log.userName && (
                  <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                )}
              </div>
              <time className="text-xs text-muted-foreground shrink-0 mt-1">
                {new Intl.DateTimeFormat("it-IT", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                }).format(new Date(log.createdAt))}
              </time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
