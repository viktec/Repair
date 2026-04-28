# Security baseline

Pratiche minime obbligatorie. Non esaustivo — vedi anche [INFRASTRUCTURE.md](../INFRASTRUCTURE.md#sicurezza-host).

## Application

- **Auth**: password con bcrypt cost ≥ 12. Magic link via email come opzione.
- **Sessioni**: JWT firmato (Auth.js), TTL 30 giorni con rotation.
- **2FA**: TOTP per ruoli `owner` e `admin` (Phase 2 — obbligatorio in Business).
- **Multi‑tenant isolation**: layer DB applicativo + Postgres RLS come safety net (vedi ARCHITECTURE.md).
- **CSRF**: middleware Next.js + double‑submit cookie sui Server Actions.
- **CSP**: header strict in produzione, nonce per script inline.
- **Rate limiting**: per IP + per user su login, registrazione, reset password (Redis token bucket).
- **Input validation**: Zod su tutti i Server Actions e API route. Mai trust diretto del payload client.
- **SQL injection**: Drizzle ORM, niente raw SQL utente‑interpolato. Le query raw vivono solo in `lib/db/migrations/`.
- **XSS**: React escape automatico; `dangerouslySetInnerHTML` vietato senza review esplicita.

## Storage

- **Bucket pubblico** (`repair-public-readonly`): accesso anonimo solo download, no listing. Solo path autorizzati esplicitamente (foto QR tracking flaggate `is_public = true`).
- **Bucket privato** (`repair-private`): solo presigned URL con TTL 5 minuti.
- **Upload validation**: MIME type allowlist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`). Max size 10 MB foto, 25 MB PDF.
- **Antivirus**: ClamAV su ogni upload PDF/documento (Phase 2).
- **EXIF stripping**: rimuovere GPS dalle foto al momento dell'upload.

## Segreti

- Mai in repo. Mai in immagini Docker.
- `.env` su VPS con permessi `600`, owner `root`.
- Rotazione obbligatoria: ogni rotazione di team / contractor.
- API key Anthropic / SMTP / Stripe (futuro): solo via env, mai in client bundle.

## GDPR / privacy

- **Lawful basis**: contratto di servizio per dati cliente del riparatore; legittimo interesse per dati cliente del riparatore (con possibilità di obiezione).
- **Right to erasure**: soft delete + hard delete dopo 30gg. Job di pulizia notturno.
- **Data export**: download JSON di tutti i dati di un'organizzazione (Phase 2).
- **DPA**: contratto con clienti che firmano per l'uso (template legale).
- **Sub‑processor list**: pubblicare e mantenere aggiornata (provider VPS, SMTP, AI).
- **Foto**: visibili pubblicamente solo quelle flaggate `is_public = true` esplicitamente. Default privato.

## Logging & audit

- Log applicativi non devono contenere segreti, password, token, body di richieste con dati personali sensibili.
- `audit_log` (Phase 3): chi ha visto/modificato cosa, quando, da dove.
- Log retention: 90 giorni operational, 1 anno per audit.

## Incident response

- Contatto: `security@my-repair.it` (forwarder a email personale founder per ora).
- Disclosure: 30 giorni dalla conferma; CVE se rilevante.
- Notifica utenti entro 72h se data breach (obbligo GDPR Art.33–34).
