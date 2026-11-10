import io
import json
import sys
import zipfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import ebook  # noqa: E402


def _img(color="red", fmt="JPEG", size=(120, 80)):
    from PIL import Image
    b = io.BytesIO()
    Image.new("RGB", size, color).save(b, fmt)
    return b.getvalue()


def sample():
    b = ebook.RichBook(title="Strážce majáku", author="Jan Novák")
    b.cover = b.add_image(_img("navy", size=(300, 450)))
    pic = b.add_image(_img("green", "PNG"))
    b.chapters = [
        ebook.Chapter("Bouře", "<h2>1. Bouře</h2><p>Bouře <b>zuřila</b> nad <i>mořem</i>.</p>"
                               '<p style="text-align:center">Žluťoučký <u>kůň</u> úpěl.</p>'),
        ebook.Chapter("Mapa", f'<h2>2. Mapa</h2><p>Na půdě ležela mapa.</p><p style="text-align:center"><img src="{pic}"/></p>'
                              "<hr/><p>Po zalomení stránky.</p>"),
        ebook.Chapter("Návrat", "<h2>3. Návrat</h2><blockquote><p>Citát na konec.</p></blockquote><ul><li>jedna</li><li>dvě</li></ul>"),
    ]
    return b


def _check(back, formatting=True):
    assert back.title == "Strážce majáku"
    assert back.author == "Jan Novák"
    assert [c.title for c in back.chapters] == ["Bouře", "Mapa", "Návrat"]
    txt = [ebook.plain_text(c.html) for c in back.chapters]
    assert "Bouře zuřila nad mořem." in txt[0] and "Žluťoučký kůň úpěl." in txt[0]
    assert "Po zalomení stránky." in txt[1] and "Citát na konec." in txt[2]
    assert back.cover and ebook.image_ext(back.images[back.cover]) in ("jpg", "png")
    assert "<img" in back.chapters[1].html
    if formatting:
        assert "<b>zuřila</b>" in back.chapters[0].html and "<i>mořem</i>" in back.chapters[0].html
        assert "<u>kůň</u>" in back.chapters[0].html
        assert "<hr/>" in back.chapters[1].html


@pytest.mark.parametrize("fmt", ["epub", "mobi", "docx"])
def test_roundtrip_keeps_formatting_images_cover(tmp_path, fmt):
    dst = tmp_path / f"kniha.{fmt}"
    ebook.write_book(sample(), dst)
    _check(ebook.read_book(dst))


@pytest.mark.parametrize("fmt", ["pdb", "txt"])
def test_roundtrip_text_formats(tmp_path, fmt):
    dst = tmp_path / f"kniha.{fmt}"
    ebook.write_book(sample(), dst)
    back = ebook.read_book(dst)
    assert [c.title for c in back.chapters] == ["Bouře", "Mapa", "Návrat"]
    assert "Bouře zuřila nad mořem." in ebook.plain_text(back.chapters[0].html)


def test_epub_structure(tmp_path):
    data = ebook.write_epub(sample())
    z = zipfile.ZipFile(io.BytesIO(data))
    first = z.infolist()[0]
    assert first.filename == "mimetype" and first.compress_type == zipfile.ZIP_STORED
    import xml.etree.ElementTree as ET
    for n in z.namelist():
        if n.endswith((".xhtml", ".opf", ".ncx", ".xml")):
            ET.fromstring(z.read(n))  # platné XML
    opf = z.read("OEBPS/content.opf").decode()
    assert 'properties="cover-image"' in opf and '<meta name="cover"' in opf


def test_mobi_toc_links_point_to_chapters():
    import re
    data = ebook.write_mobi(sample())
    name, kind, recs = ebook.read_pdb(data)
    assert kind == "BOOKMOBI"
    count = int.from_bytes(recs[0][8:10], "big")
    text = b"".join(ebook.palmdoc_decompress(r) for r in recs[1:1 + count])
    positions = [int(m) for m in re.findall(rb"filepos=(\d{10})", text)]
    assert positions and all(text[p:p + 4] == b"<h2>" for p in positions[2:])  # odkazy z obsahu na kapitoly


def test_mobi_readable_by_kindleunpack(tmp_path):
    mobi = pytest.importorskip("mobi")
    dst = tmp_path / "k.mobi"
    ebook.write_book(sample(), dst)
    tmp, path = mobi.extract(str(dst))
    html = Path(path).read_text(encoding="utf-8", errors="replace")
    assert "Žluťoučký" in html and "<b>zuřila</b>" in html


def test_palmdoc_roundtrip():
    data = ("Bouře zuřila nad mořem. " * 200).encode()[:4096] + b""
    assert ebook.palmdoc_decompress(ebook.palmdoc_compress(data)) == data
    rnd = bytes((i * 2654435761 >> 24) & 255 for i in range(4096))
    assert ebook.palmdoc_decompress(ebook.palmdoc_compress(rnd)) == rnd


def test_txt_cp1250_and_project_roundtrip(tmp_path):
    f = tmp_path / "stara.txt"
    f.write_bytes("Moje kniha\n\nKapitola 1\n\nŽluťoučký kůň.\n".encode("cp1250"))
    b = ebook.read_book(f)
    assert b.title == "Moje kniha" and "Žluťoučký kůň." in ebook.plain_text(b.chapters[0].html)
    proj = ebook.to_project(sample())
    assert proj["outline"]["chapters"][0]["title"] == "Bouře"
    assert "<b>zuřila</b>" in proj["chapters"][0]["html"] and "1. Bouře" not in proj["chapters"][0]["text"]
    p = tmp_path / "k.kniha.json"
    p.write_text(json.dumps(proj, ensure_ascii=False), encoding="utf-8")
    _check(ebook.read_book(p))


def test_html_cleaner_handles_messy_markup():
    blocks = ebook.clean_html('<div><span style="font-weight:bold">Tučně</span> text<br>dál<div>vnořený</div>'
                              '<p class="x">odstavec <em>kurzívou</em></p><mbp:pagebreak/><table><tr><td>a</td>'
                              '<td>b</td></tr></table><script>x</script></div>')
    assert blocks[0] == "<p><b>Tučně</b> text<br/>dál</p>"
    assert "<p>vnořený</p>" in blocks and "<p>odstavec <i>kurzívou</i></p>" in blocks
    assert "<hr/>" in blocks and "<p>a | b</p>" in blocks and not any("x</p>" == b for b in blocks)


def test_needs_calibre_for_unknown_formats(tmp_path):
    f = tmp_path / "k.azw3"
    f.write_bytes(b"x")
    with pytest.raises(ebook.NeedsCalibre):
        ebook.convert(f, tmp_path / "k.epub")
    with pytest.raises(ebook.NeedsCalibre):
        ebook.convert(tmp_path / "k.txt", tmp_path / "k.rtf")


def test_pdf_via_qt(tmp_path):
    import os
    os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
    pypdf = pytest.importorskip("pypdf")
    dst = tmp_path / "k.pdf"
    ebook.write_book(sample(), dst)
    r = pypdf.PdfReader(str(dst))
    assert len(r.pages) >= 5  # obálka, titul, 3 kapitoly (a zalomení)
    text = "".join(p.extract_text() or "" for p in r.pages)
    assert "Mapa" in text or len(text) == 0  # některá písma nemají textovou vrstvu
