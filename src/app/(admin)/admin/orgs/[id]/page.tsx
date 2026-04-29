import { db } from "@/lib/db";
import { organizations, memberships, tickets, users } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { OrgEditForm } from "./org-edit-form";
import { OrgApprovalCard } from "./org-approval-card";

export default async function AdminOrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  if (!org) notFound();

  const [memberCount, ticketCount] = await Promise.all([
    db.select({ total: count() }).from(memberships).where(eq(memberships.organizationId, id)).then((r) => r[0].total),
    db.select({ total: count() }).from(tickets).where(eq(tickets.organizationId, id)).then((r) => r[0].total),
  ]);

  const members = await db
    .select({ userId: memberships.userId, role: memberships.role, email: users.email, name: users.name, createdAt: memberships.createdAt })
    .from(memberships)
    .leftJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.organizationId, id));

  const regStatusConfig = {
    pending:  { label: "In attesa di approvazione", cls: "bg-amber-100 text-amber-700",     Icon: Clock },
    approved: { label: "Approvata",                  cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
    rejected: { label: "Rifiutata",                  cls: "bg-red-100 text-red-700",         Icon: XCircle },
  } as const;

  const reg = regStatusConfig[org.registrationStatus];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/orgs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Organizzazioni
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">{org.slug} — registrato il {formatDate(org.createdAt)}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${reg.cls}`}>
          <reg.Icon className="h-4 w-4" />
          {reg.label}
        </span>
      </div>

      {/* Approvazione — mostrata sempre per poter cambiare decisione */}
      <OrgApprovalCard
        orgId={org.id}
        registrationStatus={org.registrationStatus}
        rejectionReason={org.rejectionReason ?? ""}
        ownerEmail={members[0]?.email ?? ""}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-muted-foreground">Utenti</p>
          <p className="text-2xl font-bold">{memberCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-muted-foreground">Ticket totali</p>
          <p className="text-2xl font-bold">{ticketCount}</p>
        </div>
      </div>

      {/* Edit form */}
      <OrgEditForm
        orgId={org.id}
        currentPlan={org.plan}
        currentStatus={org.subscriptionStatus}
        currentNotes={org.adminNotes ?? ""}
        currentTrialEndsAt={org.trialEndsAt ? org.trialEndsAt.toISOString().split("T")[0] : ""}
      />

      {/* Members */}
      <div>
        <h2 className="font-semibold mb-3">Utenti dell&apos;organizzazione</h2>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Utente</th>
                <th className="px-4 py-3">Ruolo</th>
                <th className="px-4 py-3">Iscritto il</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.role ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.createdAt ? formatDate(m.createdAt) : "—"}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-sm">Nessun membro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
