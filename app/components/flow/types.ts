import type { FontStyle, FontWeight } from "@/lib/fonts";

/** Sumber data peserta (toggle di step Entering data) */
export type DataSource = "csv" | "sheets";

/** Fase step 4 — hasil generate (Design.md: preparing → ready → generating → done/error) */
export type ResultPhase = "preparing" | "ready" | "generating" | "done" | "error";

/** Output unduhan step 4 — menentukan pesan status "berhasil" */
export type DownloadKind = "pdf" | "zip-pdf" | "zip-img";

/**
 * Level kualitas render (panel Unduh step 4) — mempengaruhi DPI kanvas
 * PDF/PNG dan estimasi waktu. Default "hd" (lihat lib/quality).
 */
export type QualityLevel = "normal" | "hd" | "4k";

/** Label tombol primary step 4 per format unduhan */
export const DOWNLOAD_BUTTON_LABEL: Record<DownloadKind, string> = {
  pdf: "Unduh PDF",
  "zip-pdf": "Unduh PDF satuan",
  "zip-img": "Unduh PNG",
};

/**
 * Progres generate — dikirim renderer per baris selesai
 * (`startedAt` = `performance.now()` saat mulai, dipakai hitung mundur).
 */
export interface GenerateProgress {
  done: number;
  total: number;
  startedAt: number;
}

/** Sisi template sertifikat — depan wajib, belakang opsional */
export type TemplateSide = "front" | "back";

/** Satu baris data dari CSV / Google Sheets: header → nilai */
export type DataRow = Record<string, string>;

/**
 * Field teks yang ditempel di canvas.
 * Posisi disimpan sebagai % relatif terhadap ukuran template,
 * sehingga proporsional di layar dan saat dirender ke PDF.
 */
export interface FieldConfig {
  id: string;
  /** Header kolom yang jadi sumber nilai (baris per peserta) */
  columnKey: string;
  /** Sisi template (draft lama tanpa properti ini = depan — lihat fieldSide) */
  side?: TemplateSide;
  /** % lebar template (kiri) */
  x: number;
  /** % tinggi template (atas) */
  y: number;
  /**
   * % lebar kotak teks (opsional — drag handle kanan-bawah di canvas).
   * Tanpa properti ini = membentang ke tepi kanan (`100 - x`), perilaku lama;
   * selalu dijaga `x + width ≤ 100` agar tidak keluar dari foto.
   */
  width?: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  /**
   * Gaya italic (opsional — draft lama tanpa properti ini = "normal").
   * Dipisah dari `fontWeight` agar bisa italic, bold, keduanya, atau tidak.
   */
  fontStyle?: FontStyle;
  /**
   * Perataan teks dalam kotak (opsional — draft lama = "left").
   * Dijaga sama di DOM canvas, preview step 4, dan renderer PDF/PNG.
   */
  align?: TextAlign;
  /** Warna teks hex, mis. #111827 */
  color: string;
}

/** Perataan teks field */
export type TextAlign = "left" | "center" | "right";

/** Sisi field — aman untuk draft lama yang belum punya `side` */
export function fieldSide(field: FieldConfig): TemplateSide {
  return field.side === "back" ? "back" : "front";
}

/** Italic field — aman untuk draft lama yang belum punya `fontStyle` */
export function fieldItalic(field: FieldConfig): boolean {
  return field.fontStyle === "italic";
}

/** Perataan field — aman untuk draft lama yang belum punya `align` */
export function fieldAlign(field: FieldConfig): TextAlign {
  return field.align ?? "left";
}
