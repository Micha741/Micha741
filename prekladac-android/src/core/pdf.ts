// HTML knihy pro tisk do PDF (expo-print): obálka, titulní strana, obsah, kapitoly od nové stránky.
import { textCoverSvg, type Book } from './book';
import { escapeXml, toBase64, utf8Encode } from './bytes';

export function pdfHtml(book: Book): string {
  const img = (n: string, style = '') => {
    const im = book.images[n];
    return im ? `<img src="data:${im.mime};base64,${toBase64(im.data)}" style="${style}"/>` : '';
  };
  let body = '';
  if (book.cover && book.images[book.cover]) body += `<div class="cover">${img(book.cover, 'max-width:100%;max-height:96vh')}</div>`;
  else body += `<div class="cover"><img src="data:image/svg+xml;base64,${toBase64(utf8Encode(textCoverSvg(book.title, book.author)))}" style="max-width:100%;max-height:96vh"/></div>`;
  body = body.replace(/<div class="pb"><\/div>(\s*<p class="img">)/g, '$1');
  body += `<div class="titlepage"><h1>${escapeXml(book.title)}</h1>${book.author ? `<p class="author">${escapeXml(book.author)}</p>` : ''}</div>`;
  if (book.chapters.length > 1) {
    body += '<div class="toc"><h2>Obsah</h2>' + book.chapters.map((c, i) => `<p>${i + 1}. ${escapeXml(c.title)}</p>`).join('') + '</div>';
  }
  book.chapters.forEach((c, i) => {
    body += `<section><h2>${i + 1}. ${escapeXml(c.title)}</h2>`;
    for (const b of c.blocks) {
      if (b.type === 'p') body += `<p>${escapeXml(b.text).replace(/\n/g, '<br/>')}</p>`;
      else if (b.type === 'h') body += `<h3>${escapeXml(b.text)}</h3>`;
      else if (b.type === 'pb') body += '<div class="pb"></div>';
      else if (b.type === 'img') body += `<p class="img">${img(b.name, `width:${b.width ? Math.min(100, Math.round((b.width / 800) * 100)) : 80}%`)}</p>`;
    }
    body += '</section>';
  });
  return `<!DOCTYPE html><html lang="${book.language}"><head><meta charset="utf-8"/><style>
@page{size:A4;margin:22mm 20mm}
body{font-family:Georgia,'Times New Roman',serif;font-size:12pt;line-height:1.5;color:#111}
h1{font-size:28pt;text-align:center;margin-top:35%}h2{text-align:center;font-size:18pt;margin:0 0 1em}
.author{text-align:center;font-size:14pt;text-indent:0}
p{margin:0 0 .4em;text-indent:1.2em;text-align:justify}p.img{text-indent:0;text-align:center}
.cover,.titlepage,.toc,section{page-break-after:always}.cover{text-align:center}
.toc p{text-indent:0}.pb{page-break-after:always}section:last-child{page-break-after:auto}
</style></head><body>${body}</body></html>`;
}
