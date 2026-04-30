"use client";

import { useRef, useState, useTransition } from "react";
import { getUploadUrl, savePhoto, deletePhoto } from "./photo-actions";
import { toJpeg } from "@/lib/image-convert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoLightbox, type LightboxPhoto } from "@/components/photo-lightbox";
import { Camera, Trash2, Loader2, ImagePlus, ZoomIn } from "lucide-react";

type Photo = {
  id: string;
  storageKey: string;
  photoType: string;
  isPublic: boolean;
  url: string;
};

type Props = {
  ticketId: string;
  initialPhotos: Photo[];
};

type LightboxState = {
  photos: LightboxPhoto[];
  index: number;
} | null;

export function PhotoUpload({ ticketId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [lightbox, setLightbox] = useState<LightboxState>(null);

  async function handleFiles(files: FileList | null, photoType: "pre" | "during" | "post") {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const rawFile of Array.from(files)) {
      try {
        const file = await toJpeg(rawFile);
        const { uploadUrl, key, isPublic } = await getUploadUrl(
          ticketId,
          file.name,
          "image/jpeg",
          photoType,
          true,
        );

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": "image/jpeg" },
        });

        await savePhoto(ticketId, key, photoType, isPublic);

        const localUrl = URL.createObjectURL(file);
        setPhotos((prev) => [
          ...prev,
          { id: crypto.randomUUID(), storageKey: key, photoType, isPublic, url: localUrl },
        ]);
      } catch {
        alert("Errore durante il caricamento. Riprova.");
      }
    }

    setUploading(false);
  }

  function handleDelete(photoId: string) {
    startTransition(async () => {
      await deletePhoto(ticketId, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    });
  }

  function openLightbox(sectionPhotos: Photo[], clickedId: string) {
    const labels: Record<string, string> = { pre: "Prima", during: "Durante", post: "Dopo" };
    const lbPhotos: LightboxPhoto[] = sectionPhotos.map((p) => ({
      url: p.url,
      label: labels[p.photoType] ?? p.photoType,
    }));
    const idx = sectionPhotos.findIndex((p) => p.id === clickedId);
    setLightbox({ photos: lbPhotos, index: idx >= 0 ? idx : 0 });
  }

  const prePhotos = photos.filter((p) => p.photoType === "pre");
  const duringPhotos = photos.filter((p) => p.photoType === "during");
  const postPhotos = photos.filter((p) => p.photoType === "post");

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Foto intervento
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <PhotoSection
              label="Prima"
              photos={prePhotos}
              onAdd={(files) => handleFiles(files, "pre")}
              onDelete={handleDelete}
              onView={(id) => openLightbox(prePhotos, id)}
              uploading={uploading}
              deleting={isPending}
            />
            <PhotoSection
              label="Durante"
              photos={duringPhotos}
              onAdd={(files) => handleFiles(files, "during")}
              onDelete={handleDelete}
              onView={(id) => openLightbox(duringPhotos, id)}
              uploading={uploading}
              deleting={isPending}
            />
            <PhotoSection
              label="Dopo"
              photos={postPhotos}
              onAdd={(files) => handleFiles(files, "post")}
              onDelete={handleDelete}
              onView={(id) => openLightbox(postPhotos, id)}
              uploading={uploading}
              deleting={isPending}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Le foto sono visibili al cliente nella pagina di tracking.
            Puoi scattare direttamente dalla fotocamera del dispositivo.
          </p>
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

function PhotoSection({
  label,
  photos,
  onAdd,
  onDelete,
  onView,
  uploading,
  deleting,
}: {
  label: string;
  photos: Photo[];
  onAdd: (files: FileList) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  uploading: boolean;
  deleting: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {photos.map((p) => (
          <div
            key={p.id}
            className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 cursor-pointer"
            onClick={() => onView(p.id)}
          >
            <img src={p.url} alt="" className="h-full w-full object-cover" />

            {/* Hover overlay — stops propagation so click-to-view still works */}
            <div className="absolute inset-0 flex items-start justify-between bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 p-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                disabled={deleting}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 disabled:opacity-50"
                aria-label="Elimina foto"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onView(p.id); }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20"
                aria-label="Ingrandisci foto"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <span className="text-[10px]">Aggiungi</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onAdd(e.target.files)}
      />
    </div>
  );
}
