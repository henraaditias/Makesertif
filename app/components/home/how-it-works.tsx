"use client";

import { useRef } from "react";
import FadeIn from "../common/fade-in";
import {
  animateSafe,
  useAnimationLayoutEffect,
  useInView,
} from "@/lib/animations";
import {
  DownloadIcon,
  FrameIcon,
  ImagePlusIcon,
  TableIcon,
} from "../common/icons";

const steps = [
  {
    title: "Template Sertifikat",
    description: "Unggah desain sertifikatmu (JPG atau PNG, maksimal 10 MB).",
    Icon: ImagePlusIcon,
  },
  {
    title: "Masukkan Data",
    description: "Tempel link Google Sheets publik atau unggah file CSV.",
    Icon: TableIcon,
  },
  {
    title: "Desain di Kanvas",
    description:
      "Seret dan letakkan kolom data, atur posisi, ukuran, jenis, dan warna.",
    Icon: FrameIcon,
  },
  {
    title: "Selesaikan Proses",
    description:
      "Unduh sertifikatmu dalam tiga format: PDF gabungan, PDF satuan, atau gambar PNG.",
    Icon: DownloadIcon,
  },
];

export default function HowItWorks() {
  const progressRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const stepsInView = useInView(stepsRef);

  useAnimationLayoutEffect(() => {
    const el = progressRef.current;
    if (!el || !stepsInView) return;
    return animateSafe(el, {
      width: ["0%", "31%"],
      duration: 700,
      delay: 200,
      ease: "outCubic",
    });
  }, [stepsInView]);

  return (
    <section className="bg-primary px-5 pb-12 text-surface sm:px-8 sm:pb-16">
      <div className="mx-auto max-w-[960px]">
        <FadeIn when="view">
          <div className="pt-10 text-center sm:pt-12">
            <h2 className="text-[22px] font-bold tracking-tight sm:text-[24px] md:text-[26px]">
              CARA KERJANYA
            </h2>
            <p className="mt-1 text-body text-surface/90">
              Empat langkah untuk membuat sertifikat kamu
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={100} when="view">
          <div
            className="mx-auto mt-6 aspect-[1.9/1] w-full max-w-[560px] rounded-container bg-surface shadow-card sm:mt-8"
            aria-label="Area video tutorial"
            role="img"
          />
        </FadeIn>

        <div
          ref={stepsRef}
          className="relative mx-auto mt-8 grid max-w-[880px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7"
        >
          <div className="absolute left-0 right-0 top-[42px] hidden h-[5px] rounded-full bg-surface/80 lg:block">
            <div
              ref={progressRef}
              className="h-full w-[31%] rounded-full bg-[#35258d]"
            />
          </div>

          {steps.map(({ title, description, Icon }, index) => (
            <FadeIn
              key={title}
              delay={index * 100}
              when="view"
              className="relative z-[1]"
            >
              <article>
                <FadeIn
                  effect="pop"
                  delay={80 + index * 100}
                  when="view"
                  className="mb-3"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary ring-4 ring-primary">
                    <Icon className="size-5" />
                  </div>
                </FadeIn>
                <div className="mb-2 h-1 w-full rounded-full bg-surface/80 lg:hidden" />
                <p className="text-body font-bold sm:text-label">{title}</p>
                <p className="mt-1 max-w-[240px] text-body leading-snug text-surface/95">
                  {description}
                </p>
                <span className="sr-only">Langkah {index + 1}</span>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
