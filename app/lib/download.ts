/**
 * Estimasi unduhan untuk dashboard.
 *
 * Browser TIDAK memberi event progres untuk unduhan blob:` URL (anchor
 * `download`) — jadi "estimasi" dihitung dari heuristik kecepatan tulis file
 * ke disk dikali ukuran file, ditampilkan sebagai hitung mundur oleh status
 * unduhan di dashboard. Angkanya sengaja heuristik (bukan janji): yang penting
 * pengguna dapat umpan balik "sedang diproses + kira-kira berapa lama".
 *
 * Prinsip sama dengan heuristik estimasi generate di `quality.ts`
 * (`estimateDurationMs`) — hanya skalanya file, bukan baris.
 */

/** Heuristik kecepatan tulis file ke disk (MB/detik) — SSD/harddisk umum */
export const DOWNLOAD_MBPS = 80;
/** Overhead tetap: baca blob dari IndexedDB + object URL + klik anchor */
const PREPARE_MS = 400;
/** Durasi minimum supaya status tidak berkedip untuk file kecil */
const MIN_MS = 800;

/** Perkiraan total proses unduh (ms) untuk file berukuran `size` byte */
function estimateDownloadMs(size: number): number {
  const mb = Math.max(0, size) / (1024 * 1024);
  return Math.max(
    MIN_MS,
    Math.round((mb / DOWNLOAD_MBPS) * 1000) + PREPARE_MS,
  );
}

/** Waktu satu proses unduhan: saat mulai + estimasi total (ms) */
export interface DownloadTiming {
  /** Epoch ms saat tombol Unduh diklik */
  startedAt: number;
  /** Estimasi total proses (siapkan blob + tulis file oleh browser) */
  totalMs: number;
}

/**
 * Buat timing untuk satu klik Unduh. `Date.now()` sengaja dipanggil DI SINI
 * (modul lib), bukan di badan komponen — aturan `react-hooks/purity`
 * melarang fungsi impure saat render, sebagaimana pola `performance.now()`
 * di wizard untuk progres generate.
 */
export function downloadTiming(size: number): DownloadTiming {
  return { startedAt: Date.now(), totalMs: estimateDownloadMs(size) };
}
