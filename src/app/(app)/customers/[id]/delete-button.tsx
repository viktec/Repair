"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomerAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Eliminare questo cliente? I ticket associati rimarranno ma senza riferimento cliente.")) return;
    startTransition(async () => {
      await deleteCustomerAction(customerId);
      router.push("/customers");
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-destructive hover:bg-destructive hover:text-white border-destructive/30"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Elimina cliente
    </Button>
  );
}
