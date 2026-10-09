"use client";

import Button from "../common/button";
import { DatabaseIcon } from "../common/icons";
import { GC_KEYS, beginPurge } from "@/lib/storage";

export interface NavbarProps {
  /** Override aksi Delete Data; default: hapus ketiga key localStorage + reload */
  onDeleteData?: () => void;
  /** Sembunyikan tombol Delete Data (mis. di landing page) */
  showDeleteData?: boolean;
}

const Navbar = ({ onDeleteData, showDeleteData = true }: NavbarProps) => {
  const handleDeleteData = () => {
    if (onDeleteData) {
      onDeleteData();
      return;
    }
    const ok = window.confirm(
      "Hapus semua data tersimpan di browser ini (draft, riwayat, dan PDF)? Tindakan ini tidak bisa dibatalkan.",
    );
    if (!ok) return;
    // Tandai purge SEBELUM reload: autosave wizard dilarang menulis ulang
    // draft saat event pagehide (tanpa ini data "hidup kembali" setelah dihapus)
    beginPurge();
    Object.values(GC_KEYS).forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 md:px-6">
        <span className="text-title text-ink">GenerateCertificate</span>
        {showDeleteData && (
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<DatabaseIcon className="size-4" />}
            onClick={handleDeleteData}
          >
            Delete Data
          </Button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
