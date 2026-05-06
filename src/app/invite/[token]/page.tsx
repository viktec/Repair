import { db } from "@/lib/db";
import { organizationInvites, organizations, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { AcceptButton } from "./accept-button";
import { RegisterForm } from "./register-form";
import { Wrench } from "lucide-react";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [invite] = await db
    .select({
      id: organizationInvites.id,
      email: organizationInvites.email,
      role: organizationInvites.role,
      expiresAt: organizationInvites.expiresAt,
      organizationId: organizationInvites.organizationId,
    })
    .from(organizationInvites)
    .where(and(eq(organizationInvites.token, token), gt(organizationInvites.expiresAt, new Date())))
    .limit(1);

  if (!invite) notFound();

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, invite.organizationId))
    .limit(1);

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, invite.email))
    .limit(1);

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  const loggedInEmail = session?.user?.email?.toLowerCase();
  const emailMatches = loggedInEmail === invite.email.toLowerCase();

  const roleLabel = ROLE_LABELS[invite.role as Role] ?? invite.role;
  const orgName = org?.name ?? "il team";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Invito al team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sei stato invitato a unirti a <strong>{orgName}</strong>
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
          {/* Invite details */}
          <div className="rounded-lg bg-slate-50 border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{invite.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ruolo</span>
              <span className="font-medium">{roleLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organizzazione</span>
              <span className="font-medium">{orgName}</span>
            </div>
          </div>

          {/* Case 1: logged in with correct email */}
          {isLoggedIn && emailMatches && (
            <AcceptButton token={token} />
          )}

          {/* Case 2: logged in with wrong email */}
          {isLoggedIn && !emailMatches && (
            <div className="space-y-3">
              <p className="text-sm text-amber-700 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                Sei loggato come <strong>{loggedInEmail}</strong>, ma questo invito è per{" "}
                <strong>{invite.email}</strong>.
              </p>
              <Link
                href="/login"
                className="block text-center text-sm font-medium text-primary hover:underline"
              >
                Accedi con l&apos;account corretto
              </Link>
            </div>
          )}

          {/* Case 3: not logged in, email has account */}
          {!isLoggedIn && existingUser && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Esiste già un account con l&apos;email <strong>{invite.email}</strong>. Accedi per accettare l&apos;invito.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
                className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Accedi per accettare
              </Link>
            </div>
          )}

          {/* Case 4: not logged in, new user */}
          {!isLoggedIn && !existingUser && (
            <RegisterForm token={token} email={invite.email} />
          )}
        </div>
      </div>
    </div>
  );
}
