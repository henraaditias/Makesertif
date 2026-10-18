"use client";

import { animateScrollToTop } from "@/lib/animations";
import { ArrowUpIcon } from "./icons";

/**
 * Link "Kembali ke atas" (footer landing) — menggulir halus ke atas
 * memakai anime.js (inOutCubic, ±650 ms). Tanpa efek bila user memakai
 * `prefers-reduced-motion` (langsung loncat ke atas). href="#top"
 * dipertahankan sebagai fallback bila JS belum siap.
 */
export default function BackToTop() {
  return (
    <a
      href="#top"
      onClick={(e) => {
        e.preventDefault();
        animateScrollToTop();
      }}
      className="inline-flex items-center gap-2 font-bold text-primary hover:opacity-80"
    >
      Kembali ke atas <ArrowUpIcon className="size-4" />
    </a>
  );
}
