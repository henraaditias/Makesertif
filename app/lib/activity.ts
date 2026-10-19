import type { DataSource, DownloadKind, TemplateSide } from "@/components/flow/types";
import {
  FILE_STORE,
  META_STORES,
  idbClear,
  idbDelete,
  idbDeleteOldest,
  idbGet,
  idbGetAll,
  idbGetAllKeys,
  idbPut,
  isQuotaError,
  type BaseRecord,
  type MetaStore,
} from "./idb.ts";

export const TTL_MS = 24 * 60 * 60 * 1000;
export const CAP_PER_STORE = 30;

export interface TemplateRec extends BaseRecord {
  side: TemplateSide;
  name: string;
  size: number;
  hasFile: boolean;
}

export interface DatasetRec extends BaseRecord {
  source: DataSource;
  name?: string;
  size?: number;
  url?: string;
  rows: number;
  hasFile: boolean;
}

export interface ResultRec extends BaseRecord {
  output: DownloadKind;
  fileName: string;
  files: number;
  pages: number;
  size: number;
  hasFile: boolean;
}

interface FileRec extends BaseRecord {
  blob: Blob;
}

export interface DashboardData {
  templates: TemplateRec[];
  datasets: DatasetRec[];
  results: ResultRec[];
  pruned: number;
  error?: string;
}


export function makeId(at: number = Date.now()): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${String(at).padStart(15, "0")}_${uuid}`;
}

export function isExpired(at: number, now: number): boolean {
  return now - at >= TTL_MS;
}

export function expiredIds<T extends BaseRecord>(
  list: T[],
  now: number,
): string[] {
  return list.filter((r) => isExpired(r.at, now)).map((r) => r.id);
}

export function capIds<T extends BaseRecord>(
  sortedNewestFirst: T[],
  cap: number = CAP_PER_STORE,
): string[] {
  return sortedNewestFirst.slice(cap).map((r) => r.id);
}

export function sisaWaktuLabel(at: number, now: number): string {
  const sisa = at + TTL_MS - now;
  if (sisa <= 0) return "Kedaluwarsa";
  const jam = Math.floor(sisa / 3_600_000);
  const menit = Math.floor((sisa % 3_600_000) / 60_000);
  if (jam >= 24) return "Berakhir dalam 24 jam";
  if (jam > 0) return `Berakhir dalam ${jam}j ${menit}m`;
  if (menit > 0) return `Berakhir dalam ${menit}m`;
  return "Berakhir dalam kurang dari 1 menit";
}

export function formatUkuran(bytes: number): string {
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function byAtDesc(a: BaseRecord, b: BaseRecord): number {
  return b.at - a.at || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
}


async function persist(
  store: MetaStore,
  meta: BaseRecord & { hasFile: boolean },
  blob: Blob | null,
): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (meta.hasFile && blob) {
        await idbPut<FileRec>(FILE_STORE, {
          id: meta.id,
          at: meta.at,
          blob,
        });
      }
      await idbPut(store, meta);
      return true;
    } catch (err) {
      if (isQuotaError(err)) {
        const freed = await idbDeleteOldest(FILE_STORE).catch(() => false);
        if (freed) continue;
      }
      break;
    }
  }

  meta.hasFile = false;
  try {
    await idbPut(store, meta);
    return true;
  } catch {
    return false;
  }
}

async function enforceCap(store: MetaStore): Promise<void> {
  try {
    const all = await idbGetAll<BaseRecord>(store);
    all.sort(byAtDesc);
    for (const id of capIds(all)) {
      await idbDelete(store, id).catch(() => {});
      await idbDelete(FILE_STORE, id).catch(() => {});
    }
  } catch {
  }
}

export async function saveTemplateRecord(input: {
  side: TemplateSide;
  name: string;
  size: number;
  blob: Blob;
}): Promise<boolean> {
  const at = Date.now();
  const meta: TemplateRec = {
    id: makeId(at),
    at,
    side: input.side,
    name: input.name,
    size: input.size,
    hasFile: true,
  };
  const ok = await persist("templates", meta, input.blob);
  if (ok) await enforceCap("templates");
  return ok;
}

export async function saveDatasetRecord(input: {
  source: DataSource;
  name?: string;
  size?: number;
  url?: string;
  rows: number;
  blob?: Blob;
}): Promise<boolean> {
  const at = Date.now();
  const blob = input.blob ?? null;
  const meta: DatasetRec = {
    id: makeId(at),
    at,
    source: input.source,
    rows: input.rows,
    hasFile: blob !== null,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.size !== undefined ? { size: input.size } : {}),
    ...(input.url !== undefined ? { url: input.url } : {}),
  };
  const ok = await persist("datasets", meta, blob);
  if (ok) await enforceCap("datasets");
  return ok;
}

export async function saveResultRecord(input: {
  output: DownloadKind;
  fileName: string;
  files: number;
  pages: number;
  blob: Blob;
}): Promise<boolean> {
  const at = Date.now();
  const meta: ResultRec = {
    id: makeId(at),
    at,
    output: input.output,
    fileName: input.fileName,
    files: input.files,
    pages: input.pages,
    size: input.blob.size,
    hasFile: true,
  };
  const ok = await persist("results", meta, input.blob);
  if (ok) await enforceCap("results");
  return ok;
}


const inflightDashboard = new Map<string, Promise<DashboardData>>();
const inflightBlobs = new Map<string, Promise<Blob | null>>();

async function loadMeta<T extends BaseRecord>(
  store: MetaStore,
  now: number,
  acc: { pruned: number },
): Promise<T[]> {
  const all = await idbGetAll<T>(store);
  all.sort(byAtDesc);
  const expired = expiredIds(all, now);
  const beyond = capIds(all);
  acc.pruned += expired.length;
  for (const id of [...new Set([...expired, ...beyond])]) {
    await idbDelete(store, id).catch(() => {});
    await idbDelete(FILE_STORE, id).catch(() => {});
  }
  const doomed = new Set([...expired, ...beyond]);
  return all.filter((r) => !doomed.has(r.id));
}

async function cleanOrphanFiles(
  known: Set<string>,
  now: number,
): Promise<void> {
  const keys = await idbGetAllKeys(FILE_STORE).catch(() => null);
  if (!keys) return;
  for (const key of keys) {
    if (typeof key !== "string" || known.has(key)) continue;
    const rec = await idbGet<FileRec>(FILE_STORE, key).catch(() => null);
    if (rec && now - rec.at > 10_000) {
      await idbDelete(FILE_STORE, key).catch(() => {});
    }
  }
}

export async function loadDashboard(): Promise<DashboardData> {
  const running = inflightDashboard.get("load");
  if (running) return running;
  const task = readDashboard().finally(() => inflightDashboard.delete("load"));
  inflightDashboard.set("load", task);
  return task;
}

async function readDashboard(): Promise<DashboardData> {
  const now = Date.now();
  const acc = { pruned: 0 };
  try {
    const templates = await loadMeta<TemplateRec>("templates", now, acc);
    const datasets = await loadMeta<DatasetRec>("datasets", now, acc);
    const results = await loadMeta<ResultRec>("results", now, acc);
    await cleanOrphanFiles(
      new Set([...templates, ...datasets, ...results].map((r) => r.id)),
      now,
    );
    return { templates, datasets, results, pruned: acc.pruned };
  } catch (err) {
    return {
      templates: [],
      datasets: [],
      results: [],
      pruned: acc.pruned,
      error:
        err instanceof Error
          ? err.message
          : "Gagal membaca data dashboard (IndexedDB).",
    };
  }
}

export function loadFileBlob(id: string): Promise<Blob | null> {
  const running = inflightBlobs.get(id);
  if (running) return running;
  const task = idbGet<FileRec>(FILE_STORE, id)
    .then((rec) => rec?.blob ?? null)
    .catch(() => null)
    .finally(() => inflightBlobs.delete(id));
  inflightBlobs.set(id, task);
  return task;
}

export function clearDashboard(): Promise<void> {
  return idbClear([...META_STORES, FILE_STORE]);
}
