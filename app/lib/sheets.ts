const SHEET_ID_PATTERN = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
const GID_PATTERN = /[?&#]gid=(\d+)/;

/**
 * Konversi link Google Sheets publik → endpoint CSV siap-fetch.
 *
 * Dipakai endpoint gviz (`tqx=out:csv`), BUKAN `/export`:
 * - gviz membalas 200 `text/csv` langsung (tanpa redirect) dan me-reflect
 *   header `Access-Control-Allow-Origin` sesuai Origin pemanggil.
 * - Respons sheet privat/tidak valid TIDAK punya ACAO, sehingga fetch gagal
 *   sebagai network error (TypeError) — tangkap itu dan sarankan fallback File CSV.
 * (Verifikasi CORS dilakukan via curl, lihat AGENTS.md.)
 */
export function sheetCsvUrl(link: string): string {
  const id = SHEET_ID_PATTERN.exec(link)?.[1];
  if (!id) {
    throw new Error(
      "Link tidak dikenali. Contoh format: https://docs.google.com/spreadsheets/d/ID_SHEET/edit",
    );
  }
  const gid = GID_PATTERN.exec(link)?.[1];
  const gidPart = gid ? `&gid=${gid}` : "";
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv${gidPart}`;
}
