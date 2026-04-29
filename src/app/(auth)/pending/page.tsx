import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations, memberships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { Clock, XCircle, CheckCircle2 } from "lucide-react";

export default async function PendingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orgId = session.user.organizationId;
  if (!orgId) redirect("/login");

  const [org] = await db
    .select({
      registrationStatus: organizations.registrationStatus,
      rejectionReason: organizations.rejectionReason,
      name: organizations.name,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) redirect("/login");

  if (org.registrationStatus === "approved") redirect("/dashboard");

  const isPending = org.registrationStatus === "pending";

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow-sm text-center space-y-5">
        {isPending ? (
          <>
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Richiesta in attesa</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                La tua richiesta di accesso per <strong>{org.name}</strong> è in fase di valutazione.
                Riceverai un&rsquo;email non appena sarà elaborata.
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Di solito l&rsquo;approvazione avviene entro 24 ore nei giorni lavorativi.
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Richiesta non approvata</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                La tua richiesta di accesso per <strong>{org.name}</strong> non è stata approvata.
              </p>
            </div>
            {org.rejectionReason && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 text-left">
                <p className="font-semibold mb-1">Motivazione:</p>
                <p>{org.rejectionReason}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Per informazioni scrivi a{" "}
              <a href={`mailto:${process.env.ADMIN_EMAIL ?? "info@my-repair.it"}`} className="text-primary underline">
                {process.env.ADMIN_EMAIL ?? "info@my-repair.it"}
              </a>
            </p>
          </>
        )}

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm text-muted-foreground hover:bg-slate-50"
          >
            Esci dall&rsquo;account
          </button>
        </form>
      </div>
    </div>
  );
}
