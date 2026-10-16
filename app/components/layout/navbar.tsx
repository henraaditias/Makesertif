"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button, { ButtonLink } from "../common/button";
import { DatabaseIcon, GridIcon } from "../common/icons";
import { GC_KEYS, beginPurge } from "@/lib/storage";

export interface NavbarProps {
  /** Override aksi Hapus Data; default: hapus data draft wizard + reload */
  onDeleteData?: () => void;
  /** Sembunyikan tombol Hapus Data (mis. di landing & halaman privacy) */
  showDeleteData?: boolean;
}

const Navbar = ({ onDeleteData, showDeleteData = true }: NavbarProps) => {
  const pathname = usePathname();
  const handleDeleteData = () => {
    if (onDeleteData) {
      onDeleteData();
      return;
    }
    const ok = window.confirm(
      "Hapus data sesi membuat sertifikat di browser ini (template, data, desain kanvas)? Data di Dashboard tidak ikut terhapus. Tindakan ini tidak bisa dibatalkan.",
    );
    if (!ok) return;
    // Tandai purge SEBELUM reload: autosave wizard dilarang menulis ulang
    // draft saat event pagehide (tanpa ini data "hidup kembali" setelah dihapus)
    beginPurge();
    // Hanya key localStorage (draft + peninggalan) — data dashboard di
    // IndexedDB tidak disentuh, sesuai keputusan produk
    Object.values(GC_KEYS).forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 md:px-6">
        <Link href="/">
          <span className="text-title text-ink">GenerateCertificate</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Di /dashboard tombol Dashboard disembunyikan otomatis —
              di sana navbar hanya menampilkan Hapus Data */}
          {pathname !== "/dashboard" && (
            <ButtonLink
              href="/dashboard"
              variant="secondary"
              size="md"
              iconLeft={<GridIcon className="size-4" />}
            >
              Dashboard
            </ButtonLink>
          )}
          {showDeleteData && (
            <Button
              variant="primary"
              size="md"
              iconLeft={<DatabaseIcon className="size-4" />}
              onClick={handleDeleteData}
            >
              Hapus Data
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
