import type { Metadata } from "next";
import Privacy from "../components/privacy/privacy";

export const metadata: Metadata = {
  title: "Kebijakan privasi — Makesertif",
  description:
    "Makesertif berjalan sepenuhnya di browser: tidak ada backend, tidak ada akun, dan tidak ada data penerima yang dikirim ke server kami.",
};

/**
 * Halaman Privacy policy (/privacy) — hero gradien + kartu isi (ringkasan,
 * daftar isi, 9 bab statis) + footer landing. Konten & layout ada di
 * `app/components/privacy/privacy.tsx`; file ini hanya metadata + render
 * (server component).
 */
export default function PrivacyPage() {
  return <Privacy />;
}
