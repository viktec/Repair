"use client";

import { useRef, useState, useEffect } from "react";
import { getUploadUrl, savePhoto } from "./photo-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenLine, RotateCcw, Check, Loader2 } from "lucide-react";

type Props = {
  ticketId: string;
  hasSavedSignature: boolean;
};

export function SignaturePad({ ticketId, hasSavedSignature }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [saved, setSaved] = useState(hasSavedSignature);
  const [saving, setSaving] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawing(true);
    setHasStrokes(true);
    lastPos.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing) return;
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
    setDrawing(false);
    lastPos.current = null;
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    setSaved(false);
  }

  async function saveSignature() {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    setSaving(true);

    try {
      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), "image/png"),
      );

      const { uploadUrl, key, isPublic } = await getUploadUrl(
        ticketId,
        "firma.png",
        "image/png",
        "signature",
        false,
      );

      await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/png" },
      });

      await savePhoto(ticketId, key, "signature", isPublic);
      setSaved(true);
    } catch {
      alert("Errore nel salvataggio della firma. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PenLine className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Firma cliente
          </CardTitle>
          {saved && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-3.5 w-3.5" />
              Firmato
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-white">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full touch-none"
            style={{ cursor: "crosshair" }}
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
              <p className="text-sm text-muted-foreground/50">
                Il cliente firma qui
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={clear}
            disabled={!hasStrokes || saving}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Cancella
          </Button>
          <Button
            size="sm"
            onClick={saveSignature}
            disabled={!hasStrokes || saving || saved}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <PenLine className="h-3.5 w-3.5" />
            )}
            {saved ? "Firma salvata" : "Salva firma"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Far firmare il cliente sul tablet/telefono per accettare il preventivo.
          La firma viene salvata allegata al ticket.
        </p>
      </CardContent>
    </Card>
  );
}
