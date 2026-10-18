"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { fadeScale, animateSafe, useAnimationLayoutEffect } from "@/lib/animations";
import { SparklesIcon } from "../common/icons";

/** Hasil desain di public/ — dasar tampil & yang tampil lewat lensa/klik */
const IMAGE_DEFAULT = "/sertifikat-1.svg";
const IMAGE_REVEAL = "/sertifikat-2.svg";
/** Lama hasil kedua tampil penuh setelah diklik (ms) */
const REVEAL_MS = 5000;
/** Radius inti lensa kursor (px) */
const LENS_RADIUS = 90;

/**
 * Mask lensa mengikuti kursor — GRADIENT LEMBUT (bukan lingkaran keras):
 * inti pekat lalu memudar bertahap ke transparan, jadi tepinya alami.
 * Posisi dari custom property `--lens-x`/`--lens-y` yang ditulis langsung
 * ke DOM (tanpa re-render React per gerakan pointer).
 */
const lensMask = `radial-gradient(circle ${LENS_RADIUS}px at var(--lens-x, -999px) var(--lens-y, -999px), rgb(0 0 0 / 95%) 0%, rgb(0 0 0 / 78%) 40%, rgb(0 0 0 / 38%) 66%, transparent 85%)`;

/**
 * Preview sertifikat hero — mengikuti mockup rev/: kartu sertifikat (SVG
 * di public/) dengan pill "Gratis Tanpa akun" & "Data tetap di perangkatmu".
 * Interaksi (keputusan user): kursor mouse membuka lensa GRADIENT LEMBUT
 * (mask radial multi-stop, tepi memudar alami) yang menampilkan hasil
 * desain kedua di bawahnya; klik (mouse/sentuh/keyboard) menampilkan hasil
 * kedua penuh selama 5 detik lalu kembali. Lensa hanya untuk pointer
 * mouse — sentuhan di HP tidak mengaktifkannya. Badge pill pop (outBack)
 * berurutan saat mount; swap lensa/klik instan (bukan animasi).
 * Kartu + pill juga MELAYANG halus terus-menerus (loop yoyo inOutSine,
 * ±7px) — elegan & dilewati bila reduced motion. Lebar kartu dibatasi
 * `min(…, vh)` supaya hero tetap muat satu layar (CTA tidak ke bawah fold).
 */
export default function CertificatePreview() {
  const [lensOn, setLensOn] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const pillLeftRef = useRef<HTMLDivElement>(null);
  const pillRightRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);

  // Bersihkan timer reveal saat unmount
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  // Animasi looping: kartu + pill melayang halus (yoyo) — tanpa efek bila
  // reduced motion (animateSafe langsung no-op)
  useAnimationLayoutEffect(() => {
    const el = floatRef.current;
    if (!el) return;
    return animateSafe(el, {
      y: [0, -7],
      duration: 2600,
      ease: "inOutSine",
      alternate: true,
      loop: Infinity,
    });
  }, []);

  // Badge pill pop (outBack) berurutan saat mount — dilewati bila reduced motion
  useAnimationLayoutEffect(() => {
    const revertLeft = fadeScale(pillLeftRef.current, { delay: 520 });
    const revertRight = fadeScale(pillRightRef.current, { delay: 680 });
    return () => {
      revertLeft();
      revertRight();
    };
  }, []);

  /** Catat posisi kursor ke custom property overlay (tanpa re-render) */
  const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "touch") return; // sentuhan tidak menggerakkan lensa
    const el = overlayRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--lens-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--lens-y", `${e.clientY - rect.top}px`);
  };

  /** Klik: tampilkan hasil kedua penuh 5 detik (klik ulang = reset timer) */
  const handleReveal = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setRevealed(true);
    timerRef.current = window.setTimeout(() => {
      setRevealed(false);
      timerRef.current = null;
    }, REVEAL_MS);
  };

  return (
    <div
      ref={floatRef}
      className="relative mx-auto w-full max-w-[min(480px,56vh)] px-2 sm:max-w-[min(520px,60vh)] sm:px-0"
    >
      {/* Pill kiri-atas — pop masuk saat mount */}
      <div
        ref={pillLeftRef}
        className="absolute -left-2 top-[17%] z-10 rounded-chip bg-primary px-3 py-2 text-label text-surface shadow-card sm:-left-16 sm:text-body"
      >
        Gratis Tanpa akun
      </div>

      {/* Pill kanan-bawah — pop masuk menyusul */}
      <div
        ref={pillRightRef}
        className="absolute -right-1 bottom-[9%] z-10 rounded-chip bg-primary px-3 py-2 text-label text-surface shadow-card sm:-right-14 sm:text-body"
      >
        Data tetap di perangkatmu
      </div>

      <button
        type="button"
        aria-label="Contoh desain sertifikat — klik untuk melihat hasil desain lain selama 5 detik"
        onClick={handleReveal}
        onPointerEnter={(e) => {
          if (e.pointerType !== "touch") setLensOn(true);
        }}
        onPointerLeave={() => setLensOn(false)}
        onPointerMove={handlePointerMove}
        className="relative block aspect-[1.42/1] w-full cursor-pointer overflow-hidden rounded-surface shadow-card select-none"
      >
        {/* next/image tidak dipakai — SVG lokal & swap instan; ikuti konvensi proyek */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGE_DEFAULT}
          alt="Contoh desain sertifikat"
          draggable={false}
          className="absolute inset-0 h-full w-full"
        />
        {/* Hasil desain kedua: lensa bulat ikut kursor; penuh saat revealed */}
        <div
          ref={overlayRef}
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${IMAGE_REVEAL}')`,
            opacity: lensOn || revealed ? 1 : 0,
            maskImage: revealed ? "none" : lensMask,
            WebkitMaskImage: revealed ? "none" : lensMask,
          }}
        />
      </button>

      {/* Label contoh — hanya di layar sempit */}
      <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-surface/70 bg-surface/70 px-3 py-1 text-[10px] font-bold text-ink shadow-card backdrop-blur sm:hidden">
        <SparklesIcon className="size-3" /> Contoh desain sertifikat
      </div>
    </div>
  );
}
