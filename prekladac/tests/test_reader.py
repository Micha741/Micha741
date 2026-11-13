"""Čtečka ve Windows (režim Čtení v okně knihy) – běží bez obrazovky (offscreen)."""

import json
import os
import sys
from pathlib import Path

import pytest

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

QtWidgets = pytest.importorskip("PySide6.QtWidgets")
from PySide6 import QtCore, QtGui  # noqa: E402

LOREM = "Příliš žluťoučký kůň úpěl ďábelské ódy, když se večer vracel domů přes louku plnou rosy. "


def project(n=3, paras=14):
    chapters, outline = [], []
    for c in range(n):
        text = "\n\n".join(f"Odstavec {c + 1}.{p + 1}. " + LOREM * 3 for p in range(paras))
        chapters.append({"text": text, "summary": ""})
        outline.append({"title": f"Cesta číslo {c + 1}", "summary": ""})
    return {"outline": {"title": "Kůň a louka", "chapters": outline}, "chapters": chapters, "author": "Autor",
            "language": "čeština", "format": {"font": "Georgia", "size": 12}}


def settle(app, w):
    """Počkat, až okno dostane konečnou velikost (ve Windows chodí změna velikosti se zpožděním)."""
    from PySide6.QtTest import QTest

    QTest.qWaitForWindowExposed(w, 2000)
    w.layout().activate()
    w.grab()  # první vykreslení (ve Windows může změnit měření písma)
    for _ in range(10):
        app.processEvents()
        QTest.qWait(10)


@pytest.fixture()
def qapp(tmp_path, monkeypatch):
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))
    app = QtWidgets.QApplication.instance() or QtWidgets.QApplication([])
    yield app
    from qt_reader import Reader

    for w in app.topLevelWidgets():  # jen okna z testu (ne vnitřní okna Qt jako bublina nápovědy)
        if isinstance(w, (QtWidgets.QMainWindow, QtWidgets.QDialog, Reader)):
            w.blockSignals(True)
            w.hide()
            w.deleteLater()
    QtCore.QCoreApplication.sendPostedEvents(None, QtCore.QEvent.DeferredDelete)
    app.processEvents()


def test_reader_pages_turn_search_marks_and_state(qapp):
    from qt_reader import Reader

    cfg = {}
    r = Reader(project(), cfg)
    r.resize(700, 900)  # na výšku → jedna strana
    r.show()
    settle(qapp, r)
    v = r.view
    assert not v.two and v.pages > 5
    assert [n for n, _p in r.chapters] == ["Cesta číslo 1", "Cesta číslo 2", "Cesta číslo 3"]
    # Ve Windows se sazba ustálí až po zpracování událostí okna – číslo stránky se pak může posunout,
    # místo čtení (kotva) ale zůstává. Test proto hlídá místo čtení, ne pevné číslo stránky.
    def settled():
        qapp.processEvents()
        assert v.turning is None and v.page == v._norm(v.page_of(v.anchor))
        return v.anchor

    a0 = settled()
    v.turn(1, animate=False)
    a1 = settled()
    assert a1 > a0
    # animace otočení stránky doběhne a místo čtení se posune dál
    v.turn(1)
    assert v.turning is not None
    v.grab()  # vykreslení rozpracované animace
    v.finish_turn()  # jako po doběhnutí animace (nezávisle na časovačích Qt)
    a2 = settled()
    assert a2 > a1
    # tažení myší: krátké se vrátí, dlouhé otočí
    for dx, moves in ((-40, False), (-500, True)):
        before = settled()
        start = QtCore.QPointF(v.width() * 0.8, 400)
        ev = lambda t, p: QtGui.QMouseEvent(t, p, p, Qt.LeftButton, Qt.LeftButton, Qt.NoModifier)  # noqa: E731
        v.mousePressEvent(ev(QtCore.QEvent.MouseButtonPress, start))
        v.mouseMoveEvent(ev(QtCore.QEvent.MouseMove, start + QtCore.QPointF(dx / 2, 0)))
        v.mouseMoveEvent(ev(QtCore.QEvent.MouseMove, start + QtCore.QPointF(dx, 0)))
        v.grab()
        v.mouseReleaseEvent(ev(QtCore.QEvent.MouseButtonRelease, start + QtCore.QPointF(dx, 0)))
        v.finish_turn()
        after = settled()
        assert (after > before) if moves else (after == before), dx
    # kapitoly
    names = [n for n, _p in r.chapters]
    i = names.index(r.chapter_at(v.first_pos()))
    r.go_chapter(1)
    assert r.chapter_at(v.first_pos()) == names[i + 1]
    r.go_chapter(-1)
    assert r.chapter_at(v.first_pos()) == names[i]
    # hledání bez ohledu na diakritiku a velikost písmen
    hits = r.find_all("ZLUTOUCKY KUN")
    assert len(hits) == 3 * 14 * 3 and "【žluťoučký kůň】" in hits[0][2]
    r.goto_pos(hits[5][0], hits[5][1])
    assert v.page_of(hits[5][0]) in (v.page, v.page + 1)
    # označení barvou s poznámkou, záložka – uložené zvlášť od knihy
    pos = hits[0][0]
    r.mark(pos, "g", "důležité")
    r.add_bookmark()
    assert r.state.highlights[0]["color"] == "g" and r.state.bookmarks
    assert any(s.format.background().color().name() == "#c9f2c7" for s in r.selections())
    saved = json.loads(r.state.path.read_text(encoding="utf-8"))
    assert saved["highlights"][0]["note"] == "důležité"
    # vzhled: dvě strany vedle sebe, noc, větší písmo – místo čtení zůstane
    keep = v.anchor
    r.set_pref("spread", "2")
    assert v.two and v.page % 2 == 0
    r.set_pref("theme", "night")
    r.set_pref("size", 16.0)
    assert v.page <= v.page_of(keep) <= v.page + 1  # rozečtené místo je pořád na obrazovce
    assert cfg["reader"]["size"] == 16.0
    v.turn(1)
    v.grab()
    v.finish_turn()  # jako po doběhnutí animace (nezávisle na časovačích Qt)
    qapp.processEvents()
    assert v.page % 2 == 0
    # znovu otevřená kniha pokračuje na stejném místě a má označení
    pos_saved = r.state.pos
    r.state.save()
    r2 = Reader(project(), cfg)
    r2.resize(700, 900)
    assert r2.state.pos == pos_saved and r2.state.highlights[0]["color"] == "g"


def test_editor_switches_to_reading_mode(qapp, tmp_path):
    from qt_editor import BookEditor

    proj = project(2, 6)
    p = tmp_path / "k.kniha.json"
    p.write_text(json.dumps(proj, ensure_ascii=False), encoding="utf-8")
    cfg = {}
    ed = BookEditor(proj, p, None, text_assist={}, save_options=lambda: None, app_cfg=cfg)
    ed.show()
    qapp.processEvents()
    visible = lambda: [ed.ribbon.tabText(i) for i in range(ed.ribbon.count()) if ed.ribbon.isTabVisible(i)]  # noqa: E731
    assert "Čtení" not in visible()
    ed.b_mode_read.click()
    qapp.processEvents()
    assert ed.reading() and visible() == ["Soubor", "Čtení", "Vzhled"] and ed.ribbon.currentIndex() == ed.read_tab
    assert ed.reader.view.pages >= 2 and not ed.chapters_dock.isVisible()
    ed.open_find()  # Ctrl+F ve čtečce = hledání v celé knize
    assert ed.reader.panel.currentIndex() == 1
    ed.b_mode_edit.click()
    qapp.processEvents()
    assert not ed.reading() and "Čtení" not in visible() and "Domů" in visible()
    ed.dirty = False
    ed.close()


def test_vocab_and_translation_saved(qapp, monkeypatch):
    import qt_reader
    from qt_reader import Reader, add_vocab, load_vocab, vocab_text

    add_vocab({"word": "Pferd", "translation": "kůň", "sentence": "Das Pferd.", "book": "K", "to": "čeština", "at": 1})
    add_vocab({"word": "pferd", "translation": "kůň", "sentence": "", "book": "K", "to": "čeština", "at": 2})
    assert [v["at"] for v in load_vocab()] == [2]
    assert vocab_text(load_vocab()) == "pferd\tkůň\n"

    class Fake:
        def translate_segments(self, segs, markup, progress=None, context=""):
            return [f"<{s}>" for s in segs]

    r = Reader(project(1, 3), {})
    r.resize(600, 800)
    r.translator = Fake()
    shown = {}
    monkeypatch.setattr(QtWidgets.QToolTip, "showText", lambda *a, **k: shown.setdefault("tip", a[1]))
    pos = r.find_all("ďábelské")[0][0]
    r.word_at(pos + 2, QtCore.QPoint(10, 10))
    r.translator_thread.join(5)
    qapp.processEvents()
    QtCore.QCoreApplication.sendPostedEvents()
    qapp.processEvents()
    assert load_vocab()[0]["word"] == "ďábelské" and load_vocab()[0]["translation"] == "<ďábelské>"
    assert "kůň úpěl ďábelské ódy" in load_vocab()[0]["sentence"]
    dlg = qt_reader.VocabDialog()
    assert dlg.table.rowCount() == 2


Qt = QtCore.Qt


def test_pdf_with_password_and_protected(tmp_path):
    import ebook
    import ebook_more

    fx = Path(__file__).resolve().parents[2] / "prekladac-android" / "tests" / "fixtures"
    # chráněné jen proti tisku/kopírování → otevře se bez dotazu
    b = ebook.read_book(str(fx / "chranene-aes256.pdf"))
    assert len(b.chapters) == 3
    src = tmp_path / "heslo.pdf"
    src.write_bytes((fx / "heslo-aes256.pdf").read_bytes())
    assert ebook_more.pdf_needs_password(str(src))
    with pytest.raises(ebook_more.PdfPasswordRequired):
        ebook.read_book(str(src))
    assert not ebook_more.set_pdf_password(str(src), "nevim")
    assert ebook_more.set_pdf_password(str(src), "Žluťoučký kůň")
    assert len(ebook.read_book(str(src)).chapters) == 3
    rc4 = tmp_path / "rc4.pdf"
    rc4.write_bytes((fx / "heslo-rc4.pdf").read_bytes())
    assert ebook_more.set_pdf_password(str(rc4), "majitel")  # heslo vlastníka
    assert len(ebook.read_book(str(rc4)).chapters) == 3


def test_read_aloud_pause_resume_stop_and_voice(qapp, monkeypatch):
    import tts_win
    from qt_editor import BookEditor

    calls = []

    class FakeSpeaker:
        def speak(self, text, lang, rate, on_done=None, voice_name=None):
            calls.append(("speak", text[:12], lang, voice_name))
            self.on_done = on_done

        def pause(self):
            calls.append(("pause",))

        def resume(self):
            calls.append(("resume",))

        def stop(self):
            calls.append(("stop",))

    monkeypatch.setattr(tts_win, "available", lambda: True)
    monkeypatch.setattr(tts_win, "Speaker", FakeSpeaker)
    monkeypatch.setattr(tts_win, "list_voices", lambda: [{"name": "Microsoft Jakub", "lang": "cs", "gender": "muž"},
                                                          {"name": "Microsoft Zira", "lang": "en", "gender": "žena"}])
    proj = project(1, 4)
    ed = BookEditor(proj, Path("x.kniha.json"), None, text_assist={}, save_options=lambda: None, app_cfg={})
    ed.set_mode(True)
    r = ed.reader
    vc = [c for c in ed.findChildren(QtWidgets.QComboBox) if c.findData("Microsoft Jakub") >= 0][0]
    assert "Microsoft Jakub (muž, cs)" in [vc.itemText(i) for i in range(vc.count())]
    vc.setCurrentIndex(vc.findData("Microsoft Jakub"))
    assert r.prefs["tts_voice"] == "Microsoft Jakub"
    r.b_speak.click()  # číst
    assert r.speaking and calls[-1][0] == "speak" and calls[-1][2] == "cs" and calls[-1][3] == "Microsoft Jakub"
    assert r.b_speak.text() == "Pozastavit" and r.b_stop.isEnabled()
    r.b_speak.click()  # pozastavit
    assert calls[-1] == ("pause",) and r.b_speak.text() == "Pokračovat"
    r.b_speak.click()  # pokračovat
    assert calls[-1] == ("resume",) and r.b_speak.text() == "Pozastavit"
    first = r.speak_block
    r.speaker.on_done()  # odstavec dočten → další
    qapp.processEvents()
    QtCore.QCoreApplication.sendPostedEvents()
    qapp.processEvents()
    assert r.speak_block > first
    r.b_stop.click()
    assert not r.speaking and calls[-1] == ("stop",) and r.b_speak.text() == "Číst nahlas" and not r.b_stop.isEnabled()

    # klik do textu označí větu, od které se bude číst (zezelená); čtení pak začne přesně od ní
    from qt_reader import sentence_bounds

    b = r.doc.findBlockByNumber(r.speak_block if r.speak_block >= 0 else 2)
    b = next(x for x in (r.doc.findBlockByNumber(i) for i in range(r.doc.blockCount())) if x.text().count(". ") >= 2)
    second = b.position() + b.text().index(". ") + 2           # začátek 2. věty odstavce
    r.click_text(second + 5)
    assert r.read_start == second and sentence_bounds(r.doc, second + 5)[0] == second
    assert any(sel.cursor.selectionStart() == second for sel in r.selections())
    r.click_text(second + 3)                                    # klik na tutéž větu = zrušit označení
    assert r.read_start is None
    r.click_text(second + 5)
    r.b_speak.click()
    assert r.speaking and r.read_start is None and r.speak_from == second
    assert calls[-1][1] == b.text()[second - b.position():][:12]
    # během čtení klik jinam = přeskočit tam (předchozí věta se zastaví)
    n = len(calls)
    r.click_text(b.position() + 1)
    assert calls[n] == ("stop",) and calls[n + 1][0] == "speak" and r.speak_from == b.position()
    r.stop_speaking()

    # bez zvoleného hlasu a s hlasem Windows pro jazyk knihy: čte hned (žádná nabídka stažení)
    monkeypatch.setattr(tts_win, "has_voice", lambda lang: True)
    r.set_pref("tts_voice", "")
    r.start_speaking()
    assert r.speaking and calls[-1][0] == "speak" and calls[-1][3] is None
    r.stop_speaking()
    # bez českého hlasu: nabídne stažení; „Číst hlasem Windows“ čte dál bez stahování
    monkeypatch.setattr(tts_win, "has_voice", lambda lang: False)
    asked = []
    monkeypatch.setattr(r, "offer_voice_download", lambda lang, ask=True: asked.append(lang) or False)
    r.start_speaking()
    assert asked == ["cs"] and r.speaking
    r.stop_speaking()

    # myší: klik doprostřed textu označí větu, klik k pravému okraji otočí stránku
    from PySide6.QtTest import QTest

    ed.show()
    settle(qapp, ed)
    v = r.view
    slot = v.slots()[0]
    mid = QtCore.QPoint(int(v.width() / 2) if not v.two else int(slot.center().x()), int(slot.top() + 30))
    assert v._edge(QtCore.QPointF(mid)) == 0 and v.hit(QtCore.QPointF(mid)) is not None
    QTest.mouseClick(v, QtCore.Qt.LeftButton, pos=mid)
    assert r.read_start is not None
    page = v.page
    QTest.mouseClick(v, QtCore.Qt.LeftButton, pos=QtCore.QPoint(v.width() - 3, int(v.height() / 2)))
    v.finish_turn()
    assert v.page > page
    ed.dirty = False
    ed.close()


def test_reader_cover_and_images_fit_page(qapp):
    """Obálka celá na první stránce a žádný obrázek větší než stránka (jinak by se ořízl)."""
    import io as _io

    import book_images
    from PIL import Image
    from qt_reader import Reader

    def pic(w, h):
        b = _io.BytesIO()
        Image.new("RGB", (w, h), (120, 30, 60)).save(b, "PNG")
        return b.getvalue()

    proj = project(1, 6)
    proj["images"] = {}
    proj["cover"] = book_images.add_image(proj, pic(1024, 1536), "png")
    wide = book_images.add_image(proj, pic(1600, 1000), "png")
    small = book_images.add_image(proj, pic(800, 600), "png")
    text = proj["chapters"][0]["text"].replace("\n\n", "</p><p>")
    proj["chapters"][0] = {"html": f'<p>{text}</p><p><img src="{wide}" width="800"/></p>'
                                   f'<p><img src="{small}" width="280"/></p><p>{text}</p>', "summary": ""}
    r = Reader(proj, {})
    for w in (700, 1500):  # jedna stránka i dvě vedle sebe
        r.resize(w, 600)
        r.show()
        settle(qapp, r)
        r.view.relayout()
        v, doc = r.view, r.doc
        m = doc.documentMargin()
        sizes = {}
        b = doc.begin()
        while b.isValid():
            for it in b:
                f = it.fragment()
                if f.isValid() and f.charFormat().isImageFormat():
                    im = f.charFormat().toImageFormat()
                    sizes[im.name()] = (im.width(), im.height(), v.page_of(f.position()))
                    assert b.blockFormat().alignment() & QtCore.Qt.AlignHCenter
            b = b.next()
        for name, (iw, ih, _p) in sizes.items():
            assert iw <= v.pw - 2 * m + 0.5 and ih <= v.ph - 2 * m, (name, iw, ih, v.pw, v.ph)
        cw, ch, cpage = sizes[proj["cover"]]
        assert cpage == 0 and abs(cw / ch - 1024 / 1536) < 0.01
        assert ch >= (v.ph - 2 * m) * 0.85 or cw >= (v.pw - 2 * m) * 0.95  # obálka co největší
        assert sizes[small][0] < sizes[wide][0]


def test_reader_fullscreen_and_settings(qapp, tmp_path, monkeypatch):
    """Čtečka na celé obrazovce (F11 / tlačítko, Esc zpět) a volby čtečky v Nastavení."""
    import qt_main

    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))
    win = qt_main.MainWindow()
    win.show()
    proj = project(1, 8)
    p = tmp_path / "k.kniha.json"
    p.write_text(json.dumps(proj, ensure_ascii=False), encoding="utf-8")
    win.reader_page.open_path(str(p))
    ed = win.editor
    assert ed.reading()
    r = ed.reader
    full = next(b for b in ed.findChildren(QtWidgets.QToolButton) if b.text().replace("\n", " ") == "Celá obrazovka")
    full.click()
    qapp.processEvents()
    assert ed.is_fullscreen() and win.isFullScreen() and r.fullscreen
    assert not ed.ribbon.isVisible() and not win.side.isVisible() and not r.panel.isVisible()
    assert r.b_exit_full.isVisible()
    r.b_exit_full.click()                                   # tlačítko „Ukončit celou obrazovku“
    qapp.processEvents()
    assert not ed.is_fullscreen() and not win.isFullScreen() and ed.ribbon.isVisible() and win.side.isVisible()
    ed.set_fullscreen(True)
    ed.set_mode(False)                                      # přepnutí na úpravy celou obrazovku ukončí
    assert not ed.is_fullscreen() and not win.isFullScreen()
    ed.set_fullscreen(True)                                 # mimo čtení se nezapne
    assert not ed.is_fullscreen()
    # Nastavení: stránky a čtení na celé obrazovce
    st = win.settings
    st.r_spread.setCurrentIndex(st.r_spread.findData("1"))
    st.r_full.setChecked(True)
    monkeypatch.setattr(QtWidgets.QMessageBox, "information", lambda *a, **k: None)
    st.save()
    assert win.cfg["reader"]["spread"] == "1" and win.cfg["reader_fullscreen"] is True
    ed.set_mode(True)
    qapp.processEvents()
    QtCore.QCoreApplication.sendPostedEvents()
    qapp.processEvents()
    assert ed.is_fullscreen() and not r.view.two
    ed.set_fullscreen(False)
    ed.dirty = False
    ed.close()
    win.close()


def test_reader_voice_error_stops_and_cloud_help(qapp, monkeypatch):
    from qt_editor import BookEditor
    import tts_win

    monkeypatch.setattr(tts_win, "list_voices", lambda: [])
    monkeypatch.setattr(tts_win, "cloud_voices", lambda lang=None: [])
    ed = BookEditor(project(1, 3), Path("x.kniha.json"), None, text_assist={}, save_options=lambda: None, app_cfg={})
    ed.set_mode(True)
    r = ed.reader
    shown = []
    monkeypatch.setattr(QtWidgets.QMessageBox, "warning", lambda *a, **k: shown.append(a[2]))
    monkeypatch.setattr(QtWidgets.QMessageBox, "information", lambda *a, **k: shown.append(a[2]))

    class Broken:
        error = "Hlas není k dispozici: bez internetu"

        def stop(self):
            pass

    r.speaker, r.speaking = Broken(), True
    r.speak_next(1)
    assert not r.speaking and shown == ["Hlas není k dispozici: bez internetu"]
    vc = [c for c in ed.findChildren(QtWidgets.QComboBox) if c.findData("cloud_help") >= 0][0]
    vc.setCurrentIndex(vc.findData("cloud_help"))  # nápověda, jak nastavit přirozené hlasy; výběr se vrátí
    assert "Vlasta" in shown[-1] and vc.currentData() != "cloud_help"
    ed.dirty = False
    ed.close()


def test_reader_look_tab(qapp):
    from qt_editor import BookEditor

    cfg = {}
    ed = BookEditor(project(1, 4), Path("x.kniha.json"), None, text_assist={}, save_options=lambda: None, app_cfg=cfg)
    ed.set_mode(True)
    r = ed.reader
    assert ed.ribbon.tabText(ed.look_tab) == "Vzhled" and ed.ribbon.isTabVisible(ed.look_tab)
    b = r.look_buttons
    b["theme"]["night"].click()
    assert r.prefs["theme"] == "night" and cfg["reader"]["theme"] == "night" and b["theme"]["night"].isChecked()
    assert not b["theme"]["day"].isChecked()
    b["spread"]["2"].click()
    assert r.prefs["spread"] == "2" and r.view.two
    b["spread"]["1"].click()
    assert not r.view.two
    b["font"]["sans"].click()
    assert r.prefs["font"] == "sans"
    size = float(r.prefs["size"])
    bigger = next(x for x in ed.findChildren(QtWidgets.QToolButton) if x.text() == "Větší")
    bigger.click()
    assert float(r.prefs["size"]) == size + 1
    ed.set_mode(False)
    assert not ed.ribbon.isTabVisible(ed.look_tab) and not ed.ribbon.isTabVisible(ed.read_tab)
    ed.dirty = False
    ed.close()
