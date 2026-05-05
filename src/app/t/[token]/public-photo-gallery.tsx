"use client";

import { useState } from "react";
import { PhotoLightbox, type LightboxPhoto } from "@/components/photo-lightbox";

type PublicPhoto = {
  id: string;
  url: string;
  photoType: string;
};

type Props = {
  photos: PublicPhoto[];
};

const TYPE_ORDER = ["pre", "during", "post"] as const;
const TYPE_LABELS: Record<string, string> = {
  pre: "Prima",
  during: "Durante",
  post: "Dopo",
};

export function PublicPhotoGallery({ photos }: Props) {
  const [lightbox, setLightbox] = useState<{ index: number } | null>(null);

  if (photos.length === 0) return null;

  // Build the flat list in canonical order for lightbox navigation
  const ordered = TYPE_ORDER.flatMap((t) => photos.filter((p) => p.photoType === t));
  // Include any unexpected types at the end
  const extra = photos.filter((p) => !TYPE_ORDER.includes(p.photoType as typeof TYPE_ORDER[number]));
  const allOrdered = [...ordered, ...extra];

  const lbPhotos: LightboxPhoto[] = allOrdered.map((p) => ({
    url: p.url,
    label: TYPE_LABELS[p.photoType] ?? p.photoType,
  }));

  function open(id: string) {
    const idx = allOrdered.findIndex((p) => p.id === id);
    setLightbox({ index: idx >= 0 ? idx : 0 });
  }

  const groups = TYPE_ORDER.map((t) => ({
    type: t,
    label: TYPE_LABELS[t],
    items: photos.filter((p) => p.photoType === t),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
      <p className="text-sm font-semibold text-foreground">Foto</p>

      {groups.map((group) => (
        <div key={group.type}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((p) => (
              <button
                key={p.id}
                className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                onClick={() => open(p.id)}
                aria-label={`Apri foto ${group.label}`}
              >
                <img
                  src={p.url}
                  alt={`Foto ${group.label}`}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                  {group.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {lightbox && (
        <PhotoLightbox
          photos={lbPhotos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(i) => setLightbox({ index: i })}
        />
      )}
    </div>
  );
}
