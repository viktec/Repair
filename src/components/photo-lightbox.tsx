"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxPhoto = {
  url: string;
  label?: string;
};

type Props = {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function PhotoLightbox({ photos, index, onClose, onNavigate }: Props) {
  const current = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  const prev = useCallback(() => {
    if (hasPrev) onNavigate(index - 1);
  }, [hasPrev, index, onNavigate]);

  const next = useCallback(() => {
    if (hasNext) onNavigate(index + 1);
  }, [hasNext, index, onNavigate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Chiudi"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Label */}
      {current.label && (
        <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white">
          {current.label}
        </span>
      )}

      {/* Counter */}
      {photos.length > 1 && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
          {index + 1} / {photos.length}
        </span>
      )}

      {/* Prev */}
      {hasPrev && (
        <button
          className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Precedente"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Image — touch-action: pinch-zoom enables native mobile zoom */}
      <img
        src={current.url}
        alt={current.label ?? "Foto"}
        className="max-h-[90dvh] max-w-[90dvw] rounded-lg object-contain"
        style={{ touchAction: "pinch-zoom" }}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Next */}
      {hasNext && (
        <button
          className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Successiva"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
