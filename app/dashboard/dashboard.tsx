"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import RotateGate from "@/components/common/rotate-gate";
import Button, { ButtonLink } from "@/components/common/button";
import {
  DatabaseIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  ImagePlusIcon,
  PlusIcon,
  TableIcon,
} from "@/components/common/icons";
import type { DownloadKind } from "@/components/flow/types";
import {
  animateSafe,
  prefersReducedMotion,
  useAnimationLayoutEffect,
} from "@/lib/animations";
import {
  clearDashboard,
  formatUkuran,
  loadDashboard,
  loadFileBlob,
  sisaWaktuLabel,
  type DashboardData,
} from "@/lib/activity";
import { cachedThumb, thumbUrl, warmThumbs } from "@/lib/thumb";
import { downloadTiming } from "@/lib/download";
import { formatDurationMs } from "@/lib/quality";
import PreviewModal, { type PreviewTarget } from "./preview-modal";

/** Label jenis output — istilah baku tetap Inggris (lihat AGENTS.md) */
const OUTPUT_LABEL: Record<DownloadKind, string> = {
  pdf: "PDF gabungan",
  "zip-pdf": "PDF satuan",
  "zip-img": "Gambar PNG",
};

/** Panel akordeon — urut dari kiri ke kanan */
type PanelId = "templates" | "datasets" | "results";
const PANEL_IDS: PanelId[] = ["templates", "datasets", "results"];

/** Lebar panel non-aktif (tab vertikal) — 48px di layar sempit, 56px di ≥1024px */
const COLLAPSED_WIDE = 56;
const COLLAPSED_NARROW = 48;

/** Transisi melebar/mengecil panel (anime.js) */
const PANEL_DURATION = 320;

/** Satu proses unduhan di dashboard — dasar status loading + estimasi */
interface DownloadJob {
  id: string;
  name: string;
  size: number;
  /** Date.now() saat tombol diklik */
  startedAt: number;
  /** Estimasi total proses (ms) — lihat `lib/download` */
  totalMs: number;
  phase: "preparing" | "sending" | "error";
  /** Teks kesalahan saat phase "error" */
  error?: string;
}

/** Batas status "Menyiapkan" sebelum dianggap macet (ms) */
const PREPARE_TIMEOUT_MS = 15_000;
/** Status error otomatis hilang (ms) */
const ERROR_DISMISS_MS = 6000;

/** Lebar target tiap panel: aktif = sisa ruang, non-aktif = tab sempit */
function widthsFor(
  activeId: PanelId,
  total: number,
): Record<PanelId, number> {
  const collapsed =
    typeof window !== "undefined" && window.innerWidth < 1024
      ? COLLAPSED_NARROW
      : COLLAPSED_WIDE;
  const expanded = Math.max(
    total - collapsed * (PANEL_IDS.length - 1),
    collapsed,
  );
  const out = {} as Record<PanelId, number>;
  for (const id of PANEL_IDS) out[id] = id === activeId ? expanded : collapsed;
  return out;
}

/**
 * Panel akordeon — yang aktif melebar (header + daftar ber-scroll),
 * yang non-aktif jadi tab vertikal (klik untuk membuka).
 * Lebar elemen diatur imperative dari Dashboard (animasi anime.js),
 * jadi lebar TIDAK boleh lewat className/style React.
 */
const PANEL_CLASS =
  "flex min-w-0 flex-col overflow-hidden bg-surface border-l border-line first:border-l-0";

function Panel({
  title,
  icon,
  count,
  empty,
  active,
  onActivate,
  panelRef,
  children,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  empty: string;
  active: boolean;
  onActivate: () => void;
  panelRef: (el: HTMLElement | null) => void;
  children: ReactNode;
}) {
  if (active) {
    return (
      <section ref={panelRef} className={PANEL_CLASS}>
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-2 text-label text-ink">
            <span className="flex size-8 items-center justify-center rounded-full bg-surface-subtle text-primary">
              {icon}
            </span>
            {title}
          </h2>
          <span className="text-label text-ink-muted">{count} data</span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {count === 0 ? (
            <p className="text-body text-ink-muted">{empty}</p>
          ) : (
            <ul className="flex flex-col gap-2">{children}</ul>
          )}
        </div>
      </section>
    );
  }

  return (
    <section ref={panelRef} className={PANEL_CLASS}>
      <button
        type="button"
        onClick={onActivate}
        aria-expanded={false}
        aria-label={`Buka panel ${title} (${count} data)`}
        className="flex h-full w-full flex-col items-center gap-3 py-4 text-ink-muted transition hover:bg-surface-subtle hover:text-ink"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-primary">
          {icon}
        </span>
        <span className="text-label" style={{ writingMode: "vertical-rl" }}>
          {title}
        </span>
        <span className="mt-auto rounded-chip border border-line bg-surface-subtle px-2 py-0.5 text-label text-ink-secondary">
          {count}
        </span>
      </button>
    </section>
  );
}

/**
 * Preview thumbnail — gambar dikecilkan dulu di `lib/thumb` (cache per id)
 * supaya buka panel tidak nge-frame; placeholder tampil selama dimuat.
 */
function Thumb({ id, name }: { id: string; name: string }) {
  const [url, setUrl] = useState<string | null>(() => cachedThumb(id));

  useEffect(() => {
    if (url) return;
    let active = true;
    void thumbUrl(id)
      .then((u) => {
        if (active) setUrl(u);
      })
      .catch(() => {
        /* file hilang — placeholder tetap tampil */
      });
    return () => {
      active = false;
    };
  }, [id, url]);

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        decoding="async"
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
  // Panel yang melebar — default panel kanan (Hasil Generate) sesuai mockup
  const [active, setActive] = useState<PanelId>("results");
  // Pratinjau isi (gambar · tabel · PDF · ZIP) — modal, dimuat on-demand
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  // Proses unduhan berjalan → tombol loading + strip status (estimasi)
  const [job, setJob] = useState<DownloadJob | null>(null);
  /** Elapsed (ms) proses unduhan berjalan — diisi ticker di effect, bukan render */
  const [elapsedMs, setElapsedMs] = useState(0);
  /** Cerminan `job` untuk dicek setelah await (mencegah status "bangkit lagi") */
  const jobRef = useRef<DownloadJob | null>(null);
  useEffect(() => {
    jobRef.current = job;
  }, [job]);
  /** Pemanasan thumbnail hanya sekali (refresh TTL jalan tiap 60 detik) */
  const warmedRef = useRef(false);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<Partial<Record<PanelId, HTMLElement | null>>>({});
  /** Lebar sudah pernah diukur & dipasang sekali (sebelum paint pertama) */
  const placedRef = useRef(false);
  const prevActiveRef = useRef<PanelId>(active);

  const ready = data !== null;

  /** Pasang lebar semua panel TANPA animasi (layout awal / resize / reduced motion) */
  const applyWidths = useCallback((id: PanelId) => {
    const box = boxRef.current;
    const total = box?.clientWidth ?? 0;
    if (!total) return false;
    const widths = widthsFor(id, total);
    let ok = true;
    for (const pid of PANEL_IDS) {
      const el = panelRefs.current[pid];
      if (!el) {
        ok = false;
        continue;
      }
      el.style.width = `${widths[pid]}px`;
    }
    return ok;
  }, []);

  // Pemasangan awal SEBELUM paint (tanpa flash) + transisi anime.js saat
  // panel berganti. Anime hanya menggerakkan `width`; konten di-swap React.
  useAnimationLayoutEffect(() => {
    if (!ready) {
      placedRef.current = false;
      prevActiveRef.current = active;
      return;
    }
    if (!placedRef.current) {
      if (applyWidths(active)) {
        placedRef.current = true;
        prevActiveRef.current = active;
      }
      return;
    }
    if (prevActiveRef.current === active || prefersReducedMotion()) {
      applyWidths(active);
      prevActiveRef.current = active;
      return;
    }

    prevActiveRef.current = active;
    const box = boxRef.current;
    if (!box) return;
    const widths = widthsFor(active, box.clientWidth);
    const cleanups = PANEL_IDS.map((pid) => {
      const el = panelRefs.current[pid];
      if (!el) return () => {};
      return animateSafe(el, {
        width: `${widths[pid]}px`,
        duration: PANEL_DURATION,
        ease: "outCubic",
      });
    });
    return () => {
      // Dijeda sebelum giliran berikutnya → klik cepat tidak tabrakan
      for (const cleanup of cleanups) cleanup();
    };
  }, [active, ready, applyWidths]);

  // Resize window → lebar menyesuaikan langsung (tanpa animasi)
  useEffect(() => {
    const onResize = () => {
      if (placedRef.current) applyWidths(active);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, applyWidths]);

  const refresh = useCallback(async () => {
    const d = await loadDashboard();
    setData(d);
    setNow(Date.now());
    // Panaskan thumbnail template di latar belakang (sekali saja, pelan)
    const thumbIds = d.templates
      .filter((t) => t.hasFile)
      .map((t) => t.id);
    if (thumbIds.length > 0 && !warmedRef.current) {
      warmedRef.current = true;
      warmThumbs(thumbIds);
    }
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

  /**
   * Unduh file dari IndexedDB — tampilkan status "Menyiapkan" + estimasi
   * sisa waktu, lalu jalankan anchor download browser (fase "Mengunduh").
   * Satu proses dalam satu waktu; status error hilang otomatis.
   */
  const startDownload = async (id: string, name: string, size: number) => {
    // Akses lewat helper: TS suka "menyempitkan" jobRef.current ke null
    // setelah guard pertama sehingga blok sesudah await jadi `never`
    const currentJob = () => jobRef.current;
    if (currentJob()) return;
    const base: DownloadJob = {
      id,
      name,
      size,
      ...downloadTiming(size),
      phase: "preparing",
    };
    setElapsedMs(0);
    setJob(base);

    let blob: Blob | null = null;
    try {
      blob = await loadFileBlob(id);
    } catch {
      blob = null;
    }
    // Pengguna bisa saja menutup status selagi menunggu — jangan lanjut
    if (currentJob()?.id !== id) return;
    if (!blob) {
      setJob({
        ...base,
        phase: "error",
        error: "File tidak ditemukan — mungkin sudah melewati 24 jam.",
      });
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    setJob({ ...base, phase: "sending" });
  };

  /**
   * Tick status unduhan tiap 250 ms → hitung mundur; estimasi selesai /
   * error lewat batas / menyiapkan macet → strip ditutup.
   */
  useEffect(() => {
    if (!job) return;
    const timer = setInterval(() => {
      const elapsed = Date.now() - job.startedAt;
      if (
        (job.phase === "sending" && elapsed >= job.totalMs) ||
        (job.phase === "error" && elapsed >= ERROR_DISMISS_MS) ||
        (job.phase === "preparing" &&
          elapsed >= Math.max(job.totalMs * 4, PREPARE_TIMEOUT_MS))
      ) {
        setJob(null);
        return;
      }
      setElapsedMs(elapsed);
    }, 250);
    return () => clearInterval(timer);
  }, [job]);

  /** Sisa waktu tampilan (ms) —0 saat fase error (tanpa estimasi) */
  const sisaMs = job
    ? job.phase === "error"
      ? 0
      : Math.max(0, job.totalMs - elapsedMs)
    : 0;
  const progressPct = job
    ? Math.min(100, Math.max(4, Math.round((elapsedMs / job.totalMs) * 100)))
    : 0;

  return (
    <div className="flex h-dvh flex-col bg-indigo-surface">
      <RotateGate />
      <Navbar onDeleteData={handleClear} />

      <main className="mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col gap-4 px-4 py-5 short:gap-2 short:py-3 md:px-6">
        {/* Judul + satu primary action layar ini */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-display text-ink">Dashboard</h1>
          <ButtonLink
            href="/certificate"
            iconLeft={<PlusIcon className="size-4" />}
          >
            Buat Sertifikat
          </ButtonLink>
        </div>

        {/* Masa simpan 24 jam — banner danger mengikuti mockup */}
        <div className="flex items-start gap-3 rounded-container bg-danger px-4 py-3 text-surface shadow-card">
          <DatabaseIcon className="mt-0.5 size-5 shrink-0" />
          <p className="text-body">
            <strong>Data di Dashboard ini bersifat sementara.</strong> Dihapus
            otomatis setelah 24 jam sejak diunggah atau dihasilkan. Gunakan
            tombol <strong>Hapus Data</strong> untuk langsung menghapus datanya.
          </p>
        </div>

        {/* Pemberitahuan setelah prune otomatis */}
        {notice && (
          <div className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-4 py-2 shadow-card">
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
          <p className="text-label text-danger">
            {data.error} — riwayat tidak dapat dimuat di browser ini. Proses
            membuat sertifikat tetap berjalan normal.
          </p>
        )}

        {/* Status unduhan — loading + estimasi sisa waktu */}
        {job && (
          <div className="rounded-control border border-line bg-surface px-4 py-3 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-label text-ink">
                {job.phase === "error"
                  ? "Unduhan gagal"
                  : job.phase === "preparing"
                    ? "Menyiapkan file…"
                    : "Mengunduh"}{" "}
                <span className="text-ink-muted">{job.name}</span>
              </p>
              <div className="flex shrink-0 items-center gap-3">
                {job.phase !== "error" && (
                  <span className="text-label text-ink-muted">
                    {formatUkuran(job.size)} · sisa ± {formatDurationMs(sisaMs)}
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Tutup status unduhan"
                  onClick={() => setJob(null)}
                  className="text-title text-ink-muted transition hover:text-ink"
                >
                  ×
                </button>
              </div>
            </div>
            {job.phase === "error" ? (
              <p className="mt-1 text-body text-danger">{job.error}</p>
            ) : (
              <div className="mt-2 h-1.5 overflow-hidden rounded-chip bg-surface-subtle">
                <div
                  className="h-full bg-action transition-[width] duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* KOTAK — satu-satunya area yang di-scroll isinya */}
        <div
          ref={boxRef}
          className="flex min-h-0 flex-1 overflow-hidden rounded-container border border-line bg-surface shadow-card"
        >
          {data === null ? (
            <p className="m-auto text-body text-ink-muted">Memuat data…</p>
          ) : (
            <>
              <Panel
                title="File Sertifikat"
                icon={<ImagePlusIcon className="size-4" />}
                count={data.templates.length}
                empty="Belum ada file sertifikat yang diunggah."
                active={active === "templates"}
                onActivate={() => setActive("templates")}
                panelRef={(el) => {
                  panelRefs.current.templates = el;
                }}
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
                    {t.hasFile && (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          iconLeft={<EyeIcon className="size-4" />}
                          onClick={() =>
                            setPreview({
                              type: "template",
                              id: t.id,
                              name: t.name,
                              size: t.size,
                            })
                          }
                        >
                          Pratinjau
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          iconLeft={<DownloadIcon className="size-4" />}
                          loading={job?.id === t.id}
                          disabled={job !== null && job.id !== t.id}
                          onClick={() =>
                            void startDownload(t.id, t.name, t.size)
                          }
                        >
                          Unduh
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </Panel>

              <Panel
                title="Data"
                icon={<TableIcon className="size-4" />}
                count={data.datasets.length}
                empty="Belum ada data yang dimuat."
                active={active === "datasets"}
                onActivate={() => setActive("datasets")}
                panelRef={(el) => {
                  panelRefs.current.datasets = el;
                }}
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
                        {d.source === "csv"
                          ? `File CSV · ${formatUkuran(d.size ?? 0)} · `
                          : "Google Sheets · "}
                        {d.rows} baris
                      </Meta>
                      <SisaWaktu at={d.at} now={now} />
                    </div>
                    {(d.hasFile || d.url) && (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          iconLeft={<EyeIcon className="size-4" />}
                          onClick={() =>
                            setPreview(
                              d.hasFile && d.source === "csv"
                                ? {
                                    type: "csv",
                                    id: d.id,
                                    name: d.name ?? "data.csv",
                                    size: d.size ?? 0,
                                  }
                                : {
                                    type: "sheet",
                                    url: d.url ?? "",
                                    name: "Google Sheets",
                                  },
                            )
                          }
                        >
                          Pratinjau
                        </Button>
                        {d.hasFile && (
                          <Button
                            size="sm"
                            variant="secondary"
                            iconLeft={<DownloadIcon className="size-4" />}
                            loading={job?.id === d.id}
                            disabled={job !== null && job.id !== d.id}
                            onClick={() =>
                              void startDownload(
                                d.id,
                                d.name ?? "data.csv",
                                d.size ?? 0,
                              )
                            }
                          >
                            Unduh
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </Panel>

              <Panel
                title="Hasil Generate"
                icon={<DownloadIcon className="size-4" />}
                count={data.results.length}
                empty="Belum ada hasil yang diunduh."
                active={active === "results"}
                onActivate={() => setActive("results")}
                panelRef={(el) => {
                  panelRefs.current.results = el;
                }}
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
                      <p className="truncate text-label text-ink">
                        {r.fileName}
                      </p>
                      <Meta>
                        {OUTPUT_LABEL[r.output]} · {r.files} file · {r.pages}{" "}
                        halaman · {formatUkuran(r.size)}
                        {/* File tak tersimpan (>batas/kuota penuh) → Unduh ulang
                            memang tidak ditampilkan, beri tahu pengguna */}
                        {!r.hasFile && " · file tidak disimpan di browser"}
                      </Meta>
                      <SisaWaktu at={r.at} now={now} />
                    </div>
                    {r.hasFile && (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          iconLeft={<EyeIcon className="size-4" />}
                          onClick={() =>
                            setPreview({
                              type: "result",
                              id: r.id,
                              name: r.fileName,
                              size: r.size,
                              output: r.output,
                            })
                          }
                        >
                          Pratinjau
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          iconLeft={<DownloadIcon className="size-4" />}
                          loading={job?.id === r.id}
                          disabled={job !== null && job.id !== r.id}
                          onClick={() => void startDownload(r.id, r.fileName, r.size)}
                        >
                          Unduh ulang
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </Panel>
            </>
          )}
        </div>

        {/* Pratinjau isi (gambar · tabel · PDF · ZIP) — overlay di luar scroll */}
        {preview && (
          <PreviewModal
            target={preview}
            download={
              preview.type === "sheet"
                ? undefined
                : {
                    loading: job?.id === preview.id,
                    onClick: () =>
                      void startDownload(preview.id, preview.name, preview.size),
                  }
            }
            onClose={() => setPreview(null)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
