"""CI: obálka a obrázek – EPUB a MOBI vlastním kódem (obálka jako obálka e-knihy), AZW3 přes Calibre."""
import base64
import io
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from PIL import Image  # noqa: E402

import book_writer as bw  # noqa: E402

cal = sys.argv[1] if len(sys.argv) > 1 else None
b = io.BytesIO()
Image.new("RGB", (600, 900), "red").save(b, "JPEG")
p = {"description": "x", "words": 100, "outline": {"title": "Kniha", "chapters": [{"title": "Jedna", "summary": ""}]},
     "chapters": [{"text": "x", "html": '<p>Ahoj</p><p><img src="obr.jpg" width="400" /></p>', "summary": ""}],
     "images": {"obr.jpg": base64.b64encode(b.getvalue()).decode()}, "cover": "obr.jpg"}
e = bw.save_as(p, "cover_out/kniha.epub", print, cal)
opf = zipfile.ZipFile(e).read("OEBPS/content.opf").decode()
assert 'properties="cover-image"' in opf, "EPUB nemá obálku"
m = bw.save_as(p, "cover_out/kniha.mobi", print, cal)
assert Path(m).read_bytes()[60:68] == b"BOOKMOBI"
if cal:
    a = bw.save_as(p, "cover_out/kniha.azw3", print, cal)
    assert Path(a).stat().st_size > 1000, "AZW3 nevzniklo"
print("Obálka OK:", e, m)
