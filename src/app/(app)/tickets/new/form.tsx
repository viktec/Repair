"use client";

import { useActionState, useState, useTransition, useRef, useEffect } from "react";
import { createTicketAction } from "../actions";
import { createCustomerInlineAction } from "../../customers/actions";
import { savePhoto, getUploadUrl } from "../[id]/photo-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus, Check, X, PenLine, RotateCcw, ArrowRight, SkipForward } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEVICE_BRANDS, DEVICE_MODELS } from "@/lib/devices";

type Customer = { id: string; name: string; phone: string | null };
type Store = { id: string; name: string };
type TeamMember = { id: string; name: string | null };
type Props = {
  customers: Customer[];
  statuses: { id: string; name: string }[];
  stores: Store[];
  teamMembers: TeamMember[];
  faultSuggestions: string[];
};

// ─── Step 2: Firma ──────────────────────────────────────────────────────────

function SignatureStep({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setDrawing(true);
    setHasStrokes(true);
    lastPos.current = getPos(e);
  }
  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e);
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
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    setHasStrokes(false);
  }

  function handleSkip() { router.push(`/tickets/${ticketId}`); }

  function handleSave() {
    startSaving(async () => {
      const canvas = canvasRef.current!;
      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
      const { uploadUrl, key, isPublic } = await getUploadUrl(ticketId, "firma.png", "image/png", "signature", false);
      await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/png" } });
      await savePhoto(ticketId, key, "signature", isPublic);
      router.push(`/tickets/${ticketId}`);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 overflow-hidden">
      <div>
        <h1 className="text-xl font-bold text-foreground">Firma del cliente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fai firmare il cliente per accettare il preventivo e l'accettazione del dispositivo in riparazione.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed border rounded-lg p-3 bg-slate-50">
            Il sottoscritto dichiara di aver consegnato il dispositivo sopra descritto e di aver preso visione
            delle condizioni di riparazione. Autorizza il centro a eseguire la diagnosi e, se accettato,
            l'intervento indicato. I dati personali sono trattati ai sensi del Reg. UE 2016/679 (GDPR)
            esclusivamente per la gestione del servizio.
          </p>

          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white">
            <canvas
              ref={canvasRef}
              width={700}
              height={220}
              className="w-full touch-none"
              style={{ cursor: "crosshair" }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
            />
            {!hasStrokes && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
                <PenLine className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground/40">Il cliente firma qui con il dito o lo stilo</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" size="sm" onClick={clear} disabled={!hasStrokes} className="gap-1.5 w-full sm:w-auto">
              <RotateCcw className="h-3.5 w-3.5" /> Cancella firma
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleSkip} className="gap-2 flex-1 sm:flex-none">
                <SkipForward className="h-4 w-4" /> Salta
              </Button>
              <Button onClick={handleSave} disabled={!hasStrokes || isSaving} className="gap-2 flex-1 sm:flex-none">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Salva firma
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Step 1: Form ticket ─────────────────────────────────────────────────────

export function NewTicketForm({ customers: initialCustomers, stores, teamMembers, faultSuggestions }: Props) {
  const [state, action, pending] = useActionState(createTicketAction, null);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [faultValue, setFaultValue] = useState("");

  // Customer
  const [customerList, setCustomerList] = useState<Customer[]>(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGdpr, setNewGdpr] = useState(false);
  const [savingCustomer, startSavingCustomer] = useTransition();
  const [customerError, setCustomerError] = useState("");

  const modelSuggestions = selectedBrand && DEVICE_MODELS[selectedBrand]
    ? DEVICE_MODELS[selectedBrand]
    : Object.values(DEVICE_MODELS).flat();

  // Se l'action ha creato il ticket → mostra step firma
  if (state && "ticketId" in state) {
    return <SignatureStep ticketId={state.ticketId} />;
  }

  function handleCustomerSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === "__new__") { setShowNewCustomer(true); setSelectedCustomerId(""); }
    else { setSelectedCustomerId(val); setShowNewCustomer(false); }
  }

  function handleCancelNewCustomer() {
    setShowNewCustomer(false); setSelectedCustomerId("");
    setNewName(""); setNewPhone(""); setNewEmail(""); setNewGdpr(false); setCustomerError("");
  }

  function handleSaveCustomer() {
    setCustomerError("");
    startSavingCustomer(async () => {
      const result = await createCustomerInlineAction({ name: newName, phone: newPhone, email: newEmail, gdprConsent: newGdpr });
      if ("error" in result) { setCustomerError(result.error); return; }
      setCustomerList((prev) => [...prev, result]);
      setSelectedCustomerId(result.id);
      setShowNewCustomer(false);
      setNewName(""); setNewPhone(""); setNewEmail(""); setNewGdpr(false);
    });
  }

  const selectedCustomer = customerList.find((c) => c.id === selectedCustomerId);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="customerId" value={selectedCustomerId} />

      {/* Cliente */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cliente <span className="text-destructive">*</span></CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {state && "errors" in state && state.errors?.customerId && (
            <p className="text-xs text-destructive">{(state.errors.customerId as string[])[0]}</p>
          )}
          {selectedCustomer && !showNewCustomer ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-emerald-800">{selectedCustomer.name}</p>
                {selectedCustomer.phone && <p className="text-xs text-emerald-600">{selectedCustomer.phone}</p>}
              </div>
              <button type="button" onClick={() => setSelectedCustomerId("")} className="ml-2 rounded-full p-1 text-emerald-600 hover:bg-emerald-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : !showNewCustomer ? (
            <div className="space-y-1.5">
              <Label htmlFor="customerSelect">Cerca cliente</Label>
              <select id="customerSelect" onChange={handleCustomerSelect} value=""
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— Seleziona cliente —</option>
                <option value="__new__">✚ Nuovo cliente…</option>
                {customerList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>
                ))}
              </select>
            </div>
          ) : null}

          {showNewCustomer && (
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <UserPlus className="h-4 w-4" /> Nuovo cliente
                </div>
                <button type="button" onClick={handleCancelNewCustomer} className="rounded-full p-1 text-muted-foreground hover:bg-black/5">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newName">Nome e cognome <span className="text-destructive">*</span></Label>
                <Input id="newName" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Mario Rossi" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newPhone">Telefono</Label>
                  <Input id="newPhone" type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+39 333 000 0000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newEmail">Email</Label>
                  <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="mario@esempio.it" />
                </div>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="newGdpr" checked={newGdpr} onChange={(e) => setNewGdpr(e.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer accent-primary" />
                <Label htmlFor="newGdpr" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
                  Il cliente dichiara di aver preso visione dell'informativa privacy (GDPR art. 13) e presta consenso al trattamento dei dati per l'esecuzione del servizio
                </Label>
              </div>
              {customerError && <p className="text-xs text-destructive">{customerError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCancelNewCustomer}>Annulla</Button>
                <Button type="button" size="sm" disabled={savingCustomer || !newName.trim()} onClick={handleSaveCustomer} className="gap-1.5">
                  {savingCustomer ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Salva e seleziona
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispositivo */}
      <Card>
        <CardHeader><CardTitle className="text-base">Dispositivo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <datalist id="brand-list">{DEVICE_BRANDS.map((b) => <option key={b} value={b} />)}</datalist>
          <datalist id="model-list">{modelSuggestions.map((m) => <option key={m} value={m} />)}</datalist>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deviceBrand">Marca</Label>
              <Input id="deviceBrand" name="deviceBrand" placeholder="Apple, Samsung…" list="brand-list" autoComplete="off" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deviceModel">Modello</Label>
              <Input id="deviceModel" name="deviceModel" placeholder="iPhone 15, Galaxy S24…" list="model-list" autoComplete="off" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deviceImei">IMEI</Label>
              <Input id="deviceImei" name="deviceImei" placeholder="15 cifre" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deviceSerial">Numero di serie</Label>
              <Input id="deviceSerial" name="deviceSerial" placeholder="S/N" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="devicePatternLock">PIN / Pattern sblocco</Label>
              <Input id="devicePatternLock" name="devicePatternLock" placeholder="Solo se fornito dal cliente" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accessories">Accessori consegnati</Label>
              <Input id="accessories" name="accessories" placeholder="Cover, caricatore…" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="deviceCondition">Condizioni estetiche</Label>
            <Input id="deviceCondition" name="deviceCondition" placeholder="Graffi, crepe, ammaccature…" />
          </div>
        </CardContent>
      </Card>

      {/* Guasto */}
      <Card>
        <CardHeader><CardTitle className="text-base">Intervento</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="faultDescription">Descrizione guasto <span className="text-destructive">*</span></Label>
            <textarea id="faultDescription" name="faultDescription" rows={3} required
              value={faultValue} onChange={(e) => setFaultValue(e.target.value)}
              placeholder="Schermo rotto, non si accende, batteria scarica…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            {faultSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {faultSuggestions.map((s) => (
                  <button
                    key={s} type="button"
                    onClick={() => setFaultValue(s)}
                    className="rounded-full border border-input bg-white px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {state?.errors?.faultDescription && <p className="text-xs text-destructive">{state.errors.faultDescription[0]}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="estimatedCost">Preventivo (€)</Label>
              <Input id="estimatedCost" name="estimatedCost" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
            {teamMembers.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="assignedUserId">Tecnico assegnato</Label>
                <select
                  id="assignedUserId"
                  name="assignedUserId"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Nessuno —</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name ?? m.id}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sede (solo piano Business con almeno una sede) */}
      {stores.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Sede</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="storeId">Punto vendita</Label>
              <select
                id="storeId"
                name="storeId"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Nessuna sede —</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/tickets"><Button type="button" variant="outline">Annulla</Button></Link>
        <Button type="submit" disabled={pending} className="gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Avanti — Firma cliente
        </Button>
      </div>
    </form>
  );
}
