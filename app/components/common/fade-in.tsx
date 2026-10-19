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
  delay?: number;
  y?: number;
  effect?: "up" | "pop";
  when?: "mount" | "view";
}

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
