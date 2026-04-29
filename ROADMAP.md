# Roadmap — Repair (my-repair.it)

Approccio: **una fase alla volta, ogni fase deve produrre qualcosa di funzionante e demo-abile**.
Non si passa alla fase successiva finché la precedente non è in produzione e usata almeno in modalità dogfood.

---

## Stato attuale — 2026-04-29

### ✅ Completato

- Scaffold Next.js 15 + TS + Tailwind + shadcn/ui
- Auth email/password (NextAuth v5), sessioni JWT
- **Flusso approvazione iscrizioni**: pending → approvato/rifiutato, email admin + utente
- Onboarding wizard multi-step
- Anagrafica clienti
- Ticket completi (dispositivo, IMEI, seriale, guasto, accessori, condizioni)
- Stati ticket personalizzabili per organizzazione
- Vista lista + filtri ticket
- **Foto pre/post/durante intervento** con galleria lightbox e zoom
- Firma digitale su tablet (canvas → PNG → MinIO)
- QR tracking pubblico (pagina cliente senza login, foto + stato)
- Stampa A4 + termica 58mm (PDF via pagina print)
- Branding personalizzato (logo, colore, dati negozio)
- Magazzino ricambi (SKU, varianti, giacenza, soglie minime)
- POS / Cassa non fiscale
- Ordini fornitori
- Template documenti (schema DB)
- Registro usato Art. 36 (schema DB)
- Ruoli (owner, admin, technician, front_desk) — schema DB
- Web Push notifiche
- Multi-sede (schema DB)
- Pannello super admin (approvazione, gestione tenant)
- Deploy Docker su VPS + Nginx Proxy Manager

---

## Phase 1 — Solo MVP completo 🎫

**Obiettivo**: un negozio singolo lavora interamente sull'app, nessun foglio carta.

### In lavorazione

- [ ] **Dashboard report** — fatturato, ticket chiusi, valore medio riparazione, nuovi clienti, andamento settimanale/mensile/annuale con grafici
- [ ] **Foto "durante" lavoro** — terza categoria foto accanto a pre/post
- [ ] **Lista prodotti sotto scorta** — alert visivo prodotti a zero o sotto soglia, con azione "aggiungi all'ordine"
- [ ] **Permessi UI per ruolo** — gate su azioni sensibili (elimina, prezzi, report) in base al ruolo del membro
- [ ] **4 template documenti** (non fiscali):
  - Preventivo — precompilato da ticket, righe personalizzabili, ricambi dal magazzino, totale, firma cliente su tablet, PDF scaricabile + inviabile
  - Scheda accettazione riparazione — dati dispositivo, condizioni, stima, firma cliente
  - Liberatoria dati — consenso GDPR + trattamento dati, firma
  - Ricevuta ritiro — riepilogo intervento, importo pagato, metodo pagamento, firma
- [ ] **Template messaggi WhatsApp** — 5+ template precompilati con variabili `{{cliente}}`, `{{stato}}`, `{{preventivo}}`, `{{link_tracking}}`, bottone copia + link wa.me
- [ ] **Registro usato Art. 36** — UI completa: lista acquisti usato con documento controparte, data, descrizione, importo, export PDF/Excel per GdF
- [ ] Notifiche email transazionali (cambio stato ticket → email cliente)
- [ ] Limite hard 5.000 ticket / 1 negozio enforced

### Backlog Phase 1

- [ ] Magic link login (alternativa password)
- [ ] Storico riparazioni per IMEI (ricerca globale cross-ticket)
- [ ] Etichette barcode stampabili (Code128 + QR)
- [ ] Export CSV di ticket e clienti

---

## Phase 2 — Pro 📦

**Obiettivo**: funzionalità avanzate vendibili al piano Pro.

- [ ] Report avanzati: margini ricambi, top guasti, tempo medio per tipo intervento, confronto periodi
- [ ] Export Excel completo (ticket, clienti, magazzino, movimenti)
- [ ] Ricerca IMEI globale cross-magazzino
- [ ] Ordini fornitori avanzati: ricezione parziale, diff automatico giacenze
- [ ] Smart Tags + filtri rapidi salvabili sui ticket
- [ ] Vista kanban ticket (drag & drop stati)
- [ ] POS avanzato: X/Z report giornalieri, storico sessioni cassa
- [ ] Sotto-magazzini per sede
- [ ] Limite 10.000 ticket / 1 negozio

---

## Phase 3 — Business 🏢

**Obiettivo**: AI, multi-sede, conformità avanzata.

- [ ] **Importa Fattura AI** — upload PDF/foto fattura → Claude Haiku Vision estrae righe → carico magazzino con review
- [ ] **Bot Telegram BI** — Claude Sonnet con tool use su query DB read-only ("quanti ticket oggi?", "fatturato questo mese?")
- [ ] Dashboard centralizzata multi-sede
- [ ] Trasferimenti stock tra sedi con approval flow
- [ ] Registro Usato Art. 36 avanzato — audit log immutabile, export firmato digitalmente
- [ ] Ruoli e permessi granulari custom per organizzazione
- [ ] Supporto prioritario
- [ ] Ticket illimitati, 2 sedi incluse + 10€/sede extra

---

## Phase 4 — Integrazioni fiscali e mobile

- [ ] **Documento Commerciale Digitale (DCD)** — integrazione con Registratore Telematico (RT) certificato AdE per scontrino fiscale digitale. Richiede partnership con provider RT (Epson, Custom, GTransmit o equivalente). Inviabile al cliente via WhatsApp/email/QR.
- [ ] **API WhatsApp Cloud** — sostituzione flusso copia/incolla con invio automatico (richiede account Meta Business verificato)
- [ ] App mobile React Native + Expo (se PWA non sufficiente per fotocamera/NFC)

---

## Principi

1. **MVP first** — ogni feature che non aiuta a vendere il piano corrente va in fase successiva
2. **No vendor lock-in** — niente Vercel, Supabase Cloud, Firebase. Tutto self-hostable
3. **Niente Stripe** finché non serve — piani come feature flag nel DB, attivazione manuale
4. **Niente WhatsApp API** finché non serve — copia/incolla è già un upgrade per l'utente target
5. **Niente over-engineering** — tre righe simili sono meglio di un'astrazione prematura
