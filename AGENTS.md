<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# GenerateCertificate

Generator sertifikat massal. **Semua diproses di browser** — tanpa backend, tanpa login.

## Stack & perintah

- Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript
- `npm run dev` — development server
- `npm run build` — build produksi
- `npm run lint` — ESLint

## Keputusan produk (jangan diubah tanpa diskusi)

- **Output akhir: satu PDF multi-halaman** (A4 landscape, jsPDF + rendering `<canvas>`) — bukan PNG, bukan ZIP.
- **Sumber data: `File CSV` dan `Google Sheets`** (toggle di step Entering data, tampil sebelum data terupload). **Setelah terupload, toggle diganti tombol `Ubah File` di posisi yang sama** — diklik = kembali ke tampilan awal sebelum input (CSV → zone kosong, Sheets → input link + fokus; seleksi baris di-reset) — satu-satunya aksi ganti di layar itu, tanpa link tambahan lain. Link Google Sheets publik dikonversi ke endpoint `gviz/tq?tqx=out:csv` lalu di-fetch client-side. **CORS sudah diverifikasi via curl**: gviz membalas 200 `text/csv` dan me-reflect `Access-Control-Allow-Origin` sesuai Origin; respons privat/tidak valid TIDAK punya ACAO sehingga fetch gagal sebagai `TypeError` — tangkap dan sarankan fallback File CSV.
- **Elemen canvas: teks dinamis (field) saja** — kolom dari data, digeser dengan drag & drop, posisi disimpan sebagai % relatif. Tanpa gambar/QR/tanda tangan.
- **Penyimpanan: localStorage** dengan key:
  - `gc:draft` — sesi kerja (step aktif, link data, konfigurasi field) **termasuk template sebagai data URL**, dipulihkan otomatis saat refresh — debounce 300 ms + flush `pagehide`; file besar dire-encode; `QuotaExceededError` → buang salinan PDF dulu, baru gambar
  - `gc:history` — log generate (max 20; panel History di step 4 untuk unduh ulang)
  - `gc:pdfs` — salinan PDF hasil untuk unduh ulang (max 3 terbaru; kuota ~5MB: simpan max N terbaru, tangani `QuotaExceededError`)
  - **Refresh TIDAK menghapus data** — satu-satunya cara menghapus adalah tombol `Delete Data` di navbar (konfirmasi → hapus ketiga key → reload).
- **UI light-only**, font Inter, tanpa varian dark mode.
- **Responsif**: layar **<768px diblokir overlay selayar** (EN + ID, "rotate atau pakai laptop") — dirotot ke landscape (≥768px) web langsung tampil; ≥768px menyesuaikan: sidebar step ~210px + padding rapat di tablet portrait (768–1023px), panel properti canvas ditumpuk di bawah canvas, ≥1024px seperti desktop.

## Struktur

- `app/certificate/page.tsx` — halaman wizard utama (**fokus utama proyek**), render `CertificateWizard`.
- `app/components/flow/certificate-wizard.tsx` — shell halaman: state machine 4 step, action bar, mount step components. 4 step: `Certificate Template` → `Entering data` → `Designing on a canvas` → `Complete the process`.
- `app/components/flow/types.ts` — tipe bersama (`DataSource`, `DataRow`, `FieldConfig`).
- `app/lib/csv.ts` — parser CSV ringan (quoted field, CRLF, BOM, header duplikat).
- `app/lib/sheets.ts` — konversi link Google Sheets → endpoint gviz CSV (lihat catatan CORS).
- `app/lib/fonts.ts` — pilihan font/warna teks (panel canvas & render PDF).
- `app/lib/pdf.ts` — render PDF multi-halaman A4 landscape (jsPDF + canvas 150 DPI; satu baris = satu halaman).
- `app/components/flow/` — komponen per step (`upload-certificate`, `upload-data`, `edit-canvas`, `result`), di-mount oleh wizard.
- `app/components/common/` — primitives (`button.tsx`, `icons.tsx` SVG inline).
- `app/components/layout/` — `navbar.tsx`, `footer.tsx`.
- `rev/` — mockup PNG & sheet komponen. **Referensi visual saja, bukan source code.**
- `Design.md` — sumber kebenaran design system. Token sudah diimplementasikan di `app/globals.css`.

## Aturan coding

- Sebelum menulis kode Next.js, baca guide lokal di `node_modules/next/dist/docs/` (lihat block di atas).
- **Satu primary action per layar** (prinsip Design.md).
- Tailwind: pakai token dari `globals.css` (`bg-primary`, `text-ink`, `border-line`, `rounded-control`, `text-title`, `shadow-card`, dst.) — jangan warna/ukuran hardcoded.
- Ikon: inline SVG, tanpa menambah dependency ikon.
- Penamaan: komponen PascalCase dengan `export default`; nama file `result.tsx` (bukan `reasult.tsx`).
- Halaman bersifat client-heavy (upload, canvas, localStorage) — gunakan `"use client"` hanya di komponen yang membutuhkannya.
