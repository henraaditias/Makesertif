import Link from "next/link";
import Navbar from "../layout/navbar";
import Footer from "../layout/footer";
import FadeIn from "../common/fade-in";
import {
  ClockIcon,
  DatabaseIcon,
  FrameIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldIcon,
} from "../common/icons";

/** Daftar isi — anchor link native ke tiap bab (tanpa JS tambahan) */
const toc = [
  { id: "pendekatan", label: "Ringkasan pendekatan" },
  { id: "data", label: "Data yang kami proses" },
  { id: "penyimpanan", label: "Penyimpanan di perangkatmu" },
  { id: "sheets", label: "Google Sheets" },
  { id: "pihak-ketiga", label: "Pihak ketiga" },
  { id: "keamanan", label: "Keamanan & masa simpan" },
  { id: "hak", label: "Hak kamu" },
  { id: "perubahan", label: "Perubahan kebijakan" },
  { id: "kontak", label: "Hubungi kami" },
];

/** Kartu ringkasan — 4 poin utama sebelum masuk bab detail */
const summaryItems = [
  {
    Icon: ShieldIcon,
    title: "Tanpa akun & tanpa backend",
    text: "Tidak ada pendaftaran, tidak ada login — layanan berjalan tanpa server yang memproses data kamu.",
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
  { label: "Email", value: "support@generatecertificate.id", Icon: MailIcon },
  { label: "Telepon", value: "+62 21 1234 5678", Icon: PhoneIcon },
  { label: "Alamat", value: "Jl. Raya Kuningan, Jakarta Selatan", Icon: MapPinIcon },
  { label: "Jam Operasional", value: "Senin–Jumat, 09:00–18:00 WIB", Icon: ClockIcon },
];

/**
 * Halaman Kebijakan Privasi (/privacy) — hero gradien (judul Display 36px,
 * tanpa CTA) + kartu putih menumpuk ke hero berisi kartu ringkasan, daftar
 * isi (sidebar sticky di lg / kartu list di mobile), dan 9 bab statis;
 * blok bawah contact-gradient + footer landing sama seperti halaman utama.
 * Konten statis (server-renderable); animasi hanya FadeIn (mount untuk hero,
 * `when="view"` untuk tiap bab & item daftar isi — dilewati reduced motion).
 */
export default function Privacy() {
  return (
    <div id="top" className="flex min-h-dvh flex-col bg-indigo-surface">
      <Navbar showDeleteData={false} showStartCta />

      <main className="flex-1">
        {/* Hero gradien kompak — rata kiri, area kiri-atas gradien terang
            sehingga teks gelap tetap kontras. Tanpa CTA (keputusan user). */}
        <section className="hero-gradient px-5 pt-9 pb-16 sm:px-8 sm:pt-11 sm:pb-20">
          <div className="mx-auto max-w-[960px]">
            <FadeIn>
              <p className="text-label text-primary">PRIVASI</p>
              <h1 className="mt-1.5 text-[30px] font-bold leading-tight text-ink sm:text-display">
                Kebijakan Privasi
              </h1>
              <p className="mt-3 max-w-[640px] text-body leading-relaxed text-ink-secondary sm:text-base">
                Transparan soal data apa yang diproses Makesertif,
                di mana disimpannya, dan bagaimana kamu menghapusnya.
              </p>
            </FadeIn>
            <FadeIn delay={120}>
              <p className="mt-4 inline-flex items-center gap-2 rounded-chip border border-line bg-surface/85 px-2.5 py-1 text-label text-ink-muted">
                Terakhir diperbarui: 18 Oktober 2026
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Kartu isi — menumpuk ke hero (notch gradien, pola landing),
            max-w 960px konsisten dengan section utama halaman /. */}
        <div className="px-4 pb-8 sm:px-6">
          <article className="mx-auto max-w-[960px] -mt-6 rounded-t-[24px] border border-line bg-surface shadow-card">
            <div className="px-5 pb-9 pt-7 sm:px-8 sm:pt-9">
              {/* Kartu ringkasan */}
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
                {/* Daftar isi — mobile: kartu di atas konten; desktop:
                    sidebar kiri sticky (self-start supaya bisa menempel) */}
                <nav
                  aria-label="Daftar isi"
                  className="mb-7 lg:mb-0 lg:self-start"
                >
                  <FadeIn>
                    <div className="rounded-panel border border-line bg-surface-subtle p-4 lg:sticky lg:top-4">
                      <p className="text-label text-ink">Daftar isi</p>
                      <ol className="mt-3 space-y-1.5 border-l-2 border-line pl-3">
                        {toc.map((item, index) => (
                          <li key={item.id}>
                            <a
                              href={`#${item.id}`}
                              className="block text-body leading-snug text-ink-secondary transition-colors hover:text-action"
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

                {/* Bab-bab statis */}
                <div className="min-w-0 space-y-8">
                  <FadeIn when="view">
                    <section id="pendekatan" className="scroll-mt-4">
                      <SectionHeading number={1} title="Ringkasan pendekatan" />
                      <div className="mt-2.5 space-y-2.5 text-body leading-relaxed text-ink-secondary">
                        <p>
                          Makesertif adalah alat bantu pembuatan
                          sertifikat massal yang berjalan sepenuhnya di browser.
                          Tidak ada pendaftaran akun, tidak ada server yang
                          menyimpan data kamu, dan tidak ada data penerima yang
                          kami kumpulkan.
                        </p>
                        <p>
                          Kebijakan ini menjelaskan data apa yang diproses saat
                          kamu memakai layanan ini, di mana data itu disimpan,
                          pihak ketiga mana yang bisa terlibat, serta bagaimana
                          kamu menghapusnya.
                        </p>
                      </div>
                    </section>
                  </FadeIn>

                  <FadeIn when="view">
                    <section id="data" className="scroll-mt-4">
                      <SectionHeading number={2} title="Data yang kami proses" />
                      <div className="mt-2.5 space-y-2.5 text-body leading-relaxed text-ink-secondary">
                        <p>
                          Kami tidak mengumpulkan data secara aktif — tidak ada
                          formulir pendaftaran, tidak ada login, dan tidak ada
                          pengumpulan otomatis. Data berikut hanya diproses di
                          perangkatmu:
                        </p>
                        <ul className="space-y-1.5 pl-5 list-disc">
                          <li>
                            Gambar template sertifikat (JPG atau PNG) yang kamu
                            unggah.
                          </li>
                          <li>
                            File CSV atau link Google Sheets berisi data
                            penerima (nama, kolom, dan data lain yang ada di
                            lembar kerjamu).
                          </li>
                          <li>
                            Konfigurasi desain di kanvas (posisi, ukuran, font,
                            warna, dan perataan tiap field) beserta pilihan
                            format & kualitas unduhan.
                          </li>
                          <li>
                            Hasil unduhan (PDF, PNG, atau ZIP) yang dirender di
                            browser.
                          </li>
                        </ul>
                        <p>
                          Situs ini <strong className="text-ink">tidak
                          menggunakan cookie</strong>, tidak memasang piksel
                          pelacak, tidak menyertakan layanan analytics (Google
                          Analytics, Meta Pixel, dan sejenisnya), dan tidak
                          menjual atau menganalisis data kamu. Satu-satunya
                          permintaan jaringan eksternal yang bisa terjadi adalah
                          pengambilan Google Sheets bila kamu memilih sumber
                          itu — dijelaskan di bab 4. Selain itu, data kamu tidak
                          pernah dikirim ke server kami.
                        </p>
                      </div>
                    </section>
                  </FadeIn>

                  <FadeIn when="view">
                    <section id="penyimpanan" className="scroll-mt-4">
                      <SectionHeading
                        number={3}
                        title="Penyimpanan di perangkatmu"
                      />
                      <div className="mt-2.5 space-y-2.5 text-body leading-relaxed text-ink-secondary">
                        <p>
                          Agar refresh halaman tidak menghapus pekerjaanmu dan
                          agar hasil bisa diunduh ulang, data disimpan di dua
                          tempat milik browser di perangkatmu:
                        </p>
                        <ul className="space-y-1.5 pl-5 list-disc">
                          <li>
                            <strong className="text-ink">localStorage</strong> —
                            sesi membuat sertifikat: langkah yang sedang aktif,
                            link data, konfigurasi field, template, pilihan
                            format/kualitas (<code className="text-ink">gc:draft</code>
                            ), serta hasil ukur kecepatan generate untuk
                            estimasi waktu (<code className="text-ink">gc:perf</code>).
                            Tidak pernah dikirim keluar dari perangkat.
                          </li>
                          <li>
                            <strong className="text-ink">IndexedDB</strong> —
                            riwayat Dashboard (<code className="text-ink">gc-files</code>):
                            file template, file CSV/link Sheets, dan hasil
                            unduhan (PDF/ZIP) supaya bisa diunduh ulang. Maksimal
                            30 entri per kategori dan dihapus otomatis setelah 24
                            jam.
                          </li>
                        </ul>
                        <p>
                          Browser kamu bisa menghapus kedua penyimpanan ini
                          kapan saja lewat setelan browser — menghapusnya berarti
                          draft sesi dan riwayat Dashboard ikut hilang.
                        </p>
                      </div>
                    </section>
                  </FadeIn>

                  <FadeIn when="view">
                    <section id="sheets" className="scroll-mt-4">
                      <SectionHeading number={4} title="Google Sheets (opsional)" />
                      <div className="mt-2.5 space-y-2.5 text-body leading-relaxed text-ink-secondary">
                        <p>
                          Bagian ini hanya berlaku bila kamu memilih sumber data{" "}
                          <strong className="text-ink">Google Sheets</strong>.
                          Saat itu, browser kamu mengambil isi spreadsheet
                          langsung dari server Google (endpoint{" "}
                          <code className="text-ink">gviz/tq</code>) memakai
                          link publik yang kamu tempel. Permintaan berjalan
                          langsung dari browser ke Google —{" "}
                          <strong className="text-ink">
                            tidak melewati server Makesertif
                          </strong>
                          .
                        </p>
                        <p>
                          Google memproses data tersebut sesuai dengan kebijakan
                          privasinya sendiri. Link wajib dibagikan dengan status
                          &ldquo;siapa saja yang memiliki link&rdquo;; bila tidak
                          publik, pengambilan gagal dan kamu disarankan memakai
                          File CSV. Mengunggah File CSV tidak menghasilkan
                          permintaan jaringan apa pun ke pihak ketiga.
                        </p>
                      </div>
                    </section>
                  </FadeIn>

                  <FadeIn when="view">
                    <section id="pihak-ketiga" className="scroll-mt-4">
                      <SectionHeading number={5} title="Pihak ketiga" />
                      <div className="mt-2.5 space-y-2.5 text-body leading-relaxed text-ink-secondary">
                        <p>Daftar lengkap pihak yang bisa memproses data kamu:</p>
                        <ul className="space-y-1.5 pl-5 list-disc">
                          <li>
                            <strong className="text-ink">Google (Google Sheets)</strong>{" "}
                            — hanya bila kamu memakai sumber Google Sheets
                            (lihat bab 4).
                          </li>
                        </ul>
                        <p>
                          Itu saja. Font Inter, pustaka render PDF (jsPDF),
                          ZIP writer, dan animasi dibundel bersama aplikasi —
                          tidak ada CDN eksternal, jasa analytics, periklanan,
                          atau media sosial yang menerima data dari halaman ini.
                        </p>
                      </div>
                    </section>
                  </FadeIn>

                  <FadeIn when="view">
                    <section id="keamanan" className="scroll-mt-4">
                      <SectionHeading number={6} title="Keamanan & masa simpan" />
                      <div className="mt-2.5 space-y-2.5 text-body leading-relaxed text-ink-secondary">
                        <ul className="space-y-1.5 pl-5 list-disc">
                          <li>
                            Karena data tidak dikirim ke server kami, tidak ada
                            risiko kebocoran dari infrastruktur kami — tidak ada
                            salinan yang bisa kami buka.
                          </li>
                          <li>
                            Data disimpan browser dengan mekanisme bawaan
                            (localStorage & IndexedDB) yang terikat pada profil
                            browser di perangkatmu.
                          </li>
                          <li>
                            Masa simpan: draft sesi berlaku selama kamu tidak
                            menghapusnya; data Dashboard maksimal 24 jam dan
                            maksimal 30 entri per kategori (dihapus otomatis).
                          </li>
                          <li>
                            Tombol <strong className="text-ink">Hapus Data</strong>:
                            di halaman membuat sertifikat untuk menghapus sesi
                            draft, dan di Dashboard untuk mengosongkan riwayat
                            file — keduanya terpisah dan bisa dipakai kapan saja.
                          </li>
                        </ul>
                      </div>
                    </section>
                  </FadeIn>

                  <FadeIn when="view">
                    <section id="hak" className="scroll-mt-4">
                      <SectionHeading number={7} title="Hak kamu" />
                      <div className="mt-2.5 space-y-2.5 text-body leading-relaxed text-ink-secondary">
                        <p>
                          Karena layanan ini tanpa akun, tidak ada data akun
                          yang perlu diminta atau dihapus dari server kami.
                          Semua data ada di perangkatmu, sehingga kamu punya
                          kendali penuh:
                        </p>
                        <ul className="space-y-1.5 pl-5 list-disc">
                          <li>
                            Pakai tombol Hapus Data (wizard atau Dashboard)
                            untuk membersihkan data aplikasi.
                          </li>
                          <li>
                            Atau hapus lewat setelan browser:{" "}
                            <em>Application &rarr; Local storage / IndexedDB</em>{" "}
                            untuk situs ini.
                          </li>
                          <li>
                            Untuk pertanyaan seputar data, hubungi kami lewat
                            kontak di bab 9.
                          </li>
                        </ul>
                      </div>
                    </section>
                  </FadeIn>

                  <FadeIn when="view">
                    <section id="perubahan" className="scroll-mt-4">
                      <SectionHeading number={8} title="Perubahan kebijakan" />
                      <div className="mt-2.5 space-y-2.5 text-body leading-relaxed text-ink-secondary">
                        <p>
                          Kebijakan ini terakhir diperbarui pada 18 Oktober 2026.
                          Perubahan penting akan ditampilkan di halaman ini
                          beserta tanggal pembaruan yang baru. Penggunaan
                          layanan setelah perubahan berarti kamu menerima
                          versi yang diperbarui.
                        </p>
                      </div>
                    </section>
                  </FadeIn>

                  <FadeIn when="view">
                    <section id="kontak" className="scroll-mt-4">
                      <SectionHeading number={9} title="Hubungi kami" />
                      <div className="mt-2.5 space-y-2.5 text-body leading-relaxed text-ink-secondary">
                        <p>
                          Ada pertanyaan soal kebijakan ini atau data kamu?
                          Kami siap membantu:
                        </p>
                        <div className="grid gap-3 rounded-panel border border-line bg-surface-subtle p-4 sm:grid-cols-2">
                          {contactItems.map(({ label, value, Icon }) => (
                            <div key={label} className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-container bg-primary text-surface">
                                <Icon className="size-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-body font-bold text-ink">
                                  {label}
                                </p>
                                <p className="break-words text-body text-ink-muted">
                                  {value}
                                </p>
                              </div>
                            </div>
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
                          <strong className="text-ink">Hapus Data</strong> di
                          navbar.
                        </p>
                      </div>
                    </section>
                  </FadeIn>
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* Blok gradien bawah + footer landing — sama seperti halaman utama */}
        <div className="contact-gradient -mt-6 rounded-t-[24px]">
          <Footer variant="landing" />
        </div>
      </main>
    </div>
  );
}

/** Judul bab — nomor indigo + label Bold 20px (text-subtitle) */
function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="flex items-baseline gap-2 text-subtitle text-ink">
      <span className="text-primary">{number}.</span>
      {title}
    </h2>
  );
}
