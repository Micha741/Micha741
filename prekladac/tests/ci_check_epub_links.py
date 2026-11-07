"""Kontrola pro CI: kniha s obsahem a odkazy převedená přes Calibre do EPUB musí mít funkční odkazy.

Použití: python tests/ci_check_epub_links.py <cesta k ebook-convert.exe>
"""

import re
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import book_writer as bw  # noqa: E402
from test_book_writer import OUTLINE  # noqa: E402

text = "Text kapitoly.\n\n[[STRANA]]\n\nDalší odstavec."
project = {"language": "čeština", "outline": OUTLINE, "chapters": [{"text": text, "summary": ""}] * 3}
files = bw.export(project, "book_out", ["epub"], print, sys.argv[1])
with zipfile.ZipFile(files[0]) as z:
    html = " ".join(z.read(n).decode("utf-8", "replace") for n in z.namelist() if n.endswith((".html", ".xhtml")))
links = re.findall(r'href="[^"]*#[^"]+"', html)
print(files[0], len(links), links[:3])
assert len(links) >= 3, "odkazy v obsahu po převodu do EPUB chybí"
assert "Další odstavec." in html
