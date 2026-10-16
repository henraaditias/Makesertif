GenerateCertificate — Design Guide
Gaya Desain
Gaya desain yang digunakan adalah minimal utility interface: bersih, ringan, profesional, dan berfokus pada penyelesaian proses bertahap.

Karakter utama:

Tampilan minimal dan fungsional
Dominasi warna putih dan abu-abu muda
Indigo sebagai warna aksi utama
Hierarki dibangun melalui kontras teks
Sudut komponen sedikit membulat
Layout berbasis workflow
Cocok untuk aplikasi desktop SaaS
Kata kunci: minimal, clean, calm, precise, workflow-driven, utility-first.

Color Palette
Primary
Warna	Hex	Penggunaan
Primary Indigo	#6366F1	Tombol utama, step aktif, pilihan aktif
Action Blue	#2563EB	Link dan aksi sekunder
Blue	#3B82F6	Aksen interaktif
Light Blue	#60A5FA	Border focus
Soft Blue	#BFDBFE	Selected state
Blue Surface	#EFF6FF	Background state informatif
Indigo Surface	#F5F7FF	Background aksen lembut
Neutral
Warna	Hex	Penggunaan
Primary Text	#111827	Heading dan label utama
Strong Text	#1C1B1F	Teks gelap alternatif
Secondary Text	#4B5563	Teks pendukung
Muted Text	#6B7280	Deskripsi dan helper text
Disabled Text	#9CA3AF	Placeholder dan disabled state
Strong Border	#D1D5DB	Border input
Default Border	#E5E7EB	Divider dan border card
Placeholder	#D9D9D9	Area kosong
Subtle Surface	#F9FAFB	Background panel
Surface	#FFFFFF	Canvas, card, dan navbar
Feedback
Warna	Hex	Penggunaan
Danger	#EF4444	Error dan destructive action
Typography
Font utama: Inter

css code
font-family: "Inter", system-ui, sans-serif;
Style	Ukuran	Weight	Penggunaan
Display title	36px	Bold 700	Judul besar: hero halaman utama dan halaman privacy
Product title	24px	Bold 700	Nama produk
Supporting title	20px	Bold 700	Heading pendukung
Section title	16px	Bold 700	Judul step dan tombol
Body text	12px	Regular 400	Deskripsi dan helper text
Compact label	12px	Bold 700	Tab, field, dan chip
Gunakan hanya weight Regular dan Bold. Letter spacing menggunakan 0.

Teks field sertifikat memakai aturan terpisah dari tipografi UI: keluarga font dipilih dari daftar (Inter, Times New Roman, Georgia), lalu gaya ditentukan oleh dua toggle terpisah — **Tebal (Bold)** dan **Miring (Italic)** — sehingga satu keluarga bisa reguler, tebal, miring, atau keduanya; ditambah perataan kiri/tengah/kanan. Gaya yang sama dipakai di kanvas editor, preview step 4, dan hasil PDF/PNG.

Spacing
Sistem spacing menggunakan basis 4px:

4px — jarak sangat rapat
8px — jarak ikon dan label
10px — padding komponen compact
16px — jarak antarseksi
Gunakan Auto Layout agar alignment dan spacing konsisten.

Corner Radius
2px — detail kecil
4px — chip
6px — tombol dan input
8px — card
10px — panel dan upload card
12px — container besar
16px — surface yang lebih lembut
Radius utama untuk komponen interaktif adalah 6–10px.

Border dan Shadow
Border standar: 1px solid #E5E7EB
Border input: 1px solid #D1D5DB
Focus border: #60A5FA
Shadow digunakan secara ringan
css code
box-shadow: 0 4px 12px rgb(17 24 39 / 8%);
Pola Komponen
Navigation Step
Tampilan vertikal di sisi kiri kartu utama, terdiri dari 4 step:
1. Template Sertifikat — Unggah desain sertifikatmu
2. Masukkan Data — Masukkan semua data untuk sertifikat
3. Desain di Kanvas — Seret dan letakkan kolom datamu
4. Selesaikan Proses — Unduh sertifikatmu.
Step aktif menggunakan indigo, step pending menggunakan abu-abu, dihubungkan garis tipis
Judul step: Bold 16px
Deskripsi step: Regular 12px
Hanya step yang prasyaratnya terpenuhi yang boleh diklik
Button
Primary: #6366F1 dengan teks putih
Secondary: putih dengan border neutral
Destructive: merah
Disabled: abu-abu dengan kontras rendah
Radius: 6px
Upload Card
Instruksi diletakkan di tengah
Menggunakan border halus atau dashed
Menampilkan ikon, instruksi, format, dan batas ukuran
Mendukung empty, uploaded, preview, dan link state
Input dan Select
Tampilan compact
Border neutral
Radius 6px
Label Bold 12px
Value Regular 12px
Focus menggunakan border biru
Navbar
Background putih
Brand GenerateCertificate di kiri
Tombol Dashboard (outlined, ikon grid, menuju /dashboard) dan tombol Hapus Data (ikon database) di sisi kanan — Hapus Data mereset localStorage sesi membuat sertifikat (draft + key legacy) dengan konfirmasi; data Dashboard tidak ikut terhapus
Di halaman /dashboard tombol Dashboard disembunyikan otomatis — navbar hanya berisi Hapus Data
Sederhana dan tidak mengganggu workflow
Layout Halaman (/certificate)
Latar halaman: Indigo Surface (#F5F7FF)
Konten utama: kartu putih besar radius 12px berisi step nav di kiri dan area konten di kanan. Tinggi kartu = viewport (h-dvh): **step nav dan action bar tidak ikut scroll — hanya isi step (upload data, kanvas, preview, dll.) yang bergulir**, sehingga tombol Lanjutkan/Unduh selalu terlihat
Ikon bantuan (?) di pojok kanan atas kartu
Action bar di bawah kartu: aksi sekunder di kiri (Tambahkan/Hapus tampilan belakang di step template, Sebelumnya di step berikutnya), satu primary action di kanan (Lanjutkan atau Unduh — di step 4 Unduh membuka menu 3 opsi unduhan)
Catatan privasi di bawah kartu: "Semua sertifikat dan data penerima tetap di browser kamu. Tidak ada yang disimpan permanen di server kami." + link Privacy policy
Ikon ? dan catatan privasi muncul di semua step
Layout Halaman Utama (/)
MASIH PLACEHOLDER KOSONG — konten lengkap menyusul setelah didiskusikan (mockup referensi ada di folder rev/)
Latar halaman: Indigo Surface (#F5F7FF) — sama seperti wizard
Isi saat ini: navbar (tanpa tombol Hapus Data) + judul produk + pesan singkat + link ke /certificate + footer
Halaman /privacy juga placeholder kosong (judul + pesan singkat); link Privacy policy di footer tetap mengarah ke sana
Halaman responsif (termasuk layar <768px) — overlay layar selayar hanya untuk /certificate dan /dashboard; di layar pendek (HP dirotot, tinggi ≤500px) wizard & dashboard dikompakkan otomatis lewat varian short: padding/min-height ramping, panel properti kanvas pindah ke samping canvas dengan scroll sendiri, tinggi gambar canvas/preview mengikuti viewport (dvh)
Bahasa konten halaman utama & Privacy policy: Indonesia
Alur Produk
Upload desain sertifikat (JPG atau PNG, maksimal 10 MB) — satu preview sisi aktif: Depan wajib, Belakang opsional
Ganti gambar = klik preview; pindah sisi = toggle Depan/Belakang di bawah preview (posisi & gaya toggle File CSV); tambah/hapus template belakang = tombol sekunder di action bar
Masukkan data lewat toggle File CSV atau Google Sheets
CSV: upload file
Google Sheets: paste link publik, data diambil otomatis
Preview data dalam tabel
Atur field teks di canvas (drag and drop, toggle sisi Depan/Belakang di bawah kanvas, ubah lebar teks via handle kanan-bawah, properti font: size, jenis font (keluarga saja), gaya teks lewat toggle Tebal & Miring yang terpisah — bisa keduanya, salah satu, atau tidak sama sekali — perataan kiri/tengah/kanan, color picker + hex/rgb). Field tidak pernah bisa digeser melewati tepi foto (lebar default dijaga minimal 5%, tepi kanan `x + width ≤ 100`, tepi bawah `y + tinggi kotak ≤ 100` — dikunci ulang otomatis setelah ukuran font/kolom berubah)
Menampilkan loading state
Preview sertifikat per baris (toggle sisi Depan/Belakang di bawah preview bila ada template belakang), pilih kolom nama file, lalu klik Unduh → menu 3 opsi unduhan muncul
Setiap layar sebaiknya hanya memiliki satu primary action yang paling menonjol.

Keputusan Produk
Tanpa login dan tanpa backend; semua proses berjalan di browser
3 opsi unduhan — semuanya dari menu tombol primary Unduh: PDF gabungan multi-halaman (A4 landscape), PDF satuan per sertifikat (ZIP), dan Gambar PNG (ZIP) — ZIP ditulis sendiri tanpa dependency baru; nama file `2026-001_Nama` (tahun - nomor urut per unduhan - kolom pilihan user)
Elemen yang bisa ditempel di canvas: teks dinamis (field) dari kolom data saja, ditempatkan per sisi template (depan/belakang) — tanpa gambar, tanda tangan, atau QR
Sesi kerja disimpan di localStorage:
gc:draft — sesi kerja (step aktif, link data, konfigurasi field termasuk lebar, kedua template, kolom nama file)
gc:history / gc:pdfs — peninggalan fitur History yang sudah dihapus (tampilan & penulisan); key lama tetap ikut dibersihkan tombol Hapus Data
Tombol Hapus Data di wizard mereset ketiga key localStorage dengan konfirmasi (tidak menyentuh data Dashboard)
Dashboard /dashboard — riwayat file (template, CSV, hasil unduhan) di IndexedDB terpisah dari localStorage: semua item bisa diunduh ulang, dihapus otomatis setelah 24 jam (banner masa simpan + countdown per item + pemberitahuan saat data lama terhapus), dan punya tombol Hapus Data sendiri yang tidak memengaruhi sesi membuat sertifikat
UI light-only: tanpa varian dark mode

Prinsip Utama
Gunakan
Indigo untuk aksi utama
Inter sebagai font utama
Border neutral untuk membangun struktur
Hierarki sederhana: judul, deskripsi, kontrol, aksi
State empty, active, disabled, loading, error, dan success
Hindari
Terlalu banyak warna aksen
Gradient dan shadow berat
Terlalu banyak ukuran font
Radius yang terlalu bulat
Beberapa primary button dalam satu layar
Mengandalkan warna saja untuk menunjukkan status

Token CSS (implementasi di app/globals.css)
Palet di atas sudah diterjemahkan menjadi token Tailwind 4. Jangan pakai warna atau ukuran hardcoded di komponen — pakai utility dari token ini.
Warna
Token utility	Value	Penggunaan
bg-primary / text-primary / border-primary	#6366F1	Tombol utama, step aktif, pilihan aktif
text-action	#2563EB	Link dan aksi sekunder
bg-accent	#3B82F6	Aksen interaktif
border-focus	#60A5FA	Focus border
bg-selected	#BFDBFE	Selected state
bg-blue-surface	#EFF6FF	Background state informatif
bg-indigo-surface	#F5F7FF	Background aksen lembut, latar halaman
text-danger / bg-danger	#EF4444	Error dan destructive action
text-ink	#111827	Heading dan label utama
text-ink-strong	#1C1B1F	Teks gelap alternatif
text-ink-secondary	#4B5563	Teks pendukung
text-ink-muted	#6B7280	Deskripsi dan helper text
text-ink-disabled	#9CA3AF	Placeholder dan disabled state
bg-surface	#FFFFFF	Canvas, card, dan navbar
bg-surface-subtle	#F9FAFB	Background panel
border-line	#E5E7EB	Divider dan border card
border-line-strong	#D1D5DB	Border input
bg-placeholder	#D9D9D9	Area kosong
Typography
Token utility	Ukuran	Weight	Penggunaan
text-display	36px	700	Judul besar: hero halaman utama & halaman privacy
text-title	24px	700	Product title
text-subtitle	20px	700	Supporting title
text-section	16px	700	Section title dan tombol
text-body	12px	400	Deskripsi dan helper text
text-label	12px	700	Compact label: tab, field, dan chip
Radius
Token utility	Radius	Penggunaan
rounded-detail	2px	Detail kecil
rounded-chip	4px	Chip
rounded-control	6px	Tombol dan input
rounded-card	8px	Card
rounded-panel	10px	Panel dan upload card
rounded-container	12px	Container besar
rounded-surface	16px	Surface yang lebih lembut
Shadow
Token utility	Value	Penggunaan
shadow-card	0 4px 12px rgb(17 24 39 / 8%)	Card dan panel utama
Font
Token utility	Value
font-sans (default body)	Inter, system-ui, sans-serif
Contoh pemakaian: <button className="rounded-control bg-primary px-4 py-2.5 text-section text-surface">Lanjutkan</button>