// Otevření knihy z libovolného podporovaného formátu a uložení do zvoleného formátu.
import { sniffBookExt } from './library';
import { readPdf } from './pdfread';
import type { Book } from './book';
import { emptyBook, fromProject, toProject } from './book';
import { decodeAny, utf8Encode } from './bytes';
import { chaptersFromBlocks, chaptersFromText } from './chapters';
import { readDocx, writeDocx } from './docx';
import { readEpub, writeEpub } from './epub';
import { htmlToBlocks } from './html';
import { readMobiOrPdb, writeMobi, writePalmDoc } from './mobi';

export const INPUT_EXT = ['pdf', 'epub', 'docx', 'txt', 'md', 'mobi', 'prc', 'azw', 'pdb', 'json', 'html', 'htm'];

export type OutputFormat = 'epub' | 'mobi' | 'pdb' | 'pdf' | 'docx' | 'txt' | 'kniha';

export const OUTPUT_FORMATS: { id: OutputFormat; label: string; ext: string; mime: string; hint: string }[] = [
  { id: 'epub', label: 'EPUB', ext: 'epub', mime: 'application/epub+zip', hint: 'čtečky, telefony, Kindle (Send to Kindle)' },
  { id: 'mobi', label: 'MOBI', ext: 'mobi', mime: 'application/x-mobipocket-ebook', hint: 'Kindle, starší čtečky' },
  { id: 'pdf', label: 'PDF', ext: 'pdf', mime: 'application/pdf', hint: 'tisk, počítač' },
  { id: 'docx', label: 'DOCX', ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', hint: 'Word, další úpravy' },
  { id: 'pdb', label: 'PDB', ext: 'pdb', mime: 'application/vnd.palm', hint: 'PalmDoc, jen text' },
  { id: 'txt', label: 'TXT', ext: 'txt', mime: 'text/plain', hint: 'prostý text' },
  { id: 'kniha', label: 'Projekt', ext: 'kniha.json', mime: 'application/json', hint: 'pro Překladač na počítači' },
];

export function extOf(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith('.kniha.json')) return 'json';
  return n.split('.').pop() ?? '';
}

export async function readBook(data: Uint8Array, fileName: string): Promise<Book> {
  // soubor z jiné aplikace nebo z odkazu nemusí mít příponu – typ se pozná podle obsahu
  if (!INPUT_EXT.includes(extOf(fileName))) fileName = `${fileName.replace(/\.[^.]*$/, '') || 'kniha'}.${sniffBookExt(data)}`;
  const ext = extOf(fileName);
  const base = fileName.replace(/\.kniha\.json$/i, '').replace(/\.[^.]+$/, '');
  if (ext === 'epub' || (data[0] === 0x50 && data[1] === 0x4b && ext !== 'docx' && /mimetypeapplication\/epub/.test(String.fromCharCode(...data.subarray(30, 70))))) return readEpub(data, fileName);
  if (ext === 'docx') return readDocx(data, fileName);
  if (ext === 'mobi' || ext === 'prc' || ext === 'azw' || ext === 'pdb') return readMobiOrPdb(data, fileName);
  if (ext === 'pdf') return readPdf(data, fileName);
  if (ext === 'json') return fromProject(JSON.parse(decodeAny(data)), (h) => htmlToBlocks(h));
  if (ext === 'html' || ext === 'htm') {
    const book = emptyBook(base);
    book.chapters = chaptersFromBlocks(htmlToBlocks(decodeAny(data)), base);
    book.source = fileName;
    return book;
  }
  if (ext === 'txt' || ext === 'md' || !ext) {
    const { title, chapters } = chaptersFromText(decodeAny(data), base);
    const book = emptyBook(title || base);
    book.chapters = chapters;
    book.source = fileName;
    return book;
  }
  throw new Error(`Formát .${ext} telefon neumí otevřít. Umí EPUB, PDF, DOCX, TXT, MOBI, PDB a projekt .kniha.json.`);
}

export function bookPlainText(book: Book): string {
  const lines = [book.title];
  if (book.author) lines.push(book.author);
  book.chapters.forEach((c, i) => {
    lines.push('', '', `${i + 1}. ${c.title}`, '');
    const paras: string[] = [];
    for (const b of c.blocks) {
      if (b.type === 'p' || b.type === 'h') paras.push(b.text);
      else if (b.type === 'img') paras.push('[obrázek]');
    }
    lines.push(paras.join('\n\n'));
  });
  return lines.join('\n').trim() + '\n';
}

/** Zapíše knihu; PDF neumí (to dělá telefon přes tisk HTML – viz pdfHtml). */
export async function writeBook(book: Book, fmt: Exclude<OutputFormat, 'pdf'>): Promise<Uint8Array> {
  switch (fmt) {
    case 'epub': return writeEpub(book);
    case 'mobi': return writeMobi(book);
    case 'pdb': return writePalmDoc(book);
    case 'docx': return writeDocx(book);
    case 'txt': return utf8Encode(bookPlainText(book));
    case 'kniha': return utf8Encode(JSON.stringify(toProject(book), null, 2));
  }
}
