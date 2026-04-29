"use client";

import { useState, useTransition } from "react";
import { updateMemberRoleAction, removeMemberAction } from "./actions";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLES: Role[] = ["owner", "admin", "technician", "front_desk"];

export function TeamMemberRow({
  userId,
  name,
  email,
  role,
  isSelf,
}: {
  userId: string;
  name: string | null;
  email: string;
  role: Role;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  function handleRoleChange(newRole: Role) {
    setError(null);
    startTransition(async () => {
      try {
        await updateMemberRoleAction(userId, newRole);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore");
      }
    });
  }

  function handleRemove() {
    if (!confirm(`Rimuovere ${name ?? email} dal team?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await removeMemberAction(userId);
        setRemoved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore");
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {(name ?? email)[0].toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        {name && <p className="text-sm font-medium truncate">{name}</p>}
        <p className="text-xs text-muted-foreground truncate">{email}</p>
        {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      </div>
      {isSelf ? (
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {ROLE_LABELS[role]} (tu)
        </span>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            disabled={pending}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleRemove}
            disabled={pending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
