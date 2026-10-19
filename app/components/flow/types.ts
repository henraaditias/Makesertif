import type { FontStyle, FontWeight } from "@/lib/fonts";

export type DataSource = "csv" | "sheets";

export type ResultPhase = "preparing" | "ready" | "generating" | "done" | "error";

export type DownloadKind = "pdf" | "zip-pdf" | "zip-img";

export type QualityLevel = "normal" | "hd" | "4k";

export const DOWNLOAD_BUTTON_LABEL: Record<DownloadKind, string> = {
  pdf: "Unduh PDF",
  "zip-pdf": "Unduh PDF satuan",
  "zip-img": "Unduh PNG",
};

export interface GenerateProgress {
  done: number;
  total: number;
  startedAt: number;
}

export type TemplateSide = "front" | "back";

export type DataRow = Record<string, string>;

export interface FieldConfig {
  id: string;
  columnKey: string;
  side?: TemplateSide;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  fontStyle?: FontStyle;
  align?: TextAlign;
  color: string;
}

export type TextAlign = "left" | "center" | "right";

export function fieldSide(field: FieldConfig): TemplateSide {
  return field.side === "back" ? "back" : "front";
}

export function fieldItalic(field: FieldConfig): boolean {
  return field.fontStyle === "italic";
}

export function fieldAlign(field: FieldConfig): TextAlign {
  return field.align ?? "left";
}
