import type { DataRow } from "@/components/flow/types";

const ILLEGAL_CHARS = /[\\/:*?"<>|]/g;

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
    .replace(/^[.\s]+|[.\s]+$/g, "");
  return `${year}-${seq}_${value || "sertifikat"}`;
}

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
