# WhatsApp — flusso copia/incolla manuale

## Decisione

In MVP **non integriamo l'API WhatsApp Business** (Meta Cloud).
Il sistema genera il testo del messaggio (con link tracking, dati ticket, ecc.) e l'admin lo copia e incolla manualmente nella chat WhatsApp del cliente.

## Perché

- L'API Meta Cloud richiede:
  - account WhatsApp Business approvato (giorni/settimane)
  - costi per conversazione (~0,03–0,06 €/msg in Italia, dipende dalla categoria)
  - template approvati da Meta per messaggi outbound (rigidi)
- Il pubblico target (riparatori al banco) usa già WhatsApp tutto il giorno. Il dolore è "scrivere ogni volta lo stesso messaggio + cercare il link", non "automatizzare l'invio".
- **Generare testo perfetto + un click per aprire WhatsApp con messaggio precompilato è già il 90% del valore.**

## UX

Su ogni ticket, una sezione "Comunicazione cliente" con:

1. **Selettore template** (`In lavorazione`, `Pronto`, `Preventivo richiesto`, ecc., editabili dall'admin).
2. **Anteprima messaggio renderizzato** (variabili sostituite: nome cliente, codice ticket, stato, link tracking).
3. Due bottoni:
   - **"Copia messaggio"** — usa Clipboard API, mostra toast "Copiato".
   - **"Apri in WhatsApp"** — link `https://wa.me/<numero>?text=<urlencoded>` che apre WhatsApp Web/app con messaggio già scritto. Un click → invio.

Sotto, un contatore: "Ultimo messaggio inviato: 2 giorni fa" (basato sulla tabella `notifications` con channel `whatsapp_manual` — l'utente preme "Marca come inviato" o lo facciamo automatico al click su "Apri in WhatsApp").

## Template di default (seed)

```
[Pronto al ritiro]
Ciao {{cliente_nome}},
il tuo {{dispositivo}} è pronto per il ritiro presso {{negozio}}.
Costo finale: € {{importo}}
Apri il link per i dettagli: {{link_tracking}}
A presto,
{{negozio}}
```

```
[In lavorazione]
Ciao {{cliente_nome}},
abbiamo preso in carico il tuo {{dispositivo}}.
Codice ticket: {{codice}}
Puoi controllare lo stato qui: {{link_tracking}}
```

```
[Preventivo richiesto]
Ciao {{cliente_nome}},
abbiamo diagnosticato il tuo {{dispositivo}}.
Preventivo: € {{importo_preventivo}}
Conferma o scrivi: {{link_tracking}}
```

L'admin può creare template custom, assegnarli a stati specifici (suggerimento automatico quando il ticket cambia stato).

## Roadmap futura

Quando l'utente avrà un account Meta Business approvato:
- Aggiungere `whatsapp_send` come secondo channel in `notifications`.
- Mantenere il flusso copia/incolla come **fallback** (utile per messaggi free‑form fuori template approvati Meta).
- Trigger automatico quando un ticket cambia stato verso uno con template legato (con possibilità di disabilitare per organizzazione).

Nel codice, isolare l'invio dietro un'interfaccia `MessageChannel` per non riscrivere mezzo modulo:

```ts
interface MessageChannel {
  send(template: TemplateRender, recipient: Customer): Promise<NotificationResult>;
}

class ManualWhatsAppChannel implements MessageChannel { /* genera link wa.me */ }
class ApiWhatsAppChannel  implements MessageChannel { /* Phase futura */ }
```
