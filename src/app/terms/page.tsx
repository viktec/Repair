import Link from "next/link";

export const metadata = {
  title: "Termini di Servizio - My-Repair",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Termini di Servizio</h1>
        <p className="text-sm text-slate-500 mb-10">Ultimo aggiornamento: 2026-05-04</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Accettazione dei termini</h2>
          <p className="text-slate-600 leading-relaxed">
            Utilizzando My-Repair (di seguito "Servizio") accetti integralmente i presenti Termini di
            Servizio. Se non li accetti, non puoi utilizzare il Servizio. L&apos;utilizzo continuato
            del Servizio dopo eventuali modifiche ai Termini costituisce accettazione delle modifiche stesse.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Descrizione del servizio</h2>
          <p className="text-slate-600 leading-relaxed">
            My-Repair è una piattaforma SaaS (Software as a Service) destinata ai centri di
            riparazione di dispositivi elettronici. Fornisce strumenti per la gestione di ticket
            di riparazione, anagrafica clienti, magazzino, cassa POS e reportistica.
            Il Servizio è accessibile via web all&apos;indirizzo app.my-repair.it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Abbonamenti e pagamenti</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Il Servizio è disponibile con i seguenti piani:
          </p>
          <ul className="list-disc list-inside text-slate-600 space-y-1.5 ml-2">
            <li><strong>Start</strong>: piano base gratuito con funzionalità essenziali.</li>
            <li><strong>Pro</strong>: include magazzino, fornitori, cassa POS e report.</li>
            <li><strong>Business</strong>: include tutte le funzionalità Pro più il registro usato art. 36.</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-3">
            I nuovi account dispongono di un periodo di prova gratuito di 14 giorni con accesso
            completo. Al termine del trial, per continuare a utilizzare le funzionalità premium
            è necessario attivare un piano a pagamento. I prezzi sono indicati nella pagina
            di upgrade all&apos;interno dell&apos;applicazione.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            Gli abbonamenti si rinnovano automaticamente salvo disdetta prima della scadenza del
            periodo corrente. In caso di mancato pagamento l&apos;accesso alle funzionalità premium
            verrà sospeso.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Obblighi dell&apos;utente</h2>
          <p className="text-slate-600 leading-relaxed mb-3">L&apos;utente si impegna a:</p>
          <ul className="list-disc list-inside text-slate-600 space-y-1.5 ml-2">
            <li>Fornire informazioni accurate in fase di registrazione.</li>
            <li>Mantenere riservate le credenziali di accesso.</li>
            <li>Utilizzare il Servizio in conformità alla normativa vigente.</li>
            <li>Non tentare di accedere ai dati di altre organizzazioni.</li>
            <li>Trattare i dati dei propri clienti nel rispetto del GDPR, assumendo il ruolo di titolare del trattamento.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Limitazioni di responsabilità</h2>
          <p className="text-slate-600 leading-relaxed">
            Il Servizio è fornito "così com&apos;è". My-Repair non garantisce disponibilità
            ininterrotta e non è responsabile per perdite di dati derivanti da cause di forza
            maggiore o da un utilizzo improprio del Servizio. My-Repair effettua backup regolari
            dei dati, ma l&apos;utente è responsabile della conservazione di copie proprie dei
            dati critici. La responsabilità complessiva di My-Repair nei confronti dell&apos;utente
            non supera l&apos;importo pagato negli ultimi 3 mesi di abbonamento.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Sospensione e cancellazione</h2>
          <p className="text-slate-600 leading-relaxed">
            My-Repair si riserva il diritto di sospendere o cancellare account che violino i
            presenti Termini, previo avviso ove possibile. L&apos;utente può cancellare il proprio
            account in qualsiasi momento dalle impostazioni. A seguito della cancellazione i dati
            saranno eliminati entro 30 giorni secondo quanto previsto dalla Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Legge applicabile</h2>
          <p className="text-slate-600 leading-relaxed">
            I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia
            sarà competente in via esclusiva il Foro del titolare del Servizio,
            salvo diversa disposizione di legge a tutela del consumatore.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">8. Contatti</h2>
          <p className="text-slate-600 leading-relaxed">
            Per domande sui presenti Termini scrivi a{" "}
            <a href="mailto:info@my-repair.it" className="text-teal-700 hover:underline">
              info@my-repair.it
            </a>
            .
          </p>
        </section>

        <div className="border-t border-slate-200 pt-8 mt-10 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-800 hover:underline">
            Privacy Policy
          </Link>
          <Link href="/" className="hover:text-slate-800 hover:underline">
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
