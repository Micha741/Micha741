// Kniha v paměti: kapitoly s odstavci, nadpisy, obrázky a zalomením stránek.
// Stejná data jde uložit jako *.kniha.json (projekt z desktopového Překladače).
import { escapeXml, fromBase64, toBase64 } from './bytes';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string; level?: number }
  | { type: 'img'; name: string; width?: number }
  | { type: 'pb'; auto?: boolean }; // auto = zalomení přidané kvůli obrázku přes celou stránku

export interface Chapter {
  title: string;
  blocks: Block[];
}

export interface BookImage {
  data: Uint8Array;
  mime: string; // image/jpeg, image/png, image/gif
}

export interface Book {
  title: string;
  author: string;
  language: string; // kód jazyka, např. "cs"
  chapters: Chapter[];
  images: Record<string, BookImage>;
  cover?: string; // název obrázku obálky v images
  source?: string; // původní název souboru
}

export function emptyBook(title = 'Kniha'): Book {
  return { title, author: '', language: 'cs', chapters: [], images: {} };
}

export function mimeFromName(name: string): string {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'bmp') return 'image/bmp';
  return 'image/jpeg';
}

export function extFromMime(mime: string): string {
  return { 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/bmp': 'bmp' }[mime] ?? 'jpg';
}

/** Rozpozná typ obrázku podle prvních bajtů. */
export function sniffMime(d: Uint8Array): string | null {
  if (d[0] === 0xff && d[1] === 0xd8) return 'image/jpeg';
  if (d[0] === 0x89 && d[1] === 0x50 && d[2] === 0x4e && d[3] === 0x47) return 'image/png';
  if (d[0] === 0x47 && d[1] === 0x49 && d[2] === 0x46) return 'image/gif';
  if (d[0] === 0x42 && d[1] === 0x4d) return 'image/bmp';
  if (d[0] === 0x52 && d[1] === 0x49 && d[8] === 0x57 && d[9] === 0x45) return 'image/webp';
  return null;
}

let counter = 0;
export function addImage(book: Book, data: Uint8Array, mime?: string): string {
  const m = mime || sniffMime(data) || 'image/jpeg';
  let name: string;
  do {
    counter++;
    name = `obr_${Date.now().toString(36)}${counter}.${extFromMime(m)}`;
  } while (book.images[name]);
  book.images[name] = { data, mime: m };
  return name;
}

/** Vloží obrázek do kapitoly (na začátek, na konec, nebo za odstavec s indexem). */
export function insertImage(book: Book, chapter: number, name: string, where: 'start' | 'end' | number = 'end') {
  const ch = book.chapters[chapter];
  if (!ch) throw new Error('Kapitola neexistuje.');
  const block: Block = { type: 'img', name };
  if (where === 'start') ch.blocks.unshift(block);
  else if (where === 'end') ch.blocks.push(block);
  else ch.blocks.splice(Math.max(0, Math.min(ch.blocks.length, where + 1)), 0, block);
}

// ------------------------------------------------------------ práce s obrázky v knize
export type ImgSize = 'small' | 'medium' | 'large' | 'page';
export const IMG_SIZES: Record<ImgSize, { label: string; width: number }> = {
  small: { label: 'malý', width: 280 },
  medium: { label: 'střední', width: 440 },
  large: { label: 'velký', width: 680 },
  page: { label: 'celá stránka', width: 800 },
};

/** Velikost obrázku na pozici idx (podle šířky a zalomení stránky kolem). */
export function imageSizeAt(ch: Chapter, idx: number): ImgSize {
  const b = ch.blocks[idx];
  if (!b || b.type !== 'img') return 'large';
  const prev = ch.blocks[idx - 1], next = ch.blocks[idx + 1];
  if ((b.width ?? 0) >= 800 && prev?.type === 'pb' && next?.type === 'pb') return 'page';
  const w = b.width ?? 640;
  return w <= 300 ? 'small' : w <= 500 ? 'medium' : 'large';
}

/** Změní velikost obrázku; „celá stránka“ = obrázek sám na stránce (zalomení před a za). Vrátí nový index obrázku. */
export function setImageSize(book: Book, chapter: number, idx: number, size: ImgSize): number {
  const ch = book.chapters[chapter];
  const b = ch?.blocks[idx];
  if (!b || b.type !== 'img') return idx;
  b.width = IMG_SIZES[size].width;
  if (size === 'page') {
    if (ch.blocks[idx + 1]?.type !== 'pb') ch.blocks.splice(idx + 1, 0, { type: 'pb', auto: true });
    if (idx > 0 && ch.blocks[idx - 1]?.type !== 'pb') {
      ch.blocks.splice(idx, 0, { type: 'pb', auto: true });
      idx++;
    }
  } else {
    const next = ch.blocks[idx + 1];
    if (next?.type === 'pb' && next.auto) ch.blocks.splice(idx + 1, 1);
    const prev = ch.blocks[idx - 1];
    if (prev?.type === 'pb' && prev.auto) {
      ch.blocks.splice(idx - 1, 1);
      idx--;
    }
  }
  return idx;
}

/** Odebere obrázek z kapitoly (i zalomení stránky přidaná kvůli němu). */
export function removeImageAt(book: Book, chapter: number, idx: number) {
  setImageSize(book, chapter, idx, 'large');
  const ch = book.chapters[chapter];
  const i = ch.blocks.findIndex((b, k) => k >= Math.max(0, idx - 1) && b.type === 'img');
  if (i >= 0) ch.blocks.splice(i, 1);
  pruneImages(book);
}

/** Všechny obrázky v kapitolách (pro seznam „Obrázky v knize“). */
export function listImages(book: Book): { chapter: number; idx: number; name: string; size: ImgSize }[] {
  const out: { chapter: number; idx: number; name: string; size: ImgSize }[] = [];
  book.chapters.forEach((ch, ci) => ch.blocks.forEach((b, i) => {
    if (b.type === 'img' && book.images[b.name]) out.push({ chapter: ci, idx: i, name: b.name, size: imageSizeAt(ch, i) });
  }));
  return out;
}

/** Obálka bez obrázku: jen název a autor (SVG – použije se v EPUB, PDF a ve čtečce). */
export function textCoverSvg(title: string, author: string): string {
  const words = (title || 'Kniha').split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > 16 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, 6);
  const size = shown.length > 4 ? 48 : 60;
  const top = 380 - (shown.length - 1) * size * 0.6;
  const t = shown.map((l, i) => `<text x="300" y="${Math.round(top + i * size * 1.2)}" font-size="${size}">${escapeXml(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a55"/><stop offset="1" stop-color="#14203a"/></linearGradient></defs>` +
    `<rect width="600" height="900" fill="url(#g)"/><rect x="36" y="36" width="528" height="828" fill="none" stroke="#c9a96e" stroke-width="3"/>` +
    `<g fill="#f5ecd9" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" text-anchor="middle">${t}</g>` +
    `<line x1="220" y1="${Math.round(top + shown.length * size * 1.2)}" x2="380" y2="${Math.round(top + shown.length * size * 1.2)}" stroke="#c9a96e" stroke-width="2"/>` +
    (author ? `<text x="300" y="760" fill="#e6d7b8" font-family="Georgia, serif" font-size="30" text-anchor="middle">${escapeXml(author)}</text>` : '') +
    `</svg>`;
}

export function chapterText(ch: Chapter): string {
  return ch.blocks.filter((b) => b.type === 'p' || b.type === 'h').map((b) => (b as { text: string }).text).join('\n\n');
}

export function bookStats(book: Book) {
  let words = 0;
  for (const ch of book.chapters) for (const b of ch.blocks) if (b.type === 'p' || b.type === 'h') words += b.text.split(/\s+/).filter(Boolean).length;
  return { chapters: book.chapters.length, words, images: Object.keys(book.images).length };
}

/** Odstraní obrázky, které už v knize nikde nejsou. */
export function pruneImages(book: Book) {
  const used = new Set<string>();
  for (const ch of book.chapters) for (const b of ch.blocks) if (b.type === 'img') used.add(b.name);
  if (book.cover) used.add(book.cover);
  for (const n of Object.keys(book.images)) if (!used.has(n)) delete book.images[n];
}

// ------------------------------------------------------------ *.kniha.json (projekt z desktopu)
const LANG_NAMES: Record<string, string> = {
  cs: 'čeština', sk: 'slovenčina', en: 'angličtina', de: 'němčina', pl: 'polština', fr: 'francouzština',
  es: 'španělština', it: 'italština', ru: 'ruština', uk: 'ukrajinština', hu: 'maďarština',
};

function blocksToHtml(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'p') return `<p>${escapeXml(b.text).replace(/\n/g, '<br />')}</p>`;
      if (b.type === 'h') return `<h${b.level ?? 2}>${escapeXml(b.text)}</h${b.level ?? 2}>`;
      if (b.type === 'img') return `<p><img src="${escapeXml(b.name)}"${b.width ? ` width="${b.width}"` : ''} /></p>`;
      return '<p> </p>';
    })
    .join('');
}

export function toProject(book: Book): Record<string, unknown> {
  const images: Record<string, string> = {};
  for (const [n, im] of Object.entries(book.images)) images[n] = toBase64(im.data);
  const texts = book.chapters.map(chapterText);
  const avg = texts.length ? Math.max(300, Math.round(texts.reduce((a, t) => a + t.split(/\s+/).length, 0) / texts.length)) : 2500;
  const proj: Record<string, unknown> = {
    language: LANG_NAMES[book.language] ?? book.language,
    description: '',
    style: '',
    words: avg,
    author: book.author || undefined,
    outline: {
      title: book.title,
      synopsis: '',
      characters: [],
      chapters: book.chapters.map((c) => ({ title: c.title, summary: '' })),
    },
    chapters: book.chapters.map((c, i) => {
      const hasImg = c.blocks.some((b) => b.type === 'img');
      return hasImg ? { text: texts[i], html: blocksToHtml(c.blocks), summary: '' } : { text: texts[i], summary: '' };
    }),
    images,
    imported_from: book.source,
  };
  if (book.cover) proj.cover = book.cover;
  return proj;
}

export function langCode(name: string): string {
  const n = (name || '').toLowerCase();
  for (const [code, label] of Object.entries(LANG_NAMES)) if (n === code || n.startsWith(label.slice(0, 4))) return code;
  return n.length === 2 ? n : 'cs';
}

export function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export function fromProject(proj: any, htmlToBlocks: (html: string) => Block[]): Book {
  if (!proj || !proj.outline || !Array.isArray(proj.chapters)) throw new Error('Soubor není projekt knihy z Překladače.');
  const book = emptyBook(proj.outline.title || 'Kniha');
  book.author = proj.author || '';
  book.language = langCode(proj.language || 'cs');
  for (const [n, b64] of Object.entries((proj.images || {}) as Record<string, string>)) {
    const data = fromBase64(b64);
    book.images[n] = { data, mime: sniffMime(data) || mimeFromName(n) };
  }
  if (proj.cover && book.images[proj.cover]) book.cover = proj.cover;
  proj.chapters.forEach((ch: any, i: number) => {
    const title = proj.outline.chapters?.[i]?.title || `Kapitola ${i + 1}`;
    const blocks: Block[] = ch.html
      ? htmlToBlocks(ch.html)
      : splitParagraphs(ch.text || '').map((t) => (t === '[[STRANA]]' ? { type: 'pb' } : { type: 'p', text: t }) as Block);
    book.chapters.push({ title, blocks });
  });
  return book;
}
