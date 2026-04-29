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

export function PublicPhotoGallery({ photos }: Props) {
  const [lightbox, setLightbox] = useState<{ index: number } | null>(null);

  if (photos.length === 0) return null;

  const lbPhotos: LightboxPhoto[] = photos.map((p) => ({
    url: p.url,
    label: p.photoType === "pre" ? "Prima" : "Dopo",
  }));

  function open(id: string) {
    const idx = photos.findIndex((p) => p.id === id);
    setLightbox({ index: idx >= 0 ? idx : 0 });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-foreground">Foto</p>
      <div className="grid grid-cols-2 gap-2">
        {photos.map((p) => (
          <button
            key={p.id}
            className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
            onClick={() => open(p.id)}
            aria-label={`Apri foto ${p.photoType === "pre" ? "Prima" : "Dopo"}`}
          >
            <img
              src={p.url}
              alt="Foto riparazione"
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-1.5 right-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
              {p.photoType === "pre" ? "Prima" : "Dopo"}
            </span>
          </button>
        ))}
      </div>

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
