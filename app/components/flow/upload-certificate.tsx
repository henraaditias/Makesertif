"use client";

import { useEffect, useState } from "react";
import { ImagePlusIcon } from "../common/icons";
import { useFileDrop } from "./use-file-drop";

export interface UploadCertificateProps {
  /** Object URL template yang sudah diunggah; null = kosong */
  image: string | null;
  /** Nama file asli untuk baris info di bawah preview */
  fileName: string | null;
  /** Ukuran file asli dalam byte */
  fileSize: number | null;
  /** Pesan validasi (format/ukuran) dari wizard */
  error: string | null;
  /** Buka file picker (milik wizard) — dipakai klik zone & tombol Ubah File */
  onPickImage: () => void;
  /** Hasil drop langsung ke zone */
  onFile: (file: File) => void;
}

/**
 * Step 1 — Certificate Template (Design.md "Upload Card").
 * State: empty, drag-over, uploaded/preview, dan error inline.
 * Validasi format (JPG/PNG) dan ukuran (max 10 MB) dilakukan wizard.
 */
export default function UploadCertificate({
  image,
  fileName,
  fileSize,
  error,
  onPickImage,
  onFile,
}: UploadCertificateProps) {
  const { dragging, dropProps } = useFileDrop(onFile);
  const [dims, setDims] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);

  // Baca dimensi piksel asli template (informasi berguna saat mengatur field).
  // setState hanya di callback onload (async), tidak sinkron di dalam effect.
  useEffect(() => {
    if (!image) return;
    const preview = new window.Image();
    preview.onload = () =>
      setDims({
        url: image,
        width: preview.naturalWidth,
        height: preview.naturalHeight,
      });
    preview.src = image;
    return () => {
      preview.onload = null;
    };
  }, [image]);

  // Tampilkan dimensi hanya jika sudah cocok dengan template yang tampil
  const dimensions =
    dims && dims.url === image
      ? { width: dims.width, height: dims.height }
      : null;

  const zoneBorder = dragging
    ? "border-focus bg-indigo-surface"
    : error
      ? "border-danger bg-surface"
      : "border-line bg-surface hover:border-focus";

  if (image) {
    return (
      <div className="flex flex-1 flex-col">
        <div
          role="button"
          tabIndex={0}
          aria-label="Ganti template sertifikat"
          onClick={onPickImage}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPickImage();
            }
          }}
          {...dropProps}
          className={`group relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-panel border-2 border-dashed p-4 transition ${zoneBorder}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={fileName ? `Template ${fileName}` : "Template sertifikat"}
            className="max-h-[390px] w-auto rounded-control border border-line object-contain"
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

        {/* Baris info file: nama · dimensi · ukuran */}
        <div className="mt-3 flex items-center justify-between gap-4 text-body">
          <span className="truncate text-ink-secondary">
            {fileName ?? "Template"}
          </span>
          <span className="shrink-0 text-ink-disabled">
            {dimensions &&
              `${dimensions.width} × ${dimensions.height} px`}
            {dimensions && fileSize != null && " · "}
            {fileSize != null &&
              `${(fileSize / 1024 / 1024).toFixed(1)} MB`}
          </span>
        </div>

        {error && <p className="mt-2 text-label text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
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
          {dragging ? "Drop your file here" : "Click to upload or drag and drop"}
        </span>
        <span className="text-body text-ink-disabled">
          JPG or PNG · Up to 10 MB
        </span>
      </button>

      {error && <p className="mt-3 text-label text-danger">{error}</p>}
    </div>
  );
}
