import type { DataSource, DataRow, FieldConfig } from "@/components/flow/types";

/**
 * Key localStorage — harus sama dengan STORAGE_KEYS di navbar (Delete Data).
 * `history`/`pdfs` = peninggalan fitur History yang sudah dihapus;
 * tidak pernah ditulis lagi, tetap dihapus Delete Data & fallback kuota
 * agar data lama user ikut terbersih.
 */
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
  /** Template depan sebagai data URL (URL blob tidak bertahan refresh) */
  image: string | null;
  imageInfo: ImageInfo | null;
  /** Template belakang (opsional — draft lama tak punya field ini) */
  imageBack?: string | null;
  imageInfoBack?: ImageInfo | null;
  source: DataSource;
  sheetUrl: string;
  headers: string[];
  rows: DataRow[];
  fields: FieldConfig[];
  previewIndex: number;
  /** Baris yang DIKECUALIKAN dari PDF (kosong = semua terpilih) */
  excludedRows: number[];
  /**
   * Kolom penamaan file (`2026-001_{kolom}`) — opsional; kosong/absen =
   * kolom pertama. Draft lama berisi `filePattern` (pola {Kolom} lama)
   * dibiarkan sebagai key asing dan diabaikan.
   */
  fileNameColumn?: string;
}

const DRAFT_VERSION = 1;

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
 * Simpan draft — prioritas: (1) utuh, (2) buang salinan PDF lama
 * (`gc:pdfs`, peninggalan fitur History), (3) tanpa template belakang,
 * (4) tanpa template sama sekali, (5) gagal. Data lain selalu selamat.
 */
export function saveDraft(draft: DraftState): boolean {
  try {
    localStorage.setItem(GC_KEYS.draft, JSON.stringify(draft));
    return true;
  } catch (err) {
    if (!isQuotaError(err)) return false;
  }
  localStorage.removeItem(GC_KEYS.pdfs);
  // Kandidat fallback, dari paling sedikit mengorbankan sampai paling berat
  const attempts: DraftState[] = [draft];
  if (draft.imageBack) attempts.push({ ...draft, imageBack: null });
  if (draft.image) {
    const withoutImages: DraftState = { ...draft, image: null };
    if (draft.imageBack) withoutImages.imageBack = null;
    attempts.push(withoutImages);
  }
  for (const attempt of attempts) {
    try {
      localStorage.setItem(GC_KEYS.draft, JSON.stringify(attempt));
      return true;
    } catch {
      /* lanjut ke fallback berikutnya */
    }
  }
  return false;
}
