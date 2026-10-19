"use client";

import { animateScrollToTop } from "@/lib/animations";
import { ArrowUpIcon } from "./icons";

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
