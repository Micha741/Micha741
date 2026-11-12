// Čtení PDF v telefonu: vytáhne text (odstavce, nadpisy) a obálku, aby šlo PDF číst ve čtečce,
// přeložit nebo převést. Rozložení stránky se nezachovává – text se přeskládá jako v e-knize.
// Umí běžná PDF z Wordu, LibreOffice, prohlížečů a sázecích programů (FlateDecode, ToUnicode,
// WinAnsi/MacRoman/Differences, fonty Type0/CID, objektové proudy, formuláře XObject).
// Neumí zašifrovaná PDF a skeny bez textové vrstvy (ty potřebují OCR na počítači).
import pako from 'pako';
import { aesCbcDecrypt, aesCbcEncrypt, md5, rc4, sha256, sha384, sha512 } from './crypto';
import { addImage, emptyBook, type Block, type Book } from './book';
import { chaptersFromBlocks, chaptersFromText } from './chapters';

// ------------------------------------------------------------ objekty PDF
class Name {
  constructor(public v: string) {}
}
class Str {
  constructor(public b: Uint8Array) {}
}
class Ref {
  constructor(public num: number) {}
}
class Op {
  constructor(public v: string) {}
}
type PDict = Map<string, any>;
interface Stream {
  dict: PDict;
  data: Uint8Array;
}
const isDict = (v: any): v is PDict => v instanceof Map;
const isStream = (v: any): v is Stream => v && typeof v === 'object' && v.dict instanceof Map && v.data instanceof Uint8Array;

const WS = new Set([0, 9, 10, 12, 13, 32]);
const DELIM = new Set([40, 41, 60, 62, 91, 93, 123, 125, 47, 37]);

class Lexer {
  pos: number;
  constructor(public d: Uint8Array, pos = 0) {
    this.pos = pos;
  }
  skip() {
    const d = this.d;
    for (;;) {
      while (this.pos < d.length && WS.has(d[this.pos])) this.pos++;
      if (d[this.pos] === 37) {
        while (this.pos < d.length && d[this.pos] !== 10 && d[this.pos] !== 13) this.pos++;
      } else return;
    }
  }
  word(): string {
    const d = this.d;
    const s = this.pos;
    while (this.pos < d.length && !WS.has(d[this.pos]) && !DELIM.has(d[this.pos])) this.pos++;
    let out = '';
    for (let i = s; i < this.pos; i++) out += String.fromCharCode(d[i]);
    return out;
  }
  /** Další hodnota; v obsahu stránky vrací i operátory (Op). */
  value(allowRef = true): any {
    this.skip();
    const d = this.d;
    if (this.pos >= d.length) return undefined;
    const c = d[this.pos];
    if (c === 60 && d[this.pos + 1] === 60) {
      this.pos += 2;
      const m: PDict = new Map();
      for (;;) {
        this.skip();
        if (this.pos >= d.length) return m;
        if (d[this.pos] === 62 && d[this.pos + 1] === 62) {
          this.pos += 2;
          return m;
        }
        const k = this.value(false);
        if (!(k instanceof Name)) {
          if (k === undefined) return m;
          continue;
        }
        m.set(k.v, this.value());
      }
    }
    if (c === 60) return this.hex();
    if (c === 40) return this.literal();
    if (c === 91) {
      this.pos++;
      const a: any[] = [];
      for (;;) {
        this.skip();
        if (this.pos >= d.length) return a;
        if (d[this.pos] === 93) {
          this.pos++;
          return a;
        }
        const v = this.value();
        if (v === undefined) return a;
        a.push(v);
      }
    }
    if (c === 47) {
      this.pos++;
      return new Name(this.word().replace(/#([0-9a-fA-F]{2})/g, (_m, h) => String.fromCharCode(parseInt(h, 16))));
    }
    if (c === 93 || c === 41 || c === 62 || c === 123 || c === 125) {
      this.pos++;
      return new Op(String.fromCharCode(c));
    }
    const w = this.word();
    if (!w) {
      this.pos++;
      return new Op('');
    }
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w)) {
      const n = parseFloat(w);
      if (allowRef && /^\d+$/.test(w)) {
        const save = this.pos;
        this.skip();
        const g = this.word();
        this.skip();
        if (/^\d+$/.test(g) && this.d[this.pos] === 82 /* R */ && (this.pos + 1 >= d.length || WS.has(d[this.pos + 1]) || DELIM.has(d[this.pos + 1]))) {
          this.pos++;
          return new Ref(n);
        }
        this.pos = save;
      }
      return n;
    }
    if (w === 'true') return true;
    if (w === 'false') return false;
    if (w === 'null') return null;
    return new Op(w);
  }
  hex(): Str {
    this.pos++;
    const out: number[] = [];
    let hi = -1;
    while (this.pos < this.d.length && this.d[this.pos] !== 62) {
      const c = this.d[this.pos++];
      const v = c >= 48 && c <= 57 ? c - 48 : c >= 65 && c <= 70 ? c - 55 : c >= 97 && c <= 102 ? c - 87 : -1;
      if (v < 0) continue;
      if (hi < 0) hi = v;
      else {
        out.push(hi * 16 + v);
        hi = -1;
      }
    }
    if (hi >= 0) out.push(hi * 16);
    this.pos++;
    return new Str(new Uint8Array(out));
  }
  literal(): Str {
    this.pos++;
    const d = this.d;
    const out: number[] = [];
    let depth = 1;
    while (this.pos < d.length) {
      let c = d[this.pos++];
      if (c === 92) {
        c = d[this.pos++];
        const map: Record<number, number> = { 110: 10, 114: 13, 116: 9, 98: 8, 102: 12 };
        if (map[c] !== undefined) out.push(map[c]);
        else if (c >= 48 && c <= 55) {
          let v = c - 48;
          for (let k = 0; k < 2 && d[this.pos] >= 48 && d[this.pos] <= 55; k++) v = v * 8 + (d[this.pos++] - 48);
          out.push(v & 255);
        } else if (c === 13) {
          if (d[this.pos] === 10) this.pos++;
        } else if (c !== 10) out.push(c);
        continue;
      }
      if (c === 40) depth++;
      else if (c === 41 && --depth === 0) break;
      out.push(c);
    }
    return new Str(new Uint8Array(out));
  }
}

function latin1(d: Uint8Array, from = 0, to = d.length): string {
  let s = '';
  for (let i = from; i < to; i += 8192) s += String.fromCharCode.apply(null, Array.from(d.subarray(i, Math.min(to, i + 8192))));
  return s;
}

const PAD = new Uint8Array([0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80, 0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a]);
const cat = (...a: Uint8Array[]) => {
  const out = new Uint8Array(a.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of a) {
    out.set(x, o);
    o += x.length;
  }
  return out;
};
const DRM_ERR = 'PDF je chráněné DRM (např. Adobe DRM z obchodu) – to Překladač otevřít nemůže. Čtěte ho v aplikaci obchodu.';

/** PDF chráněné heslem pro otevření: aplikace se zeptá na heslo a zkusí to znovu. */
export class PdfPasswordError extends Error {
  needsPassword = true;
  constructor(public wrong: boolean) {
    super(wrong ? 'Heslo k PDF nesouhlasí. Zkuste ho zadat znovu.' : 'PDF je chráněné heslem. Zadejte heslo k otevření.');
  }
}

function pwBytes(pw: string, utf8: boolean): Uint8Array {
  if (utf8) return new TextEncoderLite().encode(pw).subarray(0, 127);
  return Uint8Array.from(pw, (c) => (c.charCodeAt(0) < 256 ? c.charCodeAt(0) : 63)).subarray(0, 32);
}
class TextEncoderLite {
  encode(s: string): Uint8Array {
    const out: number[] = [];
    for (const ch of s) {
      const c = ch.codePointAt(0)!;
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return new Uint8Array(out);
  }
}
const padPwd = (pw: Uint8Array) => cat(pw, PAD).subarray(0, 32);
const same = (a: Uint8Array, b: Uint8Array, n = a.length) => a.length >= n && b.length >= n && a.subarray(0, n).every((x, i) => x === b[i]);

/** Klíč PDF 2.0 (R6), algoritmus 2.B. */
function hash2B(pwd: Uint8Array, salt: Uint8Array, udata: Uint8Array): Uint8Array {
  let k = sha256(cat(pwd, salt, udata));
  for (let round = 0; ; ) {
    const unit = cat(pwd, k, udata);
    const k1 = new Uint8Array(unit.length * 64);
    for (let i = 0; i < 64; i++) k1.set(unit, i * unit.length);
    const e = aesCbcEncrypt(k.subarray(0, 16), k.subarray(16, 32), k1);
    let sum = 0;
    for (let i = 0; i < 16; i++) sum += e[i];
    k = sum % 3 === 0 ? sha256(e) : sum % 3 === 1 ? sha384(e) : sha512(e);
    round++;
    if (round >= 64 && e[e.length - 1] <= round - 32) break;
    if (round > 2000) break;
  }
  return k.subarray(0, 32);
}

interface Crypt {
  key: Uint8Array;
  aes: boolean;
  v5: boolean;
  strings: boolean;
  streams: boolean;
  metadata: boolean;
}

class PdfDoc {
  offsets = new Map<number, number>();
  gens = new Map<number, number>();
  crypt: Crypt | null = null;
  encNum = -1;
  cache = new Map<number, any>();
  inStream = new Map<number, { stm: number; idx: number }>();
  text: string;
  constructor(public d: Uint8Array, public password = '') {
    this.text = latin1(d);
    const re = /(\d+)\s+(\d+)\s+obj\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(this.text))) {
      this.offsets.set(+m[1], m.index + m[0].length);
      this.gens.set(+m[1], +m[2]);
    }
    this.setupEncryption();
    // objekty uvnitř objektových proudů (/Type /ObjStm)
    for (const [num] of this.offsets) {
      const head = this.text.slice(this.offsets.get(num)!, this.offsets.get(num)! + 400);
      if (!/\/Type\s*\/ObjStm/.test(head)) continue;
      const s = this.get(num);
      if (!isStream(s)) continue;
      const data = decodeStream(this, s);
      if (!data) continue;
      const n = s.dict.get('N') ?? 0;
      const lx = new Lexer(data);
      for (let i = 0; i < n; i++) {
        const on = lx.value(false);
        lx.value(false);
        if (typeof on === 'number' && !this.offsets.has(on)) this.inStream.set(on, { stm: num, idx: i });
      }
    }
  }
  /** PDF chráněné bez hesla pro otevření (jen zákaz tisku/kopírování) se dešifruje prázdným heslem. */
  setupEncryption() {
    const em = [...this.text.matchAll(/\/Encrypt\s*(?:(\d+)\s+\d+\s+R|(<<))/g)].pop();
    if (!em) return;
    let enc: any;
    if (em[1]) {
      this.encNum = +em[1];
      enc = this.get(this.encNum);
    } else enc = new Lexer(this.d, (em.index ?? 0) + em[0].length - 2).value();
    this.cache.clear();
    if (!isDict(enc)) throw new Error(DRM_ERR);
    const filter = enc.get('Filter');
    if (!(filter instanceof Name) || filter.v !== 'Standard') throw new Error(DRM_ERR);
    const idm = [...this.text.matchAll(/\/ID\s*\[\s*(<[0-9a-fA-F\s]*>|\((?:\\.|[^\\)])*\))/g)].pop();
    const id0 = idm ? (new Lexer(Uint8Array.from(idm[1], (c) => c.charCodeAt(0) & 255)).value() as Str).b : new Uint8Array(0);
    const V = enc.get('V') ?? 0, R = enc.get('R') ?? 2;
    const O = (enc.get('O') as Str)?.b ?? new Uint8Array(32), U = (enc.get('U') as Str)?.b ?? new Uint8Array(32);
    const P = enc.get('P') ?? 0;
    const metadata = enc.get('EncryptMetadata') !== false;
    let aes = false, strings = true, streams = true;
    if (V >= 4) {
      const cf = enc.get('CF');
      const method = (name: any) => {
        if (!(name instanceof Name) || name.v === 'Identity') return 'None';
        const d = isDict(cf) ? cf.get(name.v) : null;
        const m2 = isDict(d) ? d.get('CFM') : null;
        return m2 instanceof Name ? m2.v : 'None';
      };
      const sm = method(enc.get('StmF')), tm = method(enc.get('StrF'));
      streams = sm !== 'None';
      strings = tm !== 'None';
      aes = sm === 'AESV2' || sm === 'AESV3' || tm === 'AESV2' || tm === 'AESV3';
    }
    if (R >= 5) {
      // PDF 2.0 / AES-256: heslo uživatele, nebo heslo vlastníka
      const pw = pwBytes(this.password, true);
      const h = (salt: Uint8Array, udata: Uint8Array) => (R >= 6 ? hash2B(pw, salt, udata) : sha256(cat(pw, salt, udata)));
      const UE = (enc.get('UE') as Str)?.b, OE = (enc.get('OE') as Str)?.b;
      const u48 = U.subarray(0, 48);
      let key: Uint8Array | null = null;
      if (UE && same(h(U.subarray(32, 40), new Uint8Array(0)), U, 32)) key = aesCbcDecrypt(h(U.subarray(40, 48), new Uint8Array(0)), new Uint8Array(16), UE.subarray(0, 32), false);
      else if (OE && same(h(O.subarray(32, 40), u48), O, 32)) key = aesCbcDecrypt(h(O.subarray(40, 48), u48), new Uint8Array(16), OE.subarray(0, 32), false);
      if (!key) throw new PdfPasswordError(!!this.password);
      this.crypt = { key, aes: true, v5: true, strings, streams, metadata };
      return;
    }
    const n = R === 2 ? 5 : Math.min(16, Math.max(5, Math.floor((enc.get('Length') ?? 40) / 8)));
    const p4 = new Uint8Array([P & 255, (P >> 8) & 255, (P >> 16) & 255, (P >>> 24) & 255]);
    const userKey = (padded: Uint8Array) => {
      let hh = md5(cat(padded, O.subarray(0, 32), p4, id0, R >= 4 && !metadata ? new Uint8Array([255, 255, 255, 255]) : new Uint8Array(0)));
      if (R >= 3) for (let i = 0; i < 50; i++) hh = md5(hh.subarray(0, n));
      return hh.subarray(0, n);
    };
    const checks = (k: Uint8Array) => {
      if (R === 2) return same(rc4(k, PAD), U, 32);
      let c = rc4(k, md5(cat(PAD, id0)));
      for (let i = 1; i <= 19; i++) c = rc4(k.map((b) => b ^ i), c);
      return same(c, U, 16);
    };
    // heslo může být zapsané jako Latin-1 (podle normy) i UTF-8 (některé programy) – zkusí se obojí
    const variants = [pwBytes(this.password, false), pwBytes(this.password, true).subarray(0, 32)];
    let key: Uint8Array | null = null;
    for (const v of variants) {
      const pw = padPwd(v);
      const k = userKey(pw);
      if (checks(k)) {
        key = k;
        break;
      }
      // heslo vlastníka: z něj se odvodí heslo uživatele
      let oh = md5(pw);
      if (R >= 3) for (let i = 0; i < 50; i++) oh = md5(oh);
      const okey = oh.subarray(0, n);
      let up = O.subarray(0, 32);
      if (R === 2) up = rc4(okey, up);
      else for (let i = 19; i >= 0; i--) up = rc4(okey.map((b) => b ^ i), up);
      const k2 = userKey(up);
      if (checks(k2)) {
        key = k2;
        break;
      }
    }
    if (!key) throw new PdfPasswordError(!!this.password);
    this.crypt = { key, aes, v5: false, strings, streams, metadata };
  }
  decrypt(num: number, data: Uint8Array): Uint8Array {
    const c = this.crypt!;
    let k = c.key;
    if (!c.v5) {
      const g = this.gens.get(num) ?? 0;
      const ext = new Uint8Array([num & 255, (num >> 8) & 255, (num >> 16) & 255, g & 255, (g >> 8) & 255]);
      k = md5(cat(c.key, ext, c.aes ? new Uint8Array([0x73, 0x41, 0x6c, 0x54]) : new Uint8Array(0))).subarray(0, Math.min(16, c.key.length + 5));
    }
    if (!c.aes) return rc4(k, data);
    if (data.length < 32) return new Uint8Array(0);
    return aesCbcDecrypt(k, data.subarray(0, 16), data.subarray(16));
  }
  decryptValue(num: number, v: any): any {
    if (v instanceof Str) return new Str(this.decrypt(num, v.b));
    if (Array.isArray(v)) return v.map((x) => this.decryptValue(num, x));
    if (isDict(v)) {
      const m: PDict = new Map();
      for (const [k, x] of v) m.set(k, this.decryptValue(num, x));
      return m;
    }
    return v;
  }
  get(num: number): any {
    if (this.cache.has(num)) return this.cache.get(num);
    this.cache.set(num, null); // proti zacyklení
    let v: any = null;
    const off = this.offsets.get(num);
    if (off !== undefined) {
      const lx = new Lexer(this.d, off);
      v = lx.value();
      if (isDict(v)) {
        lx.skip();
        if (this.text.startsWith('stream', lx.pos)) {
          let p = lx.pos + 6;
          if (this.d[p] === 13) p++;
          if (this.d[p] === 10) p++;
          let len = this.resolve(v.get('Length'));
          if (typeof len !== 'number' || len < 0 || p + len > this.d.length || !/^\s*endstream/.test(this.text.slice(p + len, p + len + 20))) {
            const e = this.text.indexOf('endstream', p);
            len = (e < 0 ? this.d.length : e) - p;
          }
          v = { dict: v, data: this.d.subarray(p, p + len) } as Stream;
        }
      }
      if (this.crypt && num !== this.encNum) {
        if (isStream(v)) {
          const type = v.dict.get('Type');
          const skip = type instanceof Name && (type.v === 'XRef' || (type.v === 'Metadata' && !this.crypt.metadata));
          if (!skip && this.crypt.streams) v = { dict: this.crypt.strings ? this.decryptValue(num, v.dict) : v.dict, data: this.decrypt(num, v.data) };
        } else if (this.crypt.strings) v = this.decryptValue(num, v);
      }
    } else if (this.inStream.has(num)) {
      const { stm, idx } = this.inStream.get(num)!;
      const s = this.get(stm);
      const data = isStream(s) ? decodeStream(this, s) : null;
      if (data) {
        const first = s.dict.get('First') ?? 0;
        const lx = new Lexer(data);
        const pairs: number[] = [];
        for (let i = 0; i <= idx; i++) {
          pairs.push(lx.value(false), lx.value(false));
        }
        v = new Lexer(data, first + pairs[idx * 2 + 1]).value();
      }
    }
    this.cache.set(num, v);
    return v;
  }
  resolve(v: any): any {
    for (let i = 0; i < 20 && v instanceof Ref; i++) v = this.get(v.num);
    return v;
  }
}

function decodeStream(doc: PdfDoc, s: Stream): Uint8Array | null {
  let f = doc.resolve(s.dict.get('Filter'));
  const filters: string[] = (Array.isArray(f) ? f : f ? [f] : []).map((x: any) => (x instanceof Name ? x.v : ''));
  let data = s.data;
  for (const name of filters) {
    if (name === 'FlateDecode' || name === 'Fl') {
      try {
        data = pako.inflate(data);
      } catch {
        try {
          data = pako.inflateRaw(data.subarray(2));
        } catch {
          return null;
        }
      }
      const parms = doc.resolve(s.dict.get('DecodeParms'));
      const pred = isDict(parms) ? parms.get('Predictor') : undefined;
      if (typeof pred === 'number' && pred >= 10) data = unpredict(data, (isDict(parms) && parms.get('Columns')) || 1);
    } else if (name === 'ASCIIHexDecode' || name === 'AHx') {
      data = new Lexer(new Uint8Array([60, ...data, 62])).hex().b;
    } else return name === 'DCTDecode' ? data : null;
  }
  return data;
}

function unpredict(d: Uint8Array, cols: number): Uint8Array {
  const row = cols + 1;
  const out = new Uint8Array(Math.floor(d.length / row) * cols);
  const prev = new Uint8Array(cols);
  for (let r = 0; r * row < d.length; r++) {
    const t = d[r * row];
    for (let i = 0; i < cols; i++) {
      const x = d[r * row + 1 + i] ?? 0;
      const a = i > 0 ? out[r * cols + i - 1] : 0;
      const b = prev[i];
      const c = i > 0 ? prev[i - 1] : 0;
      let v = x;
      if (t === 1) v = x + a;
      else if (t === 2) v = x + b;
      else if (t === 3) v = x + ((a + b) >> 1);
      else if (t === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      if (r * cols + i < out.length) out[r * cols + i] = v & 255;
    }
    prev.set(out.subarray(r * cols, r * cols + cols));
  }
  return out;
}

// ------------------------------------------------------------ písma a kódování
const WIN_HIGH = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ';
const MAC_HIGH = 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ';
function winAnsi(c: number): string {
  if (c >= 0x80 && c < 0xa0) return WIN_HIGH[c - 0x80];
  return String.fromCharCode(c);
}
function macRoman(c: number): string {
  return c >= 0x80 ? MAC_HIGH[c - 0x80] : String.fromCharCode(c);
}

// názvy glyfů (Adobe Glyph List – jen to, co se v evropských knihách vyskytuje)
const GLYPHS: Record<string, string> = {
  space: ' ', exclam: '!', quotedbl: '"', numbersign: '#', dollar: '$', percent: '%', ampersand: '&', quotesingle: "'", quoteright: '’',
  parenleft: '(', parenright: ')', asterisk: '*', plus: '+', comma: ',', hyphen: '-', period: '.', slash: '/', colon: ':', semicolon: ';',
  less: '<', equal: '=', greater: '>', question: '?', at: '@', bracketleft: '[', backslash: '\\', bracketright: ']', asciicircum: '^',
  underscore: '_', grave: '`', quoteleft: '‘', braceleft: '{', bar: '|', braceright: '}', asciitilde: '~', zero: '0', one: '1', two: '2',
  three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', quotedblleft: '“', quotedblright: '”', quotedblbase: '„',
  quotesinglbase: '‚', endash: '–', emdash: '—', ellipsis: '…', bullet: '•', guillemotleft: '«', guillemotright: '»', guilsinglleft: '‹',
  guilsinglright: '›', degree: '°', section: '§', paragraph: '¶', copyright: '©', registered: '®', trademark: '™', fi: 'fi', fl: 'fl',
  ff: 'ff', ffi: 'ffi', ffl: 'ffl', germandbls: 'ß', nbspace: ' ', uni00A0: ' ', minus: '−', multiply: '×', divide: '÷', periodcentered: '·',
  dagger: '†', daggerdbl: '‡', Euro: '€', sterling: '£', yen: '¥', cent: '¢', exclamdown: '¡', questiondown: '¿', florin: 'ƒ', dotlessi: 'ı',
};
const ACC: Record<string, string> = { acute: '́', grave: '̀', caron: '̌', ring: '̊', dieresis: '̈', circumflex: '̂', tilde: '̃', cedilla: '̧', ogonek: '̨', dotaccent: '̇', breve: '̆', hungarumlaut: '̋', macron: '̄' };
const COMPOSED: Record<string, string> = Object.fromEntries(
  ('aacute á Aacute Á eacute é Eacute É iacute í Iacute Í oacute ó Oacute Ó uacute ú Uacute Ú yacute ý Yacute Ý ccaron č Ccaron Č dcaron ď Dcaron Ď ' +
    'ecaron ě Ecaron Ě ncaron ň Ncaron Ň rcaron ř Rcaron Ř scaron š Scaron Š tcaron ť Tcaron Ť zcaron ž Zcaron Ž uring ů Uring Ů lacute ĺ Lacute Ĺ ' +
    'lcaron ľ Lcaron Ľ racute ŕ Racute Ŕ ocircumflex ô Ocircumflex Ô adieresis ä Adieresis Ä odieresis ö Odieresis Ö udieresis ü Udieresis Ü ' +
    'agrave à egrave è ugrave ù acircumflex â ecircumflex ê icircumflex î ucircumflex û ccedilla ç Ccedilla Ç ntilde ñ Ntilde Ñ edieresis ë idieresis ï ' +
    'aogonek ą Aogonek Ą eogonek ę Eogonek Ę cacute ć Cacute Ć nacute ń Nacute Ń sacute ś Sacute Ś zacute ź Zacute Ź zdotaccent ż Zdotaccent Ż ' +
    'ohungarumlaut ő Ohungarumlaut Ő uhungarumlaut ű Uhungarumlaut Ű atilde ã otilde õ aring å Aring Å')
    .split(' ')
    .reduce<[string, string][]>((acc, w, i, arr) => (i % 2 === 0 ? [...acc, [w, arr[i + 1]]] : acc), []),
);

function glyphChar(name: string): string {
  if (GLYPHS[name] !== undefined) return GLYPHS[name];
  if (/^[A-Za-z]$/.test(name)) return name;
  let m = /^uni([0-9A-Fa-f]{4,})/.exec(name);
  if (m) return String.fromCodePoint(...(m[1].match(/.{4}/g) ?? []).map((h) => parseInt(h, 16)));
  m = /^u([0-9A-Fa-f]{4,6})$/.exec(name);
  if (m) return String.fromCodePoint(parseInt(m[1], 16));
  m = /^([A-Za-z])(acute|grave|caron|ring|dieresis|circumflex|tilde|cedilla|ogonek|dotaccent|breve|hungarumlaut|macron)$/.exec(name);
  if (m) {
    const composed = COMPOSED[m[1] + m[2]];
    if (composed) return composed;
    try {
      return (m[1] + ACC[m[2]]).normalize('NFC');
    } catch {
      return m[1];
    }
  }
  if (name === 'lslash') return 'ł';
  if (name === 'Lslash') return 'Ł';
  if (name === 'dcroat') return 'đ';
  if (name === 'Dcroat') return 'Đ';
  if (name === 'oslash') return 'ø';
  if (name === 'Oslash') return 'Ø';
  if (name === 'ae') return 'æ';
  if (name === 'AE') return 'Æ';
  if (name === 'oe') return 'œ';
  if (name === 'OE') return 'Œ';
  const base = name.split('.')[0];
  return base !== name ? glyphChar(base) : '';
}

interface Font {
  bytes: 1 | 2;
  toUni: Map<number, string> | null;
  base: (c: number) => string;
  widths: Map<number, number>;
  dw: number;
  spaceCode: number;
}

function parseCMap(data: Uint8Array): { map: Map<number, string>; bytes: 1 | 2 } {
  const map = new Map<number, string>();
  const s = latin1(data);
  const utf16 = (h: string) => {
    const units = (h.match(/.{1,4}/g) ?? []).map((x) => parseInt(x.padEnd(4, '0'), 16));
    return String.fromCharCode(...units);
  };
  let bytes: 1 | 2 = 1;
  const cs = /begincodespacerange([\s\S]*?)endcodespacerange/.exec(s);
  if (cs && /<[0-9a-fA-F]{4}>/.test(cs[1])) bytes = 2;
  for (const block of s.match(/beginbfchar([\s\S]*?)endbfchar/g) ?? []) {
    for (const m of block.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) map.set(parseInt(m[1], 16), utf16(m[2]));
  }
  for (const block of s.match(/beginbfrange([\s\S]*?)endbfrange/g) ?? []) {
    for (const m of block.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]*)>|\[([^\]]*)\])/g)) {
      const lo = parseInt(m[1], 16), hi = Math.min(parseInt(m[2], 16), parseInt(m[1], 16) + 65535);
      if (m[4] !== undefined) {
        const dst = m[4];
        const last = parseInt(dst.slice(-4) || '0', 16);
        for (let c = lo; c <= hi; c++) map.set(c, utf16(dst.slice(0, -4) + (last + c - lo).toString(16).padStart(4, '0')));
      } else {
        const items = [...(m[5] ?? '').matchAll(/<([0-9a-fA-F]*)>/g)].map((x) => x[1]);
        items.forEach((h, i) => map.set(lo + i, utf16(h)));
      }
    }
  }
  return { map, bytes };
}

function loadFont(doc: PdfDoc, f: PDict): Font {
  const sub = doc.resolve(f.get('Subtype'));
  const type0 = sub instanceof Name && sub.v === 'Type0';
  const font: Font = { bytes: type0 ? 2 : 1, toUni: null, base: winAnsi, widths: new Map(), dw: type0 ? 1000 : 500, spaceCode: 32 };
  const tu = doc.resolve(f.get('ToUnicode'));
  if (isStream(tu)) {
    const data = decodeStream(doc, tu);
    if (data) {
      const r = parseCMap(data);
      font.toUni = r.map;
      if (!type0) font.bytes = r.bytes === 2 && ![...r.map.keys()].every((k) => k < 256) ? 2 : 1;
    }
  }
  if (type0) {
    const desc = doc.resolve(doc.resolve(f.get('DescendantFonts'))?.[0]);
    if (isDict(desc)) {
      font.dw = doc.resolve(desc.get('DW')) ?? 1000;
      const w = doc.resolve(desc.get('W'));
      if (Array.isArray(w)) {
        for (let i = 0; i < w.length; ) {
          const a = doc.resolve(w[i]);
          const b = doc.resolve(w[i + 1]);
          if (Array.isArray(b)) {
            b.forEach((x: any, k: number) => font.widths.set(a + k, doc.resolve(x)));
            i += 2;
          } else {
            const wd = doc.resolve(w[i + 2]);
            for (let c = a; c <= b && c - a < 65536; c++) font.widths.set(c, wd);
            i += 3;
          }
        }
      }
    }
    if (font.toUni) for (const [k, v] of font.toUni) if (v === ' ') font.spaceCode = k;
    return font;
  }
  const enc = doc.resolve(f.get('Encoding'));
  const diffs = new Map<number, string>();
  let baseName = enc instanceof Name ? enc.v : '';
  if (isDict(enc)) {
    const be = doc.resolve(enc.get('BaseEncoding'));
    if (be instanceof Name) baseName = be.v;
    const d = doc.resolve(enc.get('Differences'));
    if (Array.isArray(d)) {
      let code = 0;
      for (const x of d) {
        const v = doc.resolve(x);
        if (typeof v === 'number') code = v;
        else if (v instanceof Name) diffs.set(code++, glyphChar(v.v));
      }
    }
  }
  const base = baseName === 'MacRomanEncoding' ? macRoman : winAnsi;
  font.base = diffs.size ? (c) => (diffs.has(c) ? diffs.get(c)! : base(c)) : base;
  const first = doc.resolve(f.get('FirstChar')) ?? 0;
  const widths = doc.resolve(f.get('Widths'));
  if (Array.isArray(widths)) widths.forEach((x: any, i: number) => font.widths.set(first + i, doc.resolve(x)));
  return font;
}

function decodeText(font: Font, b: Uint8Array): { text: string; width: number; spaces: number } {
  let text = '';
  let width = 0;
  let spaces = 0;
  for (let i = 0; i < b.length; ) {
    const code = font.bytes === 2 && i + 1 < b.length ? (b[i] << 8) | b[i + 1] : b[i];
    i += font.bytes === 2 && i + 1 < b.length ? 2 : 1;
    const ch = font.toUni?.get(code) ?? (font.bytes === 1 ? font.base(code) : '');
    text += ch;
    width += font.widths.get(code) ?? font.dw;
    if (font.bytes === 1 && code === 32) spaces++;
  }
  return { text: text.replace(/\u0000/g, ''), width, spaces };
}

// ------------------------------------------------------------ obsah stránek
interface Piece {
  x: number;
  y: number;
  end: number;
  size: number;
  text: string;
}
type M = [number, number, number, number, number, number];
const mul = (a: M, b: M): M => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3], a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]];
const ID: M = [1, 0, 0, 1, 0, 0];

interface PageOut {
  pieces: Piece[];
  images: Uint8Array[];
}

function runContent(doc: PdfDoc, data: Uint8Array, res: PDict | null, ctm0: M, out: PageOut, fonts: Map<any, Font>, depth = 0) {
  const lx = new Lexer(data);
  const ops: any[] = [];
  let ctm = ctm0;
  type Box = [number, number, number, number]; // x0 y0 x1 y1 (souřadnice stránky)
  let clip: Box = [-1e9, -1e9, 1e9, 1e9];
  const stack: { ctm: M; clip: Box }[] = [];
  let path: Box | null = null;
  let pendingClip = false;
  const pt = (x: number, y: number) => {
    const X = x * ctm[0] + y * ctm[2] + ctm[4], Y = x * ctm[1] + y * ctm[3] + ctm[5];
    path = path ? [Math.min(path[0], X), Math.min(path[1], Y), Math.max(path[2], X), Math.max(path[3], Y)] : [X, Y, X, Y];
  };
  const endPath = () => {
    if (pendingClip && path) clip = [Math.max(clip[0], path[0]), Math.max(clip[1], path[1]), Math.min(clip[2], path[2]), Math.min(clip[3], path[3])];
    pendingClip = false;
    path = null;
  };
  let tm: M = ID, tlm: M = ID;
  let font: Font | null = null;
  let size = 12, tc = 0, tw = 0, th = 1, tl = 0, rise = 0;
  const fontDict = isDict(res) ? doc.resolve(res.get('Font')) : null;
  const xobjs = isDict(res) ? doc.resolve(res.get('XObject')) : null;
  const show = (s: Str) => {
    if (!font) return;
    const r = decodeText(font, s.b);
    const m = mul([size * th, 0, 0, size, 0, rise], mul(tm, ctm));
    const adv = (r.width / 1000) * size + tc * s.b.length / font.bytes + tw * r.spaces;
    const scale = Math.hypot(m[2], m[3]) || size;
    const x = m[4], y = m[5];
    tm = mul([1, 0, 0, 1, adv * th, 0], tm);
    const endM = mul(tm, ctm);
    // text mimo ořez (např. řádek z předchozí stránky, který Qt kreslí schovaný nad okrajem) se vynechá
    const inClip = y >= clip[1] - scale * 0.3 && y <= clip[3] + scale * 0.3 && x <= clip[2] && endM[4] >= clip[0];
    if (r.text && inClip) out.pieces.push({ x, y, end: endM[4], size: scale, text: r.text });
  };
  for (let guard = 0; guard < 5_000_000; guard++) {
    const v = lx.value(false);
    if (v === undefined) break;
    if (!(v instanceof Op)) {
      ops.push(v);
      continue;
    }
    const a = ops.splice(0);
    switch (v.v) {
      case 'q': stack.push({ ctm, clip }); break;
      case 'Q': { const st = stack.pop(); if (st) { ctm = st.ctm; clip = st.clip; } break; }
      case 'm': case 'l': if (a.length >= 2) pt(a[a.length - 2], a[a.length - 1]); break;
      case 'c': if (a.length >= 6) { pt(a[0], a[1]); pt(a[2], a[3]); pt(a[4], a[5]); } break;
      case 'v': case 'y': if (a.length >= 4) { pt(a[0], a[1]); pt(a[2], a[3]); } break;
      case 're': if (a.length >= 4) { pt(a[0], a[1]); pt(a[0] + a[2], a[1] + a[3]); } break;
      case 'W': case 'W*': pendingClip = true; break;
      case 'n': case 'f': case 'F': case 'f*': case 'S': case 's': case 'B': case 'B*': case 'b': case 'b*': endPath(); break;
      case 'cm': if (a.length >= 6) ctm = mul(a.slice(-6) as M, ctm); break;
      case 'BT': tm = tlm = ID; break;
      case 'Tf': {
        const n = a[a.length - 2];
        size = a[a.length - 1] ?? size;
        const ref = isDict(fontDict) && n instanceof Name ? fontDict.get(n.v) : null;
        const key = ref instanceof Ref ? ref.num : ref;
        if (key && !fonts.has(key)) {
          const fd = doc.resolve(ref);
          fonts.set(key, isDict(fd) ? loadFont(doc, fd) : { bytes: 1, toUni: null, base: winAnsi, widths: new Map(), dw: 500, spaceCode: 32 });
        }
        font = key ? fonts.get(key)! : null;
        break;
      }
      case 'Tc': tc = a[0] ?? 0; break;
      case 'Tw': tw = a[0] ?? 0; break;
      case 'Tz': th = (a[0] ?? 100) / 100; break;
      case 'TL': tl = a[0] ?? 0; break;
      case 'Ts': rise = a[0] ?? 0; break;
      case 'Td': tm = tlm = mul([1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0], tlm); break;
      case 'TD': tl = -(a[1] ?? 0); tm = tlm = mul([1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0], tlm); break;
      case 'Tm': if (a.length >= 6) tm = tlm = a.slice(-6) as M; break;
      case 'T*': tm = tlm = mul([1, 0, 0, 1, 0, -tl], tlm); break;
      case 'Tj': if (a[0] instanceof Str) show(a[0]); break;
      case "'": tm = tlm = mul([1, 0, 0, 1, 0, -tl], tlm); if (a[0] instanceof Str) show(a[0]); break;
      case '"': tw = a[0] ?? tw; tc = a[1] ?? tc; tm = tlm = mul([1, 0, 0, 1, 0, -tl], tlm); if (a[2] instanceof Str) show(a[2]); break;
      case 'TJ': {
        const arr = Array.isArray(a[0]) ? a[0] : [];
        for (const it of arr) {
          if (it instanceof Str) show(it);
          else if (typeof it === 'number') {
            const dx = (-it / 1000) * size * th;
            if (it < -180 && out.pieces.length) out.pieces[out.pieces.length - 1].text += ' ';
            tm = mul([1, 0, 0, 1, dx, 0], tm);
          }
        }
        break;
      }
      case 'Do': {
        const n = a[0];
        if (!(n instanceof Name) || !isDict(xobjs) || depth > 6) break;
        const xo = doc.resolve(xobjs.get(n.v));
        if (!isStream(xo)) break;
        const st = doc.resolve(xo.dict.get('Subtype'));
        if (st instanceof Name && st.v === 'Form') {
          const body = decodeStream(doc, xo);
          const mx = doc.resolve(xo.dict.get('Matrix'));
          if (body) runContent(doc, body, doc.resolve(xo.dict.get('Resources')) ?? res, mul(Array.isArray(mx) && mx.length === 6 ? (mx as M) : ID, ctm), out, fonts, depth + 1);
        } else if (st instanceof Name && st.v === 'Image') {
          const f = doc.resolve(xo.dict.get('Filter'));
          const fname = f instanceof Name ? f.v : Array.isArray(f) && f.length === 1 && f[0] instanceof Name ? f[0].v : '';
          const w = doc.resolve(xo.dict.get('Width')) ?? 0;
          if (fname === 'DCTDecode' && w >= 200) out.images.push(xo.data);
        }
        break;
      }
      case 'BI': {
        // vložený obrázek: přeskočit data až po EI
        const t = latin1(data, lx.pos, Math.min(data.length, lx.pos + 2_000_000));
        const e = t.search(/\sEI(\s|$)/);
        lx.pos += e < 0 ? t.length : e + 3;
        break;
      }
    }
  }
}

function pageList(doc: PdfDoc): { page: PDict; res: PDict | null }[] {
  let root: any = null;
  const tr = /trailer\s*<<[\s\S]*?\/Root\s+(\d+)\s+\d+\s+R/g;
  let m: RegExpExecArray | null;
  while ((m = tr.exec(doc.text))) root = doc.get(+m[1]);
  if (!isDict(root)) {
    const xr = /\/Type\s*\/XRef[\s\S]{0,400}?\/Root\s+(\d+)\s+\d+\s+R|\/Root\s+(\d+)\s+\d+\s+R[\s\S]{0,400}?\/Type\s*\/XRef/g;
    while ((m = xr.exec(doc.text))) root = doc.get(+(m[1] ?? m[2]));
  }
  if (!isDict(root)) {
    for (const num of [...doc.offsets.keys(), ...doc.inStream.keys()]) {
      const v = doc.get(num);
      if (isDict(v) && doc.resolve(v.get('Type'))?.v === 'Catalog') {
        root = v;
        break;
      }
    }
  }
  const out: { page: PDict; res: PDict | null }[] = [];
  const seen = new Set<any>();
  const walk = (node: any, res: PDict | null, depth: number) => {
    node = doc.resolve(node);
    if (!isDict(node) || seen.has(node) || depth > 40) return;
    seen.add(node);
    const r = doc.resolve(node.get('Resources'));
    const myRes = isDict(r) ? r : res;
    const kids = doc.resolve(node.get('Kids'));
    if (Array.isArray(kids)) for (const k of kids) walk(k, myRes, depth + 1);
    else out.push({ page: node, res: myRes });
  };
  if (isDict(root)) walk(root.get('Pages'), null, 0);
  return out;
}

// ------------------------------------------------------------ od kousků textu k odstavcům
interface Line {
  y: number;
  x: number;
  end: number;
  size: number;
  text: string;
  page: number;
}

function piecesToLines(pieces: Piece[], page: number): Line[] {
  const lines: Line[] = [];
  let cur: Line | null = null;
  let lastEnd = 0;
  for (const p of pieces) {
    const tol = Math.max(2, p.size * 0.45);
    if (cur && Math.abs(p.y - cur.y) <= tol && p.x >= lastEnd - p.size * 2) {
      const gap = p.x - lastEnd;
      if (gap > p.size * 0.18 && !/\s$/.test(cur.text) && !/^\s/.test(p.text)) cur.text += ' ';
      cur.text += p.text;
      cur.size = Math.max(cur.size, p.size);
      cur.end = Math.max(cur.end, p.end);
    } else {
      if (cur) lines.push(cur);
      cur = { y: p.y, x: p.x, end: p.end, size: p.size, text: p.text, page };
    }
    lastEnd = p.end;
  }
  if (cur) lines.push(cur);
  return lines.map((l) => ({ ...l, text: l.text.replace(/\s+/g, ' ').trim() })).filter((l) => l.text);
}

function median(a: number[], def: number): number {
  if (!a.length) return def;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

const END = /[.!?…:“”"»)]$/;

export function linesToBlocks(pages: Line[][]): Block[] {
  // záhlaví, zápatí a čísla stránek: první/poslední řádek stránky oddělený od textu větší mezerou
  const rawGaps: number[] = [];
  for (const ls of pages) for (let i = 1; i < ls.length; i++) {
    const g = ls[i - 1].y - ls[i].y;
    if (g > 0) rawGaps.push(g);
  }
  const typGap = median(rawGaps, 14);
  // nejvyšší a nejnižší řádek stránky (podle polohy, ne pořadí v souboru – záhlaví bývá nakreslené až nakonec)
  const edgeOf = new Map<Line, boolean>();
  const lonely = new Map<Line, boolean>();
  for (const ls of pages) {
    const byY = [...ls].sort((a, b) => b.y - a.y);
    if (!byY.length) continue;
    const top = byY[0], bottom = byY[byY.length - 1];
    lonely.set(top, true);
    lonely.set(bottom, true);
    if (byY.length < 2 || top.y - byY[1].y > typGap * 1.8) edgeOf.set(top, true);
    if (byY.length >= 2 && byY[byY.length - 2].y - bottom.y > typGap * 1.8) edgeOf.set(bottom, true);
  }
  const isEdge = (ls: Line[], i: number) => edgeOf.get(ls[i]) === true;
  const norm = (t: string) => t.replace(/\d+/g, '#').toLowerCase();
  const counts = new Map<string, number>();
  for (const ls of pages) {
    const edge = new Set(ls.filter((_, i) => isEdge(ls, i)).map((l) => norm(l.text)));
    for (const k of edge) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const repeated = (t: string) => pages.length >= 3 && (counts.get(norm(t)) ?? 0) >= Math.max(3, pages.length * 0.3);
  const clean = pages.map((ls) => ls.filter((l, i) => {
    // samotné číslo stránky na prvním/posledním řádku (i blízko textu)
    if (lonely.get(l) && /^[-–—\s]*\d{1,4}[-–—\s]*$/.test(l.text)) return false;
    if (!isEdge(ls, i)) return true;
    if (/^(strana|page|seite|str\.)\s*\d+(\s*(z|of|von|\/)\s*\d+)?$/i.test(l.text)) return false;
    return !repeated(l.text);
  }));
  const all = clean.flat();
  const body = median(all.map((l) => l.size), 11);
  const gaps: number[] = [];
  for (const ls of clean) for (let i = 1; i < ls.length; i++) {
    const g = ls[i - 1].y - ls[i].y;
    if (g > 0 && Math.abs(ls[i].size - body) < body * 0.15) gaps.push(g);
  }
  const lineGap = median(gaps, body * 1.25);
  const bodyLines = all.filter((l) => Math.abs(l.size - body) < body * 0.15);
  const left = median(bodyLines.map((l) => l.x), 0);
  const right = median(bodyLines.map((l) => l.end), left + body * 30);
  const short = (l: Line) => l.end < right - (right - left) * 0.25;
  const blocks: Block[] = [];
  let para = '';
  const flush = () => {
    if (para.trim()) blocks.push({ type: 'p', text: para.trim() });
    para = '';
  };
  const append = (t: string) => {
    if (!para) para = t;
    else if (/[A-Za-zÀ-ž][-\u2010\u00ad]$/.test(para) && /^[a-zà-ž]/.test(t)) para = para.slice(0, -1) + t; // rozdělené slovo
    else para += ' ' + t;
  };
  let prev: Line | null = null;
  for (const l of all) {
    const heading = l.size >= body * 1.22 && l.text.length < 140;
    if (heading) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'h' && prev && prev.page === l.page && prev.size >= body * 1.22 && prev.y - l.y < l.size * 1.8) last.text += ' ' + l.text;
      else blocks.push({ type: 'h', text: l.text, level: l.size >= body * 1.6 ? 1 : 2 });
      prev = l;
      continue;
    }
    let newPara = !prev || prev.size >= body * 1.22;
    if (prev && !newPara) {
      if (prev.page === l.page) {
        const g = prev.y - l.y;
        if (g > lineGap * 1.45 || g < -lineGap) newPara = true;
        else if (l.x > left + body * 0.9 && l.x - prev.x > body * 0.9) newPara = true; // odsazený první řádek
        else if (END.test(prev.text) && short(prev) && l.x <= left + body) newPara = true; // krátký řádek na konci odstavce
      } else newPara = END.test(prev.text) && (short(prev) || l.x > left + body * 0.9 || /^[A-ZÀ-Ž„“"«(]/.test(l.text));
    }
    if (newPara) flush();
    append(l.text);
    prev = l;
  }
  flush();
  return blocks;
}

/** PDF → kniha. */
export function readPdf(data: Uint8Array, fileName: string, password = ''): Book {
  const doc = new PdfDoc(data, password);
  const pages = pageList(doc);
  if (!pages.length) throw new Error('PDF se nepodařilo přečíst – soubor je poškozený nebo neobvyklý.');
  const fonts = new Map<any, Font>();
  const lines: Line[][] = [];
  let cover: Uint8Array | null = null;
  pages.forEach(({ page, res }, i) => {
    const out: PageOut = { pieces: [], images: [] };
    const c = doc.resolve(page.get('Contents'));
    const parts = Array.isArray(c) ? c.map((x: any) => doc.resolve(x)) : [c];
    const chunks = parts.filter(isStream).map((s: Stream) => decodeStream(doc, s)).filter(Boolean) as Uint8Array[];
    const all = new Uint8Array(chunks.reduce((a, b) => a + b.length + 1, 0));
    let o = 0;
    for (const ch of chunks) {
      all.set(ch, o);
      o += ch.length;
      all[o++] = 10;
    }
    runContent(doc, all, res, ID, out, fonts);
    lines.push(piecesToLines(out.pieces, i));
    if (i === 0 && out.images.length) cover = out.images.sort((a, b) => b.length - a.length)[0];
  });
  const chars = lines.flat().reduce((a, l) => a + l.text.length, 0);
  if (chars < 20 * Math.min(pages.length, 5)) {
    throw new Error('PDF obsahuje jen obrázky stránek (sken) bez textu – telefon ho zatím nepřečte. Na počítači ho Překladač převede přes OCR.');
  }
  const base = fileName.replace(/\.[^.]+$/, '') || 'Kniha';
  const info = doc.text.match(/\/Title\s*(\((?:\\.|[^\\)])*\)|<[0-9a-fA-F]*>)/);
  let title = '';
  if (info) {
    const s = new Lexer(new Uint8Array(Array.from(info[1], (ch) => ch.charCodeAt(0) & 255))).value();
    if (s instanceof Str) title = pdfString(s.b).trim();
  }
  if (!title || /^(untitled|microsoft word|document|dokument)/i.test(title)) title = base;
  const blocks = linesToBlocks(lines);
  const book = emptyBook(title);
  book.source = fileName;
  if ((cover as Uint8Array | null)?.length) book.cover = addImage(book, cover!, 'image/jpeg');
  const headings = blocks.filter((b) => b.type === 'h').length;
  if (headings >= 2) book.chapters = chaptersFromBlocks(blocks, title);
  else {
    const text = blocks.map((b) => (b.type === 'p' || b.type === 'h' ? b.text : '')).join('\n\n');
    book.chapters = chaptersFromText(text, title).chapters;
  }
  if (!book.chapters.length) book.chapters = [{ title, blocks }];
  return book;
}

/** Textový řetězec PDF (UTF-16BE s BOM, nebo PDFDocEncoding ~ Latin-1). */
function pdfString(b: Uint8Array): string {
  if (b[0] === 0xfe && b[1] === 0xff) {
    let s = '';
    for (let i = 2; i + 1 < b.length; i += 2) s += String.fromCharCode((b[i] << 8) | b[i + 1]);
    return s;
  }
  return Array.from(b, winAnsi).join('');
}
