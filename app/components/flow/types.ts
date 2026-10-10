import type { FontWeight } from "@/lib/fonts";

/** Sumber data peserta (toggle di step Entering data) */
export type DataSource = "csv" | "sheets";

/** Fase step 4 — hasil generate (Design.md: preparing → ready → generating → done/error) */
export type ResultPhase = "preparing" | "ready" | "generating" | "done" | "error";

/** Output unduhan step 4 — menentukan pesan status "berhasil" */
export type DownloadKind = "pdf" | "zip-pdf" | "zip-img";

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
  /** Warna teks hex, mis. #111827 */
  color: string;
}

/** Sisi field — aman untuk draft lama yang belum punya `side` */
export function fieldSide(field: FieldConfig): TemplateSide {
  return field.side === "back" ? "back" : "front";
}
