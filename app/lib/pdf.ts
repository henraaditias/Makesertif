import { jsPDF } from "jspdf";
import type { DataRow, FieldConfig } from "@/components/flow/types";
import { fontStack } from "./fonts";

/** Render A4 landscape pada 150 DPI → 1754×1240 px per halaman */
const PDF_DPI = 150;
const PAGE_W_MM = 297;
const PAGE_H_MM = 210;
const MM_PER_INCH = 25.4;

export interface CertificatePdfInput {
  /** Object URL template */
  imageUrl: string;
  fields: FieldConfig[];
  /** Baris terpilih saja, urut seperti aslinya — satu baris = satu halaman */
  rows: DataRow[];
}

/**
 * Render satu PDF multi-halaman (A4 landscape) — output akhir produk (AGENTS.md).
 * - Template digambar "contain" (letterbox putih) di tengah halaman.
 * - Posisi field dalam % relatif terhadap gambar template.
 * - fontSize (px natural template) × skala gambar → konsisten dengan
 *   yang terlihat di canvas editor (lihat use-template-scale).
 */
export async function buildCertificatePdf({
  imageUrl,
  fields,
  rows,
}: CertificatePdfInput): Promise<jsPDF> {
  await loadFontsUsed(fields);
  const template = await loadImage(imageUrl);

  const pxW = Math.round((PAGE_W_MM / MM_PER_INCH) * PDF_DPI);
  const pxH = Math.round((PAGE_H_MM / MM_PER_INCH) * PDF_DPI);

  const canvas = document.createElement("canvas");
  canvas.width = pxW;
  canvas.height = pxH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak didukung browser ini.");

  // Skala contain — jaga rasio, pusatkan di halaman
  const scale = Math.min(
    pxW / template.naturalWidth,
    pxH / template.naturalHeight,
  );
  const drawW = template.naturalWidth * scale;
  const drawH = template.naturalHeight * scale;
  const drawX = (pxW - drawW) / 2;
  const drawY = (pxH - drawH) / 2;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  rows.forEach((row, index) => {
    if (index > 0) pdf.addPage("a4", "landscape");

    // Kertas putih dulu (template PNG bisa transparan)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, pxW, pxH);
    ctx.drawImage(template, drawX, drawY, drawW, drawH);

    for (const field of fields) {
      const text = row[field.columnKey] ?? "";
      if (!text) continue;
      const fontSize = field.fontSize * scale;
      ctx.font = `${field.fontWeight} ${fontSize}px ${fontStack(field.fontFamily)}`;
      ctx.fillStyle = field.color;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        text,
        drawX + (field.x / 100) * drawW,
        // +5% fontSize = kompensasi setengah leading (line-height 1.1) di DOM
        drawY + (field.y / 100) * drawH + fontSize * 0.05,
      );
    }

    pdf.addImage(canvas, "JPEG", 0, 0, PAGE_W_MM, PAGE_H_MM, undefined, "FAST");
  });

  return pdf;
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
