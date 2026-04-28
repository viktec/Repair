# Repair — [my-repair.it](https://my-repair.it)

Gestionale SaaS per centri di riparazione (smartphone, tablet, PC, TV).
Sostituisce il caos di chat WhatsApp e foglietti con un sistema unico per ticket, foto pre/post, magazzino ricambi, comunicazioni cliente.

> **Stato**: Phase 0 completata — scaffold Next.js 16, auth, landing page, onboarding wizard funzionante.
> **Dominio**: `my-repair.it` (confermato 2026‑04‑28).

---

## Indice della documentazione

| Documento | Scopo |
|---|---|
| [ROADMAP.md](./ROADMAP.md) | Piano di azione fase per fase (MVP Solo → Pro → Business) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architettura applicativa (multi‑tenant, moduli, dipendenze) |
| [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) | Deploy su VPS con Docker + Nginx Proxy Manager |
| [DATA_MODEL.md](./DATA_MODEL.md) | Bozza dello schema database |
| [docs/BRANDING.md](./docs/BRANDING.md) | Nome, dominio, palette, tone of voice |
| [docs/WHATSAPP.md](./docs/WHATSAPP.md) | Flusso manuale copia/incolla (no API) |
| [docs/SECURITY.md](./docs/SECURITY.md) | Pratiche di base (RLS, segreti, GDPR) |
| [CLAUDE.md](./CLAUDE.md) | Istruzioni per sessioni Claude Code future |

---

## Stack scelto

- **Frontend + API**: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Database**: PostgreSQL 16
- **ORM**: Drizzle
- **Auth**: Auth.js (NextAuth v5) con adapter Drizzle/Postgres
- **Storage file**: MinIO (S3‑compatible) per foto pre/post, firme, documenti
- **Cache / queue**: Redis + BullMQ
- **Deploy**: Docker Compose su VPS dietro **Nginx Proxy Manager**
- **AI** (Phase 3): Anthropic Claude (Haiku per OCR, Sonnet per BI conversazionale)

→ dettagli in [INFRASTRUCTURE.md](./INFRASTRUCTURE.md).

---

## Piani commerciali (target)

| Piano | Prezzo | Limiti | Funzioni chiave |
|---|---|---|---|
| **Solo** | 14,90 €/mese | 5.000 ticket, 1 negozio | ticket, IMEI, foto, QR tracking, firma, ricevute, branding |
| **Pro** | 19,90 €/mese | 10.000 ticket, 1 negozio | + magazzino, POS, ordini fornitori, documenti, report |
| **Business** | 25,90 €/mese | ticket illimitati, 2 sedi incluse (+10€/sede) | + AI fattura, Telegram bot, multi‑sede, Art.36 |

> **Nota billing**: Stripe non è collegato in questa fase. I piani sono modellati nel DB con feature flag, ma l'attivazione è manuale finché non si integra il provider.

---

## Quickstart locale (quando il codice ci sarà)

```bash
# 1. Clona
git clone https://github.com/viktec/Repair.git
cd Repair

# 2. Variabili d'ambiente
cp .env.example .env
# → modifica POSTGRES_PASSWORD, NEXTAUTH_SECRET, MINIO_ROOT_PASSWORD

# 3. Avvia tutto in Docker
docker compose up -d

# 4. Migrazioni
docker compose exec app pnpm db:migrate
docker compose exec app pnpm db:seed       # crea organizzazione demo + utente admin

# 5. Apri http://localhost:3000
```

Per il deploy in produzione (VPS + Nginx Proxy Manager), vedi [INFRASTRUCTURE.md](./INFRASTRUCTURE.md).

---

## Contributi

Repo privato/personale per ora. Issue e PR via GitHub interno.
Per allineamento con sessioni Claude Code, vedi [CLAUDE.md](./CLAUDE.md).
