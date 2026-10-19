
const MAX_IMAGE_CHARS = 2_000_000;
const MAX_STORE_DIM = 2400;
const JPEG_QUALITY = 0.85;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

export async function toPersistableImage(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  if (dataUrl.length <= MAX_IMAGE_CHARS) return dataUrl;
  return await reencode(dataUrl);
}

function reencode(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
      const ratio = Math.min(1, MAX_STORE_DIM / longEdge);
      const width = Math.round(img.naturalWidth * ratio);
      const height = Math.round(img.naturalHeight * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D tidak didukung browser ini."));
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error("Gagal memproses gambar."));
    img.src = dataUrl;
  });
}
