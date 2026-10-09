"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { PlusIcon } from "../common/icons";
import { useTemplateScale } from "./use-template-scale";
import {
  FONT_CHOICES,
  FONT_COLORS,
  fontStack,
  type FontWeight,
} from "@/lib/fonts";
import type { DataRow, FieldConfig } from "./types";

export interface EditCanvasProps {
  image: string | null;
  headers: string[];
  rows: DataRow[];
  fields: FieldConfig[];
  onAddField: (columnKey: string) => void;
  onRemoveField: (id: string) => void;
  onUpdateField: (id: string, patch: Partial<FieldConfig>) => void;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Step 3 — Designing on a canvas (Design.md).
 * Kiri: template + overlay field teks (drag pointer, posisi % relatif template).
 * Font dirender memakai skala tampilan (ukuran px asli × scale), sehingga
 * posisi/ukuran di layar konsisten saat dirender ke PDF pada ukuran natural.
 * Kanan: panel field (tambah/pilih kolom/hapus) + Font Size, Font Family, Font Color.
 */
export default function EditCanvas({
  image,
  headers,
  rows,
  fields,
  onAddField,
  onRemoveField,
  onUpdateField,
}: EditCanvasProps) {
  const { layerRef, imgRef, scale } = useTemplateScale(image);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = fields.find((f) => f.id === selectedId) ?? fields[0] ?? null;
  const usedColumns = new Set(fields.map((f) => f.columnKey));
  const availableColumns = headers.filter((h) => !usedColumns.has(h));
  const previewRow = rows[0] ?? {};

  const handlePointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    field: FieldConfig,
  ) => {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedId(field.id);
    dragRef.current = {
      id: field.id,
      offsetX: ((e.clientX - rect.left) / rect.width) * 100 - field.x,
      offsetY: ((e.clientY - rect.top) / rect.height) * 100 - field.y,
    };
  };

  const handlePointerMove = (
    e: ReactPointerEvent<HTMLDivElement>,
    field: FieldConfig,
  ) => {
    const drag = dragRef.current;
    const rect = layerRef.current?.getBoundingClientRect();
    if (!drag || !rect || drag.id !== field.id) return;
    onUpdateField(field.id, {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100 - drag.offsetX),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100 - drag.offsetY),
    });
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      {/* Canvas sertifikat */}
      <div className="flex min-h-[420px] flex-1 items-center justify-center rounded-panel border border-line bg-surface-subtle p-4">
        {image ? (
          <div ref={layerRef} className="relative inline-block max-w-full">
            {/* URL blob lokal — tidak bisa dioptimasi next/image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={image}
              alt="Canvas sertifikat"
              draggable={false}
              className="block max-h-[420px] w-auto max-w-full rounded-control border border-line"
            />
            {fields.map((field) => (
              <div
                key={field.id}
                role="presentation"
                onPointerDown={(e) => handlePointerDown(e, field)}
                onPointerMove={(e) => handlePointerMove(e, field)}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={[
                  "absolute cursor-move touch-none select-none whitespace-nowrap rounded-detail transition-shadow",
                  selected?.id === field.id
                    ? "ring-2 ring-accent"
                    : "hover:ring-1 hover:ring-focus",
                ].join(" ")}
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
                {previewRow[field.columnKey] || field.columnKey}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body text-ink-disabled">Template belum tersedia.</p>
        )}
      </div>

      {/* Panel properti — di bawah canvas pada layar <1024px */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[280px]">
        <div>
          <h2 className="text-section text-ink">Designing on a canvas</h2>
          <p className="text-body text-ink-muted">
            drag and drop your data fields
          </p>
        </div>

        {/* Daftar field: pilih kolom per chip + pilih chip aktif */}
        <div className="flex flex-col gap-3 rounded-panel bg-blue-surface p-4">
          {fields.length === 0 && (
            <p className="text-body text-ink-muted">
              Belum ada field. Klik Add field untuk menempelkan kolom data.
            </p>
          )}
          {fields.map((field) => (
            <div
              key={field.id}
              onClick={() => setSelectedId(field.id)}
              className={[
                "flex cursor-pointer items-center gap-3 rounded-control bg-indigo-surface p-3 transition",
                selected?.id === field.id
                  ? "ring-2 ring-primary"
                  : "hover:opacity-80",
              ].join(" ")}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-chip bg-selected text-action">
                <PlusIcon className="size-4" />
              </span>
              <select
                value={field.columnKey}
                onChange={(e) =>
                  onUpdateField(field.id, { columnKey: e.target.value })
                }
                aria-label="Kolom field"
                className="w-full cursor-pointer bg-transparent text-label text-ink focus:outline-none"
              >
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={`Hapus field ${field.columnKey}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveField(field.id);
                }}
                className="shrink-0 text-ink-disabled transition hover:text-danger"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            disabled={availableColumns.length === 0}
            onClick={() => onAddField(availableColumns[0])}
            className="flex items-center gap-3 rounded-control bg-indigo-surface p-3 transition hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="flex size-8 items-center justify-center rounded-chip bg-selected text-action">
              <PlusIcon className="size-4" />
            </span>
            <span className="text-label text-ink">Add field</span>
          </button>
        </div>

        {/* Kontrol field terpilih */}
        <fieldset
          disabled={!selected}
          className="flex flex-col gap-4 rounded-panel bg-blue-surface p-4 disabled:opacity-60"
        >
          <div>
            <div className="mb-2 flex items-center justify-between">
              <legend className="text-label text-ink">Font Size</legend>
              <span className="text-body text-ink-muted">
                {selected ? `${selected.fontSize} px` : "—"}
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={96}
              value={selected?.fontSize ?? 32}
              onChange={(e) =>
                selected &&
                onUpdateField(selected.id, { fontSize: Number(e.target.value) })
              }
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-label text-ink">Font Family</label>
            <select
              value={
                selected ? `${selected.fontFamily}|${selected.fontWeight}` : ""
              }
              onChange={(e) => {
                if (!selected) return;
                const [family, weight] = e.target.value.split("|");
                onUpdateField(selected.id, {
                  fontFamily: family,
                  fontWeight: Number(weight) as FontWeight,
                });
              }}
              className="w-full rounded-control border border-line-strong bg-surface px-3 py-2.5 text-body text-ink focus:border-focus focus:outline-none"
            >
              {FONT_CHOICES.map((choice) => (
                <option
                  key={choice.label}
                  value={`${choice.family}|${choice.weight}`}
                >
                  {choice.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-2 block text-label text-ink">Font Color</span>
            <div className="flex gap-2">
              {FONT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  aria-label={color.label}
                  title={color.label}
                  onClick={() =>
                    selected && onUpdateField(selected.id, { color: color.value })
                  }
                  className={[
                    "size-6 rounded-full border border-line-strong transition",
                    selected?.color === color.value
                      ? "ring-2 ring-primary ring-offset-1"
                      : "hover:opacity-80",
                  ].join(" ")}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>
        </fieldset>
      </aside>
    </div>
  );
}
