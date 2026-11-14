"""Hledání knih ve čtečce: katalogy, obchody, stažení knihy nebo ukázky, okno hledání."""
import json
import os
import sys
import time
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
import book_search as bs  # noqa: E402

GUTENDEX = {"next": None, "results": [
    {"id": 84, "title": "Frankenstein", "authors": [{"name": "Shelley, Mary Wollstonecraft"}], "languages": ["en"],
     "download_count": 5, "formats": {"application/epub+zip": "http://www.gutenberg.org/ebooks/84.epub3.images",
                                      "image/jpeg": "https://x/84.jpg"}},
    {"id": 1, "title": "Bez EPUB", "authors": [], "languages": ["en"], "formats": {"text/plain": "x"}}]}
GOOGLE = {"items": [
    {"id": "a", "volumeInfo": {"title": "Babička", "authors": ["Božena Němcová"], "language": "cs",
                               "imageLinks": {"thumbnail": "http://books.google.com/x.jpg"},
                               "description": "<p>Obrazy <b>venkovského</b> života</p>"},
     "saleInfo": {"saleability": "FOR_SALE", "retailPrice": {"amount": 149, "currencyCode": "CZK"},
                  "buyLink": "https://play.google.com/store/books/details?id=a"},
     "accessInfo": {"publicDomain": False, "viewability": "PARTIAL",
                    "webReaderLink": "http://play.google.com/books/reader?id=a"}},
    {"id": "b", "volumeInfo": {"title": "Pride and Prejudice"}, "saleInfo": {"saleability": "FREE"},
     "accessInfo": {"publicDomain": True, "viewability": "ALL_PAGES",
                    "epub": {"isAvailable": True, "downloadLink": "http://books.google.com/b.epub"}}},
    {"id": "c", "volumeInfo": {}}]}
EPUB = b"PK\x03\x04" + b"\x00" * 26 + b"mimetypeapplication/epub+zip" + b"\x00" * 100


def test_parsers_sources_and_urls():
    g = bs.parse_gutendex(GUTENDEX)
    assert len(g) == 1 and g[0].authors == "Mary Wollstonecraft Shelley" and g[0].price == "zdarma"
    assert g[0].download.startswith("https://") and g[0].preview == "https://www.gutenberg.org/ebooks/84"
    r = bs.parse_google_books(GOOGLE)
    assert [b.title for b in r] == ["Babička", "Pride and Prejudice"]
    assert r[0].price == "149 Kč" and r[0].cover == "https://books.google.com/x.jpg" and r[0].download is None
    assert r[0].description == "Obrazy venkovského života" and r[0].preview.startswith("https://")
    assert r[1].price == "zdarma" and r[1].download == "https://books.google.com/b.epub"
    assert bs.gutendex_url("čapek r.u.r.", "cs") == "https://gutendex.com/books/?search=%C4%8Dapek%20r.u.r.&languages=cs"
    assert "&key=K" in bs.google_books_url("x", None, "K")
    ids = [s.id for s in bs.SOURCES]
    for i in ("alza", "amazon", "gplay", "kosmas", "martinus", "mkp", "kjm", "plzen", "cbvk", "smashwords", "palmknihy"):
        assert i in ids
    for s in bs.SOURCES:
        u = s.url("Babička Němcová")
        assert u.startswith("https://") and " " not in u
    assert "site%3Akosmas.cz" in next(s for s in bs.SOURCES if s.id == "kosmas").url("Babička")
    assert all(u.startswith("https://") for _n, u in bs.ACCOUNTS)


def test_search_merges_catalogs_and_survives_one_failing(monkeypatch):
    def fake(url, service):
        if "gutendex" in url:
            return GUTENDEX
        raise RuntimeError("HTTP 429")

    import free_engines
    monkeypatch.setattr(free_engines, "http_request", lambda url, **k: (_ for _ in ()).throw(RuntimeError("x")))

    monkeypatch.setattr(bs, "_get_json", fake)
    books, errors = bs.search("frankenstein")
    assert [b.title for b in books] == ["Frankenstein"] and errors and errors[0].startswith("Google Books")
    monkeypatch.setattr(bs, "_get_json", lambda url, service: GUTENDEX if "gutendex" in url else GOOGLE)
    books, errors = bs.search("x")
    assert not errors and [b.download is not None for b in books] == [True, True, False]  # ke stažení první


def test_suggestions_and_history():
    hist = bs.add_history(["Babička", "R.U.R."], "babicka")
    assert hist == ["babicka", "R.U.R."]  # stejné hledání bez diakritiky se jen posune nahoru
    out = bs.merge_suggestions("bab", ["Babička", "Válka s mloky"], [("Babička", "Božena Němcová"),
                                                                    ("Babičky", "")])
    assert out == ["Babička", "Babička Němcová", "Babičky"]
    assert bs.parse_suggest({"items": [{"volumeInfo": {"title": "A", "authors": ["B"]}}, {"volumeInfo": {}}]}) == [("A", "B")]


def test_download_book_names_and_types(tmp_path, monkeypatch):
    import free_engines

    payload = {}
    monkeypatch.setattr(free_engines, "http_request", lambda url, **k: payload["data"])
    payload["data"] = EPUB
    p = bs.download_book("https://www.gutenberg.org/ebooks/84.epub3.images", "Frankenstein – Shelley", tmp_path)
    assert p.name == "Frankenstein – Shelley.epub" and p.read_bytes() == EPUB
    assert bs.download_book("https://x/84.epub3.images", "Frankenstein – Shelley", tmp_path) == p  # stejný soubor
    payload["data"] = b"%PDF-1.4 ukazka"
    p2 = bs.download_book("https://obchod.cz/ukazka?id=5", None, tmp_path)
    assert p2.suffix == ".pdf" and p2.name == "ukazka.pdf"
    payload["data"] = b"<!DOCTYPE html><html>obchod</html>"
    with pytest.raises(Exception, match="webovou stránku"):
        bs.download_book("https://obchod.cz/kniha", None, tmp_path)
    with pytest.raises(Exception):
        bs.download_book("file:///c:/x.epub", None, tmp_path)
    assert bs.sniff_ext(b"\0" * 60 + b"BOOKMOBI") == ".mobi"


def test_recent_downloads(tmp_path):
    (tmp_path / "a.epub").write_bytes(b"x")
    (tmp_path / "b.pdf").write_bytes(b"x")
    (tmp_path / "foto.jpg").write_bytes(b"x")
    old = tmp_path / "stara.epub"
    old.write_bytes(b"x")
    t = time.time() - 200 * 86400
    os.utime(old, (t, t))
    os.utime(tmp_path / "a.epub", (time.time() - 10, time.time() - 10))
    assert [p.name for p in bs.recent_downloads(tmp_path)] == ["b.pdf", "a.epub"]


def test_search_window(tmp_path, monkeypatch):
    QtWidgets = pytest.importorskip("PySide6.QtWidgets")
    monkeypatch.setenv("APPDATA", str(tmp_path))
    app = QtWidgets.QApplication.instance() or QtWidgets.QApplication([])
    import qt_booksearch
    import free_engines
    from PySide6 import QtCore

    monkeypatch.setattr(free_engines, "http_request", lambda url, **k: (_ for _ in ()).throw(RuntimeError("offline")))
    asked = []

    def fake_search(title="", author="", keyword="", sources=None, lang=None, key=None):
        asked.append((title, author, keyword, sorted(sources)))
        books = bs.parse_gutendex(GUTENDEX) + bs.parse_google_books(GOOGLE)
        return books, {"gutenberg": "1", "google": "2", "wikisource": "chyba: HTTP 503"}

    monkeypatch.setattr(bs, "search_sources", fake_search)
    monkeypatch.setattr(bs, "download_book", lambda url, title=None, dest=None: tmp_path / "kniha.epub")
    opened, browsed, saved = [], [], []
    monkeypatch.setattr(qt_booksearch.webbrowser, "open", lambda u: browsed.append(u))
    cfg = {}
    w = qt_booksearch.BookSearch(cfg, lambda: saved.append(1), opened.append)
    w.show()

    def wait(cond):
        for _ in range(200):
            app.processEvents()
            QtCore.QCoreApplication.sendPostedEvents()
            if cond():
                return True
            time.sleep(0.01)
        return False

    w.src_checks["openlibrary"].setChecked(False)
    assert "openlibrary" not in cfg["book_search_sources"]
    w.author.setText("božena němcová")
    w.q.setText("babička")
    w.search()
    assert wait(lambda: w.results.rowCount() == 3)
    assert asked == [("babička", "božena němcová", "", ["google", "gutenberg", "wikisource"])]
    assert cfg["book_search_history"] == ["babička božena němcová"] and saved
    head = [w.results.horizontalHeaderItem(c).text() for c in range(w.results.columnCount())]
    assert head == ["Obálka", "Název a autor", "Cena", "DRM", "Obchod", "Otevře Překladač"]
    row = {w.books[r].title: r for r in range(len(w.books))}
    assert w.results.item(row["Frankenstein"], 5).text().startswith("✅")
    assert w.results.item(row["Frankenstein"], 3).text().startswith("🔓")
    assert w.results.item(row["Babička"], 5).text().startswith("❌") and "149 Kč" == w.results.item(row["Babička"], 2).text()
    assert "Nalezeno 3 knih, z toho 2 otevře Překladač" in w.status.text() and "⚠ chyba: HTTP 503" in w.status.text()
    w.results.selectRow(row["Frankenstein"])
    assert w.b_read.isVisible() and w.b_preview.isVisible()  # Gutenberg: stáhnout i ukázka
    w.read_selected()
    assert wait(lambda: opened == [str(tmp_path / "kniha.epub")])
    w.results.selectRow(row["Babička"])                       # jen ukázka a koupě
    assert not w.b_read.isVisible() and w.b_preview.isVisible() and w.b_buy.isVisible()
    w.b_preview.click()
    assert browsed[-1].startswith("https://play.google.com/books/reader")
    kosmas = next(w.stores.item(i) for i in range(w.stores.count()) if "Kosmas" in w.stores.item(i).text())
    w._open_store(kosmas)
    assert "kosmas.cz" in browsed[-1] and "babi" in browsed[-1].lower()
    for cb in w.src_checks.values():
        cb.setChecked(False)
    w.search()
    assert "aspoň jeden zdroj" in w.status.text()
    extras = qt_booksearch.MyBooksExtras(opened.append, w.download_and_open)
    monkeypatch.setattr(bs, "recent_downloads", lambda limit=8: [tmp_path / "ukazka.pdf"])
    extras.refresh()
    b = next(x for x in extras.findChildren(QtWidgets.QToolButton) if "ukazka.pdf" in x.text())
    b.click()
    assert opened[-1] == str(tmp_path / "ukazka.pdf")
    w.close()


def test_more_catalogs_and_drm():
    ol = bs.parse_openlibrary({"docs": [
        {"key": "/works/OL1W", "title": "Babička", "author_name": ["Božena Němcová"], "ebook_access": "public",
         "ia": ["babicka00nemc"], "cover_i": 5},
        {"key": "/works/OL2W", "title": "Nová kniha", "author_name": ["X"], "ebook_access": "borrowable", "ia": ["x"]},
        {"key": "/works/OL3W", "title": "Bez e-knihy", "ebook_access": "no_ebook"}]})
    assert [(b.drm, b.opens) for b in ol] == [("free", True), ("drm", False), ("none", None)]
    assert ol[0].download == "https://archive.org/download/babicka00nemc/babicka00nemc.epub"
    assert ol[0].cover == "https://covers.openlibrary.org/b/id/5-M.jpg" and ol[1].price == "výpůjčka"
    assert "title=Babi%C4%8Dka" in bs.openlibrary_url("Babička", "Němcová") and "author=N%C4%9Bmcov%C3%A1" in bs.openlibrary_url("Babička", "Němcová")
    ws = bs.parse_wikisource({"query": {"search": [{"title": "Babička", "pageid": 7},
                                                   {"title": "Babička/Kapitola 1", "pageid": 8}]}})
    assert len(ws) == 1 and ws[0].opens and ws[0].drm == "free"
    assert ws[0].download == "https://ws-export.wmcloud.org/?format=epub&lang=cs&page=Babi%C4%8Dka"
    assert bs.google_query("Babička", "Němcová", "venkov") == "venkov intitle:Babička inauthor:Němcová"
    g = bs.parse_google_books({"items": [{"id": "z", "volumeInfo": {"title": "T"}, "saleInfo": {"saleability": "FOR_SALE"},
                                          "accessInfo": {"epub": {"acsTokenLink": "http://x"}}}]})
    assert (g[0].drm, g[0].opens) == ("drm", False)


def test_search_sources_status(monkeypatch):
    import free_engines

    def fake(url, service):
        if "gutendex" in url:
            return GUTENDEX
        if "wikisource" in url:
            return {"query": {"search": [{"title": "Babička", "pageid": 1}]}}
        if "openlibrary" in url:
            raise RuntimeError("HTTP 503. Zkuste později")
        return GOOGLE

    monkeypatch.setattr(bs, "_get_json", fake)
    monkeypatch.setattr(free_engines, "http_request", lambda url, **k: (_ for _ in ()).throw(RuntimeError("x")))
    books, status = bs.search_sources("Babička", "Němcová", "")
    assert status == {"gutenberg": "1", "wikisource": "1", "openlibrary": "chyba: HTTP 503", "google": "2"}
    assert books[-1].opens is False and all(b.opens for b in books[:3])  # nejdřív knihy, které jdou otevřít
    assert bs.search_sources("", "", "") == ([], {})


OPDS = """<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
<entry><title>Sort Alphabetically</title><link href="/ebooks/search.opds/?sort_order=title"/></entry>
<entry><updated>2026</updated><title>Frankenstein; Or, The Modern Prometheus</title>
<content type="text">Mary Wollstonecraft Shelley</content><id>https://www.gutenberg.org/ebooks/84.opds</id>
<link type="application/atom+xml;profile=opds-catalog" href="/ebooks/84.opds"/></entry>
<entry><title>R.U.R. &amp; další</title><content type="text">Karel Čapek</content>
<link href="/ebooks/59112.opds" rel="subsection"/></entry></feed>"""


def test_gutenberg_fallback_when_gutendex_blocked(monkeypatch):
    import free_engines

    def blocked(url, service):
        raise RuntimeError("HTTP 403 Just a moment...")

    monkeypatch.setattr(bs, "_get_json", blocked)
    seen = []
    monkeypatch.setattr(free_engines, "http_request", lambda url, **k: seen.append(url) or OPDS.encode())
    books = bs.gutenberg_search("frankenstein")
    assert seen == ["https://www.gutenberg.org/ebooks/search.opds/?query=frankenstein"]
    assert [(b.title, b.authors) for b in books] == [("Frankenstein; Or, The Modern Prometheus",
                                                      "Mary Wollstonecraft Shelley"), ("R.U.R. & další", "Karel Čapek")]
    assert books[0].download == "https://www.gutenberg.org/ebooks/84.epub3.images" and books[0].price == "zdarma"
