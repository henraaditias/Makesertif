import type { DataRow } from "@/components/flow/types";

export interface CsvTable {
  headers: string[];
  rows: DataRow[];
}

/**
 * Parser CSV ringan (tanpa dependency).
 * Mendukung: quoted field, koma di dalam kutipan, escape "" , CRLF/LF, dan BOM Excel.
 * Baris pertama = header; baris kosong diabaikan; header duplikat diberi suffix.
 */
export function parseCsv(input: string): CsvTable {
  let text = input;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM

  const records = splitRecords(text);
  if (records.length === 0) return { headers: [], rows: [] };

  const headers = uniqueHeaders(records[0].map((cell) => cell.trim()));
  const rows: DataRow[] = [];

  for (const record of records.slice(1)) {
    if (!record.some((cell) => cell.trim() !== "")) continue;
    const row: DataRow = {};
    headers.forEach((header, index) => {
      row[header] = (record[index] ?? "").trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

/** State machine pemisah record: kutipan, escape, koma, CR/LF */
function splitRecords(input: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      records.push(row);
      row = [];
    } else {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    records.push(row);
  }

  return records;
}

/** Header kosong → "Column"; duplikat → "Name (2)", "Name (3)", ... */
function uniqueHeaders(raw: string[]): string[] {
  const seen = new Map<string, number>();
  return raw.map((name) => {
    const base = name === "" ? "Column" : name;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}
