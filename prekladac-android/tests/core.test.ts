import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addImage, emptyBook, insertImage, type Book } from '../src/core/book';
import { cp1250Decode, decodeAny, fromBase64, toBase64, utf8Decode, utf8Encode } from '../src/core/bytes';
import { readBook, writeBook, bookPlainText } from '../src/core/formats';
import { compressPalmDoc, decompressPalmDoc, readPdb } from '../src/core/palmdoc';
import { pdfHtml } from '../src/core/pdf';
import { makeTranslator, translateBook, type Translator } from '../src/core/translate';
import { imageSize } from '../src/core/docx';

// malé „obrázky“ se správnou hlavičkou (rozměry 120×80)
function png(): Uint8Array {
  const d = new Uint8Array(40);
  d.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  new DataView(d.buffer).setUint32(16, 120);
  new DataView(d.buffer).setUint32(20, 80);
  return d;
}
function jpeg(): Uint8Array {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, 0, 80, 0, 120, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1, 0xff, 0xd9]);
}

const TEXTS = [
  ['Bouře zuřila nad mořem. Žluťoučký kůň úpěl ďábelské ódy.', 'Tomáš se díval z okna – „kde je děda?“'],
  ['Na půdě ležela stará mapa.'],
  ['Tajemství bylo odhaleno. Konec.'],
];

function sample(withImages = true): Book {
  const b = emptyBook('Strážce majáku');
  b.author = 'Jan Novák';
  b.chapters = TEXTS.map((ps, i) => ({ title: ['Bouře', 'Mapa', 'Návrat'][i], blocks: ps.map((text) => ({ type: 'p' as const, text })) }));
  if (withImages) {
    b.cover = addImage(b, jpeg());
    insertImage(b, 1, addImage(b, png()), 'end');
  }
  return b;
}

function texts(b: Book) {
  return b.chapters.map((c) => c.blocks.filter((x) => x.type === 'p').map((x) => (x as any).text));
}

test('utf8, cp1250, base64', () => {
  const s = 'Příliš žluťoučký kůň 😀 €';
  assert.equal(utf8Decode(utf8Encode(s)), s);
  assert.equal(cp1250Decode(Uint8Array.from([0xe8, 0xf8, 0xec, 0x9a, 0x9e, 0xf9])), 'čřěšžů');
  assert.equal(decodeAny(Uint8Array.from([0x9e, 0x6c, 0x75, 0x9d, 0x6f, 0x75, 0xe8, 0x6b, 0xfd])), 'žluťoučký');
  const bytes = Uint8Array.from({ length: 300 }, (_, i) => (i * 7) & 255);
  for (const n of [0, 1, 2, 3, 299, 300]) assert.deepEqual(fromBase64(toBase64(bytes.subarray(0, n))), bytes.subarray(0, n));
});

test('PalmDOC komprese tam a zpět', () => {
  const text = utf8Encode('Bouře zuřila nad mořem. '.repeat(150) + 'Konec \x01\x02 ÿ');
  const chunk = text.subarray(0, 4096);
  const c = compressPalmDoc(chunk);
  assert.ok(c.length < chunk.length / 2, 'opakovaný text se má zmenšit');
  assert.deepEqual(decompressPalmDoc(c), chunk);
  const rnd = Uint8Array.from({ length: 4096 }, (_, i) => (i * 2654435761) >>> 24);
  assert.deepEqual(decompressPalmDoc(compressPalmDoc(rnd)), rnd);
});

test('rozměry obrázků', () => {
  assert.deepEqual(imageSize(png()), { w: 120, h: 80 });
  assert.deepEqual(imageSize(jpeg()), { w: 120, h: 80 });
});

for (const fmt of ['epub', 'docx', 'mobi', 'kniha'] as const) {
  test(`${fmt}: zápis a zpětné čtení zachová kapitoly, text a obrázky`, async () => {
    const src = sample();
    const data = await writeBook(src, fmt);
    const name = fmt === 'kniha' ? 'kniha.kniha.json' : `kniha.${fmt}`;
    const back = await readBook(data, name);
    assert.equal(back.title, 'Strážce majáku');
    assert.equal(back.author, 'Jan Novák');
    assert.deepEqual(back.chapters.map((c) => c.title), ['Bouře', 'Mapa', 'Návrat']);
    assert.deepEqual(texts(back), TEXTS);
    assert.ok(back.cover && back.images[back.cover], 'obálka');
    assert.equal(back.images[back.cover!].mime, 'image/jpeg');
    const img = back.chapters[1].blocks.find((b) => b.type === 'img') as any;
    assert.ok(img && back.images[img.name]?.mime === 'image/png', 'obrázek v kapitole 2');
  });
}

test('MOBI: hlavička, obsah s odkazy (filepos) a záznamy obrázků', async () => {
  const data = await writeBook(sample(), 'mobi');
  const pdb = readPdb(data);
  assert.equal(pdb.type + pdb.creator, 'BOOKMOBI');
  const r0 = pdb.records[0];
  assert.equal(String.fromCharCode(...r0.subarray(16, 20)), 'MOBI');
  const dv = new DataView(r0.buffer, r0.byteOffset);
  const textRecs = dv.getUint16(8);
  const firstImage = dv.getUint32(16 + 92);
  assert.equal(firstImage, textRecs + 1);
  assert.deepEqual(pdb.records[firstImage], jpeg()); // obálka je první obrázek
  const html = utf8Decode(Uint8Array.from(pdb.records.slice(1, 1 + textRecs).flatMap((r) => [...decompressPalmDoc(r)])));
  for (const m of html.matchAll(/filepos=(\d{10})/g)) {
    const pos = parseInt(m[1], 10);
    const at = utf8Decode(utf8Encode(html).subarray(pos, pos + 4));
    assert.ok(at === '<h2>', `odkaz filepos ${pos} míří na nadpis, ne na „${at}“`);
  }
  assert.equal(String.fromCharCode(...pdb.records[pdb.records.length - 1]), '\xe9\x8e\r\n');
});

test('PDB (PalmDoc) a TXT: text a kapitoly', async () => {
  for (const fmt of ['pdb', 'txt'] as const) {
    const back = await readBook(await writeBook(sample(false), fmt), `kniha.${fmt}`);
    assert.deepEqual(back.chapters.map((c) => c.title), ['Bouře', 'Mapa', 'Návrat'], fmt);
    assert.deepEqual(texts(back), TEXTS, fmt);
  }
});

test('TXT ve starém kódování Windows a bez kapitol', async () => {
  const b = await readBook(Uint8Array.from([...'Moje kniha\n\nKapitola 1\n\n'].map((c) => c.charCodeAt(0)).concat([0x8e, 0x6c, 0x75, 0x9d, 0x6f, 0x75, 0xe8, 0x6b, 0xfd])), 'stara.txt');
  assert.equal(b.title, 'Moje kniha');
  assert.equal((b.chapters[0].blocks[0] as any).text, 'Žluťoučký');
  const one = await readBook(utf8Encode('Povídka\n\nPrvní.\n\nDruhý.\n'), 'p.txt');
  assert.equal(one.chapters.length, 1);
  assert.deepEqual(texts(one), [['První.', 'Druhý.']]);
});

test('projekt z desktopového Překladače (text i HTML z editoru)', async () => {
  const proj = {
    language: 'čeština', words: 1000, outline: { title: 'Kniha', chapters: [{ title: 'Jedna', summary: '' }, { title: 'Dva', summary: '' }] },
    chapters: [{ text: 'Ahoj.\n\n[[STRANA]]\n\nSvěte.', summary: '' }, { text: 'x', html: '<p>Odstavec <b>tučně</b>.</p><p><img src="obr.png" width="400"/></p>', summary: '' }],
    images: { 'obr.png': toBase64(png()) },
  };
  const b = await readBook(utf8Encode(JSON.stringify(proj)), 'k.kniha.json');
  assert.deepEqual(b.chapters[0].blocks.map((x) => x.type), ['p', 'pb', 'p']);
  assert.deepEqual(b.chapters[1].blocks, [{ type: 'p', text: 'Odstavec tučně.' }, { type: 'img', name: 'obr.png', width: 400 }]);
});

test('PDF HTML obsahuje obálku, obsah a obrázky jako data URI', () => {
  const h = pdfHtml(sample());
  assert.ok(h.includes('data:image/jpeg;base64,') && h.includes('data:image/png;base64,'));
  assert.ok(h.includes('<h2>Obsah</h2>') && h.includes('3. Návrat'));
});

test('překlad knihy: dávky, dlouhé odstavce, obrázky zůstanou', async () => {
  const calls: string[][] = [];
  const tr: Translator = {
    maxChars: 60,
    maxItems: 3,
    async translate(t) {
      calls.push(t);
      return t.map((x) => x.toUpperCase());
    },
  };
  const src = sample();
  src.chapters[2].blocks.push({ type: 'p', text: 'Velmi dlouhá věta číslo jedna. Druhá věta je tu také. Třetí věta končí knihu!' });
  const progress: number[] = [];
  const out = await translateBook(src, tr, 'en', (p) => progress.push(p.done / p.total));
  assert.equal(out.title, 'STRÁŽCE MAJÁKU');
  assert.equal(out.chapters[0].title, 'BOUŘE');
  assert.equal((out.chapters[2].blocks[1] as any).text, 'VELMI DLOUHÁ VĚTA ČÍSLO JEDNA. DRUHÁ VĚTA JE TU TAKÉ. TŘETÍ VĚTA KONČÍ KNIHU!');
  assert.ok(calls.every((c) => c.length <= 3 && c.join('').length <= 60 + 60));
  assert.equal(out.language, 'en');
  assert.equal(src.chapters[0].title, 'Bouře', 'původní kniha se nezmění');
  assert.ok(out.chapters[1].blocks.some((b) => b.type === 'img'));
  assert.equal(progress[progress.length - 1], 1);
});

test('Google (zdarma): požadavek a rozdělení odpovědi', async () => {
  let url = '';
  const fake = (async (u: string) => {
    url = u;
    const q = decodeURIComponent(/q=(.*)$/.exec(u)![1]);
    return new Response(JSON.stringify([[[q.replace(/a/g, 'A'), q]]]), { status: 200 });
  }) as unknown as typeof fetch;
  const tr = makeTranslator('google', 'de', {}, fake);
  assert.deepEqual(await tr.translate(['ahoj', 'mapa']), ['Ahoj', 'mApA']);
  assert.ok(url.includes('tl=de'));
  const bad = (async () => new Response('{"error":{"message":"bad key"}}', { status: 403 })) as unknown as typeof fetch;
  await assert.rejects(makeTranslator('deepl', 'cs', { deeplKey: 'x:fx' }, bad).translate(['a']), /klíč/);
});

test('prostý text knihy', () => {
  const t = bookPlainText(sample());
  assert.ok(t.startsWith('Strážce majáku\nJan Novák\n\n\n1. Bouře'));
  assert.ok(t.includes('[obrázek]'));
});

// ------------------------------------------------------------ skiny
import JSZip from 'jszip';
import { BUILTIN_SKINS, readSkinFile, SkinError, TOKENS } from '../src/core/skins';

test('vestavěné skiny mají všechny barvy', () => {
  assert.deepEqual(BUILTIN_SKINS.map((s) => s.id).slice(0, 4), ['default', 'dark', 'sepia', 'contrast']);
  for (const s of BUILTIN_SKINS) assert.deepEqual(Object.keys(s.colors).sort(), [...TOKENS].sort());
});

test('skin ze souboru .skin (stejný formát jako Windows)', async () => {
  const zip = new JSZip();
  zip.file('Les/skin.json', JSON.stringify({ name: 'Les', author: 'Já', base: 'dark', colors: { accent: '#22C55E', window: 'nesmysl' }, images: { logo: 'logo.png' } }));
  zip.file('Les/logo.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]));
  const skin = await readSkinFile(await zip.generateAsync({ type: 'uint8array' }), 'les.skin');
  assert.equal(skin.id, 'user:les');
  assert.equal(skin.colors.accent, '#22c55e');
  assert.equal(skin.colors.window, BUILTIN_SKINS[1].colors.window);
  assert.ok(skin.logo?.startsWith('data:image/png;base64,'));
  await assert.rejects(readSkinFile(new Uint8Array([1, 2, 3]), 'x.skin'), SkinError);
  const bad = new JSZip();
  bad.file('readme.txt', 'x');
  await assert.rejects(readSkinFile(await bad.generateAsync({ type: 'uint8array' }), 'x.skin'), /skin\.json/);
});

// ------------------------------------------------------------ offline v telefonu (ML Kit) – s náhradou modulu
import { setOfflineBackend } from '../src/core/translate';

test('offline překlad: pozná jazyk jednou, přeskočí stejný jazyk, srozumitelné chyby', async () => {
  const calls: string[] = [];
  setOfflineBackend({
    identifyLanguage: async (t) => (calls.push('id:' + t.slice(0, 5)), 'de'),
    translate: async (texts, src, dst, wifi) => (calls.push(`${src}>${dst}:${wifi}`), texts.map((t) => `[${t}]`)),
  });
  const tr = makeTranslator('offline', 'cs', {});
  assert.deepEqual(await tr.translate(['Hallo', 'Welt']), ['[Hallo]', '[Welt]']);
  assert.deepEqual(await tr.translate(['Buch']), ['[Buch]']);
  assert.deepEqual(calls, ['id:Hallo', 'de>cs:true', 'de>cs:true']);
  const same = makeTranslator('offline', 'de', { offlineWifiOnly: false });
  assert.deepEqual(await same.translate(['Hallo']), ['Hallo']);
  setOfflineBackend({ identifyLanguage: async () => 'und', translate: async () => { throw new Error('Waiting for wifi to download'); } });
  await assert.rejects(makeTranslator('offline', 'cs', {}).translate(['x']), /Wi-Fi/);
  setOfflineBackend(null);
  assert.throws(() => makeTranslator('offline', 'cs', {}), /Expo Go/);
});

// ------------------------------------------------------------ čtečka, knihovna, hledání
import { blockText, bookProgress, chapterHtml, DEFAULT_PREFS, parseReaderMessage, searchBook } from '../src/core/reader';
import { deserializeBook, fileNameFromUrl, serializeBook, sniffBookExt } from '../src/core/library';
import { gutendexUrl, parseGutendex, SOURCES } from '../src/core/sources';

test('čtečka: HTML kapitoly s odstavci, obálkou a ovládáním', () => {
  const book = emptyBook('Kniha <A&B>');
  book.chapters = [
    { title: 'První', blocks: [{ type: 'h', text: 'Úvod' }, { type: 'p', text: 'Ahoj <svět> & "lidi"' }, { type: 'pb' }] },
    { title: 'Druhá', blocks: [{ type: 'p', text: 'x'.repeat(300) }] },
  ];
  book.cover = addImage(book, new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1]), 'image/png');
  const html = chapterHtml(book, 0, { ...DEFAULT_PREFS, theme: 'night', size: 22 }, 0.5);
  assert.match(html, /<p data-i="1">Ahoj &lt;svět&gt; &amp; &quot;lidi&quot;<\/p>/);
  assert.match(html, /figure class="cover"/);
  assert.match(html, /font-size:22px/);
  assert.match(html, /readerGo\(0.5\)/);
  assert.doesNotMatch(chapterHtml(book, 1, DEFAULT_PREFS), /figure class="cover"/);
  assert.equal(blockText(book, 0, 1), 'Ahoj <svět> & "lidi"');
  assert.equal(blockText(null, 0, 1), '');
  assert.equal(bookProgress(book, 0, 0), 0);
  assert.equal(bookProgress(book, 1, 1), 1);
  assert.ok(bookProgress(book, 1, 0) > 0.1 && bookProgress(book, 1, 0) < 0.9);
  assert.deepEqual(parseReaderMessage('{"type":"para","i":3,"text":"x"}'), { type: 'para', i: 3, text: 'x' });
  assert.equal(parseReaderMessage('nesmysl'), null);
});

test('knihovna: uložení knihy beze ztrát a rozpoznání typu souboru', async () => {
  const book = emptyBook('Kniha');
  book.author = 'Autor';
  book.chapters = [{ title: 'K', blocks: [{ type: 'h', text: 'N', level: 2 }, { type: 'p', text: 'Text' }, { type: 'pb' }, { type: 'img', name: 'a.png' }] }];
  addImage(book, new Uint8Array([0x89, 0x50, 0x4e, 0x47, 9, 8]), 'image/png');
  const back = deserializeBook(serializeBook(book));
  assert.deepEqual(back.chapters, book.chapters);
  assert.deepEqual(Object.values(back.images)[0].data, Object.values(book.images)[0].data);
  assert.equal(sniffBookExt(await writeBook(book, 'epub')), 'epub');
  assert.equal(sniffBookExt(await writeBook(book, 'mobi')), 'mobi');
  assert.equal(sniffBookExt(await writeBook(book, 'docx')), 'docx');
  assert.equal(sniffBookExt(utf8Encode('%PDF-1.4')), 'pdf');
  assert.equal(sniffBookExt(utf8Encode('Obyčejný text')), 'txt');
  // soubor bez přípony (z jiné aplikace) se otevře podle obsahu
  const opened = await readBook(await writeBook(book, 'epub'), 'document:1234');
  assert.equal(opened.title, 'Kniha');
  assert.equal(fileNameFromUrl('https://x.cz/a/Kniha%20ukazka.epub?y=1'), 'Kniha ukazka.epub');
  assert.equal(fileNameFromUrl('https://www.gutenberg.org/ebooks/84', 'epub'), '84.epub');
});

test('hledání: Gutendex a odkazy na obchody a knihovny', () => {
  const r = parseGutendex({ next: null, results: [
    { id: 84, title: 'Frankenstein', authors: [{ name: 'Shelley, Mary Wollstonecraft' }], languages: ['en'], download_count: 5, formats: { 'application/epub+zip': 'https://www.gutenberg.org/ebooks/84.epub3.images', 'image/jpeg': 'https://x/84.jpg' } },
    { id: 1, title: 'Bez EPUB', authors: [], languages: ['en'], formats: { 'text/plain': 'x' } },
  ] });
  assert.equal(r.books.length, 1);
  assert.equal(r.books[0].authors, 'Mary Wollstonecraft Shelley');
  assert.equal(gutendexUrl('čapek r.u.r.', 'cs'), 'https://gutendex.com/books/?search=%C4%8Dapek%20r.u.r.&languages=cs');
  const ids = SOURCES.map((s) => s.id);
  for (const id of ['alza', 'amazon', 'gplay', 'kosmas', 'martinus', 'mkp', 'kjm', 'plzen', 'cbvk', 'smashwords']) assert.ok(ids.includes(id), id);
  for (const s of SOURCES) assert.match(s.url('Babička Němcová'), /^https:\/\/[^ ]+$/);
  assert.match(SOURCES.find((s) => s.id === 'kosmas')!.url('Babička'), /site%3Akosmas\.cz/);
});

// ------------------------------------------------------------ čtení PDF
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { readPdf } from '../src/core/pdfread';

function checkKniha(b: Book) {
  assert.deepEqual(b.chapters.map((c) => c.title.replace(/^Kapitola \d+\.\s*/, '')).length, 3);
  const paras = b.chapters.flatMap((c) => c.blocks).filter((x) => x.type === 'p') as { text: string }[];
  for (const p of paras) {
    assert.match(p.text, /^Odstavec \d\.\d+\. Příliš žluťoučký kůň úpěl ďábelské ódy/, p.text.slice(0, 80));
    assert.match(p.text, /Konec odstavce\.$/, p.text.slice(-80));
    assert.ok(!/Konec odstavce\. /.test(p.text), 'dva odstavce slepené');
    assert.ok(!/‐ |- [a-zá-ž]/.test(p.text), 'rozdělené slovo');
  }
  return paras.length;
}

test('PDF z LibreOffice, Qt (Překladač ve Windows) a Chromia (knižní sazba)', () => {
  const lo = readPdf(new Uint8Array(readFileSync('tests/fixtures/kniha-libreoffice.pdf')), 'kniha.pdf');
  assert.equal(checkKniha(lo), 24);
  const qt = readPdf(new Uint8Array(readFileSync('tests/fixtures/kniha-qt.pdf')), 'kniha.pdf');
  assert.equal(checkKniha(qt), 24); // Qt kreslí schovaný řádek z předchozí stránky – nesmí se zdvojit
  const ch = readPdf(new Uint8Array(readFileSync('tests/fixtures/kniha-chromium.pdf')), 'kniha.pdf');
  assert.equal(checkKniha(ch), 30); // odsazené odstavce bez mezer, záhlaví a čísla stránek, dělení slov
  assert.ok(!ch.chapters.some((c) => c.blocks.some((b) => b.type === 'p' && /Kůň a louka – román/.test(b.text))), 'záhlaví zůstalo');
  assert.equal(ch.chapters[0].title, 'Kapitola o koni číslo 1');
});

function makePdf(objects: string[], extra: Uint8Array[] = []): Uint8Array {
  // jednoduché PDF sestavené ručně (obj. 1 = katalog); extra = binární proudy vložené místo @@n@@
  let out = '%PDF-1.5\n';
  const parts: (string | Uint8Array)[] = [];
  objects.forEach((o, i) => {
    const m = /@@(\d+)@@/.exec(o);
    if (m) {
      const [a, b] = o.split(m[0]);
      parts.push(`${i + 1} 0 obj\n${a}`, extra[+m[1]], `${b}\nendobj\n`);
    } else parts.push(`${i + 1} 0 obj\n${o}\nendobj\n`);
  });
  parts.push('trailer\n<< /Root 1 0 R >>\n%%EOF\n');
  const chunks = [out, ...parts].map((p) => (typeof p === 'string' ? Uint8Array.from(p, (c) => c.charCodeAt(0) & 255) : p));
  const res = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
  let o = 0;
  for (const c of chunks) {
    res.set(c, o);
    o += c.length;
  }
  return res;
}

test('PDF: jednoduché písmo s WinAnsi a Differences, TJ s mezerami, objektový proud', () => {
  // „Žluťoučký kůň“ – ť, č, ů přes /Differences, ostatní WinAnsi (Ž = 0x8E, ý = 0xFD)
  const content = 'BT /F1 12 Tf 72 700 Td (\x8Elu\x01ou\x02k\xFD) Tj [() -300 (k) 0 (\x03\xF2)] TJ 0 -16 Td (Druh\xFD \xF8\xE1dek.) Tj ET';
  const s = Uint8Array.from(content, (c) => c.charCodeAt(0));
  const font = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding << /BaseEncoding /WinAnsiEncoding /Differences [1 /tcaron /ccaron 3 /uring 242 /ncaron 248 /rcaron] >> >>';
  const pdf = makePdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${s.length} >>\nstream\n@@0@@\nendstream`,
    font,
  ], [s]);
  const b = readPdf(pdf, 'test.pdf');
  const text = b.chapters.flatMap((c) => c.blocks).map((x: any) => x.text).join('\n');
  assert.match(text, /Žluťoučký kůň/);
  assert.match(text, /Druhý řádek\./);
  // stejné PDF s fontem a stránkou uvnitř komprimovaného objektového proudu (objekty 6 a 7)
  const page = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>';
  const objs = `6 0 7 ${page.length + 1} `;
  const stm = deflateSync(Buffer.from(objs + page + '\n' + font, 'latin1'));
  const cs = deflateSync(Buffer.from(s));
  const pdf2 = makePdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [6 0 R] /Count 1 >>',
    `<< /Type /ObjStm /N 2 /First ${objs.length} /Filter /FlateDecode /Length ${stm.length} >>\nstream\n@@0@@\nendstream`,
    `<< /Filter /FlateDecode /Length ${cs.length} >>\nstream\n@@1@@\nendstream`,
  ], [new Uint8Array(stm), new Uint8Array(cs)]);
  const b2 = readPdf(pdf2, 'test2.pdf');
  assert.match(b2.chapters.flatMap((c) => c.blocks).map((x: any) => x.text).join('\n'), /Žluťoučký kůň[\s\S]*Druhý řádek/);
});

test('PDF: zašifrované a sken bez textu dají srozumitelnou chybu', async () => {
  const enc = makePdf(['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [] /Count 0 >>']);
  const withEncrypt = Uint8Array.from([...enc.subarray(0, enc.length - 20), ...Uint8Array.from('trailer << /Root 1 0 R /Encrypt 9 0 R >>\n', (c) => c.charCodeAt(0))]);
  assert.throws(() => readPdf(withEncrypt, 'a.pdf'), /DRM/); // šifrování, které nejde přečíst (např. Adobe DRM)
  const scan = makePdf([
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>',
    '<< /Length 22 >>\nstream\nq 595 0 0 842 0 0 cm Q\nendstream',
  ]);
  assert.throws(() => readPdf(scan, 'sken.pdf'), /sken/);
  // readBook pozná PDF i bez přípony
  const b = await readBook(new Uint8Array(readFileSync('tests/fixtures/kniha-libreoffice.pdf')), 'stazeny-soubor');
  assert.equal(b.chapters.length, 3);
});

// ------------------------------------------------------------ našeptávač
import { addToHistory, mergeSuggestions, parseGoogleBooks, parseOpenLibrary, suggestionQuery } from '../src/core/sources';

test('našeptávač: historie, knihovna a katalog bez duplicit, bez ohledu na diakritiku', () => {
  const web = parseGoogleBooks({ items: [
    { volumeInfo: { title: 'Babička', authors: ['Božena Němcová'] } },
    { volumeInfo: { title: 'Babička ', authors: ['Božena Němcová'] } },
    { volumeInfo: { title: 'Babička a vnoučata', authors: [] } },
    { volumeInfo: {} },
  ] });
  assert.equal(web.length, 3);
  const local = [
    { title: 'babicka nemcova', author: '', from: 'history' as const },
    { title: 'Válka s mloky', author: 'Karel Čapek', from: 'history' as const },
    { title: 'Babička', author: 'Božena Němcová', from: 'library' as const },
  ];
  const s = mergeSuggestions('babič', local, web);
  assert.deepEqual(s.map((x) => `${x.from}:${x.title}`), ['history:babicka nemcova', 'library:Babička', 'web:Babička a vnoučata']);
  assert.equal(suggestionQuery(s[1]), 'Babička Němcová');
  assert.equal(suggestionQuery(s[0]), 'babicka nemcova');
  assert.deepEqual(parseOpenLibrary({ docs: [{ title: 'R.U.R.', author_name: ['Karel Čapek'] }] }), [{ title: 'R.U.R.', author: 'Karel Čapek', from: 'web' }]);
  let h = addToHistory(undefined, ' Čapek ');
  h = addToHistory(h, 'Hašek');
  h = addToHistory(h, 'čapek');
  assert.deepEqual(h, ['čapek', 'Hašek']);
  for (let i = 0; i < 30; i++) h = addToHistory(h, `kniha ${i}`);
  assert.equal(h.length, 15);
});

test('čtečka: hledání v knize bez ohledu na diakritiku, označené odstavce, skok na odstavec', () => {
  const book = emptyBook('K');
  book.chapters = [
    { title: 'Jedna', blocks: [{ type: 'p', text: 'Žluťoučký kůň úpěl.' }, { type: 'p', text: 'Nic.' }] },
    { title: 'Dvě', blocks: [{ type: 'h', text: 'Kůň' }, { type: 'p', text: 'Další KŮŇ a ještě jeden kun.' }] },
  ];
  const hits = searchBook(book, 'kun');
  assert.deepEqual(hits.map((h) => [h.chapter, h.i, h.match]), [[0, 0, 'kůň'], [1, 0, 'Kůň'], [1, 1, 'KŮŇ'], [1, 1, 'kun']]);
  assert.equal(hits[2].before, 'Další ');
  assert.deepEqual(searchBook(book, 'k'), []);
  const html = chapterHtml(book, 0, DEFAULT_PREFS, { block: 1 }, [{ i: 1, color: "g" }]);
  assert.match(html, /<p data-i="1" class="mk mk-g">Nic\.<\/p>/);
  assert.match(html, /readerGo\(\{"block":1\}\)/);
});

test('PDF chráněné jen proti tisku/kopírování (prázdné heslo) se otevře, s heslem ne', () => {
  for (const f of ['chranene-rc4.pdf', 'chranene-aes128.pdf', 'chranene-aes256.pdf']) {
    assert.equal(checkKniha(readPdf(new Uint8Array(readFileSync(`tests/fixtures/${f}`)), f)), 24, f);
  }
  assert.throws(() => readPdf(new Uint8Array(readFileSync('tests/fixtures/heslo.pdf')), 'heslo.pdf'), /heslem/);
});

test('šifrovací funkce odpovídají standardu', async () => {
  const { createHash, createCipheriv } = await import('node:crypto');
  const { md5, sha256, sha384, sha512, aesCbcDecrypt, aesCbcEncrypt } = await import('../src/core/crypto');
  const d = utf8Encode('Příliš žluťoučký kůň'.repeat(17));
  for (const [n, f] of [['md5', md5], ['sha256', sha256], ['sha384', sha384], ['sha512', sha512]] as const)
    assert.equal(Buffer.from(f(d)).toString('hex'), createHash(n).update(d).digest('hex'), n);
  const key = new Uint8Array(32).map((_, i) => i * 7), iv = new Uint8Array(16).map((_, i) => i);
  const c = createCipheriv('aes-256-cbc', key, iv);
  const enc = Buffer.concat([c.update(d), c.final()]);
  assert.deepEqual(Buffer.from(aesCbcDecrypt(key, iv, new Uint8Array(enc))), Buffer.from(d));
  const c2 = createCipheriv('aes-128-cbc', key.subarray(0, 16), iv);
  c2.setAutoPadding(false);
  const block = d.subarray(0, 64);
  assert.deepEqual(Buffer.from(aesCbcEncrypt(key.subarray(0, 16), iv, block)), Buffer.concat([c2.update(block), c2.final()]));
});

test('hledání: výsledky z katalogu Google Books (cena, ukázka, volné dílo ke stažení)', async () => {
  const { parseGoogleBooksFull, googleBooksUrl } = await import('../src/core/sources');
  const r = parseGoogleBooksFull({ items: [
    { id: 'a', volumeInfo: { title: 'Babička', authors: ['Božena Němcová'], language: 'cs', imageLinks: { thumbnail: 'http://books.google.com/x.jpg' }, description: '<p>Obrazy <b>venkovského</b> života</p>' },
      saleInfo: { saleability: 'FOR_SALE', retailPrice: { amount: 149, currencyCode: 'CZK' }, buyLink: 'https://play.google.com/store/books/details?id=a' },
      accessInfo: { publicDomain: false, viewability: 'PARTIAL', webReaderLink: 'http://play.google.com/books/reader?id=a' } },
    { id: 'b', volumeInfo: { title: 'Pride and Prejudice' }, saleInfo: { saleability: 'FREE' }, accessInfo: { publicDomain: true, viewability: 'ALL_PAGES', epub: { isAvailable: true, downloadLink: 'http://books.google.com/b.epub' } } },
    { id: 'c', volumeInfo: {} },
  ] });
  assert.equal(r.length, 2);
  assert.equal(r[0].price, '149 Kč');
  assert.equal(r[0].cover, 'https://books.google.com/x.jpg');
  assert.equal(r[0].description, 'Obrazy venkovského života');
  assert.equal(r[0].download, undefined);
  assert.match(r[0].preview!, /^https:/);
  assert.equal(r[1].price, 'zdarma');
  assert.equal(r[1].download, 'https://books.google.com/b.epub');
  assert.match(googleBooksUrl('babička', 'cs'), /langRestrict=cs/);
});

test('slovníček: bez duplicit, nejnovější nahoře, export', async () => {
  const { addVocab, vocabText } = await import('../src/core/library');
  let list = addVocab([], { word: 'Pferd', translation: 'kůň', sentence: 'Das Pferd läuft.', book: 'K', from: 'de', to: 'cs', at: 1 });
  list = addVocab(list, { word: 'Haus', translation: 'dům', sentence: '', book: 'K', from: 'de', to: 'cs', at: 2 });
  list = addVocab(list, { word: 'pferd', translation: 'kůň', sentence: 'Ein Pferd.', book: 'K', from: 'de', to: 'cs', at: 3 });
  assert.deepEqual(list.map((v) => v.word), ['pferd', 'Haus']);
  assert.equal(vocabText(list), 'pferd\tkůň\tEin Pferd.\nHaus\tdům\n');
});

test('PDF s heslem: bez hesla dotaz, špatné heslo, správné heslo uživatele i vlastníka', () => {
  const tries = (f: string, pw: string) => {
    try {
      return `ok${readPdf(new Uint8Array(readFileSync(`tests/fixtures/${f}`)), f, pw).chapters.length}`;
    } catch (e: any) {
      return e.needsPassword ? (e.wrong ? 'spatne' : 'chybi') : e.message;
    }
  };
  for (const f of ['heslo-aes256.pdf', 'heslo-rc4.pdf']) {
    assert.equal(tries(f, ''), 'chybi', f);
    assert.equal(tries(f, 'nevim'), 'spatne', f);
    assert.equal(tries(f, 'Žluťoučký kůň'), 'ok3', f); // heslo uživatele s diakritikou
    assert.equal(tries(f, 'majitel'), 'ok3', f); // heslo vlastníka
  }
  assert.equal(tries('heslo.pdf', 'tajne'), 'ok3');
});
