"""Skiny (vzhledy): vestavěné, instalace ze souboru .skin, bezpečnost archivu, export a použití v okně."""

import io
import json
import os
import sys
import zipfile
from pathlib import Path

import pytest

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import skins  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
PNG = bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000"
                    "1f15c4890000000d49444154789c63f8cfc0f01f0005000201a7b3a6f30000000049454e44ae426082")


@pytest.fixture(autouse=True)
def appdata(tmp_path, monkeypatch):
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))


def make_skin(path: Path, files: dict[str, bytes | str]) -> Path:
    with zipfile.ZipFile(path, "w") as zf:
        for name, data in files.items():
            zf.writestr(name, data)
    return path


def test_builtin_skins_complete_and_same_on_android():
    android = ROOT / "prekladac-android" / "src" / "core" / "skins-builtin.json"
    assert json.loads(android.read_text(encoding="utf-8")) == json.loads(
        (ROOT / "prekladac" / "assets" / "skins" / "builtin.json").read_text(encoding="utf-8"))
    ids = [s.id for s in skins.builtin_skins()]
    assert ids[:4] == ["default", "dark", "sepia", "contrast"]
    for s in skins.builtin_skins():
        assert set(s.colors) == set(skins.TOKENS)
        css = skins.stylesheet(s)
        assert "$" not in css and s.color("accent") in css


def test_default_skin_keeps_original_look():
    css = skins.stylesheet(skins.find("default"))
    for old in ("#Sidebar { background: #1e293b;", "QPushButton#Primary { background: #2563eb;",
                "#Canvas, QFrame#EditorCanvas { background: #e8ebf0;", "QMainWindow, QDialog { background: #f4f6fa; }"):
        assert old in css


def test_install_skin_with_images_icons_and_qss(tmp_path):
    data = {"name": "Les", "author": "Já", "base": "dark", "colors": {"accent": "#22C55E", "window": "nesmysl"},
            "font": {"family": "Comic Sans MS", "size": 99, "doc_family": "x;}{evil"},
            "images": {"logo": "logo.png", "canvas": "../venku.png"}, "qss": "style.qss"}
    f = make_skin(tmp_path / "les.skin", {
        "Les/skin.json": json.dumps(data), "Les/logo.png": PNG, "Les/icons/1f4be.png": PNG,
        "Les/style.qss": "#Paper { background-image: url(logo.png); } QWidget { background: url(C:/Windows/x.png); }"})
    s = skins.install(f)
    assert s.id == "user:les" and s.name == "Les" and not s.builtin
    assert s.color("accent") == "#22c55e"
    assert s.color("window") == skins.BUILTIN["dark"]["colors"]["window"]  # neplatná barva → ze základu „dark“
    assert s.font["family"] == "Comic Sans MS" and s.font["size"] == 20 and s.font["doc_family"] == "Georgia"
    assert "logo" in s.images and "canvas" not in s.images
    assert s.icon_path("💾") and s.icon_path("📂") is None
    assert "C:/Windows" not in s.qss and "url(none)" not in s.qss and str(s.folder.as_posix()) in s.qss
    assert [x.id for x in skins.installed_skins()] == ["user:les"]
    # export (šablona) a opětovná instalace
    out = skins.export(s, tmp_path / "kopie")
    assert out.suffix == ".skin"
    names = zipfile.ZipFile(out).namelist()
    assert {"skin.json", "logo.png", "icons/1f4be.png", "NAVOD.txt"} <= set(names)
    skins.remove(s)
    assert skins.installed_skins() == []
    again = skins.install(out)
    assert again.color("accent") == "#22c55e" and again.icon_path("💾")


@pytest.mark.parametrize("files, msg", [
    ({"skin.json": "{}", "../zlo.png": PNG}, "nepovolenou cestu"),
    ({"skin.json": "{}", "virus.exe": b"MZ"}, "nepovolený soubor"),
    ({"readme.txt": "x"}, "chybí soubor skin.json"),
    ({"skin.json": "[1, 2]"}, "správný tvar"),
])
def test_install_rejects_bad_archives(tmp_path, files, msg):
    with pytest.raises(skins.SkinError, match=msg):
        skins.install(make_skin(tmp_path / "zly.skin", files))
    assert skins.installed_skins() == []


def test_install_rejects_non_zip(tmp_path):
    (tmp_path / "x.skin").write_bytes(b"not a zip")
    with pytest.raises(skins.SkinError):
        skins.install(tmp_path / "x.skin")


def test_export_builtin_is_template(tmp_path):
    out = skins.export(skins.find("sepia"), tmp_path / "sepie.skin")
    data = json.loads(zipfile.ZipFile(out).read("skin.json"))
    assert data["name"].startswith("Sépie") and data["name"] != "Sépie (papír)"
    assert data["colors"]["accent"] == skins.find("sepia").color("accent")
    assert "paper_muted" in zipfile.ZipFile(out).read("NAVOD.txt").decode()


def test_apply_skin_in_window(tmp_path):
    QtWidgets = pytest.importorskip("PySide6.QtWidgets")
    from PySide6 import QtCore, QtGui

    app = QtWidgets.QApplication.instance() or QtWidgets.QApplication([])
    import qt_common
    import qt_main

    win = qt_main.MainWindow()
    try:
        win.nav.setCurrentRow(2)
        tab = win.settings.skins_tab
        ids = [tab.list.item(i).data(QtCore.Qt.UserRole) for i in range(tab.list.count())]
        assert ids[:4] == ["default", "dark", "sepia", "contrast"]
        tab.list.setCurrentRow(1)  # Tmavý – použije se hned a zapamatuje
        assert skins.current().id == "dark" and win.cfg["skin"] == "dark"
        assert app.palette().color(QtGui.QPalette.Window).name() == skins.find("dark").color("window")
        assert "#111827" in app.styleSheet()
        # ikony se kreslí až při zobrazení → po změně skinu mají novou barvu
        icon = qt_common.text_icon("B")
        img = icon.pixmap(32, 32).toImage()
        colors = {img.pixelColor(x, y).name() for x in range(32) for y in range(32) if img.pixelColor(x, y).alpha() > 200}
        assert skins.find("dark").color("icon") in colors
        # vlastní skin s logem a ikonou
        f = make_skin(tmp_path / "logo.skin", {"skin.json": json.dumps({"name": "Logo", "images": {"logo": "l.png"}}),
                                               "l.png": PNG, "icons/1f4be.png": PNG})
        assert tab.install_file(str(f))
        assert skins.current().id == "user:logo" and win.cfg["skin"] == "user:logo"
        assert not win.logo.pixmap().isNull()
        assert not qt_common.emoji_icon("💾").pixmap(16, 16).isNull()
        assert tab.b_remove.isEnabled()
    finally:
        skins.apply(skins.find("default"), app)
        win.hide()
        win.deleteLater()
