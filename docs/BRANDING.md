# Branding

## Dominio

**`my-repair.it`** — confermato il 2026‑04‑28.

Sottodomini operativi:

| Sottodominio | Destinazione | Note |
|---|---|---|
| `my-repair.it` / `www.my-repair.it` | app | landing pubblica + login |
| `app.my-repair.it` | app | area autenticata |
| `t.my-repair.it` | app | tracking pubblico QR (host corto per QR più leggibili) |
| `cdn.my-repair.it` | MinIO | presigned URL foto + file pubblici |
| `s3-console.my-repair.it` | MinIO console | admin MinIO (Access List NPM) |

## Nome prodotto

**Repair** — nome interno e nel codice. Può evolvere nel branding visivo in futuro.

## Identità visiva (proposta — da formalizzare)

- **Palette primaria**: teal `#0D8F7A` (CSS var `--primary: 173 78% 30%`) — già nel codice.
- **Palette alternativa**: indigo `#4F46E5` se si punta a un look più "tech enterprise".
- **Tipografia UI**: Inter (già in `src/app/layout.tsx`).
- **Tipografia codici**: JetBrains Mono (da aggiungere per IMEI, codici ticket, numeri seriali).
- **Logo**: da progettare — monogramma "R" con chiave/cacciavite stilizzato, minimal.

## Tone of voice

Diretto, professionale ma caldo. Parla come un collega esperto, non come un manuale.

- ✅ "Aggiungi un ticket"
- ❌ "Crea una nuova richiesta di intervento tecnico"
- ✅ "Il cliente è in attesa"
- ❌ "Lo stato della commessa risulta in pending"

## Tagline (da testare A/B sulla landing)

1. "Il banco riparazioni, finalmente ordinato."
2. "Smetti di cercare le foto del danno tra 50 chat."
3. "Gestione riparazioni che non ti rallenta."
