import type { Metadata } from "next";
import CertificateWizard from "../components/flow/certificate-wizard";

export const metadata: Metadata = {
  title: "Buat Sertifikat - Makesertif",
  description:
    "Wizard 4 langkah: upload template sertifikat, masukkan data CSV atau Google Sheets, atur field di canvas, lalu download satu PDF multi-halaman.",
};

export default function CertificatePage() {
  return <CertificateWizard />;
}
