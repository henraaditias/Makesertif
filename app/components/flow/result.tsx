"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { stagger } from "animejs";
import { CheckIcon, ChevronRightIcon, SpinnerIcon } from "../common/icons";
import Segmented from "../common/segmented";
import FadeIn from "../common/fade-in";
import { fontStack } from "@/lib/fonts";
import { buildFileName } from "@/lib/filename";
import {
  QUALITY_PRESETS,
  estimateDurationMs,
  formatDurationMs,
  qualityPixelLabel,
  qualityPreset,
} from "@/lib/quality";
import { animateSafe } from "@/lib/animations";
import { useTemplateScale } from "./use-template-scale";
import type {
  DataRow,
  DownloadKind,
  FieldConfig,
  GenerateProgress,
  QualityLevel,
  ResultPhase,
  TemplateSide,
  TextAlign,
} from "./types";
import { DOWNLOAD_BUTTON_LABEL, fieldAlign, fieldItalic, fieldSide } from "./types";

export interface ResultProps {
  image: string | null;
  imageBack: string | null;
  fields: FieldConfig[];
  rows: DataRow[];
  phase: ResultPhase;
  error: string | null;
  lastOutput: DownloadKind | null;
  excludedRows: Set<number>;
  previewIndex: number;
  onPreviewIndexChange: (index: number) => void;
  onToggleExclude: (index: number) => void;
  onToggleAll: () => void;
  headers: string[];
  fileNameColumn: string;
  onFileNameColumnChange: (column: string) => void;
  downloadFormat: DownloadKind;
  onDownloadFormatChange: (format: DownloadKind) => void;
  quality: QualityLevel;
  onQualityChange: (quality: QualityLevel) => void;
  progress: GenerateProgress | null;
}

const SIDES: { id: TemplateSide; label: string }[] = [
  { id: "front", label: "Depan" },
  { id: "back", label: "Belakang" },
];

const FORMAT_OPTIONS: { id: DownloadKind; label: string; desc: string }[] = [
  { id: "pdf", label: "PDF", desc: "Satu file multi-halaman (A4 landscape)" },
  {
    id: "zip-pdf",
    label: "PDF satuan",
    desc: "Satu file per penerima (2026-001_Nama) → ZIP",
  },
  {
    id: "zip-img",
    label: "PNG",
    desc: "Gambar per sisi per penerima → ZIP",
  },
];

const ALIGN_CLASS: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

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
  downloadFormat,
  onDownloadFormatChange,
  quality,
  onQualityChange,
  progress,
}: ResultProps) {
  const [previewSide, setPreviewSide] = useState<TemplateSide>("front");
  const dotsRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const isGenerating = phase === "generating";
  const activeFormat =
    FORMAT_OPTIONS.find((option) => option.id === downloadFormat) ??
    FORMAT_OPTIONS[0];
  const qualityLabel = qualityPreset(quality).label;

  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  useEffect(() => {
    if (!isGenerating || !progress) return;
    const { done, total, startedAt } = progress;
    const tick = () => {
      setRemainingMs(
        done > 0
          ? ((performance.now() - startedAt) / done) * (total - done)
          : null,
      );
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [isGenerating, progress]);

  useEffect(() => {
    const dots = dotsRef.current;
    if (!isGenerating || !dots) return;
    return animateSafe([...dots.children], {
      translateY: [0, -5],
      duration: 520,
      delay: stagger(130),
      loop: true,
      alternate: true,
      ease: "inOutQuad",
    });
  }, [isGenerating]);

  useEffect(() => {
    if (phase !== "done" || !successRef.current) return;
    return animateSafe(successRef.current, {
      scale: [0.96, 1],
      opacity: [0, 1],
      duration: 460,
      ease: "outBack",
    });
  }, [phase, lastOutput]);

  const currentSide: TemplateSide =
    previewSide === "back" && !imageBack ? "front" : previewSide;
  const activeImage = currentSide === "front" ? image : imageBack;
  const sideFields = fields.filter((f) => fieldSide(f) === currentSide);

  const { layerRef, imgRef, scale } = useTemplateScale(activeImage);

  useEffect(() => {
    if (!layerRef.current) return;
    return animateSafe(layerRef.current, {
      opacity: [0.35, 1],
      duration: 280,
      ease: "outQuad",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSide]);

  const safeIndex = Math.min(previewIndex, Math.max(rows.length - 1, 0));
  const currentRow = rows[safeIndex] ?? {};
  const selectedCount = rows.length - excludedRows.size;
  const allSelected = excludedRows.size === 0;
  const isPreparing = phase === "preparing";
  const pageCount = selectedCount * (imageBack ? 2 : 1);
  const chosenBefore = rows
    .slice(0, safeIndex)
    .filter((_, i) => !excludedRows.has(i)).length;
  const sampleName = buildFileName(fileNameColumn, currentRow, chosenBefore);
  const estimateMs = estimateDurationMs(quality, downloadFormat, selectedCount);

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
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex min-h-90 flex-1 items-center justify-center rounded-panel border border-line bg-surface-subtle p-4 short:min-h-0 short:p-2">
          {activeImage ? (
            <div ref={layerRef} className="relative inline-block max-w-full">
              <img
                ref={imgRef}
                src={activeImage}
                alt={`Preview sertifikat sisi ${currentSide}`}
                draggable={false}
                className="block max-h-85 w-auto max-w-full rounded-control border border-line short:max-h-[46dvh]"
              />
              {sideFields.map((field) => (
                <div
                  key={field.id}
                  role="presentation"
                  className={[
                    "absolute whitespace-pre-wrap break-words rounded-detail leading-[1.1]",
                    "left-[var(--fx)] top-[var(--fy)] w-[var(--fw)] text-[length:var(--fs)]",
                    field.height != null ? "h-[var(--fh)]" : "",
                    "font-[family-name:var(--ff)] text-[color:var(--fc)]",
                    field.fontWeight === 700 ? "font-bold" : "font-normal",
                    fieldItalic(field) ? "italic" : "",
                    ALIGN_CLASS[fieldAlign(field)],
                  ].join(" ")}
                  style={
                    {
                      "--fx": `${field.x}%`,
                      "--fy": `${field.y}%`,
                      "--fw": `${field.width ?? 100 - field.x}%`,
                      "--fh":
                        field.height != null ? `${field.height}%` : undefined,
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
                    Menyiapkan preview...
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-body text-ink">
          <input
            type="checkbox"
            checked={!excludedRows.has(safeIndex)}
            onChange={() => onToggleExclude(safeIndex)}
            className="size-4 accent-accent"
          />
          Sertakan baris {safeIndex + 1}
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
            {selectedCount} dari {rows.length} dipilih
          </span>
          <button
            type="button"
            onClick={onToggleAll}
            className="text-action underline underline-offset-2 transition hover:text-accent"
          >
            {allSelected ? "Kosongkan pilihan" : "pilih semua baris"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-4">
        <div className="flex flex-col gap-2">
          <span className="text-label text-ink">Format file</span>
          <Segmented
            label="Format file"
            options={FORMAT_OPTIONS.map(({ id, label }) => ({ id, label }))}
            value={downloadFormat}
            onChange={(id) => onDownloadFormatChange(id as DownloadKind)}
            disabled={isGenerating}
          />
          <span className="text-body text-ink-muted">{activeFormat.desc}</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-label text-ink">Kualitas</span>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Kualitas render"
              options={QUALITY_PRESETS.map((preset) => ({
                id: preset.id,
                label: preset.label,
              }))}
              value={quality}
              onChange={(id) => onQualityChange(id as QualityLevel)}
              disabled={isGenerating}
            />
            <span className="text-body text-ink-disabled tabular-nums">
              {qualityPixelLabel(quality)} per halaman
            </span>
          </div>
          <span className="text-body text-ink-muted">
            Ketajaman maksimal mengikuti resolusi template.
          </span>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-ink">
            Nama file: tahun-nomor (001) + kolom terpilih
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
            {imageBack ? " (+ suffix sisi)" : ""}, nomor urut per unduhan
            (001, 002, …)
          </span>
        </label>

        <div className="flex flex-col gap-2 rounded-control bg-blue-surface px-3 py-3">
          {isGenerating && progress ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-label text-ink tabular-nums">
                  {progress.done} / {progress.total} halaman
                </span>
                <span className="text-label text-ink-muted tabular-nums">
                  sisa ±{" "}
                  {remainingMs === null
                    ? formatDurationMs(estimateMs)
                    : formatDurationMs(remainingMs)}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={progress.total}
                aria-valuenow={progress.done}
                className="h-2 overflow-hidden rounded-full bg-surface"
              >
                <div
                  className="h-full rounded-full bg-action transition-[width] duration-300 ease-out"
                  style={{
                    width: `${
                      progress.total > 0
                        ? (progress.done / progress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <div ref={dotsRef} className="flex gap-1" aria-hidden>
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="size-1.5 rounded-full bg-action"
                    />
                  ))}
                </div>
                <span className="text-body text-ink-muted">
                  Sedang membuat {qualityLabel}…
                </span>
              </div>
            </>
          ) : (
            <span className="text-body text-ink-muted tabular-nums">
              Perkiraan ± {formatDurationMs(estimateMs)}, {pageCount} halaman
              · kualitas {qualityLabel} · {DOWNLOAD_BUTTON_LABEL[downloadFormat]}
            </span>
          )}
        </div>
      </div>

      {phase === "done" && (
        <div
          ref={successRef}
          className="flex items-center gap-2 rounded-panel bg-blue-surface px-4 py-3 text-body text-ink"
        >
          <CheckIcon className="size-4 shrink-0 text-action" />
          {successMessage}
        </div>
      )}
      {phase === "error" && error && (
        <FadeIn key={error} effect="pop">
          <p className="text-body text-danger">{error}</p>
        </FadeIn>
      )}
    </div>
  );
}
