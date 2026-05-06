export type Role = "owner" | "admin" | "technician" | "front_desk";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Proprietario",
  admin: "Amministratore",
  technician: "Tecnico",
  front_desk: "Reception",
};

const ROLE_ORDER: Role[] = ["front_desk", "technician", "admin", "owner"];

export function hasMinRole(role: string | null | undefined, min: Role): boolean {
  if (!role) return false;
  return ROLE_ORDER.indexOf(role as Role) >= ROLE_ORDER.indexOf(min);
}

export const can = {
  accessSettings:  (role: string | null | undefined) => role === "owner",
  accessReports:   (role: string | null | undefined) => hasMinRole(role, "admin"),
  accessInventory: (role: string | null | undefined) => hasMinRole(role, "technician"),
  accessSuppliers: (role: string | null | undefined) => hasMinRole(role, "technician"),
  accessRegistry:  (role: string | null | undefined) => hasMinRole(role, "technician"),
  accessImei:      (role: string | null | undefined) => hasMinRole(role, "technician"),
  delete:          (role: string | null | undefined) => hasMinRole(role, "admin"),
  manageTeam:      (role: string | null | undefined) => role === "owner",
  editOrgSettings: (role: string | null | undefined) => role === "owner",
};

// ─── Module-level granular permissions ──────────────────────────────────────

export const MODULE_IDS = [
  "tickets",
  "customers",
  "imei",
  "inventory",
  "suppliers",
  "pos",
  "reports",
  "registry",
  "stores",
  "support",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export const MODULE_LABELS: Record<ModuleId, string> = {
  tickets:   "Ticket",
  customers: "Clienti",
  imei:      "Storico IMEI",
  inventory: "Magazzino",
  suppliers: "Fornitori",
  pos:       "Cassa POS",
  reports:   "Report",
  registry:  "Registro Usato",
  stores:    "Sedi",
  support:   "Assistenza",
};

export type RolePermissions = Partial<Record<Role, ModuleId[]>>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  owner:      [...MODULE_IDS],
  admin:      [...MODULE_IDS],
  technician: ["tickets", "customers", "imei", "inventory", "suppliers", "support"],
  front_desk: ["tickets", "customers", "pos", "support"],
};

export function getModulesForRole(
  role: string | null | undefined,
  orgPermissions: RolePermissions | null | undefined,
): ModuleId[] {
  if (role === "owner") return [...MODULE_IDS];
  const r = role as Role;
  const stored = orgPermissions?.[r];
  return stored ?? DEFAULT_ROLE_PERMISSIONS[r] ?? [];
}

export function canAccessModule(
  role: string | null | undefined,
  module: ModuleId,
  orgPermissions?: RolePermissions | null,
): boolean {
  return getModulesForRole(role, orgPermissions ?? null).includes(module);
}

// ─── Plan gating ────────────────────────────────────────────────────────────

export type Plan = "start" | "pro" | "business" | "gift";
const PLAN_LEVEL: Record<string, number> = { start: 0, pro: 1, business: 2, gift: 2 };

export function hasPlan(plan: string | null | undefined, minPlan: "pro" | "business"): boolean {
  if (!plan) return false;
  return (PLAN_LEVEL[plan] ?? -1) >= (PLAN_LEVEL[minPlan] ?? 99);
}
