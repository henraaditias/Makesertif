"use client";

import { useRef, type ReactNode } from "react";
import {
  fadeInUp,
  fadeScale,
  prefersReducedMotion,
  useAnimationLayoutEffect,
  useInView,
} from "@/lib/animations";

export interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Delay ms sebelum mulai (untuk stagger antar blok) */
  delay?: number;
  /** Jarak geser awal px */
  y?: number;
  /**
   * Mode animasi:
   * - `"up"` (default): fade-up halus
   * - `"pop"`: scale + fade (outBack) — untuk elemen kecil seperti ikon
   */
  effect?: "up" | "pop";
  /**
   * Kapan animasi dijalankan:
   * - `"mount"` (default): langsung saat komponen di-mount
   * - `"view"`: saat elemen masuk viewport (animasi saat scroll)
   */
  when?: "mount" | "view";
}

/**
 * Bungkus animasi masuk sekali — anime.js, tanpa efek bila user memakai
 * `prefers-reduced-motion`. Dipakai halaman di luar wizard (landing &
 * privacy). `delay` dipakai untuk stagger antar blok; `when="view"`
 * menunggu elemen masuk viewport dulu (IntersectionObserver, sekali
 * terpicu lalu lepas pantau).
 */
export default function FadeIn({
  children,
  className,
  delay = 0,
  y = 14,
  effect = "up",
  when = "mount",
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { enabled: when === "view" });

  useAnimationLayoutEffect(() => {
    if (when === "view" && !inView) {
      // Sembunyikan dulu sampai masuk viewport (tanpa flash saat muncul);
      // reduced motion → biarkan tampil normal tanpa animasi.
      if (!prefersReducedMotion() && ref.current) {
        ref.current.style.opacity = "0";
      }
      return;
    }
    if (effect === "pop") return fadeScale(ref.current, { delay });
    return fadeInUp(ref.current, { delay, y });
  }, [when, inView, delay, y, effect]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
