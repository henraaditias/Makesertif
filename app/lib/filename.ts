import type { DataRow } from "@/components/flow/types";

/** Karakter terlarang di nama file Windows + kontrol */
const ILLEGAL_CHARS = /[\\/:*?"<>|]/g;

/**
 * Nama file unduhan per sertifikat: `2026-001_Budi`
 * — tahun berjalan - nomor urut 3 digit per paket unduhan (001, 002, ...)
 * - nilai kolom pilihan user (disanitasi utk nama file Windows).
 * Kolom kosong / nilai kosong → fallback "sertifikat".
 *
 * Dipakai nama PDF satuan dan PNG di dalam ZIP (kolom & urutan yang sama;
 * PNG menambah suffix `-depan`/`-belakang` bila template belakang ada).
 */
export function buildFileName(
  column: string,
  row: DataRow,
  index: number,
): string {
  const year = new Date().getFullYear();
  const seq = String(index + 1).padStart(3, "0");
  const value = (row[column] ?? "")
    .replace(ILLEGAL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim()
    // Titik/spasi di awal–akhir tidak sah di Windows
    .replace(/^[.\s]+|[.\s]+$/g, "");
  return `${year}-${seq}_${value || "sertifikat"}`;
}

/**
 * Buat nama unik dalam satu paket ZIP — bila sudah dipakai,
 * tambahkan " (2)", " (3)", ... sebelum ekstensi.
 */
export function uniqueFileName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let n = 2;
  while (used.has(`${base} (${n})${ext}`)) n++;
  const unique = `${base} (${n})${ext}`;
  used.add(unique);
  return unique;
}
