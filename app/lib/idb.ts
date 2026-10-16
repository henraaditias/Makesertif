/**
 * Wrapper tipis IndexedDB — penyimpanan file dashboard (gambar template,
 * file CSV, hasil PDF/ZIP). Sengaja TIDAK memakai localStorage: kuota 5MB
 * berbagi dengan gc:draft dan tidak bisa menyimpan Blob.
 *
 * db `gc-files` v1 — 4 object store:
 * - templates / datasets / results — METADATA kecil (tanpa blob) →
 *   listing & prune murah tanpa memuat file ke memori.
 * - files — blob per record id, diambil on-demand (preview/unduh ulang).
 *
 * Semua fungsi melempar error ke pemanggil; pembungkusnya (activity.ts)
 * yang wajib catch agar kegagalan penyimpanan tak mengganggu wizard.
 */

const DB_NAME = "gc-files";
const DB_VERSION = 1;

/** Store metadata (tanpa blob) */
export const META_STORES = ["templates", "datasets", "results"] as const;
/** Store blob */
export const FILE_STORE = "files";

export type MetaStore = (typeof META_STORES)[number];

/** Record minimum yang disimpan di tiap store metadata */
export interface BaseRecord {
  id: string;
  /** epoch ms — dipakai TTL 24 jam */
  at: number;
}

/**
 * Buka koneksi — TIDAK di-cache: setiap operasi membuka koneksi sendiri
 * lalu menutupnya saat selesai. (Bug yang pernah terjadi: koneksi di-close
 * lalu dipakai ulang dari cache → transaksi berikutnya selalu
 * InvalidStateError → data tak pernah tersimpan.)
 */
function openDb(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB tidak tersedia di browser ini."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("templates"))
        db.createObjectStore("templates", { keyPath: "id" });
      if (!db.objectStoreNames.contains("datasets"))
        db.createObjectStore("datasets", { keyPath: "id" });
      if (!db.objectStoreNames.contains("results"))
        db.createObjectStore("results", { keyPath: "id" });
      if (!db.objectStoreNames.contains("files"))
        db.createObjectStore("files", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error ?? new Error("Gagal membuka IndexedDB."));
    req.onblocked = () =>
      reject(new Error("IndexedDB diblokir oleh tab lain."));
  });
}

/** Jalankan transaksi read-write satu store & tunggu selesai */
function withStore<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        try {
          const tx = db.transaction(store, mode);
          const req = run(tx.objectStore(store));
          tx.oncomplete = () => {
            db.close();
            resolve(req.result);
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error ?? new Error(`Transaksi ${store} gagal.`));
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error ?? new Error(`Transaksi ${store} dibatalkan.`));
          };
        } catch (err) {
          // gagal sinkron (mis. quota saat put) — tutup koneksi agar bocor
          db.close();
          reject(err);
        }
      }),
  );
}

/** Simpan record (put by key `id`) */
export function idbPut<T extends { id: string }>(
  store: string,
  record: T,
): Promise<IDBValidKey> {
  return withStore(store, "readwrite", (s) => s.put(record));
}

/** Ambil satu record; null bila tidak ada */
export function idbGet<T>(store: string, id: string): Promise<T | null> {
  return withStore<T | undefined>(store, "readonly", (s) => s.get(id)).then(
    (v) => v ?? null,
  );
}

/** Semua record satu store (metadata kecil — dipakai listing & prune) */
export function idbGetAll<T>(store: string): Promise<T[]> {
  return withStore<T[]>(store, "readonly", (s) => s.getAll()).then(
    (v) => v ?? [],
  );
}

/** Semua key satu store (tanpa memuat value — murah, dipakai deteksi blob yatim) */
export function idbGetAllKeys(store: string): Promise<IDBValidKey[]> {
  return withStore<IDBValidKey[]>(store, "readonly", (s) =>
    s.getAllKeys(),
  ).then((v) => v ?? []);
}

/** Hapus satu record */
export function idbDelete(store: string, id: string): Promise<undefined> {
  return withStore(store, "readwrite", (s) => s.delete(id));
}

/**
 * Hapus record PALING LAMA (key pertama). Aman untuk store yang id-nya
 * diawali timestamp 15 digit (urutan key = kronologis) — dipakai evict
 * saat quota IndexedDB penuh.
 */
export function idbDeleteOldest(store: string): Promise<boolean> {
  return openDb().then(
    (db) =>
      new Promise<boolean>((resolve, reject) => {
        try {
          const tx = db.transaction(store, "readwrite");
          const req = tx.objectStore(store).openKeyCursor();
          let deleted = false;
          req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
              cursor.delete();
              deleted = true;
            }
          };
          tx.oncomplete = () => {
            db.close();
            resolve(deleted);
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error ?? new Error("Gagal menghapus record terlama."));
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error ?? new Error("Transaksi evict dibatalkan."));
          };
        } catch (err) {
          db.close();
          reject(err);
        }
      }),
  );
}

/** Kosongkan beberapa store sekaligus (hapus sesi dashboard) */
export async function idbClear(stores: readonly string[]): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction([...stores], "readwrite");
      for (const name of stores) tx.objectStore(name).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error("Gagal mengosongkan store."));
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error ?? new Error("Transaksi clear dibatalkan."));
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}

/** Apakah error kemungkinan quota penuh? (dipakai evict-oldest-retry) */
export function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}
