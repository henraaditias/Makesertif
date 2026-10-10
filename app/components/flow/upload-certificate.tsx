"use client";

import { useEffect, useState } from "react";
import { ImagePlusIcon } from "../common/icons";
import { useFileDrop } from "./use-file-drop";
import type { TemplateSide } from "./types";

export interface UploadCertificateProps {
  /** Object URL template depan; null = kosong */
  image: string | null;
  /** Nama file asli depan untuk baris info di bawah preview */
  fileName: string | null;
  /** Ukuran file asli depan dalam byte */
  fileSize: number | null;
  /** Object URL template belakang (opsional); null = belum diunggah */
  imageBack: string | null;
  backFileName: string | null;
  backFileSize: number | null;
  /** Sisi yang sedang ditampilkan (dikontrol wizard) */
  side: TemplateSide;
  onSideChange: (side: TemplateSide) => void;
  /** Pesan validasi (format/ukuran) dari wizard */
  error: string | null;
  /** Buka file picker sisi aktif (klik preview / zone) */
  onPickImage: () => void;
  /** Hasil drop ke zone depan */
  onFile: (file: File) => void;
  /** Buka file picker sisi belakang */
  onPickBack: () => void;
  /** Hasil drop ke zone belakang */
  onBackFile: (file: File) => void;
}

/**
 * Step 1 — Certificate Template (Design.md "Upload Card").
 * Satu area preview untuk sisi AKTIF (klik = ganti gambar sisi itu),
 * toggle pill Depan/Belakang di bawah — posisi & gaya sama seperti
 * toggle File CSV / Google Sheets di step Entering data.
 * Validasi format (JPG/PNG) dan ukuran (max 10 MB) dilakukan wizard.
 */
export default function UploadCertificate({
  image,
  fileName,
  fileSize,
  imageBack,
  backFileName,
  backFileSize,
  side,
  onSideChange,
  error,
  onPickImage,
  onFile,
  onPickBack,
  onBackFile,
}: UploadCertificateProps) {
  // Belakang dihapus di luar → kembali aman ke depan
  const currentSide: TemplateSide =
    side === "back" && !imageBack ? "front" : side;
  const activeImage = currentSide === "front" ? image : imageBack;
  const activeName = currentSide === "front" ? fileName : backFileName;
  const activeSize = currentSide === "front" ? fileSize : backFileSize;

  const handleDrop = (file: File) => {
    if (currentSide === "front") onFile(file);
    else onBackFile(file);
  };
  const { dragging, dropProps } = useFileDrop(handleDrop);
  const [dims, setDims] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);

  // Baca dimensi piksel asli sisi aktif (informasi saat mengatur field).
  // setState hanya di callback onload (async), tidak sinkron di dalam effect.
  useEffect(() => {
    if (!activeImage) return;
    const preview = new window.Image();
    preview.onload = () =>
      setDims({
        url: activeImage,
        width: preview.naturalWidth,
        height: preview.naturalHeight,
      });
    preview.src = activeImage;
    return () => {
      preview.onload = null;
    };
  }, [activeImage]);

  // Tampilkan dimensi hanya jika sudah cocok dengan gambar yang tampil
  const dimensions =
    dims && dims.url === activeImage
      ? { width: dims.width, height: dims.height }
      : null;

  const zoneBorder = dragging
    ? "border-focus bg-indigo-surface"
    : error
      ? "border-danger bg-surface"
      : "border-line bg-surface hover:border-focus";

  const handlePickActive = () => {
    if (currentSide === "front") onPickImage();
    else onPickBack();
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-6">
      {/* Area preview / zone tunggal — menampilkan sisi aktif */}
      <div className="flex w-full flex-1 flex-col">
        {activeImage ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Ganti gambar sertifikat"
            onClick={handlePickActive}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePickActive();
              }
            }}
            {...dropProps}
            className={`group relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-panel border-2 border-dashed p-4 transition ${zoneBorder}`}
          >
            {/* URL blob lokal — tidak bisa dioptimasi next/image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt={
                activeName
                  ? `Template ${activeName}`
                  : `Template sertifikat sisi ${currentSide}`
              }
              className="max-h-98 w-auto rounded-control border border-line object-contain"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span
                className={`rounded-control border border-line bg-surface px-4 py-2 text-label text-ink shadow-card transition ${
                  dragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {dragging ? "Drop your file here" : "Click to replace"}
              </span>
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPickImage}
            {...dropProps}
            className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed text-center transition ${zoneBorder}`}
          >
            <ImagePlusIcon
              className={`size-7 ${dragging ? "text-action" : "text-ink-muted"}`}
            />
            <span className="text-body text-ink-muted">
              {dragging
                ? "Drop your file here"
                : "Click to upload or drag and drop"}
            </span>
            <span className="text-body text-ink-disabled">
              JPG or PNG · Up to 10 MB
            </span>
          </button>
        )}

        {/* Baris info file sisi aktif: nama · dimensi · ukuran (hanya bila ada gambar) */}
        {activeImage && (
          <div className="mt-3 flex items-center justify-between gap-4 text-body">
            <span className="truncate text-ink-secondary">
              {activeName ?? "Template"}
            </span>
            <span className="shrink-0 text-ink-disabled">
              {dimensions && `${dimensions.width} × ${dimensions.height} px`}
              {dimensions && activeSize != null && " · "}
              {activeSize != null &&
                `${(activeSize / 1024 / 1024).toFixed(1)} MB`}
            </span>
          </div>
        )}
      </div>

      {/* Toggle sisi — gaya & posisi sama seperti toggle File CSV / Google Sheets */}
      <div className="inline-flex rounded-control bg-blue-surface p-1">
        <button
          type="button"
          onClick={() => onSideChange("front")}
          className={[
            "rounded-chip px-4 py-2 text-label transition",
            currentSide === "front"
              ? "bg-selected text-ink"
              : "text-ink-muted hover:text-ink",
          ].join(" ")}
        >
          Depan
        </button>
        <button
          type="button"
          disabled={!imageBack}
          title={
            imageBack
              ? "Tampilkan template belakang"
              : "Tambahkan tampilan belakang dulu"
          }
          onClick={() => onSideChange("back")}
          className={[
            "rounded-chip px-4 py-2 text-label transition disabled:pointer-events-none disabled:opacity-50",
            currentSide === "back"
              ? "bg-selected text-ink"
              : "text-ink-muted hover:text-ink",
          ].join(" ")}
        >
          Belakang
        </button>
      </div>

      {error && <p className="text-label text-danger">{error}</p>}
    </div>
  );
}
