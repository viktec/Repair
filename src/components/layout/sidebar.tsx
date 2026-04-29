"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  Wrench,
  Package,
  BarChart3,
  ChevronRight,
  Smartphone,
  ShoppingCart,
  Truck,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can, type Role } from "@/lib/permissions";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  visible: (role: string | null | undefined) => boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",      visible: () => true },
  { href: "/tickets",    icon: Ticket,          label: "Ticket",          visible: () => true },
  { href: "/customers",  icon: Users,           label: "Clienti",         visible: () => true },
  { href: "/imei",       icon: Smartphone,      label: "Storico IMEI",    visible: can.accessImei },
  { href: "/inventory",  icon: Package,         label: "Magazzino",       visible: can.accessInventory },
  { href: "/suppliers",  icon: Truck,           label: "Fornitori",       visible: can.accessSuppliers },
  { href: "/pos",        icon: ShoppingCart,    label: "Cassa POS",       visible: () => true },
  { href: "/reports",    icon: BarChart3,       label: "Report",          visible: can.accessReports },
  { href: "/registry",   icon: BookOpen,        label: "Registro Usato",  visible: can.accessRegistry },
  { href: "/settings",   icon: Settings,        label: "Impostazioni",    visible: () => true },
];

export function Sidebar({ role }: { role?: string | null }) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) => item.visible(role));

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Wrench className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-foreground">My-Repair</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3.5 w-3.5" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="rounded-md bg-primary/5 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Piano Solo</p>
          <p className="mt-0.5">Trial — 14 giorni rimasti</p>
        </div>
      </div>
    </aside>
  );
}
