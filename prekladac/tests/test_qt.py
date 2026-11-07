"""Testy nového okna (Qt) a převodu formátování do Wordu – běží bez obrazovky (offscreen)."""

import json
import os
import sys
from pathlib import Path

import pytest

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

QtWidgets = pytest.importorskip("PySide6.QtWidgets")
from PySide6 import QtGui  # noqa: E402

import book_writer as bw  # noqa: E402
import html_docx  # noqa: E402
from test_book_writer import OUTLINE  # noqa: E402


@pytest.fixture(scope="module")
def qapp():
    return QtWidgets.QApplication.instance() or QtWidgets.QApplication([])


@pytest.fixture(autouse=True)
def appdata(tmp_path, monkeypatch):
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))


def test_html_to_docx_keeps_formatting(qapp):
    import docx

    e = QtWidgets.QTextEdit()
    e.setHtml('<p>A <b>tučně</b> <i>kurzíva</i> <u>pod</u> <span style="color:#c00000">červená</span> '
              'x<sup>2</sup></p><p align="center">Na střed</p><h2>Nadpis</h2><ul><li>bod</li></ul>'
              '<ol><li>jedna</li></ol><p>[[STRANA]]</p><p align="justify">Blok</p>')
    d = docx.Document()
    html_docx.add_html(d, e.document().toHtml())
    paras = {p.text: p for p in d.paragraphs}
    runs = {r.text: r for p in d.paragraphs for r in p.runs}
    assert runs["tučně"].bold and runs["kurzíva"].italic and runs["pod"].underline
    assert str(runs["červená"].font.color.rgb) == "C00000" and runs["2"].font.superscript
    assert paras["Na střed"].alignment == 1 and paras["Blok"].alignment == 3
    assert paras["Nadpis"].style.name == "Heading 2"
    assert paras["bod"].style.name == "List Bullet" and paras["jedna"].style.name == "List Number"
    assert any(br.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type") == "page"
               for br in d.element.body.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}br"))


def test_plain_to_html_roundtrip(qapp):
    from qt_editor import document_to_plain

    doc = QtGui.QTextDocument()
    doc.setHtml(html_docx.plain_to_html("První odstavec.\n\nDruhý\nřádek & <x>."))
    assert document_to_plain(doc) == "První odstavec.\n\nDruhý\nřádek & <x>."


def test_editor_edit_save_export(qapp, tmp_path):
    import docx
    from qt_editor import BookEditor

    proj = {"language": "čeština", "outline": json.loads(json.dumps(OUTLINE)), "words": 1000,
            "chapters": [{"text": "Bouře zuřila nad mořem.", "summary": ""},
                         {"text": "Druhá kapitola.", "summary": ""}]}
    path = tmp_path / "k.kniha.json"
    bw.save_project(path, proj)
    ed = BookEditor(proj, path, None)
    # označit slovo „Bouře“ a nastavit tučné + na střed
    c = ed.text.textCursor()
    c.movePosition(QtGui.QTextCursor.Start)
    c.movePosition(QtGui.QTextCursor.EndOfWord, QtGui.QTextCursor.KeepAnchor)
    ed.text.setTextCursor(c)
    ed._merge(bold=True)
    ed._align(QtGui.Qt.AlignHCenter)
    ed._page_break()
    assert ed.dirty
    ed.title_edit.setText("Nový název")
    ed.select_chapter(1)
    ed.ch_title.setText("Mapa 2")
    ed._title_edited("Mapa 2")
    ed.save()
    saved = bw.load_project(path)
    assert saved["outline"]["title"] == "Nový název" and saved["outline"]["chapters"][1]["title"] == "Mapa 2"
    assert "html" in saved["chapters"][0] and saved["chapters"][0]["text"].startswith("Bouře zuřila")
    out = bw.export(saved, tmp_path / "out", ["docx"], log=lambda *_: None)[0]
    d = docx.Document(out)
    bold = [r.text for p in d.paragraphs for r in p.runs if r.bold]
    assert "Bouře" in bold
    centered = [p.text for p in d.paragraphs if p.alignment == 1]
    assert any("Bouře" in t for t in centered)
    heads = [p.text for p in d.paragraphs if p.style.name == "Heading 1"]
    assert "2. Mapa 2" in heads
    ed.dirty = False
    ed.close()


def test_main_window_builds(qapp):
    import qt_main

    w = qt_main.MainWindow()
    for i in range(3):
        w.nav.setCurrentRow(i)
    assert w.stack.currentIndex() == 2
    w.book.desc.setPlainText("krátce")
    w.close()


def _editor_with(tmp_path, autosave):
    from qt_editor import BookEditor

    proj = {"language": "čeština", "outline": json.loads(json.dumps(OUTLINE)), "words": 1000,
            "chapters": [{"text": "Začátek.", "summary": ""}]}
    path = tmp_path / "a.kniha.json"
    bw.save_project(path, proj)
    ed = BookEditor(proj, path, None, autosave=autosave)
    ed.show()  # psaní z klávesnice jde jen do zobrazeného okna
    ed.text.setFocus()
    ed.text.moveCursor(QtGui.QTextCursor.End)
    return ed, path


def _type(qapp, ed, text):
    from PySide6 import QtCore, QtTest

    QtTest.QTest.keyClicks(ed.text, text)
    for _ in range(5):
        qapp.processEvents()
        QtCore.QThread.msleep(20)


@pytest.mark.parametrize("mode,typed,saved", [
    ("sentence", " Ahoj svete.", True),
    ("sentence", " Ahoj svete", False),   # věta ještě neskončila
    ("word", " Ahoj ", True),
    ("chars", " abcdefghij", True),       # 11 znaků ≥ limit 10
    ("off", " Ahoj svete.", False),
])
def test_autosave_modes(qapp, tmp_path, mode, typed, saved):
    ed, path = _editor_with(tmp_path, {"mode": mode, "chars": 10})
    _type(qapp, ed, typed)
    on_disk = bw.load_project(path)["chapters"][0]["text"]
    assert (typed.strip() in on_disk) is saved
    if saved:
        assert (tmp_path / "a.kniha.json.bak").exists()  # předchozí verze zůstala jako záloha
        assert not ed.dirty
    ed.dirty = False
    ed.close()


def test_autosave_is_throttled(qapp, tmp_path):
    ed, path = _editor_with(tmp_path, {"mode": "word"})
    _type(qapp, ed, " jedna ")
    first = path.stat().st_mtime_ns
    _type(qapp, ed, "dva ")  # do 2 s se znovu neukládá, jen se naplánuje
    assert path.stat().st_mtime_ns == first and ed._pending_timer.isActive()
    ed.dirty = False
    ed._pending_timer.stop()
    ed.close()


def test_update_dialog_and_setting(qapp, monkeypatch):
    import qt_main
    from PySide6 import QtWidgets
    opened = []
    monkeypatch.setattr(qt_main.webbrowser, "open", opened.append)
    win = qt_main.MainWindow()
    assert win.settings.check_updates.isChecked()

    def fake_exec(box):
        box.button = [b for b in box.buttons() if "Stáhnout" in b.text()][0]
        return 0
    monkeypatch.setattr(QtWidgets.QMessageBox, "exec", fake_exec)
    monkeypatch.setattr(QtWidgets.QMessageBox, "clickedButton", lambda box: box.button)
    win.offer_update({"version": "1.0.99", "setup_url": "https://example/setup.exe"})
    assert opened == ["https://example/setup.exe"]

    monkeypatch.setattr(QtWidgets.QMessageBox, "exec",
                        lambda box: setattr(box, "button", [b for b in box.buttons()
                                                            if "přeskočit" in b.text()][0]))
    win.offer_update({"version": "1.0.99", "setup_url": "x"})
    assert win.cfg["skip_version"] == "1.0.99"
    win.settings.check_updates.setChecked(False)
    monkeypatch.setattr(QtWidgets.QMessageBox, "information", lambda *a, **k: None)
    win.settings.save()
    assert win.cfg["check_updates"] is False
    win.close()
