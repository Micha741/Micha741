// EPUB 3 (s toc.ncx pro starší čtečky) – zápis i čtení.
import JSZip from 'jszip';
import type { Book } from './book';
import { emptyBook, extFromMime, sniffMime, mimeFromName } from './book';
import { decodeAny, decodeEntities, escapeXml } from './bytes';
import { chaptersFromBlocks } from './chapters';
import { htmlToBlocks } from './html';

const CSS = `body{font-family:serif;line-height:1.5;margin:0 4%}h1,h2{text-align:center;margin:1.2em 0 .8em}
p{text-indent:1.2em;margin:0 0 .35em;text-align:justify}p.img{text-indent:0;text-align:center}img{max-width:100%}
.title{text-align:center;margin-top:30%}.author{text-align:center;font-size:1.2em;text-indent:0}`;

function xhtml(title: string, body: string, lang: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}" xml:lang="${lang}">` +
    `<head><meta charset="utf-8"/><title>${escapeXml(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head><body>${body}</body></html>`;
}

export async function writeEpub(book: Book): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
    '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  const lang = book.language || 'cs';
  const id = `urn:uuid:${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  const manifest: string[] = ['<item id="css" href="style.css" media-type="text/css"/>', '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'];
  const spine: string[] = [];
  zip.file('OEBPS/style.css', CSS);
  const imgId: Record<string, string> = {};
  let k = 0;
  let coverId = '';
  const used = new Set<string>();
  for (const ch of book.chapters) for (const b of ch.blocks) if (b.type === 'img') used.add(b.name);
  if (book.cover) used.add(book.cover);
  for (const n of used) {
    const im = book.images[n];
    if (!im) continue;
    const file = `images/${n.replace(/[^A-Za-z0-9._-]/g, '_')}`;
    imgId[n] = file;
    zip.file(`OEBPS/${file}`, im.data);
    if (n === book.cover) coverId = `img${k + 1}`;
    manifest.push(`<item id="img${++k}" href="${file}" media-type="${im.mime}"${n === book.cover ? ' properties="cover-image"' : ''}/>`);
  }
  if (book.cover && imgId[book.cover]) {
    zip.file('OEBPS/cover.xhtml', xhtml('Obálka', `<div style="text-align:center"><img src="${imgId[book.cover]}" alt="Obálka" style="max-height:100%"/></div>`, lang));
    manifest.push('<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>');
    spine.push('<itemref idref="cover" linear="no"/>');
  }
  zip.file('OEBPS/title.xhtml', xhtml(book.title, `<h1 class="title">${escapeXml(book.title)}</h1>${book.author ? `<p class="author">${escapeXml(book.author)}</p>` : ''}`, lang));
  manifest.push('<item id="titlepage" href="title.xhtml" media-type="application/xhtml+xml"/>');
  spine.push('<itemref idref="titlepage"/>');
  const navItems: string[] = [];
  const ncxItems: string[] = [];
  book.chapters.forEach((ch, i) => {
    const name = `ch${String(i + 1).padStart(3, '0')}.xhtml`;
    const head = `${i + 1}. ${ch.title}`;
    let body = `<h2 id="c${i + 1}">${escapeXml(head)}</h2>`;
    for (const b of ch.blocks) {
      if (b.type === 'p') body += `<p>${escapeXml(b.text).replace(/\n/g, '<br/>')}</p>`;
      else if (b.type === 'h') body += `<h3>${escapeXml(b.text)}</h3>`;
      else if (b.type === 'pb') body += '<div style="page-break-after:always"></div>';
      else if (b.type === 'img' && imgId[b.name]) {
        const w = b.width ? ` style="width:${Math.min(100, Math.round((b.width / 800) * 100))}%"` : '';
        body += `<p class="img"><img src="${imgId[b.name]}" alt=""${w}/></p>`;
      }
    }
    zip.file(`OEBPS/${name}`, xhtml(head, body, lang));
    manifest.push(`<item id="c${i + 1}" href="${name}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="c${i + 1}"/>`);
    navItems.push(`<li><a href="${name}">${escapeXml(head)}</a></li>`);
    ncxItems.push(`<navPoint id="n${i + 1}" playOrder="${i + 1}"><navLabel><text>${escapeXml(head)}</text></navLabel><content src="${name}"/></navPoint>`);
  });
  zip.file('OEBPS/nav.xhtml', xhtml('Obsah', `<nav epub:type="toc" id="toc"><h2>Obsah</h2><ol>${navItems.join('')}</ol></nav>`, lang));
  zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="utf-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${id}"/></head>` +
    `<docTitle><text>${escapeXml(book.title)}</text></docTitle><navMap>${ncxItems.join('')}</navMap></ncx>`);
  const modified = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${lang}">` +
    `<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">${id}</dc:identifier><dc:title>${escapeXml(book.title)}</dc:title>` +
    `<dc:language>${lang}</dc:language>${book.author ? `<dc:creator>${escapeXml(book.author)}</dc:creator>` : ''}<meta property="dcterms:modified">${modified}</meta>` +
    `${book.cover && imgId[book.cover] ? `<meta name="cover" content="${coverId}"/>` : ''}</metadata>` +
    `<manifest>${manifest.join('')}</manifest><spine toc="ncx">${spine.join('')}</spine>` +
    `${book.cover && imgId[book.cover] ? '<guide><reference type="cover" title="Obálka" href="cover.xhtml"/></guide>' : ''}</package>`);
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', mimeType: 'application/epub+zip' });
}

// ------------------------------------------------------------ čtení
function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag);
  return m ? decodeEntities(m[2] ?? m[3] ?? '') : null;
}

function resolve(base: string, href: string): string {
  const clean = decodeURIComponent(href.split('#')[0]);
  const parts = (clean.startsWith('/') ? [] : base.split('/').slice(0, -1)).concat(clean.replace(/^\//, '').split('/'));
  const out: string[] = [];
  for (const p of parts) {
    if (p === '..') out.pop();
    else if (p && p !== '.') out.push(p);
  }
  return out.join('/');
}

export async function readEpub(data: Uint8Array, fileName: string): Promise<Book> {
  const zip = await JSZip.loadAsync(data);
  const text = async (path: string) => {
    const f = zip.file(path);
    if (!f) throw new Error(`V EPUB chybí ${path}`);
    return decodeAny(await f.async('uint8array'));
  };
  const container = await text('META-INF/container.xml');
  const opfPath = attr(/<rootfile\b[^>]*>/i.exec(container)?.[0] ?? '', 'full-path');
  if (!opfPath) throw new Error('EPUB nemá popis obsahu (content.opf).');
  const opf = await text(opfPath);
  const tagText = (name: string) => {
    const m = new RegExp(`<(?:dc:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:dc:)?${name}>`, 'i').exec(opf);
    return m ? decodeEntities(m[1].replace(/<[^>]+>/g, '')).trim() : '';
  };
  const book = emptyBook(tagText('title') || fileName.replace(/\.[^.]+$/, ''));
  book.author = tagText('creator');
  book.language = (tagText('language') || 'cs').slice(0, 2).toLowerCase();
  book.source = fileName;
  const items: Record<string, { href: string; type: string; props: string }> = {};
  for (const m of opf.matchAll(/<item\b[^>]*>/gi)) {
    const t = m[0];
    const idv = attr(t, 'id');
    if (idv) items[idv] = { href: resolve(opfPath, attr(t, 'href') ?? ''), type: attr(t, 'media-type') ?? '', props: attr(t, 'properties') ?? '' };
  }
  const loaded: Record<string, string> = {};
  const loadImage = async (path: string): Promise<string | null> => {
    if (loaded[path]) return loaded[path];
    const f = zip.file(path);
    if (!f) return null;
    const d = await f.async('uint8array');
    const mime = sniffMime(d) || mimeFromName(path);
    const name = `img${Object.keys(loaded).length + 1}.${extFromMime(mime)}`;
    book.images[name] = { data: d, mime };
    loaded[path] = name;
    return name;
  };
  // obálka
  const coverItem = Object.values(items).find((i) => i.props.includes('cover-image')) ??
    items[attr(/<meta\b[^>]*name="cover"[^>]*>/i.exec(opf)?.[0] ?? '', 'content') ?? ''];
  if (coverItem && coverItem.type.startsWith('image/')) book.cover = (await loadImage(coverItem.href)) ?? undefined;
  const allBlocks = [];
  for (const m of opf.matchAll(/<itemref\b[^>]*>/gi)) {
    const it = items[attr(m[0], 'idref') ?? ''];
    if (!it || it.props.includes('nav') || !/html|xml/.test(it.type)) continue;
    let html: string;
    try {
      html = await text(it.href);
    } catch {
      continue;
    }
    const srcs: string[] = [];
    const blocks = htmlToBlocks(html, { image: (src) => { srcs.push(resolve(it.href, src)); return `@@${srcs.length - 1}`; } });
    for (const b of blocks) {
      if (b.type === 'img') {
        const n = await loadImage(srcs[parseInt(b.name.slice(2), 10)]);
        if (!n || n === book.cover) continue;
        b.name = n;
      }
      allBlocks.push(b);
    }
    allBlocks.push({ type: 'pb' } as const);
  }
  book.chapters = chaptersFromBlocks(allBlocks, book.title);
  return book;
}
