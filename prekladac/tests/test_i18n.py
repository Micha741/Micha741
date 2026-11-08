import json
import os
import re
import sys
from pathlib import Path

import pytest

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import i18n  # noqa: E402

LANG_DIR = Path(__file__).resolve().parents[1] / "assets" / "lang"


@pytest.fixture(autouse=True)
def appdata(tmp_path, monkeypatch):
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))
    yield
    i18n.load("cs")


def test_language_files_consistent():
    files = {c: json.loads((LANG_DIR / f"{c}.json").read_text(encoding="utf-8")) for c in ("en", "sk", "de")}
    keys = {c: set(d) - {"_name", "_lang"} for c, d in files.items()}
    assert keys["en"] == keys["sk"] == keys["de"] and len(keys["en"]) > 400
    for c, d in files.items():
        for k, v in d.items():
            if k.startswith("_"):
                continue
            assert v.strip(), (c, k)
            assert k.count("{}") == v.count("{}"), (c, k, v)   # stejný počet doplňovaných míst
    assert json.loads((LANG_DIR / "index.json").read_text(encoding="utf-8")) == {
        "en": "English", "sk": "Slovenčina", "de": "Deutsch"}
    assert set(i18n.installed()) >= {"cs", "en", "sk", "de"}


def test_tr_exact_templates_and_parts():
    assert i18n.tr("Uložit") == "Uložit"                 # čeština beze změny
    assert i18n.load("en")
    assert i18n.tr("Uložit") == "Save"
    assert i18n.tr("➖ Odebrat vybrané (3)") == "➖ Remove selected (3)"
    assert i18n.tr("5 souborů, vybráno 2") == "5 files, 2 selected"
    assert i18n.tr("Neznámý text") == "Neznámý text"
    assert i18n.tr("  Uložit") == "  Save"
    i18n.load("de")
    assert i18n.tr("Otevřeno: kniha.json – napsáno 2 z 5 kapitol.") == \
        "Geöffnet: kniha.json – 2 von 5 Kapiteln geschrieben."
    assert not i18n.load("xx") and i18n.current() == "cs"


def test_download_language(monkeypatch):
    import free_engines
    payload = json.dumps({"_name": "Polski", **{f"k{i}": f"v{i}" for i in range(30)}}).encode()
    monkeypatch.setattr(free_engines, "http_request", lambda url, **k: (
        b'{"pl": "Polski", "en": "English"}' if url.endswith("index.json") else payload))
    assert i18n.available_online() == {"pl": "Polski", "en": "English"}
    p = i18n.download("pl")
    assert p.parent == i18n.user_dir() and i18n.installed()["pl"] == "Polski"
    with pytest.raises(ValueError):
        i18n.download("../evil")


def test_whole_window_in_english(tmp_path):
    from PySide6 import QtWidgets
    app = QtWidgets.QApplication.instance() or QtWidgets.QApplication([])
    import qt_main
    i18n.load("en")
    i18n.install(app)
    try:
        win = qt_main.MainWindow()
        win.show()
        app.processEvents()
        texts = [b.text() for b in win.findChildren(QtWidgets.QAbstractButton)]
        assert "➕ Add files…" in texts and "💾 Save settings" in texts
        assert win.nav.item(0).text() == "Translate"
        win.set_sidebar_collapsed(True)
        assert win.nav.item(0).toolTip() == "Translate"
        win.set_sidebar_collapsed(False)
        f = tmp_path / "a.txt"
        f.write_text("x", encoding="utf-8")
        win.translate.files.add([f])
        assert win.translate.files_info.text() == "1 file"
        assert win.translate.out_fmt.currentText() == "same as input"
        assert win.translate.out_fmt.currentData() == "stejný jako vstup"   # hodnota zůstává
        # zbytky češtiny ve viditelných popiscích stránky Překlad
        czech = re.compile(r"[ěščřžýáíéůú]", re.I)
        left = [lb.text() for lb in win.translate.findChildren(QtWidgets.QLabel)
                if lb.isVisibleTo(win) and czech.search(lb.text()) and "/" not in lb.text()]
        assert not left, left
        win.set_sidebar_collapsed(False)
        win.close()
    finally:
        i18n.uninstall(app)
    b = QtWidgets.QPushButton()
    b.setText("Uložit")
    assert b.text() == "Uložit"                          # po vypnutí zase česky
