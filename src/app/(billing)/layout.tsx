import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import Link from "next/link";

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 w-fit">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-foreground">My-Repair</span>
        </Link>
      </header>
      {children}
    </div>
  );
}
