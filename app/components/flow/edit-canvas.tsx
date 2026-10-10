"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { PaletteIcon, PlusIcon } from "../common/icons";
import { useTemplateScale } from "./use-template-scale";
import {
  DEFAULT_TEXT_COLOR,
  FONT_CHOICES,
  FONT_COLORS,
  fontStack,
  hexToRgb,
  parseColorInput,
  type FontWeight,
} from "@/lib/fonts";
import type { DataRow, FieldConfig, TemplateSide } from "./types";
import { fieldSide } from "./types";

export interface EditCanvasProps {
  /** Object URL template depan */
  image: string | null;
  /** Object URL template belakang (opsional) */
  imageBack: string | null;
  headers: string[];
  rows: DataRow[];
  fields: FieldConfig[];
  /** Tambah field ke sisi yang sedang diedit */
  onAddField: (columnKey: string, side: TemplateSide) => void;
  onRemoveField: (id: string) => void;
  onUpdateField: (id: string, patch: Partial<FieldConfig>) => void;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

const SIDES: { id: TemplateSide; label: string }[] = [
  { id: "front", label: "Depan" },
  { id: "back", label: "Belakang" },
];

/**
 * Step 3 — Designing on a canvas (Design.md).
 * Kiri: tab sisi (Depan/Belakang) + template + overlay field teks
 * (drag pointer, posisi % relatif template sisi aktif).
 * Font dirender memakai skala tampilan (ukuran px asli × scale), sehingga
 * posisi/ukuran di layar konsisten saat dirender ke PDF pada ukuran natural.
 * Kanan: panel field (tambah/pilih kolom/hapus) + Font Size, Font Family,
 * Font Color (swatch + color picker + input HEX & readout RGB).
 */
export default function EditCanvas({
  image,
  imageBack,
  headers,
  rows,
  fields,
  onAddField,
  onRemoveField,
  onUpdateField,
}: EditCanvasProps) {
  const [activeSide, setActiveSide] = useState<TemplateSide>("front");
  const [hexDraft, setHexDraft] = useState<{ id: string; value: string } | null>(
    null,
  );

  // Template belakang dihapus di luar → kembali aman ke sisi depan
  const currentSide: TemplateSide =
    activeSide === "back" && !imageBack ? "front" : activeSide;
  const activeImage = currentSide === "front" ? image : imageBack;
  const sideFields = fields.filter((f) => fieldSide(f) === currentSide);

  const { layerRef, imgRef, scale } = useTemplateScale(activeImage);
  const dragRef = useRef<{
    id: string;
    mode: "move" | "resize";
    /** move: offset pointer − posisi field (dalam % template) */
    offsetX: number;
    offsetY: number;
    /** resize: pointer & lebar awal (dalam % template) */
    pointerStartX?: number;
    widthStart?: number;
  } | null>(null);
  // Ref DOM per field — untuk mengukur tinggi kotak teks saat drag/resize
  const fieldRefs = useRef(new Map<string, HTMLDivElement>());

  /** Lebar kotak field (%) — default membentang ke tepi kanan */
  const fieldWidth = (f: FieldConfig) => f.width ?? 100 - f.x;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    sideFields.find((f) => f.id === selectedId) ?? sideFields[0] ?? null;
  const usedColumns = new Set(sideFields.map((f) => f.columnKey));
  const availableColumns = headers.filter((h) => !usedColumns.has(h));
  const previewRow = rows[0] ?? {};

  const activeColor =
    (selected && parseColorInput(selected.color)) || DEFAULT_TEXT_COLOR;
  const rgb = hexToRgb(activeColor);
  const hexText =
    hexDraft && selected && hexDraft.id === selected.id
      ? hexDraft.value
      : activeColor.toUpperCase();

  const applyColor = (color: string) => {
    setHexDraft(null);
    if (selected) onUpdateField(selected.id, { color });
  };

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
      mode: "move",
      offsetX: ((e.clientX - rect.left) / rect.width) * 100 - field.x,
      offsetY: ((e.clientY - rect.top) / rect.height) * 100 - field.y,
    };
  };

  /** Mulai ubah lebar kotak teks (handle kanan-bawah) — di dalam foto saja */
  const handleResizeDown = (
    e: ReactPointerEvent<HTMLSpanElement>,
    field: FieldConfig,
  ) => {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.preventDefault();
    e.stopPropagation(); // jangan ikut memulai drag pindah
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedId(field.id);
    dragRef.current = {
      id: field.id,
      mode: "resize",
      offsetX: 0,
      offsetY: 0,
      pointerStartX: ((e.clientX - rect.left) / rect.width) * 100,
      widthStart: fieldWidth(field),
    };
  };

  /** Clamp Y agar tepi bawah kotak (bisa multi-baris) tetap dalam foto */
  const clampYInPhoto = (y: number, fieldId: string, rectHeight: number) => {
    const box = fieldRefs.current.get(fieldId);
    if (!box || box.offsetHeight <= 0) return y;
    const boxPct = (box.offsetHeight / rectHeight) * 100;
    return Math.min(y, Math.max(0, 100 - boxPct));
  };

  const handlePointerMove = (
    e: ReactPointerEvent<HTMLDivElement>,
    field: FieldConfig,
  ) => {
    const drag = dragRef.current;
    const rect = layerRef.current?.getBoundingClientRect();
    if (!drag || !rect || drag.id !== field.id || drag.mode !== "move") return;
    // Bila lebar sudah diatur user, x dibatasi agar `x + width ≤ 100`
    const maxX = field.width != null ? Math.max(0, 100 - field.width) : 100;
    const x = Math.min(
      clamp(((e.clientX - rect.left) / rect.width) * 100 - drag.offsetX),
      maxX,
    );
    const y = clampYInPhoto(
      clamp(((e.clientY - rect.top) / rect.height) * 100 - drag.offsetY),
      field.id,
      rect.height,
    );
    onUpdateField(field.id, { x, y });
  };

  const handleResizeMove = (
    e: ReactPointerEvent<HTMLSpanElement>,
    field: FieldConfig,
  ) => {
    const drag = dragRef.current;
    const rect = layerRef.current?.getBoundingClientRect();
    if (!drag || !rect || drag.id !== field.id || drag.mode !== "resize") return;
    if (drag.pointerStartX == null || drag.widthStart == null) return;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    // Batas: 5% … (100 − x) — kotak tidak pernah melewati tepi kanan foto
    const maxW = Math.max(1, 100 - field.x);
    const minW = Math.min(5, maxW);
    const rawW = drag.widthStart + (px - drag.pointerStartX);
    const width = Math.min(Math.max(rawW, minW), maxW);
    onUpdateField(field.id, {
      width,
      y: clampYInPhoto(field.y, field.id, rect.height),
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
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {/* Tab sisi — belakang aktif hanya bila template belakang ada */}
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
              disabled={item.id === "back" && !imageBack}
              onClick={() => setActiveSide(item.id)}
              className={[
                "rounded-chip px-4 py-2 text-label transition disabled:pointer-events-none disabled:opacity-50",
                currentSide === item.id
                  ? "bg-selected text-ink"
                  : "text-ink-muted hover:text-ink",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-105 flex-1 items-center justify-center rounded-panel border border-line bg-surface-subtle p-4">
          {activeImage ? (
            <div ref={layerRef} className="relative inline-block max-w-full">
              {/* URL blob lokal — tidak bisa dioptimasi next/image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={activeImage}
                alt={`Canvas sertifikat sisi ${currentSide}`}
                draggable={false}
                className="block max-h-105 w-auto max-w-full rounded-control border border-line"
              />
              {sideFields.map((field) => (
                <div
                  key={field.id}
                  role="presentation"
                  ref={(el) => {
                    if (el) fieldRefs.current.set(field.id, el);
                    else fieldRefs.current.delete(field.id);
                  }}
                  onPointerDown={(e) => handlePointerDown(e, field)}
                  onPointerMove={(e) => handlePointerMove(e, field)}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className={[
                    "absolute cursor-move touch-none select-none whitespace-pre-wrap break-words rounded-detail transition-shadow leading-[1.1]",
                    // Nilai dinamis (drag %, ukuran font, warna/font terpilih)
                    // dilempar sebagai CSS variable lalu dikonsumsi kelas
                    // arbitrary value di bawah — styling tetap di Tailwind
                    "left-[var(--fx)] top-[var(--fy)] w-[var(--fw)] text-[length:var(--fs)]",
                    "font-[family-name:var(--ff)] text-[color:var(--fc)]",
                    field.fontWeight === 700 ? "font-bold" : "font-normal",
                    selected?.id === field.id
                      ? "ring-2 ring-accent"
                      : "hover:ring-1 hover:ring-focus",
                  ].join(" ")}
                  style={
                    {
                      "--fx": `${field.x}%`,
                      "--fy": `${field.y}%`,
                      // Lebar dari handle user, atau sisa ruang ke tepi kanan —
                      // teks membungkus, tidak pernah keluar batas foto (Design.md)
                      "--fw": `${fieldWidth(field)}%`,
                      "--fs": `${field.fontSize * scale}px`,
                      "--ff": fontStack(field.fontFamily),
                      "--fc": field.color,
                    } as CSSProperties
                  }
                >
                  {previewRow[field.columnKey] || field.columnKey}
                  {/* Handle ubah lebar kotak teks — hanya field terpilih */}
                  {selected?.id === field.id && (
                    <span
                      role="presentation"
                      title="Ubah lebar teks"
                      onPointerDown={(e) => handleResizeDown(e, field)}
                      onPointerMove={(e) => handleResizeMove(e, field)}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className="absolute bottom-0 right-0 size-3.5 cursor-nwse-resize touch-none rounded-detail border border-accent bg-surface shadow-card transition hover:ring-2 hover:ring-accent"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-ink-disabled">Template belum tersedia.</p>
          )}
        </div>
      </div>

      {/* Panel properti — di bawah canvas pada layar <1024px */}
      <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-70">
        <div>
          <h2 className="text-section text-ink">Designing on a canvas</h2>
          <p className="text-body text-ink-muted">
            drag and drop your data fields
          </p>
        </div>

        {/* Daftar field sisi aktif: pilih kolom per chip + pilih chip aktif */}
        <div className="flex flex-col gap-3 rounded-panel bg-blue-surface p-4">
          {sideFields.length === 0 && (
            <p className="text-body text-ink-muted">
              Belum ada field. Klik Add field untuk menempelkan kolom data.
            </p>
          )}
          {sideFields.map((field) => (
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
            onClick={() => onAddField(availableColumns[0], currentSide)}
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
            <div className="flex flex-wrap items-center gap-2">
              {/* Swatch cepat (Design.md) — aktif = warna field */}
              {FONT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  aria-label={color.label}
                  title={color.label}
                  onClick={() => applyColor(color.value)}
                  className={[
                    "size-6 rounded-full border border-line-strong transition",
                    color.className,
                    activeColor === parseColorInput(color.value)
                      ? "ring-2 ring-primary ring-offset-1"
                      : "hover:opacity-80",
                  ].join(" ")}
                />
              ))}

              {/* Color picker native — sengaja dibentuk kotak berbingkai + ikon
                  palet agar tidak disamakan dengan swatch bulat di kirinya */}
              <label
                title="Pilih warna lain"
                className="relative flex size-7 cursor-pointer items-center justify-center rounded-chip border border-line-strong bg-surface transition hover:border-focus"
              >
                <PaletteIcon className="size-4 text-ink-muted" />
                <input
                  type="color"
                  aria-label="Color picker"
                  value={activeColor}
                  onChange={(e) => applyColor(e.target.value)}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
              </label>

              {/* HEX editable — commit saat valid, reset saat blur */}
              <input
                type="text"
                aria-label="Hex color"
                spellCheck={false}
                value={hexText}
                onChange={(e) => {
                  if (!selected) return;
                  const value = e.target.value;
                  setHexDraft({ id: selected.id, value });
                  const parsed = parseColorInput(value);
                  if (parsed) onUpdateField(selected.id, { color: parsed });
                }}
                onBlur={() => setHexDraft(null)}
                placeholder="#111827"
                className="w-24 rounded-control border border-line-strong bg-surface px-2 py-1.5 text-body text-ink focus:border-focus focus:outline-none"
              />

              {/* Readout RGB dari warna aktif */}
              <span className="text-body text-ink-muted tabular-nums">
                {rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : "—"}
              </span>
            </div>
          </div>
        </fieldset>
      </aside>
    </div>
  );
}
