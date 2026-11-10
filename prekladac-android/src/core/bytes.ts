// Převody textu a bajtů bez závislosti na TextEncoder/TextDecoder (Hermes je nemá všude).

export function utf8Encode(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        i++;
      }
    }
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

/** UTF-8 → text; strict=true vyhodí chybu u neplatných bajtů (pro rozpoznání kódování). */
export function utf8Decode(b: Uint8Array, strict = false): string {
  let s = '';
  let i = 0;
  if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) i = 3;
  const parts: string[] = [];
  const bad = () => {
    if (strict) throw new Error('not utf-8');
    s += '�';
  };
  while (i < b.length) {
    const c = b[i];
    let cp = -1;
    let n = 0;
    if (c < 0x80) { cp = c; n = 1; }
    else if (c >= 0xc2 && c < 0xe0) { n = 2; cp = c & 31; }
    else if (c >= 0xe0 && c < 0xf0) { n = 3; cp = c & 15; }
    else if (c >= 0xf0 && c < 0xf5) { n = 4; cp = c & 7; }
    else { bad(); i++; continue; }
    if (i + n > b.length) { bad(); break; }
    let ok = true;
    for (let k = 1; k < n; k++) {
      const x = b[i + k];
      if ((x & 0xc0) !== 0x80) { ok = false; break; }
      cp = (cp << 6) | (x & 63);
    }
    if (!ok) { bad(); i++; continue; }
    i += n;
    if (cp >= 0x10000) {
      cp -= 0x10000;
      s += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 1023));
    } else s += String.fromCharCode(cp);
    if (s.length > 8192) { parts.push(s); s = ''; }
  }
  parts.push(s);
  return parts.join('');
}

// Windows-1250 (střední Evropa) a Windows-1252 (západní) – horní polovina tabulky.
const CP1250_HI =
  '€�‚�„…†‡�‰Š‹ŚŤŽŹ�‘’“”•–—�™š›śťžź' +
  ' ˇ˘Ł¤Ą¦§¨©Ş«¬­®Ż°±˛ł´µ¶·¸ąş»Ľ˝ľż' +
  'ŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢß' +
  'ŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙';
const CP1252_HI =
  '€�‚ƒ„…†‡ˆ‰Š‹Œ�Ž��‘’“”•–—˜™š›œ�žŸ' +
  ' ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿' +
  'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞß' +
  'àáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';

function singleByteDecode(b: Uint8Array, hi: string): string {
  const parts: string[] = [];
  let s = '';
  for (let i = 0; i < b.length; i++) {
    const c = b[i];
    s += c < 0x80 ? String.fromCharCode(c) : hi[c - 0x80];
    if (s.length > 8192) { parts.push(s); s = ''; }
  }
  parts.push(s);
  return parts.join('');
}

export const cp1250Decode = (b: Uint8Array) => singleByteDecode(b, CP1250_HI);
export const cp1252Decode = (b: Uint8Array) => singleByteDecode(b, CP1252_HI);

/** Text v neznámém kódování: UTF-8 / UTF-16, jinak cp1250 (české znaky) nebo cp1252. */
export function decodeAny(b: Uint8Array): string {
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) return utf16Decode(b.subarray(2), true);
  if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) return utf16Decode(b.subarray(2), false);
  try {
    return utf8Decode(b, true);
  } catch {
    // typické bajty české diakritiky v cp1250: č ř ě š ž ů ť ď ň
    let cz = 0;
    for (const c of b) if (c === 0xe8 || c === 0xf8 || c === 0xec || c === 0x9a || c === 0x9e || c === 0xf9 ||
      c === 0x9d || c === 0xef || c === 0xf2 || c === 0xc8 || c === 0xd8 || c === 0x8a || c === 0x8e) cz++;
    return cz > 0 ? cp1250Decode(b) : cp1252Decode(b);
  }
}

function utf16Decode(b: Uint8Array, le: boolean): string {
  let s = '';
  for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode(le ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1]);
  return s;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function toBase64(b: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < b.length; i += 3) {
    const n = (b[i] << 16) | (b[i + 1] << 8) | b[i + 2];
    out += B64[n >> 18] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
  }
  if (i < b.length) {
    const n = (b[i] << 16) | ((b[i + 1] ?? 0) << 8);
    out += B64[n >> 18] + B64[(n >> 12) & 63] + (i + 1 < b.length ? B64[(n >> 6) & 63] : '=') + '=';
  }
  return out;
}

export function fromBase64(s: string): Uint8Array {
  const clean = s.replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = (B64.indexOf(clean[i]) << 18) | (B64.indexOf(clean[i + 1]) << 12) |
      ((clean[i + 2] ? B64.indexOf(clean[i + 2]) : 0) << 6) | (clean[i + 3] ? B64.indexOf(clean[i + 3]) : 0);
    out[o++] = n >> 16;
    if (clean[i + 2]) out[o++] = (n >> 8) & 255;
    if (clean[i + 3]) out[o++] = n & 255;
  }
  return out.subarray(0, o);
}

export function concat(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…',
  laquo: '«', raquo: '»', bdquo: '„', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', sbquo: '‚', copy: '©',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}
