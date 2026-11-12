"""Práce s obrázky v editoru knihy: vložení více obrázků (první = obálka), ořez, otočení, celá stránka,
obálka jen s názvem."""
import io
import json
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
PIL = pytest.importorskip("PIL.Image")

import book_images  # noqa: E402
from html_docx import PAGE_BREAK  # noqa: E402


def png(w, h, color=(200, 30, 30)) -> bytes:
    out = io.BytesIO()
    PIL.new("RGB", (w, h), color).save(out, "PNG")
    return out.getvalue()


def test_crop_rotate_aspect_and_text_cover():
    data = png(400, 200)
    d, _ = book_images.crop(data, (0.25, 0.0, 0.75, 1.0))
    assert book_images.size_px(d) == (200, 200)
    d, _ = book_images.rotate(data)
    assert book_images.size_px(d) == (200, 400)
    l, t, r, b = book_images.aspect_box(data, 1.0)
    assert (round(l, 2), t, round(r, 2), b) == (0.25, 0.0, 0.75, 1.0)
    assert book_images.aspect_box(data, None, 0.1) == (0.1, 0.1, 0.9, 0.9)
    with pytest.raises(ValueError):
        book_images.crop(data, (0.5, 0.5, 0.5, 0.5))
    cov = book_images.text_cover("Velmi dlouhý název knihy, který se musí zalomit do více řádků", "Autor")
    assert book_images.size_px(cov) == (1200, 1800)


def test_export_without_cover_gets_title_cover():
    import ebook

    proj = {"outline": {"title": "Kůň", "chapters": [{"title": "A", "summary": ""}]},
            "chapters": [{"text": "Text.", "summary": ""}], "author": "Autor"}
    book = ebook.from_project(proj)
    assert book.cover and book_images.size_px(book.images[book.cover]) == (1200, 1800)
    proj["text_cover"] = False
    assert not ebook.from_project(proj).cover


@pytest.fixture()
def editor(tmp_path, monkeypatch):
    QtWidgets = pytest.importorskip("PySide6.QtWidgets")
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))
    app = QtWidgets.QApplication.instance() or QtWidgets.QApplication([])
    from qt_editor import BookEditor

    proj = {"outline": {"title": "Kůň a louka", "chapters": [{"title": "Jedna", "summary": ""}]},
            "chapters": [{"text": "První odstavec.\n\nDruhý odstavec.", "summary": ""}], "author": "Autor"}
    p = tmp_path / "k.kniha.json"
    p.write_text(json.dumps(proj, ensure_ascii=False), encoding="utf-8")
    ed = BookEditor(proj, p, None, text_assist={}, save_options=lambda: None, app_cfg={})
    yield ed, tmp_path, app
    ed.blockSignals(True)
    ed.hide()
    ed.deleteLater()
    app.processEvents()


def images_in(ed):
    from PySide6 import QtGui

    out = []
    b = ed.text.document().begin()
    while b.isValid():
        it = b.begin()
        while not it.atEnd():
            f = it.fragment()
            if f.charFormat().isImageFormat():
                c = QtGui.QTextCursor(ed.text.document())
                c.setPosition(f.position())
                c.setPosition(f.position() + 1, QtGui.QTextCursor.KeepAnchor)
                out.append(c)
            it += 1
        b = b.next()
    return out


def test_pick_images_first_is_cover_and_tools(editor, monkeypatch):
    from PySide6 import QtWidgets

    ed, tmp, app = editor
    files = []
    for i, (w, h) in enumerate(((300, 450), (400, 200), (200, 200))):
        f = tmp / f"o{i}.png"
        f.write_bytes(png(w, h, (40 * i, 100, 150)))
        files.append(str(f))
    assert ed.cover_thumb.pixmap() is not None and not ed.cover_thumb.pixmap().isNull()  # obálka s názvem
    monkeypatch.setattr(QtWidgets.QFileDialog, "getOpenFileNames", lambda *a, **k: (files, ""))
    monkeypatch.setattr(QtWidgets.QMessageBox, "exec", lambda self: self.setProperty("x", 1) or 0)
    monkeypatch.setattr(QtWidgets.QMessageBox, "clickedButton", lambda self: self.defaultButton())
    monkeypatch.setattr(QtWidgets.QMessageBox, "question", lambda *a, **k: QtWidgets.QMessageBox.Yes)
    ed.pick_image()
    cover = ed.project["cover"]
    assert book_images.size_px(book_images.get_image(ed.project, cover)) == (300, 450)
    imgs = images_in(ed)
    assert len(imgs) == 2  # obálka není v textu, další dva obrázky ano

    # celá stránka: šířka 100 % a zalomení stránky před a za obrázkem
    ed.image_full_page(imgs[0])
    c = images_in(ed)[0]
    assert c.charFormat().toImageFormat().width() == book_images.PAGE_PX
    assert c.block().previous().text().strip() == PAGE_BREAK and c.block().next().text().strip() == PAGE_BREAK
    ed.image_full_page(c)  # podruhé už zalomení nepřidá
    assert ed.text.toPlainText().count(PAGE_BREAK) == 2

    # otočení a ořez nahradí obrázek na místě, šířka zůstane
    ed.rotate_image(images_in(ed)[1], True)
    assert book_images.size_px(ed._image_data(images_in(ed)[1])) == (200, 200)
    ed.rotate_image(images_in(ed)[0], True)
    assert book_images.size_px(ed._image_data(images_in(ed)[0])) == (200, 400)
    assert images_in(ed)[0].charFormat().toImageFormat().width() == book_images.PAGE_PX

    import qt_editor

    monkeypatch.setattr(qt_editor.CropDialog, "exec", lambda self: QtWidgets.QDialog.Accepted)
    monkeypatch.setattr(qt_editor.CropDialog, "box", lambda self: (0.0, 0.0, 1.0, 0.5))
    ed.crop_image(images_in(ed)[0])
    assert book_images.size_px(ed._image_data(images_in(ed)[0])) == (200, 200)

    ed.image_as_cover(images_in(ed)[1])
    assert ed.project["cover"] == images_in(ed)[1].charFormat().toImageFormat().name()


def test_crop_dialog_mouse_selection(editor):
    from PySide6 import QtCore
    from PySide6.QtTest import QTest
    from qt_editor import CropDialog

    ed, _tmp, app = editor
    dlg = CropDialog(png(400, 400), ed, ratio=2 / 3)
    dlg.resize(500, 600)
    dlg.show()
    app.processEvents()
    l, t, r, b = dlg.box()
    assert round(r - l, 2) == 0.67 and (t, b) == (0.0, 1.0)
    v = dlg.view
    rect = v._rect()
    QTest.mousePress(v, QtCore.Qt.LeftButton, pos=rect.topLeft().toPoint() + QtCore.QPoint(1, 1))
    QTest.mouseMove(v, rect.center().toPoint())
    QTest.mouseRelease(v, QtCore.Qt.LeftButton, pos=rect.center().toPoint())
    l, t, r, b = dlg.box()
    assert l < 0.02 and t < 0.02 and 0.45 < r < 0.55 and 0.45 < b < 0.55
    dlg.close()
