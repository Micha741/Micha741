// Napojení na telefon: výběr souborů a obrázků, uložení, sdílení, PDF, uložení nastavení a klíčů.
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import type { Book } from './core/book';
import { type OutputFormat, OUTPUT_FORMATS, readBook, writeBook } from './core/formats';
import { pdfHtml } from './core/pdf';
import type { EngineSettings } from './core/translate';
import { readSkinFile, slug, type Skin } from './core/skins';
import { deserializeBook, fileNameFromUrl, newEntry, serializeBook, type LibraryEntry } from './core/library';
import { toBase64 } from './core/bytes';

export async function pickBook(): Promise<Book | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const data = await new File(a.uri).bytes();
  return readBook(data, a.name);
}

/** Vybere obrázek z galerie; vrátí JPEG (zmenšený na delší stranu max. 1600 px). */
export async function pickImage(): Promise<Uint8Array | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return toJpeg(a.uri, a.width, a.height);
}

async function toJpeg(uri: string, w = 0, h = 0, maxSide = 1600): Promise<Uint8Array> {
  const ctx = ImageManipulator.manipulate(uri);
  if (Math.max(w, h) > maxSide || !w) ctx.resize(w >= h ? { width: maxSide, height: null } : { width: null, height: maxSide });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return new File(out.uri).bytes();
}

/** Kindle (MOBI) umí jen JPEG/GIF – ostatní obrázky se převedou. */
async function imagesForMobi(book: Book): Promise<Book> {
  const images = { ...book.images };
  for (const [name, im] of Object.entries(images)) {
    if (im.mime === 'image/jpeg' || im.mime === 'image/gif') continue;
    const tmp = new File(Paths.cache, `mobi_${name}`);
    tmp.write(im.data);
    images[name] = { data: await toJpeg(tmp.uri, 0, 0, 1200), mime: 'image/jpeg' };
    tmp.delete();
  }
  return { ...book, images };
}

export function safeFileName(s: string): string {
  return (s || 'kniha').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || 'kniha';
}

export interface Output {
  uri: string;
  name: string;
  mime: string;
}

/** Vytvoří výsledný soubor v mezipaměti aplikace. */
export async function makeOutput(book: Book, fmt: OutputFormat): Promise<Output> {
  const f = OUTPUT_FORMATS.find((x) => x.id === fmt)!;
  const name = `${safeFileName(book.title)}.${f.ext}`;
  const dir = new Directory(Paths.cache, 'vystup');
  if (!dir.exists) dir.create();
  const file = new File(dir, name);
  if (file.exists) file.delete();
  if (fmt === 'pdf') {
    const res = await Print.printToFileAsync({ html: pdfHtml(book), width: 595, height: 842 });
    new File(res.uri).move(file);
  } else {
    const data = await writeBook(fmt === 'mobi' ? await imagesForMobi(book) : book, fmt);
    file.create();
    file.write(data);
  }
  return { uri: file.uri, name, mime: f.mime };
}

export async function shareOutput(o: Output) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sdílení není v tomto telefonu dostupné.');
  await Sharing.shareAsync(o.uri, { mimeType: o.mime, dialogTitle: o.name });
}

/** Uloží výsledek do složky, kterou uživatel vybere (např. Stažené nebo Dokumenty). */
export async function saveOutputToFolder(o: Output): Promise<string> {
  const dir = await Directory.pickDirectoryAsync();
  const target = dir.createFile(o.name, o.mime);
  target.write(await new File(o.uri).bytes());
  return target.name;
}

// ------------------------------------------------------------ nastavení (klíče jsou v šifrovaném úložišti)
export interface Settings extends EngineSettings {
  skin?: string;
  /** nastavení čtečky (písmo, velikost, barvy…) */
  reader?: Partial<import('./core/reader').ReaderPrefs>;
  /** poslední hledané knihy (našeptávač) */
  searchHistory?: string[];
  engine?: string;
  target?: string;
  format?: string;
}

const KEY = 'prekladac_settings_v1';

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveSettings(s: Settings) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(s));
}

// ------------------------------------------------------------ skiny (soubory .skin jako ve Windows)
function skinsDir(): Directory {
  const d = new Directory(Paths.document, 'skins');
  if (!d.exists) d.create({ intermediates: true });
  return d;
}

export async function loadInstalledSkins(): Promise<Skin[]> {
  const out: Skin[] = [];
  try {
    for (const f of skinsDir().list()) {
      if (f instanceof File && f.name.endsWith('.json')) {
        try {
          out.push(JSON.parse(await f.text()) as Skin);
        } catch {
          // poškozený skin se jen nezobrazí
        }
      }
    }
  } catch {
    return [];
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
}

/** Vybere soubor .skin a uloží ho do aplikace. Vrátí nainstalovaný skin (nebo null při zrušení). */
export async function installSkinFromPicker(): Promise<Skin | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const skin = await readSkinFile(await new File(a.uri).bytes(), a.name);
  const f = new File(skinsDir(), `${slug(skin.name)}.json`);
  if (f.exists) f.delete();
  f.create();
  f.write(JSON.stringify(skin));
  return skin;
}

export function removeSkin(skin: Skin) {
  const f = new File(skinsDir(), `${skin.id.replace(/^user:/, '')}.json`);
  if (f.exists) f.delete();
}

// ------------------------------------------------------------ knihovna čtečky
function libDir(): Directory {
  const d = new Directory(Paths.document, 'knihovna');
  if (!d.exists) d.create({ intermediates: true });
  return d;
}

export async function loadLibrary(): Promise<LibraryEntry[]> {
  try {
    const f = new File(libDir(), 'index.json');
    if (!f.exists) return [];
    const list = JSON.parse(await f.text()) as LibraryEntry[];
    return Array.isArray(list) ? list.sort((a, b) => b.lastRead - a.lastRead) : [];
  } catch {
    return [];
  }
}

export function saveLibrary(list: LibraryEntry[]) {
  const f = new File(libDir(), 'index.json');
  if (!f.exists) f.create();
  f.write(JSON.stringify(list));
}

async function coverThumb(book: Book): Promise<string | undefined> {
  const im = book.cover ? book.images[book.cover] : undefined;
  if (!im) return undefined;
  try {
    const tmp = new File(Paths.cache, `obalka_${Date.now()}`);
    tmp.write(im.data);
    const jpg = await toJpeg(tmp.uri, 0, 0, 240);
    tmp.delete();
    return `data:image/jpeg;base64,${toBase64(jpg)}`;
  } catch {
    return undefined;
  }
}

/** Uloží knihu do knihovny (stejná kniha podle názvu a autora se nahradí). Vrátí záznam. */
export async function addToLibrary(book: Book, originalId?: string): Promise<LibraryEntry> {
  const list = await loadLibrary();
  const same = list.find((e) => e.title === book.title && e.author === (book.author || '') && e.language === (book.language || '') && e.originalId === originalId);
  const id = same?.id ?? `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const f = new File(libDir(), `${id}.kniha`);
  if (f.exists) f.delete();
  f.create();
  f.write(serializeBook(book));
  const entry: LibraryEntry = { ...(same ?? newEntry(book, id, originalId)), lastRead: Date.now(), cover: await coverThumb(book) };
  saveLibrary([entry, ...list.filter((e) => e.id !== id)]);
  return entry;
}

export async function loadLibraryBook(id: string): Promise<Book> {
  return deserializeBook(await new File(libDir(), `${id}.kniha`).bytes());
}

export async function removeFromLibrary(id: string) {
  const f = new File(libDir(), `${id}.kniha`);
  if (f.exists) f.delete();
  saveLibrary((await loadLibrary()).filter((e) => e.id !== id));
}

export async function updateEntry(id: string, patch: Partial<LibraryEntry>) {
  const list = await loadLibrary();
  saveLibrary(list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
}

/** Kniha otevřená z jiné aplikace („Otevřít v Překladači“, content:// nebo file://). */
export async function openBookUri(uri: string): Promise<Book> {
  let data: Uint8Array;
  try {
    data = await new File(uri).bytes();
  } catch {
    throw new Error('Soubor se nepodařilo načíst. Zkuste ho uložit do telefonu a otevřít tlačítkem Otevřít knihu.');
  }
  let name = '';
  try {
    name = decodeURIComponent(uri.split('/').pop() || '');
  } catch {
    name = '';
  }
  return readBook(data, name || 'kniha');
}

/** Stáhne knihu z odkazu (Project Gutenberg, ukázka z obchodu…) a otevře ji. */
export async function downloadBook(url: string, signal?: AbortSignal): Promise<Book> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Stažení se nepodařilo (HTTP ${res.status}).`);
  const data = new Uint8Array(await res.arrayBuffer());
  const type = res.headers.get('content-type') || '';
  if (/text\/html/.test(type) && !/\.html?$/i.test(url))
    throw new Error('Odkaz nevede na soubor knihy, ale na webovou stránku. Otevřete ho v prohlížeči a stáhněte soubor (EPUB, MOBI…).');
  const ext = /epub/.test(type) ? 'epub' : /mobipocket|x-mobi/.test(type) ? 'mobi' : '';
  return readBook(data, fileNameFromUrl(url, ext));
}
