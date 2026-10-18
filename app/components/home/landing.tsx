import Navbar from "../layout/navbar";
import Footer from "../layout/footer";
import Hero from "./hero";
import HowItWorks from "./how-it-works";
import FaqContact from "./faq-contact";

/**
 * Halaman utama (/) — landing lengkap mengikuti mockup rev/ (All Page.png):
 * hero gradien + mock sertifikat, section "Cara Kerjanya" (4 langkah),
 * lalu SATU blok gradien membungkus FAQ + "Hubungi Kami" + footer
 * (footer transparan, warnanya = gradien FAQ/kontak) dengan sudut atas
 * membulat menumpuk ke section ungu di atasnya (rev/FAQ.png).
 * Animasi berjenjang anime.js (FadeIn); tanpa dependency baru.
 */
export default function Landing() {
  return (
    <div
      id="top"
      className="flex min-h-dvh flex-col bg-indigo-surface"
    >
      <Navbar showDeleteData={false} showStartCta />

      <main className="flex-1">
        <Hero />
        <HowItWorks />
        {/*
          Blok gradien FAQ/kontak + footer (mockup rev/): full-width,
          `-mt-6` menumpuk ke section ungu supaya ungu terlihat di notch
          sudut membulat (`rounded-t-[24px]` mengikuti radius mockup);
          footer di dalam blok ini = transparan, mengikuti gradien.
        */}
        <div className="contact-gradient -mt-6 rounded-t-[24px]">
          <FaqContact />
          <Footer variant="landing" />
        </div>
      </main>
    </div>
  );
}
