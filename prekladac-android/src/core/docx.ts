// DOCX (Word) – zápis i čtení: nadpisy kapitol, odstavce, obrázky, zalomení stránek.
import JSZip from 'jszip';
import type { Block, Book } from './book';
import { emptyBook, extFromMime, mimeFromName, sniffMime } from './book';
import { decodeAny, decodeEntities, escapeXml } from './bytes';
import { chaptersFromBlocks, TOC_NAMES, cleanTitle } from './chapters';

/** Rozměry obrázku v pixelech (JPEG, PNG, GIF, BMP) – bez dekódování. */
export function imageSize(d: Uint8Array): { w: number; h: number } {
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
  try {
    if (d[0] === 0x89 && d[1] === 0x50) return { w: dv.getUint32(16), h: dv.getUint32(20) };
    if (d[0] === 0x47 && d[1] === 0x49) return { w: dv.getUint16(6, true), h: dv.getUint16(8, true) };
    if (d[0] === 0x42 && d[1] === 0x4d) return { w: dv.getInt32(18, true), h: Math.abs(dv.getInt32(22, true)) };
    if (d[0] === 0xff && d[1] === 0xd8) {
      let p = 2;
      while (p + 9 < d.length) {
        if (d[p] !== 0xff) { p++; continue; }
        const marker = d[p + 1];
        const len = dv.getUint16(p + 2);
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc)
          return { w: dv.getUint16(p + 7), h: dv.getUint16(p + 5) };
        p += 2 + len;
      }
    }
  } catch {
    /* neznámý formát */
  }
  return { w: 800, h: 600 };
}

const W_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/><w:sz w:val="24"/><w:lang w:val="cs-CZ"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:jc w:val="both"/><w:ind w:firstLine="340"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/><w:ind w:firstLine="0"/><w:spacing w:before="2400" w:after="480"/></w:pPr><w:rPr><w:b/><w:sz w:val="56"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:jc w:val="center"/><w:ind w:firstLine="0"/><w:spacing w:before="480" w:after="360"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:ind w:firstLine="0"/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
</w:styles>`;

export async function writeDocx(book: Book): Promise<Uint8Array> {
  const zip = new JSZip();
  const rels: string[] = ['<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'];
  const exts = new Set<string>();
  const imgRel: Record<string, string> = {};
  let pid = 0;
  const run = (t: string) => {
    const lines = t.split('\n');
    return lines.map((l, i) => `<w:r><w:t xml:space="preserve">${escapeXml(l)}</w:t></w:r>${i < lines.length - 1 ? '<w:r><w:br/></w:r>' : ''}`).join('');
  };
  const para = (t: string, style?: string) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${run(t)}</w:p>`;
  const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  const image = (name: string, widthPx?: number) => {
    const im = book.images[name];
    if (!im) return '';
    if (!imgRel[name]) {
      const ext = extFromMime(im.mime);
      exts.add(ext);
      const id = `rIdImg${Object.keys(imgRel).length + 1}`;
      zip.file(`word/media/${id}.${ext}`, im.data);
      rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${id}.${ext}"/>`);
      imgRel[name] = id;
    }
    const { w, h } = imageSize(im.data);
    const maxIn = 6.0;
    const inches = Math.min(maxIn, widthPx ? (widthPx / 800) * maxIn : w / 96);
    const cx = Math.round(inches * 914400);
    const cy = Math.round(cx * (h / Math.max(1, w)));
    pid++;
    return `<w:p><w:pPr><w:jc w:val="center"/><w:ind w:firstLine="0"/></w:pPr><w:r><w:drawing><wp:inline><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${pid}" name="Obrázek ${pid}"/>` +
      `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${pid}" name="obr${pid}"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="${imgRel[name]}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
  };
  const body: string[] = [];
  if (book.cover && book.images[book.cover]) body.push(image(book.cover), pageBreak);
  body.push(para(book.title, 'Title'));
  if (book.author) body.push(`<w:p><w:pPr><w:jc w:val="center"/><w:ind w:firstLine="0"/></w:pPr>${run(book.author)}</w:p>`);
  book.chapters.forEach((ch, i) => {
    body.push(pageBreak, para(`${i + 1}. ${ch.title}`, 'Heading1'));
    for (const b of ch.blocks) {
      if (b.type === 'p') body.push(para(b.text));
      else if (b.type === 'h') body.push(para(b.text, 'Heading2'));
      else if (b.type === 'pb') body.push(pageBreak);
      else if (b.type === 'img') body.push(image(b.name, b.width));
    }
  });
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W_NS}><w:body>${body.join('')}` +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>');
  zip.file('word/styles.xml', STYLES);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`);
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
  zip.file('docProps/core.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
    `xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${escapeXml(book.title)}</dc:title><dc:creator>${escapeXml(book.author)}</dc:creator><dc:language>${book.language}</dc:language></cp:coreProperties>`);
  const mimeOf: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp' };
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    [...exts].map((e) => `<Default Extension="${e}" ContentType="${mimeOf[e]}"/>`).join('') +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>');
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

// ------------------------------------------------------------ čtení
export async function readDocx(data: Uint8Array, fileName: string): Promise<Book> {
  const zip = await JSZip.loadAsync(data);
  const get = async (p: string) => {
    const f = zip.file(p);
    return f ? decodeAny(await f.async('uint8array')) : '';
  };
  const doc = await get('word/document.xml');
  if (!doc) throw new Error('Soubor není dokument Word (DOCX).');
  const relsXml = await get('word/_rels/document.xml.rels');
  const rels: Record<string, string> = {};
  for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(m[0])?.[1];
    const target = /Target="([^"]+)"/.exec(m[0])?.[1];
    if (id && target) rels[id] = target.startsWith('/') ? target.slice(1) : `word/${target}`;
  }
  const core = await get('docProps/core.xml');
  const meta = (tag: string) => decodeEntities(new RegExp(`<dc:${tag}[^>]*>([\\s\\S]*?)</dc:${tag}>`).exec(core)?.[1] ?? '').trim();
  const book = emptyBook(meta('title') || fileName.replace(/\.[^.]+$/, ''));
  book.author = meta('creator');
  book.source = fileName;
  const imgs: Record<string, string> = {};
  const blocks: Block[] = [];
  let title = '';
  let inToc = false;
  for (const pm of doc.matchAll(/<w:p\b[\s\S]*?<\/w:p>|<w:p\b[^>]*\/>/g)) {
    const p = pm[0];
    const style = (/<w:pStyle w:val="([^"]+)"/.exec(p)?.[1] ?? '').toLowerCase();
    if (/<w:br w:type="page"\/>/.test(p) || /<w:pageBreakBefore\/>/.test(p)) blocks.push({ type: 'pb' });
    for (const im of p.matchAll(/r:embed="([^"]+)"/g)) {
      const path = rels[im[1]];
      if (!path) continue;
      if (!imgs[path]) {
        const f = zip.file(path);
        if (!f) continue;
        const d = await f.async('uint8array');
        const mime = sniffMime(d) || mimeFromName(path);
        const name = `img${Object.keys(imgs).length + 1}.${extFromMime(mime)}`;
        book.images[name] = { data: d, mime };
        imgs[path] = name;
      }
      blocks.push({ type: 'img', name: imgs[path] });
    }
    let text = '';
    for (const t of p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br(?![^>]*type="page")[^>]*\/>/g)) {
      if (t[0].startsWith('<w:tab')) text += '\t';
      else if (t[0].startsWith('<w:br')) text += '\n';
      else text += decodeEntities(t[1]);
    }
    text = text.replace(/[ \t]+/g, ' ').trim();
    if (style === 'title') {
      title = title || text;
      continue;
    }
    const hm = /^(?:heading|nadpis)\s?([1-6])$/.exec(style.replace(/\s/g, ' ')) ?? /^(?:heading|nadpis)([1-6])$/.exec(style);
    if (hm) {
      if (TOC_NAMES.has(text.toLowerCase())) {
        inToc = true;
        continue;
      }
      inToc = false;
      if (text) blocks.push({ type: 'h', text: cleanTitle(text), level: parseInt(hm[1], 10) });
      continue;
    }
    if (inToc || /^toc/.test(style) || !text) continue;
    blocks.push({ type: 'p', text });
  }
  if (title && book.title === fileName.replace(/\.[^.]+$/, '')) book.title = title;
  // obálka: obrázek úplně na začátku před titulem
  if (blocks[0]?.type === 'img' && blocks[1]?.type === 'pb') {
    book.cover = blocks[0].name;
    blocks.shift();
  }
  book.chapters = chaptersFromBlocks(blocks, book.title);
  return book;
}
