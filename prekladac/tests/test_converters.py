"""Testy bez volání API – překladač je nahrazen falešným (převádí text na VELKÁ písmena)."""

import io
import re
import sys
import zipfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import converters  # noqa: E402
from claude_client import ClaudeTranslator, ModelError  # noqa: E402


class FakeTranslator:
    target_lang = "čeština"
    workers = 2

    def __init__(self):
        self.calls = []

    def translate_segments(self, segments, markup, progress=None, context=""):
        self.calls.append((list(segments), markup))
        if progress:
            progress(1.0)
        if markup:  # velká písmena jen mimo značky
            up = lambda m: m.group(1) + re.sub(r"&\w+;|[^&]+", lambda x: x.group(0) if x.group(0).startswith("&") else x.group(0).upper(), m.group(2))  # noqa: E731
            return [re.sub(r"(^|>)([^<]+)", up, s) for s in segments]
        return [s.upper() for s in segments]

    def image_blocks(self, path, translate):
        return [{"style": "heading1", "text": "Nadpis"}, {"style": "paragraph", "text": "Text " + Path(path).stem},
                {"style": "table_row", "text": "a | b"}, {"style": "table_row", "text": "c | d"},
                {"style": "bullet", "text": "bod"}]

    def pdf_blocks(self, pdf_bytes, translate):
        return [{"style": "paragraph", "text": f"pdf {len(pdf_bytes) > 0}"}]


XHTML = """<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Chapter one</title><style>p {color: red}</style></head>
<body>
<h1>The beginning</h1>
<p>Hello <em>dear</em> reader &amp; friend.<br/>Second line.</p>
<div><p>Nested paragraph</p>Loose text</div>
<img src="a.png" alt="pic"/>
</body></html>"""

NAV = """<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Nav</title></head>
<body><nav epub:type="toc"><ol><li><a href="ch1.xhtml">Chapter one</a><ol><li><a href="ch1.xhtml#x">Sub</a></li></ol></li></ol></nav></body></html>"""

OPF = """<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>My Book</dc:title><dc:language>en</dc:language>
<dc:identifier id="id">x</dc:identifier></metadata>
<manifest><item id="c1" href="ch1.xhtml" media-type="application/xhtml+xml"/></manifest>
<spine><itemref idref="c1"/></spine></package>"""

NCX = """<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><navMap>
<navPoint id="n1"><navLabel><text>Chapter one</text></navLabel><content src="ch1.xhtml"/></navPoint>
</navMap></ncx>"""


def make_epub(path):
    with zipfile.ZipFile(path, "w") as z:
        z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        z.writestr("META-INF/container.xml", "<container/>")
        z.writestr("OEBPS/content.opf", OPF)
        z.writestr("OEBPS/ch1.xhtml", XHTML)
        z.writestr("OEBPS/nav.xhtml", NAV)
        z.writestr("OEBPS/toc.ncx", NCX)
        z.writestr("OEBPS/a.png", b"\x89PNG fake")


def test_epub(tmp_path):
    src, dst = tmp_path / "b.epub", tmp_path / "out.epub"
    make_epub(src)
    converters.translate_epub(str(src), str(dst), FakeTranslator())
    with zipfile.ZipFile(dst) as z:
        assert z.infolist()[0].filename == "mimetype"
        assert z.infolist()[0].compress_type == zipfile.ZIP_STORED
        ch = z.read("OEBPS/ch1.xhtml").decode()
        nav = z.read("OEBPS/nav.xhtml").decode()
        ncx = z.read("OEBPS/toc.ncx").decode()
        opf = z.read("OEBPS/content.opf").decode()
        assert z.read("OEBPS/a.png") == b"\x89PNG fake"
    assert "THE BEGINNING" in ch
    assert "HELLO <em>DEAR</em> READER &amp; FRIEND.<br/>SECOND LINE." in ch
    assert "NESTED PARAGRAPH" in ch and "LOOSE TEXT" in ch
    assert "<title>CHAPTER ONE</title>" in ch
    assert "p {color: red}" in ch  # styl nepřeložen
    assert 'alt="pic"' in ch
    assert ">CHAPTER ONE</a>" in nav and ">SUB</a>" in nav
    assert "<text>CHAPTER ONE</text>" in ncx
    assert "<dc:language>cs</dc:language>" in opf
    assert 'xmlns="http://www.w3.org/1999/xhtml"' in ch  # kořenový jmenný prostor zůstal


def make_docx(path):
    import docx
    from docx.shared import Inches
    from PIL import Image

    d = docx.Document()
    d.core_properties.title = "Doc"
    d.sections[0].header.paragraphs[0].text = "header text"
    p = d.add_paragraph("plain ")
    r = p.add_run("bold")
    r.bold = True
    p.add_run(" end <x> & y")
    d.add_paragraph("same format paragraph")
    img = io.BytesIO()
    Image.new("RGB", (10, 10), "red").save(img, "PNG")
    img.seek(0)
    p2 = d.add_paragraph("before image ")
    p2.add_run().add_picture(img, width=Inches(0.5))
    t = d.add_table(rows=1, cols=2)
    t.cell(0, 0).text = "cell one"
    t.cell(0, 1).text = "cell two"
    d.save(path)


def test_docx(tmp_path):
    import docx

    src, dst = tmp_path / "a.docx", tmp_path / "out.docx"
    make_docx(src)
    converters.translate_docx(str(src), str(dst), FakeTranslator())
    d = docx.Document(dst)
    texts = [p.text for p in d.paragraphs]
    assert "PLAIN BOLD END <X> & Y" in texts
    assert "SAME FORMAT PARAGRAPH" in texts
    bold_runs = [r.text for r in d.paragraphs[0].runs if r.bold]
    assert bold_runs == ["BOLD"]
    assert d.tables[0].cell(0, 0).text == "CELL ONE"
    assert d.sections[0].header.paragraphs[0].text == "HEADER TEXT"
    # obrázek zůstal
    assert d.paragraphs[2]._p.xpath(".//w:drawing")
    assert d.paragraphs[2].text.startswith("BEFORE IMAGE")
    assert d.core_properties.language == "cs"


def test_bare_ampersand():
    from bs4 import BeautifulSoup

    soup = BeautifulSoup('<html xmlns="http://www.w3.org/1999/xhtml"><body><p>x</p></body></html>', "xml")
    p = soup.find("p")
    converters._replace_inner(p, "Tom & Jerry <em>a</em> &amp; b")
    assert str(p) == "<p>Tom &amp; Jerry <em>a</em> &amp; b</p>"


def test_txt(tmp_path):
    src, dst = tmp_path / "a.txt", tmp_path / "out.txt"
    src.write_bytes("první odstavec\nřádek\n\n\ndruhý".encode("cp1250"))
    converters.translate_txt(str(src), str(dst), FakeTranslator())
    assert dst.read_text(encoding="utf-8") == "PRVNÍ ODSTAVEC\nŘÁDEK\n\n\nDRUHÝ"


def test_split_long():
    text = "\n".join(["x" * 100] * 100)
    parts = converters.split_text(text, limit=1000)
    assert "".join(parts) == text and all(len(p) <= 1001 for p in parts)


def test_images_and_pdf(tmp_path):
    import docx
    from PIL import Image
    from pypdf import PdfWriter

    img = tmp_path / "s1.jpg"
    Image.new("RGB", (20, 20)).save(img)
    out = converters.process_file(str(img), None, True, FakeTranslator(), str(tmp_path))
    d = docx.Document(out)
    assert out.endswith("s1 (čeština).docx")
    assert [p.text for p in d.paragraphs][:2] == ["Nadpis", "Text s1"]
    assert d.tables[0].cell(1, 1).text == "d"

    pdf = tmp_path / "x.pdf"
    w = PdfWriter()
    for _ in range(12):
        w.add_blank_page(100, 100)
    w.write(str(pdf))
    out = converters.process_file(str(pdf), None, True, FakeTranslator(), str(tmp_path))
    assert [p.text for p in docx.Document(out).paragraphs] == ["pdf True"] * 3


def test_process_epub_and_naming(tmp_path):
    src = tmp_path / "b.epub"
    make_epub(src)
    out1 = converters.process_file(str(src), None, True, FakeTranslator())
    out2 = converters.process_file(str(src), None, True, FakeTranslator())
    assert out1.endswith("b (čeština).epub") and out2.endswith("b (čeština) (2).epub")


def test_out_dir_is_created(tmp_path):
    src = tmp_path / "a.txt"
    src.write_text("x", encoding="utf-8")
    out = converters.process_file(str(src), None, False, None, str(tmp_path / "nova" / "slozka"))
    assert Path(out).read_text(encoding="utf-8") == "x"


def test_default_formats():
    assert converters.default_output_format(".kfx") == "azw3"
    assert converters.default_output_format(".jpg") == "docx"
    assert converters.default_output_format(".pdf") == "docx"
    assert converters.default_output_format(".rtf") == "rtf"


def test_batch_split_on_error(monkeypatch):
    tr = ClaudeTranslator(api_key="test", log=lambda *_: None)
    calls = []

    def fake_call(system, content, schema):
        import json
        segs = json.loads(content[0]["text"])["segments"]
        calls.append(len(segs))
        if len(segs) > 1:
            raise ModelError("bad count")
        if segs[0] == "refuse":
            raise ModelError("refusal")
        return {"translations": [segs[0] + "!"]}

    monkeypatch.setattr(tr, "_call", fake_call)
    out = tr.translate_segments(["a", "", "b", "refuse"], markup=False)
    assert out == ["a!", "", "b!", "refuse"]


def test_prepare_image(tmp_path):
    from PIL import Image
    from claude_client import _prepare_image

    big = tmp_path / "big.png"
    Image.new("RGB", (5000, 3000), "white").save(big)
    media, data = _prepare_image(str(big))
    assert media == "image/jpeg" and len(data) > 0
    bmp = tmp_path / "a.bmp"
    Image.new("RGB", (10, 10)).save(bmp)
    assert _prepare_image(str(bmp))[0] == "image/jpeg"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-q"]))


def test_images_to_multipage_pdf(tmp_path):
    from PIL import Image
    from pypdf import PdfReader

    import app
    from converters import process_images_together, process_file
    paths = []
    for i, col in enumerate(("red", "green", "blue")):
        p = tmp_path / f"strana{i + 1}.jpg"
        Image.new("RGB", (600, 800), col).save(p)
        paths.append(str(p))
    out = process_images_together(paths, False, None, str(tmp_path / "out"), fmt="pdf")
    assert out.endswith(".pdf") and len(PdfReader(out).pages) == 3
    single = process_file(paths[0], "pdf", False, None, str(tmp_path / "out1"))
    assert len(PdfReader(single).pages) == 1
    # jen poskládat do PDF nepotřebuje OCR; přepis do DOCX ano
    assert not app.files_need_ocr(paths, "pdf", False)
    assert app.files_need_ocr(paths, "docx", False)
    assert app.files_need_ocr(paths, "pdf", True)


def test_run_jobs_images_merged_in_natural_order_or_separate(tmp_path):
    """Více obrázků: zaškrtnuté „spojit“ = jeden DOCX se stránkami v pořadí 1, 2, 3, 10;
    jinak každý obrázek vlastní DOCX."""
    import threading

    import docx
    from PIL import Image

    import app

    names = ["strana1.jpg", "strana2.jpg", "strana10.jpg", "Strana3.png"]
    for n in names:
        Image.new("RGB", (40, 40), "white").save(tmp_path / n)
    files = [str(tmp_path / n) for n in names]
    out = tmp_path / "out"
    res = app.run_jobs(files, True, app.SAME_FORMAT, FakeTranslator(), str(out), True, lambda *_: None,
                       lambda *_: None, None, threading.Event())
    assert len(res) == 1 and Path(res[0]).name.startswith("strana1 ") and res[0].endswith(".docx")
    texts = [p.text for p in docx.Document(res[0]).paragraphs if p.text.startswith("Text ")]
    assert texts == ["Text strana1", "Text strana2", "Text Strana3", "Text strana10"]
    import datetime as dt

    cp = docx.Document(res[0]).core_properties  # Word → Informace: skutečné datum, ne šablona z roku 2013
    now = dt.datetime.now(dt.timezone.utc)
    assert abs((now - cp.created.replace(tzinfo=dt.timezone.utc)).total_seconds()) < 120
    assert cp.modified >= cp.created.replace(tzinfo=None) if cp.modified.tzinfo is None else True
    assert cp.author == "" and cp.last_modified_by == "Překladač" and cp.title == "strana1"
    res = app.run_jobs(files, True, app.SAME_FORMAT, FakeTranslator(), str(tmp_path / "out2"), False,
                       lambda *_: None, lambda *_: None, None, threading.Event())
    assert len(res) == 4 and all(r.endswith(".docx") for r in res)
    assert app.natural_key("IMG_9.jpg") < app.natural_key("img_10.JPG")
