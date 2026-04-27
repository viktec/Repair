# Architecture

## Vista d'insieme

```
                          ┌────────────────────────┐
                          │   Nginx Proxy Manager  │   ← SSL + routing host → container
                          │   (host VPS)           │
                          └───────────┬────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
   ┌────────▼────────┐      ┌─────────▼────────┐      ┌─────────▼────────┐
   │  app (Next.js)  │      │  minio (S3 API)  │      │   bot-telegram   │
   │  port 3000      │      │  port 9000/9001  │      │   (Phase 3)      │
   └────┬───┬────────┘      └─────────▲────────┘      └─────────┬────────┘
        │   │                         │                         │
        │   │                         │                         │
   ┌────▼───┴───┐                     │                         │
   │  postgres  │◄────────────────────┴─────────────────────────┘
   │  port 5432 │
   └─────┬──────┘
         │
   ┌─────▼──────┐
   │   redis    │   ← cache, sessioni, BullMQ queues
   │  port 6379 │
   └────────────┘
```

Tutto vive in una rete Docker privata (`repair_net`). Solo `app`, `minio` e (in Phase 3) `bot-telegram` sono esposti via Nginx Proxy Manager. `postgres` e `redis` non hanno mai porte esposte sul host pubblico.

---

## Multi‑tenancy

**Modello**: shared database, shared schema. Ogni tabella ha `organization_id` come prima foreign key.

**Isolamento**: a livello applicativo, ogni query passa per un layer (`db.ts`) che inietta automaticamente il filtro `organization_id` dalla sessione corrente. Nessuna query "raw" senza filtro.

In aggiunta, attiviamo Postgres **Row Level Security (RLS)** come safety net: anche se un bug nel codice dimentica il filtro, RLS impedisce data leak tra organizzazioni.

```sql
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tickets
  USING (organization_id = current_setting('app.current_org_id')::uuid);
```

L'app, prima di ogni request, esegue `SET app.current_org_id = '<uuid>'` sulla connessione (via middleware Drizzle).

> **Trade‑off**: RLS aggiunge un po' di overhead e complica i tool di amministrazione (devi disabilitarlo per query cross‑org). Ne vale la pena per un SaaS B2B con dati sensibili.

---

## Moduli applicativi (cartelle in `apps/web/src/`)

```
src/
├── app/                       # Next.js App Router
│   ├── (public)/              # landing, pricing, login, registrazione
│   ├── (tracking)/            # pagine pubbliche QR tracking, no auth
│   ├── (app)/                 # area autenticata
│   │   ├── tickets/
│   │   ├── customers/
│   │   ├── inventory/         # Phase 2
│   │   ├── pos/               # Phase 2
│   │   ├── documents/         # Phase 2
│   │   ├── reports/           # Phase 2
│   │   ├── stores/            # Phase 3 multi-sede
│   │   ├── usato/             # Phase 3 Art.36
│   │   └── settings/
│   └── api/
├── modules/                   # logica di dominio per modulo
│   ├── tickets/
│   ├── customers/
│   ├── inventory/
│   └── ...
├── lib/                       # cross‑cutting
│   ├── auth.ts
│   ├── db.ts
│   ├── storage.ts             # MinIO S3 client
│   ├── pdf.ts                 # generazione PDF ricevute
│   ├── thermal.ts             # stampa termica
│   ├── whatsapp.ts            # genera testi + link wa.me
│   └── ai.ts                  # client Anthropic (Phase 3)
├── components/                # design system + componenti riusabili
│   └── ui/                    # shadcn
└── server/
    ├── actions/               # Server Actions (mutations)
    └── queries/               # Server Components fetchers
```

Convenzione: ogni modulo ha la sua schema Drizzle (`modules/tickets/schema.ts`) e i suoi tipi. La schema globale è composta in `lib/db.ts`.

---

## Background jobs

**BullMQ + Redis**. Worker separato (`apps/worker/`) per:

- generazione PDF ricevute (asincrona, non blocca la UI)
- invio email transazionali
- OCR / AI invoice import (Phase 3)
- pulizia foto orfane su MinIO (cron)
- backup notturno DB (cron — può anche stare fuori app, vedi INFRASTRUCTURE.md)

In MVP Phase 1 il worker può essere collassato dentro l'app Next.js (route `/api/cron/*` chiamata da cron host). Si separa quando il volume cresce.

---

## Storage file (MinIO)

- Bucket `repair-public-readonly` per foto incluse nel QR tracking pubblico (presigned URL con TTL lungo).
- Bucket `repair-private` per allegati interni (firme, documenti, foto non pubbliche).
- Path convention: `<org_id>/<entity>/<entity_id>/<filename>`.
- Foto vengono ridimensionate lato client prima dell'upload (max 1920×1920, JPEG q80) per risparmiare banda.

---

## Auth e sessioni

- **Auth.js v5** con adapter Drizzle.
- Provider: credentials (email + password con bcrypt) per MVP. Magic link via email subito dopo. Provider OAuth (Google) opzionale.
- Sessione JWT firmata, 30 giorni di durata, rotation alla riconnessione.
- 2FA TOTP in roadmap Phase 2.
- Ruoli base in MVP: `owner`, `admin`, `technician`, `front_desk`. Ruoli custom in Phase 3.

---

## Stato applicativo client

- Server Components dove possibile (lista ticket, dashboard).
- React Query (TanStack) solo per parti realmente interattive (kanban drag‑drop, ricerca con debounce).
- Server Actions per le mutations — niente API REST custom dove non serve.

---

## Decisioni architettoniche da rivedere

| Decisione | Stato | Da rivedere quando |
|---|---|---|
| Worker dentro app vs. separato | dentro app in MVP | volume jobs > 100/min o latenza UI |
| RLS Postgres | attivo | mai — è un safety net |
| MinIO vs. filesystem | MinIO | mai — è già self‑hosted, S3 API standard |
| Redis necessario | sì (sessioni + queue) | si potrebbe togliere in MVP usando JWT puro + cron host, ma serve per Phase 2 |
| Realtime updates | polling 5s in MVP | dopo MVP, valutare Postgres LISTEN/NOTIFY o SSE |
