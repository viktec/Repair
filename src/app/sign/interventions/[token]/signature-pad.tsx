"use client";

import { useRef, useState, useEffect } from "react";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";

type Props = {
  token: string;
  interventionNumber: string;
  title: string;
  primaryColor: string;
};

export function SignaturePad({ token, interventionNumber, title, primaryColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
    setIsEmpty(false);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function onPointerUp() {
    setDrawing(false);
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  }

  async function handleSign() {
    if (isEmpty) { setError("Firma il verbale prima di confermare."); return; }
    setError("");
    setIsPending(true);
    const canvas = canvasRef.current!;
    const signatureData = canvas.toDataURL("image/png");

    const res = await fetch("/api/support/sign-intervention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, signatureData }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Errore durante il salvataggio. Riprova.");
      setIsPending(false);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: primaryColor + "20" }}>
          <CheckCircle2 className="h-8 w-8" style={{ color: primaryColor }} />
        </div>
        <h2 className="text-xl font-bold">Firma acquisita!</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          La firma è stata salvata sul verbale. Puoi chiudere questa pagina.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
        <p className="font-semibold text-slate-700">{interventionNumber} — {title}</p>
        <p className="mt-1 text-xs text-slate-500">
          Firmando confermi che l&apos;intervento è stato eseguito come descritto e autorizza la detrazione delle ore dal tuo contratto di assistenza.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Firma qui sotto</p>
          <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <RotateCcw className="h-3 w-3" /> Cancella
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={640}
          height={200}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-white touch-none cursor-crosshair"
          style={{ height: 160 }}
        />
        {isEmpty && <p className="text-xs text-slate-400 text-center">Usa il dito o il mouse per firmare</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSign}
        disabled={isPending || isEmpty}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Firma e conferma intervento
      </button>
    </div>
  );
}
