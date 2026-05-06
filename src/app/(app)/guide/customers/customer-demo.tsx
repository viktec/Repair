"use client";

import { useState } from "react";
import { CheckCircle2, Ticket, Phone, Mail } from "lucide-react";

export function CustomerDemo() {
  const [phase, setPhase] = useState<"form" | "created">("form");
  const [name, setName] = useState("Luca Bianchi");
  const [phone, setPhone] = useState("+39 333 4567890");
  const [email, setEmail] = useState("luca@example.com");
  const [gdpr, setGdpr] = useState(false);

  if (phase === "form") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nome e cognome *</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Telefono</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} className="h-4 w-4 accent-primary rounded" />
          <span className="text-xs text-muted-foreground">Consenso al trattamento dei dati (GDPR)</span>
        </label>
        <button
          onClick={() => setPhase("created")}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Salva cliente →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <p className="text-sm font-medium text-emerald-800">Cliente salvato con successo!</p>
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
            {name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{name}</p>
            {gdpr && <p className="text-[10px] text-emerald-600 font-medium">✓ Consenso GDPR registrato</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" /> <span>{phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> <span className="truncate">{email}</span>
          </div>
        </div>
        <div className="pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
          <Ticket className="h-3.5 w-3.5" /> 0 ticket — cliente appena aggiunto
        </div>
      </div>
      <button onClick={() => setPhase("form")} className="text-xs text-primary hover:underline">← Ricomincia demo</button>
    </div>
  );
}
