// Rozdělení textu/bloků na kapitoly (stejná pravidla jako desktopový Překladač).
import type { Block, Chapter } from './book';

export const TOC_NAMES = new Set(['obsah', 'contents', 'table of contents', 'inhalt', 'inhaltsverzeichnis', 'spis treści', 'table des matières', 'índice']);
const NUM_TITLE = /^\s*(\d{1,3})[.)]\s+(\S.{0,120})$/;
const WORD_TITLE = /^\s*(kapitola|chapter|kapitel|rozdział|část|chapitre|capítulo|capitolo)\s+[\w.]+.*$/i;

export function cleanTitle(t: string): string {
  const s = t.replace(/\s+/g, ' ').trim();
  const m = NUM_TITLE.exec(s);
  return m ? m[2].trim() : s;
}

export function isTitleLine(s: string): boolean {
  return s.length > 0 && s.length < 120 && (NUM_TITLE.test(s) || WORD_TITLE.test(s));
}

/** Prostý text → (název, kapitoly). Kapitoly začínají řádkem „1. Název“ nebo „Kapitola 1“ po prázdném řádku. */
export function chaptersFromText(text: string, fallbackTitle: string): { title: string; chapters: Chapter[] } {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const title = (lines.find((l) => l.trim()) ?? fallbackTitle).trim();
  const chapters: Chapter[] = [];
  let front: string[] = [];
  let paras: string[] = front;
  let buf: string[] = [];
  const flush = () => {
    if (buf.length) paras.push(buf.join('\n').trim());
    buf = [];
  };
  let prevBlank = true;
  for (const ln of lines) {
    const s = ln.trim();
    if (prevBlank && isTitleLine(s)) {
      flush();
      const ch: Chapter = { title: cleanTitle(s), blocks: [] };
      chapters.push(ch);
      paras = [];
      (ch as any)._paras = paras;
    } else if (!s) flush();
    else if (s === '[[STRANA]]') {
      flush();
      paras.push('\f');
    } else buf.push(s);
    prevBlank = !s;
  }
  flush();
  const toBlocks = (ps: string[]): Block[] => ps.filter(Boolean).map((p) => (p === '\f' ? { type: 'pb' } : { type: 'p', text: p }) as Block);
  for (const ch of chapters) {
    ch.blocks = toBlocks((ch as any)._paras);
    delete (ch as any)._paras;
  }
  if (!chapters.length) {
    const body = front.length > 1 && front[0] === title ? front.slice(1) : front;
    return { title, chapters: [{ title, blocks: toBlocks(body) }] };
  }
  return { title, chapters };
}

/** Bloky (z HTML) → kapitoly podle nadpisů h1/h2 (h3, když vyšších není), jinak podle zalomení stránek. */
export function chaptersFromBlocks(blocks: Block[], fallbackTitle: string): Chapter[] {
  const headings = blocks.filter((b) => b.type === 'h') as { type: 'h'; text: string; level?: number }[];
  let level = 0;
  for (const lv of [1, 2, 3]) {
    if (headings.filter((h) => (h.level ?? 2) <= lv).length >= 2) {
      level = lv;
      break;
    }
  }
  const chapters: Chapter[] = [];
  let cur: Chapter = { title: '', blocks: [] };
  const push = () => {
    const hasText = cur.blocks.some((b) => b.type !== 'pb');
    if (hasText) chapters.push(cur);
  };
  for (const b of blocks) {
    const split = level ? b.type === 'h' && (b.level ?? 2) <= level : b.type === 'pb';
    if (split) {
      push();
      cur = { title: b.type === 'h' ? cleanTitle(b.text) : '', blocks: [] };
      continue;
    }
    if (!cur.title && !level && b.type === 'h') {
      cur.title = cleanTitle(b.text);
      continue;
    }
    cur.blocks.push(b);
  }
  push();
  const out = chapters.filter((c) => !TOC_NAMES.has(c.title.toLowerCase()));
  // úvodní titulní strana (jen název a autor) se zahodí
  const sameAsBook = (t: string) => t.toLowerCase() === fallbackTitle.trim().toLowerCase();
  if (out.length > 1 && (!out[0].title || sameAsBook(out[0].title))) {
    const len = out[0].blocks.reduce((a, b) => a + (b.type === 'p' ? b.text.length : 0), 0);
    if (len < 200 && !out[0].blocks.some((b) => b.type === 'img')) out.shift();
    else out[0].title = 'Úvod';
  }
  out.forEach((c, i) => {
    if (!c.title) c.title = out.length === 1 ? fallbackTitle : `Kapitola ${i + 1}`;
    while (c.blocks.length && c.blocks[c.blocks.length - 1].type === 'pb') c.blocks.pop();
  });
  return out;
}
