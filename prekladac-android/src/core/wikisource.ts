// Kniha z Wikizdrojů: hlavní stránka a její kapitoly (podstránky „Název/…“) v pořadí podle obsahu – jako ve Windows.
import { emptyBook, type Book } from './book';
import { htmlToBlocks } from './html';
import { WIKISOURCE_PREFIX, wikisourceChapterOrder, wikisourceClean, wikisourceParseUrl } from './sources';

export type GetJson = (url: string) => Promise<any>;

/** „wikisource:cs:Babička“ → { lang: 'cs', title: 'Babička' } */
export function parseWikisourceLink(link: string): { lang: string; title: string } | null {
  if (!link.startsWith(WIKISOURCE_PREFIX)) return null;
  const rest = link.slice(WIKISOURCE_PREFIX.length);
  const i = rest.indexOf(':');
  return i > 0 ? { lang: rest.slice(0, i), title: rest.slice(i + 1) } : null;
}

async function parsePage(get: GetJson, lang: string, page: string) {
  const j = await get(wikisourceParseUrl(lang, page));
  if (j?.error) throw new Error(`Wikizdroje: ${j.error.info ?? 'stránka nenalezena'}`);
  return (j?.parse ?? {}) as { title?: string; text?: string; links?: { ns?: number; title?: string; exists?: boolean }[] };
}

export async function wikisourceBook(get: GetJson, lang: string, title: string, maxChapters = 150): Promise<Book> {
  const main = await parsePage(get, lang, title);
  const real = main.title || title;
  const book = emptyBook(real);
  book.language = lang;
  book.source = `${real}.epub`;
  const subs = wikisourceChapterOrder(real, main).slice(0, maxChapters);
  const blocksOf = (html?: string) => htmlToBlocks(wikisourceClean(html ?? '')).filter((b) => b.type !== 'img');
  if (subs.length) {
    // kapitoly po čtyřech souběžně, pořadí zůstává podle obsahu
    const parts: Awaited<ReturnType<typeof parsePage>>[] = [];
    for (let i = 0; i < subs.length; i += 4) parts.push(...(await Promise.all(subs.slice(i, i + 4).map((t) => parsePage(get, lang, t)))));
    subs.forEach((t, k) => {
      const blocks = blocksOf(parts[k]?.text);
      if (blocks.some((b) => b.type === 'p')) book.chapters.push({ title: t.slice(real.length + 1).replace(/_/g, ' '), blocks });
    });
  } else {
    const blocks = blocksOf(main.text);
    if (blocks.some((b) => b.type === 'p')) book.chapters.push({ title: real, blocks });
  }
  if (!book.chapters.length) throw new Error('Stránka na Wikizdrojích neobsahuje text knihy.');
  return book;
}
