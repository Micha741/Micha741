// Skiny (vzhledy) – stejný formát .skin jako ve Windows verzi (prekladac/skins.py).
// .skin = ZIP se skin.json (název, barvy…) a volitelně logo.png. Jen barvy a obrázky, žádný kód.
import JSZip from 'jszip';
import builtinData from './skins-builtin.json';
import { toBase64 } from './bytes';

export type SkinColors = Record<string, string>;
export interface Skin {
  id: string;
  name: string;
  author?: string;
  description?: string;
  dark: boolean;
  colors: SkinColors;
  /** logo jako data URI (jen u nainstalovaných skinů) */
  logo?: string;
  builtin?: boolean;
}

const COLOR = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RAW = (builtinData as { skins: any[] }).skins;
export const BUILTIN_SKINS: Skin[] = RAW.map((s) => ({ id: s.id, name: s.name, author: s.author, description: s.description, dark: !!s.dark, colors: { ...s.colors }, builtin: true }));
export const TOKENS = Object.keys(BUILTIN_SKINS[0].colors);
const MAX_LOGO = 2 * 1024 * 1024;

export class SkinError extends Error {}

export function slug(name: string): string {
  const s = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s.slice(0, 40) || 'skin';
}

/** skin.json → Skin; chybějící/neplatné barvy se doplní ze základu („default“ nebo „dark“). */
export function skinFromJson(data: any, id?: string): Skin {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new SkinError('skin.json nemá správný tvar.');
  const baseId = String(data.base || (data.dark ? 'dark' : 'default'));
  const base = BUILTIN_SKINS.find((s) => s.id === baseId) ?? BUILTIN_SKINS[0];
  const colors: SkinColors = { ...base.colors };
  for (const [k, v] of Object.entries(data.colors ?? {})) {
    if (k in colors && typeof v === 'string' && COLOR.test(v.trim())) colors[k] = v.trim().toLowerCase();
  }
  const name = String(data.name || 'Bez názvu').slice(0, 60);
  return { id: id ?? 'user:' + slug(name), name, author: String(data.author ?? '').slice(0, 80), description: String(data.description ?? '').slice(0, 300), dark: data.dark ?? base.dark, colors };
}

/** Načte soubor .skin (ZIP) nebo samotný skin.json. */
export async function readSkinFile(bytes: Uint8Array, fileName = ''): Promise<Skin> {
  if (fileName.toLowerCase().endsWith('.json') || bytes[0] === 0x7b) {
    try {
      return skinFromJson(JSON.parse(new TextDecoder().decode(bytes)));
    } catch (e) {
      if (e instanceof SkinError) throw e;
      throw new SkinError('skin.json nejde přečíst.');
    }
  }
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    throw new SkinError('Soubor není skin (čekal jsem archiv .skin se souborem skin.json).');
  }
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  let prefix = '';
  if (!names.includes('skin.json')) {
    const tops = new Set(names.map((n) => n.split('/')[0]));
    const top = [...tops][0];
    if (tops.size === 1 && names.includes(`${top}/skin.json`)) prefix = top + '/';
    else throw new SkinError('V archivu chybí soubor skin.json.');
  }
  let data: any;
  try {
    data = JSON.parse((await zip.file(prefix + 'skin.json')!.async('string')).replace(/^﻿/, ''));
  } catch {
    throw new SkinError('skin.json nejde přečíst.');
  }
  const skin = skinFromJson(data);
  const logoName = typeof data.images?.logo === 'string' ? data.images.logo : '';
  if (logoName && !logoName.includes('..') && !logoName.startsWith('/')) {
    const f = zip.file(prefix + logoName);
    if (f) {
      const img = await f.async('uint8array');
      const mime = img[0] === 0x89 ? 'image/png' : img[0] === 0xff ? 'image/jpeg' : img[0] === 0x52 ? 'image/webp' : '';
      if (mime && img.length <= MAX_LOGO) skin.logo = `data:${mime};base64,${toBase64(img)}`;
    }
  }
  return skin;
}
