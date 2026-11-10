// Kniha v paměti: kapitoly s odstavci, nadpisy, obrázky a zalomením stránek.
// Stejná data jde uložit jako *.kniha.json (projekt z desktopového Překladače).
import { escapeXml, fromBase64, toBase64 } from './bytes';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string; level?: number }
  | { type: 'img'; name: string; width?: number }
  | { type: 'pb' };

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
