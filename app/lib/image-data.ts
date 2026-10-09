/**
 * Menyiapkan template sebagai data URL untuk auto-save localStorage.
 * URL blob TIDAK bertahan refresh — karena itu sesi disimpan sebagai data URL.
 * File yang terlalu besar untuk kuota (~5 MB) dire-encode dulu:
 * sisi terpanjang MAX_STORE_DIM px, JPEG, background putih
 * (konsisten dengan hasil PDF yang juga di-flatten ke putih).
 * Catatan: PDF dirender maks 1754 px lebar (A4 @150 DPI) — 2400 px lebih dari cukup.
 */

const MAX_IMAGE_CHARS = 2_000_000; // ~1,5 MB asli — sisanya untuk rows, riwayat, PDF
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
      // Flatten transparansi → putih, sama seperti render PDF
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error("Gagal memproses gambar."));
    img.src = dataUrl;
  });
}
