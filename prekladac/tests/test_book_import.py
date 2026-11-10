import json
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import book_import as bi  # noqa: E402
import book_writer as bw  # noqa: E402
from test_book_writer import OUTLINE  # noqa: E402

TEXTS = ["Bouře zuřila nad mořem.\n\nTomáš se díval z okna.", "Na půdě ležela stará mapa.",
         "Tajemství bylo odhaleno. Konec."]


def _project():
    return {"language": "čeština", "outline": json.loads(json.dumps(OUTLINE)), "words": 1000, "author": "Jan Novák",
            "chapters": [{"text": t, "summary": ""} for t in TEXTS]}


def _check(proj):
    assert [c["title"] for c in proj["outline"]["chapters"]] == ["Bouře", "Mapa", "Návrat"]
    assert [c["text"] for c in proj["chapters"]] == TEXTS
    assert proj["outline"]["title"] == "Strážce majáku"


def test_import_own_docx_export(tmp_path):
    f = tmp_path / "kniha.docx"
    bw.build_docx(_project(), f)                      # i s obsahem (Obsah se přeskočí)
    proj = bi.import_book(f)
    _check(proj)
    assert proj["author"] == "Jan Novák"


def test_import_own_txt_export_and_cp1250(tmp_path):
    f = tmp_path / "kniha.txt"
    f.write_text(bw.book_plain_text(_project()), encoding="utf-8")
    _check(bi.import_book(f))
    old = tmp_path / "stara.txt"                       # starší soubor v kódování Windows
    old.write_bytes("Moje kniha\n\nKapitola 1\n\nŽluťoučký kůň úpěl ďábelské ódy.\n".encode("cp1250"))
    proj = bi.import_book(old)
    assert proj["outline"]["title"] == "Moje kniha"
    assert proj["chapters"][0]["text"] == "Žluťoučký kůň úpěl ďábelské ódy."


def test_import_txt_without_chapters(tmp_path):
    f = tmp_path / "povidka.txt"
    f.write_text("Povídka\n\nPrvní odstavec.\n\nDruhý odstavec.\n", encoding="utf-8")
    proj = bi.import_book(f)
    assert len(proj["chapters"]) == 1 and proj["chapters"][0]["text"] == "První odstavec.\n\nDruhý odstavec."


def test_import_epub(tmp_path):
    f = tmp_path / "kniha.epub"
    with zipfile.ZipFile(f, "w") as z:
        z.writestr("mimetype", "application/epub+zip")
        z.writestr("META-INF/container.xml", '<?xml version="1.0"?><container><rootfiles>'
                   '<rootfile full-path="OEBPS/content.opf"/></rootfiles></container>')
        z.writestr("OEBPS/content.opf", '<?xml version="1.0"?><package xmlns:dc="http://purl.org/dc/elements/1.1/">'
                   '<metadata><dc:title>Strážce majáku</dc:title><dc:creator>Jan Novák</dc:creator></metadata>'
                   '<manifest><item id="t" href="titul.xhtml"/><item id="c1" href="c1.xhtml"/>'
                   '<item id="c2" href="text/c2.xhtml"/></manifest>'
                   '<spine><itemref idref="t"/><itemref idref="c1"/><itemref idref="c2"/></spine></package>')
        z.writestr("OEBPS/titul.xhtml", "<html><body><h1>Strážce majáku</h1></body></html>")
        z.writestr("OEBPS/c1.xhtml", "<html><body><h2>1. Bouře</h2><p>Bouře zuřila nad mořem a vlny "
                   "bily do skal.</p><p>Tomáš se díval z okna.</p></body></html>")
        z.writestr("OEBPS/text/c2.xhtml", "<html><body><h2>Mapa</h2><p>Na půdě ležela stará mapa "
                   "s tajemnými znaky.</p></body></html>")
    proj = bi.import_book(f)
    assert proj["outline"]["title"] == "Strážce majáku" and proj["author"] == "Jan Novák"
    assert [c["title"] for c in proj["outline"]["chapters"]] == ["Bouře", "Mapa"]
    assert proj["chapters"][0]["text"].endswith("Tomáš se díval z okna.")


def test_needs_calibre_and_project_path(tmp_path):
    f = tmp_path / "kniha.azw3"
    f.write_bytes(b"x")
    try:
        bi.import_book(f, None)
    except bw.BookError as e:
        assert "Calibre" in str(e)
    else:
        raise AssertionError("bez Calibre má přijít srozumitelná chyba")
    (tmp_path / "kniha.kniha.json").write_text("{}", encoding="utf-8")
    assert bi.project_path_for(tmp_path / "kniha.docx").name == "kniha (2).kniha.json"
