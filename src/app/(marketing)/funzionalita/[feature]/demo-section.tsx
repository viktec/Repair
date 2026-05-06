"use client";

import dynamic from "next/dynamic";

const demos: Record<string, React.ComponentType> = {
  ticket:    dynamic(() => import("@/app/(app)/guide/tickets/ticket-demo").then(m => ({ default: m.TicketDemo }))),
  clienti:   dynamic(() => import("@/app/(app)/guide/customers/customer-demo").then(m => ({ default: m.CustomerDemo }))),
  cassa:     dynamic(() => import("@/app/(app)/guide/pos/pos-demo").then(m => ({ default: m.PosDemo }))),
  magazzino: dynamic(() => import("@/app/(app)/guide/inventory/inventory-demo").then(m => ({ default: m.InventoryDemo }))),
  report:    dynamic(() => import("@/app/(app)/guide/reports/reports-demo").then(m => ({ default: m.ReportsDemo }))),
  assistenza:dynamic(() => import("@/app/(app)/guide/support/support-demo").then(m => ({ default: m.SupportDemo }))),
  imei:      dynamic(() => import("@/app/(app)/guide/imei/imei-demo").then(m => ({ default: m.ImeiDemo }))),
  fornitori: dynamic(() => import("@/app/(app)/guide/suppliers/suppliers-demo").then(m => ({ default: m.SuppliersDemo }))),
  registro:  dynamic(() => import("@/app/(app)/guide/registry/registry-demo").then(m => ({ default: m.RegistryDemo }))),
};

export function DemoSection({ feature }: { feature: string }) {
  const Demo = demos[feature];
  if (!Demo) return null;
  return <Demo />;
}
