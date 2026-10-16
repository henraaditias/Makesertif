import type { Metadata } from "next";
import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";
import FadeIn from "../components/common/fade-in";

export const metadata: Metadata = {
  title: "Kebijakan privasi — GenerateCertificate",
  description:
    "GenerateCertificate berjalan sepenuhnya di browser: tidak ada backend, tidak ada akun, dan tidak ada data penerima yang dikirim ke server.",
};

/**
 * Halaman Privacy policy (/privacy) — MASIH PLACEHOLDER KOSONG (belum
 * dikerjakan). Isi kebijakan menyusul setelah didiskusikan; link footer
 * tetap mengarah ke route ini. Animasi hanya fade-up singkat (FadeIn/anime.js).
 */
export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-indigo-surface">
      <Navbar showDeleteData={false} />

      <main className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <FadeIn>
          <div>
            <h1 className="text-title text-ink">Kebijakan privasi</h1>
            <p className="mx-auto mt-3 max-w-md text-body text-ink-muted">
              Halaman ini masih dalam penyiapan.
            </p>
          </div>
        </FadeIn>
      </main>

      <Footer />
    </div>
  );
}
