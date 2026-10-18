"use client";

import { useState } from "react";
import FadeIn from "../common/fade-in";
import {
  ChevronDownIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "../common/icons";

const questions = [
  {
    question: "Apa itu Makesertif?",
    answer:
      "Makesertif membantu kamu membuat banyak sertifikat sekaligus dari satu desain dan daftar penerima. Unggah template, masukkan data, atur tampilan di kanvas, lalu unduh hasilnya — semuanya praktis dari satu halaman.",
  },
  {
    question: "Bagaimana cara kerja Makesertif?",
    answer:
      "Unggah desain sertifikat (JPG atau PNG), masukkan daftar penerima melalui File CSV atau Google Sheets, sesuaikan posisi kolom di kanvas, lalu unduh sertifikat dalam format PDF gabungan, PDF satuan, atau gambar PNG.",
  },
  {
    question: "Apakah data saya aman?",
    answer:
      "Ya. Semua proses berjalan di browser perangkatmu — template, data penerima, dan hasil unduhan tidak pernah dikirim ke server kami.",
  },
  {
    question: "Apakah bisa menggunakan desain sertifikat sendiri?",
    answer:
      "Bisa. Desain sertifikat berupa gambar JPG atau PNG (maksimal 10 MB), lengkap dengan tampilan depan yang wajib dan tampilan belakang yang opsional.",
  },
  {
    question: "Bisakah sertifikat diunduh satu per satu?",
    answer:
      "Bisa. Selain PDF gabungan (multi-halaman), tersedia PDF satuan — satu file PDF per penerima yang dikemas dalam ZIP — dan gambar PNG per sertifikat.",
  },
];

const contactItems = [
  {
    label: "Email",
    value: "support@generatecertificate.id",
    Icon: MailIcon,
  },
  { label: "Telepon", value: "+62 21 1234 5678", Icon: PhoneIcon },
  {
    label: "Alamat",
    value: "Jl. Raya Kuningan, Jakarta Selatan",
    Icon: MapPinIcon,
  },
  {
    label: "Jam Operasional",
    value: "Senin–Jumat, 09:00–18:00 WIB",
    Icon: ClockIcon,
  },
];

/**
 * Section FAQ (akordeon) + "Hubungi Kami" — mengikuti mockup rev/ (FAQ.png).
 * Akordeon memakai state lokal tanpa library; jawaban dibuka dengan
 * reveal CSS `.faq-answer` (globals.css, dilewati bila reduced motion).
 * Ukuran desktop dikompakkan (keputusan user); animasi masuk berjenjang
 * via anime.js (FadeIn `when="view"` — terpicu saat scroll masuk viewport):
 * judul → tiap item FAQ (stagger) → kolom kontak.
 * Gradien + sudut atas membulat & footer transparan dibungkus wrapper
 * `contact-gradient` di `landing.tsx` (blok yang sama, mockup rev/) —
 * section ini sengaja tanpa latar sendiri.
 */
export default function FaqContact() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12"
    >
      {/*
        Mobile: urutan judul (order-1) → daftar FAQ (order-2) →
        Hubungi Kami (order-3). Desktop (lg): FAQ kolom kiri span 2 baris,
        judul kolom kanan atas, Hubungi kanan bawah.
      */}
      <div className="mx-auto flex max-w-[960px] flex-col gap-8 lg:grid lg:grid-cols-[1.7fr_1fr] lg:gap-x-12">
        {/* Judul section — mobile pertama; desktop kanan atas, SEJAJAR
            (top-aligned) dengan kartu FAQ pertama (tanpa padding atas) */}
        <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1">
          <FadeIn when="view">
            <h2 className="text-[22px] font-bold leading-tight text-primary sm:text-[26px] md:text-[28px]">
              Pertanyaan yang
              <br />
              <span className="text-ink-strong">Sering Diajukan</span>
            </h2>
            <p className="mt-3 max-w-md text-body leading-relaxed text-ink-secondary">
              Kami memahami waktu Anda sangat berharga. Di sini, kami telah
              merangkum pertanyaan yang paling sering diajukan.
            </p>
          </FadeIn>
        </div>

        {/* Daftar FAQ — mobile kedua; desktop kolom kiri (stagger per item) */}
        <div className="order-2 space-y-3 sm:space-y-4 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {questions.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <FadeIn key={item.question} delay={80 + index * 70} when="view">
                <article
                  className="overflow-hidden rounded-panel border border-line bg-surface shadow-card"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5 sm:py-4"
                  >
                    <span className="text-body font-bold text-ink sm:text-label">
                      {item.question}
                    </span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-surface transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDownIcon className="size-4" />
                    </span>
                  </button>
                  {isOpen && (
                    <p className="faq-answer px-4 pb-4 text-body leading-relaxed text-ink-muted sm:px-5 sm:pb-5">
                      {item.answer}
                    </p>
                  )}
                </article>
              </FadeIn>
            );
          })}
        </div>

        {/* Hubungi Kami — mobile ketiga; desktop kanan bawah, bagian
            bawahnya SEJAJAR dengan daftar FAQ (justify-end di grid stretch) */}
        <aside className="order-3 lg:order-none lg:col-start-2 lg:row-start-2 lg:flex lg:flex-col lg:justify-end">
          <FadeIn delay={120} when="view">
            <div>
              <h3 className="text-[20px] font-bold text-ink-strong sm:text-[22px]">
                Hubungi Kami
              </h3>
              <p className="mt-1 max-w-md text-body leading-relaxed text-ink-secondary">
                Punya pertanyaan seputar layanan kami, butuh konsultasi, atau
                ingin mendiskusikan peluang kerja sama? Kami siap membantu
                Anda.
              </p>
            </div>

            <div className="mt-4 space-y-3.5 rounded-panel border border-line bg-surface p-4 shadow-card">
              {contactItems.map(({ label, value, Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-container bg-primary text-surface">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-body font-bold text-ink">{label}</p>
                    <p className="break-words text-body text-ink-muted">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </aside>
      </div>
    </section>
  );
}
