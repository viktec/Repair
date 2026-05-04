"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { markZReportPrintedAction } from "../../../actions";

interface Props {
  sessionId: string;
  alreadyPrinted: boolean;
}

export function MarkZPrintedButton({ sessionId, alreadyPrinted }: Props) {
  const [done, setDone] = useState(alreadyPrinted);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        Report Z già segnato come stampato
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await markZReportPrintedAction(sessionId);
          setDone(true);
        });
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      Segna come stampato
    </Button>
  );
}
