// Text z fotky stránky: v telefonu přes Google ML Kit (bez internetu), jinak přes Gemini nebo Claude (s klíčem).
// Výsledek je kniha (jedna stránka = část textu), kterou jde rovnou přeložit, uložit nebo číst.
import Anthropic from '@anthropic-ai/sdk';
import { emptyBook, type Book } from './book';
import { chaptersFromText } from './chapters';
import { DEFAULT_CLAUDE_MODEL, DEFAULT_GEMINI_MODEL, type EngineSettings } from './translate';

type Fetch = typeof fetch;

const isLetter = (c: string) => c.toLowerCase() !== c.toUpperCase();
const isLower = (c: string) => isLetter(c) && c === c.toLowerCase();

/** Řádky z ML Kit → odstavce: řádky bloku se spojí, rozdělená slova („slo-“ + „vo“) se slepí. */
export function blocksToText(blocks: string[]): string {
  return blocks
    .map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean)
      .reduce((acc, line) => (!acc ? line : isLetter(acc[acc.length - 2] ?? '') && acc.endsWith('-') && isLower(line[0] ?? '') ? acc.slice(0, -1) + line : `${acc} ${line}`), ''))
    .filter((p) => p.trim() && !/^\d{1,4}$/.test(p.trim())) // samotné číslo stránky pryč
    .join('\n\n');
}

const OCR_PROMPT = 'Přepiš přesně všechen text z fotografie stránky (knihy nebo dokumentu) v původním jazyce. ' +
  'Zachovej odstavce (oddělené prázdným řádkem) a nadpisy; spoj řádky v rámci odstavce, slož rozdělená slova, ' +
  'vynech číslo stránky a záhlaví. Nepřekládej, nic nepřidávej a nepiš komentáře. Když na obrázku žádný text není, vrať prázdnou odpověď.';

/** Přes AI (Gemini, jinak Claude): obrázek JPEG v base64 → text. */
export async function aiOcr(jpegBase64: string, s: EngineSettings, f: Fetch = fetch): Promise<string> {
  if (s.geminiKey) {
    const model = s.geminiModel || DEFAULT_GEMINI_MODEL;
    const res = await f(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': s.geminiKey },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: jpegBase64 } }, { text: OCR_PROMPT }] }] }),
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`Gemini: chyba ${res.status}. ${body.slice(0, 200)}`);
    const j = JSON.parse(body);
    return (j.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? '').join('').trim();
  }
  if (s.claudeKey) {
    const client = new Anthropic({ apiKey: s.claudeKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
    const r = await client.messages.create({
      model: s.claudeModel || DEFAULT_CLAUDE_MODEL,
      max_tokens: 8000,
      messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpegBase64 } }, { type: 'text', text: OCR_PROMPT }] }],
    });
    return r.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
  }
  throw new Error('Čtení textu z fotky bez ML Kit potřebuje klíč Gemini nebo Claude (Nastavení → Služby a klíče).');
}

/** Přečtené stránky → kniha (nadpisy v textu rozdělí kapitoly, jinak jedna kapitola). */
export function pagesToBook(pages: string[], title = ''): Book {
  const text = pages.map((p) => p.trim()).filter(Boolean).join('\n\n');
  if (!text) throw new Error('Na fotce se nenašel žádný text. Zkuste ostřejší fotku při dobrém světle, celou stránku rovně.');
  const d = new Date();
  const base = title || `Text z fotky ${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
  const book = emptyBook(base);
  const r = chaptersFromText(text, base);
  book.chapters = r.chapters;
  book.source = `${base}.txt`;
  return book;
}
