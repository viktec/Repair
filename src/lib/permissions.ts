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
  const idx = ROLE_ORDER.indexOf(role as Role);
  return idx >= ROLE_ORDER.indexOf(min);
}

export const can = {
  accessSettings: (role: string | null | undefined) => role === "owner",
  accessReports:  (role: string | null | undefined) => hasMinRole(role, "admin"),
  accessInventory:(role: string | null | undefined) => hasMinRole(role, "technician"),
  accessSuppliers:(role: string | null | undefined) => hasMinRole(role, "technician"),
  accessRegistry: (role: string | null | undefined) => hasMinRole(role, "technician"),
  accessImei:     (role: string | null | undefined) => hasMinRole(role, "technician"),
  delete:         (role: string | null | undefined) => hasMinRole(role, "admin"),
  manageTeam:     (role: string | null | undefined) => role === "owner",
  editOrgSettings:(role: string | null | undefined) => role === "owner",
};
