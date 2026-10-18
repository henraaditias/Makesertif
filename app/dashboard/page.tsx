import type { Metadata } from "next";
import Dashboard from "./dashboard";

export const metadata: Metadata = {
  title: "Dashboard — Makesertif",
  description:
    "Riwayat file sertifikat, data, dan hasil unduhan di browser kamu. Tersimpan sementara di perangkat dan dihapus otomatis setelah 24 jam.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
