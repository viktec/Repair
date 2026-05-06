"use client";

import { useActionState } from "react";
import { savePermissionsAction } from "./actions";
import { Loader2, Check } from "lucide-react";

export function PermissionsForm() {
  const [state, action, pending] = useActionState(savePermissionsAction, null);

  return (
    <div className="flex items-center justify-between border-t px-5 py-4 bg-slate-50/40">
      {state?.ok && (
        <span className="flex items-center gap-1.5 text-sm text-emerald-700">
          <Check className="h-4 w-4" /> Permessi salvati
        </span>
      )}
      {state?.error && (
        <span className="text-sm text-destructive">{state.error}</span>
      )}
      {!state && <span />}
      <form id="permissions-form" action={action}>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Salva modifiche
        </button>
      </form>
    </div>
  );
}
