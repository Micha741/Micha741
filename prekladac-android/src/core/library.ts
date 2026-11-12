// Knihovna čtečky: kniha se uloží beze ztrát (bloky, obrázky), aby šel odstavec originálu
// spárovat s odstavcem překladu podle čísla kapitoly a odstavce.
import type { Book } from './book';
import { fromBase64, toBase64, utf8Decode, utf8Encode } from './bytes';

export interface Bookmark {
  chapter: number;
  fraction: number;
  label: string;
  at: number;
}

export interface LibraryEntry {
  id: string;
  title: string;
  author: string;
  language: string;
  added: number;
  lastRead: number;
  chapter: number;
  fraction: number; // místo v kapitole 0–1
  progress: number; // celé knihy 0–1
  bookmarks: Bookmark[];
  /** id knihy, ze které vznikl tento překlad (pro „originál“ u odstavce) */
  originalId?: string;
  /** malá obálka jako data URI */
  cover?: string;
  source?: string;
}

export function newEntry(book: Book, id: string, originalId?: string): LibraryEntry {
  const now = Date.now();
  return {
    id, title: book.title || 'Kniha', author: book.author || '', language: book.language || '', added: now, lastRead: now,
    chapter: 0, fraction: 0, progress: 0, bookmarks: [], originalId, source: book.source,
  };
}

export function serializeBook(book: Book): Uint8Array {
  const images: Record<string, { mime: string; b64: string }> = {};
  for (const [n, im] of Object.entries(book.images)) images[n] = { mime: im.mime, b64: toBase64(im.data) };
  return utf8Encode(JSON.stringify({ v: 1, title: book.title, author: book.author, language: book.language, chapters: book.chapters, cover: book.cover, source: book.source, images }));
}

export function deserializeBook(data: Uint8Array): Book {
  const j = JSON.parse(utf8Decode(data));
  if (j?.v !== 1 || !Array.isArray(j.chapters)) throw new Error('Kniha v knihovně je poškozená.');
  const images: Book['images'] = {};
  for (const [n, im] of Object.entries(j.images ?? {}) as [string, { mime: string; b64: string }][]) images[n] = { mime: im.mime, data: fromBase64(im.b64) };
  return { title: j.title, author: j.author ?? '', language: j.language ?? '', chapters: j.chapters, cover: j.cover, source: j.source, images };
}

/** Typ souboru podle obsahu (soubor otevřený z jiné aplikace nemusí mít příponu). */
export function sniffBookExt(d: Uint8Array): string {
  const head = String.fromCharCode(...d.subarray(0, Math.min(d.length, 120)));
  if (head.startsWith('%PDF')) return 'pdf';
  if (d[0] === 0x50 && d[1] === 0x4b) {
    if (/mimetypeapplication\/epub\+zip/.test(head)) return 'epub';
    const s = String.fromCharCode(...d.subarray(0, Math.min(d.length, 4000)));
    if (s.includes('word/')) return 'docx';
    if (s.includes('META-INF/container.xml') || s.includes('.opf')) return 'epub';
    return 'epub';
  }
  const type = String.fromCharCode(...d.subarray(60, 68));
  if (type === 'BOOKMOBI') return 'mobi';
  if (type === 'TEXtREAd') return 'pdb';
  const t = head.trimStart();
  if (t.startsWith('{')) return 'json';
  if (/^<(!doctype html|html)/i.test(t)) return 'html';
  return 'txt';
}

/** Jméno souboru z odkazu (https://…/kniha.epub?x=1 → kniha.epub). */
export function fileNameFromUrl(url: string, fallbackExt = ''): string {
  let name = '';
  try {
    name = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
  } catch {
    name = '';
  }
  if (!name || !name.includes('.')) name = (name || 'kniha') + (fallbackExt ? '.' + fallbackExt : '');
  return name;
}
