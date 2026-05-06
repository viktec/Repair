"use client";

import { useActionState, useEffect, useRef } from "react";
import { inviteMemberAction, cancelInviteAction, type InviteState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X, Send, Clock } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

const INVITABLE_ROLES = (["admin", "technician", "front_desk"] as Role[]).map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
};

export function InviteForm({ pendingInvites }: { pendingInvites: PendingInvite[] }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(inviteMemberAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-5">
      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Inviti in attesa
          </p>
          {pendingInvites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-amber-50 border-amber-200 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{inv.email}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {ROLE_LABELS[inv.role as Role] ?? inv.role} · scade{" "}
                  {new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(
                    new Date(inv.expiresAt),
                  )}
                </p>
              </div>
              <form action={cancelInviteAction.bind(null, inv.id)}>
                <button
                  type="submit"
                  className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                  title="Annulla invito"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      <form ref={formRef} action={action} className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Invita un nuovo membro
        </p>

        {state?.error && (
          <p className="text-xs text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-xs text-emerald-700 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
            Invito inviato via email.
          </p>
        )}

        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-48 space-y-1">
            <Label htmlFor="invite-email" className="text-xs">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="collega@email.com"
              required
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="invite-role" className="text-xs">Ruolo</Label>
            <select
              id="invite-role"
              name="role"
              defaultValue="technician"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" size="sm" disabled={pending} className="gap-1.5 h-9">
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Invia invito
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
