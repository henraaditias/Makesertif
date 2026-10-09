import type { ButtonHTMLAttributes, ReactNode } from "react";
import { SpinnerIcon } from "./icons";

export type ButtonVariant = "primary" | "secondary" | "destructive";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ikon di kiri label; ukuran diatur lewat className ikon, mis. size-4 */
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Tampilkan spinner dan nonaktifkan tombol */
  loading?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  // Design.md: primary = #6366F1 + teks putih
  primary:
    "bg-primary text-surface hover:opacity-90 active:opacity-80",
  // Design.md: secondary = putih dengan border neutral
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-surface-subtle",
  // Design.md: destructive = merah
  destructive:
    "bg-danger text-surface hover:opacity-90 active:opacity-80",
};

const sizeClass: Record<ButtonSize, string> = {
  // tombol kompak: Ubah File, Delete Data, Preview
  sm: "px-6 py-2.5 text-label",
  // tombol aksi utama: Lanjutkan, Download
  md: "px-6 py-3 text-label",
};

export default function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-control transition",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <SpinnerIcon className="size-4 animate-spin" />
      ) : (
        iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>
      )}
      {children}
      {iconRight && !loading && (
        <span className="inline-flex shrink-0">{iconRight}</span>
      )}
    </button>
  );
}
