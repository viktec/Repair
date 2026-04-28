import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Users, Building2, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user] = await db
    .select({ isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="flex h-full w-56 flex-col border-r bg-slate-900 text-white">
        <div className="flex h-14 items-center gap-2 border-b border-slate-700 px-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Super Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <Building2 className="h-4 w-4" />
            Organizzazioni
          </Link>
          <Link href="/admin/users" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            <Users className="h-4 w-4" />
            Utenti
          </Link>
        </nav>
        <div className="border-t border-slate-700 p-3">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />
            Torna all&apos;app
          </Link>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b bg-white px-6">
          <span className="text-sm font-medium text-muted-foreground">
            Pannello di amministrazione — my-repair.it
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
