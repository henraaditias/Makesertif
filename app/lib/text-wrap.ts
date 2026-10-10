/**
 * Pemecah teks baris untuk render field sertifikat.
 *
 * Greedy per spasi + patah per karakter untuk kata yang sendirian terlalu
 * panjang — meniru `white-space: pre-wrap; word-break: break-word` di DOM
 * (edit-canvas & preview result), sehingga layout editor konsisten dengan
 * hasil PDF/PNG. Dipakai `app/lib/pdf.ts`; `measure` = lebar teks menurut
 * font yang sedang aktif di canvas (mis. `(s) => ctx.measureText(s).width`).
 */

export type MeasureText = (text: string) => number;

export function wrapLines(
  measure: MeasureText,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      // Baris kosong (spasi saja / newline beruntun) dipertahankan
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      if (measure(word) <= maxWidth) {
        line = word;
        continue;
      }
      // Kata tunggal melebihi lebar → patahkan per karakter
      let chunk = "";
      for (const ch of word) {
        if (chunk && measure(chunk + ch) > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    }
    if (line) lines.push(line);
  }
  return lines.length > 0 ? lines : [""];
}
