"use client";

import { useState, useTransition } from "react";
import { createTagAction, deleteTagAction } from "@/app/(app)/tickets/tag-actions";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#6b7280", // gray
];

type TagItem = { id: string; name: string; color: string };

export function TagsManager({ initialTags }: { initialTags: TagItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Il nome è obbligatorio.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createTagAction(trimmed, color);
      if (res.error) {
        setError(res.error);
      } else if (res.tag) {
        setTags((prev) => [...prev, res.tag!]);
        setName("");
        setColor(PRESET_COLORS[0]);
      }
    });
  }

  function handleDelete(tagId: string) {
    startTransition(async () => {
      const res = await deleteTagAction(tagId);
      if (!res.error) {
        setTags((prev) => prev.filter((t) => t.id !== tagId));
      }
    });
  }

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      {/* Lista etichette esistenti */}
      <div className="space-y-2">
        {tags.length === 0 ? (
          <p className="text-sm italic text-muted-foreground py-4 text-center">
            Nessuna etichetta creata.
          </p>
        ) : (
          tags.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: t.color }}
                />
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium"
                  style={{ backgroundColor: t.color + "20", color: t.color, border: `1px solid ${t.color}40` }}
                >
                  {t.name}
                </span>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                disabled={isPending}
                className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-destructive disabled:opacity-40 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Form crea nuova etichetta */}
      <div className="rounded-lg border bg-white p-4 space-y-4">
        <p className="text-sm font-semibold">Nuova etichetta</p>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Urgente, In garanzia, VIP…"
            maxLength={50}
            className={inputCls}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Colore</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? c : "transparent",
                  outline: color === c ? `2px solid ${c}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>

          {/* Anteprima */}
          {name.trim() && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Anteprima:</p>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium"
                style={{ backgroundColor: color + "20", color, border: `1px solid ${color}40` }}
              >
                {name.trim()}
              </span>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button
          onClick={handleCreate}
          disabled={isPending || !name.trim()}
          className="gap-1.5"
          size="sm"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Crea etichetta
        </Button>
      </div>
    </div>
  );
}
