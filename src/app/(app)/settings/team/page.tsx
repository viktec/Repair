import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberships, users, organizationInvites } from "@/db/schema";
import { eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { can, ROLE_LABELS, type Role } from "@/lib/permissions";
import { TeamMemberRow } from "./team-member-row";
import { InviteForm } from "./invite-form";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  if (!can.manageTeam(session.user.role)) redirect("/settings");
  const orgId = session.user.organizationId;

  const [members, pendingInvites] = await Promise.all([
    db
      .select({
        userId: memberships.userId,
        role: memberships.role,
        name: users.name,
        email: users.email,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.organizationId, orgId))
      .orderBy(memberships.role),

    db
      .select({
        id: organizationInvites.id,
        email: organizationInvites.email,
        role: organizationInvites.role,
        expiresAt: organizationInvites.expiresAt,
      })
      .from(organizationInvites)
      .where(eq(organizationInvites.organizationId, orgId) && gt(organizationInvites.expiresAt, new Date()))
      .orderBy(organizationInvites.createdAt),
  ]);

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
          <h1 className="text-xl font-bold">Gestione team</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} membro{members.length !== 1 ? "i" : ""}
          </p>
        </div>
      </div>

      {/* Active members */}
      <div className="space-y-2">
        {members.map((m) => (
          <TeamMemberRow
            key={m.userId}
            userId={m.userId}
            name={m.name}
            email={m.email!}
            role={m.role as Role}
            isSelf={m.userId === session.user.id}
          />
        ))}
      </div>

      {/* Invite section */}
      <div className="rounded-lg border p-5 space-y-4">
        <InviteForm pendingInvites={pendingInvites} />
      </div>

      {/* Role summary */}
      <div className="rounded-lg bg-slate-50 border p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground mb-2">Riepilogo ruoli</p>
        {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([role, label]) => (
          <div key={role} className="flex items-start gap-2">
            <span className="font-medium w-28 shrink-0">{label}</span>
            <span>
              {role === "owner" && "Accesso completo, gestisce team e impostazioni organizzazione."}
              {role === "admin" && "Accesso completo a ticket, clienti, magazzino, report. Non gestisce il team."}
              {role === "technician" && "Ticket, clienti, magazzino, registro usato, IMEI. Nessun accesso a report e impostazioni."}
              {role === "front_desk" && "Solo ticket, clienti e cassa POS. Accesso minimo."}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
