# Istruzioni per sessioni Claude Code

Documento di onboarding per future sessioni di Claude Code che lavorano su questo repo.

## Cosa è questo progetto

Repair (working name **Riparoio**): SaaS gestionale per centri di riparazione. Vedi [README.md](./README.md) per il quadro generale, [ROADMAP.md](./ROADMAP.md) per le fasi.

## Lingua

- Conversazione con l'utente: **italiano**.
- UI / copy del prodotto: **italiano**.
- Documentazione tecnica: italiano dove pratico, inglese per termini consolidati (Docker, Postgres, ecc.).
- Codice: identificatori in inglese (`tickets`, `customers`, ecc.), commenti rari e in inglese.

## Vincoli forti (leggi prima di proporre cambiamenti)

1. **Self‑hosted**: il deploy è su VPS dietro Nginx Proxy Manager + Docker. **Niente Vercel, Supabase Cloud, Firebase, Auth0**. Vedi [INFRASTRUCTURE.md](./INFRASTRUCTURE.md).
2. **Stripe scollegato**: i piani sono feature flag nel DB, niente integrazione billing per ora. Non aggiungere `@stripe/*`.
3. **WhatsApp manuale**: il sistema genera testi + link, l'admin copia/incolla. Niente API Meta Cloud per ora. Vedi [docs/WHATSAPP.md](./docs/WHATSAPP.md).
4. **MVP first**: prima di proporre una feature, chiedere "serve all'MVP Solo (Phase 1)?". Se no, va in Phase 2/3 documentata.
5. **Niente over‑engineering**: tre righe simili sono meglio di un'astrazione prematura. Niente comment esplicativi se il nome è già chiaro.

## Stack ufficiale

Vedi [README.md](./README.md#stack-scelto). Modifiche allo stack richiedono:
- proposta scritta (issue o discussione qui)
- conferma esplicita dell'utente
- update di README + ARCHITECTURE + INFRASTRUCTURE

## Workflow di lavoro

- Branch: `feature/<nome>`, `fix/<nome>`, `docs/<nome>`. PR contro `main`.
- Commit: titolo conciso, corpo opzionale; firmare con `Co-Authored-By: Claude <noreply@anthropic.com>` quando l'agente scrive codice.
- Migrazioni DB: solo via Drizzle (`pnpm db:generate` + `db:migrate`). Mai SQL eseguito a mano in produzione senza una migration nel repo.
- Testing: vitest per unit + playwright per E2E sulle flow critiche (creazione ticket, QR tracking pubblico).

## Cosa **non** fare automaticamente

- Push diretto su `main` (sempre PR, anche se l'utente è solo).
- `git push --force` su branch condivisi.
- Aggiungere dipendenze pesanti senza chiedere (Sentry, Datadog, librerie >100KB gz).
- Toccare `.env` di produzione o segreti.
- Inserire in codice riferimenti a date relative ("oggi", "tra 2 settimane") — sempre date assolute YYYY-MM-DD.

## Quando l'utente dice "fix this" / "implementalo"

1. Leggere il codice rilevante prima di proporre.
2. Se la fix tocca >3 file, prima un piano breve, poi l'implementazione.
3. Niente refactor opportunistici durante un bug fix — mantenere il diff stretto.
