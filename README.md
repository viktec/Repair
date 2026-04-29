# Repair — [my-repair.it](https://my-repair.it)

Gestionale SaaS per centri di riparazione (smartphone, tablet, PC, TV).
Sostituisce il caos di chat WhatsApp e foglietti con un sistema unico per ticket, foto, magazzino, documenti firmati e comunicazione cliente.

> **Stato**: Phase 1 in corso — MVP funzionante in produzione.
> **Dominio**: `my-repair.it` (confermato 2026-04-28).

---

## Funzionalità implementate

| Area | Funzione |
|---|---|
| **Ticket** | Dispositivo, IMEI, seriale, guasto, accessori, condizioni estetiche, pattern lock |
| **Foto** | Pre intervento, durante, post — galleria con lightbox e zoom, foto pubbliche sul tracking |
| **Firma digitale** | Canvas su tablet → PNG salvato su MinIO, allegato ai documenti |
| **QR tracking** | Pagina pubblica cliente con stato, foto e firma — nessun login richiesto |
| **Stampa** | Ricevuta A4 + termica 58mm, branding personalizzato |
| **Clienti** | Anagrafica completa, storico ticket, consenso GDPR |
| **Magazzino** | SKU, varianti, giacenza, soglie minime, movimenti |
| **POS** | Cassa non fiscale, carrello, metodi pagamento |
| **Ordini fornitori** | Creazione ordine, ricezione merce, aggiornamento giacenze |
| **Documenti** | Template preventivo, accettazione, liberatoria, ricevuta (PDF + firma) |
| **WhatsApp** | Template messaggi precompilati con variabili, copia/incolla manuale |
| **Auth** | Email/password, ruoli (owner, admin, technician, front_desk) |
| **Iscrizioni** | Flusso approvazione admin — pending → approvato/rifiutato con email |
| **Multi-tenant** | Ogni centro ha il proprio spazio isolato, branding, stati, magazzino |
| **Admin panel** | Super admin per gestione tenant, approvazioni, piani |
| **Deploy** | Docker Compose su VPS, Nginx Proxy Manager, MinIO S3, Redis |

→ Piano completo in [ROADMAP.md](./ROADMAP.md)

---

## Stack

| Layer | Tecnologia |
|---|---|
| Frontend + API | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Database | PostgreSQL 16 + Drizzle ORM |
| Auth | Auth.js (NextAuth v5) — JWT |
| Storage | MinIO (S3-compatible) — foto, firme, documenti |
| Cache / Queue | Redis + BullMQ |
| Email | Nodemailer (SMTP — Brevo, Mailjet, SES o Postfix) |
| Deploy | Docker Compose su VPS + Nginx Proxy Manager |
| AI (Phase 3) | Anthropic Claude — OCR fatture, BI conversazionale |

---

## Piani commerciali

| Piano | Prezzo | Limiti | Funzioni chiave |
|---|---|---|---|
| **Solo** | 14,90 €/mese | 5.000 ticket, 1 negozio | ticket, foto, QR, firma, documenti, WhatsApp, report base |
| **Pro** | 19,90 €/mese | 10.000 ticket, 1 negozio | + magazzino avanzato, POS, ordini, report avanzati, export |
| **Business** | 25,90 €/mese | illimitati, 2 sedi | + AI fattura, Telegram bot, multi-sede, Art.36, ruoli custom |

> Stripe non è integrato — i piani vivono come feature flag nel DB, attivazione manuale.

---

## Documentazione

| Documento | Scopo |
|---|---|
| [ROADMAP.md](./ROADMAP.md) | Piano fasi, funzioni completate e in lavorazione |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architettura multi-tenant, moduli, dipendenze |
| [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) | Deploy VPS, Docker, Nginx, MinIO, backup |
| [CLAUDE.md](./CLAUDE.md) | Istruzioni per sessioni Claude Code |
| [docs/WHATSAPP.md](./docs/WHATSAPP.md) | Flusso WhatsApp manuale (no API) |
| [docs/SECURITY.md](./docs/SECURITY.md) | Pratiche sicurezza, GDPR |

---

## Quickstart locale

```bash
git clone https://github.com/viktec/Repair.git && cd Repair
cp .env.example .env          # modifica POSTGRES_PASSWORD, NEXTAUTH_SECRET, MINIO_ROOT_PASSWORD
docker compose up -d
docker compose exec app pnpm db:migrate
docker compose exec app pnpm db:seed   # crea admin demo
# → http://localhost:3000
```

Deploy produzione: vedi [INFRASTRUCTURE.md](./INFRASTRUCTURE.md).
