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
Product title	24px	Bold 700	Nama produk
Supporting title	20px	Bold 700	Heading pendukung
Section title	16px	Bold 700	Judul step dan tombol
Body text	12px	Regular 400	Deskripsi dan helper text
Compact label	12px	Bold 700	Tab, field, dan chip
Gunakan hanya weight Regular dan Bold. Letter spacing menggunakan 0.

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
1. Certificate Template — Upload your certificate design
2. Entering data — Entering all data for the certificate
3. Designing on a canvas — drag and drop your data fields
4. Complete the process — Download your certificate.
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
Tombol Delete Data (ikon database) di sisi kanan — mereset localStorage (draft, log, PDF) dengan konfirmasi
Sederhana dan tidak mengganggu workflow
Layout Halaman (/certificate)
Latar halaman: Indigo Surface (#F5F7FF)
Konten utama: kartu putih besar radius 12px berisi step nav di kiri dan area konten di kanan
Ikon bantuan (?) di pojok kanan atas kartu
Action bar di bawah kartu: aksi sekunder di kiri (Ubah File atau Preview), satu primary action di kanan (Lanjutkan atau Download)
Catatan privasi di bawah kartu: "All certificates and recipient data stay in your browser. Nothing is permanently stored on our servers." + link Privacy policy
Ikon ? dan catatan privasi muncul di semua step
Alur Produk
Upload desain sertifikat (JPG atau PNG, maksimal 10 MB)
Preview atau ubah template (tombol Ubah File)
Masukkan data lewat toggle File CSV atau Google Sheets
CSV: upload file
Google Sheets: paste link publik, data diambil otomatis
Preview data dalam tabel
Atur field teks di canvas (drag and drop, properti font)
Menampilkan loading state
Preview sertifikat per baris, lalu Download satu PDF multi-halaman
Setiap layar sebaiknya hanya memiliki satu primary action yang paling menonjol.

Keputusan Produk
Tanpa login dan tanpa backend; semua proses berjalan di browser
Output akhir hanya satu file PDF multi-halaman (A4 landscape), bukan PNG atau ZIP
Elemen yang bisa ditempel di canvas: teks dinamis (field) dari kolom data saja — tanpa gambar, tanda tangan, atau QR
Riwayat disimpan di localStorage:
gc:draft — sesi kerja (step aktif, link data, konfigurasi field)
gc:history — log generate
gc:pdfs — file PDF hasil (kuota ~5MB: simpan maksimal beberapa file terbaru, tangani QuotaExceededError)
Tombol Delete Data mereset ketiga key dengan konfirmasi
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