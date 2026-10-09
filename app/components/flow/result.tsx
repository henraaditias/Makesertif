"use client";

import { CheckIcon, ChevronRightIcon, SpinnerIcon } from "../common/icons";
import { fontStack } from "@/lib/fonts";
import type { HistoryEntry } from "@/lib/storage";
import { useTemplateScale } from "./use-template-scale";
import type { DataRow, FieldConfig, ResultPhase } from "./types";

export interface ResultProps {
  image: string | null;
  fields: FieldConfig[];
  rows: DataRow[];
  phase: ResultPhase;
  /** Pesan error generate */
  error: string | null;
  /** Indeks baris yang DIKECUALIKAN dari PDF (kosong = semua terpilih) */
  excludedRows: Set<number>;
  /** Baris yang sedang ditampilkan di preview */
  previewIndex: number;
  onPreviewIndexChange: (index: number) => void;
  onToggleExclude: (index: number) => void;
  onToggleAll: () => void;
  /** Log generate dari gc:history */
  history: HistoryEntry[];
  /** Unduh ulang salinan PDF dari gc:pdfs */
  onDownloadHistory: (entry: HistoryEntry) => void;
}

/**
 * Step 4 — Complete the process (Design.md "Preview data" + hasil generate).
 * Komponen presentational: state fase/seleksi/generate hidup di wizard
 * sehingga tombol primary di action bar bisa label & loading dari fase yang sama.
 */
export default function Result({
  image,
  fields,
  rows,
  phase,
  error,
  excludedRows,
  previewIndex,
  onPreviewIndexChange,
  onToggleExclude,
  onToggleAll,
  history,
  onDownloadHistory,
}: ResultProps) {
  const { layerRef, imgRef, scale } = useTemplateScale(image);

  const safeIndex = Math.min(previewIndex, Math.max(rows.length - 1, 0));
  const currentRow = rows[safeIndex] ?? {};
  const selectedCount = rows.length - excludedRows.size;
  const allSelected = excludedRows.size === 0;
  const isPreparing = phase === "preparing";

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Preview sertifikat untuk baris aktif */}
      <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-panel border border-line bg-surface-subtle p-4">
        {image ? (
          <div ref={layerRef} className="relative inline-block max-w-full">
            {/* URL blob lokal — tidak bisa dioptimasi next/image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={image}
              alt="Preview sertifikat"
              draggable={false}
              className="block max-h-[340px] w-auto max-w-full rounded-control border border-line"
            />
            {fields.map((field) => (
              <div
                key={field.id}
                role="presentation"
                className="absolute whitespace-nowrap rounded-detail"
                style={{
                  left: `${field.x}%`,
                  top: `${field.y}%`,
                  fontSize: `${field.fontSize * scale}px`,
                  fontFamily: fontStack(field.fontFamily),
                  fontWeight: field.fontWeight,
                  color: field.color,
                  lineHeight: 1.1,
                }}
              >
                {currentRow[field.columnKey] || field.columnKey}
              </div>
            ))}
            {isPreparing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-control bg-surface/90">
                <SpinnerIcon className="size-6 animate-spin text-action" />
                <span className="text-label text-ink-muted">
                  Preparing preview...
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-body text-ink-disabled">Template belum tersedia.</p>
        )}
      </div>

      {/* Kontrol seleksi baris + navigator preview */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-body text-ink">
          <input
            type="checkbox"
            checked={!excludedRows.has(safeIndex)}
            onChange={() => onToggleExclude(safeIndex)}
            className="size-4 accent-accent"
          />
          Include row {safeIndex + 1}
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Baris sebelumnya"
            disabled={safeIndex === 0}
            onClick={() => onPreviewIndexChange(safeIndex - 1)}
            className="flex size-8 items-center justify-center rounded-control border border-line-strong text-ink-secondary transition hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronRightIcon className="size-4 rotate-180" />
          </button>
          <span className="min-w-16 text-center text-label text-ink tabular-nums">
            {safeIndex + 1} / {rows.length}
          </span>
          <button
            type="button"
            aria-label="Baris berikutnya"
            disabled={safeIndex >= rows.length - 1}
            onClick={() => onPreviewIndexChange(safeIndex + 1)}
            className="flex size-8 items-center justify-center rounded-control border border-line-strong text-ink-secondary transition hover:bg-surface-subtle disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 text-label">
          <span className="text-ink-muted">
            {selectedCount} of {rows.length} selected
          </span>
          <button
            type="button"
            onClick={onToggleAll}
            className="text-action underline underline-offset-2 transition hover:text-accent"
          >
            {allSelected ? "Clear selection" : "select all rows"}
          </button>
        </div>
      </div>

      {/* Status generate */}
      {phase === "done" && (
        <div className="flex items-center gap-2 rounded-panel bg-blue-surface px-4 py-3 text-body text-ink">
          <CheckIcon className="size-4 shrink-0 text-action" />
          PDF berhasil diunduh ({selectedCount} halaman).
        </div>
      )}
      {phase === "error" && error && (
        <p className="text-body text-danger">{error}</p>
      )}
      {selectedCount > 100 && phase !== "error" && (
        <p className="text-label text-ink-muted">
          {selectedCount} halaman — proses generate bisa memakan waktu.
        </p>
      )}

      {/* Riwayat generate (gc:history) — unduh ulang salinan bila muat kuota */}
      {history.length > 0 && (
        <div className="rounded-panel border border-line bg-surface p-4">
          <h3 className="mb-3 text-label text-ink">History</h3>
          <ul className="flex flex-col gap-2">
            {history.slice(0, 5).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 text-body"
              >
                <span className="truncate text-ink-secondary">
                  {entry.fileName} · {entry.pages} pages ·{" "}
                  {new Date(entry.at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {entry.hasPdf ? (
                  <button
                    type="button"
                    onClick={() => onDownloadHistory(entry)}
                    className="shrink-0 text-label text-action underline underline-offset-2 transition hover:text-accent"
                  >
                    Download
                  </button>
                ) : (
                  <span className="shrink-0 text-label text-ink-disabled">
                    no copy
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
