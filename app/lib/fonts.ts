export type FontWeight = 400 | 700;

export type FontStyle = "normal" | "italic";

export const FONT_FAMILIES = ["Inter", "Times New Roman", "Georgia"] as const;

export function fontSpec(
  style: FontStyle,
  weight: FontWeight,
  family: string,
): string {
  return `${style === "italic" ? "italic " : ""}${weight} 32px ${fontStack(family)}`;
}

export const DEFAULT_TEXT_COLOR = "#111827";

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

export function fontStack(family: string): string {
  return STACKS[family] ?? `"${family}", sans-serif`;
}

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
