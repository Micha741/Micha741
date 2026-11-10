// MOBI (starší formát Kindle, „MOBI 6“) a PalmDoc PDB – zápis i čtení bez Calibre.
import type { Book, Chapter } from './book';
import { emptyBook, sniffMime } from './book';
import { concat, cp1252Decode, decodeAny, escapeXml, utf8Decode, utf8Encode } from './bytes';
import { chaptersFromBlocks, chaptersFromText } from './chapters';
import { htmlToBlocks } from './html';
import { compressPalmDoc, decompressPalmDoc, readPdb, splitRecords, u16, u32, writePdb } from './palmdoc';

const LCID: Record<string, number> = { cs: 1029, sk: 1051, en: 1033, de: 1031, pl: 1045, fr: 1036, es: 3082, it: 1040, ru: 1049, uk: 1058, hu: 1038 };
const FILEPOS = '0000000000';

function textRecords(text: Uint8Array): Uint8Array[] {
  return splitRecords(text).map(compressPalmDoc);
}

// ------------------------------------------------------------ MOBI – zápis
export function writeMobi(book: Book, opts: { toc?: boolean } = {}): Uint8Array {
  const toc = opts.toc ?? true;
  // obrázky: obálka první, pak v pořadí výskytu; jen JPEG/GIF/PNG/BMP
  const order: string[] = [];
  const add = (n?: string) => {
    if (n && book.images[n] && !order.includes(n)) order.push(n);
  };
  add(book.cover);
  for (const ch of book.chapters) for (const b of ch.blocks) if (b.type === 'img') add(b.name);
  const recIndex = (n: string) => String(order.indexOf(n) + 1).padStart(5, '0');

  // HTML po kouscích kvůli výpočtu pozic (filepos = bajtová pozice v textu)
  const pieces: (string | { mark: string })[] = [];
  const marks: Record<string, number> = {};
  pieces.push(`<html><head><guide>${toc ? `<reference type="toc" title="Obsah" filepos=${'@toc'} />` : ''}` +
    `<reference type="text" title="Začátek" filepos=${'@start'} /></guide></head><body>`);
  if (book.cover) pieces.push(`<p><img recindex="${recIndex(book.cover)}" /></p><mbp:pagebreak/>`);
  pieces.push(`<p height="3em" align="center"><font size="+3"><b>${escapeXml(book.title)}</b></font></p>`);
  if (book.author) pieces.push(`<p align="center"><font size="+1">${escapeXml(book.author)}</font></p>`);
  pieces.push('<mbp:pagebreak/>');
  if (toc && book.chapters.length > 1) {
    pieces.push({ mark: 'toc' }, '<h2>Obsah</h2>');
    book.chapters.forEach((c, i) => pieces.push(`<p><a filepos=@ch${i}>${i + 1}. ${escapeXml(c.title)}</a></p>`));
    pieces.push('<mbp:pagebreak/>');
  }
  pieces.push({ mark: 'start' });
  book.chapters.forEach((c: Chapter, i) => {
    pieces.push({ mark: `ch${i}` }, `<h2>${i + 1}. ${escapeXml(c.title)}</h2>`);
    for (const b of c.blocks) {
      if (b.type === 'p') pieces.push(`<p>${escapeXml(b.text).replace(/\n/g, '<br/>')}</p>`);
      else if (b.type === 'h') pieces.push(`<h3>${escapeXml(b.text)}</h3>`);
      else if (b.type === 'pb') pieces.push('<mbp:pagebreak/>');
      else if (b.type === 'img' && order.includes(b.name)) pieces.push(`<p align="center"><img recindex="${recIndex(b.name)}" /></p>`);
    }
    if (i < book.chapters.length - 1) pieces.push('<mbp:pagebreak/>');
  });
  pieces.push('</body></html>');
  // značky @toc/@start/@chN se nahradí 10 číslicemi (filepos); místa se zapamatují a doplní na konci
  let html = '';
  let bytes = 0; // délka html v bajtech UTF-8 (průběžně)
  const holes: { at: number; mark: string }[] = [];
  for (const p of pieces) {
    if (typeof p !== 'string') {
      marks[p.mark] = bytes;
      continue;
    }
    bytes += utf8Encode(p.replace(/@(toc|start|ch\d+)/g, FILEPOS)).length;
    const re = /@(toc|start|ch\d+)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(p))) {
      html += p.slice(last, m.index);
      holes.push({ at: html.length, mark: m[1] });
      html += FILEPOS;
      last = m.index + m[0].length;
    }
    html += p.slice(last);
  }
  for (const h of holes.reverse()) {
    html = html.slice(0, h.at) + String(marks[h.mark] ?? 0).padStart(10, '0') + html.slice(h.at + 10);
  }
  const text = utf8Encode(html);
  const recs = textRecords(text);
  const T = recs.length;

  const images = order.map((n) => book.images[n].data);
  const firstImage = images.length ? T + 1 : 0xffffffff;
  const flisIdx = T + 1 + images.length;
  const fcisIdx = flisIdx + 1;

  // EXTH
  const exthRecs: Uint8Array[] = [];
  const exth = (type: number, data: Uint8Array) => exthRecs.push(concat([u32(type), u32(data.length + 8), data]));
  if (book.author) exth(100, utf8Encode(book.author));
  exth(503, utf8Encode(book.title));
  exth(524, utf8Encode(book.language || 'cs'));
  exth(106, utf8Encode(new Date().toISOString().slice(0, 10)));
  exth(108, utf8Encode('Prekladac Android'));
  if (book.cover) {
    exth(201, u32(0));
    exth(202, u32(0));
  }
  let exthBody = concat(exthRecs);
  const exthLen = 12 + exthBody.length;
  const exthPad = (4 - (exthLen % 4)) % 4;
  const exthBlock = concat([utf8Encode('EXTH'), u32(exthLen + exthPad), u32(exthRecs.length), exthBody, new Uint8Array(exthPad)]);
  const title = utf8Encode(book.title);
  const headerLen = 232;
  const fullNameOffset = 16 + headerLen + exthBlock.length;

  const mobi = new Uint8Array(headerLen);
  const dv = new DataView(mobi.buffer);
  mobi.set(utf8Encode('MOBI'), 0);
  dv.setUint32(4, headerLen);
  dv.setUint32(8, 2); // kniha
  dv.setUint32(12, 65001); // UTF-8
  dv.setUint32(16, (Math.random() * 0xffffffff) >>> 0);
  dv.setUint32(20, 6);
  for (let o = 24; o < 64; o += 4) dv.setUint32(o, 0xffffffff);
  dv.setUint32(64, T + 1); // první záznam, který není text
  dv.setUint32(68, fullNameOffset);
  dv.setUint32(72, title.length);
  dv.setUint32(76, LCID[book.language] ?? 0);
  dv.setUint32(88, 6);
  dv.setUint32(92, firstImage);
  dv.setUint32(112, 0x50); // EXTH
  dv.setUint32(148, 0xffffffff);
  dv.setUint32(152, 0xffffffff);
  dv.setUint32(156, 0xffffffff);
  dv.setUint16(176, 1);
  dv.setUint16(178, T + images.length);
  dv.setUint32(180, 1);
  dv.setUint32(184, fcisIdx);
  dv.setUint32(188, 1);
  dv.setUint32(192, flisIdx);
  dv.setUint32(196, 1);
  dv.setUint32(208, 0xffffffff);
  dv.setUint32(216, 0xffffffff);
  dv.setUint32(220, 0xffffffff);
  dv.setUint32(224, 0); // žádná data na konci textových záznamů
  dv.setUint32(228, 0xffffffff);

  const palm = concat([u16(2), u16(0), u32(text.length), u16(T), u16(4096), u16(0), u16(0)]);
  const tail = new Uint8Array(2 + ((4 - ((fullNameOffset + title.length + 2) % 4)) % 4));
  const rec0 = concat([palm, mobi, exthBlock, title, tail]);

  const flis = Uint8Array.from([0x46, 0x4c, 0x49, 0x53, 0, 0, 0, 8, 0, 0x41, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff, 0, 1, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1, 0xff, 0xff, 0xff, 0xff]);
  const fcis = concat([utf8Encode('FCIS'), u32(0x14), u32(0x10), u32(1), u32(0), u32(text.length), u32(0), u32(0x20), u32(8), u16(1), u16(1), u32(0)]);
  const eof = Uint8Array.from([0xe9, 0x8e, 0x0d, 0x0a]);
  return writePdb({ name: book.title, type: 'BOOK', creator: 'MOBI', records: [rec0, ...recs, ...images, flis, fcis, eof] });
}

// ------------------------------------------------------------ PDB (PalmDoc) – zápis
export function writePalmDoc(book: Book): Uint8Array {
  const parts: string[] = [book.title];
  if (book.author) parts.push(book.author);
  book.chapters.forEach((c, i) => {
    parts.push('', '', `${i + 1}. ${c.title}`, '');
    for (const b of c.blocks) {
      if (b.type === 'p' || b.type === 'h') parts.push(b.text, '');
      else if (b.type === 'img') parts.push('[obrázek]', '');
    }
  });
  const text = utf8Encode(parts.join('\n').replace(/\n{3,}/g, '\n\n\n').trim() + '\n');
  const recs = textRecords(text);
  const rec0 = concat([u16(2), u16(0), u32(text.length), u16(recs.length), u16(4096), u32(0)]);
  return writePdb({ name: book.title, type: 'TEXt', creator: 'REAd', records: [rec0, ...recs] });
}

// ------------------------------------------------------------ čtení MOBI a PDB
function trailingSize(rec: Uint8Array, flags: number): number {
  let size = rec.length;
  let num = 0;
  const entry = (end: number) => {
    let result = 0;
    let bitpos = 0;
    let p = end;
    while (p > 0) {
      const v = rec[p - 1];
      result |= (v & 0x7f) << bitpos;
      bitpos += 7;
      p--;
      if (v & 0x80 || bitpos >= 28) break;
    }
    return result;
  };
  for (let f = flags >> 1; f; f >>= 1) if (f & 1) num += entry(size - num);
  if (flags & 1) num += (rec[size - num - 1] & 3) + 1;
  return Math.min(num, size);
}

export function readMobiOrPdb(data: Uint8Array, fileName: string): Book {
  const pdb = readPdb(data);
  const id = pdb.type + pdb.creator;
  const base = fileName.replace(/\.[^.]+$/, '');
  if (id === 'TEXtREAd') {
    const r0 = new DataView(pdb.records[0].buffer, pdb.records[0].byteOffset, pdb.records[0].byteLength);
    const comp = r0.getUint16(0);
    const count = r0.getUint16(8);
    const len = r0.getUint32(4);
    const chunks = pdb.records.slice(1, 1 + count).map((r) => (comp === 2 ? decompressPalmDoc(r) : r));
    const text = decodeAny(concat(chunks).subarray(0, len || undefined));
    const { title, chapters } = chaptersFromText(text, pdb.name || base);
    const book = emptyBook(title || pdb.name || base);
    book.chapters = chapters;
    book.source = fileName;
    return book;
  }
  if (id !== 'BOOKMOBI') {
    if (id === 'PNRdPPrs') throw new Error('Tento PDB je ve formátu eReader (Peanut Press), který je zašifrovaný. Otevřete ho v počítači v Calibre.');
    throw new Error(`Neznámý typ PDB souboru (${id.trim() || '?'}). Telefon umí PalmDoc a MOBI; ostatní převeďte na počítači.`);
  }
  const r0 = pdb.records[0];
  const dv = new DataView(r0.buffer, r0.byteOffset, r0.byteLength);
  const comp = dv.getUint16(0);
  const textLen = dv.getUint32(4);
  const count = dv.getUint16(8);
  if (dv.getUint16(12) !== 0) throw new Error('Kniha je chráněná DRM a nejde otevřít.');
  if (comp === 17480) throw new Error('Kniha je komprimovaná metodou HUFF/CDIC (typicky z obchodu Amazon). Telefon ji neotevře – převeďte ji na počítači.');
  const hlen = dv.getUint32(20);
  const encoding = dv.getUint32(28);
  const firstImage = dv.getUint32(16 + 92);
  const flags = hlen >= 0xe4 ? dv.getUint16(0xf2) : 0;
  const exthFlags = dv.getUint32(16 + 112);
  const meta: Record<number, Uint8Array[]> = {};
  if (exthFlags & 0x40) {
    const eo = 16 + hlen;
    if (String.fromCharCode(...r0.subarray(eo, eo + 4)) === 'EXTH') {
      const n = dv.getUint32(eo + 8);
      let p = eo + 12;
      for (let i = 0; i < n && p + 8 <= r0.length; i++) {
        const t = dv.getUint32(p);
        const l = dv.getUint32(p + 4);
        (meta[t] ??= []).push(r0.subarray(p + 8, p + l));
        p += l;
      }
    }
  }
  const dec = (b: Uint8Array) => (encoding === 65001 ? utf8Decode(b) : cp1252Decode(b));
  const fullName = dec(r0.subarray(dv.getUint32(16 + 68), dv.getUint32(16 + 68) + dv.getUint32(16 + 72)));
  const chunks: Uint8Array[] = [];
  for (let i = 1; i <= count && i < pdb.records.length; i++) {
    const r = pdb.records[i];
    const body = r.subarray(0, r.length - trailingSize(r, flags));
    chunks.push(comp === 2 ? decompressPalmDoc(body) : body);
  }
  const html = dec(concat(chunks).subarray(0, textLen));
  const book = emptyBook(meta[503] ? dec(meta[503][0]) : fullName || base);
  book.author = meta[100] ? meta[100].map(dec).join(', ') : '';
  if (meta[524]) book.language = dec(meta[524][0]).slice(0, 2).toLowerCase();
  book.source = fileName;
  const imageFor = (rec: number): string | null => {
    if (firstImage === 0xffffffff) return null;
    const idx = firstImage + rec - 1;
    const d = pdb.records[idx];
    const mime = d && sniffMime(d);
    if (!mime) return null;
    const name = `img${String(rec).padStart(5, '0')}.${mime.split('/')[1].replace('jpeg', 'jpg')}`;
    book.images[name] = { data: d, mime };
    return name;
  };
  if (meta[201] && firstImage !== 0xffffffff) {
    const off = new DataView(meta[201][0].buffer, meta[201][0].byteOffset, 4).getUint32(0);
    const n = imageFor(off + 1);
    if (n) book.cover = n;
  }
  const blocks = htmlToBlocks(html, { image: (_src, rec) => (rec ? imageFor(parseInt(rec, 10)) : null) });
  // obálka na začátku textu se nezobrazí dvakrát
  if (book.cover && blocks[0]?.type === 'img' && blocks[0].name === book.cover) blocks.shift();
  book.chapters = chaptersFromBlocks(blocks, book.title);
  return book;
}
