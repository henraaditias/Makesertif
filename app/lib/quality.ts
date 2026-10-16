import type { DownloadKind, QualityLevel } from "@/components/flow/types";
import { GC_KEYS } from "./storage";

/** mm halaman A4 landscape — dipakai pdf.ts untuk render & penempatan gambar */
export const A4_W_MM = 297;
export const A4_H_MM = 210;
const MM_PER_INCH = 25.4;

export interface QualityPreset {
  id: QualityLevel;
  label: string;
  /** Lebar piksel halaman — tinggi mengikuti rasio A4 landscape */
  pxW: number;
  pxH: number;
  /**
   * Heuristik awal ms/baris — dipakai SEBELUM ada hasil ukur nyata;
   * setelah generate, `recordMsPerPage` menimpa dengan kecepatan perangkat.
   */
  baseMsPerRow: number;
}

/** Piksel halaman pada DPI tertentu (A4 landscape) */
function pixelsAtDpi(dpi: number): { pxW: number; pxH: number } {
  return {
    pxW: Math.round((A4_W_MM / MM_PER_INCH) * dpi),
    pxH: Math.round((A4_H_MM / MM_PER_INCH) * dpi),
  };
}

/** Lebar piksel preset 4K — tinggi mengikuti rasio halaman */
const PX_4K_W = 3840;
const PX_4K_H = Math.round((A4_H_MM / A4_W_MM) * PX_4K_W);

/**
 * Preset kualitas (dipilih user di panel Unduh step 4):
 * - Normal — A4 200 DPI (≈ 2339 × 1654 px), hemat waktu & ukuran file
 * - HD (default) — A4 400 DPI (≈ 4677 × 3307 px), sama dengan render lama
 * - 4K — lebar 3840 px (≈ 3840 × 2715 px)
 * Catatan: batas ketajaman sebenarnya = resolusi template (yang digambar
 * "contain" ke halaman) — 4K tidak membuat detail template jadi lebih tajam.
 */
export const QUALITY_PRESETS: readonly QualityPreset[] = [
  { id: "normal", label: "Normal", ...pixelsAtDpi(200), baseMsPerRow: 350 },
  { id: "hd", label: "HD", ...pixelsAtDpi(400), baseMsPerRow: 900 },
  {
    id: "4k",
    label: "4K",
    pxW: PX_4K_W,
    pxH: PX_4K_H,
    baseMsPerRow: 600,
  },
];

/** Default kualitas — sama dengan DPI 400 yang lama dipakai diam-diam */
export const DEFAULT_QUALITY: QualityLevel = "hd";

export function qualityPreset(level: QualityLevel): QualityPreset {
  return (
    QUALITY_PRESETS.find((preset) => preset.id === level) ??
    QUALITY_PRESETS.find((preset) => preset.id === DEFAULT_QUALITY)!
  );
}

/** Ukuran piksel kanvas render untuk level kualitas */
export function qualityPixels(level: QualityLevel): {
  pxW: number;
  pxH: number;
} {
  const { pxW, pxH } = qualityPreset(level);
  return { pxW, pxH };
}

/** Keterangan piksel untuk UI, mis. "4677 × 3307 px" */
export function qualityPixelLabel(level: QualityLevel): string {
  const { pxW, pxH } = qualityPreset(level);
  return `${pxW} × ${pxH} px`;
}

/** Faktor ms/baris per format — satuan/PNG mengerjakan encode per baris */
const FORMAT_FACTOR: Record<DownloadKind, number> = {
  pdf: 1,
  "zip-pdf": 1.5,
  "zip-img": 1.2,
};

/** Overhead tetap per unduhan (muat font/gambar, tulis ZIP, simpan riwayat) */
const FORMAT_OVERHEAD_MS: Record<DownloadKind, number> = {
  pdf: 800,
  "zip-pdf": 1500,
  "zip-img": 2500,
};

type PerfMap = Record<string, number>; // "hd:zip-img" → ms/baris terukur

function perfKey(level: QualityLevel, kind: DownloadKind): string {
  return `${level}:${kind}`;
}

function readPerf(): PerfMap {
  try {
    const raw = localStorage.getItem(GC_KEYS.perf);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as PerfMap) : {};
  } catch {
    return {};
  }
}

/** ms/baris terakhir yang pernah terukur untuk kombinasi ini (null = belum ada) */
export function measuredMsPerRow(
  level: QualityLevel,
  kind: DownloadKind,
): number | null {
  const value = readPerf()[perfKey(level, kind)];
  return typeof value === "number" && value > 0 ? value : null;
}

/**
 * Catat kecepatan aktual generate (ms/baris) → dipakai perkiraan berikutnya.
 * Tak pernah melempar error (gagal simpan = pakai heuristik lagi).
 */
export function recordMsPerRow(
  level: QualityLevel,
  kind: DownloadKind,
  msPerRow: number,
): void {
  if (!Number.isFinite(msPerRow) || msPerRow <= 0) return;
  try {
    const map = readPerf();
    map[perfKey(level, kind)] = Math.round(msPerRow);
    localStorage.setItem(GC_KEYS.perf, JSON.stringify(map));
  } catch {
    /* localStorage penuh/tak ada — abaikan, perkiraan tetap jalan */
  }
}

/** Perkiraan durasi total (ms) — hasil ukur terakhir bila ada, kalau tidak heuristik */
export function estimateDurationMs(
  level: QualityLevel,
  kind: DownloadKind,
  rows: number,
): number {
  const perRow =
    measuredMsPerRow(level, kind) ??
    qualityPreset(level).baseMsPerRow * FORMAT_FACTOR[kind];
  return Math.round(perRow * Math.max(1, rows) + FORMAT_OVERHEAD_MS[kind]);
}

/** Durasi ms → teks UI, mis. "8 detik" / "2 menit 10 detik" */
export function formatDurationMs(ms: number): string {
  const totalSec = Math.max(1, Math.round(ms / 1000));
  if (totalSec < 60) return `${totalSec} detik`;
  const minutes = Math.floor(totalSec / 60);
  const rest = totalSec % 60;
  return rest > 0 ? `${minutes} menit ${rest} detik` : `${minutes} menit`;
}
