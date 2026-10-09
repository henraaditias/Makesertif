import type { DataSource, DataRow, FieldConfig } from "@/components/flow/types";

/** Key localStorage — harus sama dengan STORAGE_KEYS di navbar (Delete Data) */
export const GC_KEYS = {
  draft: "gc:draft",
  history: "gc:history",
  pdfs: "gc:pdfs",
} as const;

/**
 * Flag purge (sessionStorage — ikut lintas reload dalam tab yang sama).
 * Delete Data menghapus key localStorage lalu reload; tanpa flag ini,
 * flush autosave di wizard akan menulis ulang gc:draft saat pagehide
 * sehingga data "hidup kembali" setelah dihapus.
 */
const PURGE_FLAG = "gc:purge";

/** Tandai sesi akan di-reset — panggil SEBELUM menghapus key & reload */
export function beginPurge(): void {
  try {
    sessionStorage.setItem(PURGE_FLAG, "1");
  } catch {
    /* sessionStorage tak tersedia — abaikan */
  }
}

/** Masih dalam sesi purge? (dibaca autosave flush untuk menahan diri) */
export function isPurging(): boolean {
  try {
    return sessionStorage.getItem(PURGE_FLAG) === "1";
  } catch {
    return false;
  }
}

/** Hapus flag purge — sekali pakai, dipanggil wizard saat restore setelah reload */
export function consumePurge(): void {
  try {
    sessionStorage.removeItem(PURGE_FLAG);
  } catch {
    /* abaikan */
  }
}

export interface ImageInfo {
  name: string;
  size: number;
}

/** Sesi kerja wizard — dipulihkan otomatis saat refresh (lihat certificate-wizard) */
export interface DraftState {
  v: 1;
  step: number;
  /** Template sebagai data URL (URL blob tidak bertahan refresh) */
  image: string | null;
  imageInfo: ImageInfo | null;
  source: DataSource;
  sheetUrl: string;
  headers: string[];
  rows: DataRow[];
  fields: FieldConfig[];
  previewIndex: number;
  /** Baris yang DIKECUALIKAN dari PDF (kosong = semua terpilih) */
  excludedRows: number[];
}

export interface HistoryEntry {
  id: string;
  /** ISO timestamp */
  at: string;
  fileName: string;
  pages: number;
  /** Salinan PDF tersimpan di gc:pdfs (bisa gagal karena kuota) */
  hasPdf: boolean;
}

const DRAFT_VERSION = 1;
const HISTORY_LIMIT = 20;
const PDFS_LIMIT = 3;

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Baca draft sesi; null bila tidak ada / korup / versi tak dikenal */
export function loadDraft(): DraftState | null {
  const draft = readJson<DraftState>(GC_KEYS.draft);
  if (!draft || draft.v !== DRAFT_VERSION) return null;
  if (
    typeof draft.step !== "number" ||
    typeof draft.sheetUrl !== "string" ||
    typeof draft.previewIndex !== "number" ||
    (draft.source !== "csv" && draft.source !== "sheets") ||
    !Array.isArray(draft.headers) ||
    !Array.isArray(draft.rows) ||
    !Array.isArray(draft.fields) ||
    !Array.isArray(draft.excludedRows)
  ) {
    return null;
  }
  return draft;
}

/**
 * Simpan draft — prioritas: (1) utuh, (2) buang salinan PDF dulu,
 * (3) tanpa gambar, (4) gagal. Data lain selalu selamat.
 */
export function saveDraft(draft: DraftState): boolean {
  try {
    localStorage.setItem(GC_KEYS.draft, JSON.stringify(draft));
    return true;
  } catch (err) {
    if (!isQuotaError(err)) return false;
  }
  localStorage.removeItem(GC_KEYS.pdfs);
  try {
    localStorage.setItem(GC_KEYS.draft, JSON.stringify(draft));
    return true;
  } catch {
    try {
      localStorage.setItem(
        GC_KEYS.draft,
        JSON.stringify({ ...draft, image: null }),
      );
      return true;
    } catch {
      return false;
    }
  }
}

export function loadHistory(): HistoryEntry[] {
  const list = readJson<HistoryEntry[]>(GC_KEYS.history);
  return Array.isArray(list) ? list : [];
}

/** Tambah entri terbaru di depan, batasi HISTORY_LIMIT */
export function pushHistory(entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...loadHistory()].slice(0, HISTORY_LIMIT);
  writeJson(GC_KEYS.history, next);
  return next;
}

export function loadPdf(id: string): string | null {
  const map = readJson<Record<string, string>>(GC_KEYS.pdfs);
  if (!map || typeof map !== "object") return null;
  return typeof map[id] === "string" ? map[id] : null;
}

/** Simpan salinan PDF (data URL) — maks PDFS_LIMIT terbaru; kuota penuh → kosongkan lalu coba lagi */
export function savePdf(id: string, dataUrl: string): boolean {
  const map = readJson<Record<string, string>>(GC_KEYS.pdfs) ?? {};
  const next: Record<string, string> = { ...map, [id]: dataUrl };
  // Insertion order = urutan simpan → buang yang paling lama
  while (Object.keys(next).length > PDFS_LIMIT) {
    const oldest = Object.keys(next).find((key) => key !== id);
    if (!oldest) break;
    delete next[oldest];
  }
  if (writeJson(GC_KEYS.pdfs, next)) return true;
  return writeJson(GC_KEYS.pdfs, { [id]: dataUrl });
}
