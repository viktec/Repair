"use client";

import { useTransition } from "react";
import { deleteCustomModelAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

type Model = { id: string; brand: string; model: string };

export function CustomModelsTable({ models }: { models: Model[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Eliminare questo modello dalla lista personalizzata?")) return;
    startTransition(async () => {
      await deleteCustomModelAction(id);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Modelli personalizzati</CardTitle>
        <p className="text-sm text-muted-foreground">
          Modelli aggiunti automaticamente quando hai inserito dispositivi non presenti nel database standard.
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2">Marca</th>
                <th className="px-4 py-2">Modello</th>
                <th className="px-4 py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-4 py-2 text-muted-foreground">{m.brand}</td>
                  <td className="px-4 py-2 font-medium">{m.model}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={isPending}
                      className="rounded p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
