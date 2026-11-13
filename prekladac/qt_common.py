"""Společné prvky okna v Qt: vzhled, ikony a spouštění pomalých akcí mimo okno."""

from __future__ import annotations

import sys
import threading
import traceback
from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets

from i18n import tr

ACCENT = "#2563eb"


def asset(name: str) -> str:
    """Cesta k souboru ve složce assets (ve spuštěném .exe je přibalená PyInstallerem)."""
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    return str(base / "assets" / name)


def app_icon() -> QtGui.QIcon:
    """Ikona programu: v záhlaví okna (16–32 px) zjednodušená, jinde podrobná."""
    icon = QtGui.QIcon()
    for n in (16, 24, 32):
        icon.addFile(asset(f"icon-{n}.png"), QtCore.QSize(n, n))
    icon.addFile(asset("icon.png"), QtCore.QSize(256, 256))
    return icon

SIDEBAR = "#1e293b"

import skins  # noqa: E402

STYLESHEET = skins.stylesheet(skins.current())  # výchozí vzhled; skin se použije přes skins.apply()


# ------------------------------------------------------------------- ikony
def _pixmap(size=32):
    pm = QtGui.QPixmap(size, size)
    pm.fill(QtCore.Qt.transparent)
    return pm


class LiveIcon(QtGui.QIconEngine):
    """Ikona kreslená až při zobrazení – po změně skinu se hned přebarví (bez restartu)."""

    def __init__(self, draw):
        super().__init__()
        self.draw = draw  # draw(painter) kreslí do plochy 32×32

    def clone(self):
        return LiveIcon(self.draw)

    def paint(self, painter, rect, mode, state):
        painter.save()
        painter.translate(rect.topLeft())
        painter.scale(rect.width() / 32, rect.height() / 32)
        if mode == QtGui.QIcon.Disabled:
            painter.setOpacity(0.35)
        painter.setRenderHint(QtGui.QPainter.Antialiasing)
        self.draw(painter)
        painter.restore()

    def pixmap(self, size, mode, state):
        pm = QtGui.QPixmap(size)
        pm.fill(QtCore.Qt.transparent)
        p = QtGui.QPainter(pm)
        self.paint(p, QtCore.QRect(QtCore.QPoint(0, 0), size), mode, state)
        p.end()
        return pm

    def scaledPixmap(self, size, mode, state, scale):
        pm = self.pixmap(QtCore.QSize(int(size.width() * scale), int(size.height() * scale)), mode, state)
        pm.setDevicePixelRatio(scale)
        return pm


def live_icon(draw) -> QtGui.QIcon:
    return QtGui.QIcon(LiveIcon(draw))


def text_icon(text: str, *, bold=False, italic=False, underline=False, strike=False, color: str | None = None,
              bar: str | None = None, size_pt=15, family="Segoe UI") -> QtGui.QIcon:
    return live_icon(lambda p: _draw_text_icon(p, text, bold, italic, underline, strike, color, bar, size_pt, family))


def _draw_text_icon(p, text, bold, italic, underline, strike, color, bar, size_pt, family):
    f = QtGui.QFont(family, size_pt)
    f.setBold(bold)
    f.setItalic(italic)
    f.setUnderline(underline)
    f.setStrikeOut(strike)
    p.setFont(f)
    p.setPen(QtGui.QColor(color or skins.C("icon")))
    rect = QtCore.QRect(0, -2 if bar else 0, 32, 32)
    p.drawText(rect, QtCore.Qt.AlignCenter, text)
    if bar:
        p.fillRect(QtCore.QRect(5, 26, 22, 5), QtGui.QColor(bar))


def lines_icon(kind: str) -> QtGui.QIcon:
    """Ikony zarovnání, odrážek a odsazení kreslené čarami."""
    return live_icon(lambda p: _draw_lines_icon(p, kind))


def _draw_lines_icon(p, kind: str):
    ink = QtGui.QColor(skins.C("icon"))
    pen = QtGui.QPen(ink, 2.2)
    p.setPen(pen)
    ys = [7, 13, 19, 25]
    if kind.startswith("align"):
        widths = [22, 14, 22, 14] if kind != "align_justify" else [22, 22, 22, 22]
        for y, wd in zip(ys, widths):
            if kind == "align_left":
                x = 5
            elif kind == "align_right":
                x = 27 - wd
            else:
                x = 16 - wd // 2 if kind == "align_center" else 5
            p.drawLine(x, y, x + wd, y)
    elif kind in ("bullets", "numbers"):
        for i, y in enumerate(ys[:3]):
            y += 2
            if kind == "bullets":
                p.setBrush(ink)
                p.drawEllipse(QtCore.QPointF(7, y), 1.8, 1.8)
            else:
                f = QtGui.QFont("Segoe UI", 7)
                p.setFont(f)
                p.drawText(QtCore.QRect(2, y - 6, 9, 12), QtCore.Qt.AlignCenter, str(i + 1))
            p.drawLine(13, y, 28, y)
    elif kind in ("indent_more", "indent_less"):
        for y in ys:
            p.drawLine(14, y, 28, y)
        path = QtGui.QPainterPath()
        if kind == "indent_more":
            path.moveTo(4, 11)
            path.lineTo(10, 16)
            path.lineTo(4, 21)
        else:
            path.moveTo(10, 11)
            path.lineTo(4, 16)
            path.lineTo(10, 21)
        p.drawPath(path)
    elif kind == "page_break":
        p.drawLine(6, 6, 26, 6)
        p.drawLine(6, 26, 26, 26)
        dash = QtGui.QPen(QtGui.QColor(skins.C("accent")), 2, QtCore.Qt.DashLine)
        p.setPen(dash)
        p.drawLine(3, 16, 29, 16)


_SKIN_ICONS: dict[str, QtGui.QPixmap] = {}


def emoji_icon(ch: str) -> QtGui.QIcon:
    """Ikona z emoji; skin může mít vlastní obrázek (icons/<kód emoji>.png)."""
    return live_icon(lambda p: _draw_emoji(p, ch))


def _draw_emoji(p, ch: str):
    custom = skins.current().icon_path(ch)
    if custom:
        key = str(custom)
        if key not in _SKIN_ICONS:
            _SKIN_ICONS[key] = QtGui.QPixmap(key)
        pm = _SKIN_ICONS[key]
        if not pm.isNull():
            p.setRenderHint(QtGui.QPainter.SmoothPixmapTransform)
            p.drawPixmap(QtCore.QRectF(1, 1, 30, 30), pm, QtCore.QRectF(pm.rect()))
            return
    p.setFont(QtGui.QFont("Segoe UI Emoji", 16))
    p.drawText(QtCore.QRect(0, 0, 32, 32), QtCore.Qt.AlignCenter, ch)


# --------------------------------------------- pomalé akce mimo hlavní okno
class Bridge(QtCore.QObject):
    """Předává výsledky z vláken do hlavního (okenního) vlákna."""

    call = QtCore.Signal(object)

    def __init__(self):
        super().__init__()
        self.call.connect(lambda fn: fn(), QtCore.Qt.QueuedConnection)

    def later(self, fn) -> None:
        self.call.emit(fn)


BRIDGE: Bridge | None = None


def bridge() -> Bridge:
    global BRIDGE
    if BRIDGE is None:
        BRIDGE = Bridge()
    return BRIDGE


def run_bg(fn, done=None, owner=None) -> threading.Thread:
    """Spustí fn() ve vlákně; done(výsledek, chyba) se zavolá v okenním vlákně.
    owner = okno, bez kterého done nemá smysl (když se mezitím zavře, done se nezavolá)."""
    b = bridge()
    if done and owner is not None:
        from shiboken6 import isValid

        user_done = done

        def done(res, err):  # noqa: F811
            if isValid(owner):
                user_done(res, err)

    def run():
        try:
            res, err = fn(), None
        except Exception as e:  # noqa: BLE001
            res, err = None, e
            if not isinstance(e, (RuntimeError, ValueError)) and __debug__:
                traceback.print_exc()
        if done:
            b.later(lambda: done(res, err))

    t = threading.Thread(target=run, daemon=True)
    t.start()
    return t


def label(text: str, name: str | None = None, wrap=True) -> QtWidgets.QLabel:
    lb = QtWidgets.QLabel(tr(text))
    lb.setWordWrap(wrap)
    if name:
        lb.setObjectName(name)
    return lb


def set_status(lb: QtWidgets.QLabel, ok: bool | None, text: str) -> None:
    """ok=True ✓ zeleně, False ⚠ varování, None ℹ jen informace (nic nechybí)."""
    text = " · ".join(tr(part) for part in text.split(" · "))  # každá část stavu zvlášť (jazyk programu)
    lb.setText({True: "✓ ", False: "⚠ ", None: "ℹ "}[ok] + text)
    lb.setObjectName({True: "Ok", False: "Warn", None: "Hint"}[ok])
    lb.style().unpolish(lb)
    lb.style().polish(lb)


def ask_pdf_passwords(parent, paths) -> bool:
    """U PDF chráněných heslem se zeptá na heslo (i opakovaně). False = uživatel zrušil."""
    from ebook_more import pdf_needs_password, set_pdf_password

    for p in paths:
        if not str(p).lower().endswith(".pdf") or not pdf_needs_password(str(p)):
            continue
        msg = tr("PDF je chráněné heslem:") + f"\n{Path(p).name}\n\n" + tr("Zadejte heslo k otevření (nebo heslo vlastníka):")
        while True:
            pw, ok = QtWidgets.QInputDialog.getText(parent, tr("🔒 Heslo k PDF"), msg, QtWidgets.QLineEdit.Password)
            if not ok:
                return False
            if set_pdf_password(str(p), pw):
                break
            msg = tr("Heslo nesouhlasí. Zkuste ho zadat znovu:") + f"\n{Path(p).name}"
    return True


_URL_RE = None


def linkify(text: str) -> str:
    """Text návodu → HTML s klikacími odkazy na webové stránky (adresy služeb k opsání zůstávají textem)."""
    import html as _html
    import re as _re

    global _URL_RE
    if _URL_RE is None:
        _URL_RE = _re.compile(r"https?://[^\s<>\"“”„]+")

    def link(m):
        url = m.group(0)
        tail = ""
        while url and url[-1] in ".,;:)!?“”":
            tail = url[-1] + tail
            url = url[:-1]
        plain = (_re.search(r"localhost|\d+\.\d+\.\d+\.\d+|IP-adresa|\.\.\.|…|/v1$", url)
                 or url.rstrip("/") in ("http:", "https:"))
        if plain:
            return url + tail
        return f'<a href="{url}">{url}</a>{tail}'

    out = []
    for line in _html.escape(text, quote=False).split("\n"):
        lead = len(line) - len(line.lstrip(" "))
        out.append("&nbsp;" * lead + _URL_RE.sub(link, line[lead:]))
    return "<div style='line-height:1.35'>" + "<br>".join(out) + "</div>"


def guide_view(text: str) -> QtWidgets.QTextBrowser:
    """Návod s klikacími odkazy (otevřou se v prohlížeči); text jde označit a kopírovat."""
    t = QtWidgets.QTextBrowser()
    t.setOpenExternalLinks(True)
    t.setHtml(linkify(text))
    return t
