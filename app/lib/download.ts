
export const DOWNLOAD_MBPS = 80;
const PREPARE_MS = 400;
const MIN_MS = 800;

function estimateDownloadMs(size: number): number {
  const mb = Math.max(0, size) / (1024 * 1024);
  return Math.max(
    MIN_MS,
    Math.round((mb / DOWNLOAD_MBPS) * 1000) + PREPARE_MS,
  );
}

export interface DownloadTiming {
  startedAt: number;
  totalMs: number;
}

export function downloadTiming(size: number): DownloadTiming {
  return { startedAt: Date.now(), totalMs: estimateDownloadMs(size) };
}
