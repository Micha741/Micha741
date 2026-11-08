"""Jazyk programu (čeština, angličtina, slovenština, němčina, …).

Texty v kódu jsou česky. Pro jiný jazyk se při spuštění načte slovník `assets/lang/<kód>.json`
(přibalený: angličtina, slovenština) nebo `%APPDATA%\\Prekladac\\lang\\<kód>.json` (doinstalovaný z GitHubu)
a texty se přeloží za běhu:
  * při zobrazení okna/dialogu/menu se projdou všechny jeho prvky,
  * texty nastavené později (setText, setToolTip, hlášky, dialogy…) se přeloží při nastavení.
Slovník mapuje český text na přeložený. Klíče s „{}“ jsou šablony pro texty s čísly a názvy
(„Odebrat vybrané ({})“) – doplněné části se zkusí přeložit také.
Čeština = nic se nepřekládá a nic se nemění.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Callable

import components

LANG_NAMES = {"cs": "Čeština", "en": "English", "sk": "Slovenčina", "de": "Deutsch"}
REPO_LANG_URL = "https://raw.githubusercontent.com/Micha741/Micha741/main/prekladac/assets/lang/"

_lang = "cs"
_map: dict[str, str] = {}
_patterns: list[tuple[re.Pattern, str]] = []
_patched: list[tuple[object, str, object]] = []
_filter = None
_qt_translator = None


# ------------------------------------------------------------------ soubory jazyků
def bundled_dir() -> Path:
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    return base / "assets" / "lang"


def user_dir() -> Path:
    return components.app_dir() / "lang"


def lang_file(code: str) -> Path | None:
    for d in (user_dir(), bundled_dir()):
        p = d / f"{code}.json"
        if p.is_file():
            return p
    return None


def installed() -> dict[str, str]:
    """Jazyky, které jde zvolit hned (čeština + přibalené + doinstalované)."""
    out = {"cs": LANG_NAMES["cs"]}
    for d in (bundled_dir(), user_dir()):
        if d.is_dir():
            for p in sorted(d.glob("*.json")):
                if p.stem != "index":
                    out[p.stem] = _name_of(p)
    return out


def _name_of(p: Path) -> str:
    try:
        return json.loads(p.read_text(encoding="utf-8")).get("_name") or LANG_NAMES.get(p.stem, p.stem)
    except Exception:  # noqa: BLE001
        return LANG_NAMES.get(p.stem, p.stem)


def available_online(timeout: float = 15) -> dict[str, str]:
    """Seznam jazyků ke stažení (index.json v repozitáři)."""
    from free_engines import http_request

    data = http_request(REPO_LANG_URL + "index.json", timeout=timeout, retries=1, service="Jazyky programu")
    return {k: v for k, v in json.loads(data.decode("utf-8")).items() if re.fullmatch(r"[a-z]{2}(_[A-Z]{2})?", k)}


def download(code: str, log: Callable[[str], None] = lambda _m: None) -> Path:
    """Stáhne slovník jazyka do %APPDATA%\\Prekladac\\lang (bez práv správce)."""
    from free_engines import http_request

    if not re.fullmatch(r"[a-z]{2}(_[A-Z]{2})?", code):
        raise ValueError(f"Neplatný kód jazyka: {code}")
    log(f"Stahuji jazyk {code}…")
    data = http_request(REPO_LANG_URL + f"{code}.json", timeout=60, retries=2, service="Jazyky programu")
    parsed = json.loads(data.decode("utf-8"))
    if not isinstance(parsed, dict) or len(parsed) < 20:
        raise ValueError("Stažený soubor jazyka je neplatný.")
    d = user_dir()
    d.mkdir(parents=True, exist_ok=True)
    dest = d / f"{code}.json"
    tmp = dest.with_suffix(".part")
    tmp.write_bytes(data)
    tmp.replace(dest)
    return dest


def system_language() -> str:
    """Výchozí jazyk podle Windows (při prvním spuštění), jinak čeština."""
    try:
        from PySide6.QtCore import QLocale

        code = QLocale.system().name()[:2]
    except Exception:  # noqa: BLE001
        return "cs"
    return code if code in ("en", "sk", "de") and lang_file(code) else "cs"


# ------------------------------------------------------------------ překlad textu
def current() -> str:
    return _lang


def load(code: str) -> bool:
    """Načte slovník. Vrátí False, když jazyk není k dispozici (pak zůstane čeština)."""
    global _lang, _map, _patterns
    _lang, _map, _patterns = "cs", {}, []
    if code == "cs":
        return True
    p = lang_file(code)
    if not p:
        return False
    data = json.loads(p.read_text(encoding="utf-8"))
    _map = {k: v for k, v in data.items() if not k.startswith("_") and isinstance(v, str) and v}
    pats = []
    for k, v in _map.items():
        if "{}" in k:
            rx = "^" + "(.*?)".join(re.escape(part) for part in k.split("{}")) + "$"
            pats.append((re.compile(rx, re.S), v))
    pats.sort(key=lambda kv: -len(kv[0].pattern))  # delší (konkrétnější) šablony dřív
    _patterns = pats
    _lang = code
    return True


def tr(text):
    """Přeloží text (není-li ve slovníku, vrátí ho beze změny)."""
    if _lang == "cs" or not isinstance(text, str) or not text:
        return text
    hit = _map.get(text)
    if hit is not None:
        return hit
    stripped = text.strip()
    if stripped != text and stripped in _map:  # mezery okolo zachovat
        return text.replace(stripped, _map[stripped])
    for rx, tmpl in _patterns:
        m = rx.match(text)
        if m:
            parts = [tr(g) for g in m.groups()]
            out = tmpl
            for p in parts:
                out = out.replace("{}", p, 1)
            return out
    return text


def tr_lines(text: str) -> str:
    """Delší text po řádcích (např. záznam průběhu)."""
    if _lang == "cs" or not text:
        return text
    t = tr(text)
    if t != text or "\n" not in text:
        return t
    return "\n".join(tr(line) for line in text.split("\n"))


# ------------------------------------------------------------------ Qt
def _wrap_strs(fn):
    def wrapper(*args, **kw):
        args = [tr(a) if isinstance(a, str) else a for a in args]
        kw = {k: (tr(v) if isinstance(v, str) else v) for k, v in kw.items()}
        return fn(*args, **kw)

    wrapper.__i18n_orig__ = fn
    return wrapper


def _patch(cls, name, factory=_wrap_strs):
    orig = getattr(cls, name)
    setattr(cls, name, factory(orig))
    _patched.append((cls, name, orig))


def _combo_add_item(orig):
    def add_item(self, *args):
        if self.isEditable():
            return orig(self, *args)
        args = list(args)
        i = 1 if args and not isinstance(args[0], str) else 0  # addItem(icon, text, data)
        if i < len(args) and isinstance(args[i], str):
            text = args[i]
            if len(args) == i + 1:  # bez dat – původní text uložit jako data
                args.append(text)
            args[i] = tr(text)
        return orig(self, *args)

    return add_item


def _combo_add_items(orig):
    def add_items(self, texts):
        if self.isEditable():
            return orig(self, texts)
        for t in texts:
            self.addItem(t)
        return None

    return add_items


def translate_tree(root) -> None:
    """Přeloží texty okna/dialogu a všech jeho prvků (vytvořených konstruktorem s textem)."""
    from PySide6 import QtWidgets

    widgets = [root] + root.findChildren(QtWidgets.QWidget)
    for w in widgets:
        try:
            if w.toolTip():
                w.setToolTip(w.toolTip())
            if w.isWindow() and w.windowTitle():
                w.setWindowTitle(w.windowTitle())
            if isinstance(w, QtWidgets.QLabel) and w.text():
                w.setText(w.text())
            elif isinstance(w, QtWidgets.QAbstractButton) and w.text():
                w.setText(w.text())
            elif isinstance(w, QtWidgets.QGroupBox) and w.title():
                w.setTitle(w.title())
            elif isinstance(w, QtWidgets.QTabWidget):
                for i in range(w.count()):
                    w.setTabText(i, w.tabText(i))
            elif isinstance(w, QtWidgets.QDockWidget) and w.windowTitle():
                w.setWindowTitle(w.windowTitle())
            elif isinstance(w, QtWidgets.QSpinBox):
                if w.suffix():
                    w.setSuffix(w.suffix())
            elif isinstance(w, QtWidgets.QComboBox) and not w.isEditable():
                for i in range(w.count()):
                    t = w.itemText(i)
                    if w.itemData(i) is None:
                        w.setItemData(i, t)
                    w.setItemText(i, tr(t))
            elif isinstance(w, (QtWidgets.QLineEdit, QtWidgets.QPlainTextEdit, QtWidgets.QTextEdit)):
                if w.placeholderText():
                    w.setPlaceholderText(w.placeholderText())
            elif isinstance(w, QtWidgets.QListWidget) and w.objectName() == "Sidebar":
                for i in range(w.count()):
                    it = w.item(i)
                    it.setText(tr(it.text()))
                    if it.data(0x0100):  # Qt.UserRole – název pro sbalený panel
                        it.setData(0x0100, tr(it.data(0x0100)))
            for a in w.actions():
                if a.text():
                    a.setText(a.text())
                if a.toolTip():
                    a.setToolTip(a.toolTip())
        except RuntimeError:  # prvek mezitím zanikl
            continue


def install(app) -> None:
    """Zapne překlad oken (volá se jednou po vytvoření QApplication, když jazyk není čeština)."""
    global _filter, _qt_translator
    from PySide6 import QtCore, QtGui, QtWidgets

    # standardní texty Qt (Ano/Ne, dialog souborů, tisk…)
    tr_qt = QtCore.QTranslator(app)
    path = QtCore.QLibraryInfo.path(QtCore.QLibraryInfo.TranslationsPath)
    if tr_qt.load(f"qtbase_{_lang}", path):
        app.installTranslator(tr_qt)
        _qt_translator = tr_qt
    if _lang == "cs" or _patched:
        return
    W, G = QtWidgets, QtGui
    for cls, names in ((W.QLabel, ("setText",)), (W.QAbstractButton, ("setText",)),
                       (W.QWidget, ("setToolTip", "setWindowTitle")), (W.QGroupBox, ("setTitle",)),
                       (W.QLineEdit, ("setPlaceholderText",)), (W.QPlainTextEdit, ("setPlaceholderText",)),
                       (W.QTextEdit, ("setPlaceholderText",)),
                       (W.QTabWidget, ("addTab", "insertTab", "setTabText", "setTabToolTip")),
                       (W.QMenu, ("addAction", "addMenu", "setTitle")), (G.QAction, ("setText", "setToolTip")),
                       (W.QListWidgetItem, ("setText", "setToolTip")), (W.QStatusBar, ("showMessage",)),
                       (W.QMessageBox, ("information", "warning", "critical", "question", "setText",
                                        "setInformativeText", "addButton")),
                       (W.QFileDialog, ("getOpenFileName", "getOpenFileNames", "getSaveFileName",
                                        "getExistingDirectory")),
                       (W.QInputDialog, ("getInt", "getText", "getItem")), (W.QToolTip, ("showText",)),
                       (W.QSpinBox, ("setSuffix", "setPrefix"))):
        for n in names:
            if n in ("information", "warning", "critical", "question", "getOpenFileName", "getOpenFileNames",
                     "getSaveFileName", "getExistingDirectory", "getInt", "getText", "getItem", "showText"):
                orig = getattr(cls, n)
                setattr(cls, n, staticmethod(_wrap_strs(orig)))
                _patched.append((cls, n, orig))
            else:
                _patch(cls, n)
    _patch(W.QComboBox, "addItem", _combo_add_item)
    _patch(W.QComboBox, "addItems", _combo_add_items)

    class ShowFilter(QtCore.QObject):
        def eventFilter(self, obj, ev):
            if ev.type() == QtCore.QEvent.Show and isinstance(obj, QtWidgets.QWidget) and obj.isWindow():
                translate_tree(obj)
            return False

    _filter = ShowFilter(app)
    app.installEventFilter(_filter)


def uninstall(app=None) -> None:
    """Vrátí vše do původního stavu (testy)."""
    global _filter
    for cls, name, orig in reversed(_patched):
        setattr(cls, name, orig)
    _patched.clear()
    if app is not None and _filter is not None:
        app.removeEventFilter(_filter)
    _filter = None
    load("cs")
