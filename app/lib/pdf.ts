import { jsPDF } from "jspdf";
import type {
  DataRow,
  FieldConfig,
  TemplateSide,
} from "@/components/flow/types";
import { fieldAlign, fieldItalic, fieldSide } from "@/components/flow/types";
import { fontSpec, fontStack } from "./fonts";
import { wrapLines } from "./text-wrap";
import { A4_H_MM, A4_W_MM, DEFAULT_QUALITY, qualityPixels } from "./quality";
import type { QualityLevel } from "@/components/flow/types";

export interface CertificatePdfInput {
  frontUrl: string;
  backUrl?: string | null;
  fields: FieldConfig[];
  rows: DataRow[];
  quality?: QualityLevel;
  onProgress?: (done: number, total: number) => void;
}

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

export async function buildCertificatePdf({
  frontUrl,
  backUrl,
  fields,
  rows,
  quality = DEFAULT_QUALITY,
  onProgress,
}: CertificatePdfInput): Promise<jsPDF> {
  await loadFontsUsed(fields);
  const front = await loadImage(frontUrl);
  const back = backUrl ? await loadImage(backUrl) : null;
  const { canvas, ctx, pxW, pxH } = createPageCanvas(quality);

  const frontFields = fields.filter((f) => fieldSide(f) === "front");
  const backFields = back
    ? fields.filter((f) => fieldSide(f) === "back")
    : [];

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  for (const [index, row] of rows.entries()) {
    if (index > 0) pdf.addPage("a4", "landscape");

    drawSide(ctx, front, frontFields, row, pxW, pxH);
    pdf.addImage(canvas, "JPEG", 0, 0, A4_W_MM, A4_H_MM, undefined, "FAST");

    if (back) {
      pdf.addPage("a4", "landscape");
      drawSide(ctx, back, backFields, row, pxW, pxH);
      pdf.addImage(
        canvas,
        "JPEG",
        0,
        0,
        A4_W_MM,
        A4_H_MM,
        undefined,
        "FAST",
      );
    }

    onProgress?.(index + 1, rows.length);
    await nextPaint();
  }

  return pdf;
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export async function renderRowPngs({
  frontUrl,
  backUrl,
  fields,
  row,
  quality = DEFAULT_QUALITY,
}: Omit<CertificatePdfInput, "rows"> & { row: DataRow }): Promise<RowPng[]> {
  await loadFontsUsed(fields);
  const front = await loadImage(frontUrl);
  const back = backUrl ? await loadImage(backUrl) : null;
  const { canvas, ctx, pxW, pxH } = createPageCanvas(quality);

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

function createPageCanvas(quality: QualityLevel): PageCanvas {
  const { pxW, pxH } = qualityPixels(quality);
  const canvas = document.createElement("canvas");
  canvas.width = pxW;
  canvas.height = pxH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak didukung browser ini.");
  return { canvas, ctx, pxW, pxH };
}

function drawSide(
  ctx: CanvasRenderingContext2D,
  template: HTMLImageElement,
  sideFields: FieldConfig[],
  row: DataRow,
  pxW: number,
  pxH: number,
): void {
  const scale = Math.min(
    pxW / template.naturalWidth,
    pxH / template.naturalHeight,
  );
  const drawW = template.naturalWidth * scale;
  const drawH = template.naturalHeight * scale;
  const drawX = (pxW - drawW) / 2;
  const drawY = (pxH - drawH) / 2;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, pxW, pxH);
  ctx.drawImage(template, drawX, drawY, drawW, drawH);

  for (const field of sideFields) {
    const text = row[field.columnKey] ?? "";
    if (!text) continue;
    const fontSize = field.fontSize * scale;
    ctx.font = `${fieldItalic(field) ? "italic " : ""}${field.fontWeight} ${fontSize}px ${fontStack(field.fontFamily)}`;
    ctx.fillStyle = field.color;
    ctx.textBaseline = "top";
    const align = fieldAlign(field);
    ctx.textAlign = align;
    const boxX = drawX + (field.x / 100) * drawW;
    const widthPct = field.width ?? 100 - field.x;
    const maxWidth = (widthPct / 100) * drawW;
    const x =
      align === "center"
        ? boxX + maxWidth / 2
        : align === "right"
          ? boxX + maxWidth
          : boxX;
    const lines = wrapLines(
      (s) => ctx.measureText(s).width,
      text,
      maxWidth,
    );
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

async function loadFontsUsed(fields: FieldConfig[]) {
  if (typeof document === "undefined" || !document.fonts) return;
  const specs = new Set(
    fields.map((field) =>
      fontSpec(field.fontStyle ?? "normal", field.fontWeight, field.fontFamily),
    ),
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
