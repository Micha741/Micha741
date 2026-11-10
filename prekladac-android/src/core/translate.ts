// Překlad knihy: Google (zdarma), Claude, Gemini, DeepL, OpenAI-kompatibilní služby (OpenRouter, DeepSeek…).
import Anthropic from '@anthropic-ai/sdk';
import type { Block, Book } from './book';

export const LANGUAGES: { code: string; name: string; english: string; deepl: string }[] = [
  { code: 'cs', name: 'čeština', english: 'Czech', deepl: 'CS' },
  { code: 'sk', name: 'slovenština', english: 'Slovak', deepl: 'SK' },
  { code: 'en', name: 'angličtina', english: 'English', deepl: 'EN-GB' },
  { code: 'de', name: 'němčina', english: 'German', deepl: 'DE' },
  { code: 'pl', name: 'polština', english: 'Polish', deepl: 'PL' },
  { code: 'fr', name: 'francouzština', english: 'French', deepl: 'FR' },
  { code: 'es', name: 'španělština', english: 'Spanish', deepl: 'ES' },
  { code: 'it', name: 'italština', english: 'Italian', deepl: 'IT' },
  { code: 'ru', name: 'ruština', english: 'Russian', deepl: 'RU' },
  { code: 'uk', name: 'ukrajinština', english: 'Ukrainian', deepl: 'UK' },
  { code: 'hu', name: 'maďarština', english: 'Hungarian', deepl: 'HU' },
];

export type EngineId = 'google' | 'claude' | 'gemini' | 'deepl' | 'openai';

export interface EngineSettings {
  claudeKey?: string;
  claudeModel?: string;
  geminiKey?: string;
  geminiModel?: string;
  deeplKey?: string;
  openaiKey?: string;
  openaiBase?: string;
  openaiModel?: string;
}

export const ENGINES: { id: EngineId; name: string; hint: string; needs?: keyof EngineSettings }[] = [
  { id: 'google', name: 'Google (zdarma)', hint: 'bez klíče, rychlý, běžná kvalita' },
  { id: 'claude', name: 'Claude', hint: 'nejlepší kvalita pro knihy, placené (API klíč)', needs: 'claudeKey' },
  { id: 'gemini', name: 'Google Gemini', hint: 'velmi dobrá kvalita, klíč má i bezplatnou úroveň', needs: 'geminiKey' },
  { id: 'deepl', name: 'DeepL', hint: 'DeepL Free/Pro, klíč z deepl.com', needs: 'deeplKey' },
  { id: 'openai', name: 'OpenRouter / OpenAI-kompatibilní', hint: 'DeepSeek, Mistral, Llama… (klíč + model)', needs: 'openaiKey' },
];

export const CLAUDE_MODELS = [
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5 (nejlepší kvalita)' },
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5 (levnější, rychlejší)' },
  { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5 (nejlevnější)' },
];
export const DEFAULT_CLAUDE_MODEL = 'claude-opus-5-5';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export interface Translator {
  maxChars: number;
  maxItems: number;
  translate(texts: string[], signal?: AbortSignal): Promise<string[]>;
}

type Fetch = typeof fetch;

function langOf(code: string) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

const SYSTEM = (lang: string) =>
  `You are a professional literary translator. Translate every string of the given JSON array into ${lang}. ` +
  'Keep the meaning, tone, style, dialogue punctuation and paragraph breaks; keep names unless they have an established translation. ' +
  'Do not add notes or explanations. Return exactly the same number of strings, in the same order.';

function parseArray(raw: string): string[] {
  const s = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  const v = JSON.parse(s);
  const arr = Array.isArray(v) ? v : v.translations;
  if (!Array.isArray(arr)) throw new Error('Odpověď neobsahuje seznam překladů.');
  return arr.map((x: unknown) => String(x ?? ''));
}

async function httpJson(f: Fetch, url: string, init: RequestInit, service: string): Promise<any> {
  const res = await f(url, init);
  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 300);
    try {
      const j = JSON.parse(text);
      msg = j.error?.message || j.message || msg;
    } catch {
      /* text */
    }
    if (res.status === 401 || res.status === 403) throw new Error(`${service}: neplatný nebo chybějící klíč (${res.status}). ${msg}`);
    if (res.status === 402) throw new Error(`${service}: došel kredit (402). ${msg}`);
    if (res.status === 429) throw new Error(`${service}: příliš mnoho požadavků nebo vyčerpaný limit (429). Zkuste to později.`);
    throw new Error(`${service}: chyba ${res.status}. ${msg}`);
  }
  return JSON.parse(text);
}

export function makeTranslator(id: EngineId, target: string, s: EngineSettings, f: Fetch = fetch): Translator {
  const L = langOf(target);
  switch (id) {
    case 'google':
      return {
        maxChars: 4500,
        maxItems: 60,
        async translate(texts, signal) {
          const sep = '\n';
          const q = texts.map((t) => t.replace(/\s*\n\s*/g, ' ')).join(sep);
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${L.code}&dt=t&q=${encodeURIComponent(q)}`;
          const j = await httpJson(f, url, { signal }, 'Google');
          const out = (j[0] as any[]).map((x) => x[0]).join('');
          const parts = out.split(/\n/).map((p: string) => p.trim());
          if (parts.length === texts.length) return parts;
          if (texts.length === 1) return [out.trim()];
          // počet řádků nesedí – po jednom
          const res: string[] = [];
          for (const t of texts) res.push(...(await this.translate([t], signal)));
          return res;
        },
      };
    case 'claude': {
      if (!s.claudeKey) throw new Error('Chybí API klíč pro Claude (Nastavení).');
      const client = new Anthropic({ apiKey: s.claudeKey, dangerouslyAllowBrowser: true, maxRetries: 3 });
      return {
        maxChars: 12000,
        maxItems: 80,
        async translate(texts, signal) {
          const response = await client.beta.messages.create(
            {
              model: s.claudeModel || DEFAULT_CLAUDE_MODEL,
              max_tokens: 16000,
              betas: ['server-side-fallback-2026-07-01'],
              fallbacks: 'default',
              system: SYSTEM(L.english),
              output_config: {
                effort: 'medium',
                format: {
                  type: 'json_schema',
                  schema: {
                    type: 'object',
                    properties: { translations: { type: 'array', items: { type: 'string' } } },
                    required: ['translations'],
                    additionalProperties: false,
                  },
                },
              },
              messages: [{ role: 'user', content: JSON.stringify(texts) }],
            },
            { signal },
          );
          if (response.stop_reason === 'refusal') throw new Error('Claude tuto část odmítl přeložit.');
          if (response.stop_reason === 'max_tokens') throw new Error('Odpověď byla příliš dlouhá.');
          const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
          return parseArray(text);
        },
      };
    }
    case 'gemini': {
      if (!s.geminiKey) throw new Error('Chybí API klíč pro Gemini (Nastavení).');
      const model = s.geminiModel || DEFAULT_GEMINI_MODEL;
      return {
        maxChars: 12000,
        maxItems: 80,
        async translate(texts, signal) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
          const j = await httpJson(f, url, {
            method: 'POST',
            signal,
            headers: { 'content-type': 'application/json', 'x-goog-api-key': s.geminiKey! },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM(L.english) }] },
              contents: [{ role: 'user', parts: [{ text: JSON.stringify(texts) }] }],
              generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'STRING' } } },
            }),
          }, 'Gemini');
          const text = (j.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? '').join('');
          if (!text) throw new Error('Gemini nevrátil žádný text (možná blokovaný obsah).');
          return parseArray(text);
        },
      };
    }
    case 'deepl': {
      if (!s.deeplKey) throw new Error('Chybí API klíč pro DeepL (Nastavení).');
      const host = s.deeplKey.trim().endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';
      return {
        maxChars: 25000,
        maxItems: 50,
        async translate(texts, signal) {
          const j = await httpJson(f, `https://${host}/v2/translate`, {
            method: 'POST',
            signal,
            headers: { 'content-type': 'application/json', authorization: `DeepL-Auth-Key ${s.deeplKey!.trim()}` },
            body: JSON.stringify({ text: texts, target_lang: L.deepl, preserve_formatting: true }),
          }, 'DeepL');
          return (j.translations as any[]).map((t) => t.text as string);
        },
      };
    }
    case 'openai': {
      if (!s.openaiKey) throw new Error('Chybí API klíč (Nastavení → OpenRouter / OpenAI-kompatibilní).');
      const base = (s.openaiBase || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
      const model = s.openaiModel || 'deepseek/deepseek-chat';
      return {
        maxChars: 8000,
        maxItems: 60,
        async translate(texts, signal) {
          const j = await httpJson(f, `${base}/chat/completions`, {
            method: 'POST',
            signal,
            headers: { 'content-type': 'application/json', authorization: `Bearer ${s.openaiKey!.trim()}` },
            body: JSON.stringify({
              model,
              max_tokens: 8000,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: `${SYSTEM(L.english)} Answer as JSON: {"translations": [...]}` },
                { role: 'user', content: JSON.stringify(texts) },
              ],
            }),
          }, 'OpenRouter');
          return parseArray(j.choices?.[0]?.message?.content ?? '');
        },
      };
    }
  }
}

// ------------------------------------------------------------ překlad celé knihy
export interface Progress {
  done: number;
  total: number;
  message: string;
}

type TextRef = { get: () => string; set: (v: string) => void };

export async function translateBook(
  book: Book,
  tr: Translator,
  target: string,
  onProgress: (p: Progress) => void,
  signal?: AbortSignal,
): Promise<Book> {
  const out: Book = { ...book, language: target, chapters: book.chapters.map((c) => ({ title: c.title, blocks: c.blocks.map((b) => ({ ...b }) as Block) })) };
  const refs: TextRef[] = [{ get: () => out.title, set: (v) => (out.title = v) }];
  for (const ch of out.chapters) {
    refs.push({ get: () => ch.title, set: (v) => (ch.title = v) });
    for (const b of ch.blocks) if (b.type === 'p' || b.type === 'h') refs.push({ get: () => b.text, set: (v) => (b.text = v) });
  }
  const total = refs.reduce((a, r) => a + r.get().length, 0);
  let done = 0;
  // dávky podle délky; příliš dlouhý odstavec se rozdělí na věty
  let batch: TextRef[] = [];
  let size = 0;
  const run = async (items: TextRef[]) => {
    if (signal?.aborted) throw new Error('Zastaveno.');
    const texts = items.map((r) => r.get());
    let res: string[] | null = null;
    for (let attempt = 0; attempt < 3 && !res; attempt++) {
      try {
        const r = await tr.translate(texts, signal);
        if (r.length === texts.length) res = r;
        else if (items.length > 1) {
          const half = Math.ceil(items.length / 2);
          await run(items.slice(0, half));
          await run(items.slice(half));
          return;
        }
      } catch (e: any) {
        if (signal?.aborted || attempt === 2 || /klíč|kredit|401|402|403/.test(String(e?.message))) throw e;
        await new Promise((ok) => setTimeout(ok, 1500 * (attempt + 1)));
      }
    }
    if (!res) throw new Error('Překlad se nepodařil.');
    items.forEach((r, i) => r.set(res![i] || r.get()));
    done += texts.reduce((a, t) => a + t.length, 0);
    onProgress({ done, total, message: `Přeloženo ${Math.round((done / Math.max(1, total)) * 100)} %` });
  };
  for (const r of refs) {
    const t = r.get();
    if (!t.trim()) continue;
    if (t.length > tr.maxChars) {
      if (batch.length) await run(batch);
      batch = [];
      size = 0;
      // dlouhý odstavec po větách
      const sentences = t.match(/[^.!?…]+[.!?…]+["“”»«]*\s*|[^.!?…]+$/g) ?? [t];
      const pieces: string[] = [];
      let cur = '';
      for (const sn of sentences) {
        if ((cur + sn).length > tr.maxChars && cur) {
          pieces.push(cur);
          cur = '';
        }
        cur += sn;
      }
      if (cur) pieces.push(cur);
      const parts = pieces.map((p) => ({ v: p }));
      await run(parts.map((p) => ({ get: () => p.v, set: (v: string) => (p.v = v) })));
      r.set(parts.map((p) => p.v.trim()).join(' '));
      continue;
    }
    if (size + t.length > tr.maxChars || batch.length >= tr.maxItems) {
      await run(batch);
      batch = [];
      size = 0;
    }
    batch.push(r);
    size += t.length;
  }
  if (batch.length) await run(batch);
  onProgress({ done: total, total, message: 'Hotovo' });
  return out;
}
