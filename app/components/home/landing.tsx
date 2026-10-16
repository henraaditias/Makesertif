import Link from "next/link";
import Navbar from "../layout/navbar";
import Footer from "../layout/footer";
import FadeIn from "../common/fade-in";

/**
 * Halaman utama (/) — MASIH PLACEHOLDER KOSONG (belum dikerjakan).
 * Konten lengkap (hero, Cara Kerja, FAQ, dsb.) menyusul setelah didiskusikan;
 * animasi hanya fade-up singkat anime.js (FadeIn) — tanpa dependency baru
 * selain animejs yang sudah dipakai wizard, dan tanpa efek bila reduced motion.
 */
export default function Landing() {
  return (
    <div className="flex min-h-dvh flex-col bg-indigo-surface">
      <Navbar showDeleteData={false} />

      <main className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <FadeIn>
          <div>
            <h1 className="text-title text-ink">GenerateCertificate</h1>
            <p className="mx-auto mt-3 max-w-md text-body text-ink-muted">
              Halaman utama masih dalam penyiapan. Untuk mulai membuat
              sertifikat massal, buka halaman{" "}
              <Link
                href="/certificate"
                className="text-action underline underline-offset-2 hover:opacity-80"
              >
                buat sertifikat
              </Link>
              .
            </p>
          </div>
        </FadeIn>
      </main>

      <Footer />
    </div>
  );
}
