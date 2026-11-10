// Kontejner PDB (Palm Database) a komprese PalmDOC – základ formátů PDB (PalmDoc) a MOBI.
import { concat } from './bytes';

export const RECORD_SIZE = 4096;

export function decompressPalmDoc(src: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i++];
    if (c === 0 || (c >= 0x09 && c <= 0x7f)) out.push(c);
    else if (c <= 0x08) {
      for (let k = 0; k < c && i < src.length; k++) out.push(src[i++]);
    } else if (c >= 0xc0) {
      out.push(0x20, c ^ 0x80);
    } else {
      if (i >= src.length) break;
      const pair = ((c << 8) | src[i++]) & 0x3fff;
      const dist = pair >> 3;
      const len = (pair & 7) + 3;
      const start = out.length - dist;
      if (dist === 0 || start < 0) continue;
      for (let k = 0; k < len; k++) out.push(out[start + k]);
    }
  }
  return Uint8Array.from(out);
}

/** Komprese jednoho záznamu (nejvýš 4096 bajtů) – LZ77 s okénkem 2047 a mezerou + znakem. */
export function compressPalmDoc(src: Uint8Array): Uint8Array {
  const out: number[] = [];
  const n = src.length;
  const head = new Map<number, number>();
  const prev = new Int32Array(n).fill(-1);
  const key = (p: number) => (src[p] << 16) | (src[p + 1] << 8) | src[p + 2];
  const insert = (p: number) => {
    if (p + 2 >= n) return;
    const k = key(p);
    const h = head.get(k);
    prev[p] = h === undefined ? -1 : h;
    head.set(k, p);
  };
  let i = 0;
  while (i < n) {
    // 1) nejdelší shoda v předchozích 2047 bajtech (3–10 bajtů)
    let bestLen = 0;
    let bestDist = 0;
    if (i + 2 < n) {
      let cand = head.get(key(i));
      let tries = 0;
      while (cand !== undefined && cand >= 0 && i - cand <= 2047 && tries++ < 64) {
        let l = 0;
        while (l < 10 && i + l < n && src[cand + l] === src[i + l]) l++;
        if (l > bestLen) {
          bestLen = l;
          bestDist = i - cand;
          if (l === 10) break;
        }
        cand = prev[cand];
      }
    }
    if (bestLen >= 3) {
      const v = 0x8000 | (bestDist << 3) | (bestLen - 3);
      out.push(v >> 8, v & 255);
      for (let k = 0; k < bestLen; k++) insert(i + k);
      i += bestLen;
      continue;
    }
    const c = src[i];
    // 2) mezera + znak 0x40–0x7F jako jeden bajt
    if (c === 0x20 && i + 1 < n && src[i + 1] >= 0x40 && src[i + 1] <= 0x7f) {
      out.push(src[i + 1] ^ 0x80);
      insert(i);
      insert(i + 1);
      i += 2;
      continue;
    }
    // 3) obyčejný znak, nebo skupina bajtů, které je nutné uvodit počtem
    if (c === 0 || (c >= 0x09 && c <= 0x7f)) {
      out.push(c);
      insert(i);
      i++;
      continue;
    }
    let cnt = 0;
    while (cnt < 8 && i + cnt < n && !(src[i + cnt] === 0 || (src[i + cnt] >= 0x09 && src[i + cnt] <= 0x7f))) cnt++;
    out.push(cnt);
    for (let k = 0; k < cnt; k++) {
      out.push(src[i + k]);
      insert(i + k);
    }
    i += cnt;
  }
  return Uint8Array.from(out);
}

/** Rozdělí UTF-8 text na kusy ≤ 4096 bajtů, aniž by se rozdělil vícebajtový znak. */
export function splitRecords(data: Uint8Array, utf8 = true): Uint8Array[] {
  const out: Uint8Array[] = [];
  let i = 0;
  while (i < data.length) {
    let end = Math.min(data.length, i + RECORD_SIZE);
    if (utf8 && end < data.length) while (end > i && (data[end] & 0xc0) === 0x80) end--;
    out.push(data.subarray(i, end));
    i = end;
  }
  return out;
}

// ------------------------------------------------------------ PDB kontejner
export interface PdbFile {
  name: string;
  type: string; // např. BOOK, TEXt
  creator: string; // MOBI, REAd
  records: Uint8Array[];
}

const ascii = (b: Uint8Array) => String.fromCharCode(...b);

export function readPdb(data: Uint8Array): PdbFile {
  if (data.length < 78) throw new Error('Soubor je příliš krátký na PDB/MOBI.');
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const nameBytes = data.subarray(0, 32);
  const z = nameBytes.indexOf(0);
  const name = ascii(z >= 0 ? nameBytes.subarray(0, z) : nameBytes);
  const type = ascii(data.subarray(60, 64));
  const creator = ascii(data.subarray(64, 68));
  const count = dv.getUint16(76);
  const offs: number[] = [];
  for (let i = 0; i < count; i++) offs.push(dv.getUint32(78 + i * 8));
  offs.push(data.length);
  const records = offs.slice(0, count).map((o, i) => data.subarray(o, Math.max(o, offs[i + 1])));
  return { name, type, creator, records };
}

export function writePdb(pdb: PdbFile): Uint8Array {
  const n = pdb.records.length;
  const headerLen = 78 + n * 8 + 2;
  const head = new Uint8Array(headerLen);
  const dv = new DataView(head.buffer);
  const nm = pdb.name.replace(/[^\x20-\x7e]/g, '_').slice(0, 31);
  for (let i = 0; i < nm.length; i++) head[i] = nm.charCodeAt(i);
  const now = Math.floor(Date.now() / 1000) + 2082844800; // sekundy od roku 1904
  dv.setUint16(32, 0); // attributes
  dv.setUint16(34, 0); // version
  dv.setUint32(36, now >>> 0);
  dv.setUint32(40, now >>> 0);
  for (let i = 0; i < 4; i++) {
    head[60 + i] = pdb.type.charCodeAt(i);
    head[64 + i] = pdb.creator.charCodeAt(i);
  }
  dv.setUint32(68, (2 * n - 1) >>> 0); // uniqueIDseed
  dv.setUint32(72, 0);
  dv.setUint16(76, n);
  let off = headerLen;
  pdb.records.forEach((r, i) => {
    dv.setUint32(78 + i * 8, off);
    const uid = 2 * i;
    head[78 + i * 8 + 4] = 0;
    head[78 + i * 8 + 5] = (uid >> 16) & 255;
    head[78 + i * 8 + 6] = (uid >> 8) & 255;
    head[78 + i * 8 + 7] = uid & 255;
    off += r.length;
  });
  return concat([head, ...pdb.records]);
}

export function u16(v: number): Uint8Array {
  return Uint8Array.of((v >> 8) & 255, v & 255);
}
export function u32(v: number): Uint8Array {
  return Uint8Array.of((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
}
