"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Button, { ButtonLink } from "../common/button";
import ConfirmModal from "../common/confirm-modal";
import { DatabaseIcon, GridIcon } from "../common/icons";
import { GC_KEYS, beginPurge } from "@/lib/storage";
import { animateScrollToTop } from "@/lib/animations";

export interface NavbarProps {
  onDeleteData?: () => void;
  showDeleteData?: boolean;
  showStartCta?: boolean;
}

const Navbar = ({
  onDeleteData,
  showDeleteData = true,
  showStartCta = false,
}: NavbarProps) => {
  const pathname = usePathname();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteData = () => {
    if (onDeleteData) {
      onDeleteData();
      return;
    }
    setConfirmOpen(true);
  };

  const confirmDeleteData = () => {
    setConfirmOpen(false);
    beginPurge();
    Object.values(GC_KEYS).forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 md:px-6">
        <Link
          href="/"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              animateScrollToTop();
            }
          }}
        >
          <span className="text-title text-ink">Makesertif</span>
        </Link>
        <div className="flex items-center gap-3">
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
          {showStartCta && (
            <ButtonLink href="/certificate" variant="primary" size="md">
              Buat Sekarang
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

      <ConfirmModal
        open={confirmOpen}
        title="Hapus data sesi?"
        message="Hapus data sesi membuat sertifikat di browser ini (template, data, desain kanvas)? Data di Dashboard tidak ikut terhapus. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        onConfirm={confirmDeleteData}
        onCancel={() => setConfirmOpen(false)}
      />
    </header>
  );
};

export default Navbar;
