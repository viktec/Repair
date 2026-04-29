"use client";

import { useState, useTransition } from "react";
import { approveOrgAction, rejectOrgAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";

type RegistrationStatus = "pending" | "approved" | "rejected";

export function OrgApprovalCard({
  orgId,
  registrationStatus,
  rejectionReason,
  ownerEmail,
}: {
  orgId: string;
  registrationStatus: RegistrationStatus;
  rejectionReason: string;
  ownerEmail: string;
}) {
  const [reason, setReason] = useState(rejectionReason);
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  function handleApprove() {
    setAction("approve");
    startTransition(async () => {
      await approveOrgAction(orgId);
      setAction(null);
    });
  }

  function handleReject() {
    setAction("reject");
    startTransition(async () => {
      await rejectOrgAction(orgId, reason);
      setAction(null);
    });
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Accesso all&apos;applicazione</CardTitle>
        </div>
        {ownerEmail && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Titolare: <span className="font-mono">{ownerEmail}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {registrationStatus === "approved" && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Accesso approvato — l&apos;utente può accedere all&apos;app.
          </div>
        )}
        {registrationStatus === "rejected" && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <XCircle className="h-4 w-4 shrink-0" />
            Accesso rifiutato — l&apos;utente vede la pagina di rifiuto.
          </div>
        )}
        {registrationStatus === "pending" && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            <Loader2 className="h-4 w-4 shrink-0" />
            In attesa — l&apos;utente non può ancora accedere all&apos;app.
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Motivazione rifiuto (opzionale)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo del rifiuto, inviato via email all'utente..."
            rows={2}
            className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleApprove}
            disabled={isPending || registrationStatus === "approved"}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            size="sm"
          >
            {isPending && action === "approve" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Approva
          </Button>
          <Button
            onClick={handleReject}
            disabled={isPending || registrationStatus === "rejected"}
            variant="outline"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            size="sm"
          >
            {isPending && action === "reject" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            Rifiuta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
