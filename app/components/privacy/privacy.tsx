"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import Navbar from "../layout/navbar";
import Footer from "../layout/footer";
import FadeIn from "../common/fade-in";
import {
  animateSafe,
  animateScrollToY,
  prefersReducedMotion,
  useAnimationLayoutEffect,
  type Revert,
} from "@/lib/animations";
import {
  ChevronDownIcon,
  ClockIcon,
  DatabaseIcon,
  FrameIcon,
  GitHubIcon,
  InstagramIcon,
  MailIcon,
  ShieldIcon,
} from "../common/icons";

const summaryItems = [
  {
    Icon: ShieldIcon,
    title: "Tanpa akun & tanpa backend",
    text: "Tidak ada pendaftaran, tidak ada login. Layanan berjalan tanpa server yang memproses data kamu.",
  },
  {
    Icon: FrameIcon,
    title: "Diproses di browser kamu",
    text: "Template, data penerima, sampai render PDF/PNG semuanya terjadi di perangkatmu.",
  },
  {
    Icon: DatabaseIcon,
    title: "Bisa dihapus kapan saja",
    text: "Tombol Hapus Data membersihkan sesi & data Dashboard langsung dari perangkatmu.",
  },
  {
    Icon: ClockIcon,
    title: "Dashboard: otomatis 24 jam",
    text: "File di Dashboard dihapus otomatis 24 jam sejak diunggah atau dihasilkan.",
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

const babs: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "pendekatan",
    title: "Ringkasan pendekatan",
    body: (
      <>
        <p>
          Makesertif adalah alat bantu pembuatan sertifikat massal yang
          berjalan sepenuhnya di browser. Tidak ada pendaftaran akun, tidak ada
          server yang menyimpan data kamu, dan tidak ada data penerima yang
          kami kumpulkan.
        </p>
        <p>
          Kebijakan ini menjelaskan data apa yang diproses saat kamu memakai
          layanan ini, di mana data itu disimpan, pihak ketiga mana yang bisa
          terlibat, serta bagaimana kamu menghapusnya.
        </p>
      </>
    ),
  },
  {
    id: "data",
    title: "Data yang kami proses",
    body: (
      <>
        <p>
          Kami tidak mengumpulkan data secara aktif: tidak ada formulir
          pendaftaran, tidak ada login, dan tidak ada pengumpulan otomatis.
          Data berikut hanya diproses di perangkatmu:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Gambar template sertifikat (JPG atau PNG) yang kamu unggah.
          </li>
          <li>
            File CSV atau link Google Sheets berisi data penerima (nama, kolom,
            dan data lain yang ada di lembar kerjamu).
          </li>
          <li>
            Konfigurasi desain di kanvas (posisi, ukuran, font, warna, dan
            perataan tiap field) beserta pilihan format & kualitas unduhan.
          </li>
          <li>Hasil unduhan (PDF, PNG, atau ZIP) yang dirender di browser.</li>
        </ul>
        <p>
          Situs ini{" "}
          <strong className="text-ink">tidak menggunakan cookie</strong>, tidak
          memasang piksel pelacak, tidak menyertakan layanan analytics (Google
          Analytics, Meta Pixel, dan sejenisnya), dan tidak menjual atau
          menganalisis data kamu. Satu-satunya permintaan jaringan eksternal
          yang bisa terjadi adalah pengambilan Google Sheets bila kamu memilih
          sumber itu (dijelaskan di bab 4). Selain itu, data kamu tidak pernah
          dikirim ke server kami.
        </p>
      </>
    ),
  },
  {
    id: "penyimpanan",
    title: "Penyimpanan di perangkatmu",
    body: (
      <>
        <p>
          Agar refresh halaman tidak menghapus pekerjaanmu dan agar hasil bisa
          diunduh ulang, data disimpan di dua tempat milik browser di
          perangkatmu:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-ink">localStorage</strong>: sesi membuat
            sertifikat: langkah yang sedang aktif, link data, konfigurasi field,
            template, pilihan format/kualitas (
            <code className="text-ink">gc:draft</code>), serta hasil ukur
            kecepatan generate untuk estimasi waktu (
            <code className="text-ink">gc:perf</code>). Tidak pernah dikirim
            keluar dari perangkat.
          </li>
          <li>
            <strong className="text-ink">IndexedDB</strong>: riwayat Dashboard (
            <code className="text-ink">gc-files</code>): file template, file
            CSV/link Sheets, dan hasil unduhan (PDF/ZIP) supaya bisa diunduh
            ulang. Maksimal 30 entri per kategori dan dihapus otomatis setelah
            24 jam.
          </li>
        </ul>
        <p>
          Browser kamu bisa menghapus kedua penyimpanan ini kapan saja lewat
          setelan browser. Menghapusnya berarti draft sesi dan riwayat
          Dashboard ikut hilang.
        </p>
      </>
    ),
  },
  {
    id: "sheets",
    title: "Google Sheets (opsional)",
    body: (
      <>
        <p>
          Bagian ini hanya berlaku bila kamu memilih sumber data{" "}
          <strong className="text-ink">Google Sheets</strong>. Saat itu, browser
          kamu mengambil isi spreadsheet langsung dari server Google (endpoint{" "}
          <code className="text-ink">gviz/tq</code>) memakai link publik yang
          kamu tempel. Permintaan berjalan langsung dari browser ke Google,{" "}
          <strong className="text-ink">
            tidak melewati server Makesertif
          </strong>
          .
        </p>
        <p>
          Google memproses data tersebut sesuai dengan kebijakan privasinya
          sendiri. Link wajib dibagikan dengan status &ldquo;siapa saja yang
          memiliki link&rdquo;; bila tidak publik, pengambilan gagal dan kamu
          disarankan memakai File CSV. Mengunggah File CSV tidak menghasilkan
          permintaan jaringan apa pun ke pihak ketiga.
        </p>
      </>
    ),
  },
  {
    id: "pihak-ketiga",
    title: "Pihak ketiga",
    body: (
      <>
        <p>Daftar lengkap pihak yang bisa memproses data kamu:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-ink">Google (Google Sheets)</strong>: hanya
            bila kamu memakai sumber Google Sheets (lihat bab 4).
          </li>
        </ul>
        <p>
          Itu saja. Font Inter, pustaka render PDF (jsPDF), ZIP writer, dan
          animasi dibundel bersama aplikasi. Tidak ada CDN eksternal, jasa
          analytics, periklanan, atau media sosial yang menerima data dari
          halaman ini.
        </p>
      </>
    ),
  },
  {
    id: "keamanan",
    title: "Keamanan & masa simpan",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          Karena data tidak dikirim ke server kami, tidak ada risiko kebocoran
          dari infrastruktur kami; tidak ada salinan yang bisa kami buka.
        </li>
        <li>
          Data disimpan browser dengan mekanisme bawaan (localStorage &
          IndexedDB) yang terikat pada profil browser di perangkatmu.
        </li>
        <li>
          Masa simpan: draft sesi berlaku selama kamu tidak menghapusnya; data
          Dashboard maksimal 24 jam dan maksimal 30 entri per kategori
          (dihapus otomatis).
        </li>
        <li>
          Tombol <strong className="text-ink">Hapus Data</strong>: di halaman
          membuat sertifikat untuk menghapus sesi draft, dan di Dashboard untuk
          mengosongkan riwayat file; keduanya terpisah dan bisa dipakai kapan
          saja.
        </li>
      </ul>
    ),
  },
  {
    id: "hak",
    title: "Hak kamu",
    body: (
      <>
        <p>
          Karena layanan ini tanpa akun, tidak ada data akun yang perlu diminta
          atau dihapus dari server kami. Semua data ada di perangkatmu, sehingga
          kamu punya kendali penuh:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Pakai tombol Hapus Data (wizard atau Dashboard) untuk membersihkan
            data aplikasi.
          </li>
          <li>
            Atau hapus lewat setelan browser:{" "}
            <em>Application &rarr; Local storage / IndexedDB</em> untuk situs
            ini.
          </li>
          <li>
            Untuk pertanyaan seputar data, hubungi kami lewat kontak di bab 9.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "perubahan",
    title: "Perubahan kebijakan",
    body: (
      <p>
        Kebijakan ini terakhir diperbarui pada 19 Oktober 2026. Perubahan
        penting akan ditampilkan di halaman ini beserta tanggal pembaruan yang
        baru. Penggunaan layanan setelah perubahan berarti kamu menerima versi
        yang diperbarui.
      </p>
    ),
  },
  {
    id: "kontak",
    title: "Hubungi kami",
    body: (
      <>
        <p>
          Ada pertanyaan seputar kebijakan ini atau data kamu? Kami siap
          membantu:
        </p>
        <div className="grid gap-2.5 rounded-panel border border-line bg-surface-subtle p-4 sm:grid-cols-2">
          {contactItems.map(({ label, value, href, Icon, external }) => (
            <a
              key={label}
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="group flex items-center gap-3 rounded-control px-1 py-1.5 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
        <p className="text-body text-ink-muted">
          Butuh cara cepat menghapus data? Buka{" "}
          <Link
            href="/certificate"
            className="text-action underline underline-offset-2 hover:opacity-80"
          >
            halaman membuat sertifikat
          </Link>{" "}
          lalu tekan tombol{" "}
          <strong className="text-ink">Hapus Data</strong> di navbar.
        </p>
      </>
    ),
  },
];

const toc = babs.map(({ id, title }) => ({ id, label: title }));

function anchorOffset(): number {
  return window.innerWidth < 1024 ? 96 : 20;
}

export default function Privacy() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const tocLinkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const olRef = useRef<HTMLOListElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const shiftsRef = useRef<number[]>([]);
  const markerAnimRef = useRef<Revert | null>(null);
  const scrollAnimRef = useRef<Revert | null>(null);

  const placeMarker = useCallback((animate: boolean) => {
    const ol = olRef.current;
    const link = tocLinkRefs.current[activeIndexRef.current];
    const marker = markerRef.current;
    if (!ol || !link || !marker) return;
    const linkBox = link.getBoundingClientRect();
    const top = linkBox.top - ol.getBoundingClientRect().top;
    const height = linkBox.height;
    marker.style.opacity = "1";
    if (!animate || prefersReducedMotion()) {
      markerAnimRef.current?.();
      marker.style.top = `${top}px`;
      marker.style.height = `${height}px`;
      return;
    }
    markerAnimRef.current?.();
    markerAnimRef.current = animateSafe(marker, {
      top: `${top}px`,
      height: `${height}px`,
      duration: 320,
      ease: "outCubic",
    });
  }, []);

  useAnimationLayoutEffect(() => {
    placeMarker(false);
  }, [placeMarker, tocOpen]);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const docEl = document.documentElement;
      const reduced = prefersReducedMotion();

      const maxScroll = docEl.scrollHeight - vh;
      const pct =
        maxScroll > 0
          ? Math.min(1, Math.max(0, window.scrollY / maxScroll))
          : 0;
      if (progressRef.current) {
        progressRef.current.style.width = `${(pct * 100).toFixed(2)}%`;
      }

      let nextActive = 0;
      for (let i = 0; i < sectionRefs.current.length; i++) {
        const el = sectionRefs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const prevShift = shiftsRef.current[i] ?? 0;
        const rawTop = rect.top - prevShift;
        if (rawTop <= vh * 0.32) nextActive = i;
        if (reduced) continue;
        const center = rawTop + el.offsetHeight / 2;
        const dist = (center - vh / 2) / vh;
        const shift = Math.max(-14, Math.min(14, dist * 26));
        const reveal = (vh - rawTop) / (vh * 0.3);
        el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
        el.style.opacity = `${Math.min(1, Math.max(0, reveal))}`;
        shiftsRef.current[i] = shift;
      }

      if (nextActive !== activeIndexRef.current) {
        activeIndexRef.current = nextActive;
        setActiveIndex(nextActive);
        placeMarker(true);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      update();
      placeMarker(false);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      markerAnimRef.current?.();
      scrollAnimRef.current?.();
    };
  }, [placeMarker]);

  const handleTocClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - anchorOffset();
    scrollAnimRef.current?.();
    scrollAnimRef.current = animateScrollToY(y, 620);
    history.replaceState(null, "", `#${id}`);
    setTocOpen(false);
  };

  return (
    <div id="top" className="flex min-h-dvh flex-col bg-indigo-surface">
      <Navbar showDeleteData={false} showStartCta />

      <main className="flex-1">
        <section className="hero-gradient px-5 pt-9 pb-16 sm:px-8 sm:pt-11 sm:pb-20">
          <div className="mx-auto max-w-[960px]">
            <FadeIn>
              <p className="text-label text-primary">PRIVASI</p>
              <h1 className="mt-1.5 text-[30px] font-bold leading-tight text-ink sm:text-display">
                Kebijakan Privasi
              </h1>
              <p className="mt-3 max-w-[640px] text-body leading-relaxed text-ink-secondary sm:text-base">
                Transparan soal data apa yang diproses Makesertif, di mana
                disimpannya, dan bagaimana kamu menghapusnya.
              </p>
            </FadeIn>
            <FadeIn delay={120}>
              <p className="mt-4 inline-flex items-center gap-2 rounded-chip border border-line bg-surface/85 px-2.5 py-1 text-label text-ink-muted">
                Terakhir diperbarui: 19 Oktober 2026
              </p>
            </FadeIn>
          </div>
        </section>

        <div className="px-4 pb-8 sm:px-6">
          <article className="mx-auto max-w-[960px] -mt-6 rounded-t-[24px] border border-line bg-surface shadow-card">
            <div className="px-5 pb-9 pt-7 sm:px-8 sm:pt-9">
              <FadeIn>
                <div className="rounded-panel border border-line bg-indigo-surface p-4 sm:p-5">
                  <p className="text-label text-ink">Ringkasan singkat</p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {summaryItems.map(({ Icon, title, text }) => (
                      <div key={title} className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-container bg-primary text-surface">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-body font-bold text-ink">{title}</p>
                          <p className="mt-0.5 text-body leading-relaxed text-ink-muted">
                            {text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>

              <div className="mt-7 lg:grid lg:grid-cols-[210px_1fr] lg:gap-x-10">
                <nav
                  aria-label="Daftar isi"
                  className="sticky top-3 z-20 mb-7 self-start lg:top-4 lg:mb-0"
                >
                  <FadeIn>
                    <div className="rounded-panel border border-line bg-surface-subtle p-3 shadow-card sm:p-4">
                      <button
                        type="button"
                        aria-expanded={tocOpen}
                        aria-controls="daftar-isi"
                        onClick={() => setTocOpen((open) => !open)}
                        className="flex w-full items-center justify-between gap-2 rounded-control text-left lg:cursor-default lg:pointer-events-none"
                      >
                        <span className="text-label text-ink">Daftar isi</span>
                        <span className="flex min-w-0 items-center gap-1.5 text-body text-ink-muted lg:hidden">
                          <span className="truncate">
                            {babs[activeIndex].title}
                          </span>
                          <ChevronDownIcon
                            className={`size-4 shrink-0 transition-transform ${
                              tocOpen ? "rotate-180" : ""
                            }`}
                          />
                        </span>
                      </button>

                      <div
                        aria-hidden
                        className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
                      >
                        <div
                          ref={progressRef}
                          className="h-full w-0 rounded-full bg-primary"
                        />
                      </div>

                      <ol
                        id="daftar-isi"
                        ref={olRef}
                        className={`relative mt-3 space-y-1.5 border-l-2 border-line pl-3 ${
                          tocOpen ? "block" : "hidden"
                        } lg:block`}
                      >
                        <span
                          ref={markerRef}
                          aria-hidden
                          className="pointer-events-none absolute left-0 right-0 top-0 h-6 rounded-chip bg-primary/10 opacity-0"
                        />
                        {toc.map((item, index) => (
                          <li key={item.id} className="relative">
                            <a
                              ref={(el) => {
                                tocLinkRefs.current[index] = el;
                              }}
                              href={`#${item.id}`}
                              onClick={(event) =>
                                handleTocClick(event, item.id)
                              }
                              className={`block py-0.5 text-body leading-snug transition-colors ${
                                activeIndex === index
                                  ? "font-bold text-primary"
                                  : "text-ink-secondary hover:text-action"
                              }`}
                            >
                              <span className="mr-1.5 text-ink-disabled">
                                {index + 1}.
                              </span>
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </FadeIn>
                </nav>

                <div className="min-w-0 space-y-8">
                  {babs.map((bab, index) => (
                    <section
                      key={bab.id}
                      id={bab.id}
                      ref={(el) => {
                        sectionRefs.current[index] = el;
                      }}
                      className="scroll-mt-28 lg:scroll-mt-4"
                    >
                      <SectionHeading number={index + 1} title={bab.title} />
                      <div className="mt-2.5 space-y-2.5 text-body leading-relaxed text-ink-secondary">
                        {bab.body}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="contact-gradient -mt-6 rounded-t-[24px]">
          <Footer variant="landing" />
        </div>
      </main>
    </div>
  );
}

function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="flex items-baseline gap-2 text-subtitle text-ink">
      <span className="text-primary">{number}.</span>
      {title}
    </h2>
  );
}
