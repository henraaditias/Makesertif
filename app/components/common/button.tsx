import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { SpinnerIcon } from "./icons";

export type ButtonVariant = "primary" | "secondary" | "destructive";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-surface hover:opacity-90 active:opacity-80",
  secondary:
    "border border-line-strong bg-surface text-ink hover:bg-surface-subtle",
  destructive:
    "bg-danger text-surface hover:opacity-90 active:opacity-80",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-6 py-2.5 text-label",
  md: "px-6 py-3 text-label",
};

const controlClass = [
  "inline-flex items-center justify-center gap-2 rounded-control transition",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

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
        controlClass,
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

export interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  className = "",
  children,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={[
        controlClass,
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(" ")}
    >
      {iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>}
      {children}
      {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
    </Link>
  );
}
