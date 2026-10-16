import { useEffect, useLayoutEffect } from "react";
import { animate, type JSAnimation } from "animejs";

/**
 * Pembungkus anime.js (v4) untuk UI web ini.
 * Aturan main:
 * - Semua animasi DILEWATI bila user meminta `prefers-reduced-motion`
 *   (elemen langsung tampil normal, tanpa animasi).
 * - Cleanup SELALU dipasang di useEffect → animasi dijeda saat unmount /
 *   deps berubah, tidak ada animasi nyasar.
 * - Styling & warna tetap dari token Tailwind; anime.js hanya menggerakkan
 *   nilai (opacity/transform/posisi) yang memang dinamis.
 */

type AnimeTarget = Parameters<typeof animate>[0];
type AnimeParams = Parameters<typeof animate>[1];

/** Fungsi cleanup animasi (aman dipanggil berulang) */
export type Revert = () => void;

/** Apakah user meminta kurangi animasi (system preference)? */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Jalankan animasi anime.js apa pun — tanpa efek bila reduced motion.
 * Berguna di useEffect: `return animateSafe(el, {...})`.
 */
export function animateSafe(target: AnimeTarget, params: AnimeParams): Revert {
  if (prefersReducedMotion()) return () => {};
  let anim: JSAnimation;
  try {
    anim = animate(target, params);
  } catch {
    return () => {};
  }
  return () => {
    try {
      anim.pause();
    } catch {
      /* animasi sudah selesai / target hilang */
    }
  };
}

export interface FadeInOptions {
  /** Durasi ms (default 460) */
  duration?: number;
  /** Delay ms (default 0) */
  delay?: number;
  /** Jarak geser awal dalam px (default 14) */
  y?: number;
  /** Easing anime.js (default "outCubic") */
  ease?: AnimeParams["ease"];
}

/**
 * Animasi masuk (fade-up) sekali — opacity diset SEBELUM animasi berjalan
 * supaya tidak ada kedip satu frame. Tanpa efek bila reduced motion
 * (elemen langsung terlihat).
 */
export function fadeInUp(el: HTMLElement | null, opts: FadeInOptions = {}): Revert {
  if (!el || prefersReducedMotion()) return () => {};
  const { duration = 460, delay = 0, y = 14, ease = "outCubic" } = opts;
  el.style.opacity = "0";
  let anim: JSAnimation;
  try {
    anim = animate(el, {
      opacity: 1,
      y: [y, 0],
      duration,
      delay,
      ease,
      onComplete: () => {
        el.style.opacity = "";
        el.style.transform = "";
      },
    });
  } catch {
    el.style.opacity = "";
    return () => {};
  }
  return () => {
    try {
      anim.pause();
    } catch {
      /* sudah selesai */
    }
    el.style.opacity = "";
    el.style.transform = "";
  };
}

/**
 * Layout effect khusus animasi: `useLayoutEffect` di browser (nilai awal
 * diset sebelum paint → tanpa flash), `useEffect` saat render server.
 */
export const useAnimationLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
