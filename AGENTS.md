<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

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

- **Template: dua sisi** — slot **Depan (wajib)** + **Belakang (opsional)**; keduanya bisa punya field dinamis dari **kolom data yang sama** (CSV/Sheets). Field punya `side: "front" | "back"`; canvas & preview step 4 punya tab Depan/Belakang; PDF gabungan = per baris halaman depan lalu halaman belakang (bila ada). **Step template menampilkan satu preview sisi aktif** (bukan dua slot berdampingan): klik preview = ganti gambar sisi itu; toggle pill `Depan`/`Belakang` di bawah preview **dengan posisi & gaya sama seperti toggle File CSV/Sheets** (`Belakang` disabled sampai template belakang ada; setelah upload belakang otomatis berpindah ke sisi belakang); action bar kiri = `Tambahkan tampilan belakang` / `Hapus tampilan belakang` (konfirmasi bila ada field di sisi itu) — **tidak ada tombol `Ubah File` di step ini**.
- **Output unduhan: 3 opsi** — semuanya dibuka dari tombol primary `Download` di action bar step 4: **klik → menu 3 opsi muncul di atas tombol** (bukan tombol terpisah di konten; backdrop klik-keluar menutup menu):
  1. **PDF gabungan** multi-halaman (A4 landscape, jsPDF + rendering `<canvas>`).
  2. **PDF satuan** — 1 file PDF per sertifikat (depan+belakang) → **ZIP** (`pdf-satuan.zip`) — bila cuma 1 file, unduh langsung tanpa ZIP.
  3. **Gambar PNG** — render per baris per sisi → **ZIP** (`gambar-satuan.zip`); suffix `-depan`/`-belakang` hanya bila template belakang ada.
  ZIP ditulis sendiri di `app/lib/zip.ts` (store-only + CRC32 + flag UTF-8) — **tanpa dependency baru**; sudah diverifikasi test roundtrip + ekstraksi .NET.
  **Nama file** (opsi 2 & 3) = `2026-001_Budi`: tahun berjalan - **nomor urut 3 digit per paket unduhan** (`001`, `002`, … urut baris terpilih) - **nilai kolom pilihan user** (dropdown di step 4, default kolom pertama) — `buildFileName(column, row, index)` di `app/lib/filename.ts` + sanitasi karakter Windows; pilihan kolom disimpan di draft sebagai `fileNameColumn` (input pola `{Kolom}` lama sudah dihapus; key lama `filePattern` diabaikan).
- **Sumber data: `File CSV` dan `Google Sheets`** (toggle di step Entering data, tampil sebelum data terupload). **Setelah terupload, toggle diganti tombol `Ubah File` di posisi yang sama** — diklik = kembali ke tampilan awal sebelum input (CSV → zone kosong, Sheets → input link + fokus; seleksi baris di-reset) — satu-satunya aksi ganti di layar itu, tanpa link tambahan lain. Link Google Sheets publik dikonversi ke endpoint `gviz/tq?tqx=out:csv` lalu di-fetch client-side. **CORS sudah diverifikasi via curl**: gviz membalas 200 `text/csv` dan me-reflect `Access-Control-Allow-Origin` sesuai Origin; respons privat/tidak valid TIDAK punya ACAO sehingga fetch gagal sebagai `TypeError` — tangkap dan sarankan fallback File CSV.
- **Elemen canvas: teks dinamis (field) saja** — kolom dari data, digeser dengan drag & drop, posisi disimpan sebagai % relatif, per sisi template (`side`). Tanpa gambar/QR/tanda tangan. Font Color: 4 swatch cepat (Ink/Putih/Merah/Biru) + color picker native + input HEX (juga terima `rgb(...)`) dengan readout RGB; **tombol picker dibentuk kotak berbingkai + ikon palet** agar tidak disamakan dengan swatch bulat. **Teks field tidak boleh keluar tepi canvas**: kotak field `width = field.width ?? (100-x)%` + `white-space: pre-wrap; word-break: break-word` → teks membungkus ke bawah dalam batas template; renderer PDF/PNG memakai wrap greedy yang sama (`wrapLines` di `app/lib/text-wrap.ts`). **Lebar bisa diubah user** lewat handle kanan-bawah kotak field terpilih (cursor `nwse-resize`) → menyimpan `FieldConfig.width` (%), dijaga `x + width ≤ 100` (min 5%) dan `y` di-clamp agar tepi bawah kotak tetap dalam foto.
- **Penyimpanan: localStorage** dengan key:
  - `gc:draft` — sesi kerja (step aktif, link data, konfigurasi field **termasuk sisi & lebar per field**, **kedua template sebagai data URL**, kolom penamaan file), dipulihkan otomatis saat refresh — debounce 300 ms + flush `pagehide`; file besar dire-encode; `QuotaExceededError` → buang salinan PDF dulu, lalu template belakang, baru template depan (draft lama tanpa field baru tetap terbaca — semua field baru bersifat opsional)
  - `gc:history` / `gc:pdfs` — **fitur History sudah dihapus total** (panel History di step 4, penulisan log & salinan PDF, `pushHistory`/`savePdf` sudah tidak ada); key lama tetap ikut dibersihkan oleh `Delete Data` (ketiga key `GC_KEYS`) dan oleh fallback kuota `saveDraft` yang membuang `gc:pdfs` dulu
  - **Refresh TIDAK menghapus data** — satu-satunya cara menghapus adalah tombol `Delete Data` di navbar (konfirmasi → hapus ketiga key → reload).
- **UI light-only**, font Inter, tanpa varian dark mode.
- **Responsif**: layar **<768px diblokir overlay selayar** (EN + ID, "rotate atau pakai laptop") — dirotot ke landscape (≥768px) web langsung tampil; ≥768px menyesuaikan: sidebar step ~210px + padding rapat di tablet portrait (768–1023px), panel properti canvas ditumpuk di bawah canvas, ≥1024px seperti desktop.

## Struktur

- `app/certificate/page.tsx` — halaman wizard utama (**fokus utama proyek**), render `CertificateWizard`.
- `app/components/flow/certificate-wizard.tsx` — shell halaman: state machine 4 step, action bar, mount step components. 4 step: `Certificate Template` → `Entering data` → `Designing on a canvas` → `Complete the process`.
- `app/components/flow/types.ts` — tipe bersama (`DataSource`, `DataRow`, `FieldConfig`, `TemplateSide`, `DownloadKind`) + helper `fieldSide`.
- `app/lib/csv.ts` — parser CSV ringan (quoted field, CRLF, BOM, header duplikat).
- `app/lib/sheets.ts` — konversi link Google Sheets → endpoint gviz CSV (lihat catatan CORS).
- `app/lib/fonts.ts` — pilihan font/warna teks + helper warna (`hexToRgb`, `parseColorInput`) untuk panel canvas & render PDF.
- `app/lib/pdf.ts` — render PDF A4 landscape (jsPDF + canvas 150 DPI) untuk 3 opsi unduhan: `buildCertificatePdf` (gabungan; `rows: [row]` = satuan) dan `renderRowPngs` (PNG per sisi).
- `app/lib/filename.ts` — nama file unduhan `tahun-nomor_kolom` (`buildFileName(column, row, index)` + sanitasi Windows, `uniqueFileName` anti-bentrok di ZIP).
- `app/lib/text-wrap.ts` — pemecah baris teks (`wrapLines`) agar PDF/PNG konsisten dengan wrap DOM di canvas.
- `app/lib/zip.ts` — penulis ZIP store-only tanpa dependency (`crc32`, `createZip`).
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
