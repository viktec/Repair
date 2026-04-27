# Data model — bozza

Schema iniziale al taglio MVP (Phase 0 + 1). Tabelle Phase 2/3 elencate ma non dettagliate.
Tutte le tabelle hanno `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz`.

---

## Core (Phase 0)

### `organizations`
- `id`, `name`, `slug` (unique), `plan` enum(`solo`,`pro`,`business`)
- `branding_logo_url`, `branding_primary_color`, `vat_number`, `tax_code`
- `address_line1`, `city`, `postal_code`, `country` (default `IT`)
- `subscription_status` enum(`trial`,`active`,`past_due`,`canceled`) — manuale finché Stripe è scollegato
- `trial_ends_at`

### `users`
- `id`, `email` (unique), `password_hash`, `name`, `phone`
- `email_verified_at`, `last_login_at`

### `memberships` (user × organization)
- `user_id`, `organization_id`, `role` enum(`owner`,`admin`,`technician`,`front_desk`)
- pk composta `(user_id, organization_id)`

### `stores` (sedi)
- `id`, `organization_id` fk
- `name`, `address`, `phone`, `email`, `tax_settings_jsonb`
- `is_default boolean`

---

## Tickets domain (Phase 1)

### `customers`
- `organization_id`, `name`, `phone`, `email`, `tax_code`, `notes`
- `gdpr_consent_at`, `marketing_consent boolean`
- index `(organization_id, phone)` per ricerca veloce

### `devices`
- `id`, `customer_id` fk, `organization_id`
- `kind` enum(`smartphone`,`tablet`,`pc`,`tv`,`other`)
- `brand`, `model`, `imei` (nullable, indexed), `serial`, `color`
- index `(organization_id, imei)` per ricerca globale

### `ticket_statuses` (custom per organizzazione)
- `id`, `organization_id`, `name`, `color`, `order`, `is_terminal boolean`
- seed default: In attesa, Diagnosi, In riparazione, Pronto, Consegnato, Annullato

### `tickets`
- `id`, `organization_id`, `store_id`, `customer_id`, `device_id`
- `code` (es. `RIP-2026-001234` — sequence per organizzazione/anno)
- `status_id` fk → ticket_statuses
- `intake_notes` (descrizione guasto da cliente)
- `technician_notes` (note interne, non visibili al cliente)
- `pattern_lock` text (può essere "1‑2‑3‑6‑9" o codice)
- `accessories_jsonb` (caricatore, cover, sim, ecc.)
- `pre_conditions_jsonb` (graffi, ammaccature, schermo crepato, ecc.)
- `quoted_amount` numeric, `final_amount` numeric
- `intake_at`, `closed_at`, `delivered_at`
- `assigned_to` fk → users (technician)
- `tracking_token` (unique, usato nell'URL pubblico QR)
- `signature_url` (firma cliente all'accettazione)

### `ticket_status_history`
- `ticket_id`, `from_status_id`, `to_status_id`, `changed_by` (user_id), `note`, `changed_at`

### `ticket_photos`
- `ticket_id`, `phase` enum(`pre`,`during`,`post`)
- `s3_key`, `is_public boolean default false` (sole quelle public visibili nel tracking)
- `caption`, `uploaded_by`

### `whatsapp_templates`
- `organization_id`, `name`, `body` (con placeholder `{{cliente}}`, `{{stato}}`, `{{link_tracking}}`, ecc.)
- `applies_to_status_id` (nullable — se settato, template suggerito quando ticket entra in quello stato)

### `notifications` (email/SMS/push log)
- `organization_id`, `customer_id`, `ticket_id`, `channel` enum(`email`,`sms`,`push`,`whatsapp_manual`)
- `template_id`, `rendered_subject`, `rendered_body`
- `status` enum(`pending`,`sent`,`failed`,`copied`)  — `copied` per WhatsApp manuale
- `sent_at`

---

## Inventory & POS domain (Phase 2)

- `parts` (sku, name, description, brand, category)
- `part_variants` (color, model_compat, barcode unique, cost_avg, price_default)
- `stock_levels` (store_id, variant_id, qty, min_qty, max_qty)
- `stock_movements` (variant_id, store_id, qty_delta, reason enum(`intake`,`sale`,`use_in_ticket`,`transfer_in`,`transfer_out`,`adjustment`), ref_id)
- `suppliers` (org_id, name, contact)
- `supplier_orders` (supplier_id, status, ordered_at, received_at)
- `supplier_order_items` (variant_id, qty_ordered, qty_received, unit_cost)
- `pos_sales` (store_id, cashier_id, total, payment_method, customer_id nullable)
- `pos_sale_items` (sale_id, variant_id or service_description, qty, unit_price, vat_rate)
- `documents` (org_id, kind enum(`preventivo`,`accettazione`,`liberatoria`), customer_id, ticket_id, pdf_s3_key, signed_at)

---

## Multi‑sede & usato (Phase 3)

- `stock_transfers` (from_store_id, to_store_id, status enum(`requested`,`in_transit`,`received`,`canceled`), requested_by, approved_by)
- `stock_transfer_items`
- `used_goods_register` (Art.36 DPR 633/72): `org_id`, `kind` enum(`acquisto`,`vendita`), `counterparty_doc_type`, `counterparty_doc_number`, `counterparty_name`, `description`, `serial_or_imei`, `amount`, `transaction_date`, `notes`, **append‑only** (no UPDATE/DELETE — solo nuove righe di rettifica)
- `refurbishment_logs` (used_item_id, components_swapped_jsonb, total_cost, sold_at, sold_amount)
- `roles` (org_id, name, permissions_jsonb) — ruoli custom oltre ai 4 base
- `audit_log` (org_id, user_id, entity, entity_id, action, before_jsonb, after_jsonb, ip, ua, at)

---

## Indici critici (per performance)

- `tickets (organization_id, status_id, intake_at desc)` — vista kanban
- `tickets (organization_id, code)` unique — ricerca rapida
- `tickets (tracking_token)` unique — pagina pubblica
- `devices (organization_id, imei)` — ricerca per IMEI
- `customers (organization_id, phone)` — autocomplete in creazione ticket
- `stock_levels (store_id, variant_id)` unique
- `audit_log (org_id, entity, entity_id, at desc)`

---

## Decisioni di modellazione da segnare

1. **`code` ticket**: prefisso configurabile per organizzazione (`RIP-` di default), formato `{prefix}{YYYY}-{seq}`. Sequence reset annuale o continua? **Continua per organizzazione**, più semplice.
2. **Soft delete**: tutte le entità "cliente‑facing" hanno `deleted_at`. Hard delete solo dopo richiesta GDPR (job notturno).
3. **Currency**: tutto in centesimi (`integer`) anziché `numeric`, evita problemi floating. Conversione UI lato client.
4. **`tracking_token`**: random 16 char alphanumeric (rimuove `0/O/1/l/I` per leggibilità). NO uuid in URL — troppo lungo per QR piccoli.
5. **Foto private vs. pubbliche**: default `is_public = false`. L'utente sceglie esplicitamente quali pubblicare nel tracking. Mai mostrare foto interne (note tecniche, viscere dispositivo) al cliente di default.
