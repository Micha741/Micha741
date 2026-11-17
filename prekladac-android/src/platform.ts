// Napojení na telefon: výběr souborů a obrázků, uložení, sdílení, PDF, uložení nastavení a klíčů.
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { cropRect, type Book } from './core/book';
import { parseWikisourceLink, wikisourceBook } from './core/wikisource';
import { type OutputFormat, OUTPUT_FORMATS, readBook, writeBook } from './core/formats';
import { pdfHtml } from './core/pdf';
import type { EngineSettings } from './core/translate';
import { readSkinFile, slug, type Skin } from './core/skins';
import { deserializeBook, fileNameFromUrl, newEntry, serializeBook, type LibraryEntry, type VocabItem } from './core/library';
import { toBase64 } from './core/bytes';
import { applySyncToEntry, entryKey, entryToSync, GoogleDrive, WebDav, type Storage, type SyncEntry, type SyncState } from './core/sync';
import { writeEpub } from './core/epub';
import { aiOcr, blocksToText, pagesToBook } from './core/ocr';

// PDF chráněné heslem: data se podrží, aby šlo po zadání hesla otevřít znovu bez dalšího výběru
let pendingPdf: { data: Uint8Array; name: string } | null = null;
async function readOrHold(data: Uint8Array, name: string): Promise<Book> {
  try {
    const b = await readBook(data, name);
    pendingPdf = null;
    return b;
  } catch (e: any) {
    if (e?.needsPassword) pendingPdf = { data, name };
    throw e;
  }
}
/** Znovu otevře naposledy odmítnuté PDF se zadaným heslem. */
export async function reopenPdf(password: string): Promise<Book> {
  if (!pendingPdf) throw new Error('Soubor už není k dispozici – otevřete ho znovu.');
  const b = await readBook(pendingPdf.data, pendingPdf.name, password);
  pendingPdf = null;
  return b;
}

export async function pickBook(): Promise<Book | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const data = await new File(a.uri).bytes();
  return readOrHold(data, a.name);
}

/** Vybere obrázek z galerie; vrátí JPEG (zmenšený na delší stranu max. 1600 px). */
export async function pickImage(opts: { cropCover?: boolean } = {}): Promise<Uint8Array | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], quality: 1,
    // obálka: výřez v poměru 2:3 hned při výběru (systémový editor Androidu)
    ...(opts.cropCover ? { allowsEditing: true, aspect: [2, 3] as [number, number] } : {}),
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return toJpeg(a.uri, a.width, a.height);
}

/** Výběr více obrázků najednou (v pořadí, jak je uživatel vybral). */
export async function pickImages(): Promise<Uint8Array[]> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsMultipleSelection: true, orderedSelection: true });
  if (res.canceled || !res.assets?.length) return [];
  const out: Uint8Array[] = [];
  for (const a of res.assets) out.push(await toJpeg(a.uri, a.width, a.height));
  return out;
}

/** Otočí (po směru hodinových ručiček) nebo ořízne obrázek na poměr stran; vrátí JPEG. */
export async function transformImage(data: Uint8Array, op: { rotate?: number; aspect?: number }): Promise<Uint8Array> {
  const tmp = new File(Paths.cache, `edit_${Date.now()}.img`);
  tmp.write(data);
  try {
    const ctx = ImageManipulator.manipulate(tmp.uri);
    if (op.rotate) ctx.rotate(op.rotate);
    if (op.aspect) {
      const probe = await ImageManipulator.manipulate(tmp.uri).renderAsync();
      ctx.crop(cropRect(probe.width, probe.height, op.aspect));
    }
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
    const f = new File(out.uri);
    const bytes = await f.bytes();
    f.delete();
    return bytes;
  } finally {
    tmp.delete();
  }
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
    await new File(res.uri).move(file); // v SDK 57 je přesun asynchronní – počkat, než bude PDF na místě
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
  /** katalogy hledané přímo v aplikaci (wikisource, openlibrary, google, gutenberg) */
  searchCats?: string[];
  engine?: string;
  target?: string;
  format?: string;
  /** Google Disk – synchronizace s Windows (ID klienta, tajný klíč a přihlášení; vše šifrovaně v Keystore) */
  gdriveClientId?: string;
  gdriveSecret?: string;
  gdriveToken?: string;
  /** Synology / WebDAV (Nextcloud…) – adresa, uživatel a heslo (heslo šifrovaně v Keystore) */
  davUrl?: string;
  davUser?: string;
  davPassword?: string;
  /** kam se synchronizuje: 'gdrive' nebo 'webdav' */
  cloudProvider?: string;
  /** ochrana vlastní knihy: „Licence pro: …“ do každé kapitoly při ukládání (prázdné = vypnuto) */
  watermark?: string;
  watermarkOn?: boolean;
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
  return readOrHold(data, name || 'kniha');
}

/** Stáhne knihu z odkazu (Project Gutenberg, ukázka z obchodu…) a otevře ji. */
export async function downloadBook(url: string, signal?: AbortSignal): Promise<Book> {
  const ws = parseWikisourceLink(url);
  if (ws) {
    // Wikizdroje: kniha se sestaví z textu stránek (kapitoly v pořadí obsahu)
    return wikisourceBook(async (u) => {
      const r = await fetch(u, { signal });
      if (!r.ok) throw new Error(`Wikizdroje neodpovídají (HTTP ${r.status}).`);
      return r.json();
    }, ws.lang, ws.title);
  }
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Stažení se nepodařilo (HTTP ${res.status}).`);
  const data = new Uint8Array(await res.arrayBuffer());
  const type = res.headers.get('content-type') || '';
  if (/text\/html/.test(type) && !/\.html?$/i.test(url))
    throw new Error('Odkaz nevede na soubor knihy, ale na webovou stránku. Otevřete ho v prohlížeči a stáhněte soubor (EPUB, MOBI…).');
  const ext = /epub/.test(type) ? 'epub' : /mobipocket|x-mobi/.test(type) ? 'mobi' : '';
  return readOrHold(data, fileNameFromUrl(url, ext));
}

// ------------------------------------------------------------ slovníček (přeložená slova ze čtečky)
export async function loadVocab(): Promise<VocabItem[]> {
  try {
    const f = new File(libDir(), 'slovnicek.json');
    return f.exists ? (JSON.parse(await f.text()) as VocabItem[]) : [];
  } catch {
    return [];
  }
}

export function saveVocab(list: VocabItem[]) {
  const f = new File(libDir(), 'slovnicek.json');
  if (!f.exists) f.create();
  f.write(JSON.stringify(list));
}

/** Sdílí text jako soubor .txt (slovníček, poznámky). */
export async function shareText(name: string, text: string) {
  const f = new File(Paths.cache, `${safeFileName(name)}.txt`);
  if (f.exists) f.delete();
  f.create();
  f.write(text);
  await Sharing.shareAsync(f.uri, { mimeType: 'text/plain', dialogTitle: name });
}

// ------------------------------------------------------------ Google Disk: knihy a čtení i ve Windows
/** Zvolené úložiště pro synchronizaci (Google Disk nebo Synology / WebDAV); null = nic nastaveného. */
export function storageFromSettings(s: Settings): Storage | null {
  const provider = s.cloudProvider || (s.davUrl && !s.gdriveToken ? 'webdav' : 'gdrive');
  if (provider === 'webdav') return s.davUrl?.trim() && s.davUser?.trim() ? new WebDav(s.davUrl, s.davUser, s.davPassword ?? '') : null;
  if (!s.gdriveClientId?.trim() || !s.gdriveToken) return null;
  return new GoogleDrive(s.gdriveClientId, s.gdriveSecret ?? '', s.gdriveToken);
}

const safeName = (t: string) => (t || 'kniha').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 80) || 'kniha';

/** Knihy v telefonu podle klíče (název + autor); u více záznamů se stejným klíčem ten naposledy čtený. */
function byKey(list: LibraryEntry[]): Map<string, LibraryEntry> {
  const m = new Map<string, LibraryEntry>();
  for (const e of [...list].sort((a, b) => a.lastRead - b.lastRead)) m.set(entryKey(e), e);
  return m;
}

/** Použije sloučený stav na záznam (označené potřebují text knihy – načte se jen když se liší). */
async function applyToEntry(e: LibraryEntry, s: SyncEntry): Promise<{ entry: LibraryEntry; moved: boolean }> {
  const same = JSON.stringify(entryToSync(e).highlights) === JSON.stringify(s.highlights);
  const book = same ? null : await loadLibraryBook(e.id).catch(() => null);
  const { patch, moved } = applySyncToEntry(e, s, book);
  if (same) delete patch.highlights;
  await updateEntry(e.id, patch);
  return { entry: { ...e, ...patch }, moved };
}

export interface CloudResult {
  /** knihy na Disku, které v telefonu ještě nejsou */
  cloudOnly: SyncEntry[];
  uploaded: number;
  state: SyncState;
}

/** Celá knihovna: sloučí místa čtení a označené s Diskem a nahraje knihy, které tam ještě nejsou. */
export async function syncLibrary(s: Settings, say: (m: string) => void = () => undefined): Promise<CloudResult> {
  const d = storageFromSettings(s);
  if (!d) throw new Error('Synchronizace není nastavená (Nastavení → Služby a klíče → Google Disk nebo Synology).');
  const local = byKey(await loadLibrary());
  say('Stahuji stav z Disku…');
  let state = await d.sync({ v: 1, books: Object.fromEntries([...local].map(([k, e]) => [k, entryToSync(e)])) });
  let uploaded = 0;
  const files: Record<string, SyncEntry> = {};
  for (const [k, e] of local) {
    const m = state.books[k];
    if (!m) continue;
    if (!m.file) {
      say(`Nahrávám na Disk: ${e.title}…`);
      const name = `${safeName(e.title)}.epub`;
      const id = await d.upload(name, await writeEpub(await loadLibraryBook(e.id)), 'application/epub+zip');
      m.file = { id, name, at: Date.now() };
      files[k] = m;
      uploaded++;
    }
    await applyToEntry(e, m);
  }
  if (uploaded) state = await d.sync({ v: 1, books: files });
  const cloudOnly = Object.entries(state.books).filter(([k, e]) => e.file && !local.has(k)).map(([, e]) => e);
  return { cloudOnly, uploaded, state };
}

/** Stáhne knihu z Disku do knihovny (s místem čtení a označenými). */
export async function downloadCloudBook(s: Settings, e: SyncEntry): Promise<{ book: Book; entry: LibraryEntry }> {
  const d = storageFromSettings(s);
  if (!d || !e.file) throw new Error('Kniha na Disku není k dispozici.');
  const book = await readBook(await d.download(e.file.id), e.file.name || 'kniha.epub');
  const added = await addToLibrary(book);
  const { entry } = await applyToEntry({ ...added, posAt: 0 }, e);
  return { book, entry };
}

/** Jedna kniha (při otevření a zavření čtečky): sloučí s Diskem. moved = četlo se jinde později. */
export async function syncEntry(s: Settings, e: LibraryEntry): Promise<{ entry: LibraryEntry; moved: boolean; device?: string } | null> {
  const d = storageFromSettings(s);
  if (!d) return null;
  const k = entryKey(e);
  const state = await d.sync({ v: 1, books: { [k]: entryToSync(e) } });
  const m = state.books[k];
  if (!m) return null;
  const r = await applyToEntry(e, m);
  return { ...r, device: m.pos?.device };
}

// ------------------------------------------------------------ text z fotky (OCR)
/** Fotky stránek: z fotoaparátu (jedna) nebo z galerie (víc najednou, v pořadí výběru). Vrátí cesty k JPEG. */
export async function pickPagePhotos(camera: boolean): Promise<string[]> {
  if (camera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Bez povolení fotoaparátu nejde stránku vyfotit (Nastavení telefonu → Aplikace → Překladač → Oprávnění).');
  }
  const opts = { mediaTypes: ['images'] as ImagePicker.MediaType[], quality: 1 };
  const res = camera ? await ImagePicker.launchCameraAsync(opts)
    : await ImagePicker.launchImageLibraryAsync({ ...opts, allowsMultipleSelection: true, orderedSelection: true });
  if (res.canceled || !res.assets?.length) return [];
  const out: string[] = [];
  for (const a of res.assets) {
    // na čtení textu stačí 2000 px na delší straně (menší soubor, rychlejší AI)
    const ctx = ImageManipulator.manipulate(a.uri);
    if (Math.max(a.width, a.height) > 2000) ctx.resize(a.width >= a.height ? { width: 2000, height: null } : { width: null, height: 2000 });
    const img = await ctx.renderAsync();
    out.push((await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 })).uri);
  }
  return out;
}

/** Složka s fotkami stránek, které se zatím nepodařilo přečíst (bez internetu / bez klíče) – nic se neztratí. */
function photosDir(): Directory {
  const d = new Directory(Paths.document, 'fotky-stranek');
  if (!d.exists) d.create({ intermediates: true });
  return d;
}

/** Fotky čekající na přečtení (od nejstarší). */
export function savedPagePhotos(): string[] {
  try {
    return photosDir().list().filter((f): f is File => f instanceof File && /\.jpe?g$/i.test(f.name)).map((f) => f.uri).sort();
  } catch {
    return [];
  }
}

/** Uloží fotky stránek do aplikace (aby šly přečíst později). Vrátí nové cesty. */
export function savePagePhotos(uris: string[]): string[] {
  const dir = photosDir();
  const stamp = Date.now();
  return uris.map((u, i) => {
    if (u.startsWith(dir.uri)) return u;
    const f = new File(dir, `${stamp}-${String(i + 1).padStart(3, '0')}.jpg`);
    new File(u).copySync(f);
    return f.uri;
  });
}

export function deletePagePhotos(uris: string[]) {
  for (const u of uris) {
    try {
      const f = new File(u);
      if (f.exists) f.delete();
    } catch {
      /* už smazané */
    }
  }
}

export class PhotosSavedError extends Error {
  constructor(public count: number, why: string) {
    super(`${why} Fotky (${count}) jsou uložené v aplikaci – až budete mít internet nebo klíč, klepněte na Z fotky → Přečíst uložené.`);
  }
}

/** Přečte text z fotek a udělá z něj knihu: 1) ML Kit v telefonu bez internetu, 2) když nic nenajde nebo
 *  chybí, Gemini / Claude. Když nejde ani jedno, fotky zůstanou uložené (PhotosSavedError). */
export async function photosToBook(uris: string[], s: Settings, say: (m: string) => void = () => undefined,
  recognize?: ((uri: string) => Promise<string[]>) | null): Promise<{ book: Book; via: string }> {
  const saved = savePagePhotos(uris);
  const pages: string[] = [];
  const via = new Set<string>();
  for (let i = 0; i < saved.length; i++) {
    say(`Čtu text z fotky ${i + 1}/${saved.length}…`);
    let text = '';
    if (recognize) {
      try {
        text = blocksToText(await recognize(saved[i]));
        if (text.trim()) via.add('v telefonu');
      } catch {
        text = ''; // ML Kit nejde → zkusí se AI
      }
    }
    if (!text.trim()) {
      if (!s.geminiKey && !s.claudeKey) {
        throw new PhotosSavedError(saved.length, recognize ? 'V telefonu se text nepodařilo přečíst a pro Gemini/Claude chybí klíč.' : 'Čtení v telefonu tu není a pro Gemini/Claude chybí klíč (Nastavení).');
      }
      try {
        text = await aiOcr(toBase64(await new File(saved[i]).bytes()), s);
        via.add(s.geminiKey ? 'Gemini' : 'Claude');
      } catch (e: any) {
        throw new PhotosSavedError(saved.length, `Text se nepodařilo přečíst ani přes ${s.geminiKey ? 'Gemini' : 'Claude'} (${e?.message ?? e}).`);
      }
    }
    pages.push(text);
  }
  const book = pagesToBook(pages);
  deletePagePhotos(saved); // přečteno – fotky už nejsou potřeba
  return { book, via: [...via].join(' + ') };
}
