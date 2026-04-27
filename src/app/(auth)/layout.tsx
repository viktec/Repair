import Link from "next/link";
import { Wrench } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex h-16 items-center border-b bg-white px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-foreground">Repair</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center py-12 px-4">
        {children}
      </main>
    </div>
  );
}
