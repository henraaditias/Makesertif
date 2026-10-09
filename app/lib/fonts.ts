export type FontWeight = 400 | 700;

export interface FontChoice {
  family: string;
  weight: FontWeight;
  label: string;
}

/** Opsi Font Family (gaya select di mockup: "Inter Normal") */
export const FONT_CHOICES: FontChoice[] = [
  { family: "Inter", weight: 400, label: "Inter Normal" },
  { family: "Inter", weight: 700, label: "Inter Bold" },
  { family: "Times New Roman", weight: 400, label: "Times New Roman Normal" },
  { family: "Times New Roman", weight: 700, label: "Times New Roman Bold" },
  { family: "Georgia", weight: 400, label: "Georgia Normal" },
  { family: "Georgia", weight: 700, label: "Georgia Bold" },
];

/** Swatch Font Color — persis mockup: hitam, putih, merah, biru (token Design.md) */
export const FONT_COLORS: { value: string; label: string }[] = [
  { value: "#111827", label: "Ink" },
  { value: "#FFFFFF", label: "White" },
  { value: "#EF4444", label: "Red" },
  { value: "#3B82F6", label: "Blue" },
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
