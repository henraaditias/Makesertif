import type { Metadata } from "next";
import Privacy from "../components/privacy/privacy";

export const metadata: Metadata = {
  title: "Kebijakan privasi - Makesertif",
  description:
    "Makesertif berjalan sepenuhnya di browser: tidak ada backend, tidak ada akun, dan tidak ada data penerima yang dikirim ke server kami.",
};

export default function PrivacyPage() {
  return <Privacy />;
}
