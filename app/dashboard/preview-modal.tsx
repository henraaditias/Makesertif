"use client";


import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Button from "@/components/common/button";
import { ChevronRightIcon, DownloadIcon } from "@/components/common/icons";
import type { CsvTable } from "@/lib/csv";
import { parseCsv } from "@/lib/csv";
import type { DownloadKind } from "@/components/flow/types";
import { loadFileBlob } from "@/lib/activity";
import { sheetCsvUrl } from "@/lib/sheets";
import { fetchTextOnce } from "@/lib/http";
import {
  isImageName,
  listZipEntries,
  readZipEntry,
  type ZipEntryInfo,
} from "@/lib/unzip";

export type PreviewTarget =
  | { type: "template"; id: string; name: string; size: number }
  | { type: "csv"; id: string; name: string; size: number }
  | { type: "sheet"; url: string; name: string }
  | {
      type: "result";
      id: string;
      name: string;
      size: number;
      output: DownloadKind;
    };

const MAX_TABLE_ROWS = 50;
const MAX_LIST_NAMES = 50;

export default function PreviewModal({
  target,
  download,
  onClose,
}: {
  target: PreviewTarget;
  download?: { loading: boolean; onClick: () => void };
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 md:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Pratinjau ${target.name}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-4xl flex-col gap-3 rounded-container bg-surface p-4 shadow-card"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-label text-ink">{target.name}</p>
          <div className="flex shrink-0 items-center gap-2">
            {download && (
              <Button
                size="sm"
                variant="secondary"
                iconLeft={<DownloadIcon className="size-4" />}
                loading={download.loading}
                onClick={download.onClick}
              >
                Unduh
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>

        <div className="flex max-h-[68vh] min-h-0 flex-col overflow-hidden rounded-control border border-line bg-surface-subtle">
          <PreviewBody key={previewKey(target)} target={target} />
        </div>
      </div>
    </div>
  );
}

function previewKey(target: PreviewTarget): string {
  if (target.type === "sheet") return `sheet:${target.url}`;
  if (target.type === "result") return `result:${target.id}`;
  return `${target.type}:${target.id}`;
}

function PreviewBody({ target }: { target: PreviewTarget }) {
  if (target.type === "template") {
    return <ImagePreview id={target.id} name={target.name} />;
  }
  if (target.type === "result") {
    return <ResultPreview id={target.id} output={target.output} />;
  }
  return <TablePreview target={target} />;
}

function StatusText({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 py-10 text-center text-body text-ink-muted">{children}</p>
  );
}


function ImagePreview({ id, name }: { id: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    void loadFileBlob(id)
      .then((blob) => {
        if (!blob) {
          if (active) setFailed(true);
          return;
        }
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  if (url) {
    return (
      <div className="flex max-h-[60vh] items-center justify-center p-2">
        <img
          src={url}
          alt={name}
          decoding="async"
          className="max-h-[58vh] w-auto max-w-full object-contain"
        />
      </div>
    );
  }
  return (
    <StatusText>
      {failed ? "File tidak ditemukan, mungkin sudah melewati 24 jam." : "Memuat pratinjau…"}
    </StatusText>
  );
}


async function loadTableText(
  target: Extract<PreviewTarget, { type: "csv" | "sheet" }>,
): Promise<string> {
  if (target.type === "csv") {
    const blob = await loadFileBlob(target.id);
    if (!blob) throw new Error("blob hilang");
    return await blob.text();
  }
  return await fetchTextOnce(sheetCsvUrl(target.url));
}

function TablePreview({
  target,
}: {
  target: Extract<PreviewTarget, { type: "csv" | "sheet" }>;
}) {
  const [table, setTable] = useState<CsvTable | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void loadTableText(target)
      .then((text) => {
        if (active) setTable(parseCsv(text));
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [target]);

  if (table === null) {
    return (
      <StatusText>
        {failed
          ? target.type === "csv"
            ? "File tidak ditemukan, mungkin sudah melewati 24 jam."
            : "Data tidak dapat dimuat, pastikan link Google Sheets dibagikan ke publik."
          : "Memuat pratinjau…"}
      </StatusText>
    );
  }
  if (table.headers.length === 0) {
    return <StatusText>Data tidak berisi kolom apa pun.</StatusText>;
  }

  const rows = table.rows.slice(0, MAX_TABLE_ROWS);
  return (
    <div className="flex h-[56vh] min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2">
        <span className="text-label text-ink-secondary">
          {table.rows.length} baris · {table.headers.length} kolom
        </span>
        <span className="text-label text-ink-muted">
          {table.rows.length > MAX_TABLE_ROWS
            ? `Menampilkan ${MAX_TABLE_ROWS} baris pertama`
            : "Pratinjau data"}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-body">
          <thead>
            <tr>
              <th className="w-10 border-b border-line bg-surface-subtle px-3 py-2 text-right text-label text-ink-muted">
                No
              </th>
              {table.headers.map((header) => (
                <th
                  key={header}
                  className="border-b border-line bg-surface-subtle px-3 py-2 text-left text-label text-ink whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="even:bg-surface-subtle">
                <td className="border-b border-line px-3 py-2 text-right text-ink-disabled">
                  {index + 1}
                </td>
                {table.headers.map((header) => (
                  <td
                    key={header}
                    className="border-b border-line px-3 py-2 text-ink-secondary whitespace-nowrap"
                  >
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ResultPreview({
  id,
  output,
}: {
  id: string;
  output: DownloadKind;
}) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [base, setBase] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [entries, setEntries] = useState<ZipEntryInfo[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [media, setMedia] = useState<"image" | "pdf">("pdf");

  const urlRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  const show = useCallback((blob: Blob, name: string, i?: number) => {
    if (!mountedRef.current) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(blob);
    setUrl(urlRef.current);
    setMedia(isImageName(name) ? "image" : "pdf");
    if (i !== undefined) setIndex(i);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const file = await loadFileBlob(id);
        if (!file) throw new Error("blob hilang");
        if (output === "pdf") {
          if (!active) return;
          setBase(file);
          show(file, "halaman.pdf");
          setPhase("ready");
          return;
        }
        const all = await listZipEntries(file);
        const wanted = all.filter((e) =>
          output === "zip-img" ? isImageName(e.name) : e.name.toLowerCase().endsWith(".pdf"),
        );
        const list = wanted.length > 0 ? wanted : all;
        if (!active) return;
        setBase(file);
        setEntries(list);
        setNames(list.slice(0, MAX_LIST_NAMES).map((e) => e.name));
        if (list.length > 0) {
          const first = await readZipEntry(file, list[0]);
          if (!active) return;
          show(first, list[0].name, 0);
        }
        setPhase("ready");
      } catch {
        if (active) setPhase("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [id, output, show]);

  const go = (next: number) => {
    const entry = entries[next];
    if (!base || !entry) return;
    void readZipEntry(base, entry)
      .then((blob) => show(blob, entry.name, next))
      .catch(() => {});
  };

  if (phase === "loading") return <StatusText>Memuat pratinjau…</StatusText>;
  if (phase === "error") {
    return (
      <StatusText>
        File tidak ditemukan, mungkin sudah melewati 24 jam.
      </StatusText>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex min-h-0 items-center justify-center p-2">
        {!url ? (
          <StatusText>ZIP tidak berisi file yang bisa dipratinjau.</StatusText>
        ) : media === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={entries[index]?.name ?? "pratinjau"}
            decoding="async"
            className="max-h-[54vh] w-auto max-w-full object-contain"
          />
        ) : (
          <iframe
            src={url}
            title={`Pratinjau ${entries[index]?.name ?? "dokumen"}`}
            className="h-[54vh] w-full border-0 bg-surface"
          />
        )}
      </div>

      {entries.length > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-3 py-2">
          <button
            type="button"
            aria-label="Isi sebelumnya"
            disabled={index === 0}
            onClick={() => go(index - 1)}
            className="flex size-8 items-center justify-center rounded-control border border-line text-ink transition hover:bg-surface-subtle disabled:opacity-40"
          >
            <ChevronRightIcon className="size-4 rotate-180" />
          </button>
          <p className="min-w-0 truncate text-label text-ink-secondary">
            {index + 1} / {entries.length} · {entries[index]?.name}
          </p>
          <button
            type="button"
            aria-label="Isi berikutnya"
            disabled={index >= entries.length - 1}
            onClick={() => go(index + 1)}
            className="flex size-8 items-center justify-center rounded-control border border-line text-ink transition hover:bg-surface-subtle disabled:opacity-40"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      )}

      {names.length > 0 && (
        <div className="max-h-20 overflow-y-auto border-t border-line bg-surface px-4 py-2">
          <ul className="flex flex-col gap-0.5">
            {names.map((n) => (
              <li key={n} className="truncate text-label text-ink-muted">
                {n}
              </li>
            ))}
          </ul>
          {entries.length > names.length && (
            <p className="mt-1 text-label text-ink-disabled">
              … dan {entries.length - names.length} file lainnya
            </p>
          )}
        </div>
      )}
    </div>
  );
}
