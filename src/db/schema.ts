import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  primaryKey,
  pgEnum,
  integer,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const planEnum = pgEnum("plan", ["solo", "pro", "business"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "past_due",
  "canceled",
]);
export const roleEnum = pgEnum("role", [
  "owner",
  "admin",
  "technician",
  "front_desk",
]);

// ─── Core ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash"),
  emailVerifiedAt: timestamp("email_verified_at"),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  plan: planEnum("plan").notNull().default("solo"),
  brandingLogoUrl: text("branding_logo_url"),
  brandingPrimaryColor: varchar("branding_primary_color", { length: 7 }).default("#0D8F7A"),
  phone: varchar("phone", { length: 50 }),
  whatsappPhone: varchar("whatsapp_phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  vatNumber: varchar("vat_number", { length: 20 }),
  whatsappTemplate: text("whatsapp_template"),
  adminNotes: text("admin_notes"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("owner"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.organizationId] })],
);

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  isDefault: boolean("is_default").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Phase 1 ────────────────────────────────────────────────────────────────

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  notes: text("notes"),
  gdprConsentAt: timestamp("gdpr_consent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ticketStatuses = pgTable("ticket_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).notNull().default("#6B7280"),
  sortOrder: integer("sort_order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  isFinal: boolean("is_final").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  storeId: uuid("store_id").references(() => stores.id),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  statusId: uuid("status_id").references(() => ticketStatuses.id, { onDelete: "set null" }),
  ticketNumber: integer("ticket_number").notNull(),

  deviceBrand: varchar("device_brand", { length: 100 }),
  deviceModel: varchar("device_model", { length: 100 }),
  deviceImei: varchar("device_imei", { length: 20 }),
  deviceSerial: varchar("device_serial", { length: 100 }),
  devicePatternLock: text("device_pattern_lock"),
  accessories: text("accessories"),
  deviceCondition: text("device_condition"),
  faultDescription: text("fault_description").notNull(),

  internalNotes: text("internal_notes"),
  estimatedCost: integer("estimated_cost"),
  finalCost: integer("final_cost"),

  qrToken: varchar("qr_token", { length: 32 }).notNull().unique(),

  acceptedAt: timestamp("accepted_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const ticketPhotos = pgTable("ticket_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  isPublic: boolean("is_public").notNull().default(false),
  photoType: varchar("photo_type", { length: 20 }).notNull().default("pre"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customDeviceModels = pgTable("custom_device_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 150 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Phase 2 — Magazzino ────────────────────────────────────────────────────

export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "in",
  "out",
  "adjustment",
  "sale",
  "return",
]);

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  website: varchar("website", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  sku: varchar("sku", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  compatibleBrands: text("compatible_brands"),
  compatibleModels: text("compatible_models"),
  barcode: varchar("barcode", { length: 100 }),
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("min_quantity").notNull().default(0),
  costPriceCents: integer("cost_price_cents"),
  sellPriceCents: integer("sell_price_cents"),
  location: varchar("location", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  itemId: uuid("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  type: inventoryMovementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const supplierOrderStatusEnum = pgEnum("supplier_order_status", [
  "draft",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
]);

export const supplierOrders = pgTable("supplier_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "restrict" }),
  status: supplierOrderStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  orderedAt: timestamp("ordered_at"),
  expectedAt: timestamp("expected_at"),
  receivedAt: timestamp("received_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supplierOrderItems = pgTable("supplier_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => supplierOrders.id, { onDelete: "cascade" }),
  itemId: uuid("item_id").references(() => inventoryItems.id, { onDelete: "set null" }),
  description: varchar("description", { length: 255 }).notNull(),
  quantityOrdered: integer("quantity_ordered").notNull(),
  quantityReceived: integer("quantity_received").notNull().default(0),
  unitCostCents: integer("unit_cost_cents"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Phase 2 — POS ──────────────────────────────────────────────────────────

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "transfer",
  "mixed",
  "other",
]);

export const posTransactionStatusEnum = pgEnum("pos_transaction_status", [
  "completed",
  "refunded",
  "voided",
]);

export const posSessions = pgTable("pos_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
  openedBy: uuid("opened_by").references(() => users.id, { onDelete: "set null" }),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  openingCashCents: integer("opening_cash_cents").notNull().default(0),
  closingCashCents: integer("closing_cash_cents"),
  notes: text("notes"),
});

export const posTransactions = pgTable("pos_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => posSessions.id, { onDelete: "set null" }),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "set null" }),
  totalCents: integer("total_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash"),
  status: posTransactionStatusEnum("status").notNull().default("completed"),
  notes: text("notes"),
  receiptNumber: integer("receipt_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

// ─── Phase 2 — Documenti ────────────────────────────────────────────────────

export const documentTemplateTypeEnum = pgEnum("document_template_type", [
  "receipt",
  "quote",
  "waiver",
  "acceptance",
  "warranty",
]);

export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  type: documentTemplateTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Phase 3 — Tag ticket ────────────────────────────────────────────────────

export const ticketTags = pgTable("ticket_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull().default("#6B7280"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ticketTagAssignments = pgTable(
  "ticket_tag_assignments",
  {
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => ticketTags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.ticketId, table.tagId] })],
);

// ─── Phase 3 — Registro usato Art.36 ───────────────────────────────────────

export const docTypeEnum = pgEnum("doc_type", [
  "carta_identita",
  "patente",
  "passaporto",
  "altro",
]);

export const usedItemsRegistry = pgTable("used_items_registry", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  counter: integer("counter").notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  imeiOrSerial: varchar("imei_or_serial", { length: 100 }),
  counterpartyName: varchar("counterparty_name", { length: 255 }).notNull(),
  counterpartyDocType: docTypeEnum("counterparty_doc_type").notNull(),
  counterpartyDocNumber: varchar("counterparty_doc_number", { length: 100 }).notNull(),
  purchasePriceCents: integer("purchase_price_cents"),
  sellPriceCents: integer("sell_price_cents"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Phase 3 — Push notifiche ────────────────────────────────────────────────

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  stores: many(stores),
  customers: many(customers),
  tickets: many(tickets),
  inventoryItems: many(inventoryItems),
  suppliers: many(suppliers),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
}));

export const storesRelations = relations(stores, ({ one }) => ({
  organization: one(organizations, {
    fields: [stores.organizationId],
    references: [organizations.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  tickets: many(tickets),
}));

export const ticketStatusesRelations = relations(ticketStatuses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [ticketStatuses.organizationId],
    references: [organizations.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tickets.organizationId],
    references: [organizations.id],
  }),
  store: one(stores, { fields: [tickets.storeId], references: [stores.id] }),
  customer: one(customers, { fields: [tickets.customerId], references: [customers.id] }),
  status: one(ticketStatuses, { fields: [tickets.statusId], references: [ticketStatuses.id] }),
  photos: many(ticketPhotos),
  tagAssignments: many(ticketTagAssignments),
}));

export const ticketPhotosRelations = relations(ticketPhotos, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketPhotos.ticketId], references: [tickets.id] }),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [suppliers.organizationId],
    references: [organizations.id],
  }),
  inventoryItems: many(inventoryItems),
  orders: many(supplierOrders),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inventoryItems.organizationId],
    references: [organizations.id],
  }),
  supplier: one(suppliers, { fields: [inventoryItems.supplierId], references: [suppliers.id] }),
  movements: many(inventoryMovements),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  item: one(inventoryItems, { fields: [inventoryMovements.itemId], references: [inventoryItems.id] }),
  ticket: one(tickets, { fields: [inventoryMovements.ticketId], references: [tickets.id] }),
}));

export const supplierOrdersRelations = relations(supplierOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [supplierOrders.organizationId],
    references: [organizations.id],
  }),
  supplier: one(suppliers, { fields: [supplierOrders.supplierId], references: [suppliers.id] }),
  items: many(supplierOrderItems),
}));

export const supplierOrderItemsRelations = relations(supplierOrderItems, ({ one }) => ({
  order: one(supplierOrders, { fields: [supplierOrderItems.orderId], references: [supplierOrders.id] }),
  item: one(inventoryItems, { fields: [supplierOrderItems.itemId], references: [inventoryItems.id] }),
}));

export const posSessionsRelations = relations(posSessions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [posSessions.organizationId],
    references: [organizations.id],
  }),
  transactions: many(posTransactions),
}));

export const posTransactionsRelations = relations(posTransactions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [posTransactions.organizationId],
    references: [organizations.id],
  }),
  session: one(posSessions, { fields: [posTransactions.sessionId], references: [posSessions.id] }),
  customer: one(customers, { fields: [posTransactions.customerId], references: [customers.id] }),
  ticket: one(tickets, { fields: [posTransactions.ticketId], references: [tickets.id] }),
  items: many(posTransactionItems),
}));

export const posTransactionItemsRelations = relations(posTransactionItems, ({ one }) => ({
  transaction: one(posTransactions, {
    fields: [posTransactionItems.transactionId],
    references: [posTransactions.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [posTransactionItems.inventoryItemId],
    references: [inventoryItems.id],
  }),
}));

export const ticketTagsRelations = relations(ticketTags, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [ticketTags.organizationId],
    references: [organizations.id],
  }),
  assignments: many(ticketTagAssignments),
}));

export const ticketTagAssignmentsRelations = relations(ticketTagAssignments, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketTagAssignments.ticketId], references: [tickets.id] }),
  tag: one(ticketTags, { fields: [ticketTagAssignments.tagId], references: [ticketTags.id] }),
}));
