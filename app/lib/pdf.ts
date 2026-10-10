import { jsPDF } from "jspdf";
import type {
  DataRow,
  FieldConfig,
  TemplateSide,
} from "@/components/flow/types";
import { fieldSide } from "@/components/flow/types";
import { fontStack } from "./fonts";
import { wrapLines } from "./text-wrap";

/** Render A4 landscape pada 150 DPI → 1754×1240 px per halaman */
const PDF_DPI = 150;
const PAGE_W_MM = 297;
const PAGE_H_MM = 210;
const MM_PER_INCH = 25.4;

export interface CertificatePdfInput {
  /** Object URL template depan (wajib) */
  frontUrl: string;
  /** Object URL template belakang (opsional) */
  backUrl?: string | null;
  fields: FieldConfig[];
  /** Baris terpilih saja, urut seperti aslinya — per baris: depan (→ belakang) */
  rows: DataRow[];
}

/** Hasil render PNG per sisi — dipakai opsi "Gambar (ZIP)" */
export interface RowPng {
  side: TemplateSide;
  blob: Blob;
}

interface PageCanvas {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  pxW: number;
  pxH: number;
}

/**
 * Render PDF — dipakai 3 opsi unduhan (AGENTS.md):
 * - PDF gabungan: semua baris → multi-halaman (halaman depan, lalu belakang bila ada).
 * - PDF satuan: cukup panggil dengan `rows: [row]` → 1 file per sertifikat.
 * - PNG: lihat renderRowPngs.
 * Template digambar "contain" (letterbox putih) di tengah halaman.
 * Posisi field dalam % relatif terhadap gambar template.
 * fontSize (px natural template) × skala gambar → konsisten dengan
 * yang terlihat di canvas editor (lihat use-template-scale).
 */
export async function buildCertificatePdf({
  frontUrl,
  backUrl,
  fields,
  rows,
}: CertificatePdfInput): Promise<jsPDF> {
  await loadFontsUsed(fields);
  const front = await loadImage(frontUrl);
  const back = backUrl ? await loadImage(backUrl) : null;
  const { canvas, ctx, pxW, pxH } = createPageCanvas();

  const frontFields = fields.filter((f) => fieldSide(f) === "front");
  const backFields = back
    ? fields.filter((f) => fieldSide(f) === "back")
    : [];

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  rows.forEach((row, index) => {
    if (index > 0) pdf.addPage("a4", "landscape");

    drawSide(ctx, front, frontFields, row, pxW, pxH);
    pdf.addImage(canvas, "JPEG", 0, 0, PAGE_W_MM, PAGE_H_MM, undefined, "FAST");

    if (back) {
      pdf.addPage("a4", "landscape");
      drawSide(ctx, back, backFields, row, pxW, pxH);
      pdf.addImage(
        canvas,
        "JPEG",
        0,
        0,
        PAGE_W_MM,
        PAGE_H_MM,
        undefined,
        "FAST",
      );
    }
  });

  return pdf;
}

/**
 * Render satu baris jadi PNG per sisi (depan, dan belakang bila ada).
 * Ukuran piksel = halaman A4 150 DPI — sama dengan render PDF.
 */
export async function renderRowPngs({
  frontUrl,
  backUrl,
  fields,
  row,
}: Omit<CertificatePdfInput, "rows"> & { row: DataRow }): Promise<RowPng[]> {
  await loadFontsUsed(fields);
  const front = await loadImage(frontUrl);
  const back = backUrl ? await loadImage(backUrl) : null;
  const { canvas, ctx, pxW, pxH } = createPageCanvas();

  const out: RowPng[] = [];

  drawSide(
    ctx,
    front,
    fields.filter((f) => fieldSide(f) === "front"),
    row,
    pxW,
    pxH,
  );
  out.push({ side: "front", blob: await canvasToPng(canvas) });

  if (back) {
    drawSide(
      ctx,
      back,
      fields.filter((f) => fieldSide(f) === "back"),
      row,
      pxW,
      pxH,
    );
    out.push({ side: "back", blob: await canvasToPng(canvas) });
  }

  return out;
}

/** Kanvas halaman A4 landscape 150 DPI + konteks 2D */
function createPageCanvas(): PageCanvas {
  const pxW = Math.round((PAGE_W_MM / MM_PER_INCH) * PDF_DPI);
  const pxH = Math.round((PAGE_H_MM / MM_PER_INCH) * PDF_DPI);
  const canvas = document.createElement("canvas");
  canvas.width = pxW;
  canvas.height = pxH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak didukung browser ini.");
  return { canvas, ctx, pxW, pxH };
}

/** Gambar satu sisi (template contain + field sisi itu) ke kanvas halaman */
function drawSide(
  ctx: CanvasRenderingContext2D,
  template: HTMLImageElement,
  sideFields: FieldConfig[],
  row: DataRow,
  pxW: number,
  pxH: number,
): void {
  // Skala contain — jaga rasio, pusatkan di halaman
  const scale = Math.min(
    pxW / template.naturalWidth,
    pxH / template.naturalHeight,
  );
  const drawW = template.naturalWidth * scale;
  const drawH = template.naturalHeight * scale;
  const drawX = (pxW - drawW) / 2;
  const drawY = (pxH - drawH) / 2;

  // Kertas putih dulu (template PNG bisa transparan)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, pxW, pxH);
  ctx.drawImage(template, drawX, drawY, drawW, drawH);

  for (const field of sideFields) {
    const text = row[field.columnKey] ?? "";
    if (!text) continue;
    const fontSize = field.fontSize * scale;
    ctx.font = `${field.fontWeight} ${fontSize}px ${fontStack(field.fontFamily)}`;
    ctx.fillStyle = field.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const x = drawX + (field.x / 100) * drawW;
    // Lebar kotak: handle user (field.width) atau sisa ruang ke tepi kanan —
    // konsisten dengan `width` di DOM canvas & preview
    const widthPct = field.width ?? 100 - field.x;
    const maxWidth = (widthPct / 100) * drawW;
    const lines = wrapLines(
      (s) => ctx.measureText(s).width,
      text,
      maxWidth,
    );
    // Line-height 1.1; +5% fontSize = kompensasi setengah leading di DOM
    const lineHeight = fontSize * 1.1;
    const y0 = drawY + (field.y / 100) * drawH + fontSize * 0.05;
    lines.forEach((line, index) => {
      ctx.fillText(line, x, y0 + index * lineHeight);
    });
  }
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Gagal render PNG.")),
      "image/png",
    );
  });
}

/** Font web (Inter) harus sudah ter-load sebelum digambar ke canvas */
async function loadFontsUsed(fields: FieldConfig[]) {
  if (typeof document === "undefined" || !document.fonts) return;
  const specs = new Set(
    fields.map((field) => `${field.fontWeight} 32px ${fontStack(field.fontFamily)}`),
  );
  await Promise.all(
    [...specs].map((spec) => document.fonts.load(spec).catch(() => {})),
  );
  await document.fonts.ready.catch(() => {});
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar template."));
    img.src = src;
  });
}
