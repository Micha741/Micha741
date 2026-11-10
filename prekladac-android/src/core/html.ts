// Jednoduchý převod HTML/XHTML (EPUB, MOBI, kapitoly z editoru) na bloky knihy – bez DOM.
import type { Block } from './book';
import { decodeEntities } from './bytes';

const BLOCK_TAGS = new Set(['p', 'div', 'li', 'blockquote', 'pre', 'section', 'article', 'td', 'dd', 'dt', 'figcaption', 'tr', 'body', 'center']);
const SKIP_TAGS = new Set(['script', 'style', 'head', 'title', 'svg', 'nav']);

export interface HtmlBlocksOptions {
  /** převede atribut obrázku (src nebo recindex) na název obrázku v knize; null = obrázek vynechat */
  image?: (src: string, recindex: string | null) => string | null;
}

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return m ? decodeEntities(m[2] ?? m[3] ?? m[4] ?? '') : null;
}

export function htmlToBlocks(html: string, opts: HtmlBlocksOptions = {}): Block[] {
  const blocks: Block[] = [];
  let buf = '';
  let heading = 0;
  let skip = 0;
  const flush = () => {
    const text = buf.replace(/[ \t\r\n ]+/g, (m) => (m.includes(' ') ? '\n' : ' ')).replace(/ *\n */g, '\n').trim();
    buf = '';
    if (!text) return;
    if (heading) blocks.push({ type: 'h', text, level: heading });
    else blocks.push({ type: 'p', text });
  };
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<[^>]+>|[^<]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tok = m[0];
    if (tok.startsWith('<!--') || tok.startsWith('<![CDATA') || tok.startsWith('<?') || tok.startsWith('<!')) continue;
    if (tok[0] !== '<') {
      if (!skip) buf += decodeEntities(tok);
      continue;
    }
    const tm = /^<\s*(\/)?\s*([a-zA-Z0-9:]+)/.exec(tok);
    if (!tm) continue;
    const closing = !!tm[1];
    const name = tm[2].toLowerCase().replace(/^.*:/, (p) => (p === 'mbp:' ? 'mbp:' : ''));
    const full = tm[2].toLowerCase();
    if (SKIP_TAGS.has(name)) {
      if (!tok.endsWith('/>')) skip += closing ? -1 : 1;
      if (skip < 0) skip = 0;
      continue;
    }
    if (skip) continue;
    if (full === 'mbp:pagebreak' || (!closing && /page-break-(before|after)\s*:\s*always/i.test(tok))) {
      flush();
      if (blocks.length && blocks[blocks.length - 1].type !== 'pb') blocks.push({ type: 'pb' });
      continue;
    }
    if (name === 'br') {
      buf += ' ';
      continue;
    }
    if (name === 'img' || name === 'image') {
      if (closing) continue;
      const src = attr(tok, 'src') ?? attr(tok, 'xlink:href') ?? attr(tok, 'href') ?? '';
      const rec = attr(tok, 'recindex');
      const nm = opts.image ? opts.image(src, rec) : src || null;
      if (nm) {
        flush();
        const w = parseInt(attr(tok, 'width') ?? '', 10);
        blocks.push(Number.isFinite(w) && w > 0 ? { type: 'img', name: nm, width: w } : { type: 'img', name: nm });
      }
      continue;
    }
    const h = /^h([1-6])$/.exec(name);
    if (h) {
      flush();
      heading = closing ? 0 : parseInt(h[1], 10);
      continue;
    }
    if (BLOCK_TAGS.has(name)) flush();
  }
  flush();
  return blocks.filter((b, i, a) => !(b.type === 'pb' && (i === 0 || i === a.length - 1)));
}
