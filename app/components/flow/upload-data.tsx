"use client";

import type { RefObject } from "react";
import Button from "../common/button";
import {
  FileTextIcon,
  SendIcon,
  SpinnerIcon,
  TableIcon,
} from "../common/icons";
import { useFileDrop } from "./use-file-drop";
import type { DataSource, DataRow } from "./types";

export interface UploadDataProps {
  source: DataSource;
  sheetUrl: string;
  headers: string[];
  rows: DataRow[];
  loading: boolean;
  error: string | null;
  onSourceChange: (source: DataSource) => void;
  onSheetUrlChange: (url: string) => void;
  /** Buka file picker CSV (milik wizard) */
  onPickFile: () => void;
  /** Hasil drop CSV langsung ke zone */
  onFile: (file: File) => void;
  onSubmitSheet: () => void;
  /** Aksi ganti data setelah upload — tampil sebagai tombol "Ubah File" di posisi toggle: kembali ke tampilan awal (zone kosong / input link) */
  onChangeData: () => void;
  /** Ref input link — wizard memakainya untuk fokus ulang saat Ganti data (mode Sheets) */
  linkInputRef?: RefObject<HTMLInputElement | null>;
}

const SOURCES: { id: DataSource; label: string }[] = [
  { id: "csv", label: "File CSV" },
  { id: "sheets", label: "Google Sheets" },
];

/**
 * Step 2 — Entering data (Design.md "Upload Card" + preview data).
 * State: empty (per sumber), loading, error, dan table preview.
 * Parsing CSV di app/lib/csv.ts; fetch Sheets di app/lib/sheets.ts (CORS gviz).
 */
export default function UploadData({
  source,
  sheetUrl,
  headers,
  rows,
  loading,
  error,
  onSourceChange,
  onSheetUrlChange,
  onPickFile,
  onFile,
  onSubmitSheet,
  onChangeData,
  linkInputRef,
}: UploadDataProps) {
  const { dragging, dropProps } = useFileDrop(onFile);

  const zoneBorder = dragging
    ? "border-focus bg-indigo-surface"
    : error
      ? "border-danger bg-surface"
      : "border-line bg-surface hover:border-focus";

  return (
    <div className="flex flex-1 flex-col items-center gap-6">
      {loading ? (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-3 rounded-panel border-2 border-dashed border-line bg-surface">
          <SpinnerIcon className="size-7 animate-spin text-action" />
          <span className="text-body text-ink-muted">Loading data...</span>
        </div>
      ) : rows.length > 0 ? (
        <DataTable headers={headers} rows={rows} />
      ) : source === "csv" ? (
        <button
          type="button"
          onClick={onPickFile}
          {...dropProps}
          className={`flex w-full flex-1 flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed text-center transition ${zoneBorder}`}
        >
          <TableIcon
            className={`size-7 ${dragging ? "text-action" : "text-ink-muted"}`}
          />
          <span className="text-body text-ink-muted">
            {dragging ? "Drop your file here" : "Click to upload or drag and drop"}
          </span>
          <span className="text-body text-ink-disabled">Our File CSV</span>
        </button>
      ) : (
        <div
          className={`flex w-full flex-1 flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed px-6 py-10 text-center transition ${error ? "border-danger bg-surface" : "border-line bg-surface"}`}
        >
          <TableIcon className="size-7 text-ink-muted" />
          <span className="text-body text-ink-muted">
            Paste a public Google Sheets link
          </span>
          <div className="relative mt-3 w-full max-w-xl">
            <input
              ref={linkInputRef}
              type="url"
              value={sheetUrl}
              onChange={(e) => onSheetUrlChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmitSheet();
              }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full rounded-control border border-line-strong bg-surface py-3 pl-4 pr-12 text-body text-ink placeholder:text-ink-disabled focus:border-focus focus:outline-none"
            />
            <button
              type="button"
              aria-label="Muat data"
              onClick={onSubmitSheet}
              className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-control text-ink-secondary transition hover:bg-surface-subtle"
            >
              <SendIcon className="size-4" />
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-label text-danger">{error}</p>}

      {/* Setelah data terupload: toggle diganti tombol "Ubah File".
          Sebelum upload: toggle pilih sumber (File CSV / Google Sheets). */}
      {rows.length > 0 ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          iconLeft={<FileTextIcon className="size-4" />}
          onClick={onChangeData}
        >
          Ubah File
        </Button>
      ) : (
        <div className="inline-flex rounded-control bg-blue-surface p-1">
          {SOURCES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSourceChange(item.id)}
              className={[
                "rounded-chip px-4 py-2 text-label transition",
                source === item.id
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
  );
}

/** Tabel preview data — gaya sheet: header sticky, nomor baris, zebra */
function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: DataRow[];
}) {
  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden rounded-control border border-line">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-surface-subtle px-4 py-2 text-body">
        <span className="text-ink-secondary">
          {rows.length} rows · {headers.length} columns
        </span>
        <span className="text-ink-disabled">Preview data</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-body">
          <thead>
            <tr>
              <th className="w-10 border-b border-line bg-surface-subtle px-3 py-2 text-right text-label text-ink-muted">
                #
              </th>
              {headers.map((header) => (
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
                {headers.map((header) => (
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
