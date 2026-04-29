"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { acceptQuoteAction, rejectQuoteAction, getSignatureUploadUrl } from "./actions";
import { CheckCircle2, XCircle, Loader2, Euro, ScrollText, ChevronDown, PenLine, RotateCcw, FileText } from "lucide-react";
import { WAIVER_DECLARATIONS } from "@/lib/waiver-declarations";

const DEFAULT_TERMS = `TERMINI E CONDIZIONI DI ASSISTENZA

• Sarà effettuata una tempestiva diagnosi seguita dalla comunicazione del preventivo di spesa.
• L'accettazione, anche verbale, del preventivo viene considerata come ordine.
• I tempi di attesa per gli interventi variano dai 2 ai 12 giorni lavorativi.
• Il pagamento dovrà essere effettuato a riparazione avvenuta direttamente in negozio.
• È consigliabile effettuare un backup dei dati prima della consegna del dispositivo. Non ci assumiamo alcuna responsabilità per eventuali perdite di dati durante la riparazione.
• In caso di danneggiamenti irreversibili durante la diagnosi, non ci assumiamo alcuna responsabilità. Il cliente accetta che un dispositivo malfunzionante potrebbe essere ritirato anche completamente non funzionante.
• La garanzia sul ricambio e sulla manodopera ha validità 3 mesi dalla data di riparazione.
• La garanzia non si applica su interventi software, su dispositivi venuti a contatto con liquidi e su interventi hardware al solo fine di recupero dati.
• Il terminale rimarrà in giacenza gratuita per 7 giorni dalla comunicazione di riparazione avvenuta, oltre i quali verrà aggiunta una diaria di €1 per ogni giorno successivo.
• Dopo 90 giorni di giacenza, come previsto dalla legge, il dispositivo diverrà di proprietà del centro riparazioni.

LIMITAZIONI DI GARANZIA
• Rotture causate da incidenti, cadute, schiacciamento o uso improprio
• Rotture di vetri e cristalli
• Degrado naturale causato dal tempo
• Prodotti con evidenti segni di manomissione
• Visibili difetti di conformità non dichiarati entro 5gg lavorativi dalla consegna

N.B.: LEGGERE ATTENTAMENTE I PRESENTI TERMINI E CONDIZIONI. IL CENTRO RIPARAZIONI SI ESIME DA OGNI RESPONSABILITÀ PER EVENTUALI DANNI ACCIDENTALI DOVUTI ALLA SOLA APERTURA DEL DISPOSITIVO, QUALORA ESSO PRESENTASSE GIÀ ANOMALIE DI FUNZIONAMENTO O DANNI PREESISTENTI NON DICHIARATI AL MOMENTO DELLA CONSEGNA.

Dichiaro di aver letto e accetto integralmente i presenti termini e condizioni di assistenza.`;

type Props = {
  token: string;
  estimatedCost: number;
  accepted: boolean;
  rejected: boolean;
  primaryColor: string;
  termsAndConditions: string | null;
};

type Phase = "quote" | "waiver" | "terms" | "sign" | "accepted" | "rejected";

// Step indicator shown at top of each phase card
function StepBar({ current, primaryColor }: { current: 1 | 2 | 3 | 4; primaryColor: string }) {
  const steps = ["Preventivo", "Dichiarazioni", "Termini", "Firma"];
  return (
    <div className="flex items-center gap-1 text-xs">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={step} className="flex items-center gap-1">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold"
              style={
                active
                  ? { backgroundColor: primaryColor, color: "#fff" }
                  : done
                  ? { backgroundColor: "#d1fae5", color: "#065f46" }
                  : { backgroundColor: "#f1f5f9", color: "#94a3b8" }
              }
            >
              {done ? "✓" : step}
            </span>
            <span
              className="hidden sm:inline font-medium"
              style={{ color: active ? primaryColor : done ? "#065f46" : "#94a3b8" }}
            >
              {label}
            </span>
            {i < 3 && <span className="mx-1 flex-1 border-t border-slate-200" />}
          </div>
        );
      })}
    </div>
  );
}

export function QuoteSection({ token, estimatedCost, accepted, rejected, primaryColor, termsAndConditions }: Props) {
  const [isPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>(
    accepted ? "accepted" : rejected ? "rejected" : "quote",
  );
  const [waiverChecked, setWaiverChecked] = useState<boolean[]>(() => WAIVER_DECLARATIONS.map(() => false));
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [sigDrawing, setSigDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const terms = termsAndConditions ?? DEFAULT_TERMS;
  const formatted = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(estimatedCost / 100);
  const allWaiverChecked = waiverChecked.every(Boolean);

  useEffect(() => {
    if (phase !== "sign") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [phase]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 32) setScrolledToBottom(true);
  }

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ("touches" in e) return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSigDrawing(true);
    setHasStrokes(true);
    lastPos.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!sigDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }

  function stopDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setSigDrawing(false);
    lastPos.current = null;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  }

  function handleReject() {
    if (!confirm("Sei sicuro di voler rifiutare il preventivo? Il centro sarà avvisato.")) return;
    startTransition(async () => {
      await rejectQuoteAction(token);
      setPhase("rejected");
    });
  }

  async function handleConfirmSign() {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    setSignError(null);
    startTransition(async () => {
      try {
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
        const { uploadUrl, key } = await getSignatureUploadUrl(token);
        await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/png" } });
        await acceptQuoteAction(token, key);
        setPhase("accepted");
      } catch {
        setSignError("Errore durante l'invio. Riprova.");
      }
    });
  }

  const btnBack = "flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50";
  const btnPrimary = "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-30";

  // ── Accepted ─────────────────────────────────────────────────────────────
  if (phase === "accepted") {
    return (
      <div className="rounded-2xl bg-emerald-50 p-5 shadow-sm border border-emerald-200">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800">Preventivo accettato ✅</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Hai autorizzato la riparazione per <strong>{formatted}</strong>, firmato digitalmente e accettato i termini. Procederemo a breve!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Rejected ─────────────────────────────────────────────────────────────
  if (phase === "rejected") {
    return (
      <div className="rounded-2xl bg-red-50 p-5 shadow-sm border border-red-200">
        <div className="flex items-start gap-3">
          <XCircle className="h-6 w-6 shrink-0 text-red-500 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Riparazione non autorizzata</p>
            <p className="text-sm text-red-700 mt-0.5">Hai rifiutato il preventivo. Contattaci per discutere alternative.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign ──────────────────────────────────────────────────────────────────
  if (phase === "sign") {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
        <StepBar current={4} primaryColor={primaryColor} />
        <div className="flex items-center gap-2">
          <PenLine className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
          <p className="font-semibold text-foreground">Firma digitale</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Firma nel riquadro qui sotto con il dito per completare l&apos;accettazione del preventivo di <strong>{formatted}</strong>.
        </p>
        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
          <canvas
            ref={canvasRef}
            width={600}
            height={190}
            className="w-full"
            style={{ touchAction: "none", cursor: "crosshair" }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          {!hasStrokes && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground/50">✍ Firma qui con il dito</p>
            </div>
          )}
        </div>
        {signError && <p className="text-xs text-red-600">{signError}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { clearCanvas(); setPhase("terms"); }} disabled={isPending} className={btnBack}>
            ← Torna indietro
          </button>
          <div className="flex gap-2">
            {hasStrokes && (
              <button onClick={clearCanvas} disabled={isPending} className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={handleConfirmSign}
              disabled={!hasStrokes || isPending}
              className={`flex-1 ${btnPrimary}`}
              style={{ backgroundColor: primaryColor }}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Firma e conferma
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Terms ─────────────────────────────────────────────────────────────────
  if (phase === "terms") {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
        <StepBar current={3} primaryColor={primaryColor} />
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
          <p className="font-semibold text-foreground">Termini e Condizioni</p>
        </div>
        <p className="text-xs text-muted-foreground">Scorri fino in fondo per continuare.</p>
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-64 overflow-y-auto rounded-xl border bg-slate-50 p-4 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono"
          >
            {terms}
          </div>
          {!scrolledToBottom && (
            <button
              onClick={() => scrollRef.current?.scrollBy({ top: 300, behavior: "smooth" })}
              className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white border px-2 py-1 text-xs text-muted-foreground shadow-sm animate-bounce"
            >
              <ChevronDown className="h-3.5 w-3.5" /> Scorri
            </button>
          )}
        </div>
        <label className={`flex items-start gap-3 cursor-pointer rounded-xl border p-3 transition-colors ${scrolledToBottom ? "hover:bg-slate-50" : "opacity-40 pointer-events-none"}`}>
          <input
            type="checkbox"
            checked={termsChecked}
            onChange={(e) => setTermsChecked(e.target.checked)}
            disabled={!scrolledToBottom}
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ accentColor: primaryColor }}
          />
          <span className="text-sm font-medium text-foreground">
            Ho letto e accetto integralmente i termini e condizioni di assistenza. Autorizzo la riparazione per <strong>{formatted}</strong>.
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setPhase("waiver")} disabled={isPending} className={btnBack}>← Torna indietro</button>
          <button
            onClick={() => setPhase("sign")}
            disabled={!termsChecked || isPending}
            className={btnPrimary}
            style={{ backgroundColor: primaryColor }}
          >
            <PenLine className="h-4 w-4" /> Procedi alla firma →
          </button>
        </div>
      </div>
    );
  }

  // ── Waiver ────────────────────────────────────────────────────────────────
  if (phase === "waiver") {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
        <StepBar current={2} primaryColor={primaryColor} />
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 shrink-0" style={{ color: primaryColor }} />
          <p className="font-semibold text-foreground">Dichiarazioni</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Leggi e spunta ogni dichiarazione. Sono tutte obbligatorie per procedere.
        </p>
        <div className="space-y-3">
          {WAIVER_DECLARATIONS.map((decl, i) => (
            <label
              key={i}
              className={`flex items-start gap-3 cursor-pointer rounded-xl border p-3 transition-colors hover:bg-slate-50 ${waiverChecked[i] ? "border-emerald-200 bg-emerald-50/40" : ""}`}
            >
              <input
                type="checkbox"
                checked={waiverChecked[i]}
                onChange={(e) => {
                  const updated = [...waiverChecked];
                  updated[i] = e.target.checked;
                  setWaiverChecked(updated);
                }}
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ accentColor: primaryColor }}
              />
              <span className="text-sm text-foreground leading-snug">{decl}</span>
            </label>
          ))}
        </div>
        {!allWaiverChecked && (
          <p className="text-xs text-amber-600">
            Spunta tutte le dichiarazioni per continuare ({waiverChecked.filter(Boolean).length}/{WAIVER_DECLARATIONS.length} completate).
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setPhase("quote")} disabled={isPending} className={btnBack}>← Torna indietro</button>
          <button
            onClick={() => setPhase("terms")}
            disabled={!allWaiverChecked || isPending}
            className={btnPrimary}
            style={{ backgroundColor: primaryColor }}
          >
            <ScrollText className="h-4 w-4" /> Leggi T&C →
          </button>
        </div>
      </div>
    );
  }

  // ── Quote ─────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <StepBar current={1} primaryColor={primaryColor} />
      <div className="flex items-center gap-2 mb-4 mt-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: primaryColor + "20" }}>
          <Euro className="h-4 w-4" style={{ color: primaryColor }} />
        </div>
        <p className="font-semibold text-foreground">Preventivo ricevuto</p>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Abbiamo completato la diagnosi del tuo dispositivo. Ecco il costo stimato della riparazione:
      </p>
      <div className="rounded-xl px-5 py-4 text-center mb-5" style={{ backgroundColor: primaryColor + "12" }}>
        <p className="text-3xl font-bold" style={{ color: primaryColor }}>{formatted}</p>
        <p className="text-xs text-muted-foreground mt-1">Costo stimato riparazione (IVA inclusa)</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Cliccando &quot;Autorizza&quot; verranno richieste alcune dichiarazioni, la lettura dei termini e la tua firma digitale.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleReject} disabled={isPending} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
          <XCircle className="h-4 w-4" /> Non autorizzare
        </button>
        <button
          onClick={() => setPhase("waiver")}
          disabled={isPending}
          className={btnPrimary}
          style={{ backgroundColor: primaryColor }}
        >
          <CheckCircle2 className="h-4 w-4" /> Autorizza →
        </button>
      </div>
    </div>
  );
}
