// Pomocný „test“: když je nastavené EXPORT_DIR, uloží ukázkové soubory pro kontrolu cizími nástroji.
import { test } from 'node:test';
import { writeFileSync } from 'node:fs';
import { addImage, emptyBook, insertImage } from '../src/core/book';
import { writeBook } from '../src/core/formats';

test('export ukázek', { skip: !process.env.EXPORT_DIR }, async () => {
  const b = emptyBook('Strážce majáku');
  b.author = 'Jan Novák';
  b.chapters = ['Bouře', 'Mapa', 'Návrat'].map((t, i) => ({ title: t, blocks: Array.from({ length: 40 }, (_, k) => ({ type: 'p' as const, text: `Kapitola ${i + 1}, odstavec ${k + 1}: Příliš žluťoučký kůň úpěl ďábelské ódy. ` .repeat(4) })) }));
  const jpg = require('node:fs').readFileSync(process.env.EXPORT_DIR + '/in.jpg');
  b.cover = addImage(b, new Uint8Array(jpg));
  insertImage(b, 1, addImage(b, new Uint8Array(jpg)), 2);
  for (const f of ['epub', 'mobi', 'docx', 'pdb'] as const) writeFileSync(`${process.env.EXPORT_DIR}/kniha.${f}`, await writeBook(b, f));
});
