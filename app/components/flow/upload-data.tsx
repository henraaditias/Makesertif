"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import FadeIn from "../common/fade-in";
import {
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
  onPickFile: () => void;
  onFile: (file: File) => void;
  onSubmitSheet: () => void;
  linkInputRef?: RefObject<HTMLInputElement | null>;
}

const SOURCES: { id: DataSource; label: string }[] = [
  { id: "csv", label: "File CSV" },
  { id: "sheets", label: "Google Sheets" },
];

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
          <span className="text-body text-ink-muted">Memuat data...</span>
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
            {dragging
              ? "Jatuhkan file di sini"
              : "Klik untuk unggah atau seret dan jatuhkan"}
          </span>
          <span className="text-body text-ink-disabled">
            File CSV kamu
          </span>
        </button>
      ) : (
        <div
          className={`flex w-full flex-1 flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed px-6 py-10 short:py-4 text-center transition ${error ? "border-danger bg-surface" : "border-line bg-surface"}`}
        >
          <TableIcon className="size-7 text-ink-muted" />
          <span className="text-body text-ink-muted">
            Tempel link Google Sheets yang dibagikan ke publik
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

      {error && (
        <FadeIn key={error} effect="pop" className="w-full text-center">
          <p className="text-label text-danger">{error}</p>
        </FadeIn>
      )}

      {rows.length === 0 && (
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

const VIRTUAL_THRESHOLD = 100;
const OVERSCAN = 10;
const ROW_ESTIMATE = 35;
const VIEWPORT_ESTIMATE = 400;

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: DataRow[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const [rowH, setRowH] = useState(ROW_ESTIMATE);
  const [viewportH, setViewportH] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) {
        const h = el.clientHeight;
        setViewportH((prev) => (Math.abs(prev - h) > 1 ? h : prev));
      }
      const first = tbodyRef.current?.querySelector("tr[data-vrow]");
      if (first) {
        const h = first.getBoundingClientRect().height;
        setRowH((prev) => (Math.abs(prev - h) > 0.5 ? h : prev));
      }
    });
    return () => cancelAnimationFrame(id);
  }, [rows, headers]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      const h = el.clientHeight;
      setViewportH((prev) => (Math.abs(prev - h) > 1 ? h : prev));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollRef.current;
      if (el) setScrollTop(el.scrollTop);
    });
  };

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const virtual = rows.length > VIRTUAL_THRESHOLD;
  const viewport = viewportH > 0 ? viewportH : VIEWPORT_ESTIMATE;
  const start = virtual
    ? Math.min(
        Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN),
        Math.max(0, rows.length - 1),
      )
    : 0;
  const end = virtual
    ? Math.min(
        rows.length,
        start + Math.ceil(viewport / rowH) + OVERSCAN * 2,
      )
    : rows.length;
  const slice = virtual ? rows.slice(start, end) : rows;
  const topPad = virtual ? start * rowH : 0;
  const bottomPad = virtual ? (rows.length - end) * rowH : 0;
  const colSpan = headers.length + 1;

  return (
    <div className="flex w-full flex-1 flex-col overflow-hidden rounded-control border border-line">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-surface-subtle px-4 py-2 text-body">
        <span className="text-ink-secondary">
          {rows.length} rows · {headers.length} columns
        </span>
        <span className="text-ink-disabled">Preview data</span>
      </div>
      <div
        ref={scrollRef}
        onScroll={virtual ? handleScroll : undefined}
        className="min-h-0 flex-1 overflow-auto"
      >
        <table className="w-full border-collapse text-body">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 w-10 border-b border-line bg-surface-subtle px-3 py-2 text-right text-label text-ink-muted">
                #
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="sticky top-0 z-10 border-b border-line bg-surface-subtle px-3 py-2 text-left text-label text-ink whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody ref={tbodyRef}>
            {topPad > 0 && (
              <tr aria-hidden="true">
                <td colSpan={colSpan} style={{ height: topPad }} />
              </tr>
            )}
            {slice.map((row, i) => {
              const index = start + i;
              return (
                <tr
                  key={index}
                  data-vrow="1"
                  className={index % 2 === 1 ? "bg-surface-subtle" : undefined}
                >
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
              );
            })}
            {bottomPad > 0 && (
              <tr aria-hidden="true">
                <td colSpan={colSpan} style={{ height: bottomPad }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
