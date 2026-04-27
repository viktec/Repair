# Roadmap — Repair / Riparoio

Approccio: **una fase alla volta, ogni fase deve produrre qualcosa di funzionante e demo‑abile**.
Non si passa alla fase successiva finché la precedente non è in produzione (anche solo su staging) e usata almeno in modo dogfood.

Stime sono ottimistiche per un solo sviluppatore senior con sessioni Claude Code di supporto. Tutte le date relative diventano assolute via PR/changelog.

---

## Phase 0 — Foundation 🏗

**Obiettivo**: scaffolding tecnico completo, landing page online, auth funzionante, organizzazione + utente admin creabili dal wizard di onboarding.

**Deliverable**:
- [ ] Monorepo pnpm con Next.js 15 + TS + Tailwind + shadcn/ui
- [ ] Drizzle schema iniziale (organizations, users, memberships, stores)
- [ ] Auth.js con email/password (magic link in fase successiva)
- [ ] Wizard onboarding 5‑step (account → dati negozio → stati personalizzati → primo ticket fittizio → operativo)
- [ ] Landing page pubblica con i 3 piani (componente Pricing, copy in italiano)
- [ ] Docker Compose: app + postgres + minio + redis funzionante in locale
- [ ] Pipeline CI base (lint + typecheck + build)
- [ ] Deploy iniziale su VPS via Nginx Proxy Manager

**Definition of Done**: posso aprire `https://app.riparoio.it`, registrarmi, completare il wizard, vedere la dashboard vuota.

---

## Phase 1 — Solo MVP 🎫

**Obiettivo**: il piano Solo è completo. Un negozio singolo può lavorare interamente sull'app.

**Funzioni**:
- [ ] Anagrafica clienti (nome, telefono, email, note, GDPR consenso)
- [ ] Ticket: dispositivo (marca/modello/IMEI/seriale), pattern lock, accessori, condizioni, descrizione guasto
- [ ] **Foto pre/post intervento** (upload da camera + drag‑drop, conservate su MinIO)
- [ ] Stati personalizzabili per organizzazione (default: In attesa, Diagnosi, In riparazione, Pronto, Consegnato)
- [ ] Vista kanban + lista filtrabile dei ticket
- [ ] Storico riparazioni per IMEI (ricerca globale)
- [ ] **QR tracking pubblico**: pagina senza login dove il cliente vede stato + foto selezionate
- [ ] **Firma digitale** su tablet (canvas → PNG → allegata al PDF accettazione)
- [ ] Ricevute A4 (PDF) + termiche (58/80mm via `react-thermal-printer`)
- [ ] Branding personalizzato: logo, colori, dati negozio in ricevute e tracking
- [ ] **Template messaggi WhatsApp** con variabili `{{cliente}}`, `{{stato}}`, `{{link_tracking}}`
  - bottone "Copia messaggio" + link `wa.me/<numero>?text=...`
  - **niente API WhatsApp** in questa fase ([decisione](./docs/WHATSAPP.md))
- [ ] Notifiche email transazionali al cliente (Resend o Brevo SMTP)
- [ ] Limite hard 5.000 ticket / 1 negozio enforced

**Definition of Done**: un riparatore reale (anche solo Vik come dogfood) lavora sull'app per una settimana senza dover aprire altro.

---

## Phase 2 — Pro 📦

**Obiettivo**: aggiungere magazzino, POS, ordini fornitori, documenti.

**Funzioni**:
- [ ] Magazzino ricambi: SKU, varianti (colore/modello compatibile), giacenza, soglie minime
- [ ] Alert scorte sotto soglia (badge in UI + notifica push se Phase 3 attiva)
- [ ] Smart Tags + filtri rapidi salvabili
- [ ] **POS / Cassa** non fiscale: carrello, sconti, metodi di pagamento, X/Z report giornalieri
- [ ] **Ordini fornitori**: stato `da ordinare → ordinato → ricevuto`, ricezione parziale
- [ ] **Documenti**: preventivi, schede accettazione, liberatorie (template editabili con merge fields)
- [ ] Etichette barcode (Code128 + QR) stampabili da etichettatrice
- [ ] Ricerca IMEI globale (cross‑ticket + cross‑magazzino)
- [ ] Report e KPI: incassi, tempo medio, top guasti, margini ricambi
- [ ] Export CSV / Excel di tutte le tabelle principali
- [ ] Limite 10.000 ticket / 1 negozio

**Definition of Done**: il piano Pro è vendibile.

---

## Phase 3 — Business 🏢

**Obiettivo**: AI, multi‑sede, conformità Art.36 usato.

**Funzioni**:
- [ ] **Importa Fattura AI**: upload PDF/foto fattura → estrazione automatica righe ricambi via Claude Haiku Vision → carico magazzino (con review umana prima di confermare)
- [ ] **Bot Telegram** con BI conversazionale (Claude Sonnet + tool use su query DB read‑only sandboxata)
- [ ] **Web Push** (PWA) per cambio stato, scorta minima, nuovo ticket
- [ ] Dashboard centralizzata multi‑sede
- [ ] **Trasferimenti stock** tra sedi con approval flow
- [ ] **Registro Usato Art.36**: campi obbligatori (documento controparte, data, descrizione, importo), audit log immutabile, export per Polizia/GdF
- [ ] Refurbishment log usato (componenti sostituiti, costi, prezzo finale)
- [ ] Sotto‑magazzini con export Excel
- [ ] **Ruoli e permessi granulari**: matrice resource × action, ruoli custom per organizzazione
- [ ] Supporto prioritario (canale interno per ora)
- [ ] Ticket illimitati, 2 sedi incluse + 10€/sede extra

**Definition of Done**: il piano Business è vendibile e l'utente Vik può gestire una catena di 2–3 sedi.

---

## Phase 4 — Add‑on (post‑launch)

- **Trinity AI** (centralinista vocale): integrazione con provider voice AI per rispondere alle chiamate fuori orario, prendere appuntamenti, dare stato ticket per IMEI.
- **Fiscal addon**: scontrino fiscale via fornitore certificato AdE (Epson cloud RT, Custom Cloud) — _non si reinventa la fiscalità, si integra_.
- **API WhatsApp Cloud** (sostituzione del flusso copia/incolla quando l'utente avrà account Meta Business approvato).
- **App mobile native** (React Native + Expo) — solo se la PWA non basta per casi d'uso specifici.

---

## Principi che guidano il taglio

1. **MVP first**: ogni feature che non aiuta a vendere il piano corrente va in fase successiva.
2. **No vendor lock‑in**: niente Vercel, niente Supabase Cloud, niente Firebase. Tutto self‑hostable.
3. **Niente Stripe finché non serve**: i piani vivono come feature flag nel DB, attivazione manuale.
4. **Niente WhatsApp API finché non serve**: copia/incolla manuale è già un upgrade rispetto allo status quo dell'utente target.
5. **Niente over‑engineering**: tre righe simili sono meglio di un'astrazione prematura.
