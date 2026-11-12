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
