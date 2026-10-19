"use client";

import { useState } from "react";
import FadeIn from "../common/fade-in";
import {
  ChevronDownIcon,
  GitHubIcon,
  InstagramIcon,
  MailIcon,
} from "../common/icons";

const questions = [
  {
    question: "Apa itu Makesertif?",
    answer:
      "Makesertif membantu kamu membuat banyak sertifikat sekaligus dari satu desain dan daftar penerima. Unggah template, masukkan data, atur tampilan di kanvas, lalu unduh hasilnya. Semuanya praktis dari satu halaman.",
  },
  {
    question: "Bagaimana cara kerja Makesertif?",
    answer:
      "Unggah desain sertifikat (JPG atau PNG), masukkan daftar penerima melalui File CSV atau Google Sheets, sesuaikan posisi kolom di kanvas, lalu unduh sertifikat dalam format PDF gabungan, PDF satuan, atau gambar PNG.",
  },
  {
    question: "Apakah data saya aman?",
    answer:
      "Ya. Semua proses berjalan di browser perangkatmu. Template, data penerima, dan hasil unduhan tidak pernah dikirim ke server kami.",
  },
  {
    question: "Apakah bisa menggunakan desain sertifikat sendiri?",
    answer:
      "Bisa. Desain sertifikat berupa gambar JPG atau PNG (maksimal 10 MB), lengkap dengan tampilan depan yang wajib dan tampilan belakang yang opsional.",
  },
  {
    question: "Bisakah sertifikat diunduh satu per satu?",
    answer:
      "Bisa. Selain PDF gabungan (multi-halaman), tersedia PDF satuan (satu file PDF per penerima yang dikemas dalam ZIP) dan gambar PNG per sertifikat.",
  },
];

const contactItems = [
  {
    label: "Email",
    value: "henraaditiasaputra1@gmail.com",
    href: "mailto:henraaditiasaputra1@gmail.com",
    Icon: MailIcon,
    external: false,
  },
  {
    label: "Instagram",
    value: "@ddra.project",
    href: "https://www.instagram.com/ddra.project/",
    Icon: InstagramIcon,
    external: true,
  },
  {
    label: "GitHub",
    value: "henraaditias",
    href: "https://github.com/henraaditias",
    Icon: GitHubIcon,
    external: true,
  },
];

export default function FaqContact() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-12"
    >
      <div className="mx-auto flex max-w-[960px] flex-col gap-8 lg:grid lg:grid-cols-[1.7fr_1fr] lg:gap-x-12">
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

        <aside className="order-3 lg:order-none lg:col-start-2 lg:row-start-2 lg:flex lg:flex-col lg:justify-end">
          <FadeIn delay={120} when="view">
            <div>
              <h3 className="text-[20px] font-bold text-ink-strong sm:text-[22px]">
                Hubungi Kami
              </h3>
              <p className="mt-1 max-w-md text-body leading-relaxed text-ink-secondary">
                Punya pertanyaan seputar layanan atau butuh bantuan? Hubungi
                kami lewat salah satu kanal di bawah ini. Semuanya bisa
                diklik.
              </p>
            </div>

            <div className="mt-4 space-y-2 rounded-panel border border-line bg-surface p-4 shadow-card">
              {contactItems.map(({ label, value, href, Icon, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="group flex items-center gap-3 rounded-control px-1 py-1.5 transition-colors hover:bg-indigo-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-container bg-primary text-surface">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-body font-bold text-ink">{label}</p>
                    <p className="break-words text-body text-ink-muted underline decoration-transparent underline-offset-2 transition-colors group-hover:text-action group-hover:decoration-current">
                      {value}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </FadeIn>
        </aside>
      </div>
    </section>
  );
}
