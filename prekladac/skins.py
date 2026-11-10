"""Skiny (vzhledy) programu – podobně jako ve Winampu se dají doinstalovat ze souboru .skin.

Soubor .skin je obyčejný ZIP:

    skin.json        – název, autor, barvy, písmo (povinný)
    logo.png         – vlastní logo v postranním panelu (nepovinné)
    canvas.png       – obrázek na pozadí plochy za stránkou (nepovinné)
    sidebar.png      – obrázek na pozadí postranního panelu (nepovinné)
    icons/1f4be.png  – vlastní ikony tlačítek; název = kód emoji (💾 = 1f4be) (nepovinné)
    style.qss        – další styly Qt pro pokročilé (nepovinné)

Skin obsahuje jen barvy, obrázky a styly – žádný spustitelný kód. Při instalaci se kontroluje, že
v archivu nejsou jiné soubory, cesty mimo složku skinu ani nepřiměřeně velká data.
Barvy, které skin neuvede, se převezmou ze skinu „base“ (výchozí světlý, nebo „dark“ pro tmavé).
"""

from __future__ import annotations

import json
import re
import shutil
import string
import sys
import tempfile
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

SKIN_EXT = ".skin"
MAX_FILES = 300
MAX_TOTAL = 30 * 1024 * 1024
MAX_FILE = 8 * 1024 * 1024
ALLOWED_EXT = {".json", ".qss", ".png", ".jpg", ".jpeg", ".webp", ".txt", ".md"}
IMAGE_KEYS = ("logo", "canvas", "sidebar")
_COLOR = re.compile(r"^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")
_FONT = re.compile(r"^[\w \-.]{1,60}$")


class SkinError(Exception):
    pass


def _assets() -> Path:
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    return base / "assets" / "skins"


def skins_dir() -> Path:
    import components

    p = components.app_dir() / "skins"
    p.mkdir(parents=True, exist_ok=True)
    return p


def _builtin_data() -> list[dict]:
    return json.loads((_assets() / "builtin.json").read_text(encoding="utf-8"))["skins"]


BUILTIN: dict[str, dict] = {s["id"]: s for s in _builtin_data()}
TOKENS: tuple[str, ...] = tuple(BUILTIN["default"]["colors"])


@dataclass
class Skin:
    id: str
    name: str
    author: str = ""
    description: str = ""
    dark: bool = False
    colors: dict[str, str] = field(default_factory=dict)
    font: dict = field(default_factory=dict)
    radius: int = 6
    images: dict[str, Path] = field(default_factory=dict)  # logo / canvas / sidebar → cesta k souboru
    qss: str = ""
    folder: Path | None = None  # složka nainstalovaného skinu (None = vestavěný)

    @property
    def builtin(self) -> bool:
        return self.folder is None

    def color(self, token: str) -> str:
        return self.colors.get(token) or BUILTIN["default"]["colors"].get(token, "#ff00ff")

    def icon_path(self, ch: str) -> Path | None:
        if not self.folder:
            return None
        code = "-".join(f"{ord(c):x}" for c in ch if c not in "️‍")
        p = self.folder / "icons" / f"{code}.png"
        return p if p.is_file() else None


# ------------------------------------------------------------------ načtení skinu
def _clean_font(font: dict, base: dict) -> dict:
    out = dict(base)
    for key in ("family", "doc_family"):
        v = str(font.get(key, "")).strip()
        if v and _FONT.match(v):
            out[key] = v
    for key, lo, hi in (("size", 7, 20), ("doc_size", 8, 28)):
        try:
            if key in font:
                out[key] = max(lo, min(hi, float(font[key])))
        except (TypeError, ValueError):
            pass
    return out


def _clean_qss(qss: str, folder: Path) -> str:
    """url(...) jen na soubory uvnitř složky skinu (přepíše se na plnou cestu), jiné odkazy se zahodí."""
    root = folder.resolve()

    def fix(m: re.Match) -> str:
        ref = m.group(1).strip().strip("\"'")
        try:
            p = (folder / ref).resolve()
            if root in p.parents and p.is_file():
                return f'url("{p.as_posix()}")'
        except (OSError, ValueError):
            pass
        return "none"

    return re.sub(r"url\(([^)]*)\)", fix, qss)


def from_dict(data: dict, folder: Path | None = None, skin_id: str | None = None) -> Skin:
    if not isinstance(data, dict):
        raise SkinError("skin.json nemá správný tvar (čekal jsem objekt s položkami name, colors…).")
    base_id = str(data.get("base") or ("dark" if data.get("dark") else "default"))
    base = BUILTIN.get(base_id, BUILTIN["default"])
    colors = dict(base["colors"])
    for k, v in (data.get("colors") or {}).items():
        if k in colors and isinstance(v, str) and _COLOR.match(v.strip()):
            colors[k] = v.strip().lower()
    images: dict[str, Path] = {}
    qss = ""
    if folder:
        for key in IMAGE_KEYS:
            name = (data.get("images") or {}).get(key)
            if isinstance(name, str) and name:
                p = (folder / name).resolve()
                if folder.resolve() in p.parents and p.is_file():
                    images[key] = p
        qf = data.get("qss")
        if isinstance(qf, str) and qf:
            p = (folder / qf).resolve()
            if folder.resolve() in p.parents and p.is_file():
                qss = _clean_qss(p.read_text(encoding="utf-8", errors="replace"), folder)
    try:
        radius = max(0, min(16, int(data.get("radius", base.get("radius", 6)))))
    except (TypeError, ValueError):
        radius = 6
    name = str(data.get("name") or skin_id or "Bez názvu")[:60]
    return Skin(id=skin_id or str(data.get("id") or slug(name)), name=name,
                author=str(data.get("author", ""))[:80], description=str(data.get("description", ""))[:300],
                dark=bool(data.get("dark", base.get("dark", False))), colors=colors,
                font=_clean_font(data.get("font") or {}, base.get("font", {})), radius=radius,
                images=images, qss=qss, folder=folder)


def slug(name: str) -> str:
    import unicodedata

    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:40] or "skin"


def builtin_skins() -> list[Skin]:
    return [from_dict(d, None, d["id"]) for d in BUILTIN.values()]


def installed_skins() -> list[Skin]:
    out = []
    for d in sorted(skins_dir().iterdir()):
        f = d / "skin.json"
        if d.is_dir() and f.is_file():
            try:
                out.append(from_dict(json.loads(f.read_text(encoding="utf-8")), d, "user:" + d.name))
            except Exception:  # noqa: BLE001 – poškozený skin se jen nezobrazí
                continue
    return out


def all_skins() -> list[Skin]:
    return builtin_skins() + installed_skins()


def find(skin_id: str | None) -> Skin:
    for s in all_skins():
        if s.id == skin_id:
            return s
    return from_dict(BUILTIN["default"], None, "default")


# ------------------------------------------------------------------ instalace / export
def install(path: str | Path) -> Skin:
    """Nainstaluje skin ze souboru .skin (ZIP) nebo samotného skin.json. Vrátí nainstalovaný skin."""
    path = Path(path)
    tmp = Path(tempfile.mkdtemp(prefix="skin-"))
    try:
        if path.suffix.lower() == ".json":
            shutil.copy(path, tmp / "skin.json")
        else:
            try:
                zf = zipfile.ZipFile(path)
            except zipfile.BadZipFile as e:
                raise SkinError("Soubor není skin (čekal jsem archiv .skin/.zip se souborem skin.json).") from e
            with zf:
                infos = [i for i in zf.infolist() if not i.is_dir()]
                if len(infos) > MAX_FILES:
                    raise SkinError(f"Skin obsahuje příliš mnoho souborů (víc než {MAX_FILES}).")
                if sum(i.file_size for i in infos) > MAX_TOTAL:
                    raise SkinError("Skin je po rozbalení příliš velký (víc než 30 MB).")
                names = [i.filename.replace("\\", "/") for i in infos]
                prefix = ""
                if "skin.json" not in names:  # archiv se složkou navíc: Muj-skin/skin.json
                    tops = {n.split("/", 1)[0] for n in names}
                    if len(tops) == 1 and f"{next(iter(tops))}/skin.json" in names:
                        prefix = next(iter(tops)) + "/"
                    else:
                        raise SkinError("V archivu chybí soubor skin.json.")
                for info, name in zip(infos, names):
                    rel = name[len(prefix):] if name.startswith(prefix) else None
                    parts = rel.split("/") if rel else []
                    if (not rel or rel.startswith("/") or ":" in rel or any(p in ("", ".", "..") for p in parts)):
                        raise SkinError(f"Skin obsahuje nepovolenou cestu: {name}")
                    if Path(rel).suffix.lower() not in ALLOWED_EXT:
                        raise SkinError(f"Skin obsahuje nepovolený soubor: {name} (povoleny jsou jen obrázky, "
                                        "skin.json, styly .qss a texty).")
                    if info.file_size > MAX_FILE:
                        raise SkinError(f"Soubor {name} ve skinu je příliš velký.")
                    dest = tmp.joinpath(*parts)
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    with zf.open(info) as src, open(dest, "wb") as out:
                        out.write(src.read(MAX_FILE + 1)[:MAX_FILE])
        try:
            data = json.loads((tmp / "skin.json").read_text(encoding="utf-8-sig"))
        except (OSError, ValueError) as e:
            raise SkinError(f"skin.json nejde přečíst: {e}") from e
        from_dict(data, tmp)  # kontrola tvaru
        sid = slug(str(data.get("name") or path.stem))
        dest = skins_dir() / sid
        if dest.exists():
            shutil.rmtree(dest)  # nová verze stejného skinu nahradí starou
        shutil.move(str(tmp), dest)
        return from_dict(data, dest, "user:" + sid)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def remove(skin: Skin) -> None:
    if skin.folder and skins_dir().resolve() in skin.folder.resolve().parents:
        shutil.rmtree(skin.folder, ignore_errors=True)


GUIDE = """Jak upravit skin pro Překladač
==============================

1. Soubor .skin je obyčejný ZIP. Přejmenujte ho na .zip a rozbalte.
2. V souboru skin.json změňte "name" (název skinu) a barvy v "colors" (zápis #rrggbb).
   Barvy, které smažete, se doplní z "base" ("default" = světlý, "dark" = tmavý).
3. Volitelně přidejte obrázky a do "images" napište jejich názvy:
     "logo": "logo.png"       – logo v postranním panelu (čtvercové, např. 72×72)
     "canvas": "canvas.png"   – pozadí plochy za stránkou
     "sidebar": "sidebar.png" – pozadí postranního panelu
4. Vlastní ikony tlačítek dejte do složky icons/ – název je kód emoji tlačítka,
   např. 💾 = 1f4be.png, 📂 = 1f4c2.png, 🌐 = 1f310.png (kódy najdete na emojipedia.org).
5. Pokročilí mohou přidat style.qss (styly Qt) a do skin.json "qss": "style.qss".
6. Vše znovu zabalte do ZIP (skin.json musí být v kořeni), přejmenujte na .skin
   a nainstalujte v Nastavení → Vzhled → Instalovat skin…

Názvy barev:
""" + "\n".join(f"  {t}" for t in TOKENS) + "\n"


def export(skin: Skin, dest: str | Path) -> Path:
    """Uloží skin jako .skin – slouží i jako šablona pro vlastní skin."""
    dest = Path(dest)
    if dest.suffix.lower() != SKIN_EXT:
        dest = dest.with_suffix(SKIN_EXT)
    data = {"name": skin.name if not skin.builtin else f"{skin.name} – můj", "author": skin.author,
            "description": skin.description, "base": "dark" if skin.dark else "default", "dark": skin.dark,
            "colors": dict(skin.colors), "font": dict(skin.font), "radius": skin.radius, "images": {}}
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        if skin.folder:
            for p in sorted(skin.folder.rglob("*")):
                rel = p.relative_to(skin.folder).as_posix()
                if p.is_file() and rel != "skin.json":
                    zf.write(p, rel)
            try:
                orig = json.loads((skin.folder / "skin.json").read_text(encoding="utf-8"))
                data["images"] = orig.get("images", {})
                if orig.get("qss"):
                    data["qss"] = orig["qss"]
            except Exception:  # noqa: BLE001
                pass
        zf.writestr("skin.json", json.dumps(data, ensure_ascii=False, indent=2))
        if not skin.folder or not (skin.folder / "NAVOD.txt").exists():
            zf.writestr("NAVOD.txt", GUIDE)
    return dest


# ------------------------------------------------------------------ styly Qt
TEMPLATE = string.Template("""
QWidget { font-family: "$font", "Noto Sans", sans-serif; font-size: ${size}pt; color: $text; }
QMainWindow, QDialog { background: $window; }
#Sidebar { background: $sidebar; border: none; color: $sidebar_text; outline: 0; padding-top: 8px; }
#Sidebar::item { padding: 12px 16px; border-radius: 8px; margin: 2px 8px; color: $sidebar_item; }
#Sidebar::item:selected { background: $accent; color: $accent_text; }
#Sidebar::item:hover:!selected { background: $sidebar_hover; }
#SidePanel { background: $sidebar; $sidebar_image }
#AppTitle { color: $sidebar_title; font-size: 13pt; font-weight: 600; padding: 16px 16px 4px 16px; background: $sidebar; }
#AppVersion { color: $sidebar_muted; padding: 0; background: transparent; font-size: 8.5pt; }
#SideHeader { background: transparent; }
#SideHeader QLabel { background: transparent; }
#AppName { color: $sidebar_title; font-size: 13pt; font-weight: 600; }
QToolButton#SideToggle { color: $sidebar_item; background: transparent; border: none; border-radius: 6px;
    font-size: 15pt; padding: 2px 8px; }
QToolButton#SideToggle:hover { background: $sidebar_hover; color: $sidebar_title; }
#PageTitle { font-size: 16pt; font-weight: 600; color: $heading; padding: 4px 0 8px 0; }
QGroupBox { background: $surface; border: 1px solid $border; border-radius: ${radius_big}px; margin-top: 14px;
    padding: 12px 10px 10px 10px; }
QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 4px; color: $group_title; font-weight: 600; }
QLineEdit, QComboBox, QSpinBox, QPlainTextEdit, QTextEdit, QListWidget {
    background: $surface; border: 1px solid $input_border; border-radius: ${radius}px; padding: 4px 6px; }
QLineEdit:focus, QComboBox:focus, QSpinBox:focus, QPlainTextEdit:focus, QTextEdit:focus { border: 1px solid $accent; }
QComboBox QAbstractItemView { background: $surface; color: $text; selection-background-color: $accent;
    selection-color: $accent_text; }
QMenu { background: $surface; color: $text; border: 1px solid $input_border; }
QMenu::item:selected { background: $accent; color: $accent_text; }
QToolTip { background: $surface; color: $text; border: 1px solid $input_border; }
QPushButton { background: $surface; border: 1px solid $input_border; border-radius: ${radius}px; padding: 6px 14px; }
QPushButton:hover { background: $hover; border-color: $hover_border; }
QPushButton:disabled { color: $disabled_text; background: $disabled_bg; }
QPushButton#Primary { background: $accent; color: $accent_text; border: none; font-weight: 600; padding: 8px 20px; }
QPushButton#Primary:hover { background: $accent_hover; }
QPushButton#Primary:disabled { background: $accent_disabled; }
QPushButton#Danger { background: $danger_bg; border: 1px solid $danger_border; color: $danger_text; }
QProgressBar { border: none; background: $border; border-radius: 6px; height: 12px; text-align: center; color: transparent; }
QProgressBar::chunk { background: $accent; border-radius: 6px; }
QTabWidget::pane { border: 1px solid $border; border-radius: 8px; background: $surface; top: -1px; }
QTabBar::tab { padding: 7px 16px; border: 1px solid transparent; border-top-left-radius: 6px; border-top-right-radius: 6px; }
QTabBar::tab:selected { background: $surface; border-color: $border; border-bottom-color: $surface; color: $accent;
    font-weight: 600; }
QScrollArea { border: none; background: transparent; }
#Ribbon { background: $surface; border-bottom: 1px solid $ribbon_border; }
#RibbonGroup { background: transparent; }
#RibbonLabel { color: $muted; font-size: 8pt; }
#RibbonBar { background: $surface; border-bottom: 1px solid $ribbon_border; }
#RibbonBar QTabWidget::pane { border: none; background: $surface; }
QToolButton#BigAction, QToolButton#BigPrimary { padding: 4px 6px; font-size: 9pt; }
QToolButton#BigPrimary { background: $soft; border: 1px solid $soft_border; color: $soft_text; font-weight: 600; }
QToolButton#BigPrimary:hover { background: $soft_hover; border-color: $soft_hover_border; }
QToolButton#BigPrimary:disabled, QToolButton#BigAction:disabled { color: $disabled_text; background: transparent;
    border-color: transparent; }
QToolButton#RecentBook { text-align: left; padding: 2px 8px; color: $link; }
QToolButton#RibbonArrow { background: $surface; border: 1px solid $input_border; border-radius: 4px; color: $group_title;
    font-size: 9pt; }
QToolButton#RibbonArrow:hover { background: $soft_hover; }
QToolButton#RibbonBack { font-weight: 600; padding: 4px 12px; color: $accent; }
QToolButton#RibbonBack:hover { background: $soft_hover; border-radius: 4px; }
QFrame#RibbonSep { color: $border; }
#InfoBar { background: $infobar; border-bottom: 1px solid $border; }
#Canvas, QFrame#EditorCanvas { background: $canvas; $canvas_image }
QScrollArea#CanvasScroll { background: $canvas; }
#Paper { background: $paper; border: 1px solid $paper_border; border-radius: 2px; }
#RulerCorner { background: $ruler; }
#Paper #Hint, #Paper QLabel#Hint { color: $paper_muted; }
#Paper QLabel { color: $doc_text; }
#Paper QListWidget, #Paper QLineEdit { background: $paper; color: $doc_text; border-color: $paper_border; }
QTextEdit#BookText { border: none; background: $paper; color: $doc_text; }
QLabel#CoverThumb { border: 1px solid $input_border; background: $paper; color: $disabled_text; }
#DocHeading { font-family: "$doc_font", "Times New Roman", serif; font-size: ${doc_heading_size}pt; color: $doc_heading; }
QPlainTextEdit#DocText { border: none; border-left: 3px solid $border; border-radius: 0; padding: 4px 10px;
    background: $paper; font-family: "$doc_font", "Times New Roman", serif; font-size: ${doc_size}pt; color: $doc_text; }
QPlainTextEdit#DocText:focus { border: none; border-left: 3px solid $accent; }
QListView#T9Popup { border: 1px solid $input_border; border-radius: 6px; padding: 2px; background: $surface; font-size: 10.5pt; }
QListView#T9Popup::item { padding: 3px 10px; }
QListView#T9Popup::item:selected { background: $accent; color: $accent_text; }
QToolButton { border: 1px solid transparent; border-radius: 4px; padding: 3px; background: transparent; }
QToolButton:hover { background: $tool_hover; border-color: $tool_hover_border; }
QToolButton:checked { background: $tool_checked; border-color: $hover_border; }
QListWidget#SkinList::item { padding: 6px; }
#Hint { color: $muted; }
#Ok { color: $ok; }
#Warn { color: $warn; }
""")


def _num(v: float) -> str:
    return f"{v:g}"


def stylesheet(skin: Skin) -> str:
    c = dict(BUILTIN["default"]["colors"], **skin.colors)
    img = lambda k: (f'background-image: url("{skin.images[k].as_posix()}"); background-position: center;'  # noqa: E731
                     if k in skin.images else "")
    f = skin.font
    css = TEMPLATE.substitute(
        c, font=f.get("family", "Segoe UI"), size=_num(f.get("size", 10)), doc_font=f.get("doc_family", "Georgia"),
        doc_size=_num(f.get("doc_size", 12)), doc_heading_size=_num(round(f.get("doc_size", 12) * 17 / 12, 1)),
        radius=skin.radius, radius_big=skin.radius + 4, canvas_image=img("canvas"), sidebar_image=img("sidebar"))
    return css + ("\n/* style.qss ze skinu */\n" + skin.qss if skin.qss else "")


# ------------------------------------------------------------------ aktuální skin
_current: Skin | None = None


def current() -> Skin:
    global _current
    if _current is None:
        _current = from_dict(BUILTIN["default"], None, "default")
    return _current


def C(token: str) -> str:
    """Barva aktuálního skinu (pro kreslení v kódu: pravítka, ikony…)."""
    return current().color(token)


def palette(skin: Skin):
    from PySide6 import QtGui

    q = QtGui.QColor
    pal = QtGui.QPalette()
    P = QtGui.QPalette
    for role, tok in ((P.Window, "window"), (P.WindowText, "text"), (P.Base, "surface"), (P.AlternateBase, "infobar"),
                      (P.Text, "text"), (P.Button, "surface"), (P.ButtonText, "text"), (P.Highlight, "accent"),
                      (P.HighlightedText, "accent_text"), (P.ToolTipBase, "surface"), (P.ToolTipText, "text"),
                      (P.PlaceholderText, "muted"), (P.Link, "link"), (P.BrightText, "danger_text"),
                      (P.Light, "surface"), (P.Midlight, "border"), (P.Mid, "input_border"), (P.Dark, "muted"),
                      (P.Shadow, "heading" if not skin.dark else "window")):
        pal.setColor(role, q(skin.color(tok)))
    for role in (P.WindowText, P.Text, P.ButtonText):
        pal.setColor(P.Disabled, role, q(skin.color("disabled_text")))
    return pal


def apply(skin: Skin, app=None) -> None:
    """Použije skin na celý program hned (bez restartu)."""
    global _current
    from PySide6 import QtWidgets

    _current = skin
    app = app or QtWidgets.QApplication.instance()
    if app is None:
        return
    app.setPalette(palette(skin))
    app.setStyleSheet(stylesheet(skin))
    for w in app.allWidgets():
        hook = getattr(w, "skin_changed", None)
        if callable(hook):
            try:
                hook()
            except Exception:  # noqa: BLE001
                pass
        w.update()
