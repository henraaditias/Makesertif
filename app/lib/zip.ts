/**
 * Penulis ZIP ringan tanpa dependency (metode store / tanpa kompresi).
 * PNG & PDF sudah terkompresi, jadi store memberi hasil terbaik.
 * Flag bit 11 (0x0800) diaktifkan → nama file UTF-8 (mis. "Rina (2).pdf").
 */

export interface ZipEntry {
  /** Nama file di dalam ZIP (boleh subfolder "dir/file.png") */
  name: string;
  /** Bytes konten — dari `new Uint8Array(await blob.arrayBuffer())` dsb. */
  data: Uint8Array<ArrayBuffer>;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** CRC-32 (IEEE) sesuai yang divalidasi ZIP */
export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Tanggal DOS: 1980-01-01 → bit tahun=0, bulan=1, hari=1
const DOS_DATE = (1 << 5) | 1;

/**
 * Susun entri-entri jadi satu Blob ZIP (store, UTF-8 names).
 * Urutan entri dipertahankan seperti input.
 */
export function createZip(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const chunks: BlobPart[] = [];
  const centralParts: Uint8Array<ArrayBuffer>[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    // Local file header (30 byte + nama)
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // flags: UTF-8 names
    lv.setUint16(8, 0, true); // method: store
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, DOS_DATE, true); // mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // compressed
    lv.setUint32(22, size, true); // uncompressed
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // extra length
    local.set(nameBytes, 30);
    chunks.push(local, entry.data);

    // Central directory header (46 byte + nama)
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true); // flags: UTF-8 names
    cv.setUint16(10, 0, true); // method: store
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, DOS_DATE, true); // mod date
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // extra length
    cv.setUint16(32, 0, true); // comment length
    cv.setUint16(34, 0, true); // disk number
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, localOffset, true); // local header offset
    central.set(nameBytes, 46);
    centralParts.push(central);

    localOffset += local.length + entry.data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);

  // End of central directory (22 byte)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // signature
  ev.setUint16(4, 0, true); // disk number
  ev.setUint16(6, 0, true); // disk with central dir
  ev.setUint16(8, entries.length, true); // entries this disk
  ev.setUint16(10, entries.length, true); // total entries
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, localOffset, true); // central dir offset
  ev.setUint16(20, 0, true); // comment length

  return new Blob([...chunks, ...centralParts, eocd], {
    type: "application/zip",
  });
}
