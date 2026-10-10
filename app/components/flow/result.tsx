"use client";

import { useState, type CSSProperties } from "react";
import { CheckIcon, ChevronRightIcon, SpinnerIcon } from "../common/icons";
import { fontStack } from "@/lib/fonts";
import { buildFileName } from "@/lib/filename";
import { useTemplateScale } from "./use-template-scale";
import type {
  DataRow,
  DownloadKind,
  FieldConfig,
  ResultPhase,
  TemplateSide,
} from "./types";
import { fieldSide } from "./types";

export interface ResultProps {
  /** Object URL template depan */
  image: string | null;
  /** Object URL template belakang (opsional) */
  imageBack: string | null;
  fields: FieldConfig[];
  rows: DataRow[];
  phase: ResultPhase;
  /** Pesan error generate */
  error: string | null;
  /** Jenis unduhan terakhir — menentukan pesan status "berhasil" */
  lastOutput: DownloadKind | null;
  /** Indeks baris yang DIKECUALIKAN dari PDF (kosong = semua terpilih) */
  excludedRows: Set<number>;
  /** Baris yang sedang ditampilkan di preview */
  previewIndex: number;
  onPreviewIndexChange: (index: number) => void;
  onToggleExclude: (index: number) => void;
  onToggleAll: () => void;
  /** Header kolom — pilihan kolom penamaan file */
  headers: string[];
  /** Kolom penamaan file (`2026-001_{kolom}`) — dipakai PDF satuan & PNG */
  fileNameColumn: string;
  onFileNameColumnChange: (column: string) => void;
}

const SIDES: { id: TemplateSide; label: string }[] = [
  { id: "front", label: "Depan" },
  { id: "back", label: "Belakang" },
];

/**
 * Step 4 — Complete the process (Design.md "Preview data" + hasil generate).
 * Preview per baris (tab Depan/Belakang bila ada template belakang),
 * pilihan kolom penamaan file, dan status generate.
 * 3 opsi unduhan dibuka dari tombol primary "Download" di action bar
 * (menu pilihan — lihat certificate-wizard); state fase/seleksi/generate
 * hidup di wizard sehingga tombol primary bisa label & loading dari fase itu.
 */
export default function Result({
  image,
  imageBack,
  fields,
  rows,
  phase,
  error,
  lastOutput,
  excludedRows,
  previewIndex,
  onPreviewIndexChange,
  onToggleExclude,
  onToggleAll,
  headers,
  fileNameColumn,
  onFileNameColumnChange,
}: ResultProps) {
  const [previewSide, setPreviewSide] = useState<TemplateSide>("front");

  // Template belakang dihapus di luar → kembali aman ke sisi depan
  const currentSide: TemplateSide =
    previewSide === "back" && !imageBack ? "front" : previewSide;
  const activeImage = currentSide === "front" ? image : imageBack;
  const sideFields = fields.filter((f) => fieldSide(f) === currentSide);

  const { layerRef, imgRef, scale } = useTemplateScale(activeImage);

  const safeIndex = Math.min(previewIndex, Math.max(rows.length - 1, 0));
  const currentRow = rows[safeIndex] ?? {};
  const selectedCount = rows.length - excludedRows.size;
  const allSelected = excludedRows.size === 0;
  const isPreparing = phase === "preparing";
  const pageCount = selectedCount * (imageBack ? 2 : 1);
  // Contoh nama: nomor urut baris ini di antara baris terpilih (001, 002, …)
  const chosenBefore = rows
    .slice(0, safeIndex)
    .filter((_, i) => !excludedRows.has(i)).length;
  const sampleName = buildFileName(fileNameColumn, currentRow, chosenBefore);

  const successMessage = (() => {
    if (lastOutput === "zip-pdf") {
      return `${selectedCount} PDF satuan berhasil diunduh (ZIP).`;
    }
    if (lastOutput === "zip-img") {
      return `${pageCount} gambar berhasil diunduh (ZIP).`;
    }
    return `PDF berhasil diunduh (${pageCount} halaman).`;
  })();

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Preview sertifikat untuk baris aktif */}
      <div className="flex flex-1 flex-col gap-3">
        {imageBack && (
          <div
            role="tablist"
            aria-label="Sisi template"
            className="inline-flex self-start rounded-control bg-blue-surface p-1"
          >
            {SIDES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={currentSide === item.id}
                onClick={() => setPreviewSide(item.id)}
                className={[
                  "rounded-chip px-4 py-2 text-label transition",
                  currentSide === item.id
                    ? "bg-selected text-ink"
                    : "text-ink-muted hover:text-ink",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex min-h-90 flex-1 items-center justify-center rounded-panel border border-line bg-surface-subtle p-4">
          {activeImage ? (
            <div ref={layerRef} className="relative inline-block max-w-full">
              {/* URL blob lokal — tidak bisa dioptimasi next/image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={activeImage}
                alt={`Preview sertifikat sisi ${currentSide}`}
                draggable={false}
                className="block max-h-85 w-auto max-w-full rounded-control border border-line"
              />
              {sideFields.map((field) => (
                <div
                  key={field.id}
                  role="presentation"
                  className={[
                    "absolute whitespace-pre-wrap break-words rounded-detail leading-[1.1]",
                    // Nilai dinamis → CSS variable, dikonsumsi kelas arbitrary
                    // value Tailwind (styling tetap di className)
                    "left-[var(--fx)] top-[var(--fy)] w-[var(--fw)] text-[length:var(--fs)]",
                    "font-[family-name:var(--ff)] text-[color:var(--fc)]",
                    field.fontWeight === 700 ? "font-bold" : "font-normal",
                  ].join(" ")}
                  style={
                    {
                      "--fx": `${field.x}%`,
                      "--fy": `${field.y}%`,
                      // Lebar sama dengan canvas (handle user / sisa ruang tepi kanan)
                      "--fw": `${field.width ?? 100 - field.x}%`,
                      "--fs": `${field.fontSize * scale}px`,
                      "--ff": fontStack(field.fontFamily),
                      "--fc": field.color,
                    } as CSSProperties
                  }
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
            <p className="text-body text-ink-disabled">
              Template belum tersedia.
            </p>
          )}
        </div>
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

      {/* Penamaan file: format `2026-001_{kolom}` — user memilih kolomnya.
          Opsi unduhan (PDF gabungan / PDF satuan / PNG) dibuka dari tombol
          Download di action bar. */}
      <div className="rounded-panel border border-line bg-surface p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-label text-ink">
            Nama file — tahun-nomor (001) pilih kolom
          </span>
          <select
            value={fileNameColumn}
            onChange={(e) => onFileNameColumnChange(e.target.value)}
            className="w-full cursor-pointer rounded-control border border-line-strong bg-surface px-3 py-2.5 text-body text-ink focus:border-focus focus:outline-none"
          >
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
          <span className="truncate text-ink-disabled">
            Contoh: {sampleName}.pdf
            {imageBack ? " (+ suffix sisi)" : ""} — nomor urut per unduhan
            (001, 002, …)
          </span>
        </label>
      </div>

      {/* Status generate */}
      {phase === "done" && (
        <div className="flex items-center gap-2 rounded-panel bg-blue-surface px-4 py-3 text-body text-ink">
          <CheckIcon className="size-4 shrink-0 text-action" />
          {successMessage}
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
    </div>
  );
}
