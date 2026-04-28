"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LayoutList, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ViewToggle({ current }: { current: "list" | "kanban" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(v: "list" | "kanban") {
    const p = new URLSearchParams(searchParams.toString());
    if (v === "list") p.delete("view");
    else p.set("view", "kanban");
    router.push(`${pathname}${p.size ? `?${p}` : ""}`);
  }

  return (
    <div className="flex rounded-md border bg-white">
      <button
        onClick={() => setView("list")}
        className={cn(
          "flex items-center gap-1.5 rounded-l-md px-3 py-1.5 text-sm font-medium transition-colors",
          current === "list"
            ? "bg-primary text-white"
            : "text-muted-foreground hover:bg-slate-50",
        )}
      >
        <LayoutList className="h-3.5 w-3.5" />
        Lista
      </button>
      <button
        onClick={() => setView("kanban")}
        className={cn(
          "flex items-center gap-1.5 rounded-r-md px-3 py-1.5 text-sm font-medium transition-colors border-l",
          current === "kanban"
            ? "bg-primary text-white"
            : "text-muted-foreground hover:bg-slate-50",
        )}
      >
        <Columns3 className="h-3.5 w-3.5" />
        Kanban
      </button>
    </div>
  );
}
