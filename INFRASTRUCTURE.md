# Infrastructure

Deploy del progetto Repair su VPS proprietaria, dietro **Nginx Proxy Manager** (NPM) già installato.
Tutto il software applicativo gira in container Docker. NPM gestisce certificati Let's Encrypt e routing host → container.

---

## Requisiti VPS

| Risorsa | MVP | Crescita (1k org) |
|---|---|---|
| CPU | 2 vCPU | 4–8 vCPU |
| RAM | 4 GB | 8–16 GB |
| Disco | 40 GB SSD | 100–200 GB SSD |
| Banda | 1 TB/mese | 5+ TB/mese |
| OS | Debian 12 / Ubuntu 22.04 LTS | idem |

Pacchetti host: `docker`, `docker compose plugin`, `ufw`, `fail2ban`, `cron`, `restic` (per backup offsite).

Provider consigliati per il target italiano: **Hetzner Cloud (CX22 / CX32)**, **OVHcloud**, **Aruba Cloud**. Per privacy/GDPR meglio data center in EU.

---

## Topologia di rete

```
                    Internet
                       │
                       ▼
              ┌────────────────────┐
              │  UFW (host firewall)│  expose 22 (SSH), 80, 443 only
              └─────────┬──────────┘
                        │
                ┌───────▼─────────┐
                │ Nginx Proxy Mgr │   container, host network o bridge
                │ admin: :81      │   (admin port NON esposto pubblicamente)
                └───────┬─────────┘
                        │  (rete docker `npm_proxy` condivisa)
        ┌───────────────┼────────────────┐
        │               │                │
   ┌────▼────┐    ┌─────▼─────┐    ┌─────▼─────┐
   │ Repair  │    │   MinIO   │    │  Bot TG   │
   │ app:3000│    │   :9000   │    │ (Phase 3) │
   └────┬────┘    └───────────┘    └───────────┘
        │
   (rete `repair_internal` privata)
        │
   ┌────▼────────────────────┐
   │ Postgres + Redis        │
   └─────────────────────────┘
```

Due reti Docker:
- `npm_proxy` (esterna) — condivisa con NPM, contiene solo i container "frontati" (app, minio API, bot).
- `repair_internal` (interna) — postgres, redis, e i container app/worker che ne hanno bisogno. NPM **non** è qui.

---

## Hostname proposti (Riparoio)

| Host | Container | Note |
|---|---|---|
| `riparoio.it` / `www.riparoio.it` | app | landing pubblica + login |
| `app.riparoio.it` | app | area autenticata (stesso container, route diverse) |
| `t.riparoio.it` | app | tracking pubblico QR (short host per QR code piccoli) |
| `cdn.riparoio.it` | minio | API S3 + presigned URL foto |
| `s3-console.riparoio.it` | minio | console admin MinIO (protetta da Access List NPM) |

NPM si occupa di: SSL Let's Encrypt, redirect 80→443, WebSocket (necessario per HMR in dev e per SSE quando arriverà).

---

## Variabili d'ambiente

Vedi `.env.example` per la lista completa. Categorie:

- **DB**: `DATABASE_URL`, `POSTGRES_PASSWORD`
- **Auth**: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- **Storage**: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET_PUBLIC`, `S3_BUCKET_PRIVATE`
- **Redis**: `REDIS_URL`
- **Email**: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- **AI** (Phase 3): `ANTHROPIC_API_KEY`
- **App**: `APP_URL`, `TRACKING_URL`

I segreti **non vanno mai** committati. Su VPS, `.env` è in `/srv/repair/.env` con permessi `600` owner `root`.

---

## Backup

### Strategia
- **Postgres**: `pg_dump` notturno via cron host. Output → `/srv/backups/db/<data>.sql.gz`.
- **MinIO**: replica via `mc mirror` notturno verso un secondo bucket (provider diverso, es. Backblaze B2 o Hetzner Storage Box).
- **Off‑site**: `restic` con repository su Hetzner Storage Box (cifrato), retention 7 daily / 4 weekly / 6 monthly.

### Script base (`/srv/repair/scripts/backup.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR=/srv/backups
mkdir -p "$BACKUP_DIR/db"

docker compose -f /srv/repair/docker-compose.yml exec -T postgres \
  pg_dump -U repair --clean --if-exists repair \
  | gzip > "$BACKUP_DIR/db/repair_${DATE}.sql.gz"

restic -r "$RESTIC_REPO" backup "$BACKUP_DIR" "/srv/repair/data/minio"
restic -r "$RESTIC_REPO" forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
```

Test restore mensile obbligatorio — un backup non testato è un backup che non esiste.

---

## Aggiornamenti applicativi (deploy)

```bash
# Sulla VPS
cd /srv/repair
git pull
docker compose pull        # se usiamo immagine prebuilt da GHCR
docker compose up -d --build app worker
docker compose exec app pnpm db:migrate
```

In Phase 0 si fa a mano. Già in Phase 1 si automatizza con GitHub Actions:
- push su `main` → build immagine Docker → push su GHCR → SSH sulla VPS → `docker compose pull && up -d`.

---

## Monitoring (MVP)

Stack minimo, no sovra‑engineering:

- **Logs**: `docker compose logs -f app` per debug; in produzione `loki + promtail` se serve, altrimenti volume bind‑mounted e logrotate.
- **Uptime**: ping esterno via **Uptime Kuma** (container separato sulla stessa VPS o altrove).
- **Alerting**: Uptime Kuma → Telegram webhook (notifica se app down > 2 min).
- **Errori applicativi**: **Sentry self‑hosted** in Phase 2 (è pesante, non serve in MVP — `console.error` + log centralizzati bastano).

---

## Sicurezza host

- **SSH**: solo chiavi (no password), porta 22 ristretta a IP statico se possibile, fail2ban su `sshd`.
- **UFW**: `allow 22, 80, 443`. Tutto il resto chiuso. Le porte container (5432, 6379, 9000, ecc.) sono interne alla rete Docker.
- **Aggiornamenti**: `unattended-upgrades` per security patches OS.
- **Secrets**: nessun secret in immagini Docker. Solo via `.env` montato a runtime.
- **Isolamento container**: `read_only: true` dove possibile, `cap_drop: [ALL]` + `cap_add` selettivo.
- **CSP**: header strict in produzione (Next.js `headers()`), nonce per inline script.

---

## GDPR / privacy

- **DPA**: registrare data center in EU (Hetzner DE/FI, OVH FR, Aruba IT).
- **Encryption at rest**: disco VPS cifrato (LUKS) o provider con encryption at rest abilitato.
- **Right to erasure**: il modello dati prevede `deleted_at` (soft delete) + job di hard‑delete dopo 30 giorni dalla richiesta.
- **Audit log**: ogni accesso a dati cliente loggato (Phase 3 con ruoli granulari).
- **Foto cliente**: il QR tracking pubblico mostra solo foto esplicitamente flaggate `is_public = true`. Per default tutte le foto sono private.

---

## Checklist pre‑produzione (Phase 0 done = tutto questo spuntato)

- [ ] VPS provisioned, OS aggiornato, UFW attivo
- [ ] Nginx Proxy Manager up con admin protetto
- [ ] Docker e compose plugin installati
- [ ] DNS configurato per `*.riparoio.it`
- [ ] Backup script attivo + restore testato una volta
- [ ] Uptime Kuma che pinga `app.riparoio.it`
- [ ] Email SMTP testato (prima registrazione manda mail di benvenuto)
- [ ] Cron host: `0 3 * * * /srv/repair/scripts/backup.sh`
- [ ] `.env` permessi `600`, niente segreti in git
