# POS: IMEI/SN per articoli serializzati + Scontrino digitale + Stampa termica

**Data:** 2026-05-14  
**Stato:** Approvato

---

## Obiettivo

Tre miglioramenti alla cassa POS:
1. Campi opzionali IMEI e S/N per ogni riga del carrello (espandibili on-demand)
2. Pagina scontrino digitale accessibile dalla lista transazioni
3. Stampa scontrino in formato A4 e in formato termico 80mm via `window.print()`

---

## 1. IMEI/SN nel carrello

### Comportamento

- Ogni riga del carrello (da catalogo o manuale) ha un piccolo pulsante `+ Seriale` visibile a destra
- Al click si espandono due campi opzionali sotto la riga: **IMEI** e **S/N**
- Se già espansi, il bottone diventa `− Seriale` e i campi rimangono visibili
- I campi non sono obbligatori; se vuoti non vengono salvati
- I valori vengono trasmessi come hidden input nella form e salvati nel DB

### Modifica DB

Tabella `pos_transaction_items` — nuovi campi:

```sql
imei          varchar(50)   NULL
serial_number varchar(100)  NULL
```

Migrazione via Drizzle (`pnpm db:generate` + `pnpm db:migrate`).

### Modifiche frontend (`pos-sell-form.tsx`)

- Tipo `CartLine` esteso con `imei?: string` e `serialNumber?: string`
- Stato locale `expandedSerials: Set<number>` per tracciare quali righe sono espanse
- Bottone toggle per ogni riga
- Hidden inputs `items[i][imei]` e `items[i][serialNumber]`

### Modifiche action (`pos/new/actions.ts`)

- Schema Zod esteso con `imei` e `serialNumber` (entrambi opzionali, stringa o vuota)
- Inserimento in `posTransactionItems` con i nuovi campi

---

## 2. Link "Visualizza scontrino" nella lista transazioni

### Modifica (`pos/page.tsx`)

- Aggiunta colonna o icona `Receipt` su ogni riga della tabella "Ultime transazioni"
- Link a `/pos/transactions/[id]`
- Icona `Receipt` da lucide-react, stile coerente con il resto della UI

---

## 3. Pagina scontrino `/pos/transactions/[id]`

### Dati mostrati

**Intestazione negozio** (da `organizations`):
- Logo (`brandingLogoUrl`) se presente
- `name` o `legalName`
- P.IVA (`vatNumber`)
- Indirizzo (`address`, `city`, `postalCode`, `province`)
- Telefono (`phone`) se presente

**Dati transazione:**
- N. scontrino (`#0001` format, da `receiptNumber`)
- Data e ora (`createdAt`)
- Cliente (`customers.name`, `customers.phone`) se collegato

**Tabella articoli:**
- Colonne: Descrizione | Qty | Prezzo unit. | Sconto% | Totale
- Sotto ogni riga (se presenti): IMEI: `xxx` / S/N: `xxx` in font monospace più piccolo

**Piede:**
- Totale
- Metodo di pagamento
- Note (se presenti)

### Azioni (nascoste in stampa)

- Pulsante **Stampa A4** → `window.print()` diretto
- Pulsante **Stampa termica** → aggiunge classe `thermal-print` a `<body>`, chiama `window.print()`, la rimuove dopo

### Layout

- Schermata normale: scontrino centrato, max-width 600px, stile card
- `@media print` base: rimuove navigazione, padding ridotto, font standard
- `@media print` con `.thermal-print` su body: larghezza forzata 80mm, font monospace 10px, margini 2mm, tutto su una colonna

---

## 4. CSS stampa termica (`globals.css`)

```css
@media print {
  body.thermal-print {
    width: 80mm;
    max-width: 80mm;
    font-family: monospace;
    font-size: 10px;
    margin: 0;
    padding: 2mm;
  }
  body.thermal-print .receipt-logo,
  body.thermal-print .receipt-actions {
    display: none;
  }
}
```

---

## File toccati

| File | Tipo modifica |
|---|---|
| `src/db/schema.ts` | +`imei`, +`serialNumber` su `posTransactionItems` |
| migration generata da Drizzle | nuova |
| `src/app/(app)/pos/new/pos-sell-form.tsx` | bottone espandi + campi IMEI/SN + hidden inputs |
| `src/app/(app)/pos/new/actions.ts` | salva `imei` e `serialNumber` |
| `src/app/(app)/pos/page.tsx` | link "Visualizza scontrino" per ogni transazione |
| `src/app/(app)/pos/transactions/[id]/page.tsx` | nuova pagina (da creare) |
| `src/app/globals.css` | `@media print` per layout termico 80mm |

---

## Vincoli e note

- Nessuna libreria esterna aggiunta
- La stampa termica richiede che la stampante sia configurata su Windows come stampante di sistema (driver standard)
- IMEI e S/N non sono validati nel formato (MVP); potrebbero essere validati in futuro
- Il layout dello scontrino usa i dati già presenti in `organizations` — nessun nuovo campo DB per l'org
