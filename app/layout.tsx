import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // Varian italic wajib dimuat — toggle Italic di panel canvas & render PDF/PNG
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GenerateCertificate",
  description:
    "Buat sertifikat massal dari template: masukkan data CSV atau Google Sheets, atur field di canvas, lalu download satu PDF multi-halaman. Semua diproses di browser kamu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
