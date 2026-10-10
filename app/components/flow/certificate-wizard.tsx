"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Navbar from "../layout/navbar";
import Footer from "../layout/footer";
import Button from "../common/button";
import StepNav, { type StepItem } from "./step-nav";
import UploadCertificate from "./upload-certificate";
import UploadData from "./upload-data";
import EditCanvas from "./edit-canvas";
import Result from "./result";
import {
  ChevronRightIcon,
  DownloadIcon,
  ImagePlusIcon,
  RotateIcon,
} from "../common/icons";
import type {
  DataSource,
  DataRow,
  DownloadKind,
  FieldConfig,
  ResultPhase,
  TemplateSide,
} from "./types";
import { fieldSide } from "./types";
import { parseCsv, type CsvTable } from "@/lib/csv";
import { sheetCsvUrl } from "@/lib/sheets";
import { DEFAULT_TEXT_COLOR, FONT_CHOICES, fontStack } from "@/lib/fonts";
import {
  buildFileName,
  uniqueFileName,
} from "@/lib/filename";
import { buildCertificatePdf, renderRowPngs } from "@/lib/pdf";
import { createZip, type ZipEntry } from "@/lib/zip";
import {
  consumePurge,
  isPurging,
  loadDraft,
  saveDraft,
  type DraftState,
} from "@/lib/storage";
import { toPersistableImage } from "@/lib/image-data";

/** Definisi 4 step — teks persis mockup (rev/Mockup.png) */
const STEPS: StepItem[] = [
  {
    id: "template",
    title: "Certificate Template",
    description: "Upload your certificate design",
  },
  {
    id: "data",
    title: "Entering data",
    description: "Entering all data for the certificate",
  },
  {
    id: "canvas",
    title: "Designing on a canvas",
    description: "drag and drop your data fields",
  },
  {
    id: "result",
    title: "Complete the process",
    description: "Download your certificate.",
  },
];

const IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Opsi unduhan step 4 — tampil sebagai menu setelah tombol Download diklik */
const DOWNLOAD_OPTIONS: { id: DownloadKind; title: string; desc: string }[] = [
  {
    id: "pdf",
    title: "PDF gabungan",
    desc: "Semua penerima dalam satu PDF multi-halaman",
  },
  {
    id: "zip-pdf",
    title: "PDF satuan (ZIP)",
    desc: "Satu file per penerima — 2026-001_Nama",
  },
  {
    id: "zip-img",
    title: "Gambar PNG (ZIP)",
    desc: "Foto per sisi (depan/belakang) per penerima",
  },
];

/**
 * Kerangka halaman /certificate (Tahap 2):
 * latar indigo → kartu putih besar → step nav kiri, konten kanan,
 * action bar (sekunder kiri / primary kanan) + catatan privasi di bawah kartu.
 *
 * Semua transisi step terjadi di sini; tampilan per step di-mount dari
 * komponen folder flow/ (upload-certificate, upload-data, edit-canvas, result).
 */
export default function CertificateWizard() {
  const [step, setStep] = useState(0); // 0..3 → index STEPS
  const [image, setImage] = useState<string | null>(null); // object URL template
  const [imageInfo, setImageInfo] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [source, setSource] = useState<DataSource>("sheets");
  const [sheetUrl, setSheetUrl] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldConfig[]>([]);

  // Step 4 — hasil generate (fase hidup di wizard agar tombol primary ikut)
  const [phase, setPhase] = useState<ResultPhase>("preparing");
  const [resultError, setResultError] = useState<string | null>(null);
  const [excludedRows, setExcludedRows] = useState<Set<number>>(
    () => new Set(),
  );
  const [previewIndex, setPreviewIndex] = useState(0);
  // Menu 3 opsi unduhan — terbuka saat tombol Download diklik (step 4)
  const [downloadMenu, setDownloadMenu] = useState(false);

  // Persistence (Tahap 7) — refresh TIDAK menghapus data; hapus hanya via Delete Data
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageBack, setImageBack] = useState<string | null>(null); // object URL belakang
  const [imageInfoBack, setImageInfoBack] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const [imageDataUrlBack, setImageDataUrlBack] = useState<string | null>(null);
  // Sisi template yang ditampilkan di step 1 (toggle Depan/Belakang)
  const [templateSide, setTemplateSide] = useState<TemplateSide>("front");
  // Kolom penamaan file `2026-001_{kolom}` — "" = kolom pertama
  const [fileNameColumn, setFileNameColumn] = useState("");
  const [lastOutput, setLastOutput] = useState<DownloadKind | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const restoredRef = useRef(false);
  const draftRef = useRef<DraftState | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) Pulihkan sesi. Draft dibaca sinkron di effect ini (sebelum save boleh
  //    menulis), diterapkan pada microtask → tidak ada setState sinkron di
  //    effect (lint) dan HTML server tetap cocok (tanpa hydration mismatch).
  useEffect(() => {
    // Sesi purge (Delete Data) → konsumsi flag; localStorage sudah kosong
    consumePurge();
    const draft = loadDraft();
    Promise.resolve()
      .then(() => {
        if (draft) {
          // Clamp ke step yang mungkin sesuai kesiapan data hasil restore
          // (mis. gambar dibuang oleh fallback kuota saat save)
          const maxStep = draft.image
            ? draft.rows.length > 0
              ? draft.fields.length > 0
                ? 3
                : 2
              : 1
            : 0;
          setStep(Math.min(Math.max(draft.step, 0), maxStep));
          if (draft.image) {
            setImage(draft.image);
            setImageDataUrl(draft.image);
          }
          if (draft.imageInfo) setImageInfo(draft.imageInfo);
          if (typeof draft.imageBack === "string" && draft.imageBack) {
            setImageBack(draft.imageBack);
            setImageDataUrlBack(draft.imageBack);
          }
          if (draft.imageInfoBack) setImageInfoBack(draft.imageInfoBack);
          if (typeof draft.fileNameColumn === "string") {
            setFileNameColumn(draft.fileNameColumn);
          }
          setSource(draft.source);
          setSheetUrl(draft.sheetUrl);
          setHeaders(draft.headers);
          setRows(draft.rows);
          setFields(draft.fields);
          setPreviewIndex(draft.previewIndex);
          setExcludedRows(new Set(draft.excludedRows));
        }
      })
      .catch(() => {})
      .finally(() => {
        restoredRef.current = true;
      });
  }, []);

  // 2) Auto-save draft (debounce 300 ms) — hanya setelah restore selesai
  useEffect(() => {
    if (!restoredRef.current) return;
    draftRef.current = {
      v: 1,
      step,
      image: imageDataUrl,
      imageInfo,
      imageBack: imageDataUrlBack,
      imageInfoBack,
      source,
      sheetUrl,
      headers,
      rows,
      fields,
      previewIndex,
      excludedRows: [...excludedRows],
      fileNameColumn,
    };
    saveTimerRef.current = setTimeout(() => {
      if (isPurging()) return;
      if (draftRef.current) saveDraft(draftRef.current);
    }, 300);
      return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    step,
    imageDataUrl,
    imageInfo,
    imageDataUrlBack,
    imageInfoBack,
    source,
    sheetUrl,
    headers,
    rows,
    fields,
    previewIndex,
    excludedRows,
    fileNameColumn,
  ]);

  // 3) Flush sesi terakhir saat refresh/tab ditutup (pagehide) dan unmount
  useEffect(() => {
    const flush = () => {
      // Sesi purge (Delete Data → reload): jangan tulis ulang draft saat pagehide
      if (isPurging()) return;
      if (restoredRef.current && draftRef.current) saveDraft(draftRef.current);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  // Prasyarat per step → menentukan apakah tombol primary aktif
  const templateReady = image !== null;
  const dataReady = rows.length > 0 && !dataLoading;
  const fieldsReady = fields.length > 0;
  // Kolom penamaan file efektif ("" → kolom pertama dari data)
  const effectiveFileNameColumn = fileNameColumn || headers[0] || "";

  /** Validasi file gambar (JPG/PNG, maks 10 MB) — dipakai sisi depan & belakang */
  const validateImageFile = (file: File): string | null => {
    if (!IMAGE_TYPES.includes(file.type)) {
      return "Format file harus JPG atau PNG.";
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return "Ukuran file maksimal 10 MB.";
    }
    return null;
  };

  const handleImageFile = (file: File) => {
    const message = validateImageFile(file);
    if (message) {
      setImageError(message);
      return;
    }
    setImageError(null);
    if (image) URL.revokeObjectURL(image);
    setImageInfo({ name: file.name, size: file.size });
    setImage(URL.createObjectURL(file));
    // Siapkan versi data URL untuk auto-save (di-resize bila muat kuota)
    void toPersistableImage(file)
      .then(setImageDataUrl)
      .catch(() => setImageDataUrl(null));
  };

  const handleBackImageFile = (file: File) => {
    const message = validateImageFile(file);
    if (message) {
      setImageError(message);
      return;
    }
    setImageError(null);
    if (imageBack) URL.revokeObjectURL(imageBack);
    setImageInfoBack({ name: file.name, size: file.size });
    setImageBack(URL.createObjectURL(file));
    // Tampilan berpindah ke belakang agar hasil upload langsung terlihat
    setTemplateSide("back");
    void toPersistableImage(file)
      .then(setImageDataUrlBack)
      .catch(() => setImageDataUrlBack(null));
  };

  /** Hapus template belakang — konfirmasi dulu bila ada field di sisi itu */
  const handleRemoveBack = () => {
    const backFields = fields.filter((f) => fieldSide(f) === "back");
    if (
      backFields.length > 0 &&
      !window.confirm(
        "Hapus template belakang? Field di sisi belakang juga akan dihapus.",
      )
    ) {
      return;
    }
    if (imageBack) URL.revokeObjectURL(imageBack);
    setImageBack(null);
    setImageInfoBack(null);
    setImageDataUrlBack(null);
    setTemplateSide("front");
    if (backFields.length > 0) {
      setFields((prev) => prev.filter((f) => fieldSide(f) !== "back"));
    }
  };

  /** Terapkan hasil parse: buat minimal ada header + 1 baris data */
  const applySheetData = ({ headers: cols, rows: data }: CsvTable) => {
    if (cols.length === 0 || data.length === 0) {
      throw new Error(
        "Tidak ada baris data. Pastikan baris pertama adalah header dan ada minimal satu baris.",
      );
    }
    setHeaders(cols);
    setRows(data);
  };

  const handleCsvFile = async (file: File) => {
    if (dataLoading) return;
    setDataError(null);
    setDataLoading(true);
    try {
      applySheetData(parseCsv(await file.text()));
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : "Gagal membaca file CSV.",
      );
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmitSheet = async () => {
    if (dataLoading) return;
    const link = sheetUrl.trim();
    if (!link) {
      setDataError("Masukkan link Google Sheets dulu.");
      return;
    }

    let endpoint: string;
    try {
      endpoint = sheetCsvUrl(link);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : "Link tidak valid.");
      return;
    }

    setDataError(null);
    setDataLoading(true);
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(
          "Sheet tidak ditemukan atau belum dibagikan ke publik.",
        );
      }
      const text = await response.text();
      if (/^\s*</.test(text)) {
        throw new Error(
          "Link mengembalikan halaman, bukan data. Bagikan sheet sebagai “Anyone with the link”.",
        );
      }
      applySheetData(parseCsv(text));
    } catch (err) {
      // Respons privat/tanpa ACAO diblokir CORS → fetch melempar TypeError
      setDataError(
        err instanceof TypeError
          ? "Gagal memuat data dari browser. Pastikan sheet dibagikan sebagai “Anyone with the link”, atau gunakan File CSV."
          : err instanceof Error
            ? err.message
            : "Gagal memuat data dari Google Sheets.",
      );
    } finally {
      setDataLoading(false);
    }
  };

  const handleSourceChange = (next: DataSource) => {
    if (next === source || dataLoading) return;
    // Data yang sudah dimuat milik sumber sebelumnya → kosongkan
    setSource(next);
    setRows([]);
    setHeaders([]);
    setDataError(null);
  };

  const handleSheetUrlChange = (url: string) => {
    setSheetUrl(url);
    if (dataError) setDataError(null);
  };

  // "Ubah File" (tombol di posisi toggle setelah upload): kembali ke tampilan
  // sebelum input data — zone CSV kosong / input link Sheets (langsung fokus).
  const handleChangeData = () => {
    setRows([]);
    setHeaders([]);
    setDataError(null);
    // Seleksi baris milik data lama → reset untuk data baru
    setPreviewIndex(0);
    setExcludedRows(new Set());
    if (source === "sheets") {
      // Input link kembali tampil setelah re-render
      setTimeout(() => linkInputRef.current?.focus(), 0);
    }
  };

  // Tambah field dari kolom yang dipilih panel (default: kolom pertama belum terpakai sisi itu)
  const handleAddField = (columnKey: string, side: TemplateSide) => {
    if (!columnKey) return;
    setFields((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        columnKey,
        side,
        x: 50,
        y: 50,
        fontSize: 32,
        fontFamily: "Inter",
        fontWeight: 400,
        color: DEFAULT_TEXT_COLOR,
      },
    ]);
  };

  const handleUpdateField = (id: string, patch: Partial<FieldConfig>) => {
    setFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
  };

  // Pra-load font saat pertama masuk step 4 — preview & PDF konsisten
  useEffect(() => {
    if (step !== 3 || phase !== "preparing") return;
    let cancelled = false;
    Promise.all(
      FONT_CHOICES.map((choice) =>
        document.fonts
          .load(`${choice.weight} 32px ${fontStack(choice.family)}`)
          .catch(() => {}),
      ),
    )
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPhase("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [step, phase]);

  const selectedCount = rows.length - excludedRows.size;

  const handleToggleExclude = (index: number) => {
    setExcludedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleToggleAll = () => {
    setExcludedRows((prev) =>
      prev.size > 0 ? new Set() : new Set(rows.map((_, index) => index)),
    );
  };

  /** Baris terpilih saja (urut asli) — dipakai ketiga opsi unduhan */
  const chosenRows = () => rows.filter((_, index) => !excludedRows.has(index));

  /** Unduh blob sementara (revoke ditunda agar unduhan sempat jalan) */
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  // Opsi 1 — PDF gabungan multi-halaman (primary "Download" di action bar)
  const handleGeneratePdf = async () => {
    if (!image || phase === "generating" || selectedCount === 0) return;
    const chosen = chosenRows();
    setPhase("generating");
    setResultError(null);
    try {
      const doc = await buildCertificatePdf({
        frontUrl: image,
        backUrl: imageBack,
        fields,
        rows: chosen,
      });
      const fileName = `certificate-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      setLastOutput("pdf");
      setPhase("done");
    } catch (err) {
      setResultError(err instanceof Error ? err.message : "Gagal membuat PDF.");
      setPhase("error");
    }
  };

  // Opsi 2 — PDF satuan per sertifikat, nama dari pola → dikumpulkan jadi ZIP
  const handleDownloadSatuan = async () => {
    if (!image || phase === "generating" || selectedCount === 0) return;
    const chosen = chosenRows();
    setPhase("generating");
    setResultError(null);
    try {
      const used = new Set<string>();
      const entries: ZipEntry[] = [];
      for (const [index, row] of chosen.entries()) {
        const doc = await buildCertificatePdf({
          frontUrl: image,
          backUrl: imageBack,
          fields,
          rows: [row],
        });
        const name = uniqueFileName(
          `${buildFileName(effectiveFileNameColumn, row, index)}.pdf`,
          used,
        );
        entries.push({
          name,
          data: new Uint8Array(doc.output("arraybuffer")),
        });
      }
      if (entries.length === 1) {
        // Cuma satu file → langsung unduh, tidak perlu ZIP
        downloadBlob(
          new Blob([entries[0].data], { type: "application/pdf" }),
          entries[0].name,
        );
      } else {
        downloadBlob(createZip(entries), "pdf-satuan.zip");
      }
      setLastOutput("zip-pdf");
      setPhase("done");
    } catch (err) {
      setResultError(
        err instanceof Error ? err.message : "Gagal membuat PDF satuan.",
      );
      setPhase("error");
    }
  };

  // Opsi 3 — PNG per baris per sisi → ZIP (suffix sisi bila belakang ada)
  const handleDownloadImages = async () => {
    if (!image || phase === "generating" || selectedCount === 0) return;
    const chosen = chosenRows();
    setPhase("generating");
    setResultError(null);
    try {
      const used = new Set<string>();
      const entries: ZipEntry[] = [];
      for (const [index, row] of chosen.entries()) {
        const base = buildFileName(effectiveFileNameColumn, row, index);
        const pngs = await renderRowPngs({
          frontUrl: image,
          backUrl: imageBack,
          fields,
          row,
        });
        for (const { side, blob } of pngs) {
          const suffix = imageBack
            ? side === "front"
              ? "-depan"
              : "-belakang"
            : "";
          entries.push({
            name: uniqueFileName(`${base}${suffix}.png`, used),
            data: new Uint8Array(await blob.arrayBuffer()),
          });
        }
      }
      downloadBlob(createZip(entries), "gambar-satuan.zip");
      setLastOutput("zip-img");
      setPhase("done");
    } catch (err) {
      setResultError(
        err instanceof Error ? err.message : "Gagal membuat gambar ZIP.",
      );
      setPhase("error");
    }
  };

  /** Pilih opsi dari menu Download → tutup menu, jalankan handler-nya */
  const runDownload = (kind: DownloadKind) => {
    setDownloadMenu(false);
    if (kind === "pdf") void handleGeneratePdf();
    else if (kind === "zip-pdf") void handleDownloadSatuan();
    else void handleDownloadImages();
  };

  const canNext =
    step === 0
      ? templateReady
      : step === 1
        ? dataReady
        : step === 2
          ? fieldsReady
          : phase !== "preparing" &&
            phase !== "generating" &&
            selectedCount > 0;

  const handlePrimary = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    // Step 4 — klik Download membuka menu 3 opsi; generate setelah user memilih
    setDownloadMenu((open) => !open);
  };

  // Action bar kiri: step template → tambah/hapus tampilan belakang;
  // step lain → Sebelumnya (step nav tidak bisa diklik, jadi ini satu-satunya jalan kembali)
  const secondaryAction = ((): ReactNode => {
    if (step === 0) {
      if (!templateReady) return null;
      return imageBack ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRemoveBack}
        >
          Hapus tampilan belakang
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          iconLeft={<ImagePlusIcon className="size-4" />}
          onClick={() => backInputRef.current?.click()}
        >
          Tambahkan tampilan belakang
        </Button>
      );
    }
    return (
      <Button
        variant="secondary"
        size="sm"
        iconLeft={<ChevronRightIcon className="size-4 rotate-180" />}
        onClick={() => {
          setDownloadMenu(false);
          setStep(step - 1);
        }}
      >
        Sebelumnya
      </Button>
    );
  })();

  const stepContent = (() => {
    switch (step) {
      case 0:
        return (
          <UploadCertificate
            image={image}
            fileName={imageInfo?.name ?? null}
            fileSize={imageInfo?.size ?? null}
            imageBack={imageBack}
            backFileName={imageInfoBack?.name ?? null}
            backFileSize={imageInfoBack?.size ?? null}
            side={templateSide}
            onSideChange={setTemplateSide}
            error={imageError}
            onPickImage={() => imageInputRef.current?.click()}
            onFile={handleImageFile}
            onPickBack={() => backInputRef.current?.click()}
            onBackFile={handleBackImageFile}
          />
        );
      case 1:
        return (
          <UploadData
            source={source}
            sheetUrl={sheetUrl}
            headers={headers}
            rows={rows}
            loading={dataLoading}
            error={dataError}
            onSourceChange={handleSourceChange}
            onSheetUrlChange={handleSheetUrlChange}
            onPickFile={() => csvInputRef.current?.click()}
            onFile={handleCsvFile}
            onSubmitSheet={handleSubmitSheet}
            onChangeData={handleChangeData}
            linkInputRef={linkInputRef}
          />
        );
      case 2:
        return (
          <EditCanvas
            image={image}
            imageBack={imageBack}
            headers={headers}
            rows={rows}
            fields={fields}
            onAddField={handleAddField}
            onRemoveField={handleRemoveField}
            onUpdateField={handleUpdateField}
          />
        );
      default:
        return (
          <Result
            image={image}
            imageBack={imageBack}
            rows={rows}
            fields={fields}
            phase={phase}
            error={resultError}
            lastOutput={lastOutput}
            excludedRows={excludedRows}
            previewIndex={previewIndex}
            onPreviewIndexChange={setPreviewIndex}
            onToggleExclude={handleToggleExclude}
            onToggleAll={handleToggleAll}
            headers={headers}
            fileNameColumn={effectiveFileNameColumn}
            onFileNameColumnChange={setFileNameColumn}
          />
        );
    }
  })();

  return (
    <div className="flex min-h-screen flex-col bg-indigo-surface">
      <Navbar />

      {/* Layar selayar untuk layar <768px (HP portrait) — cukup dirotot, web langsung tampil */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-surface px-8 text-center md:hidden">
        <RotateIcon className="size-12 text-primary" />
        <div className="flex flex-col gap-2">
          <p className="text-title text-ink">
            Please rotate your device or use a laptop
          </p>
          <p className="text-body text-ink-muted">
            Silakan rotasikan perangkat ini atau buka di laptop untuk
            menggunakan web.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 md:px-6">
        <section className="relative rounded-container border border-line bg-surface p-5 shadow-card">
          <button
            type="button"
            aria-label="Bantuan"
            title="Bantuan"
            className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-line-strong text-label text-ink transition hover:bg-surface-subtle md:right-6 md:top-6"
          >
            ?
          </button>

          <div className="flex gap-5 lg:gap-10">
            <aside className="w-52 shrink-0 lg:w-70">
              <StepNav steps={STEPS} current={step} />
            </aside>

            <div className="flex min-h-115 min-w-0 flex-1 flex-col">
              <div className="flex flex-1 flex-col">{stepContent}</div>

              {/* Action bar: aksi sekunder kiri, satu primary action kanan */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 md:mt-8">
                <div>{secondaryAction}</div>
                <div className="relative">
                  {/* Menu 3 opsi unduhan — terbuka di atas tombol Download */}
                  {step === STEPS.length - 1 && downloadMenu && (
                    <>
                      <div
                        aria-hidden
                        className="fixed inset-0 z-30"
                        onClick={() => setDownloadMenu(false)}
                      />
                      <div
                        role="menu"
                        aria-label="Pilihan unduhan"
                        className="absolute bottom-full right-0 z-40 mb-2 w-72 rounded-control border border-line bg-surface p-1 shadow-card"
                      >
                        {DOWNLOAD_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            role="menuitem"
                            onClick={() => runDownload(option.id)}
                            className="flex w-full flex-col gap-0.5 rounded-chip px-3 py-2 text-left transition hover:bg-surface-subtle"
                          >
                            <span className="text-label text-ink">
                              {option.title}
                            </span>
                            <span className="text-body text-ink-muted">
                              {option.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!canNext}
                    loading={
                      step === STEPS.length - 1 && phase === "generating"
                    }
                    onClick={handlePrimary}
                    iconRight={
                      step === STEPS.length - 1 ? (
                        <DownloadIcon className="size-4" />
                      ) : (
                        <ChevronRightIcon className="size-4" />
                      )
                    }
                  >
                    {step === STEPS.length - 1
                      ? phase === "generating"
                        ? "Generating..."
                        : "Download"
                      : "Lanjutkan"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Footer className="mt-6" />
        </section>
      </main>

      {/* File picker tersembunyi, di-owned wizard agar bisa dipakai zone preview & tombol aksi */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={backInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleBackImageFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCsvFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
