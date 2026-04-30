/**
 * Converts any image file to JPEG via canvas before upload.
 * Handles HEIC/HEIF from Samsung/iOS, large RAW previews, etc.
 * Falls back to the original file if conversion fails.
 */
export async function toJpeg(file: File, quality = 0.88): Promise<File> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality,
        );
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
