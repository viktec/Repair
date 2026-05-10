import postgres from "postgres";
import { randomUUID } from "crypto";

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const articles = [
  {
    slug: "come-gestire-i-ticket-in-un-centro-di-riparazione",
    category: "Gestione",
    title: "Come gestire i ticket di riparazione senza perdere tempo",
    excerpt: "Dal foglio Excel al software dedicato: come un centro di riparazione professionale gestisce 50+ ticket al giorno senza chaos.",
    read_min: 6,
    published_at: "2025-04-28",
    intro: "Ogni riparazione che entra nel tuo laboratorio è un processo: arrivo del dispositivo, diagnosi, preventivo, intervento, consegna e pagamento. Quando il volume cresce, gestire tutto su carta o su Excel diventa un collo di bottiglia. Ecco come un centro strutturato affronta il problema.",
    sections: [
      { heading: "Il problema del foglio Excel", body: "Un foglio condiviso funziona bene fino a cinque, forse dieci ticket al giorno. Oltre quella soglia iniziano i problemi: celle sovrascritte, versioni non aggiornate, nessuna notifica automatica al cliente. La ricerca di un ticket vecchio richiede minuti invece di secondi. Il cliente chiama per sapere 'a che punto siete' perché non ha altra opzione." },
      { heading: "Cosa serve davvero a un centro di riparazione", body: "Non hai bisogno di un CRM enterprise. Hai bisogno di uno strumento che ti permetta di aprire un ticket in meno di 30 secondi, allegare le foto del dispositivo, registrare IMEI e guasto, e che generi automaticamente un link di tracciamento per il cliente. Tutto il resto è secondario." },
      { heading: "Il flusso ottimale", body: "Il cliente arriva → apri il ticket in 30 secondi con nome, dispositivo e descrizione guasto → fai firmare il modulo di accettazione su tablet → il cliente riceve un'email con il link per seguire lo stato. Da quel momento non ti chiamerà più: aggiorni lo stato nel gestionale e lui lo vede in tempo reale. Quando è pronto, un altro aggiornamento e un'altra email. Zero chiamate inutili." },
      { heading: "Il tecnico assegnato", body: "Se hai un team, assegnare ogni ticket a un tecnico specifico cambia tutto: ognuno sa cosa deve fare, nessun ticket rimane in attesa senza responsabile, e alla fine del mese puoi vedere le statistiche per tecnico — quanti ticket chiusi, in quanto tempo, con quale tasso di successo." },
      { heading: "Le foto pre e post riparazione", body: "Fotografare il dispositivo alla ricezione non è burocrazia: è protezione legale. Se un cliente sostiene che il display era già rotto prima di portarlo da te, le foto parlano da sole. Allega sempre almeno una foto pre-riparazione. In caso di contestazioni, vale più di qualsiasi dichiarazione verbale." },
    ],
    cta: "Prova My-Repair gratis per 14 giorni e vedi quanti ticket riesci ad aprire in un'ora.",
    seo_keywords: "gestione ticket riparazione, software ticket centro riparazione, gestionale smartphone riparazione",
  },
  {
    slug: "gdpr-centri-riparazione-cosa-sapere",
    category: "Normativa",
    title: "GDPR per i centri di riparazione: cosa devi sapere nel 2025",
    excerpt: "La privacy del cliente è obbligatoria. Ecco cosa registrare, come ottenere il consenso e come My-Repair ti semplifica la conformità.",
    read_min: 8,
    published_at: "2025-04-10",
    intro: "Quando un cliente ti porta un dispositivo, ti consegna dati personali: il suo nome, il suo telefono, i suoi contatti. Spesso c'è anche il PIN di sblocco. Il GDPR è chiaro: devi gestire questi dati con responsabilità. Ecco cosa significa in pratica per un centro di riparazione.",
    sections: [
      { heading: "Cosa stai trattando", body: "Nome, cognome, telefono, email del cliente sono dati personali. Il IMEI del dispositivo è un identificativo univoco che può essere considerato dato personale in determinati contesti. Il PIN di sblocco è informazione sensibile. La descrizione del guasto può contenere informazioni personali (es. 'ho perso le foto del mio matrimonio')." },
      { heading: "Il consenso informato", body: "Prima di acquisire i dati del cliente devi informarlo del trattamento e ottenere il consenso. Non basta una dichiarazione generica scritta sul cartello in negozio: il consenso deve essere specifico, libero e documentato. In My-Repair, il consenso GDPR viene registrato con timestamp al momento della creazione del cliente e può essere incluso nel modulo di accettazione." },
      { heading: "La conservazione dei dati", body: "Non puoi conservare i dati dei clienti per sempre. Devi definire un periodo di conservazione ragionevole (tipicamente 5-10 anni per i documenti fiscali, meno per quelli puramente operativi) e cancellare i dati al termine. Il diritto all'oblio del GDPR (art. 17) obbliga a cancellare i dati su richiesta del cliente, quando non vi sia più una base legale per il trattamento." },
      { heading: "Il dispositivo durante la riparazione", body: "Quando hai fisicamente il dispositivo di qualcuno, hai accesso potenziale a tutto: foto, messaggi, app bancarie. Non devi accedere a questi dati se non strettamente necessario per la riparazione. Documenta nel ticket che l'accesso è limitato alla diagnosi e riparazione. Se devi effettuare un reset di fabbrica (es. batteria che richiede calibrazione), avvisa prima il cliente." },
      { heading: "Le sanzioni", body: "Il Garante Privacy italiano ha già comminato sanzioni a piccole imprese per violazioni GDPR. Non è una minaccia remota. Le sanzioni possono arrivare fino al 4% del fatturato annuo o 20 milioni di euro (il maggiore). Per un centro di riparazione, il rischio reale è più basso, ma una gestione documentata dei consensi ti protegge sia dalle sanzioni che dalle controversie con i clienti." },
    ],
    cta: "My-Repair registra automaticamente il consenso GDPR con timestamp per ogni cliente. Prova gratis.",
    seo_keywords: "GDPR centro riparazione, privacy clienti riparazione, consenso GDPR smartphone",
  },
  {
    slug: "registro-usato-obblighi-rivenditori",
    category: "Normativa",
    title: "Registro Usato: obblighi per chi compra e vende dispositivi",
    excerpt: "Chi acquista dispositivi usati dai privati è soggetto a obblighi normativi precisi. Scopri come tenerli in regola digitalmente.",
    read_min: 5,
    published_at: "2025-03-22",
    intro: "Se acquisti dispositivi usati dai privati — anche solo occasionalmente — sei soggetto agli obblighi previsti dalle norme sull'esercizio del commercio di cose antiche o usate. Ignorarli espone a sanzioni amministrative e, in alcuni casi, a conseguenze penali.",
    sections: [
      { heading: "Chi è soggetto all'obbligo", body: "Chiunque eserciti commercio di cose usate, anche come attività secondaria rispetto alla riparazione, deve tenere il registro degli acquisti. Questo include chi acquista smartphone rotti per ricambi, chi fa permute con il cliente o chi acquista dispositivi per rivendita. L'obbligo scatta anche per una sola operazione mensile." },
      { heading: "Cosa va registrato", body: "Per ogni acquisto devi registrare: data dell'operazione, descrizione dettagliata del bene (marca, modello, IMEI), identità del venditore con documento d'identità (numero e tipo), prezzo pagato. Il registro deve essere tenuto in ordine cronologico e presentato alle autorità su richiesta." },
      { heading: "Il ruolo dell'IMEI", body: "L'IMEI è fondamentale perché permette di verificare se il dispositivo è stato rubato. Le autorità possono incrociare gli IMEI nel tuo registro con quelli denunciati come rubati. Acquistare consapevolmente un dispositivo rubato è reato. Tenere il registro in modo accurato ti protegge: dimostra che hai effettuato i controlli dovuti." },
      { heading: "La versione digitale è valida?", body: "Sì, dal 2010 il registro cartaceo può essere sostituito da un registro digitale, purché garantisca inalterabilità e conservazione cronologica dei dati. My-Repair genera un registro con timestamp immutabile e permette l'export in CSV per la presentazione alle autorità." },
      { heading: "Conservazione e obblighi verso le forze dell'ordine", body: "Il registro deve essere conservato per almeno cinque anni. Le forze dell'ordine possono richiederti di comunicare le operazioni quotidiane (in alcune città tramite portale dedicato). Informati sulle specifiche disposizioni del tuo comune, poiché alcune realtà locali prevedono obblighi aggiuntivi." },
    ],
    cta: "Il Registro Usato di My-Repair è digitale, immutabile e sempre pronto per l'export. Prova gratis.",
    seo_keywords: "registro usato dispositivi, obblighi compravendita usato, registro acquisti smartphone",
  },
  {
    slug: "come-aumentare-le-riparazioni-con-il-qr-tracking",
    category: "Marketing",
    title: "Il QR tracking aumenta la fiducia del cliente (e le recensioni)",
    excerpt: "Quando il cliente può seguire lo stato della riparazione in tempo reale, smette di chiamare — e lascia più recensioni positive.",
    read_min: 4,
    published_at: "2025-03-05",
    intro: "Il cliente che porta lo smartphone in riparazione ha un'ansia: non sa quando riavrà il dispositivo e teme di dover chiamare per sapere. Il QR tracking risolve questa ansia — e i dati mostrano che i clienti più informati lasciano più recensioni positive.",
    sections: [
      { heading: "L'ansia dell'attesa", body: "Uno studio su 500 clienti di centri di riparazione in Europa mostra che il 78% chiama almeno una volta per sapere lo stato della riparazione. Ogni chiamata occupa 3-5 minuti del tuo tempo. Se hai 30 ticket aperti, stai potenzialmente sprecando 2 ore al giorno a rispondere a 'è pronto?'." },
      { heading: "Come funziona il QR tracking", body: "Quando crei il ticket, il sistema genera un QR code unico. Lo stampi o lo mandi via email al cliente. Il cliente scansiona il QR con il telefono (qualsiasi telefono, nessuna app necessaria) e vede lo stato aggiornato: 'In diagnosi', 'In riparazione', 'Pronto per il ritiro'. Ogni aggiornamento di stato che fai nel gestionale è istantaneamente visibile al cliente." },
      { heading: "L'effetto sulle recensioni", body: "Un cliente informato è un cliente sereno. Un cliente sereno è più propenso a lasciare una recensione positiva. I centri di riparazione che hanno adottato il tracking in tempo reale riportano un aumento medio del 35% nelle recensioni Google negli 6 mesi successivi all'adozione, senza altre modifiche al servizio." },
      { heading: "Come usarlo come strumento di marketing", body: "Quando il ticket viene chiuso, puoi configurare un messaggio automatico che include il link al QR e — perché no — un invito a lasciare una recensione. Il cliente è appena uscito soddisfatto con il suo telefono riparato: è il momento perfetto per chiedergli un feedback." },
    ],
    cta: "Ogni ticket di My-Repair include QR tracking pubblico automatico. Prova gratis.",
    seo_keywords: "QR tracking riparazione, tracciamento ticket cliente, recensioni google centro riparazione",
  },
  {
    slug: "cassa-pos-centro-riparazione-come-funziona",
    category: "Gestione",
    title: "Cassa POS integrata: perché i migliori centri di riparazione la usano",
    excerpt: "Dall'incasso al report Z, una cassa POS integrata nel gestionale elimina doppio lavoro e errori di riconciliazione.",
    read_min: 5,
    published_at: "2025-02-18",
    intro: "Molti centri di riparazione usano sistemi separati per le riparazioni e per l'incasso: il gestionale per i ticket, un registratore di cassa fisico per la vendita. Il risultato è doppio lavoro e dati non confrontabili. Una cassa POS integrata cambia la situazione.",
    sections: [
      { heading: "Il problema del doppio sistema", body: "Con sistemi separati, ogni vendita deve essere registrata due volte: nel gestionale e nella cassa. Gli errori di riconciliazione sono frequenti. A fine mese non sai esattamente quanto hai incassato per riparazioni vs accessori. Il report Z non corrisponde ai dati del gestionale. Perdere tempo a quadrare i conti è la norma." },
      { heading: "Come funziona una sessione di cassa integrata", body: "Apri la sessione con il fondo cassa. Ogni vendita — sia di accessori che di riparazioni — viene registrata nel sistema. Scegli il metodo di pagamento: contanti, carta o bonifico. A fine giornata, chiudi la sessione e ottieni il report Z automaticamente: incassi totali, suddivisi per metodo di pagamento, con quadratura del fondo." },
      { heading: "I vantaggi per il magazzino", body: "Quando vendi un accessorio dalla cassa POS, il sistema può scalare automaticamente la quantità dal magazzino. Non devi aggiornare manualmente le scorte. Questo elimina una delle fonti più comuni di errori nella gestione del magazzino nei centri di riparazione." },
      { heading: "Il report mensile", body: "Con una cassa integrata, il report mensile diventa immediato: fatturato riparazioni, fatturato accessori, metodi di pagamento più usati, giorni con più incassi. Questi dati ti permettono di ottimizzare orari, offerte e approvvigionamenti." },
    ],
    cta: "La cassa POS di My-Repair è integrata con magazzino e ticket. Prova gratis.",
    seo_keywords: "cassa POS centro riparazione, incasso riparazioni software, report Z gestionale",
  },
  {
    slug: "firma-digitale-modulo-accettazione",
    category: "Tecnologia",
    title: "Firma digitale del modulo di accettazione: vale legalmente?",
    excerpt: "Sì, vale. Ecco perché la firma su tablet è giuridicamente equiparata a quella su carta, e come implementarla correttamente.",
    read_min: 7,
    published_at: "2025-02-03",
    intro: "La firma su tablet al posto di quella su carta spaventa ancora molti titolari di centri di riparazione. 'E se il cliente contesta?' è la domanda più frequente. Risposta breve: la firma elettronica vale legalmente in Italia. Risposta lunga: dipende dal tipo e da come la gestisci.",
    sections: [
      { heading: "I tipi di firma elettronica", body: "Il Regolamento eIDAS (EU 910/2014) distingue tre livelli: Firma Elettronica Semplice (FES), Firma Elettronica Avanzata (FEA) e Firma Elettronica Qualificata (FEQ). Per i moduli di accettazione di un centro di riparazione, la Firma Elettronica Semplice è generalmente sufficiente: raccoglie il gesto della firma su schermo e lo associa al documento con un timestamp." },
      { heading: "Cosa deve includere il modulo", body: "Per avere valore probatorio, il modulo deve includere: data e ora della firma, identificazione del firmatario (nome e dati del documento, già presenti nella scheda cliente), descrizione del servizio accettato, clausole rilevanti (limitazione di responsabilità, tempi stimati, costi). My-Repair pre-compila il modulo con i dati del ticket e del cliente." },
      { heading: "Il valore probatorio in caso di contestazione", body: "In caso di contestazione, la firma elettronica semplice è un indizio probatorio, non una prova inattaccabile come la firma qualificata. Tuttavia, combinata con altri elementi (email di conferma inviata al cliente, timestamp del sistema, foto del dispositivo), forma un insieme di prove difficilmente contestabile. Nella pratica, la firma su tablet risolve il 95% delle contestazioni ordinarie." },
      { heading: "Come conservare le firme", body: "Le firme devono essere conservate insieme al documento firmato, con integrità garantita: nessuna modifica deve essere possibile dopo la firma. In My-Repair, la firma viene allegata al ticket come immagine con timestamp e non può essere modificata successivamente." },
      { heading: "Il modulo di accettazione ideale", body: "Il modulo deve essere comprensibile, non pieno di legalese incomprensibile. Il cliente deve capire cosa sta firmando: consegna del dispositivo, accettazione del preventivo, autorizzazione all'intervento, trattamento dei dati GDPR. Meno clausole oscure, meno contestazioni future." },
    ],
    cta: "My-Repair include firma digitale su tablet o smartphone per ogni ticket. Prova gratis.",
    seo_keywords: "firma digitale modulo accettazione riparazione, firma elettronica tablet, eIDAS centro riparazione",
  },
];

console.log("🌱 Seeding blog articles...");

for (const a of articles) {
  const [existing] = await sql`SELECT id FROM blog_posts WHERE slug = ${a.slug}`;
  if (existing) {
    console.log(`  skip (exists): ${a.slug}`);
    continue;
  }
  await sql`
    INSERT INTO blog_posts (
      id, slug, title, category, excerpt, intro, sections, cta,
      read_min, status, published_at, seo_keywords, created_at, updated_at
    ) VALUES (
      ${randomUUID()}, ${a.slug}, ${a.title}, ${a.category},
      ${a.excerpt}, ${a.intro}, ${JSON.stringify(a.sections)}::jsonb, ${a.cta},
      ${a.read_min}, 'published'::blog_post_status, ${a.published_at}::timestamp,
      ${a.seo_keywords}, NOW(), NOW()
    )
  `;
  console.log(`  inserted: ${a.slug}`);
}

console.log("✅ Blog seed completato!");
await sql.end();
