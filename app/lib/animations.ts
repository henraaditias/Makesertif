import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
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
 * Animasi masuk "pop" (scale + fade) sekali — untuk elemen kecil yang
 * ingin terasa muncul (ikon langkah, dsb). ease `outBack` seperti banner
 * sukses di wizard. Tanpa efek bila reduced motion.
 */
export function fadeScale(el: HTMLElement | null, opts: FadeInOptions = {}): Revert {
  if (!el || prefersReducedMotion()) return () => {};
  const { duration = 520, delay = 0, ease = "outBack" } = opts;
  el.style.opacity = "0";
  let anim: JSAnimation;
  try {
    anim = animate(el, {
      opacity: 1,
      scale: [0.72, 1],
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

export interface InViewOptions {
  /** Fraksi elemen yang harus terlihat (default 0.15) */
  threshold?: number;
  /** Root margin IntersectionObserver (default "0px 0px -8% 0px") */
  rootMargin?: string;
  /** Nonaktifkan pemantauan (default true) */
  enabled?: boolean;
}

/**
 * true saat elemen merosot masuk viewport — sekali terpicu lalu berhenti
 * memantau. Dipakai FadeIn mode "view" (animasi saat scroll di landing).
 * Bila IntersectionObserver tidak tersedia, langsung true (aman SSR/JS lama).
 */
export function useInView(
  ref: RefObject<Element | null>,
  opts: InViewOptions = {},
): boolean {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -8% 0px",
    enabled = true,
  } = opts;
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, enabled, threshold, rootMargin]);

  return inView;
}

/**
 * Gulir window ke atas dengan animasi (anime.js, ease inOutCubic).
 * Bila reduced motion / anime gagal / sudah di atas → langsung loncat.
 * Dipakai link "Kembali ke atas" di footer landing.
 */
export function animateScrollToTop(duration = 650): Revert {
  const jump = () => window.scrollTo(0, 0);
  if (prefersReducedMotion()) {
    jump();
    return () => {};
  }
  const start = window.scrollY;
  if (start <= 0) return () => {};
  const proxy = { y: start };
  let anim: JSAnimation;
  try {
    anim = animate(proxy, {
      y: 0,
      duration,
      ease: "inOutCubic",
      onUpdate: () => window.scrollTo(0, proxy.y),
    });
  } catch {
    jump();
    return () => {};
  }
  return () => {
    try {
      anim.pause();
    } catch {
      /* sudah selesai */
    }
  };
}
