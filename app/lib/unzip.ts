/**
 * Pembaca ZIP store-only — pasangan dari penulis di `zip.ts`.
 *
 * File hasil generate selalu memakai metode store (tanpa kompresi), jadi
 * pratinjau cukup dengan dua pembacaan kecil:
 *  1. `listZipEntries` — baca central directory di ekor file (sekali) → daftar
 *     nama + ukuran + offset.
 *  2. `readZipEntry` — baca header lokal 30 byte di offset entri → slice blob
 *     pada posisi data (bytes TIDAK dimuat penuh ke memori; browser membacanya
 *     saat menampilkan).
 *
 * Metode selain store / ZIP64 di luar cakupan (tidak pernah dihasilkan app
 * ini) — entri tersebut dilewati, bukan membuat seluruh preview gagal.
 */

export interface ZipEntryInfo {
  /** Nama file di dalam ZIP (mis. "001_Budi-depan.png") */
  name: string;
  /** Ukuran data (= asli, karena metode store) */
  size: number;
  /** Offset header lokal — dipakai `readZipEntry` */
  offset: number;
}

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;
/** Panjang pencarian EOCD: 22 byte + komentar maksimal 65535 byte */
const EOCD_SEARCH = 22 + 0xffff;
/** Batas entri yang ditampilkan (pratinjau tidak perlu seluruh isi ZIP) */
const MAX_ENTRIES = 10_000;
/** Panjang header lokal tetap (nama & ekstra mengikutinya) */
const LOCAL_HEADER_LEN = 30;

/** Tebak tipe konten dari ekstensi — blob induk bertipe ZIP, bukan isinya */
function mimeFor(name: string): string {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "pdf") return "application/pdf";
  if (ext === "csv") return "text/csv";
  return "application/octet-stream";
}

/** Nama file gambar? (dipakai modal pratinjau untuk memilih tampilan) */
export function isImageName(name: string): boolean {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  return ext === "png" || ext === "jpg" || ext === "jpeg";
}

async function readRange(blob: Blob, start: number, end: number) {
  return blob.slice(start, end).arrayBuffer();
}

/**
 * Daftar entri ZIP dari central directory (1 pembacaan).
 * Melempar error bila bukan ZIP / kosong / tidak ada entri store.
 */
export async function listZipEntries(zip: Blob): Promise<ZipEntryInfo[]> {
  const tail = new DataView(
    await readRange(zip, Math.max(0, zip.size - EOCD_SEARCH), zip.size),
  );
  // EOCD ditandai tanda tangan 4 byte — cari dari akhir (komentar bisa berisi
  // byte serupa, jadi yang paling akhir adalah yang asli)
  let eocd = -1;
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Format ZIP tidak dikenali");

  const count = Math.min(tail.getUint16(eocd + 10, true), MAX_ENTRIES);
  const cdSize = tail.getUint32(eocd + 12, true);
  const cdOffset = tail.getUint32(eocd + 16, true);
  if (cdOffset + cdSize > zip.size) throw new Error("Indeks ZIP rusak");

  const cd = new DataView(await readRange(zip, cdOffset, cdOffset + cdSize));
  const out: ZipEntryInfo[] = [];
  const decoder = new TextDecoder();
  let pos = 0;
  for (let i = 0; i < count && pos + 46 <= cd.byteLength; i++) {
    if (cd.getUint32(pos, true) !== CENTRAL_SIG) break;
    const method = cd.getUint16(pos + 10, true);
    const size = cd.getUint32(pos + 20, true);
    const nameLen = cd.getUint16(pos + 28, true);
    const extraLen = cd.getUint16(pos + 30, true);
    const commentLen = cd.getUint16(pos + 32, true);
    const offset = cd.getUint32(pos + 42, true);
    const isZip64 = size === 0xffffffff || offset === 0xffffffff;
    if (method === 0 && !isZip64) {
      const name = decoder.decode(
        new Uint8Array(cd.buffer, cd.byteOffset + pos + 46, nameLen),
      );
      out.push({ name, size, offset });
    }
    pos += 46 + nameLen + extraLen + commentLen;
  }
  if (out.length === 0) {
    throw new Error("ZIP tidak berisi file yang bisa dipratinjau");
  }
  return out;
}

/** Ambil isi satu entri sebagai Blob bertipe sesuai ekstensi */
export async function readZipEntry(
  zip: Blob,
  entry: ZipEntryInfo,
): Promise<Blob> {
  const head = new DataView(
    await readRange(zip, entry.offset, entry.offset + LOCAL_HEADER_LEN),
  );
  if (head.byteLength < LOCAL_HEADER_LEN || head.getUint32(0, true) !== LOCAL_SIG) {
    throw new Error("Header entri ZIP rusak");
  }
  // Nama & ekstra di header lokal bisa berbeda panjang dari central directory
  const nameLen = head.getUint16(26, true);
  const extraLen = head.getUint16(28, true);
  const start = entry.offset + LOCAL_HEADER_LEN + nameLen + extraLen;
  return new Blob([zip.slice(start, start + entry.size)], {
    type: mimeFor(entry.name),
  });
}
