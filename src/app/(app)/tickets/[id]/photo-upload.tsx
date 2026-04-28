"use client";

import { useRef, useState, useTransition } from "react";
import { getUploadUrl, savePhoto, deletePhoto } from "./photo-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Trash2, Loader2, Eye, EyeOff, ImagePlus } from "lucide-react";

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

export function PhotoUpload({ ticketId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null, photoType: "pre" | "post") {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const { uploadUrl, key, isPublic } = await getUploadUrl(
          ticketId,
          file.name,
          file.type || "image/jpeg",
          photoType,
          true,
        );

        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "image/jpeg" },
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

  const prePhotos = photos.filter((p) => p.photoType === "pre");
  const postPhotos = photos.filter((p) => p.photoType === "post");

  return (
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
        <div className="grid grid-cols-2 gap-3">
          <PhotoSection
            label="Prima"
            photos={prePhotos}
            onAdd={(files) => handleFiles(files, "pre")}
            onDelete={handleDelete}
            uploading={uploading}
            deleting={isPending}
          />
          <PhotoSection
            label="Dopo"
            photos={postPhotos}
            onAdd={(files) => handleFiles(files, "post")}
            onDelete={handleDelete}
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
  );
}

function PhotoSection({
  label,
  photos,
  onAdd,
  onDelete,
  uploading,
  deleting,
}: {
  label: string;
  photos: Photo[];
  onAdd: (files: FileList) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
  deleting: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {photos.map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
            <img src={p.url} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => onDelete(p.id)}
              disabled={deleting}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Trash2 className="h-4 w-4 text-white" />
              )}
            </button>
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
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onAdd(e.target.files)}
      />
    </div>
  );
}
