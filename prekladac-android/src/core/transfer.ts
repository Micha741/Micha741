// Přenos nastavení synchronizace z počítače QR kódem (stejný formát jako prekladac/settings_transfer.py):
// „prekladac://nastaveni?d=“ + base64url(deflate bez hlavičky(JSON)).
import pako from 'pako';
import { fromBase64, utf8Decode } from './bytes';
import { normalizeGoogleClientId, normalizeUrl } from './inputs';

export const TRANSFER_PREFIX = 'prekladac://nastaveni?d=';

export interface Transfer {
  provider?: 'gdrive' | 'webdav';
  gdrive?: { clientId: string; secret: string; token: string };
  webdav?: { url: string; user: string; password: string };
  device?: string;
}

export function isTransferLink(s: string | null | undefined): boolean {
  return !!s && s.trim().startsWith(TRANSFER_PREFIX);
}

export function decodeTransfer(link: string): Transfer {
  const s = (link ?? '').trim();
  if (!s.startsWith(TRANSFER_PREFIX)) throw new Error('Toto není kód nastavení z Překladače.');
  let data: any;
  try {
    const b = s.slice(TRANSFER_PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    const raw = pako.inflateRaw(fromBase64(b + '='.repeat((4 - (b.length % 4)) % 4)));
    data = JSON.parse(utf8Decode(raw));
  } catch {
    throw new Error('Kód nastavení je poškozený – naskenujte ho znovu.');
  }
  if (!data || data.v !== 1) throw new Error('Kód nastavení je z novější verze – aktualizujte aplikaci.');
  const out: Transfer = {};
  if (data.p === 'gdrive' || data.p === 'webdav') out.provider = data.p;
  if (data.g?.i) out.gdrive = { clientId: normalizeGoogleClientId(data.g.i), secret: data.g.s ?? '', token: data.g.t ?? '' };
  if (data.w?.u) out.webdav = { url: normalizeUrl(data.w.u), user: data.w.n ?? '', password: data.w.h ?? '' };
  if (typeof data.d === 'string') out.device = data.d;
  if (!out.gdrive && !out.webdav) throw new Error('V kódu není žádné nastavení.');
  return out;
}

/** Popis pro potvrzení („Google Disk (přihlášeno), Synology / WebDAV“). */
export function describeTransfer(t: Transfer): string {
  const parts: string[] = [];
  if (t.gdrive) parts.push(`Google Disk${t.gdrive.token ? ' (i přihlášení)' : ''}`);
  if (t.webdav) parts.push(`Synology / WebDAV (${t.webdav.url})`);
  return parts.join(', ');
}
