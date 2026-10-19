import type {
  DataSource,
  DataRow,
  FieldConfig,
  DownloadKind,
  QualityLevel,
} from "@/components/flow/types";

export const GC_KEYS = {
  draft: "gc:draft",
  history: "gc:history",
  pdfs: "gc:pdfs",
  perf: "gc:perf",
} as const;

const PURGE_FLAG = "gc:purge";

export function beginPurge(): void {
  try {
    sessionStorage.setItem(PURGE_FLAG, "1");
  } catch {
  }
}

export function isPurging(): boolean {
  try {
    return sessionStorage.getItem(PURGE_FLAG) === "1";
  } catch {
    return false;
  }
}

export function consumePurge(): void {
  try {
    sessionStorage.removeItem(PURGE_FLAG);
  } catch {
  }
}

export interface ImageInfo {
  name: string;
  size: number;
}

export interface DraftState {
  v: 1;
  step: number;
  image: string | null;
  imageInfo: ImageInfo | null;
  imageBack?: string | null;
  imageInfoBack?: ImageInfo | null;
  source: DataSource;
  sheetUrl: string;
  headers: string[];
  rows: DataRow[];
  fields: FieldConfig[];
  previewIndex: number;
  excludedRows: number[];
  fileNameColumn?: string;
  downloadFormat?: DownloadKind;
  quality?: QualityLevel;
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

export function saveDraft(draft: DraftState): boolean {
  try {
    localStorage.setItem(GC_KEYS.draft, JSON.stringify(draft));
    return true;
  } catch (err) {
    if (!isQuotaError(err)) return false;
  }
  localStorage.removeItem(GC_KEYS.pdfs);
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
    }
  }
  return false;
}
