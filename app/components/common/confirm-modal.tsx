"use client";

import { useEffect, useRef } from "react";
import Button from "./button";
import { animateSafe, fadeScale, prefersReducedMotion } from "@/lib/animations";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cardRef.current?.querySelector("button")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const stopCard = fadeScale(cardRef.current, { duration: 420 });
    const stopBackdrop = prefersReducedMotion()
      ? () => {}
      : animateSafe(backdropRef.current, {
          opacity: [0, 1],
          duration: 240,
          ease: "outCubic",
        });
    return () => {
      stopCard();
      stopBackdrop();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const buttons = () =>
    Array.from(cardRef.current?.querySelectorAll("button") ?? []);
  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const list = buttons();
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={cardRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        onKeyDown={trapTab}
        className="w-full max-w-md rounded-container border border-line bg-surface p-6 shadow-card"
      >
        <h2 id="confirm-modal-title" className="text-section text-ink">
          {title}
        </h2>
        <p
          id="confirm-modal-message"
          className="mt-3 text-body text-ink-secondary"
        >
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            size="md"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
