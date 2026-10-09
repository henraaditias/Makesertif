import type { FontWeight } from "@/lib/fonts";

/** Sumber data peserta (toggle di step Entering data) */
export type DataSource = "csv" | "sheets";

/** Fase step 4 — hasil generate (Design.md: preparing → ready → generating → done/error) */
export type ResultPhase = "preparing" | "ready" | "generating" | "done" | "error";

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
  /** % lebar template (kiri) */
  x: number;
  /** % tinggi template (atas) */
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  /** Warna teks hex, mis. #111827 */
  color: string;
}
