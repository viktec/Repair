"use client";

import { useState, useTransition } from "react";
import { addTagToTicketAction, removeTagFromTicketAction } from "../tag-actions";
import { Tag, Plus, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TagItem = { id: string; name: string; color: string };

type Props = {
  ticketId: string;
  initialTicketTags: TagItem[];
  allOrgTags: TagItem[];
};

export function TicketTagsSection({ ticketId, initialTicketTags, allOrgTags }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showPicker, setShowPicker] = useState(false);
  const [ticketTagIds, setTicketTagIds] = useState<Set<string>>(
    new Set(initialTicketTags.map((t) => t.id)),
  );
  const [currentTags, setCurrentTags] = useState<TagItem[]>(initialTicketTags);

  const availableTags = allOrgTags.filter((t) => !ticketTagIds.has(t.id));

  function handleAdd(tag: TagItem) {
    setShowPicker(false);
    startTransition(async () => {
      const res = await addTagToTicketAction(ticketId, tag.id);
      if (!res.error) {
        setCurrentTags((prev) => [...prev, tag]);
        setTicketTagIds((prev) => new Set([...prev, tag.id]));
      }
    });
  }

  function handleRemove(tag: TagItem) {
    startTransition(async () => {
      const res = await removeTagFromTicketAction(ticketId, tag.id);
      if (!res.error) {
        setCurrentTags((prev) => prev.filter((t) => t.id !== tag.id));
        setTicketTagIds((prev) => {
          const next = new Set(prev);
          next.delete(tag.id);
          return next;
        });
      }
    });
  }

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Etichette</span>
        </div>
        {availableTags.length > 0 && !showPicker && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowPicker(true)}
            disabled={isPending}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Tag attivi */}
      <div className="flex flex-wrap gap-1.5">
        {currentTags.length === 0 && !showPicker && (
          <p className="text-xs italic text-muted-foreground">Nessuna etichetta assegnata.</p>
        )}
        {currentTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}40` }}
          >
            {tag.name}
            <button
              onClick={() => handleRemove(tag)}
              disabled={isPending}
              className="rounded-full hover:opacity-70 disabled:opacity-40"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Picker per aggiungere tag */}
      {showPicker && (
        <div className="rounded-md border bg-slate-50 p-2 space-y-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Aggiungi etichetta</p>
            <button
              onClick={() => setShowPicker(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {availableTags.length === 0 ? (
            <p className="text-xs italic text-muted-foreground px-1">Tutte le etichette sono già assegnate.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAdd(tag)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ backgroundColor: tag.color + "20", color: tag.color, border: `1px solid ${tag.color}40` }}
                >
                  <Plus className="h-3 w-3" />
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {allOrgTags.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Nessuna etichetta creata.{" "}
          <a href="/settings/tags" className="underline hover:text-foreground">
            Crea etichette in Impostazioni
          </a>
          .
        </p>
      )}
    </div>
  );
}
