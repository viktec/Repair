"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, X, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parseInvoiceAction, confirmImportAction } from "./actions";
import type { ParsedItem, ConfirmedItem } from "./actions";

type EditableItem = ParsedItem & { excluded: boolean };

type Phase = "upload" | "review" | "done";

const CATEGORIES = ["Display", "Batterie", "Ricambi", "Accessori", "Utensili", "Altro"];

function confidenceBadge(confidence: number) {
  const pct = Math.round(confidence * 100);
  if (confidence >= 0.85)
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">{pct}%</Badge>;
  if (confidence >= 0.65)
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">{pct}%</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">{pct}%</Badge>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  const [supplierCreated, setSupplierCreated] = useState(false);
  const [isParsing, startParse] = useTransition();
  const [isConfirming, startConfirm] = useTransition();

  function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setParseError("Il file deve essere un PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError("Il file supera il limite di 10 MB.");
      return;
    }
    setParseError(null);
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfFile(file);
    setPdfBlobUrl(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleAnalyze() {
    if (!pdfFile) return;
    startParse(async () => {
      const formData = new FormData();
      formData.append("file", pdfFile);
      const result = await parseInvoiceAction(formData);
      if (!result.ok) {
        setParseError(result.error);
        return;
      }
      setItems(result.items.map((item) => ({ ...item, excluded: false })));
      setSupplierName(result.supplierName);
      setPhase("review");
    });
  }

  function updateItem(index: number, patch: Partial<EditableItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleConfirm() {
    const selected = items.filter((i) => !i.excluded);
    if (selected.length === 0) return;
    startConfirm(async () => {
      const confirmed: ConfirmedItem[] = selected.map(({ excluded: _excluded, confidence: _confidence, matched_item_name: _matchedName, ...rest }) => rest);
      const result = await confirmImportAction(confirmed, supplierName);
      if (!result.ok) {
        setParseError("Errore durante il salvataggio. Riprova.");
        return;
      }
      setDoneCount(result.count);
      setSupplierCreated(result.supplierId !== null && supplierName !== null);
      setPhase("done");
    });
  }

  function resetUpload() {
    setPdfFile(null);
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setParseError(null);
    setItems([]);
    setSupplierName(null);
    setPhase("upload");
  }

  const selectedCount = items.filter((i) => !i.excluded).length;

  if (phase === "done") {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-emerald-800">Magazzino aggiornato!</h2>
        <p className="text-sm text-emerald-700">{doneCount} ricambi caricati con successo.</p>
        {supplierCreated && supplierName && (
          <p className="text-xs text-emerald-600">Fornitore &quot;{supplierName}&quot; creato.</p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={resetUpload}>
            Importa un&apos;altra fattura
          </Button>
          <Button asChild>
            <a href="/inventory">Vai al magazzino</a>
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={resetUpload}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Carica un altro file
          </Button>
          <span className="text-base font-semibold">{items.length} prodotti trovati</span>
          {supplierName && (
            <Badge variant="secondary">Fornitore: {supplierName}</Badge>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-3">
            {pdfBlobUrl && (
              <object data={pdfBlobUrl} type="application/pdf" className="w-full h-[600px] rounded-lg" />
            )}
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className={`rounded-lg border bg-white p-3 space-y-2.5 transition-opacity ${item.excluded ? "opacity-40" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {confidenceBadge(item.confidence)}
                    {item.matched_item_name && (
                      <Badge variant="secondary" className="text-xs">
                        Aggiorna: {item.matched_item_name}
                      </Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateItem(index, { excluded: !item.excluded })}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title={item.excluded ? "Includi" : "Escludi"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Input
                    value={item.name_it}
                    onChange={(e) => updateItem(index, { name_it: e.target.value })}
                    placeholder="Nome prodotto"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Categoria
                    </label>
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(index, { category: e.target.value })}
                      className="w-full rounded-md border border-input bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Quantità
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(index, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Prezzo netto (€)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={(item.unit_cost_cents / 100).toFixed(2)}
                      onChange={(e) =>
                        updateItem(index, {
                          unit_cost_cents: Math.round(parseFloat(e.target.value || "0") * 100),
                        })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="sticky bottom-0 rounded-xl border bg-white p-4 shadow-sm space-y-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{selectedCount}</span> di {items.length} selezionati
              </p>
              {parseError && (
                <p className="text-xs text-destructive">{parseError}</p>
              )}
              <Button
                className="w-full gap-2"
                disabled={selectedCount === 0 || isConfirming}
                onClick={handleConfirm}
              >
                {isConfirming && <Loader2 className="h-4 w-4 animate-spin" />}
                Conferma e carica in magazzino
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <FileText className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium">Trascina il PDF della fattura qui</p>
        <p className="text-xs text-muted-foreground">oppure clicca per selezionare · Max 10 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {pdfFile && pdfBlobUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{pdfFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(pdfFile.size)}</p>
            </div>
          </div>

          <object
            data={pdfBlobUrl}
            type="application/pdf"
            className="w-full h-96 rounded-lg border"
          />

          {parseError && (
            <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{parseError}</p>
          )}

          <Button
            className="w-full gap-2"
            disabled={isParsing}
            onClick={handleAnalyze}
          >
            {isParsing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Claude sta leggendo la fattura…
              </>
            ) : (
              "Analizza con AI"
            )}
          </Button>
        </div>
      )}

      {!pdfFile && parseError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{parseError}</p>
      )}
    </div>
  );
}
