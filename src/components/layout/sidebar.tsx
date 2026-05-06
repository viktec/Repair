"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Ticket, Users, Settings, Wrench, Package,
  BarChart3, ChevronRight, Smartphone, ShoppingCart, Truck,
  BookOpen, Gift, MapPin, Headset, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPlan } from "@/lib/permissions";
import type { ModuleId } from "@/lib/permissions";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  module?: ModuleId;
  planRequired?: "pro" | "business";
  always?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard",      always: true },
  { href: "/tickets",    icon: Ticket,           label: "Ticket",          module: "tickets" },
  { href: "/customers",  icon: Users,            label: "Clienti",         module: "customers" },
  { href: "/imei",       icon: Smartphone,       label: "Storico IMEI",    module: "imei" },
  { href: "/inventory",  icon: Package,          label: "Magazzino",       module: "inventory",  planRequired: "pro" },
  { href: "/suppliers",  icon: Truck,            label: "Fornitori",       module: "suppliers",  planRequired: "pro" },
  { href: "/pos",        icon: ShoppingCart,     label: "Cassa POS",       module: "pos",        planRequired: "pro" },
  { href: "/reports",    icon: BarChart3,        label: "Report",          module: "reports",    planRequired: "pro" },
  { href: "/registry",   icon: BookOpen,         label: "Registro Usato",  module: "registry",   planRequired: "business" },
  { href: "/stores",     icon: MapPin,           label: "Sedi",            module: "stores",     planRequired: "business" },
  { href: "/support",    icon: Headset,          label: "Assistenza",      module: "support" },
];

const bottomItems: NavItem[] = [
  { href: "/guide",     icon: HelpCircle, label: "Guida",           always: true },
  { href: "/settings",  icon: Settings,   label: "Impostazioni",    always: true },
];

const PLAN_LABELS: Record<string, string> = {
  start: "Start", pro: "Pro", business: "Business", gift: "Omaggio",
};

export function Sidebar({
  role,
  plan,
  subscriptionStatus,
  trialDaysLeft,
  allowedModules,
}: {
  role?: string | null;
  plan?: string | null;
  subscriptionStatus?: string | null;
  trialDaysLeft?: number | null;
  allowedModules?: string[];
}) {
  const pathname = usePathname();
  const planLabel = PLAN_LABELS[plan ?? "start"] ?? "Start";

  const allowed = new Set(allowedModules ?? []);

  const visibleItems = navItems.filter((item) => {
    if (item.always) return true;
    if (item.module && !allowed.has(item.module)) return false;
    if (item.planRequired && !hasPlan(plan ?? "start", item.planRequired)) return false;
    return true;
  });

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Wrench className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-foreground">My-Repair</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="border-t p-3 space-y-1">
        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        <div className="pt-1">
          <PlanWidget
            plan={plan ?? "start"}
            planLabel={planLabel}
            subscriptionStatus={subscriptionStatus ?? "trial"}
            trialDaysLeft={trialDaysLeft ?? null}
          />
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
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
}

function PlanWidget({
  plan, planLabel, subscriptionStatus, trialDaysLeft,
}: {
  plan: string; planLabel: string; subscriptionStatus: string; trialDaysLeft: number | null;
}) {
  if (subscriptionStatus === "trial") {
    const days = trialDaysLeft ?? 0;
    const pct = Math.max(0, Math.min(100, (days / 14) * 100));
    const barColor = days <= 2 ? "bg-red-500" : days <= 5 ? "bg-amber-500" : "bg-primary";
    const textColor = days <= 2 ? "text-red-600" : days <= 5 ? "text-amber-600" : "text-muted-foreground";
    return (
      <Link href="/upgrade" className="block rounded-md bg-primary/5 p-3 hover:bg-primary/10 transition-colors">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Piano {planLabel}</p>
          <span className="text-[10px] font-medium text-amber-600 bg-amber-100 rounded-full px-1.5 py-0.5">Trial</span>
        </div>
        <div className="mt-2 w-full bg-slate-200 rounded-full h-1">
          <div className={`h-1 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <p className={`mt-1.5 text-[10px] ${textColor}`}>
          {days === 0 ? "Scade oggi — attiva il piano" : `${days} ${days === 1 ? "giorno" : "giorni"} al termine`}
        </p>
      </Link>
    );
  }
  if (subscriptionStatus === "active") {
    if (plan === "gift") {
      return (
        <div className="rounded-md bg-primary/5 p-3">
          <div className="flex items-center gap-1.5">
            <Gift className="h-3 w-3 text-primary" />
            <p className="text-xs font-semibold text-foreground">Piano {planLabel}</p>
          </div>
          <p className="mt-1 text-[10px] text-primary font-medium">Attivo</p>
        </div>
      );
    }
    return (
      <Link href="/upgrade" className="block rounded-md bg-primary/5 p-3 hover:bg-primary/10 transition-colors">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Piano {planLabel}</p>
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">Abbonamento attivo</p>
      </Link>
    );
  }
  if (subscriptionStatus === "past_due") {
    return (
      <Link href="/upgrade" className="block rounded-md bg-amber-50 border border-amber-200 p-3 hover:bg-amber-100 transition-colors">
        <p className="text-xs font-semibold text-amber-800">Piano {planLabel}</p>
        <p className="mt-1 text-[10px] text-amber-700">Pagamento in sospeso</p>
      </Link>
    );
  }
  return (
    <Link href="/upgrade" className="block rounded-md bg-red-50 border border-red-200 p-3 hover:bg-red-100 transition-colors">
      <p className="text-xs font-semibold text-red-800">Piano {planLabel}</p>
      <p className="mt-1 text-[10px] text-red-700">Abbonamento non attivo</p>
    </Link>
  );
}
