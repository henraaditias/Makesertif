
const DB_NAME = "gc-files";
const DB_VERSION = 1;

export const META_STORES = ["templates", "datasets", "results"] as const;
export const FILE_STORE = "files";

export type MetaStore = (typeof META_STORES)[number];

export interface BaseRecord {
  id: string;
  at: number;
}

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
          db.close();
          reject(err);
        }
      }),
  );
}

export function idbPut<T extends { id: string }>(
  store: string,
  record: T,
): Promise<IDBValidKey> {
  return withStore(store, "readwrite", (s) => s.put(record));
}

export function idbGet<T>(store: string, id: string): Promise<T | null> {
  return withStore<T | undefined>(store, "readonly", (s) => s.get(id)).then(
    (v) => v ?? null,
  );
}

export function idbGetAll<T>(store: string): Promise<T[]> {
  return withStore<T[]>(store, "readonly", (s) => s.getAll()).then(
    (v) => v ?? [],
  );
}

export function idbGetAllKeys(store: string): Promise<IDBValidKey[]> {
  return withStore<IDBValidKey[]>(store, "readonly", (s) =>
    s.getAllKeys(),
  ).then((v) => v ?? []);
}

export function idbDelete(store: string, id: string): Promise<undefined> {
  return withStore(store, "readwrite", (s) => s.delete(id));
}

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

export function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}
