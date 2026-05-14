# POS: IMEI/SN + Scontrino digitale + Stampa termica — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere campi IMEI/S/N opzionali per articolo venduto, una pagina scontrino digitale per ogni transazione, e supporto stampa A4 + termica 80mm.

**Architecture:** Migrazione DB per i nuovi campi serializzati → aggiornamento form POS e action → nuova pagina `/pos/transactions/[id]` con dati org + articoli + stampa via `window.print()` + classe CSS `thermal-print` su `body`.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM, Tailwind CSS, lucide-react, `window.print()` nativo

---

## File Map

| File | Ruolo |
|---|---|
| `src/db/schema.ts` | +`imei`, +`serialNumber` su `posTransactionItems` |
| `src/db/migrations/` | generata da drizzle-kit |
| `src/app/(app)/pos/new/pos-sell-form.tsx` | bottone espandi + campi IMEI/SN + hidden inputs |
| `src/app/(app)/pos/new/actions.ts` | parse e salvataggio imei/serialNumber |
| `src/app/(app)/pos/page.tsx` | link "Visualizza" per ogni riga transazione |
| `src/app/(app)/pos/transactions/[id]/page.tsx` | nuova pagina scontrino (server component) |
| `src/app/(app)/pos/transactions/[id]/receipt-print-buttons.tsx` | client component pulsanti stampa |
| `src/app/globals.css` | `@media print` layout termico 80mm |

---

## Task 1: Migrazione DB — aggiunta campi IMEI e S/N

**Files:**
- Modify: `src/db/schema.ts` (intorno alla riga 420, tabella `posTransactionItems`)

- [ ] **Step 1: Aggiungere i campi allo schema**

In `src/db/schema.ts`, nella definizione di `posTransactionItems`, aggiungere due campi dopo `totalCents`:

```ts
// prima (riga ~420):
export const posTransactionItems = pgTable("pos_transaction_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => posTransactions.id, { onDelete: "cascade" }),
  inventoryItemId: uuid("inventory_item_id").references(() => inventoryItems.id, { onDelete: "set null" }),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
  discountPct: integer("discount_pct").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// dopo:
export const posTransactionItems = pgTable("pos_transaction_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => posTransactions.id, { onDelete: "cascade" }),
  inventoryItemId: uuid("inventory_item_id").references(() => inventoryItems.id, { onDelete: "set null" }),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
  discountPct: integer("discount_pct").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  imei: varchar("imei", { length: 50 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- [ ] **Step 2: Generare la migrazione**

```bash
pnpm db:generate
```

Verrà creato un file in `src/db/migrations/` con `ALTER TABLE pos_transaction_items ADD COLUMN imei varchar(50); ADD COLUMN serial_number varchar(100);`

- [ ] **Step 3: Applicare la migrazione**

```bash
pnpm db:migrate
```

Output atteso: migrazione applicata senza errori.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts src/db/migrations/
git commit -m "feat: add imei and serial_number to pos_transaction_items"
```

---

## Task 2: Form POS — campi IMEI/SN espandibili

**Files:**
- Modify: `src/app/(app)/pos/new/pos-sell-form.tsx`

- [ ] **Step 1: Estendere il tipo `CartLine` e aggiungere stato `expandedSerials`**

Aggiornare la definizione del tipo `CartLine` (riga ~21) e aggiungere uno stato:

```ts
type CartLine = {
  inventoryItemId: string | null;
  description: string;
  qty: number;
  unitPriceCents: number;
  discountPct: number;
  imei: string;
  serialNumber: string;
};
```

Nel corpo di `PosSellForm`, aggiungere dopo gli altri `useState`:

```ts
const [expandedSerials, setExpandedSerials] = useState<Set<number>>(new Set());

function toggleSerial(i: number) {
  setExpandedSerials((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    return next;
  });
}
```

- [ ] **Step 2: Aggiornare `addFromCatalog` e `addManualLine` per includere i nuovi campi**

```ts
const addFromCatalog = useCallback((item: CatalogItem) => {
  setCart((prev) => {
    const idx = prev.findIndex((l) => l.inventoryItemId === item.id);
    if (idx >= 0) {
      return prev.map((l, i) => i === idx ? { ...l, qty: l.qty + 1 } : l);
    }
    return [...prev, {
      inventoryItemId: item.id,
      description: item.name,
      qty: 1,
      unitPriceCents: item.sellPriceCents ?? 0,
      discountPct: 0,
      imei: "",
      serialNumber: "",
    }];
  });
}, []);

function addManualLine() {
  setCart((prev) => [...prev, {
    inventoryItemId: null,
    description: "",
    qty: 1,
    unitPriceCents: 0,
    discountPct: 0,
    imei: "",
    serialNumber: "",
  }]);
}
```

- [ ] **Step 3: Aggiungere hidden inputs IMEI/SN nella sezione form**

Nella sezione `{cart.map((l, i) => (` degli hidden inputs (intorno alla riga 111), aggiungere:

```tsx
<input type="hidden" name={`items[${i}][imei]`} value={l.imei} />
<input type="hidden" name={`items[${i}][serialNumber]`} value={l.serialNumber} />
```

- [ ] **Step 4: Aggiungere bottone toggle e campi IMEI/SN nel carrello**

Nella riga del carrello (il `<div key={i} className="grid ...">`) aggiungere sotto il blocco esistente, prima della chiusura del div:

```tsx
{/* Riga IMEI/SN espandibile */}
<div className="col-span-full flex flex-col gap-1.5">
  <button
    type="button"
    onClick={() => toggleSerial(i)}
    className="text-xs text-muted-foreground hover:text-foreground transition-colors w-fit flex items-center gap-1"
  >
    <span>{expandedSerials.has(i) ? "− Seriale" : "+ Seriale"}</span>
  </button>
  {expandedSerials.has(i) && (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wide">IMEI</label>
        <Input
          value={l.imei}
          onChange={(e) => updateLine(i, { imei: e.target.value })}
          placeholder="es. 356938035643809"
          className="text-xs font-mono h-8"
          maxLength={50}
        />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wide">S/N</label>
        <Input
          value={l.serialNumber}
          onChange={(e) => updateLine(i, { serialNumber: e.target.value })}
          placeholder="Numero seriale"
          className="text-xs font-mono h-8"
          maxLength={100}
        />
      </div>
    </div>
  )}
</div>
```

Nota: il `<div key={i} className="grid sm:grid-cols-[1fr_80px_110px_70px_32px]...">` deve diventare `flex flex-col gap-2` oppure aggiungere il blocco IMEI/SN **dopo** la riga grid, all'interno dello stesso `<div key={i}>`. Soluzione consigliata: wrappare tutto in un `<div key={i} className="border-b last:border-0 px-4 py-2 space-y-2">` e mettere dentro prima la grid row e poi il blocco seriali.

Struttura finale per ogni riga carrello:

```tsx
<div key={i} className="border-b last:border-0 px-4 py-2 space-y-2">
  {/* riga principale */}
  <div className="grid sm:grid-cols-[1fr_80px_110px_70px_32px] gap-2 items-center">
    {/* ... campi esistenti descrizione, qty, prezzo, sconto, elimina ... */}
  </div>
  {/* riga seriali */}
  <div>
    <button
      type="button"
      onClick={() => toggleSerial(i)}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
    >
      {expandedSerials.has(i) ? "− Seriale" : "+ Seriale"}
    </button>
    {expandedSerials.has(i) && (
      <div className="grid grid-cols-2 gap-2 mt-1.5">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">IMEI</p>
          <Input
            value={l.imei}
            onChange={(e) => updateLine(i, { imei: e.target.value })}
            placeholder="es. 356938035643809"
            className="text-xs font-mono h-8"
            maxLength={50}
          />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">S/N</p>
          <Input
            value={l.serialNumber}
            onChange={(e) => updateLine(i, { serialNumber: e.target.value })}
            placeholder="Numero seriale"
            className="text-xs font-mono h-8"
            maxLength={100}
          />
        </div>
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 5: Verificare la build**

```bash
pnpm build
```

Atteso: compilazione senza errori TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/pos/new/pos-sell-form.tsx
git commit -m "feat: add expandable IMEI/SN fields to POS cart lines"
```

---

## Task 3: Action — salvataggio IMEI/SN

**Files:**
- Modify: `src/app/(app)/pos/new/actions.ts`

- [ ] **Step 1: Estendere `itemSchema` con i nuovi campi**

Aggiornare `itemSchema` (intorno alla riga 13):

```ts
const itemSchema = z.object({
  inventoryItemId: z.string().uuid().optional().or(z.literal("")),
  description: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPriceCents: z.coerce.number().int().min(0),
  discountPct: z.coerce.number().int().min(0).max(100).default(0),
  totalCents: z.coerce.number().int().min(0),
  imei: z.string().max(50).optional().or(z.literal("")),
  serialNumber: z.string().max(100).optional().or(z.literal("")),
});
```

- [ ] **Step 2: Leggere i campi dal `formData` nel ciclo di parsing**

Nel while loop che costruisce `rawItems` (intorno alla riga 41), aggiungere:

```ts
const raw = {
  inventoryItemId: formData.get(`items[${i}][inventoryItemId]`) as string,
  description: formData.get(`items[${i}][description]`) as string,
  quantity: formData.get(`items[${i}][quantity]`) as string,
  unitPriceCents: formData.get(`items[${i}][unitPriceCents]`) as string,
  discountPct: formData.get(`items[${i}][discountPct]`) as string,
  totalCents: formData.get(`items[${i}][totalCents]`) as string,
  imei: formData.get(`items[${i}][imei]`) as string,
  serialNumber: formData.get(`items[${i}][serialNumber]`) as string,
};
```

- [ ] **Step 3: Passare i campi all'insert in DB**

Nel `db.insert(posTransactionItems).values(...)` (intorno alla riga 83), aggiornare il map:

```ts
await db.insert(posTransactionItems).values(
  rawItems.map((it) => ({
    transactionId: tx.id,
    inventoryItemId: it.inventoryItemId || null,
    description: it.description,
    quantity: it.quantity,
    unitPriceCents: it.unitPriceCents,
    discountPct: it.discountPct,
    totalCents: it.totalCents,
    imei: it.imei || null,
    serialNumber: it.serialNumber || null,
  })),
);
```

- [ ] **Step 4: Verificare build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/pos/new/actions.ts
git commit -m "feat: persist IMEI and serial number on pos transaction items"
```

---

## Task 4: CSS stampa termica in globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Aggiungere il blocco `@media print` per il layout termico**

Alla fine del file `src/app/globals.css`, aggiungere:

```css
/* ── Stampa scontrino termico 80mm ────────────────────────────────────────── */
@media print {
  body.thermal-print {
    width: 80mm;
    max-width: 80mm;
    font-family: monospace;
    font-size: 10px;
    line-height: 1.4;
    margin: 0;
    padding: 2mm;
    color: #000;
    background: #fff;
  }

  body.thermal-print .receipt-no-thermal {
    display: none !important;
  }

  body.thermal-print .receipt-table th,
  body.thermal-print .receipt-table td {
    padding: 1px 2px;
    font-size: 9px;
  }

  body.thermal-print .receipt-total {
    font-size: 12px;
    font-weight: bold;
    border-top: 1px dashed #000;
    padding-top: 2mm;
    margin-top: 1mm;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add thermal 80mm print CSS for POS receipts"
```

---

## Task 5: Client component pulsanti stampa

**Files:**
- Create: `src/app/(app)/pos/transactions/[id]/receipt-print-buttons.tsx`

- [ ] **Step 1: Creare il file**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function ReceiptPrintButtons() {
  function printA4() {
    window.print();
  }

  function printThermal() {
    document.body.classList.add("thermal-print");
    window.print();
    document.body.classList.remove("thermal-print");
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" className="gap-2" onClick={printA4}>
        <Printer className="h-4 w-4" />
        Stampa A4
      </Button>
      <Button variant="outline" className="gap-2" onClick={printThermal}>
        <Printer className="h-4 w-4" />
        Stampa termica
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/pos/transactions/
git commit -m "feat: add receipt print buttons (A4 + thermal)"
```

---

## Task 6: Pagina scontrino `/pos/transactions/[id]`

**Files:**
- Create: `src/app/(app)/pos/transactions/[id]/page.tsx`

- [ ] **Step 1: Creare la pagina server component**

```tsx
import React from "react";
import { db } from "@/lib/db";
import { requirePlan } from "@/lib/require-plan";
import {
  posTransactions,
  posTransactionItems,
  customers,
  organizations,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ReceiptPrintButtons } from "./receipt-print-buttons";

interface Props {
  params: Promise<{ id: string }>;
}

const methodLabels: Record<string, string> = {
  cash: "Contanti",
  card: "Carta",
  transfer: "Bonifico",
  mixed: "Misto",
  other: "Altro",
};

export default async function TransactionReceiptPage({ params }: Props) {
  const { id } = await params;
  const session = await requirePlan("pro");
  const orgId = session.user.organizationId!;

  const [tx] = await db
    .select({
      id: posTransactions.id,
      receiptNumber: posTransactions.receiptNumber,
      totalCents: posTransactions.totalCents,
      paymentMethod: posTransactions.paymentMethod,
      notes: posTransactions.notes,
      createdAt: posTransactions.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(posTransactions)
    .leftJoin(customers, eq(customers.id, posTransactions.customerId))
    .where(and(eq(posTransactions.id, id), eq(posTransactions.organizationId, orgId)))
    .limit(1);

  if (!tx) notFound();

  const items = await db
    .select({
      id: posTransactionItems.id,
      description: posTransactionItems.description,
      quantity: posTransactionItems.quantity,
      unitPriceCents: posTransactionItems.unitPriceCents,
      discountPct: posTransactionItems.discountPct,
      totalCents: posTransactionItems.totalCents,
      imei: posTransactionItems.imei,
      serialNumber: posTransactionItems.serialNumber,
    })
    .from(posTransactionItems)
    .where(eq(posTransactionItems.transactionId, id));

  const [org] = await db
    .select({
      name: organizations.name,
      legalName: organizations.legalName,
      vatNumber: organizations.vatNumber,
      address: organizations.address,
      city: organizations.city,
      postalCode: organizations.postalCode,
      province: organizations.province,
      phone: organizations.phone,
      brandingLogoUrl: organizations.brandingLogoUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const dtFmt = new Intl.DateTimeFormat("it-IT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Rome",
  });

  const receiptLabel = tx.receiptNumber
    ? `#${String(tx.receiptNumber).padStart(4, "0")}`
    : `—`;

  return (
    <div className="space-y-4">
      {/* Navigazione */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/pos">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Cassa
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Scontrino {receiptLabel}</h1>
        </div>
        <ReceiptPrintButtons />
      </div>

      {/* Scontrino */}
      <div className="mx-auto max-w-[600px] rounded-lg border bg-white p-6 shadow-sm print:max-w-none print:shadow-none print:border-0 print:p-0">

        {/* Intestazione negozio */}
        <div className="receipt-no-thermal text-center border-b pb-4 mb-4">
          {org?.brandingLogoUrl && (
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={org.brandingLogoUrl}
              alt="logo"
              className="receipt-logo mx-auto mb-2 h-12 object-contain"
            />
          )}
          <p className="font-bold text-base">{org?.legalName ?? org?.name}</p>
          {org?.name && org?.legalName && org.name !== org.legalName && (
            <p className="text-sm text-muted-foreground">{org.name}</p>
          )}
          {org?.vatNumber && (
            <p className="text-sm">P.IVA: {org.vatNumber}</p>
          )}
          {(org?.address || org?.city) && (
            <p className="text-sm">
              {[org.address, [org.city, org.postalCode, org.province].filter(Boolean).join(" ")].filter(Boolean).join(" — ")}
            </p>
          )}
          {org?.phone && (
            <p className="text-sm">Tel: {org.phone}</p>
          )}
        </div>

        {/* Numero scontrino e data */}
        <div className="flex justify-between text-sm mb-4">
          <span className="font-mono font-semibold">SCONTRINO {receiptLabel}</span>
          <span className="text-muted-foreground">{dtFmt.format(new Date(tx.createdAt))}</span>
        </div>

        {/* Cliente */}
        {tx.customerName && (
          <div className="text-sm mb-4">
            <span className="text-muted-foreground">Cliente: </span>
            <span className="font-medium">{tx.customerName}</span>
            {tx.customerPhone && <span className="text-muted-foreground ml-2">{tx.customerPhone}</span>}
          </div>
        )}

        {/* Articoli */}
        <table className="w-full text-sm mb-4 receipt-table">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-1 text-left font-medium">Articolo</th>
              <th className="pb-1 text-center font-medium">Qtà</th>
              <th className="pb-1 text-right font-medium">Prezzo</th>
              <th className="pb-1 text-right font-medium">Tot.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                <tr className="border-b last:border-0">
                  <td className="py-1.5 pr-2">
                    <span className="font-medium">{item.description}</span>
                    {item.discountPct > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">−{item.discountPct}%</span>
                    )}
                  </td>
                  <td className="py-1.5 text-center">{item.quantity}</td>
                  <td className="py-1.5 text-right text-muted-foreground">
                    {formatCurrency(item.unitPriceCents)}
                  </td>
                  <td className="py-1.5 text-right font-medium">
                    {formatCurrency(item.totalCents)}
                  </td>
                </tr>
                {(item.imei || item.serialNumber) && (
                  <tr className="border-b last:border-0">
                    <td colSpan={4} className="pb-1.5 text-xs font-mono text-muted-foreground">
                      {item.imei && <span>IMEI: {item.imei}</span>}
                      {item.imei && item.serialNumber && <span className="mx-2">·</span>}
                      {item.serialNumber && <span>S/N: {item.serialNumber}</span>}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Totale */}
        <div className="border-t pt-3 receipt-total">
          <div className="flex justify-between items-baseline">
            <span className="text-base font-semibold">TOTALE</span>
            <span className="text-xl font-bold">{formatCurrency(tx.totalCents)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>Pagamento</span>
            <span>{methodLabels[tx.paymentMethod] ?? tx.paymentMethod}</span>
          </div>
        </div>

        {/* Note */}
        {tx.notes && (
          <div className="mt-3 rounded border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            {tx.notes}
          </div>
        )}

        {/* Footer scontrino */}
        <p className="mt-6 text-center text-xs text-muted-foreground">Grazie per il tuo acquisto!</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificare la build**

```bash
pnpm build
```

Atteso: nessun errore TypeScript. Se compare un errore su `imei` o `serialNumber` non presenti nel tipo drizzle-inferred, verificare che la migrazione sia stata applicata e che lo schema sia aggiornato.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/pos/transactions/
git commit -m "feat: add digital receipt page at /pos/transactions/[id]"
```

---

## Task 7: Link "Visualizza scontrino" nella lista transazioni

**Files:**
- Modify: `src/app/(app)/pos/page.tsx`

- [ ] **Step 1: Aggiungere l'import `Receipt` da lucide-react**

In cima al file (riga ~6), aggiungere `Receipt` all'import esistente:

```ts
import { ShoppingCart, Plus, History, BarChart2, Receipt } from "lucide-react";
```

- [ ] **Step 2: Aggiungere colonna header alla tabella**

Nella riga `<tr>` degli header (intorno alla riga 208), aggiungere una colonna vuota in coda:

```tsx
<tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
  <th className="pb-2">Scontrino</th>
  <th className="pb-2">Cliente</th>
  <th className="pb-2">Pagamento</th>
  <th className="pb-2 text-right">Importo</th>
  <th className="pb-2 text-right">Data</th>
  <th className="pb-2" />
</tr>
```

- [ ] **Step 3: Aggiungere la cella link su ogni riga**

Nella riga `{recent.map((t) => (` (intorno alla riga 217), aggiungere una `<td>` in coda:

```tsx
<tr key={t.id} className="border-b last:border-0">
  <td className="py-2 font-mono text-xs text-muted-foreground">
    {t.receiptNumber ? `#${String(t.receiptNumber).padStart(4, "0")}` : "—"}
  </td>
  <td className="py-2">{t.customerName ?? <span className="italic text-muted-foreground/50">—</span>}</td>
  <td className="py-2 text-muted-foreground">{methodLabels[t.paymentMethod] ?? t.paymentMethod}</td>
  <td className="py-2 text-right font-medium">{formatCurrency(t.totalCents)}</td>
  <td className="py-2 text-right text-muted-foreground">{formatDate(t.createdAt)}</td>
  <td className="py-2 text-right">
    <Link href={`/pos/transactions/${t.id}`}>
      <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizza scontrino">
        <Receipt className="h-3.5 w-3.5" />
      </Button>
    </Link>
  </td>
</tr>
```

- [ ] **Step 4: Verificare build**

```bash
pnpm build
```

- [ ] **Step 5: Commit finale**

```bash
git add src/app/\(app\)/pos/page.tsx
git commit -m "feat: add receipt link to POS transaction list"
```

---

## Verifica manuale finale

- [ ] Aprire la cassa, creare una vendita con un articolo
- [ ] Espandere "+ Seriale" su una riga, inserire IMEI e S/N
- [ ] Completare la vendita
- [ ] Dalla lista transazioni, cliccare l'icona scontrino
- [ ] Verificare che IMEI/S/N compaiano nello scontrino
- [ ] Cliccare "Stampa A4" → layout standard
- [ ] Cliccare "Stampa termica" → layout 80mm monospace (verificare nell'anteprima di stampa del browser)
