// Synchronizace knih a čtení s Windows přes Google Disk – stejný formát a slučování jako prekladac/cloud_sync.py
// (hlídají to společné testovací případy prekladac/tests/fixtures/sync_cases.json).
// Na Disku je složka „Překladač“: sync.json (místo čtení, záložky, označené) a knihy jako EPUB.

export interface SyncPos { chapter: number; fraction: number; at: number; device: string }
export interface SyncBookmark { chapter: number; fraction: number; label: string; at: number }
export interface SyncHighlight { chapter: number; text: string; color?: string; note?: string; at: number }
export interface SyncEntry {
  title: string;
  author: string;
  pos: SyncPos | null;
  bookmarks: SyncBookmark[];
  highlights: SyncHighlight[];
  /** smazané záložky a označení: id → čas smazání (ms) */
  gone: Record<string, number>;
  file: { id: string; name: string; at: number } | null;
}
export interface SyncState { v: 1; books: Record<string, SyncEntry> }

const CS: Record<string, string> = { á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ó: 'o', ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z', ä: 'a', ö: 'o', ü: 'u', ľ: 'l', ĺ: 'l', ô: 'o', ŕ: 'r' };
function fold(s: string): string {
  let t = (s || '').toLowerCase().replace(/[^\x00-\x7f]/g, (c) => CS[c] ?? c);
  // ostatní znaky s diakritikou (jako unicodedata v Pythonu); normalize nemusí být v každém Androidu
  if (typeof t.normalize === 'function') t = t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return t.replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Stejná kniha v počítači i v telefonu: název a autor bez diakritiky, velikosti písmen a interpunkce. */
export function bookKey(title: string, author: string): string {
  return `${fold(title)}|${fold(author)}`;
}

const normText = (t: string) => (t || '').replace(/\s+/g, ' ').trim();

export function markId(kind: 'b' | 'h', m: { chapter?: number; fraction?: number; text?: string }): string {
  if (kind === 'b') return `b:${Math.trunc(m.chapter ?? 0)}:${pyRound((m.fraction ?? 0) * 1000)}`;
  return `h:${Math.trunc(m.chapter ?? 0)}:${normText(m.text ?? '').slice(0, 40)}`;
}

/** Zaokrouhlení jako v Pythonu (k sudému při .5), aby id záložek byla na obou stranách stejná. */
function pyRound(x: number): number {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

function mergeMarks<T extends { chapter: number; at: number; fraction?: number; text?: string }>(kind: 'b' | 'h', a: T[] | undefined, b: T[] | undefined, gone: Record<string, number>): T[] {
  const out = new Map<string, T>();
  for (const m0 of [...(a ?? []), ...(b ?? [])]) {
    const m = { ...m0 } as T;
    if (kind === 'h') (m as { text?: string }).text = normText(m.text ?? '');
    const id = markId(kind, m);
    if ((gone[id] ?? -1) >= (m.at ?? 0)) continue;
    const old = out.get(id);
    if (!old || (m.at ?? 0) > (old.at ?? 0)) out.set(id, m);
  }
  return [...out.values()].sort((x, y) => x.chapter - y.chapter || (kind === 'b' ? (x.fraction ?? 0) - (y.fraction ?? 0) : x.at - y.at));
}

/** Sloučí záznam knihy ze dvou zařízení: novější místo čtení vyhraje, záložky a označené se spojí,
 *  smazané zmizí, pokud nebyly potom znovu přidané. */
export function mergeEntry(a: Partial<SyncEntry> | null | undefined, b: Partial<SyncEntry> | null | undefined): SyncEntry {
  const A = a ?? {}, B = b ?? {};
  const gone: Record<string, number> = {};
  for (const g of [A.gone ?? {}, B.gone ?? {}]) for (const [k, v] of Object.entries(g)) gone[k] = Math.max(gone[k] ?? v, v);
  const pa = A.pos ?? null, pb = B.pos ?? null;
  const pos = pb && (!pa || pb.at > pa.at) ? pb : pa;
  const fa = A.file ?? null, fb = B.file ?? null;
  const file = fb && (!fa || fb.at > fa.at) ? fb : fa;
  return {
    title: A.title || B.title || '', author: A.author || B.author || '', pos,
    bookmarks: mergeMarks('b', A.bookmarks, B.bookmarks, gone), highlights: mergeMarks('h', A.highlights, B.highlights, gone),
    gone, file,
  };
}

export function mergeState(local: Partial<SyncState> | null, remote: Partial<SyncState> | null): SyncState {
  const lb = local?.books ?? {}, rb = remote?.books ?? {};
  const books: Record<string, SyncEntry> = {};
  for (const k of new Set([...Object.keys(lb), ...Object.keys(rb)])) books[k] = mergeEntry(lb[k], rb[k]);
  return { v: 1, books };
}

// ------------------------------------------------------------ Google: přihlášení kódem a Disk
export const SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const FOLDER = 'Překladač';
export const STATE_FILE = 'sync.json';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEVICE_URL = 'https://oauth2.googleapis.com/device/code';
const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

export type Fetch = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string | Uint8Array }) => Promise<{ ok: boolean; status: number; text(): Promise<string>; arrayBuffer(): Promise<ArrayBuffer> }>;

export class CloudError extends Error {}

function explain(status: number, j: any, raw: string): string {
  const e = typeof j?.error === 'string' ? j.error : '';
  const msg = typeof j?.error === 'object' ? j.error?.message ?? '' : '';
  if (e === 'authorization_pending' || e === 'slow_down') return e;
  if (e === 'access_denied') return 'Přihlášení bylo zamítnuto. Zkuste to znovu a v prohlížeči povolte přístup.';
  if (e === 'expired_token') return 'Kód pro přihlášení vypršel. Klepněte znovu na Přihlásit.';
  if (e === 'invalid_client' || e === 'unauthorized_client') return 'Google nezná ID klienta nebo tajný klíč. Zkontrolujte je – klient musí být typu „TV a zařízení s omezeným vstupem“ (návod v Nastavení).';
  if (e === 'invalid_grant') return 'Přihlášení ke Google Disku vypršelo nebo bylo zrušeno – přihlaste se znovu.';
  if (e === 'invalid_scope') return 'Google odmítl oprávnění k Disku. V projektu Google Cloud zapněte Google Drive API.';
  if (status === 403 && /has not been used|disabled/.test(msg)) return 'V projektu Google Cloud není zapnuté Google Drive API – zapněte ho a zkuste to za pár minut.';
  if (status === 401) return 'Přihlášení ke Google Disku vypršelo – přihlaste se znovu.';
  return `Google Disk: ${msg || e || raw.slice(0, 200)} (HTTP ${status})`;
}

export class GoogleDrive {
  private access = '';
  private expires = 0;
  private folderId = '';
  constructor(public clientId: string, public clientSecret: string, public refreshToken = '', private fetchFn: Fetch = fetch as unknown as Fetch) {
    this.clientId = clientId.trim();
    this.clientSecret = clientSecret.trim();
  }

  private async req(method: string, url: string, body?: string | Uint8Array, headers: Record<string, string> = {}, auth = true): Promise<Uint8Array> {
    const h = { ...headers };
    if (auth) h.Authorization = `Bearer ${await this.accessToken()}`;
    let r;
    try {
      r = await this.fetchFn(url, { method, headers: h, body });
    } catch (e: any) {
      throw new CloudError(`Google Disk není dostupný (${e?.message ?? e}). Zkontrolujte připojení k internetu.`);
    }
    const data = new Uint8Array(await r.arrayBuffer());
    if (!r.ok) {
      const raw = new TextDecoder().decode(data);
      let j: any = {};
      try { j = JSON.parse(raw); } catch { /* text */ }
      throw new CloudError(explain(r.status, j, raw));
    }
    return data;
  }
  private async json(method: string, url: string, body?: string | Uint8Array, headers?: Record<string, string>, auth = true): Promise<any> {
    return JSON.parse(new TextDecoder().decode(await this.req(method, url, body, headers, auth)));
  }
  private form(url: string, fields: Record<string, string>) {
    const body = Object.entries(fields).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    return this.json('POST', url, body, { 'Content-Type': 'application/x-www-form-urlencoded' }, false);
  }

  /** Začne přihlášení: user_code se opíše na google.com/device. */
  async deviceStart(): Promise<{ device_code: string; user_code: string; verification_url: string; interval: number }> {
    if (!this.clientId) throw new CloudError('Nejdřív vyplňte ID klienta a tajný klíč klienta z Google Cloud (návod).');
    const j = await this.form(DEVICE_URL, { client_id: this.clientId, scope: SCOPE });
    return { ...j, verification_url: j.verification_url ?? j.verification_uri ?? 'https://www.google.com/device', interval: j.interval ?? 5 };
  }

  /** true = uživatel přihlášení potvrdil (refreshToken je nastavený). */
  async devicePoll(deviceCode: string): Promise<boolean> {
    try {
      const j = await this.form(TOKEN_URL, { client_id: this.clientId, client_secret: this.clientSecret, device_code: deviceCode, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' });
      this.refreshToken = j.refresh_token ?? '';
      this.access = j.access_token ?? '';
      this.expires = Date.now() + ((j.expires_in ?? 3000) - 60) * 1000;
      return true;
    } catch (e: any) {
      if (/authorization_pending|slow_down/.test(String(e?.message))) return false;
      throw e;
    }
  }

  async accessToken(): Promise<string> {
    if (this.access && Date.now() < this.expires) return this.access;
    if (!this.refreshToken) throw new CloudError('Nejste přihlášeni ke Google Disku – v Nastavení klepněte na Přihlásit.');
    const j = await this.form(TOKEN_URL, { client_id: this.clientId, client_secret: this.clientSecret, refresh_token: this.refreshToken, grant_type: 'refresh_token' });
    this.access = j.access_token;
    this.expires = Date.now() + ((j.expires_in ?? 3000) - 60) * 1000;
    return this.access;
  }

  private async find(name: string, parent = '', folder = false): Promise<{ id: string; name: string } | null> {
    const q = [`name = '${name.replace(/'/g, "\\'")}'`, 'trashed = false', folder ? "mimeType = 'application/vnd.google-apps.folder'" : "mimeType != 'application/vnd.google-apps.folder'"];
    if (parent) q.push(`'${parent}' in parents`);
    const j = await this.json('GET', `${API}?q=${encodeURIComponent(q.join(' and '))}&fields=files(id,name,modifiedTime)&spaces=drive`);
    return j.files?.[0] ?? null;
  }

  async folder(): Promise<string> {
    if (!this.folderId) {
      let f = await this.find(FOLDER, '', true);
      if (!f) f = await this.json('POST', API, JSON.stringify({ name: FOLDER, mimeType: 'application/vnd.google-apps.folder' }), { 'Content-Type': 'application/json' });
      this.folderId = f!.id;
    }
    return this.folderId;
  }

  async listFiles(): Promise<{ id: string; name: string; size?: string; modifiedTime?: string }[]> {
    const q = encodeURIComponent(`'${await this.folder()}' in parents and trashed = false`);
    return (await this.json('GET', `${API}?q=${q}&fields=files(id,name,size,modifiedTime)&pageSize=500`)).files ?? [];
  }

  download(fileId: string): Promise<Uint8Array> {
    return this.req('GET', `${API}/${fileId}?alt=media`);
  }

  /** Nahraje soubor do složky Překladač (fileId = přepsat existující). Vrátí id souboru. */
  async upload(name: string, data: Uint8Array, mime: string, fileId = ''): Promise<string> {
    if (fileId) return (await this.json('PATCH', `${UPLOAD}/${fileId}?uploadType=media&fields=id`, data, { 'Content-Type': mime })).id;
    const boundary = `prekladac${Date.now()}`;
    const enc = new TextEncoder();
    const head = enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: [await this.folder()] })}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`);
    const tail = enc.encode(`\r\n--${boundary}--`);
    const body = new Uint8Array(head.length + data.length + tail.length);
    body.set(head, 0);
    body.set(data, head.length);
    body.set(tail, head.length + data.length);
    return (await this.json('POST', `${UPLOAD}?uploadType=multipart&fields=id`, body, { 'Content-Type': `multipart/related; boundary=${boundary}` })).id;
  }

  async getState(): Promise<{ state: SyncState; fileId: string }> {
    const f = await this.find(STATE_FILE, await this.folder());
    if (!f) return { state: { v: 1, books: {} }, fileId: '' };
    try {
      return { state: JSON.parse(new TextDecoder().decode(await this.download(f.id))), fileId: f.id };
    } catch (e) {
      if (e instanceof CloudError) throw e;
      return { state: { v: 1, books: {} }, fileId: f.id };
    }
  }

  async putState(state: SyncState, fileId = ''): Promise<string> {
    return this.upload(STATE_FILE, new TextEncoder().encode(JSON.stringify(state)), 'application/json', fileId);
  }

  /** Stáhne sync.json, sloučí s místním stavem a nahraje výsledek. */
  async sync(local: Partial<SyncState>): Promise<SyncState> {
    const { state: remote, fileId } = await this.getState();
    const merged = mergeState(local, remote);
    if (JSON.stringify(merged) !== JSON.stringify(mergeState(remote, null))) await this.putState(merged, fileId);
    return merged;
  }
}
