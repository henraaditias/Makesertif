"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import RotateGate from "@/components/common/rotate-gate";
import Button, { ButtonLink } from "@/components/common/button";
import {
  DownloadIcon,
  FileTextIcon,
  ImagePlusIcon,
  PlusIcon,
  TableIcon,
} from "@/components/common/icons";
import type { DownloadKind } from "@/components/flow/types";
import {
  clearDashboard,
  formatUkuran,
  loadDashboard,
  loadFileBlob,
  sisaWaktuLabel,
  type DashboardData,
} from "@/lib/activity";

/** Label jenis output — istilah baku tetap Inggris (lihat AGENTS.md) */
const OUTPUT_LABEL: Record<DownloadKind, string> = {
  pdf: "PDF gabungan",
  "zip-pdf": "PDF satuan",
  "zip-img": "Gambar PNG",
};

/** Kartu bagian riwayat — tampil jika kosong atau berisi daftar */
function Card({
  title,
  icon,
  count,
  empty,
  children,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-container border border-line bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-label text-ink">
          <span className="flex size-8 items-center justify-center rounded-full bg-surface-subtle text-primary">
            {icon}
          </span>
          {title}
        </h2>
        <span className="text-label text-ink-muted">{count} data</span>
      </div>
      {count === 0 ? (
        <p className="text-body text-ink-muted">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">{children}</ul>
      )}
    </section>
  );
}

/** Preview thumbnail — blob diambil on-demand, object URL dibersihkan saat unmount */
function Thumb({ id, name }: { id: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    void loadFileBlob(id).then((blob) => {
      if (!active || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="size-14 shrink-0 rounded-control border border-line object-cover"
      />
    );
  }
  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-control border border-line bg-surface-subtle text-ink-muted">
      <ImagePlusIcon className="size-6" />
    </span>
  );
}

/** Baris meta (ukuran/baris/halaman + sisa waktu TTL) */
function Meta({ children }: { children: ReactNode }) {
  return <p className="text-body text-ink-muted">{children}</p>;
}

function SisaWaktu({ at, now }: { at: number; now: number }) {
  return <p className="text-label text-ink-muted">{sisaWaktuLabel(at, now)}</p>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const refresh = useCallback(async () => {
    const d = await loadDashboard();
    setData(d);
    setNow(Date.now());
    if (d.pruned > 0) {
      setNotice(
        `${d.pruned} data lama (lebih dari 24 jam) telah dihapus otomatis.`,
      );
    }
  }, []);

  // Muat awal — microtask seperti pola restore wizard: hindari setState
  // sinkron di body effect (lint react-hooks/set-state-in-effect)
  useEffect(() => {
    Promise.resolve().then(() => void refresh());
  }, [refresh]);

  // Tiap 60 detik & saat tab kembali fokus: update countdown + prune TTL
  useEffect(() => {
    const tick = () => void refresh();
    const timer = setInterval(tick, 60_000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  /** Hapus data sesi Dashboard (terpisah dari Hapus Data wizard) */
  const handleClear = () => {
    const ok = window.confirm(
      "Hapus semua data Dashboard (file terunggah, data, dan hasil unduhan)? Data sesi membuat sertifikat tidak ikut terhapus. Tindakan ini tidak bisa dibatalkan.",
    );
    if (!ok) return;
    void clearDashboard()
      .catch(() => {})
      .finally(() => window.location.reload());
  };

  /** Unduh ulang blob dari IndexedDB dengan nama tersimpan */
  const unduhFile = async (id: string, fileName: string) => {
    const blob = await loadFileBlob(id);
    if (!blob) {
      window.alert("File tidak ditemukan — mungkin sudah melewati 24 jam.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-indigo-surface">
      <RotateGate />
      <Navbar onDeleteData={handleClear} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 short:py-3 md:px-6">
        {/* Judul + satu primary action layar ini */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-title text-ink">Dashboard</h1>
            <p className="text-body text-ink-muted">
              Riwayat file yang kamu unggah dan hasil yang diunduh di browser
              ini.
            </p>
          </div>
          <ButtonLink
            href="/certificate"
            iconLeft={<PlusIcon className="size-4" />}
          >
            Buat Sertifikat
          </ButtonLink>
        </div>

        {/* Pemberitahuan masa simpan 24 jam */}
        <div className="mb-5 rounded-container border border-line bg-surface p-4 shadow-card">
          <p className="text-body text-ink-secondary">
            Data di Dashboard ini bersifat sementara: file terunggah, data, dan
            hasil unduhan{" "}
            <strong className="text-ink">dihapus otomatis setelah 24 jam</strong>{" "}
            sejak diunggah atau dihasilkan. Gunakan tombol{" "}
            <strong className="text-ink">Hapus Data</strong> di navbar untuk
            menghapusnya sekarang juga.
          </p>
        </div>

        {/* Pemberitahuan setelah prune otomatis */}
        {notice && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-container border border-line bg-surface p-4 shadow-card">
            <p className="text-body text-ink-secondary">{notice}</p>
            <button
              type="button"
              aria-label="Tutup pemberitahuan"
              onClick={() => setNotice(null)}
              className="text-title text-ink-muted transition hover:text-ink"
            >
              ×
            </button>
          </div>
        )}

        {data?.error && (
          <p className="mb-5 text-label text-danger">
            {data.error} — riwayat tidak dapat dimuat di browser ini. Proses
            membuat sertifikat tetap berjalan normal.
          </p>
        )}

        {data === null ? (
          <p className="text-body text-ink-muted">Memuat data…</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* 1. File sertifikat (template) */}
            <Card
              title="File Sertifikat"
              icon={<ImagePlusIcon className="size-4" />}
              count={data.templates.length}
              empty="Belum ada file sertifikat yang diunggah."
            >
              {data.templates.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-control border border-line bg-surface p-3"
                >
                  <Thumb id={t.id} name={t.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label text-ink">{t.name}</p>
                    <Meta>
                      <span className="mr-1 rounded-full border border-line bg-surface-subtle px-2 py-0.5 text-label text-ink-secondary">
                        {t.side === "front" ? "Depan" : "Belakang"}
                      </span>
                      {formatUkuran(t.size)}
                    </Meta>
                    <SisaWaktu at={t.at} now={now} />
                  </div>
                </li>
              ))}
            </Card>

            {/* 2. Data (CSV / Google Sheets) */}
            <Card
              title="Data"
              icon={<TableIcon className="size-4" />}
              count={data.datasets.length}
              empty="Belum ada data yang dimuat."
            >
              {data.datasets.map((d) => (
                <li
                  key={d.id}
                  className="flex items-start gap-3 rounded-control border border-line bg-surface p-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-line bg-surface-subtle text-ink-muted">
                    {d.source === "csv" ? (
                      <FileTextIcon className="size-5" />
                    ) : (
                      <TableIcon className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label text-ink">
                      {d.source === "csv" ? (
                        d.name ?? "file.csv"
                      ) : d.url ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          title={d.url}
                          className="text-action underline underline-offset-2 hover:opacity-80"
                        >
                          Google Sheets
                        </a>
                      ) : (
                        "Google Sheets"
                      )}
                    </p>
                    <Meta>
                      {d.source === "csv" ? `File CSV · ${formatUkuran(d.size ?? 0)} · ` : "Google Sheets · "}
                      {d.rows} baris
                    </Meta>
                    <SisaWaktu at={d.at} now={now} />
                  </div>
                  {d.source === "csv" && d.hasFile && (
                    <Button
                      size="sm"
                      variant="secondary"
                      iconLeft={<DownloadIcon className="size-4" />}
                      onClick={() =>
                        void unduhFile(d.id, d.name ?? "data.csv")
                      }
                    >
                      Unduh
                    </Button>
                  )}
                </li>
              ))}
            </Card>

            {/* 3. Hasil generate */}
            <Card
              title="Hasil Generate"
              icon={<DownloadIcon className="size-4" />}
              count={data.results.length}
              empty="Belum ada hasil yang diunduh."
            >
              {data.results.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-control border border-line bg-surface p-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-line bg-surface-subtle text-ink-muted">
                    <DownloadIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-label text-ink">{r.fileName}</p>
                    <Meta>
                      {OUTPUT_LABEL[r.output]} · {r.files} file · {r.pages}{" "}
                      halaman · {formatUkuran(r.size)}
                    </Meta>
                    <SisaWaktu at={r.at} now={now} />
                  </div>
                  {r.hasFile && (
                    <Button
                      size="sm"
                      variant="secondary"
                      iconLeft={<DownloadIcon className="size-4" />}
                      onClick={() => void unduhFile(r.id, r.fileName)}
                    >
                      Unduh ulang
                    </Button>
                  )}
                </li>
              ))}
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
