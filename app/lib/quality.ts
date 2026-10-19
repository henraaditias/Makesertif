import type { DownloadKind, QualityLevel } from "@/components/flow/types";
import { GC_KEYS } from "./storage";

export const A4_W_MM = 297;
export const A4_H_MM = 210;
const MM_PER_INCH = 25.4;

export interface QualityPreset {
  id: QualityLevel;
  label: string;
  pxW: number;
  pxH: number;
  baseMsPerRow: number;
}

function pixelsAtDpi(dpi: number): { pxW: number; pxH: number } {
  return {
    pxW: Math.round((A4_W_MM / MM_PER_INCH) * dpi),
    pxH: Math.round((A4_H_MM / MM_PER_INCH) * dpi),
  };
}

const PX_4K_W = 3840;
const PX_4K_H = Math.round((A4_H_MM / A4_W_MM) * PX_4K_W);

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

export const DEFAULT_QUALITY: QualityLevel = "hd";

export function qualityPreset(level: QualityLevel): QualityPreset {
  return (
    QUALITY_PRESETS.find((preset) => preset.id === level) ??
    QUALITY_PRESETS.find((preset) => preset.id === DEFAULT_QUALITY)!
  );
}

export function qualityPixels(level: QualityLevel): {
  pxW: number;
  pxH: number;
} {
  const { pxW, pxH } = qualityPreset(level);
  return { pxW, pxH };
}

export function qualityPixelLabel(level: QualityLevel): string {
  const { pxW, pxH } = qualityPreset(level);
  return `${pxW} × ${pxH} px`;
}

const FORMAT_FACTOR: Record<DownloadKind, number> = {
  pdf: 1,
  "zip-pdf": 1.5,
  "zip-img": 1.2,
};

const FORMAT_OVERHEAD_MS: Record<DownloadKind, number> = {
  pdf: 800,
  "zip-pdf": 1500,
  "zip-img": 2500,
};

type PerfMap = Record<string, number>;

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

export function measuredMsPerRow(
  level: QualityLevel,
  kind: DownloadKind,
): number | null {
  const value = readPerf()[perfKey(level, kind)];
  return typeof value === "number" && value > 0 ? value : null;
}

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
  }
}

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

export function formatDurationMs(ms: number): string {
  const totalSec = Math.max(1, Math.round(ms / 1000));
  if (totalSec < 60) return `${totalSec} detik`;
  const minutes = Math.floor(totalSec / 60);
  const rest = totalSec % 60;
  return rest > 0 ? `${minutes} menit ${rest} detik` : `${minutes} menit`;
}
