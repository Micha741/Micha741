// Šifrovací funkce pro PDF chráněná bez hesla (jen zákaz tisku/kopírování): MD5, RC4, AES-CBC, SHA-256/384/512.
// Čisté TypeScript bez závislostí (běží v telefonu i v testech).

// ------------------------------------------------------------ MD5
const MD5_S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
const MD5_K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

export function md5(data: Uint8Array): Uint8Array {
  const len = data.length;
  const total = ((len + 8) >> 6) * 64 + 64;
  const m = new Uint8Array(total);
  m.set(data);
  m[len] = 0x80;
  const bits = len * 8;
  for (let i = 0; i < 8; i++) m[total - 8 + i] = Math.floor(bits / 2 ** (8 * i)) & 255;
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const w = new Uint32Array(16);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = m[off + i * 4] | (m[off + i * 4 + 1] << 8) | (m[off + i * 4 + 2] << 16) | (m[off + i * 4 + 3] << 24);
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const tmp = d;
      d = c;
      c = b;
      const x = (a + f + MD5_K[i] + w[g]) >>> 0;
      b = (b + ((x << MD5_S[i]) | (x >>> (32 - MD5_S[i])))) >>> 0;
      a = tmp;
    }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0; c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }
  const out = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((v, i) => { for (let k = 0; k < 4; k++) out[i * 4 + k] = (v >>> (8 * k)) & 255; });
  return out;
}

// ------------------------------------------------------------ RC4
export function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) s[i] = i;
  for (let i = 0, j = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) & 255;
    [s[i], s[j]] = [s[j], s[i]];
  }
  const out = new Uint8Array(data.length);
  for (let k = 0, i = 0, j = 0; k < data.length; k++) {
    i = (i + 1) & 255;
    j = (j + s[i]) & 255;
    [s[i], s[j]] = [s[j], s[i]];
    out[k] = data[k] ^ s[(s[i] + s[j]) & 255];
  }
  return out;
}

// ------------------------------------------------------------ AES (128/256), CBC
const SBOX = new Uint8Array(256);
const INV = new Uint8Array(256);
(() => {
  let p = 1, q = 1;
  do {
    p = p ^ ((p << 1) & 255) ^ (p & 0x80 ? 0x1b : 0);
    q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 255;
    if (q & 0x80) q ^= 0x09;
    const x = q ^ ((q << 1) | (q >> 7)) ^ ((q << 2) | (q >> 6)) ^ ((q << 3) | (q >> 5)) ^ ((q << 4) | (q >> 4));
    SBOX[p] = (x ^ 0x63) & 255;
  } while (p !== 1);
  SBOX[0] = 0x63;
  for (let i = 0; i < 256; i++) INV[SBOX[i]] = i;
})();
const xt = (b: number) => ((b << 1) ^ (b & 0x80 ? 0x1b : 0)) & 255;
const mulG = (a: number, b: number) => { let r = 0; while (b) { if (b & 1) r ^= a; a = xt(a); b >>= 1; } return r; };

function expandKey(key: Uint8Array): Uint8Array[] {
  const nk = key.length / 4, nr = nk + 6;
  const w = new Uint8Array(16 * (nr + 1));
  w.set(key);
  let rcon = 1;
  for (let i = nk; i < 4 * (nr + 1); i++) {
    let t = w.slice((i - 1) * 4, i * 4);
    if (i % nk === 0) {
      t = new Uint8Array([SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]);
      rcon = xt(rcon);
    } else if (nk > 6 && i % nk === 4) t = t.map((b) => SBOX[b]);
    for (let k = 0; k < 4; k++) w[i * 4 + k] = w[(i - nk) * 4 + k] ^ t[k];
  }
  return Array.from({ length: nr + 1 }, (_, r) => w.subarray(r * 16, r * 16 + 16));
}

function encBlock(rk: Uint8Array[], inp: Uint8Array): Uint8Array {
  const s = inp.map((b, i) => b ^ rk[0][i]);
  const nr = rk.length - 1;
  for (let r = 1; r <= nr; r++) {
    for (let i = 0; i < 16; i++) s[i] = SBOX[s[i]];
    const t = new Uint8Array(16);
    for (let c = 0; c < 4; c++) for (let row = 0; row < 4; row++) t[c * 4 + row] = s[((c + row) % 4) * 4 + row];
    if (r < nr) {
      for (let c = 0; c < 4; c++) {
        const [a0, a1, a2, a3] = [t[c * 4], t[c * 4 + 1], t[c * 4 + 2], t[c * 4 + 3]];
        t[c * 4] = xt(a0) ^ xt(a1) ^ a1 ^ a2 ^ a3;
        t[c * 4 + 1] = a0 ^ xt(a1) ^ xt(a2) ^ a2 ^ a3;
        t[c * 4 + 2] = a0 ^ a1 ^ xt(a2) ^ xt(a3) ^ a3;
        t[c * 4 + 3] = xt(a0) ^ a0 ^ a1 ^ a2 ^ xt(a3);
      }
    }
    for (let i = 0; i < 16; i++) s[i] = t[i] ^ rk[r][i];
  }
  return s;
}

function decBlock(rk: Uint8Array[], inp: Uint8Array): Uint8Array {
  const nr = rk.length - 1;
  let s = inp.map((b, i) => b ^ rk[nr][i]);
  for (let r = nr - 1; r >= 0; r--) {
    const t = new Uint8Array(16);
    for (let c = 0; c < 4; c++) for (let row = 0; row < 4; row++) t[((c + row) % 4) * 4 + row] = s[c * 4 + row];
    for (let i = 0; i < 16; i++) t[i] = INV[t[i]] ^ rk[r][i];
    if (r > 0) {
      for (let c = 0; c < 4; c++) {
        const [a0, a1, a2, a3] = [t[c * 4], t[c * 4 + 1], t[c * 4 + 2], t[c * 4 + 3]];
        t[c * 4] = mulG(a0, 14) ^ mulG(a1, 11) ^ mulG(a2, 13) ^ mulG(a3, 9);
        t[c * 4 + 1] = mulG(a0, 9) ^ mulG(a1, 14) ^ mulG(a2, 11) ^ mulG(a3, 13);
        t[c * 4 + 2] = mulG(a0, 13) ^ mulG(a1, 9) ^ mulG(a2, 14) ^ mulG(a3, 11);
        t[c * 4 + 3] = mulG(a0, 11) ^ mulG(a1, 13) ^ mulG(a2, 9) ^ mulG(a3, 14);
      }
    }
    s = t;
  }
  return s;
}

/** AES-CBC dešifrování; `pad` = odstranit doplnění PKCS#7. */
export function aesCbcDecrypt(key: Uint8Array, iv: Uint8Array, data: Uint8Array, pad = true): Uint8Array {
  const rk = expandKey(key);
  const n = data.length - (data.length % 16);
  const out = new Uint8Array(n);
  let prev = iv;
  for (let o = 0; o < n; o += 16) {
    const blk = data.subarray(o, o + 16);
    const d = decBlock(rk, blk);
    for (let i = 0; i < 16; i++) out[o + i] = d[i] ^ prev[i];
    prev = blk;
  }
  if (pad && n) {
    const p = out[n - 1];
    if (p >= 1 && p <= 16) return out.subarray(0, n - p);
  }
  return out;
}

export function aesCbcEncrypt(key: Uint8Array, iv: Uint8Array, data: Uint8Array): Uint8Array {
  const rk = expandKey(key);
  const out = new Uint8Array(data.length);
  let prev = iv;
  for (let o = 0; o < data.length; o += 16) {
    const blk = data.slice(o, o + 16).map((b, i) => b ^ prev[i]);
    prev = encBlock(rk, blk);
    out.set(prev, o);
  }
  return out;
}

// ------------------------------------------------------------ SHA-256
const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function pad64(data: Uint8Array, block: number, lenBytes: number): Uint8Array {
  const total = Math.ceil((data.length + 1 + lenBytes) / block) * block;
  const m = new Uint8Array(total);
  m.set(data);
  m[data.length] = 0x80;
  const bits = data.length * 8;
  for (let i = 0; i < 6; i++) m[total - 1 - i] = Math.floor(bits / 2 ** (8 * i)) & 255;
  return m;
}

export function sha256(data: Uint8Array): Uint8Array {
  const m = pad64(data, 64, 8);
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < m.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = (m[off + i * 4] << 24) | (m[off + i * 4 + 1] << 16) | (m[off + i * 4 + 2] << 8) | m[off + i * 4 + 3];
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K256[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }
  const out = new Uint8Array(32);
  h.forEach((v, i) => { out[i * 4] = v >>> 24; out[i * 4 + 1] = (v >>> 16) & 255; out[i * 4 + 2] = (v >>> 8) & 255; out[i * 4 + 3] = v & 255; });
  return out;
}

// ------------------------------------------------------------ SHA-512 / SHA-384 (64bitová čísla jako dvojice 32bitových)
const K512 = [
  '428a2f98d728ae22', '7137449123ef65cd', 'b5c0fbcfec4d3b2f', 'e9b5dba58189dbbc', '3956c25bf348b538', '59f111f1b605d019', '923f82a4af194f9b', 'ab1c5ed5da6d8118',
  'd807aa98a3030242', '12835b0145706fbe', '243185be4ee4b28c', '550c7dc3d5ffb4e2', '72be5d74f27b896f', '80deb1fe3b1696b1', '9bdc06a725c71235', 'c19bf174cf692694',
  'e49b69c19ef14ad2', 'efbe4786384f25e3', '0fc19dc68b8cd5b5', '240ca1cc77ac9c65', '2de92c6f592b0275', '4a7484aa6ea6e483', '5cb0a9dcbd41fbd4', '76f988da831153b5',
  '983e5152ee66dfab', 'a831c66d2db43210', 'b00327c898fb213f', 'bf597fc7beef0ee4', 'c6e00bf33da88fc2', 'd5a79147930aa725', '06ca6351e003826f', '142929670a0e6e70',
  '27b70a8546d22ffc', '2e1b21385c26c926', '4d2c6dfc5ac42aed', '53380d139d95b3df', '650a73548baf63de', '766a0abb3c77b2a8', '81c2c92e47edaee6', '92722c851482353b',
  'a2bfe8a14cf10364', 'a81a664bbc423001', 'c24b8b70d0f89791', 'c76c51a30654be30', 'd192e819d6ef5218', 'd69906245565a910', 'f40e35855771202a', '106aa07032bbd1b8',
  '19a4c116b8d2d0c8', '1e376c085141ab53', '2748774cdf8eeb99', '34b0bcb5e19b48a8', '391c0cb3c5c95a63', '4ed8aa4ae3418acb', '5b9cca4f7763e373', '682e6ff3d6b2b8a3',
  '748f82ee5defb2fc', '78a5636f43172f60', '84c87814a1f0ab72', '8cc702081a6439ec', '90befffa23631e28', 'a4506cebde82bde9', 'bef9a3f7b2c67915', 'c67178f2e372532b',
  'ca273eceea26619c', 'd186b8c721c0c207', 'eada7dd6cde0eb1e', 'f57d4f7fee6ed178', '06f067aa72176fba', '0a637dc5a2c898a6', '113f9804bef90dae', '1b710b35131c471b',
  '28db77f523047d84', '32caab7b40c72493', '3c9ebe0a15c9bebc', '431d67c49c100d4c', '4cc5d4becb3e42b6', '597f299cfc657e2a', '5fcb6fab3ad6faec', '6c44198c4a475817',
].map((h) => [parseInt(h.slice(0, 8), 16) | 0, parseInt(h.slice(8), 16) | 0]);

function sha512core(data: Uint8Array, iv: number[]): Uint8Array {
  const m = pad64(data, 128, 16);
  const H = iv.slice();
  const wh = new Int32Array(80), wl = new Int32Array(80);
  const add = (ah: number, al: number, bh: number, bl: number): [number, number] => {
    const l = (al >>> 0) + (bl >>> 0);
    return [(ah + bh + Math.floor(l / 0x100000000)) | 0, l | 0];
  };
  const rotr = (h: number, l: number, n: number): [number, number] =>
    n < 32 ? [(h >>> n) | (l << (32 - n)), (l >>> n) | (h << (32 - n))] : [(l >>> (n - 32)) | (h << (64 - n)), (h >>> (n - 32)) | (l << (64 - n))];
  for (let off = 0; off < m.length; off += 128) {
    for (let i = 0; i < 16; i++) {
      const o = off + i * 8;
      wh[i] = (m[o] << 24) | (m[o + 1] << 16) | (m[o + 2] << 8) | m[o + 3];
      wl[i] = (m[o + 4] << 24) | (m[o + 5] << 16) | (m[o + 6] << 8) | m[o + 7];
    }
    for (let i = 16; i < 80; i++) {
      const [a1, b1] = rotr(wh[i - 15], wl[i - 15], 1), [a2, b2] = rotr(wh[i - 15], wl[i - 15], 8);
      const s0h = a1 ^ a2 ^ (wh[i - 15] >>> 7), s0l = b1 ^ b2 ^ ((wl[i - 15] >>> 7) | (wh[i - 15] << 25));
      const [c1, d1] = rotr(wh[i - 2], wl[i - 2], 19), [c2, d2] = rotr(wh[i - 2], wl[i - 2], 61);
      const s1h = c1 ^ c2 ^ (wh[i - 2] >>> 6), s1l = d1 ^ d2 ^ ((wl[i - 2] >>> 6) | (wh[i - 2] << 26));
      let [h, l] = add(wh[i - 16], wl[i - 16], s0h, s0l);
      [h, l] = add(h, l, wh[i - 7], wl[i - 7]);
      [h, l] = add(h, l, s1h, s1l);
      wh[i] = h; wl[i] = l;
    }
    let [ah, al, bh, bl, ch, cl, dh, dl, eh, el, fh, fl, gh, gl, hh, hl] = H;
    for (let i = 0; i < 80; i++) {
      const [e1h, e1l] = rotr(eh, el, 14), [e2h, e2l] = rotr(eh, el, 18), [e3h, e3l] = rotr(eh, el, 41);
      const S1h = e1h ^ e2h ^ e3h, S1l = e1l ^ e2l ^ e3l;
      const chh = (eh & fh) ^ (~eh & gh), chl = (el & fl) ^ (~el & gl);
      let [t1h, t1l] = add(hh, hl, S1h, S1l);
      [t1h, t1l] = add(t1h, t1l, chh, chl);
      [t1h, t1l] = add(t1h, t1l, K512[i][0], K512[i][1]);
      [t1h, t1l] = add(t1h, t1l, wh[i], wl[i]);
      const [a1h, a1l] = rotr(ah, al, 28), [a2h, a2l] = rotr(ah, al, 34), [a3h, a3l] = rotr(ah, al, 39);
      const S0h = a1h ^ a2h ^ a3h, S0l = a1l ^ a2l ^ a3l;
      const mjh = (ah & bh) ^ (ah & ch) ^ (bh & ch), mjl = (al & bl) ^ (al & cl) ^ (bl & cl);
      const [t2h, t2l] = add(S0h, S0l, mjh, mjl);
      hh = gh; hl = gl; gh = fh; gl = fl; fh = eh; fl = el;
      [eh, el] = add(dh, dl, t1h, t1l);
      dh = ch; dl = cl; ch = bh; cl = bl; bh = ah; bl = al;
      [ah, al] = add(t1h, t1l, t2h, t2l);
    }
    const v = [ah, al, bh, bl, ch, cl, dh, dl, eh, el, fh, fl, gh, gl, hh, hl];
    for (let k = 0; k < 16; k += 2) [H[k], H[k + 1]] = add(H[k], H[k + 1], v[k], v[k + 1]);
  }
  const out = new Uint8Array(64);
  for (let k = 0; k < 16; k++) for (let b = 0; b < 4; b++) out[k * 4 + b] = (H[k] >>> (24 - 8 * b)) & 255;
  return out;
}

const IV512 = ['6a09e667f3bcc908', 'bb67ae8584caa73b', '3c6ef372fe94f82b', 'a54ff53a5f1d36f1', '510e527fade682d1', '9b05688c2b3e6c1f', '1f83d9abfb41bd6b', '5be0cd19137e2179'];
const IV384 = ['cbbb9d5dc1059ed8', '629a292a367cd507', '9159015a3070dd17', '152fecd8f70e5939', '67332667ffc00b31', '8eb44a8768581511', 'db0c2e0d64f98fa7', '47b5481dbefa4fa4'];
const ivWords = (iv: string[]) => iv.flatMap((h) => [parseInt(h.slice(0, 8), 16) | 0, parseInt(h.slice(8), 16) | 0]);
export const sha512 = (d: Uint8Array) => sha512core(d, ivWords(IV512));
export const sha384 = (d: Uint8Array) => sha512core(d, ivWords(IV384)).subarray(0, 48);
