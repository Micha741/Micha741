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
    ed = BookEditor(proj, path, None, autosave=autosave, text_assist={"capitalize": False})
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


@pytest.fixture
def tiny_speller(tmp_path, monkeypatch):
    import spell
    from test_spell import make_dict
    base = make_dict(tmp_path / "dict")
    sp = spell.Speller(base)
    monkeypatch.setitem(spell._state, "speller", sp)
    return sp


def test_text_assist_menu_and_completion(qapp, tiny_speller):
    from PySide6 import QtCore, QtGui, QtTest, QtWidgets
    from qt_textassist import TextAssist
    edit = QtWidgets.QTextEdit()
    edit.setPlainText("Drak knyha přijel. ")
    opts = {"capitalize": False}
    saved = []
    assist = TextAssist(edit, opts, lambda: saved.append(1))
    edit.show()
    assist.highlighter.rehighlight()
    # pravé tlačítko na chybném slově nabídne opravu
    cur = edit.document().find("knyha")
    menu = assist.build_menu(edit.cursorRect(cur).center())
    texts = [a.text() for a in menu.actions()]
    assert "kniha" in texts and "➕ Přidat do slovníku" in texts and "↶ Zpět" in texts
    next(a for a in menu.actions() if a.text() == "kniha").trigger()
    assert "Drak kniha přijel." in edit.toPlainText()
    # T9: po 3 písmenech nabídka, Tab vloží první návrh
    edit.activateWindow()
    edit.setFocus()
    qapp.processEvents()
    c = edit.textCursor()
    c.movePosition(QtGui.QTextCursor.End)
    edit.setTextCursor(c)
    QtTest.QTest.keyClicks(edit, "knihov")
    assist.update_completion()
    popup = assist.completer.popup()
    assert popup.isVisible() and assist.model.stringList()[0] == "knihovna"
    QtTest.QTest.keyClick(popup, QtCore.Qt.Key_Tab)
    assert edit.toPlainText().endswith("knihovna")
    # Enter bez vybraného návrhu = nový řádek, ne doplnění
    QtTest.QTest.keyClicks(edit, " knih")
    assist.update_completion()
    assert popup.isVisible()
    QtTest.QTest.keyClick(popup, QtCore.Qt.Key_Return)
    assert edit.toPlainText().endswith("knih\n") or edit.toPlainText().endswith("knih ")
    # vypnutí v menu se uloží
    assist.set_option("complete", False)
    assert opts["complete"] is False and saved


def test_editor_spellcheck_does_not_mark_dirty(qapp, tiny_speller, tmp_path):
    import book_writer as bw
    from qt_editor import BookEditor
    proj = {"title": "T", "language": "čeština",
            "outline": {"title": "T", "chapters": [{"title": "K1", "summary": ""}]},
            "chapters": [{"title": "K1", "text": "Drak knyha přijel."}]}
    p = tmp_path / "t.kniha.json"
    bw.save_project(p, proj)
    ed = BookEditor(proj, p, None, text_assist={}, save_options=lambda: None)
    ed.assist.on_dictionary_ready()
    ed.assist.highlighter.rehighlight()
    qapp.processEvents()
    assert not ed.dirty
    menu = ed.assist.build_menu(ed.text.cursorRect(ed.text.document().find("knyha")).center())
    assert any("Formát písma" in a.text() for a in menu.actions())
    # kniha v angličtině: bez kontroly pravopisu
    proj2 = dict(proj, language="angličtina")
    ed2 = BookEditor(proj2, p, None, text_assist={}, save_options=lambda: None)
    assert not ed2.assist.spell_on()
    ed.dirty = ed2.dirty = False
    ed.close()
    ed2.close()


def test_sidebar_collapse_and_section_order(qapp):
    import qt_main
    win = qt_main.MainWindow()
    win.set_sidebar_collapsed(True)
    assert win.side.width() == 72 and win.nav.item(0).text() == "" and win.nav.item(0).toolTip() == "Překlad"
    assert win.cfg["sidebar_collapsed"] is True
    win2 = qt_main.MainWindow()  # stav se pamatuje
    assert win2.sidebar_collapsed
    win2.set_sidebar_collapsed(False)
    assert win2.nav.item(0).text() == "Překlad"
    ribbon = win.book.findChild(qt_main.QtWidgets.QTabWidget, "Ribbon")
    assert [ribbon.tabText(i) for i in range(ribbon.count())] == ["Soubor", "Žánr a styl", "Rozsah a služba"]
    assert ribbon.currentIndex() == 1
    assert win.book.cats["genre"].isVisibleTo(ribbon.widget(1)) and win.book.desc.objectName() == "DocText"
    assert not win.windowIcon().isNull()
    win.close()
    win2.close()


def test_file_list_select_add_remove(qapp, tmp_path):
    import qt_main
    from PySide6 import QtCore, QtTest
    for n in ("a.txt", "b.docx", "c.epub", "x.xyz"):
        (tmp_path / n).write_text("x", encoding="utf-8")
    (tmp_path / "sub").mkdir()
    (tmp_path / "sub" / "d.pdf").write_text("x", encoding="utf-8")
    win = qt_main.MainWindow()
    page = win.translate
    assert page.files.add([tmp_path / "a.txt", tmp_path / "x.xyz"]) == 1
    assert page.files.skipped == ["x.xyz"]
    assert page.files.add([tmp_path]) == 3          # složka i s podsložkou, bez duplicit a .xyz
    assert page.files.count() == 4
    assert not page.b_remove.isEnabled()
    page.files.item(0).setSelected(True)
    page.files.item(1).setSelected(True)
    assert page.b_remove.text() == "➖ Odebrat vybrané (2)" and "vybráno 2" in page.files_info.text()
    page.files.selectAll()                           # Ctrl+A
    assert page.b_remove.text() == "🗑 Odebrat vše" and page.b_selall.text() == "☐ Zrušit výběr"
    page.b_selall.click()
    assert not page.files.selectedItems()
    page.files.item(0).setSelected(True)
    QtTest.QTest.keyClick(page.files, QtCore.Qt.Key_Delete)
    assert page.files.count() == 3 and len(page.files.files) == 3
    page.files.selectAll()
    page.b_remove.click()
    assert page.files.count() == 0 and page.files.files == [] and page.files_info.text() == ""
    win.close()


@pytest.mark.parametrize("before,expected", [
    ("", True), ("Ahoj světe. ", True), ("Kde je? ", True), ("Pozor! ", True), ("Řekl: „Jdu.“ ", True),
    ("Ahoj světe.", False), ("Ahoj ", False), ("Viz např. ", False), ("Bylo to 5. ", False),
    ("1. ", True), ("Tzv. ", False), ("A pak... ", False),
])
def test_should_capitalize(before, expected):
    from qt_textassist import should_capitalize
    assert should_capitalize(before) is expected


def test_auto_capitalize_typing(qapp):
    from PySide6 import QtTest, QtWidgets
    from qt_textassist import TextAssist
    edit = QtWidgets.QPlainTextEdit()
    opts = {"complete": False}
    TextAssist(edit, opts, lambda: None)
    edit.show()
    QtTest.QTest.keyClicks(edit, "drak letel. pak spal atd. tady. konec")
    assert edit.toPlainText() == "Drak letel. Pak spal atd. tady. Konec"
    edit.clear()
    opts["capitalize"] = False
    QtTest.QTest.keyClicks(edit, "drak. pes")
    assert edit.toPlainText() == "drak. pes"


def test_book_scope_is_remembered_and_applied(qapp, tmp_path, monkeypatch):
    import book_writer as bw
    import qt_main
    from PySide6 import QtWidgets
    win = qt_main.MainWindow()
    b = win.book
    b.nchap.setValue(20)
    b.nwords.setValue(1200)
    b.remember_scope()
    win2 = qt_main.MainWindow()                       # po novém spuštění zůstane
    assert (win2.book.nchap.value(), win2.book.nwords.value()) == (20, 1200)
    # osnova vznikla s 2500 slovy, pak uživatel změní délku na 1200 → při psaní se použije 1200
    outline = {"title": "T", "synopsis": "", "characters": [],
               "chapters": [{"title": f"K{i}", "summary": ""} for i in range(20)]}
    b.bdir.setText(str(tmp_path))
    win.cfg.setdefault("engines", {})["gemini"] = {"api_key": "test"}
    b.service.setCurrentIndex(b.service.findData("gemini"))
    for name in ("critical", "warning", "information"):
        monkeypatch.setattr(QtWidgets.QMessageBox, name, lambda *a, **k: (_ for _ in ()).throw(
            AssertionError(f"neočekávané okno: {a[2] if len(a) > 2 else a}")))
    b.nwords.setValue(2500)
    b.new_project(outline)
    b.outline.setPlainText(bw.outline_to_text(outline))
    b.nwords.setValue(1200)
    asked = []
    monkeypatch.setattr(QtWidgets.QMessageBox, "question",
                        lambda *a, **k: asked.append(a[2]) or QtWidgets.QMessageBox.No)
    b.do_write()
    assert b.project["words"] == 1200 and bw.load_project(b.path)["words"] == 1200
    assert asked and "Napsat 20 kapitol" in asked[-1]
    # nesoulad počtu kapitol se ohlásí
    b.nchap.setValue(25)
    asked.clear()
    b.do_write()
    assert "Osnova má 20 kapitol" in asked[0]
    win.close()
    win2.close()


def test_rulers_toggle_and_indent(qapp, tmp_path):
    import book_writer as bw
    import docx
    from html_docx import add_html
    from qt_editor import BookEditor
    proj = {"title": "T", "language": "čeština",
            "outline": {"title": "T", "chapters": [{"title": "K1", "summary": ""}]},
            "chapters": [{"title": "K1", "text": "Prvni odstavec.\n\nDruhy odstavec."}]}
    p = tmp_path / "t.kniha.json"
    bw.save_project(p, proj)
    opts, saved = {}, []
    ed = BookEditor(proj, p, None, text_assist=opts, save_options=lambda: saved.append(1))
    ed.resize(1200, 800)
    ed.show()
    qapp.processEvents()
    assert ed.hruler.isVisible() and ed.vruler.isVisible()     # výchozí: zapnuto
    cm = ed.hruler.logicalDpiX() / 2.54
    m = ed.hruler.markers()
    ed.hruler.apply("left", m["left"] + 2 * cm + 3)              # posun o 2 cm (přichytí se)
    f = ed.text.textCursor().blockFormat()
    assert abs(f.leftMargin() - 2 * cm) < 0.5 and abs(f.textIndent() + 2 * cm) < 0.5  # první řádek zůstal
    ed.hruler.apply("first", ed.hruler.markers()["left"] + 1 * cm)
    assert abs(ed.text.textCursor().blockFormat().textIndent() - 1 * cm) < 0.5
    ed.hruler.apply("right", ed.hruler.markers()["right"] - 1.5 * cm)
    assert abs(ed.text.textCursor().blockFormat().rightMargin() - 1.5 * cm) < 0.5
    # odsazení se přenese do DOCX
    d = docx.Document()
    add_html(d, ed.text.toHtml())
    pf = d.paragraphs[0].paragraph_format
    assert pf.left_indent and pf.first_line_indent and pf.right_indent
    ed.b_ruler.click()
    assert not ed.hruler.isVisible() and opts["ruler"] is False and saved
    ed2 = BookEditor(proj, p, None, text_assist=opts, save_options=lambda: None)
    ed2.show()
    assert not ed2.hruler.isVisible() and not ed2.b_ruler.isChecked()
    for e in (ed, ed2):
        e.dirty = False
        e.close()


def test_print_book_to_pdf(qapp, tmp_path):
    import book_writer as bw
    from pypdf import PdfReader
    from qt_editor import BookEditor
    long = "\n\n".join(["Dlouhy odstavec textu kapitoly, ktery se opakuje. " * 8] * 40)
    proj = {"title": "Kniha", "language": "čeština",
            "outline": {"title": "Kniha", "chapters": [{"title": "Prvni", "summary": ""},
                                                       {"title": "Druha", "summary": ""}]},
            "chapters": [{"title": "Prvni", "text": long + "\n\n[[STRANA]]\n\nPo zalomeni."},
                         {"title": "Druha", "text": "Kratka kapitola."}]}
    p = tmp_path / "k.kniha.json"
    bw.save_project(p, proj)
    ed = BookEditor(proj, p, None, text_assist={"spell": False})
    doc = ed.print_document(True)
    assert "[[STRANA]]" not in doc.toPlainText() and "1. Prvni" in doc.toPlainText()
    out = tmp_path / "tisk.pdf"
    ed.print_to_pdf(out, whole=True)
    whole = len(PdfReader(str(out)).pages)
    ed.dirty = False
    ed.close()
    # srovnání počtu stran (čtení textu z PDF od Qt není na Windows spolehlivé):
    # stejná kniha jen s dlouhou kapitolou bez zalomení = titulní strana + kapitola
    base = dict(proj, chapters=[{"title": "Prvni", "text": long}],
                outline={"title": "Kniha", "chapters": [{"title": "Prvni", "summary": ""}]})
    p2 = tmp_path / "base.kniha.json"
    bw.save_project(p2, base)
    ed2 = BookEditor(base, p2, None, text_assist={"spell": False})
    ref = tmp_path / "ref.pdf"
    ed2.print_to_pdf(ref, whole=True)
    first_only = len(PdfReader(str(ref)).pages)
    assert first_only >= 3                       # titulní strana + dlouhá kapitola na víc stran
    assert whole == first_only + 2               # + strana po [[STRANA]] + druhá kapitola od nové strany
    one = tmp_path / "kapitola.pdf"
    ed2.print_to_pdf(one, whole=False)
    assert len(PdfReader(str(one)).pages) == first_only - 1   # bez titulní strany
    ed2.dirty = False
    ed2.close()


def test_outline_change_keeps_written_chapters(qapp, tmp_path, monkeypatch):
    import book_writer as bw
    import qt_main
    from PySide6 import QtGui, QtWidgets
    win = qt_main.MainWindow()
    b = win.book
    b.bdir.setText(str(tmp_path))
    win.cfg.setdefault("engines", {})["gemini"] = {"api_key": "test"}
    b.service.setCurrentIndex(b.service.findData("gemini"))
    outline = {"title": "T", "synopsis": "", "characters": [],
               "chapters": [{"title": f"K{i}", "summary": f"obsah {i}"} for i in range(1, 4)]}
    b.nchap.setValue(3)
    b.new_project(outline)
    b.project["chapters"].append({"text": "napsano", "summary": "s"})   # 1. kapitola už je napsaná
    text = bw.outline_to_text(outline)
    b.outline.setPlainText(text)
    # délka 3. kapitoly přes menu osnovy
    block = b.outline.document().findBlock(text.index("3. K3"))
    b.set_chapter_words(block, 5000)
    assert "3. K3 [5000 slov] — obsah 3" in b.outline.toPlainText()
    asked = []
    monkeypatch.setattr(QtWidgets.QMessageBox, "question",
                        lambda *a, **k: asked.append(a[2]) or QtWidgets.QMessageBox.No)
    path = b.path
    b.do_write()                       # změna jen nenapsané kapitoly → pokračuje, nic se nemaže
    assert b.path == path and len(b.project["chapters"]) == 1
    assert b.project["outline"]["chapters"][2]["words"] == 5000
    assert "Napsat 2 kapitol" in asked[-1]
    qapp.processEvents()
    assert "Osnova upravena" in b.logv.toPlainText()
    # menu pravého tlačítka nabízí délku kapitoly
    menu = QtWidgets.QMenu()
    c = QtGui.QTextCursor(b.outline.document().findBlock(b.outline.toPlainText().index("2. K2")))
    b._outline_menu(menu, c)
    assert any("Délka kapitoly „K2“" in a.text() for a in menu.actions())
    win.close()



def test_book_file_tab_save_open_recent(qapp, tmp_path, monkeypatch):
    import book_writer as bw
    import qt_main
    from PySide6 import QtWidgets
    win = qt_main.MainWindow()
    b = win.book
    b.bdir.setText(str(tmp_path))
    b.desc.setPlainText("Drak Ferda chce byt knihovnikem.")
    b.cats["genre"].setCurrentText("Pohádka")
    b.outline.setPlainText("NÁZEV: Ferda\n\nKAPITOLY:\n1. Jeskyně [3000 slov] — Ferda se probudí.\n2. Rozepsán")
    target = tmp_path / "Ferda.kniha.json"
    monkeypatch.setattr(QtWidgets.QFileDialog, "getSaveFileName", lambda *a, **k: (str(target)[:-5], ""))
    assert b.save_book(False)                       # nová kniha → zeptá se na jméno, doplní příponu
    saved = bw.load_project(target)
    assert saved["description"].startswith("Drak") and saved["style_parts"]["genre"] == "Pohádka"
    assert saved["outline"]["chapters"][0]["words"] == 3000
    assert "Rozepsán" in saved["outline_text"]
    assert win.cfg["recent_books"][0] == str(target)
    b.outline.setPlainText(b.outline.toPlainText() + "\n3. Konec — vse dobre dopadne.")
    assert b.save_book(False) and "3. Konec" in bw.load_project(target)["outline_text"]  # bez dotazu
    monkeypatch.setattr(QtWidgets.QMessageBox, "question", lambda *a, **k: QtWidgets.QMessageBox.Yes)
    b.new_book()
    assert b.project is None and not b.desc.toPlainText() and "neuložená" in b.path_info.text()
    win2 = qt_main.MainWindow()                     # naposledy otevřené zůstanou
    btns = win2.book.recent_grp.findChildren(QtWidgets.QToolButton, "RecentBook")
    assert btns and "Ferda" in btns[0].text()
    btns[0].click()
    assert win2.book.path == target and win2.book.desc.toPlainText().startswith("Drak")
    assert "3. Konec" in win2.book.outline.toPlainText() and win2.book.cats["genre"].currentText() == "Pohádka"
    win.close()
    win2.close()


def test_settings_info_tab_and_notes(qapp, monkeypatch):
    import qt_main
    from PySide6 import QtWidgets
    win = qt_main.MainWindow()
    tabs = win.settings.findChild(QtWidgets.QTabWidget)
    assert tabs.tabText(tabs.count() - 1) == "Info"
    text = win.settings.changelog.toPlainText()
    assert "Co program umí" in text and "Historie verzí" in text and "Plánované a nápady" in text
    win.settings.my_notes.setPlainText("Přidat přepis kapitoly")
    monkeypatch.setattr(QtWidgets.QMessageBox, "information", lambda *a, **k: None)
    win.settings.save()
    assert win.cfg["my_notes"] == "Přidat přepis kapitoly"
    win2 = qt_main.MainWindow()
    assert win2.settings.my_notes.toPlainText() == "Přidat přepis kapitoly"
    win.close()
    win2.close()


def test_version_info_resource():
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
    import make_version_info as m
    out = m.render("1.0.38")
    assert "filevers=(1, 0, 38, 0)" in out and "'FileVersion', '1.0.38.0'" in out
    assert "LegalCopyright" in out and "Micha741" in out
    assert m.version_tuple("vývojová verze") == (0, 0, 0, 0)


def test_editor_file_tab_save_as_and_panel(qapp, tmp_path, monkeypatch):
    import book_writer as bw
    from PySide6 import QtWidgets
    from qt_editor import BookEditor
    proj = {"title": "T", "language": "čeština", "words": 100,
            "outline": {"title": "T", "chapters": [{"title": "K1", "summary": ""}]},
            "chapters": [{"title": "K1", "text": "Text kapitoly."}]}
    p = tmp_path / "t.kniha.json"
    bw.save_project(p, proj)
    opts = {}
    ed = BookEditor(proj, p, None, text_assist=opts, save_options=lambda: None)
    ed.show()
    assert [ed.ribbon.tabText(i) for i in range(ed.ribbon.count())] == ["Soubor", "Domů", "Kniha", "Zobrazení"]
    assert ed.ribbon.currentIndex() == 1
    # panel kapitol
    assert ed.chapters_dock.isVisible()
    ed.b_panel.click()
    assert not ed.chapters_dock.isVisible() and opts["chapters_panel"] is False
    ed2 = BookEditor(proj, p, None, text_assist=opts, save_options=lambda: None)
    ed2.show()
    assert not ed2.chapters_dock.isVisible()
    ed2.set_chapters_panel(True)
    # uložit jako TXT (bez přípony – doplní se podle typu)
    monkeypatch.setattr(QtWidgets.QFileDialog, "getSaveFileName",
                        lambda *a, **k: (str(tmp_path / "vystup"), bw.SAVE_FORMATS["txt"]))
    monkeypatch.setattr(QtWidgets.QMessageBox, "information", lambda *a, **k: None)
    ed.save_as()
    for _ in range(200):
        qapp.processEvents()
        if (tmp_path / "vystup.txt").exists():
            break
        import time
        time.sleep(0.02)
    assert "Text kapitoly." in (tmp_path / "vystup.txt").read_text(encoding="utf-8")
    # uložit jako ODT (v okenním vlákně)
    monkeypatch.setattr(QtWidgets.QFileDialog, "getSaveFileName",
                        lambda *a, **k: (str(tmp_path / "kniha.odt"), bw.SAVE_FORMATS["odt"]))
    ed.save_as()
    assert (tmp_path / "kniha.odt").exists()
    # uložit jako projekt → editor pracuje s novým souborem
    monkeypatch.setattr(QtWidgets.QFileDialog, "getSaveFileName",
                        lambda *a, **k: (str(tmp_path / "kopie"), f"Projekt knihy (*{bw.PROJECT_SUFFIX})"))
    ed.save_as()
    assert ed.path == tmp_path / "kopie.kniha.json" and ed.path.exists()
    for e in (ed, ed2):
        e.dirty = False
        e.close()


def _png_bytes(w=300, h=200, color="red"):
    import io
    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (w, h), color).save(buf, "PNG")
    return buf.getvalue()


def test_editor_images_and_cover(qapp, tmp_path, monkeypatch):
    import zipfile

    import book_images
    import book_writer as bw
    import converters
    import docx
    from PySide6 import QtCore, QtGui, QtWidgets
    from qt_editor import BookEditor
    proj = {"title": "T", "language": "čeština", "words": 100,
            "outline": {"title": "Kniha", "chapters": [{"title": "K1", "summary": ""}]},
            "chapters": [{"title": "K1", "text": "Prvni odstavec."}]}
    p = tmp_path / "t.kniha.json"
    bw.save_project(p, proj)
    ed = BookEditor(proj, p, None, text_assist={"spell": False})
    ed.show()
    c = ed.text.textCursor()
    c.movePosition(QtGui.QTextCursor.End)
    ed.text.setTextCursor(c)
    name = ed.insert_image_data(_png_bytes())
    assert name in proj["images"] and ed.dirty
    # vložení ze schránky (obrázek bez textu) a obrázek se v editoru načte z knihy
    md = QtCore.QMimeData()
    md.setImageData(QtGui.QImage.fromData(_png_bytes(100, 100, "blue")))
    ed.text.insertFromMimeData(md)
    assert len(proj["images"]) == 2
    assert not ed.text.loadResource(QtGui.QTextDocument.ImageResource, QtCore.QUrl(name)).isNull()
    # pravé tlačítko na obrázku: šířka 50 %
    doc = ed.text.document()
    pos = next(i for i in range(doc.characterCount()) if doc.characterAt(i) == "￼")
    cur = QtGui.QTextCursor(doc)
    cur.setPosition(pos)
    img_c = ed.image_at(cur)
    assert img_c is not None
    menu = QtWidgets.QMenu()
    ed._extra_menu(menu, cur)
    assert any("Obrázek" in a.text() for a in menu.actions())
    ed.set_image_width(img_c, 50)
    assert 'width="400"' in doc.toHtml()
    assert "[obrázek]" in __import__("qt_editor").document_to_plain(doc)
    # obálka
    monkeypatch.setattr(QtWidgets.QFileDialog, "getOpenFileName",
                        lambda *a, **k: (str(tmp_path / "cover.png"), ""))
    (tmp_path / "cover.png").write_bytes(_png_bytes(600, 900, "green"))
    ed.pick_cover()
    assert proj["cover"] in proj["images"] and ed.cover_thumb.pixmap() is not None
    ed.save()
    saved = bw.load_project(p)
    assert set(saved["images"]) == book_images.used_names(saved) and len(saved["images"]) == 3
    # export DOCX: obálka + 2 obrázky v textu
    out = bw.export(saved, tmp_path / "out", ["docx"], lambda *_: None)[0]
    d = docx.Document(out)
    assert len(d.inline_shapes) == 3
    assert d.paragraphs[0].runs and d.inline_shapes[0].width > d.inline_shapes[1].width  # obálka první, velká
    # ODT a tisk s obrázky
    odt = bw.save_as(saved, tmp_path / "k.odt", lambda *_: None)
    names = zipfile.ZipFile(odt).namelist()
    assert any(n.startswith("Pictures/") for n in names)
    # EPUB: obálka jako obálka e-knihy (Calibre --cover), v textu se neopakuje
    calls = []
    monkeypatch.setattr(converters, "calibre_convert",
                        lambda src, dst, log=None, exe=None, extra=None: (calls.append((src, extra)),
                                                                           open(dst, "wb").close()))
    bw.save_as(saved, tmp_path / "k.epub", lambda *_: None)
    src, extra = calls[-1]
    assert extra[0] == "--cover" and Path(extra[1]).suffix in (".png", ".jpg")
    # smazání obrázku z textu → po uložení zmizí i ze souboru
    ed.text.selectAll()
    ed.text.textCursor().insertText("Bez obrazku.")
    ed.remove_cover()
    ed.save()
    assert bw.load_project(p).get("images") == {}
    ed.dirty = False
    ed.close()
