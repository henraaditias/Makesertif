export type FontWeight = 400 | 700;

/** Gaya teks — dipakai bersama `fontWeight`, keduanya toggle terpisah di panel canvas */
export type FontStyle = "normal" | "italic";

/**
 * Keluarga font pilihan panel canvas.
 * Dulu tiap keluarga punya 2 opsi gabungan ("Inter Normal"/"Inter Bold");
 * sekarang keluarga dipilih lewat select, sedangkan berat (Tebal) & Italic
 * adalah dua tombol toggle terpisah → 1 keluarga bisa normal/italic/bold/keduanya.
 */
export const FONT_FAMILIES = ["Inter", "Times New Roman", "Georgia"] as const;

/**
 * Spec `document.fonts.load` untuk satu keluarga — memuat varian italic juga
 * sehingga render canvas & PDF/PNG konsisten (Inter italic dari next/font,
 * Times/Georgia italic dari sistem).
 */
export function fontSpec(
  style: FontStyle,
  weight: FontWeight,
  family: string,
): string {
  return `${style === "italic" ? "italic " : ""}${weight} 32px ${fontStack(family)}`;
}

/** Warna teks default field baru — swatch "Ink" (token Design.md) */
export const DEFAULT_TEXT_COLOR = "#111827";

/**
 * Swatch Font Color — persis mockup: hitam, putih, merah, biru (token Design.md).
 * `className` = token Tailwind untuk background swatch (dipakai panel canvas).
 */
export const FONT_COLORS: {
  value: string;
  label: string;
  className: string;
}[] = [
  { value: DEFAULT_TEXT_COLOR, label: "Ink", className: "bg-ink" },
  { value: "#FFFFFF", label: "Putih", className: "bg-surface" },
  { value: "#EF4444", label: "Merah", className: "bg-danger" },
  { value: "#3B82F6", label: "Biru", className: "bg-accent" },
];

const STACKS: Record<string, string> = {
  Inter: '"Inter", system-ui, sans-serif',
  "Times New Roman": '"Times New Roman", Times, serif',
  Georgia: 'Georgia, "Times New Roman", serif',
  "Courier New": '"Courier New", Courier, monospace',
};

/** CSS font-family lengkap — dipakai di canvas dan saat render PDF */
export function fontStack(family: string): string {
  return STACKS[family] ?? `"${family}", sans-serif`;
}

/** Parse hex (#RGB / #RRGGBB, boleh tanpa #) → {r,g,b}; null bila tak valid */
export function hexToRgb(input: string): { r: number; g: number; b: number } | null {
  const hex = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    const expanded = hex
      .split("")
      .map((c) => c + c)
      .join("");
    return {
      r: parseInt(expanded.slice(0, 2), 16),
      g: parseInt(expanded.slice(2, 4), 16),
      b: parseInt(expanded.slice(4, 6), 16),
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return null;
}

/**
 * Parse input color picker (HEX atau rgb(...)) → canonical `#rrggbb`.
 * Dipakai input teks Font Color; null bila tidak valid.
 */
export function parseColorInput(input: string): string | null {
  const value = input.trim();
  const rgbMatch = value.match(
    /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*[\d.]+\s*)?\)$/i,
  );
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    if ([r, g, b].some((n) => n > 255)) return null;
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  const rgb = hexToRgb(value);
  if (!rgb) return null;
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}
