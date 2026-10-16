"use client";

import { useRef, type ReactNode } from "react";
import { fadeInUp, useAnimationLayoutEffect } from "@/lib/animations";

export interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Delay ms sebelum mulai (untuk stagger antar blok) */
  delay?: number;
  /** Jarak geser awal px */
  y?: number;
}

/**
 * Bungkus fade-up sekali saat mount — anime.js, tanpa efek bila user
 * memakai `prefers-reduced-motion`. Dipakai halaman di luar wizard
 * (landing & privacy) sebagai animasi masuk singkat.
 */
export default function FadeIn({
  children,
  className,
  delay = 0,
  y = 14,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useAnimationLayoutEffect(() => {
    return fadeInUp(ref.current, { delay, y });
  }, [delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
