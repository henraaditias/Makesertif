import Link from "next/link";
import FadeIn from "../common/fade-in";
import { ArrowRightIcon } from "../common/icons";
import CertificatePreview from "./certificate-preview";

export default function Hero() {
  return (
    <section className="hero-gradient flex min-h-[calc(100dvh_-_60px)] flex-col justify-center px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-[1000px]">
        <FadeIn effect="pop">
          <CertificatePreview />
        </FadeIn>

        <div className="mx-auto mt-5 max-w-[900px] text-center text-surface sm:mt-6">
          <FadeIn delay={140}>
            <h1 className="text-[20px] font-bold leading-tight sm:text-[24px] md:text-[28px] lg:text-[32px]">
              BUAT SERTIFIKAT MASSAL DALAM HITUNGAN MENIT
            </h1>
          </FadeIn>
          <FadeIn delay={220}>
            <p className="mx-auto mt-2 max-w-[800px] text-body leading-relaxed text-surface/95 sm:text-base">
              Unggah desain sertifikatmu, masukkan data dari CSV atau Google
              Sheets, atur kolom di kanvas, lalu unduh PDF untuk semua
              penerima. Semua diproses di browser kamu.
            </p>
          </FadeIn>
          <FadeIn delay={300}>
            <Link
              href="/certificate"
              className="hero-cta mt-5 inline-flex items-center gap-2.5 rounded-control px-5 py-3 text-body font-bold shadow-card sm:mt-6 sm:text-label"
            >
              Buat Sertifikat Sekarang
              <ArrowRightIcon className="size-4" />
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
