"use client";

import { useRef, useState, useTransition } from "react";
import { getRegistryPhotoUploadUrl, saveRegistryPhoto, deleteRegistryPhoto } from "./photo-actions";
import { toJpeg } from "@/lib/image-convert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoLightbox, type LightboxPhoto } from "@/components/photo-lightbox";
import { Camera, Trash2, Loader2, ImagePlus, ZoomIn } from "lucide-react";

const MAX_PHOTOS = 10;

type Photo = { key: string; url: string };

export function RegistryPhotoUpload({
  entryId,
  initialPhotos,
}: {
  entryId: string;
  initialPhotos: Photo[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const rawFile of Array.from(files)) {
      if (photos.length >= MAX_PHOTOS) break;
      try {
        const file = await toJpeg(rawFile);
        const { uploadUrl, key } = await getRegistryPhotoUploadUrl(entryId, "image/jpeg");

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": "image/jpeg" },
        });

        await saveRegistryPhoto(entryId, key);

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
      await deleteRegistryPhoto(entryId, key);
      setPhotos((prev) => prev.filter((p) => p.key !== key));
    });
  }

  const lbPhotos: LightboxPhoto[] = photos.map((p) => ({ url: p.url, label: "Foto" }));

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Foto ({photos.length}/{MAX_PHOTOS})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div
                key={p.key}
                className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 cursor-pointer"
                onClick={() => setLightboxIndex(i)}
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
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20"
                    aria-label="Ingrandisci"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                <span className="text-[9px]">Aggiungi</span>
              </button>
            )}
          </div>

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

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={lbPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(i) => setLightboxIndex(i)}
        />
      )}
    </>
  );
}
