"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animateSafe, prefersReducedMotion } from "@/lib/animations";

export interface SegmentOption {
  id: string;
  label: string;
}

export interface SegmentedProps {
  label: string;
  options: SegmentOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export default function Segmented({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const placedRef = useRef(false);

  const measure = () => {
    const btn = buttonRefs.current[value];
    return btn ? { left: btn.offsetLeft, width: btn.offsetWidth } : null;
  };

  const place = (pos: { left: number; width: number }) => {
    const ind = indicatorRef.current;
    if (!ind) return;
    ind.style.left = `${pos.left}px`;
    ind.style.width = `${pos.width}px`;
  };

  useLayoutEffect(() => {
    if (placedRef.current) return;
    const pos = measure();
    if (!pos) return;
    placedRef.current = true;
    place(pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!placedRef.current) return;
    const pos = measure();
    const ind = indicatorRef.current;
    if (!pos || !ind) return;
    if (prefersReducedMotion()) {
      place(pos);
      return;
    }
    return animateSafe(ind, {
      left: `${pos.left}px`,
      width: `${pos.width}px`,
      duration: 320,
      ease: "outCubic",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const onResize = () => {
      const pos = measure();
      if (pos) place(pos);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={label}
      className="relative inline-flex rounded-control bg-blue-surface p-1"
    >
      <span
        ref={indicatorRef}
        aria-hidden
        className="absolute top-1 bottom-1 rounded-chip bg-selected"
        style={{ left: 0, width: 0 }}
      />
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            ref={(el) => {
              buttonRefs.current[option.id] = el;
            }}
            className={[
              "relative rounded-chip px-4 py-2 text-label transition",
              "disabled:pointer-events-none disabled:opacity-50",
              active ? "text-ink" : "text-ink-muted hover:text-ink",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
