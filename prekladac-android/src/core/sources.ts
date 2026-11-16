// Vyhledávání knih: Project Gutenberg přímo v aplikaci (veřejné rozhraní Gutendex),
// ostatní obchody a knihovny otevřením jejich vyhledávání v prohlížeči.

export type SourceKind = 'free' | 'social' | 'drm' | 'library';

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  note: string;
  url: (q: string) => string;
}

const enc = encodeURIComponent;
/** Vyhledávání na webu, který nemá stabilní adresu hledání – přes Google omezené na ten web. */
const site = (domain: string, extra = '') => (q: string) => `https://www.google.com/search?q=${enc(`${q} ${extra} site:${domain}`.replace(/\s+/g, ' ').trim())}`;

export const KIND_LABEL: Record<SourceKind, string> = {
  free: 'zdarma, otevře se v aplikaci',
  social: 'koupě, většinou bez šifrování – otevře se v aplikaci',
  drm: 'zašifrované (DRM) – jen v jejich aplikaci',
  library: 'knihovna – katalog a výpůjčky',
};

export const SOURCES: Source[] = [
  { id: 'mkp', name: 'Městská knihovna v Praze – e-knihy zdarma', kind: 'free', note: 'Česká klasika volně ke stažení (EPUB, MOBI, PDF).', url: site('mlp.cz', 'e-kniha') },
  { id: 'wikisource', name: 'Wikizdroje', kind: 'free', note: 'Volná díla v češtině.', url: (q) => `https://cs.wikisource.org/w/index.php?search=${enc(q)}` },
  { id: 'standard', name: 'Standard Ebooks', kind: 'free', note: 'Pečlivě upravená volná díla v angličtině.', url: (q) => `https://standardebooks.org/ebooks?query=${enc(q)}` },
  { id: 'gutenberg-web', name: 'Project Gutenberg (web)', kind: 'free', note: 'Volná díla; výsledky jsou i přímo nahoře.', url: (q) => `https://www.gutenberg.org/ebooks/search/?query=${enc(q)}` },
  { id: 'archive', name: 'Internet Archive', kind: 'free', note: 'Volná díla ke stažení; některé knihy jen k zapůjčení.', url: (q) => `https://archive.org/search?query=${enc(q)}` },
  { id: 'openlibrary', name: 'Open Library', kind: 'free', note: 'Katalog a volná díla; výpůjčky jsou šifrované.', url: (q) => `https://openlibrary.org/search?q=${enc(q)}` },
  { id: 'palmknihy', name: 'Palmknihy', kind: 'social', note: 'Ukázky zdarma. U knihy hledejte „sociální DRM“.', url: site('palmknihy.cz') },
  { id: 'kosmas', name: 'Kosmas', kind: 'social', note: 'Ukázky zdarma. Pozor na knihy s Adobe DRM (.acsm).', url: site('kosmas.cz', 'e-kniha') },
  { id: 'martinus', name: 'Martinus', kind: 'social', note: 'E-knihy většinou se sociálním DRM.', url: (q) => `https://www.martinus.cz/search?q=${enc(q)}` },
  { id: 'alza', name: 'Alza', kind: 'social', note: 'E-knihy většinou se sociálním DRM (vodoznak).', url: (q) => `https://www.alza.cz/search.htm?exps=${enc(q + ' e-kniha')}` },
  { id: 'smashwords', name: 'Smashwords', kind: 'social', note: 'Nezávislí autoři, knihy bez šifrování, část zdarma.', url: (q) => `https://www.smashwords.com/books/search?query=${enc(q)}` },
  { id: 'amazon', name: 'Amazon Kindle', kind: 'drm', note: 'Jen v aplikaci Kindle; v Překladači nepůjde otevřít.', url: (q) => `https://www.amazon.com/s?k=${enc(q)}&i=digital-text` },
  { id: 'gplay', name: 'Google Play Knihy', kind: 'drm', note: 'Většinou jen v aplikaci Google Play Knihy.', url: (q) => `https://play.google.com/store/search?q=${enc(q)}&c=books` },
  { id: 'mkp-katalog', name: 'Městská knihovna v Praze', kind: 'library', note: 'Katalog, e-výpůjčky v jejich aplikaci.', url: site('mlp.cz') },
  { id: 'kjm', name: 'Knihovna Jiřího Mahena v Brně', kind: 'library', note: 'Katalog a e-výpůjčky.', url: site('kjm.cz') },
  { id: 'mzk', name: 'Moravská zemská knihovna (Brno)', kind: 'library', note: 'Katalog; digitalizované staré knihy.', url: site('mzk.cz') },
  { id: 'plzen', name: 'Knihovna města Plzně', kind: 'library', note: 'Katalog a e-výpůjčky.', url: site('knihovna.plzen.eu') },
  { id: 'cbvk', name: 'Jihočeská vědecká knihovna (České Budějovice)', kind: 'library', note: 'Katalog a e-výpůjčky.', url: site('cbvk.cz') },
];

export interface FoundBook {
  id: number;
  title: string;
  authors: string;
  languages: string[];
  epub?: string;
  cover?: string;
  downloads: number;
}

/** Odpověď Gutendex (https://gutendex.com/books/?search=…) → seznam knih. */
export function parseGutendex(j: any): { books: FoundBook[]; next: string | null } {
  const books: FoundBook[] = (j?.results ?? []).map((r: any) => {
    const f = r.formats ?? {};
    const epub = f['application/epub+zip'] as string | undefined;
    return {
      id: r.id,
      title: String(r.title ?? ''),
      authors: (r.authors ?? []).map((a: any) => String(a.name ?? '').split(', ').reverse().join(' ')).join(', '),
      languages: r.languages ?? [],
      epub,
      cover: f['image/jpeg'],
      downloads: r.download_count ?? 0,
    };
  });
  return { books: books.filter((b) => b.epub), next: j?.next ?? null };
}

export function gutendexUrl(q: string, lang?: string): string {
  return `https://gutendex.com/books/?search=${enc(q)}${lang ? `&languages=${enc(lang)}` : ''}`;
}

// ------------------------------------------------------------ našeptávač při psaní
export interface Suggestion {
  title: string;
  author: string;
  /** odkud návrh je: dřívější hledání, kniha v knihovně, nebo katalog na internetu */
  from: 'history' | 'library' | 'web';
}

export function googleBooksSuggestUrl(q: string, lang?: string): string {
  return `https://www.googleapis.com/books/v1/volumes?q=${enc(q)}&maxResults=10&printType=books&fields=items(volumeInfo(title,authors))${lang ? `&langRestrict=${enc(lang)}` : ''}`;
}

export function openLibrarySuggestUrl(q: string): string {
  return `https://openlibrary.org/search.json?q=${enc(q)}&limit=10&fields=title,author_name`;
}

export function parseGoogleBooks(j: any): Suggestion[] {
  return (j?.items ?? []).map((it: any) => ({ title: String(it?.volumeInfo?.title ?? ''), author: (it?.volumeInfo?.authors ?? []).join(', '), from: 'web' as const })).filter((s: Suggestion) => s.title);
}

export function parseOpenLibrary(j: any): Suggestion[] {
  return (j?.docs ?? []).map((d: any) => ({ title: String(d?.title ?? ''), author: (d?.author_name ?? []).slice(0, 2).join(', '), from: 'web' as const })).filter((s: Suggestion) => s.title);
}

const PLAIN: Record<string, string> = { á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ó: 'o', ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z', ä: 'a', ö: 'o', ü: 'u', ľ: 'l', ĺ: 'l', ô: 'o', ŕ: 'r', ß: 'ss' };
const fold = (s: string) => {
  const low = s.toLowerCase();
  try {
    return low.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    return low.replace(/[^\x00-\x7f]/g, (c) => PLAIN[c] ?? c);
  }
};
const keyOf = (t: string) => fold(t).replace(/[^a-z0-9]+/g, ' ').trim();

/** Spojí návrhy (nejdřív historie a knihovna, které odpovídají psanému textu), bez duplicit, nejvýš `max`. */
export function mergeSuggestions(q: string, local: Suggestion[], web: Suggestion[], max = 8): Suggestion[] {
  const f = fold(q.trim());
  const words = f.split(/\s+/).filter(Boolean);
  const matches = (s: Suggestion) => {
    const t = fold(`${s.title} ${s.author}`);
    return words.every((w) => t.includes(w));
  };
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const s of [...local.filter(matches), ...web]) {
    const key = `${keyOf(s.title)}|${keyOf(s.author)}`;
    if (!s.title.trim() || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...s, title: s.title.trim(), author: s.author.trim() });
    if (out.length >= max) break;
  }
  return out;
}

/** Text do vyhledávání po klepnutí na návrh. */
export function suggestionQuery(s: Suggestion): string {
  const surname = s.author.split(',')[0].trim().split(/\s+/).pop() ?? '';
  return s.from === 'history' || !surname ? s.title : `${s.title} ${surname}`;
}

/** Historie hledání: nejnovější první, bez duplicit, nejvýš 15. */
export function addToHistory(history: string[] | undefined, q: string): string[] {
  const t = q.trim();
  if (!t) return history ?? [];
  return [t, ...(history ?? []).filter((h) => fold(h) !== fold(t))].slice(0, 15);
}

// ------------------------------------------------------------ výsledky z katalogu Google Books (přímo v aplikaci)
export interface StoreBook {
  id: string;
  title: string;
  authors: string;
  description: string;
  language: string;
  cover?: string;
  /** cena jako text, např. „249 Kč“; „zdarma“ u volných děl */
  price?: string;
  /** odkaz na stažení volného díla (EPUB/PDF) */
  download?: string;
  /** ukázka / čtení na webu */
  preview?: string;
  buy?: string;
  /** odkud výsledek je (Google Books, Open Library, Wikizdroje…) */
  store?: string;
  /** free = otevře se v aplikaci, drm = zašifrované (jen v aplikaci obchodu / výpůjčka), none = nedostupné jako e-kniha */
  drm?: 'free' | 'drm' | 'none';
}

/** Štítek „Otevře Překladač“ jako ve Windows. */
export function opensLabel(b: StoreBook): string {
  return b.download ? '✓ otevře Překladač' : b.drm === 'drm' ? '🔒 DRM – jen v aplikaci obchodu' : 'jen katalog';
}

export function googleBooksUrl(q: string, lang?: string): string {
  const fields = 'items(id,volumeInfo(title,subtitle,authors,description,language,imageLinks/thumbnail,previewLink,infoLink),saleInfo(saleability,listPrice,retailPrice,buyLink),accessInfo(publicDomain,webReaderLink,viewability,epub(isAvailable,downloadLink),pdf(isAvailable,downloadLink)))';
  return `https://www.googleapis.com/books/v1/volumes?q=${enc(q)}&maxResults=20&printType=books&fields=${enc(fields)}${lang ? `&langRestrict=${enc(lang)}` : ''}`;
}

const https = (u?: string) => (u ? u.replace(/^http:\/\//, 'https://') : undefined);

export function parseGoogleBooksFull(j: any): StoreBook[] {
  return (j?.items ?? []).map((it: any) => {
    const v = it.volumeInfo ?? {}, sale = it.saleInfo ?? {}, acc = it.accessInfo ?? {};
    const p = sale.retailPrice ?? sale.listPrice;
    const free = acc.publicDomain || sale.saleability === 'FREE';
    const price = free ? 'zdarma' : p?.amount != null ? `${Math.round(p.amount * 100) / 100} ${p.currencyCode === 'CZK' ? 'Kč' : p.currencyCode ?? ''}`.trim() : undefined;
    const download = acc.publicDomain ? https(acc.epub?.downloadLink) ?? https(acc.pdf?.downloadLink) : undefined;
    return {
      id: String(it.id ?? ''),
      title: [v.title, v.subtitle].filter(Boolean).join(': '),
      authors: (v.authors ?? []).join(', '),
      description: String(v.description ?? '').replace(/<[^>]+>/g, '').slice(0, 400),
      language: v.language ?? '',
      cover: https(v.imageLinks?.thumbnail),
      price,
      download,
      preview: acc.viewability && acc.viewability !== 'NO_PAGES' ? https(acc.webReaderLink ?? v.previewLink) : undefined,
      buy: https(sale.buyLink),
      store: 'Google Books',
      drm: download ? 'free' : sale.buyLink ? 'drm' : 'none',
    } as StoreBook;
  }).filter((b: StoreBook) => b.title);
}

// ------------------------------------------------------------ Open Library / Internet Archive (přímo v aplikaci)
export function openLibraryUrl(q: string, lang?: string): string {
  return `https://openlibrary.org/search.json?q=${enc(q)}&limit=20&fields=key,title,author_name,language,cover_i,ebook_access,ia,first_publish_year` +
    (lang ? `&language=${enc({ cs: 'cze', en: 'eng', de: 'ger', fr: 'fre', sk: 'slo' }[lang] ?? lang)}` : '');
}

export function parseOpenLibraryFull(j: any): StoreBook[] {
  return (j?.docs ?? []).filter((d: any) => d?.title).map((d: any) => {
    const access = d.ebook_access ?? 'no_ebook';
    const ia = (d.ia ?? [])[0] as string | undefined;
    const page = `https://openlibrary.org${d.key ?? ''}`;
    const free = access === 'public' && !!ia;
    const lend = access === 'borrowable' || access === 'printdisabled';
    return {
      id: `ol${d.key ?? d.title}`,
      title: String(d.title),
      authors: (d.author_name ?? []).slice(0, 3).join(', '),
      description: d.first_publish_year ? `Poprvé vydáno ${d.first_publish_year}.` : '',
      language: (d.language ?? []).slice(0, 3).join(', '),
      cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : undefined,
      price: free ? 'zdarma' : lend ? 'výpůjčka' : undefined,
      download: free ? `https://archive.org/download/${ia}/${ia}.epub` : undefined,
      preview: page,
      store: ia ? 'Internet Archive' : 'Open Library',
      drm: free ? 'free' : lend ? 'drm' : 'none',
    } as StoreBook;
  });
}

// ------------------------------------------------------------ Wikizdroje (volná díla v češtině)
export const WIKISOURCE_PREFIX = 'wikisource:';

export function wikisourceSearchUrl(q: string, lang = 'cs'): string {
  return `https://${lang}.wikisource.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=20&srnamespace=0&srsearch=${enc(q)}`;
}

export function parseWikisourceSearch(j: any, lang = 'cs'): StoreBook[] {
  return (j?.query?.search ?? [])
    .filter((r: any) => r?.title && !String(r.title).includes('/') && !/rozcestník/i.test(r.title))
    .map((r: any) => ({
      id: `ws${lang}${r.pageid ?? r.title}`,
      title: String(r.title),
      authors: '',
      description: String(r.snippet ?? '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').slice(0, 200),
      language: lang,
      price: 'zdarma',
      download: `${WIKISOURCE_PREFIX}${lang}:${r.title}`,
      preview: `https://${lang}.wikisource.org/wiki/${enc(String(r.title).replace(/ /g, '_'))}`,
      store: 'Wikizdroje',
      drm: 'free',
    } as StoreBook));
}

export function wikisourceParseUrl(lang: string, page: string): string {
  return `https://${lang}.wikisource.org/w/api.php?action=parse&format=json&formatversion=2&redirects=1&origin=*&prop=text%7Clinks&disableeditsection=1&page=${enc(page.replace(/ /g, '_'))}`;
}

/** Kapitoly (podstránky „Název/…“) v pořadí podle obsahu knihy – rozhraní vrací odkazy podle abecedy. */
export function wikisourceChapterOrder(real: string, parse: { text?: string; links?: { ns?: number; title?: string; exists?: boolean }[] }): string[] {
  const existing = new Set((parse.links ?? []).filter((l) => l.ns === 0 && l.exists !== false).map((l) => l.title ?? ''));
  const order: string[] = [];
  const seen = new Set<string>();
  for (const m of (parse.text ?? '').matchAll(/<a\b[^>]*>/gi)) {
    const tag = m[0];
    const title = /\btitle="([^"]*)"/.exec(tag)?.[1];
    const href = /\bhref="([^"]*)"/.exec(tag)?.[1] ?? '';
    let t = title ? decodeHtml(title) : href.includes('/wiki/') ? safeDecode(href.split('/wiki/')[1]).replace(/_/g, ' ') : '';
    t = t.split('#')[0];
    if (t.startsWith(`${real}/`) && !seen.has(t) && (!existing.size || existing.has(t))) {
      seen.add(t);
      order.push(t);
    }
  }
  for (const t of [...existing].sort()) if (t.startsWith(`${real}/`) && !seen.has(t)) { seen.add(t); order.push(t); }
  return order;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
function decodeHtml(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

const WS_DROP = ['ws-noexport', 'noprint', 'mw-editsection', 'navbox', 'headertemplate', 'header_notes', 'ws-header', 'reference', 'mw-references-wrap'];

/** HTML stránky Wikizdrojů bez navigace, poznámek editorů a odkazů (prvek s danou třídou se odebere i s obsahem). */
export function wikisourceClean(html: string): string {
  let out = html.replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, '');
  const open = /<([a-z][a-z0-9]*)\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = open.exec(out))) {
    const cls = /\b(?:class|id)="([^"]*)"/.exec(m[2])?.[1] ?? '';
    if (!cls || !cls.split(/\s+/).some((c) => WS_DROP.includes(c)) || m[0].endsWith('/>')) continue;
    const tag = m[1].toLowerCase();
    const re = new RegExp(`<(/)?${tag}\\b[^>]*>`, 'gi');
    re.lastIndex = m.index + m[0].length;
    let depth = 1, end = out.length, t: RegExpExecArray | null;
    while ((t = re.exec(out))) {
      if (t[0].endsWith('/>')) continue;
      depth += t[1] ? -1 : 1;
      if (!depth) { end = t.index + t[0].length; break; }
    }
    out = out.slice(0, m.index) + out.slice(end);
    open.lastIndex = m.index;
  }
  return out;
}
