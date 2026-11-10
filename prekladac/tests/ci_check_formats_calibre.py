"""CI: vzájemná kontrola s Calibre – Calibre přečte naše soubory a my přečteme soubory z Calibre.

Použití: python tests/ci_check_formats_calibre.py "C:\\Program Files\\Calibre2\\ebook-convert.exe"
"""
import io
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import ebook  # noqa: E402

CAL = sys.argv[1]
WORDS = ["Žluťoučký", "Citát na konec", "Na půdě ležela mapa"]


def sample():
    from PIL import Image
    b = io.BytesIO()
    Image.new("RGB", (300, 450), "navy").save(b, "JPEG")
    book = ebook.RichBook(title="Strážce majáku", author="Jan Novák")
    book.cover = book.add_image(b.getvalue())
    b2 = io.BytesIO()
    Image.new("RGB", (200, 120), "green").save(b2, "PNG")
    pic = book.add_image(b2.getvalue())
    book.chapters = [
        ebook.Chapter("Bouře", "<h2>1. Bouře</h2><p>Bouře <b>zuřila</b> nad <i>mořem</i>.</p><p>Žluťoučký kůň úpěl.</p>"),
        ebook.Chapter("Mapa", f'<h2>2. Mapa</h2><p>Na půdě ležela mapa.</p><p style="text-align:center"><img src="{pic}"/></p>'),
        ebook.Chapter("Návrat", "<h2>3. Návrat</h2><blockquote><p>Citát na konec.</p></blockquote>"),
    ]
    return book


def calibre(src, dst):
    r = subprocess.run([CAL, str(src), str(dst)], capture_output=True, text=True, errors="replace")
    if r.returncode != 0 or not Path(dst).exists():
        raise RuntimeError(f"Calibre {src.name} → {Path(dst).name} selhal:\n{(r.stderr or r.stdout)[-800:]}")


errors = []
with tempfile.TemporaryDirectory() as tmp:
    tmp = Path(tmp)
    book = sample()
    # 1) naše soubory → Calibre je musí přečíst
    for fmt in ("epub", "mobi", "rtf", "fb2", "odt", "htmlz", "docx", "pdb", "txt"):
        ours = tmp / f"nase.{fmt}"
        ebook.write_book(book, ours)
        out = tmp / f"nase_{fmt}.txt"
        try:
            calibre(ours, out)
            text = out.read_text(encoding="utf-8", errors="replace")
            missing = [w for w in WORDS if w not in text]
            print(f"Calibre čte náš {fmt}: {'OK' if not missing else 'chybí ' + str(missing)}")
            if missing:
                errors.append(f"{fmt}: Calibre nenašel {missing}")
        except RuntimeError as e:
            errors.append(str(e))
    # 2) soubory z Calibre → musíme je přečíst my
    src = tmp / "nase.epub"
    for fmt in ("azw3", "mobi", "rtf", "fb2", "htmlz", "docx", "pdb", "odt"):
        theirs = tmp / f"calibre.{fmt}"
        try:
            calibre(src, theirs)
        except RuntimeError as e:
            print(f"(Calibre neumí zapsat {fmt}: přeskočeno)" if fmt == "odt" else e)
            continue
        try:
            back = ebook.read_book(theirs)
            text = " ".join(ebook.plain_text(c.html) for c in back.chapters)
            missing = [w for w in WORDS if w not in text]
            print(f"Čteme {fmt} z Calibre: {len(back.chapters)} kapitol, {len(back.images)} obrázků, "
                  f"{'OK' if not missing else 'chybí ' + str(missing)}")
            if missing:
                errors.append(f"{fmt} z Calibre: chybí {missing}")
        except Exception as e:  # noqa: BLE001
            errors.append(f"{fmt} z Calibre: {e}")
if errors:
    sys.exit("\n".join(errors))
print("Vše v pořádku.")
