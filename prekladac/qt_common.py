"""Společné prvky okna v Qt: vzhled, ikony a spouštění pomalých akcí mimo okno."""

from __future__ import annotations

import sys
import threading
import traceback
from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets

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

STYLESHEET = f"""
QWidget {{ font-family: "Segoe UI", "Noto Sans", sans-serif; font-size: 10pt; color: #1f2937; }}
QMainWindow, QDialog {{ background: #f4f6fa; }}
#Sidebar {{ background: {SIDEBAR}; border: none; color: #e2e8f0; outline: 0; padding-top: 8px; }}
#Sidebar::item {{ padding: 12px 16px; border-radius: 8px; margin: 2px 8px; color: #cbd5e1; }}
#Sidebar::item:selected {{ background: {ACCENT}; color: white; }}
#Sidebar::item:hover:!selected {{ background: #334155; }}
#AppTitle {{ color: white; font-size: 13pt; font-weight: 600; padding: 16px 16px 4px 16px; background: {SIDEBAR}; }}
#AppVersion {{ color: #94a3b8; padding: 0; background: {SIDEBAR}; font-size: 8.5pt; }}
#SideHeader {{ background: {SIDEBAR}; }}
#SideHeader QLabel {{ background: transparent; }}
#AppName {{ color: white; font-size: 13pt; font-weight: 600; }}
QToolButton#SideToggle {{ color: #cbd5e1; background: transparent; border: none; border-radius: 6px;
    font-size: 15pt; padding: 2px 8px; }}
QToolButton#SideToggle:hover {{ background: #334155; color: white; }}
#PageTitle {{ font-size: 16pt; font-weight: 600; color: #0f172a; padding: 4px 0 8px 0; }}
QGroupBox {{ background: white; border: 1px solid #e2e8f0; border-radius: 10px; margin-top: 14px; padding: 12px 10px 10px 10px; }}
QGroupBox::title {{ subcontrol-origin: margin; left: 12px; padding: 0 4px; color: #334155; font-weight: 600; }}
QLineEdit, QComboBox, QSpinBox, QPlainTextEdit, QTextEdit, QListWidget {{
    background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 6px; }}
QLineEdit:focus, QComboBox:focus, QSpinBox:focus, QPlainTextEdit:focus, QTextEdit:focus {{ border: 1px solid {ACCENT}; }}
QPushButton {{ background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 14px; }}
QPushButton:hover {{ background: #eef2ff; border-color: #a5b4fc; }}
QPushButton:disabled {{ color: #94a3b8; background: #f1f5f9; }}
QPushButton#Primary {{ background: {ACCENT}; color: white; border: none; font-weight: 600; padding: 8px 20px; }}
QPushButton#Primary:hover {{ background: #1d4ed8; }}
QPushButton#Primary:disabled {{ background: #93c5fd; }}
QPushButton#Danger {{ background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; }}
QProgressBar {{ border: none; background: #e2e8f0; border-radius: 6px; height: 12px; text-align: center; color: transparent; }}
QProgressBar::chunk {{ background: {ACCENT}; border-radius: 6px; }}
QTabWidget::pane {{ border: 1px solid #e2e8f0; border-radius: 8px; background: white; top: -1px; }}
QTabBar::tab {{ padding: 7px 16px; border: 1px solid transparent; border-top-left-radius: 6px; border-top-right-radius: 6px; }}
QTabBar::tab:selected {{ background: white; border-color: #e2e8f0; border-bottom-color: white; color: {ACCENT}; font-weight: 600; }}
QScrollArea {{ border: none; background: transparent; }}
#Ribbon {{ background: white; border-bottom: 1px solid #d0d7e2; }}
#RibbonGroup {{ background: transparent; }}
#RibbonLabel {{ color: #64748b; font-size: 8pt; }}
#RibbonBar {{ background: white; border-bottom: 1px solid #d0d7e2; }}
#RibbonBar QTabWidget::pane {{ border: none; background: white; }}
QToolButton#BigAction, QToolButton#BigPrimary {{ padding: 4px 6px; font-size: 9pt; }}
QToolButton#BigPrimary {{ background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; font-weight: 600; }}
QToolButton#BigPrimary:hover {{ background: #dbeafe; border-color: #93c5fd; }}
QToolButton#BigPrimary:disabled, QToolButton#BigAction:disabled {{ color: #94a3b8; background: transparent; border-color: transparent; }}
#InfoBar {{ background: #f8fafc; border-bottom: 1px solid #e2e8f0; }}
#Canvas {{ background: #e8ebf0; }}
QScrollArea#CanvasScroll {{ background: #e8ebf0; }}
#Paper {{ background: white; border: 1px solid #d5dbe5; border-radius: 2px; }}
#DocHeading {{ font-family: Georgia, "Times New Roman", serif; font-size: 17pt; color: #1e3a8a; }}
QPlainTextEdit#DocText {{ border: none; border-left: 3px solid #e2e8f0; border-radius: 0; padding: 4px 10px;
    background: white; font-family: Georgia, "Times New Roman", serif; font-size: 12pt; color: #111827; }}
QPlainTextEdit#DocText:focus {{ border: none; border-left: 3px solid {ACCENT}; }}
QToolButton {{ border: 1px solid transparent; border-radius: 4px; padding: 3px; background: transparent; }}
QToolButton:hover {{ background: #e0e7ff; border-color: #c7d2fe; }}
QToolButton:checked {{ background: #c7d2fe; border-color: #a5b4fc; }}
#Hint {{ color: #64748b; }}
#Ok {{ color: #15803d; }}
#Warn {{ color: #b45309; }}
"""


# ------------------------------------------------------------------- ikony
def _pixmap(size=32):
    pm = QtGui.QPixmap(size, size)
    pm.fill(QtCore.Qt.transparent)
    return pm


def text_icon(text: str, *, bold=False, italic=False, underline=False, strike=False, color="#1f2937",
              bar: str | None = None, size_pt=15, family="Segoe UI") -> QtGui.QIcon:
    pm = _pixmap()
    p = QtGui.QPainter(pm)
    p.setRenderHint(QtGui.QPainter.Antialiasing)
    f = QtGui.QFont(family, size_pt)
    f.setBold(bold)
    f.setItalic(italic)
    f.setUnderline(underline)
    f.setStrikeOut(strike)
    p.setFont(f)
    p.setPen(QtGui.QColor(color))
    rect = QtCore.QRect(0, -2 if bar else 0, 32, 32)
    p.drawText(rect, QtCore.Qt.AlignCenter, text)
    if bar:
        p.fillRect(QtCore.QRect(5, 26, 22, 5), QtGui.QColor(bar))
    p.end()
    return QtGui.QIcon(pm)


def lines_icon(kind: str) -> QtGui.QIcon:
    """Ikony zarovnání, odrážek a odsazení kreslené čarami."""
    pm = _pixmap()
    p = QtGui.QPainter(pm)
    p.setRenderHint(QtGui.QPainter.Antialiasing)
    pen = QtGui.QPen(QtGui.QColor("#1f2937"), 2.2)
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
                p.setBrush(QtGui.QColor("#1f2937"))
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
        dash = QtGui.QPen(QtGui.QColor(ACCENT), 2, QtCore.Qt.DashLine)
        p.setPen(dash)
        p.drawLine(3, 16, 29, 16)
    p.end()
    return QtGui.QIcon(pm)


def emoji_icon(ch: str) -> QtGui.QIcon:
    pm = _pixmap()
    p = QtGui.QPainter(pm)
    f = QtGui.QFont("Segoe UI Emoji", 16)
    p.setFont(f)
    p.drawText(QtCore.QRect(0, 0, 32, 32), QtCore.Qt.AlignCenter, ch)
    p.end()
    return QtGui.QIcon(pm)


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


def run_bg(fn, done=None) -> threading.Thread:
    """Spustí fn() ve vlákně; done(výsledek, chyba) se zavolá v okenním vlákně."""
    b = bridge()

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
    lb = QtWidgets.QLabel(text)
    lb.setWordWrap(wrap)
    if name:
        lb.setObjectName(name)
    return lb


def set_status(lb: QtWidgets.QLabel, ok: bool, text: str) -> None:
    lb.setText(("✓ " if ok else "⚠ ") + text)
    lb.setObjectName("Ok" if ok else "Warn")
    lb.style().unpolish(lb)
    lb.style().polish(lb)
