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
    v.turn(1, animate=False)
    assert v.page == 1
    # animace otočení stránky doběhne a stránka se změní
    v.turn(1)
    assert v.turning is not None
    v.grab()  # vykreslení rozpracované animace
    v.finish_turn()  # jako po doběhnutí animace (nezávisle na časovačích Qt)
    page_after_finish, anchor = v.page, v.anchor
    qapp.processEvents()
    assert v.page == 2 and v.turning is None, (
        f"po dokončení {page_after_finish}, kotva {anchor} → strana {v.page_of(anchor)}, první znak {v.first_pos()}, "
        f"stran {v.pages}, ph {v.ph}, pw {v.pw}, velikost {v.width()}x{v.height()}")
    # tažení myší: krátké se vrátí, dlouhé otočí
    for dx, expect in ((-40, 2), (-500, 3)):
        start = QtCore.QPointF(600, 400)
        ev = lambda t, p: QtGui.QMouseEvent(t, p, p, Qt.LeftButton, Qt.LeftButton, Qt.NoModifier)  # noqa: E731
        v.mousePressEvent(ev(QtCore.QEvent.MouseButtonPress, start))
        v.mouseMoveEvent(ev(QtCore.QEvent.MouseMove, start + QtCore.QPointF(dx / 2, 0)))
        v.mouseMoveEvent(ev(QtCore.QEvent.MouseMove, start + QtCore.QPointF(dx, 0)))
        v.grab()
        v.mouseReleaseEvent(ev(QtCore.QEvent.MouseButtonRelease, start + QtCore.QPointF(dx, 0)))
        v.finish_turn()  # jako po doběhnutí animace (nezávisle na časovačích Qt)
        qapp.processEvents()
        assert v.page == expect, dx
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
    assert ed.reading() and visible() == ["Soubor", "Čtení"] and ed.ribbon.currentIndex() == ed.read_tab
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
    ed.dirty = False
    ed.close()
