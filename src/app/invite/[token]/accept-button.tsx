"use client";

import { useTransition } from "react";
import { acceptInviteAction } from "./accept-actions";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";

export function AcceptButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className="w-full gap-2"
      disabled={isPending}
      onClick={() => startTransition(async () => { await acceptInviteAction(token); })}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      Accetta invito
    </Button>
  );
}
