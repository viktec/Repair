"use client";

import { useRef, useState, useTransition } from "react";
import { getInterventionUploadUrl, saveInterventionPhoto, deleteInterventionPhoto } from "./photo-actions";
import { toJpeg } from "@/lib/image-convert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoLightbox, type LightboxPhoto } from "@/components/photo-lightbox";
import { Camera, Trash2, Loader2, ImagePlus, ZoomIn } from "lucide-react";

type Photo = {
  key: string;
  url: string;
};

type Props = {
  interventionId: string;
  initialPhotos: Photo[];
};

type LightboxState = {
  photos: LightboxPhoto[];
  index: number;
} | null;

export function InterventionPhotoUpload({ interventionId, initialPhotos }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [lightbox, setLightbox] = useState<LightboxState>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const rawFile of Array.from(files)) {
      try {
        const file = await toJpeg(rawFile);
        const { uploadUrl, key } = await getInterventionUploadUrl(
          interventionId,
          file.name,
          "image/jpeg",
        );

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": "image/jpeg" },
        });

        await saveInterventionPhoto(interventionId, key);

        const localUrl = URL.createObjectURL(file);
        setPhotos((prev) => [...prev, { key, url: localUrl }]);
      } catch {
        alert("Errore durante il caricamento. Riprova.");
      }
    }

    setUploading(false);
  }

  function handleDelete(key: string) {
    startTransition(async () => {
      await deleteInterventionPhoto(interventionId, key);
      setPhotos((prev) => prev.filter((p) => p.key !== key));
    });
  }

  function openLightbox(clickedKey: string) {
    const lbPhotos: LightboxPhoto[] = photos.map((p) => ({ url: p.url }));
    const idx = photos.findIndex((p) => p.key === clickedKey);
    setLightbox({ photos: lbPhotos, index: idx >= 0 ? idx : 0 });
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Foto intervento</CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              Aggiungi foto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-8 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
              <span className="text-sm">Carica le foto dell&apos;intervento</span>
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => (
                <div
                  key={p.key}
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 cursor-pointer"
                  onClick={() => openLightbox(p.key)}
                >
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-start justify-between bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 p-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.key); }}
                      disabled={isPending}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 disabled:opacity-50"
                      aria-label="Elimina foto"
                    >
                      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openLightbox(p.key); }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20"
                      aria-label="Ingrandisci"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </CardContent>
      </Card>

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(i) => setLightbox((prev) => prev ? { ...prev, index: i } : null)}
        />
      )}
    </>
  );
}
