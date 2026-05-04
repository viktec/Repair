import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - My-Repair",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Ultimo aggiornamento: 2026-05-04</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Titolare del trattamento</h2>
          <p className="text-slate-600 leading-relaxed">
            Il titolare del trattamento dei dati personali è My-Repair (di seguito anche "Servizio"),
            raggiungibile all&apos;indirizzo email{" "}
            <a href="mailto:privacy@my-repair.it" className="text-teal-700 hover:underline">
              privacy@my-repair.it
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">2. Dati raccolti</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Durante l&apos;utilizzo del Servizio raccogliamo i seguenti dati:
          </p>
          <ul className="list-disc list-inside text-slate-600 space-y-1.5 ml-2">
            <li>Dati di registrazione: nome, email, password (cifrata con bcrypt).</li>
            <li>Dati dell&apos;organizzazione: nome del negozio, indirizzo, partita IVA, telefono.</li>
            <li>Dati operativi: informazioni sui ticket di riparazione, dati dei clienti finali, foto dei dispositivi.</li>
            <li>Dati di utilizzo: log di accesso, indirizzo IP, sessioni.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Finalità del trattamento</h2>
          <p className="text-slate-600 leading-relaxed mb-3">I dati vengono trattati per:</p>
          <ul className="list-disc list-inside text-slate-600 space-y-1.5 ml-2">
            <li>Erogare il Servizio di gestione riparazioni (base contrattuale).</li>
            <li>Inviare comunicazioni transazionali (aggiornamenti ticket, reset password).</li>
            <li>Adempiere a obblighi di legge (registro usato art. 36 T.U.L.P.S.).</li>
            <li>Garantire la sicurezza e il corretto funzionamento della piattaforma.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">4. Conservazione dei dati</h2>
          <p className="text-slate-600 leading-relaxed">
            I dati degli account attivi vengono conservati per tutta la durata del contratto.
            Alla cancellazione dell&apos;account, i dati vengono eliminati entro 30 giorni, salvo
            obblighi di legge che richiedano una conservazione più lunga (es. dati fiscali: 10 anni).
            I backup vengono conservati per un massimo di 90 giorni.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Diritti dell&apos;utente</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            In base al GDPR (Reg. UE 2016/679) hai diritto a:
          </p>
          <ul className="list-disc list-inside text-slate-600 space-y-1.5 ml-2">
            <li>Accesso ai tuoi dati personali.</li>
            <li>Rettifica di dati inesatti.</li>
            <li>Cancellazione ("diritto all&apos;oblio").</li>
            <li>Portabilità dei dati in formato strutturato.</li>
            <li>Opposizione al trattamento.</li>
            <li>Proporre reclamo all&apos;Autorità di controllo (Garante Privacy italiano).</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-3">
            Per esercitare questi diritti scrivi a{" "}
            <a href="mailto:privacy@my-repair.it" className="text-teal-700 hover:underline">
              privacy@my-repair.it
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Cookie</h2>
          <p className="text-slate-600 leading-relaxed">
            Il Servizio utilizza esclusivamente cookie tecnici necessari al funzionamento
            dell&apos;applicazione (sessione di autenticazione). Non vengono utilizzati cookie
            di profilazione o di terze parti a scopo pubblicitario.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Sicurezza</h2>
          <p className="text-slate-600 leading-relaxed">
            I dati sono ospitati su server europei (VPS con provider certificato ISO 27001).
            Le password vengono cifrate con bcrypt (costo 12). Le comunicazioni avvengono
            tramite HTTPS con certificati TLS aggiornati.
          </p>
        </section>

        <div className="border-t border-slate-200 pt-8 mt-10 flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-800 hover:underline">
            Termini di servizio
          </Link>
          <Link href="/" className="hover:text-slate-800 hover:underline">
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
