/**
 * Thumbnail dashboard — gambar template bisa beberapa MB; kalau langsung
 * dimasukkan ke <img> ukuran asli, buka panel jadi nge-frame (decode +
 * downscale raksasa di main thread).
 *
 * Strategi:
 * - Decode & resize jalan di `createImageBitmap` (off main thread di browser
 *   modern), hasil JPEG kecil 256px (4× kotak 56px untuk layar retina).
 * - Hasil per id di-cache sebagai object URL → betukar panel tidak decode
 *   ulang; URL sengaja TIDAK di-revoke selama tab terbuka (dibersihkan saat
 *   Hapus Data / reload halaman).
 * - `warmThumbs` memanaskan cache setelah paint pertama, satu per satu di
 *   waktu senggang → begitu panel File Sertifikat dibuka, gambarnya sudah siap.
 *
 * Thumbnail hanya untuk PRATINJAU; tombol Unduh tetap memakai blob ASLI
 * (kualitas penuh) lewat `loadFileBlob`.
 */
import { loadFileBlob } from "./activity";

/** Sisi terpanjang thumbnail (kotak 56px × 4 utk layar retina) */
const THUMB_MAX = 256;
/** Kualitas JPEG hasil thumbnail */
const THUMB_QUALITY = 0.82;
/** Jeda antar gambar saat pemanasan — beri napas main thread */
const WARM_GAP_MS = 30;

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
let warming = false;

/** Thumbnail sudah ada di cache? (tanpa memuat apa pun) */
export function cachedThumb(id: string): string | null {
  return cache.get(id) ?? null;
}

/** Ubah bitmap jadi JPEG kecil (latar putih — PNG transparan tidak jadi hitam) */
async function bitmapToJpeg(bmp: ImageBitmap): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0);
  return await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", THUMB_QUALITY),
  );
}

/** Perkecil blob ke THUMB_MAX px — bila gagal di mana pun, kembali ke asli */
async function shrinkToThumb(blob: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return blob;
  let big: ImageBitmap;
  try {
    big = await createImageBitmap(blob);
  } catch {
    return blob; // format tak didukung — pakai blob asli
  }
  try {
    const longest = Math.max(big.width, big.height);
    if (longest <= THUMB_MAX) return blob;
    const scale = THUMB_MAX / longest;
    const w = Math.max(1, Math.round(big.width * scale));
    const h = Math.max(1, Math.round(big.height * scale));
    try {
      const small = await createImageBitmap(big, {
        resizeWidth: w,
        resizeHeight: h,
        resizeQuality: "high",
      });
      try {
        const out = await bitmapToJpeg(small);
        if (out) return out;
      } finally {
        small.close();
      }
    } catch {
      /* resize gagal — pakai blob asli */
    }
    return blob;
  } finally {
    big.close();
  }
}

/**
 * Object URL thumbnail untuk satu id (dipakai berulang → cache).
 * Menolak bila file tidak ada di IndexedDB (mis. sudah lewat 24 jam).
 */
export function thumbUrl(id: string): Promise<string> {
  const hit = cache.get(id);
  if (hit) return Promise.resolve(hit);
  const running = pending.get(id);
  if (running) return running;

  const task = (async () => {
    const blob = await loadFileBlob(id);
    if (!blob) throw new Error(`File ${id} tidak ditemukan.`);
    const small = await shrinkToThumb(blob);
    const url = URL.createObjectURL(small);
    cache.set(id, url);
    return url;
  })().finally(() => pending.delete(id));
  pending.set(id, task);
  return task;
}

/**
 * Panaskan cache thumbnail untuk banyak id SEGERA setelah halaman siap —
 * berjalan pelan (idle + jeda antar gambar) supaya tidak mencuri frame.
 */
export function warmThumbs(ids: string[]): void {
  if (warming || ids.length === 0 || typeof window === "undefined") return;
  const queue = ids.filter((id) => !cache.has(id));
  if (queue.length === 0) return;
  warming = true;

  const run = async () => {
    try {
      for (const id of queue) {
        try {
          await thumbUrl(id);
        } catch {
          /* file hilang / kadaluarsa — lewati */
        }
        await new Promise((resolve) => window.setTimeout(resolve, WARM_GAP_MS));
      }
    } finally {
      warming = false;
    }
  };

  const start = () => void run();
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(start, { timeout: 2000 });
  } else {
    window.setTimeout(start, 400);
  }
}
