"""Čtečka knih ve Windows (režim „Čtení“ v okně knihy).

Kniha se vysází do stránek (jedna, nebo dvě vedle sebe jako otevřená kniha), listuje se klepnutím, kolečkem,
šipkami nebo tažením myší s animací otočení stránky. Dál: obsah, hledání v celé knize, záložky, zvýraznění
odstavců 4 barvami s poznámkou, překlad odstavce a slova (slovníček), čtení nahlas hlasem Windows.
Kniha se v režimu čtení nemění – záložky, označení a místo čtení se ukládají zvlášť (%APPDATA%\\Prekladac\\reader).
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import threading
import time
import unicodedata
from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets

from i18n import tr
from qt_common import bridge, emoji_icon, run_bg

Qt = QtCore.Qt

THEMES = {  # název, pozadí, text, popisky
    "day": ("Den", "#ffffff", "#1b1b1b", "#6b7280"),
    "sepia": ("Sépie", "#f5ecd9", "#3b2f20", "#7a6a55"),
    "night": ("Noc", "#121212", "#d6d3cc", "#8b8b8b"),
}
MARKS = {  # barva zvýraznění: název, ve dne, v noci
    "y": ("žlutá", "#fff2a8", "#5c4a0f"),
    "g": ("zelená", "#c9f2c7", "#1f4d2a"),
    "b": ("modrá", "#cfe3ff", "#1e3a5f"),
    "p": ("růžová", "#ffd3e6", "#5a2440"),
}
TURNS = {"curl": "otočení stránky", "slide": "posun", "fade": "prolnutí", "none": "bez animace"}
SPREADS = {"auto": "podle okna", "1": "jedna strana", "2": "dvě strany"}
DEFAULT_PREFS = {"font": "serif", "size": 13.0, "line": 1.45, "margin": 48, "theme": "sepia", "justify": True,
                 "turn": "curl", "spread": "auto", "tts_rate": 1.0}
FONTS = {"serif": "Georgia", "sans": "Segoe UI"}
LANG_CODES = {"čeština": "cs", "slovenština": "sk", "angličtina": "en", "němčina": "de", "polština": "pl",
              "francouzština": "fr", "španělština": "es", "italština": "it", "ruština": "ru", "ukrajinština": "uk",
              "maďarština": "hu"}


def fold(s: str) -> str:
    """Malá písmena bez diakritiky, stejná délka jako vstup (kvůli pozicím nálezů)."""
    return "".join((unicodedata.normalize("NFD", c)[0] if c.isalpha() else c) for c in s.lower())


def _app_dir() -> Path:
    import components

    return components.app_dir()


# ------------------------------------------------------------------ uložený stav knihy a slovníček
def book_key(project: dict) -> str:
    o = project.get("outline", {})
    first = (project.get("chapters") or [{}])[0].get("text", "")[:300]
    raw = f"{o.get('title', '')}|{project.get('author', '')}|{len(project.get('chapters', []))}|{first}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]


class ReaderState:
    def __init__(self, project: dict):
        self.path = _app_dir() / "reader" / f"{book_key(project)}.json"
        self.pos = 0
        self.bookmarks: list[dict] = []
        self.highlights: list[dict] = []
        try:
            d = json.loads(self.path.read_text(encoding="utf-8"))
            self.pos = int(d.get("pos", 0))
            self.bookmarks = list(d.get("bookmarks", []))
            self.highlights = list(d.get("highlights", []))
        except Exception:  # noqa: BLE001
            pass

    def save(self):
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text(json.dumps({"pos": self.pos, "bookmarks": self.bookmarks,
                                             "highlights": self.highlights}, ensure_ascii=False, indent=1),
                                 encoding="utf-8")
        except OSError:
            pass


def vocab_path() -> Path:
    return _app_dir() / "slovnicek.json"


def load_vocab() -> list[dict]:
    try:
        return list(json.loads(vocab_path().read_text(encoding="utf-8")))
    except Exception:  # noqa: BLE001
        return []


def save_vocab(items: list[dict]) -> None:
    vocab_path().write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")


def add_vocab(item: dict) -> list[dict]:
    """Stejné slovo do stejného jazyka se jen posune nahoru; nejvýš 2000 slov."""
    key = (item["word"].lower(), item.get("to", ""))
    items = [item] + [v for v in load_vocab() if (v.get("word", "").lower(), v.get("to", "")) != key]
    items = items[:2000]
    save_vocab(items)
    return items


def vocab_text(items: list[dict]) -> str:
    return "".join(f"{v['word']}\t{v['translation']}" + (f"\t{v['sentence']}" if v.get("sentence") else "") + "\n"
                   for v in items)


# ------------------------------------------------------------------ sazba knihy pro čtení
def fit_images(doc: QtGui.QTextDocument, pw: float, ph: float) -> None:
    """Obrázky podle velikosti stránky čtečky: obálka a obrázky „celá stránka“ co největší přes celou stránku,
    ostatní v šířce z editoru (vůči stránce 800 bodů), ale nikdy větší než stránka – nic se neořízne."""
    images = doc.property("reader_images") or []
    if not images:
        return
    m = doc.documentMargin()
    aw = max(40.0, pw - 2 * m - 4)
    ah = max(40.0, ph - 2 * m - 24)  # rezerva na řádek a mezery kolem obrázku
    cur = QtGui.QTextCursor(doc)
    cur.beginEditBlock()
    for im in images:
        nw, nh = im["nw"], im["nh"]
        if not nw or not nh:
            continue
        if im["cover"] or im["page"]:
            w = aw
        else:
            w = min(aw, aw * float(im["want"]) / 800.0) if im["want"] else min(aw, nw)
        h = w * nh / nw
        if h > ah:
            h, w = ah, ah * nw / nh
        c = QtGui.QTextCursor(doc)
        c.setPosition(im["pos"])
        c.setPosition(im["pos"] + 1, QtGui.QTextCursor.KeepAnchor)
        f = c.charFormat().toImageFormat()
        if not f.isValid():
            continue
        nf = QtGui.QTextImageFormat()
        nf.setName(im["name"])
        nf.setWidth(round(w, 1))
        nf.setHeight(round(h, 1))
        c.setCharFormat(nf)
    cur.endEditBlock()


def build_reader_doc(project: dict, prefs: dict) -> tuple[QtGui.QTextDocument, list[tuple[str, int]]]:
    """Kniha jako dokument pro čtení + seznam kapitol (název, pozice). Vzhled podle nastavení čtečky."""
    from qt_bookdoc import book_document

    doc = book_document(project)
    base = float(project.get("format", {}).get("size") or 12)
    ratio = float(prefs.get("size", 13)) / base
    family = FONTS.get(prefs.get("font", "serif"), "Georgia")
    font = QtGui.QFont(family)
    font.setPointSizeF(float(prefs.get("size", 13)))
    doc.setDefaultFont(font)
    doc.setDocumentMargin(float(prefs.get("margin", 48)))
    line = float(prefs.get("line", 1.45))
    prop = int(QtGui.QTextBlockFormat.LineHeightTypes.ProportionalHeight.value)
    cur = QtGui.QTextCursor(doc)
    cur.beginEditBlock()
    frags: list[tuple[int, int, QtGui.QTextCharFormat]] = []
    images: list[dict] = []  # obrázky se při každé změně velikosti stránky přizpůsobí (fit_images)
    cover = project.get("cover")
    b = doc.begin()
    while b.isValid():
        bf = b.blockFormat()
        has_img = any(it.fragment().isValid() and it.fragment().charFormat().isImageFormat() for it in b)
        if has_img:  # řádek s obrázkem bez řádkování navíc (jinak by obrázek přetekl stránku)
            bf.setLineHeight(100, prop)
            bf.setTopMargin(min(bf.topMargin(), 6))
            bf.setAlignment(Qt.AlignHCenter)  # obrázek vždy na střed stránky
        else:
            bf.setLineHeight(line * 100, prop)
        al = bf.alignment()
        al = int(al.value) if hasattr(al, "value") else int(al)
        if prefs.get("justify", True) and not (al & (0x2 | 0x4 | 0x8)) and len(b.text()) > 80:
            bf.setAlignment(Qt.AlignJustify)
        QtGui.QTextCursor(b).setBlockFormat(bf)
        for it in b:  # písmo a velikost podle čtečky, barvu textu určuje motiv (Den/Sépie/Noc)
            frag = it.fragment()
            if not frag.isValid():
                continue
            if frag.charFormat().isImageFormat():
                f = frag.charFormat().toImageFormat()
                img = doc.resource(QtGui.QTextDocument.ImageResource, QtCore.QUrl(f.name()))
                nw, nh = (img.width(), img.height()) if isinstance(img, QtGui.QImage) and not img.isNull() else (0, 0)
                images.append({"pos": frag.position(), "name": f.name(), "want": f.width() or nw, "nw": nw, "nh": nh,
                               "cover": bool(cover) and f.name() == cover and b.blockNumber() <= 1,
                               "page": (f.width() or 0) >= 790})  # „celá stránka“ z editoru (100 % šířky)
            else:
                frags.append((frag.position(), frag.length(), frag.charFormat()))
        b = b.next()
    for pos, ln, cf in frags:
        if cf.hasProperty(QtGui.QTextFormat.FontPointSize) and cf.fontPointSize() > 0:
            cf.setFontPointSize(cf.fontPointSize() * ratio)
        cf.setFontFamilies([family])
        cf.clearForeground()
        fc = QtGui.QTextCursor(doc)
        fc.setPosition(pos)
        fc.setPosition(pos + ln, QtGui.QTextCursor.KeepAnchor)
        fc.setCharFormat(cf)
    cur.endEditBlock()
    doc.setProperty("reader_images", images)
    # kapitoly: book_document začíná každou kapitolu nadpisem „N. Název“ na nové stránce
    chapters: list[tuple[str, int]] = []
    titles = project.get("outline", {}).get("chapters", [])
    b = doc.begin()
    for i, ch in enumerate(project.get("chapters", [])):
        name = ch.get("title") or (titles[i]["title"] if i < len(titles) else f"Kapitola {i + 1}")
        want = f"{i + 1}. {name}"
        while b.isValid() and b.text().strip() != want:
            b = b.next()
        if b.isValid():
            chapters.append((name, b.position()))
            b = b.next()
    return doc, chapters


# ------------------------------------------------------------------ stránky a otáčení
class PageView(QtWidgets.QWidget):
    """Vykreslí jednu nebo dvě stránky knihy a animaci listování."""

    def __init__(self, reader: "Reader"):
        super().__init__()
        self.reader = reader
        self.doc: QtGui.QTextDocument | None = None
        self.page = 0  # první zobrazená stránka (u dvou stran vždy sudá)
        self.anchor = 0  # místo čtení (pozice znaku) – drží se při změně písma, velikosti okna…
        self.starts: list[int] = [0]  # první znak každé stránky (spočítá se při sazbě)
        self._in_relayout = False
        self.pages = 1
        self.two = False
        self.pw = self.ph = 100.0
        self.cache: dict[int, QtGui.QPixmap] = {}
        self.turning: dict | None = None
        self.anim = QtCore.QVariantAnimation(self)
        self.anim.setEasingCurve(QtCore.QEasingCurve.OutCubic)
        self.anim.valueChanged.connect(self._anim_step)
        self.anim.finished.connect(self._anim_done)
        self._press: QtCore.QPointF | None = None
        self._dragging = False
        self.setFocusPolicy(Qt.StrongFocus)
        self.setMouseTracking(True)  # kurzor: nad textem „I“ (klik = odsud číst nahlas), u okrajů ruka (listovat)
        self.setMinimumSize(300, 300)

    # ---- sazba
    def set_document(self, doc: QtGui.QTextDocument):
        self.doc = doc
        self.relayout()

    def _watch_layout(self):
        """Písmo se měří podle okna čtečky; když Qt knihu přesto přesází (změna DPI, písma…), přepočítat stránky."""
        lay = self.doc.documentLayout()
        lay.setPaintDevice(self)
        if getattr(lay, "_reader_watch", None) is not self:
            lay._reader_watch = self
            lay.documentSizeChanged.connect(self._size_changed)  # metoda okna: po zavření se odpojí sama

    def _size_changed(self, _size=None):
        QtCore.QTimer.singleShot(0, self, self._layout_changed)  # s oknem jako kontextem – po zavření se nezavolá

    def _layout_changed(self):
        try:
            if not self.isVisible() and not self.starts:
                return
        except RuntimeError:  # okno už je zrušené
            return
        if self.doc is None or self._in_relayout or self.turning:
            return
        old = list(self.starts)
        self._compute_starts()
        if self.starts != old:
            self.page = self._norm(self.page_of(self.anchor))
            self.cache.clear()
            self.update()
            self.reader.page_changed()

    def relayout(self, keep_pos: int | None = None):
        if self.doc is None:
            return
        self.finish_turn()
        self._in_relayout = True
        self._watch_layout()
        pos = keep_pos if keep_pos is not None else self.anchor
        self.anchor = pos
        spread = self.reader.prefs.get("spread", "auto")
        w, h = max(200, self.width()), max(200, self.height())
        self.two = spread == "2" or (spread == "auto" and w >= h * 1.25)
        gutter = 24 if self.two else 0
        self.pw = (w - gutter) / 2 if self.two else min(w, 900)
        self.ph = h
        self.doc.setPageSize(QtCore.QSizeF(self.pw, self.ph))
        fit_images(self.doc, self.pw, self.ph)  # obálka a obrázky celé na stránce
        self.pages = max(1, self.doc.pageCount())
        self._compute_starts()
        self.cache.clear()
        self.page = self._norm(self.page_of(pos))
        self._in_relayout = False
        self.update()
        self.reader.page_changed()

    def _norm(self, p: int) -> int:
        p = max(0, min(self.pages - 1, p))
        return p - (p % 2) if self.two else p

    def step(self) -> int:
        return 2 if self.two else 1

    def _compute_starts(self):
        """První znak na každé stránce – jediný zdroj pro „na které stránce je znak“ i „kde stránka začíná“."""
        lay = self.doc.documentLayout()
        # Qt sází dlouhý dokument postupně – dokončit sazbu celé knihy, jinak by začátky stránek nesouhlasily
        lay.documentSize()
        lay.blockBoundingRect(self.doc.lastBlock())
        self.pages = max(1, self.doc.pageCount())
        m = self.doc.documentMargin()
        step = max(3.0, QtGui.QFontMetricsF(self.doc.defaultFont()).height() / 3)
        starts = [0]
        for n in range(1, self.pages):
            y0 = n * self.ph + m
            pos = -1
            dy = step
            while dy < self.ph * 0.6:  # první řádek textu na stránce (horní mezeru stránky přeskočit)
                pos = lay.hitTest(QtCore.QPointF(m + 2, y0 + dy), Qt.FuzzyHit)
                if pos > starts[-1]:
                    break
                dy += step
            starts.append(max(pos, starts[-1] + 1))
        self.starts = starts

    def page_of(self, pos: int) -> int:
        """Stránka, na které je znak na pozici pos."""
        import bisect

        return max(0, bisect.bisect_right(self.starts, max(0, pos)) - 1)

    def first_pos(self) -> int:
        """Pozice prvního znaku na zobrazené stránce (pro uložení místa čtení)."""
        if self.doc is None or not self.starts:
            return 0
        return self.starts[min(self.page, len(self.starts) - 1)]

    def visible_range(self) -> tuple[int, int]:
        if self.doc is None:
            return 0, 0
        lay = self.doc.documentLayout()
        last = min(self.pages - 1, self.page + self.step() - 1)
        a = lay.hitTest(QtCore.QPointF(1, self.page * self.ph + 1), Qt.FuzzyHit)
        b = lay.hitTest(QtCore.QPointF(self.pw - 1, (last + 1) * self.ph - 1), Qt.FuzzyHit)
        return max(0, a), max(a, b)

    # ---- vykreslení
    def slots(self) -> list[QtCore.QRectF]:
        """Obdélníky pro stránky na obrazovce (1 nebo 2)."""
        if self.two:
            gutter = 24
            return [QtCore.QRectF(0, 0, self.pw, self.ph), QtCore.QRectF(self.pw + gutter, 0, self.pw, self.ph)]
        x = (self.width() - self.pw) / 2
        return [QtCore.QRectF(x, 0, self.pw, self.ph)]

    def render(self, n: int) -> QtGui.QPixmap:
        if n in self.cache:
            return self.cache[n]
        dpr = self.devicePixelRatioF() or 1.0
        pm = QtGui.QPixmap(int(self.pw * dpr), int(self.ph * dpr))
        pm.setDevicePixelRatio(dpr)
        _n, bg, fg, muted = THEMES.get(self.reader.prefs.get("theme"), THEMES["sepia"])
        pm.fill(QtGui.QColor(bg))
        if self.doc is not None and 0 <= n < self.pages:
            p = QtGui.QPainter(pm)
            p.setRenderHint(QtGui.QPainter.Antialiasing)
            p.setRenderHint(QtGui.QPainter.TextAntialiasing)
            p.translate(0, -n * self.ph)
            clip = QtCore.QRectF(0, n * self.ph, self.pw, self.ph)
            p.setClipRect(clip)
            ctx = QtGui.QAbstractTextDocumentLayout.PaintContext()
            pal = QtGui.QPalette()
            pal.setColor(QtGui.QPalette.Text, QtGui.QColor(fg))
            ctx.palette = pal
            ctx.clip = clip
            ctx.selections = self.reader.selections()
            self.doc.documentLayout().draw(p, ctx)
            p.resetTransform()
            p.setClipping(False)
            p.setPen(QtGui.QColor(muted))  # číslo stránky dole
            f = QtGui.QFont(FONTS["sans"])
            f.setPointSizeF(8.5)
            p.setFont(f)
            p.drawText(QtCore.QRectF(0, self.ph - 26, self.pw, 20), Qt.AlignHCenter, str(n + 1))
            p.end()
        self.cache[n] = pm
        return pm

    def refresh(self):
        self.cache.clear()
        self.update()

    def paintEvent(self, _e):
        p = QtGui.QPainter(self)
        p.setRenderHint(QtGui.QPainter.SmoothPixmapTransform)
        _n, bg, _fg, _m = THEMES.get(self.reader.prefs.get("theme"), THEMES["sepia"])
        p.fillRect(self.rect(), QtGui.QColor(bg).darker(108 if self.reader.prefs.get("theme") != "night" else 80))
        slots = self.slots()
        t = self.turning
        if not t:
            for i, r in enumerate(slots):
                p.drawPixmap(r.topLeft(), self.render(self.page + i))
            if self.two:  # stín hřbetu knihy
                self._spine(p, slots)
            return
        k, d, a, b = t["t"], t["dir"], t["from"], t["to"]
        mode = self.reader.prefs.get("turn", "curl")
        if mode == "slide":
            w = self.width()
            for i, r in enumerate(slots):
                p.drawPixmap(r.topLeft() + QtCore.QPointF(-d * k * w, 0), self.render(a + i))
                p.drawPixmap(r.topLeft() + QtCore.QPointF(d * (1 - k) * w, 0), self.render(b + i))
        elif mode == "fade":
            for i, r in enumerate(slots):
                p.setOpacity(1 - k)
                p.drawPixmap(r.topLeft(), self.render(a + i))
                p.setOpacity(k)
                p.drawPixmap(r.topLeft(), self.render(b + i))
            p.setOpacity(1)
        elif not self.two:
            r = slots[0]
            if d > 0:  # dopředu: pod stránkou je další, aktuální se otáčí kolem levého okraje
                p.drawPixmap(r.topLeft(), self.render(b))
                self._sheet(p, self.render(a), r, k, anchor="left")
            else:  # zpět: předchozí stránka se přiklopí zleva
                p.drawPixmap(r.topLeft(), self.render(a))
                self._sheet(p, self.render(b), r, 1 - k, anchor="left")
        else:
            left, right = slots
            if d > 0:  # list z pravé strany se překlopí přes hřbet doleva
                p.drawPixmap(left.topLeft(), self.render(a))
                p.drawPixmap(right.topLeft(), self.render(b + 1))
                if k < 0.5:
                    self._sheet(p, self.render(a + 1), right, k * 2, anchor="left")
                else:
                    self._sheet(p, self.render(b), left, (1 - k) * 2, anchor="right")
            else:
                p.drawPixmap(left.topLeft(), self.render(b))
                p.drawPixmap(right.topLeft(), self.render(a + 1))
                if k < 0.5:
                    self._sheet(p, self.render(a), left, k * 2, anchor="right")
                else:
                    self._sheet(p, self.render(b + 1), right, (1 - k) * 2, anchor="left")
            self._spine(p, slots)

    def _spine(self, p: QtGui.QPainter, slots):
        x = slots[0].right() + 12
        g = QtGui.QLinearGradient(x - 18, 0, x + 18, 0)
        g.setColorAt(0, QtGui.QColor(0, 0, 0, 0))
        g.setColorAt(0.5, QtGui.QColor(0, 0, 0, 55))
        g.setColorAt(1, QtGui.QColor(0, 0, 0, 0))
        p.fillRect(QtCore.QRectF(x - 18, 0, 36, self.height()), g)

    def _sheet(self, p: QtGui.QPainter, pm: QtGui.QPixmap, r: QtCore.QRectF, k: float, anchor: str):
        """Otáčený list: k=0 leží, k=1 je kolmo (neviditelný). Perspektiva a stín na ohybu."""
        k = max(0.0, min(1.0, k))
        if k >= 0.999:
            return
        w = r.width() * math.cos(k * math.pi / 2)
        bulge = r.height() * 0.06 * math.sin(k * math.pi)
        if anchor == "left":
            fixed, free = r.left(), r.left() + w
        else:
            fixed, free = r.right(), r.right() - w
        dst = QtGui.QPolygonF([QtCore.QPointF(fixed, r.top()), QtCore.QPointF(free, r.top() - bulge),
                               QtCore.QPointF(free, r.bottom() + bulge), QtCore.QPointF(fixed, r.bottom())])
        if anchor == "right":
            dst = QtGui.QPolygonF([dst[1], dst[0], dst[3], dst[2]])
        src = QtGui.QPolygonF([QtCore.QPointF(0, 0), QtCore.QPointF(r.width(), 0),
                               QtCore.QPointF(r.width(), r.height()), QtCore.QPointF(0, r.height())])
        tf = QtGui.QTransform()
        if not QtGui.QTransform.quadToQuad(src, dst, tf):
            return
        # stín, který list vrhá na stránku pod sebou
        shadow_x = free
        sg = QtGui.QLinearGradient(shadow_x, 0, shadow_x + (40 if anchor == "left" else -40), 0)
        sg.setColorAt(0, QtGui.QColor(0, 0, 0, int(90 * math.sin(k * math.pi))))
        sg.setColorAt(1, QtGui.QColor(0, 0, 0, 0))
        p.fillRect(QtCore.QRectF(min(shadow_x, shadow_x + (40 if anchor == "left" else -40)), r.top(), 40, r.height()), sg)
        p.save()
        p.setTransform(tf, True)
        p.drawPixmap(QtCore.QPointF(0, 0), pm, QtCore.QRectF(0, 0, pm.width(), pm.height()))
        g = QtGui.QLinearGradient(0, 0, r.width(), 0)  # ztmavení listu směrem k volnému okraji
        a = int(110 * k)
        if anchor == "left":
            g.setColorAt(0, QtGui.QColor(0, 0, 0, 0))
            g.setColorAt(1, QtGui.QColor(0, 0, 0, a))
        else:
            g.setColorAt(0, QtGui.QColor(0, 0, 0, a))
            g.setColorAt(1, QtGui.QColor(0, 0, 0, 0))
        p.fillRect(QtCore.QRectF(0, 0, r.width(), r.height()), g)
        p.restore()

    # ---- listování
    def can_turn(self, d: int) -> bool:
        return 0 <= self.page + d * self.step() <= self.pages - 1

    def turn(self, d: int, animate: bool = True):
        if self.turning or not self.can_turn(d):
            return
        target = self._norm(self.page + d * self.step())
        if not animate or self.reader.prefs.get("turn", "curl") == "none":
            self.page = target
            self.anchor = self.first_pos()
            self.update()
            self.reader.page_changed()
            return
        self.turning = {"dir": d, "from": self.page, "to": target, "t": 0.0, "done": True}
        self.anim.stop()
        self.anim.setStartValue(0.0)
        self.anim.setEndValue(1.0)
        self.anim.setDuration(460 if self.reader.prefs.get("turn") == "curl" else 260)
        self.anim.start()

    def goto_page(self, n: int, animate: bool = False):
        n = self._norm(n)
        if n == self.page:
            return
        if animate and abs(n - self.page) == self.step():
            self.turn(1 if n > self.page else -1)
            return
        self.page = n
        self.anchor = self.first_pos()
        self.update()
        self.reader.page_changed()

    def finish_turn(self):
        """Dokončí rozpracované otočení stránky hned (např. před změnou sazby)."""
        if self.turning:
            self.anim.stop()
            if self.turning.get("done", True):
                self.turning["t"] = 1.0
            self._anim_done()

    def _anim_step(self, v):
        if self.turning:
            self.turning["t"] = float(v)
            self.update()

    def _anim_done(self):
        t = self.turning
        if not t:
            return
        if t.get("done", True):
            self.page = t["to"]
            self.anchor = self.first_pos()
        self.turning = None
        self.update()
        self.reader.page_changed()

    # ---- myš a klávesy
    def mousePressEvent(self, e):
        if e.button() == Qt.LeftButton and not self.anim.state() == QtCore.QAbstractAnimation.Running:
            self._press = e.position()
            self._dragging = False
        super().mousePressEvent(e)

    EDGE = 0.15  # klik do pruhu u levého / pravého okraje = otočit stránku

    def _edge(self, pt: QtCore.QPointF) -> int:
        x = pt.x() / max(1, self.width())
        return -1 if x < self.EDGE else 1 if x > 1 - self.EDGE else 0

    def mouseMoveEvent(self, e):
        if self._press is None:
            over_text = not self._edge(e.position()) and self.hit(e.position()) is not None
            self.setCursor(Qt.IBeamCursor if over_text else Qt.PointingHandCursor if self._edge(e.position())
                           else Qt.ArrowCursor)
            return
        dx = e.position().x() - self._press.x()
        if not self._dragging and abs(dx) > 10:
            d = -1 if dx > 0 else 1
            if not self.can_turn(d):
                return
            self._dragging = True
            self.turning = {"dir": d, "from": self.page, "to": self._norm(self.page + d * self.step()), "t": 0.0}
        if self._dragging and self.turning:
            self.turning["t"] = max(0.0, min(1.0, abs(dx) / (self.width() * (0.5 if self.two else 0.8))))
            self.update()

    def mouseReleaseEvent(self, e):
        if self._press is None:
            return
        press, self._press = self._press, None
        if self._dragging and self.turning:
            self._dragging = False
            done = self.turning["t"] > 0.22
            self.turning["done"] = done
            self.anim.stop()
            self.anim.setStartValue(self.turning["t"])
            self.anim.setEndValue(1.0 if done else 0.0)
            self.anim.setDuration(220)
            self.anim.start()
            return
        if e.button() == Qt.LeftButton and (e.position() - press).manhattanLength() < 6:
            edge = self._edge(e.position())
            pos = None if edge else self.hit(e.position())
            if pos is not None:
                self.reader.click_text(pos)  # odsud číst nahlas
            elif edge:
                self.turn(edge)
            else:  # mimo text uprostřed (prázdný konec kapitoly…) – listovat podle poloviny
                self.turn(-1 if e.position().x() < self.width() / 2 else 1)

    def mouseDoubleClickEvent(self, e):
        pos = self.hit(e.position())
        if pos is not None:
            self.reader.word_at(pos, e.globalPosition().toPoint())

    def contextMenuEvent(self, e):
        pos = self.hit(QtCore.QPointF(e.pos()))
        if pos is not None:
            self.reader.paragraph_menu(pos, e.globalPos())

    def wheelEvent(self, e):
        dy = e.angleDelta().y() or -e.angleDelta().x()
        if dy:
            self.turn(-1 if dy > 0 else 1)

    def keyPressEvent(self, e):
        k = e.key()
        if k in (Qt.Key_Right, Qt.Key_PageDown, Qt.Key_Space, Qt.Key_Down):
            self.turn(1)
        elif k in (Qt.Key_Left, Qt.Key_PageUp, Qt.Key_Up, Qt.Key_Backspace):
            self.turn(-1)
        elif k == Qt.Key_Home:
            self.goto_page(0)
        elif k == Qt.Key_End:
            self.goto_page(self.pages - 1)
        else:
            super().keyPressEvent(e)

    def hit(self, pt: QtCore.QPointF) -> int | None:
        """Pozice v knize pod bodem obrazovky (nebo None mimo text)."""
        if self.doc is None:
            return None
        for i, r in enumerate(self.slots()):
            if r.contains(pt):
                n = self.page + i
                local = pt - r.topLeft()
                return self.doc.documentLayout().hitTest(QtCore.QPointF(local.x(), n * self.ph + local.y()), Qt.FuzzyHit)
        return None

    def resizeEvent(self, e):
        super().resizeEvent(e)
        self.relayout()


# ------------------------------------------------------------------ panel: obsah, hledání, označené
class SidePanel(QtWidgets.QTabWidget):
    def __init__(self, reader: "Reader"):
        super().__init__()
        self.reader = reader
        self.setMinimumWidth(240)
        self.setMaximumWidth(380)
        self.toc = QtWidgets.QListWidget()
        self.toc.itemClicked.connect(lambda it: reader.goto_pos(it.data(Qt.UserRole)))
        self.addTab(self.toc, tr("Obsah"))
        sw = QtWidgets.QWidget()
        sl = QtWidgets.QVBoxLayout(sw)
        sl.setContentsMargins(4, 4, 4, 4)
        self.search = QtWidgets.QLineEdit()
        self.search.setPlaceholderText(tr("Hledat v celé knize…"))
        self.search.setClearButtonEnabled(True)
        self.search_info = QtWidgets.QLabel("")
        self.search_info.setObjectName("Hint")
        self.results = QtWidgets.QListWidget()
        self.results.setWordWrap(True)
        self.results.itemClicked.connect(lambda it: reader.goto_pos(*it.data(Qt.UserRole)))
        self._t = QtCore.QTimer(self)
        self._t.setSingleShot(True)
        self._t.setInterval(250)
        self._t.timeout.connect(self.run_search)
        self.search.textChanged.connect(lambda: self._t.start())
        sl.addWidget(self.search)
        sl.addWidget(self.search_info)
        sl.addWidget(self.results, 1)
        self.addTab(sw, tr("Hledat"))
        mw = QtWidgets.QWidget()
        ml = QtWidgets.QVBoxLayout(mw)
        ml.setContentsMargins(4, 4, 4, 4)
        self.marks = QtWidgets.QListWidget()
        self.marks.setWordWrap(True)
        self.marks.itemClicked.connect(lambda it: reader.goto_pos(it.data(Qt.UserRole)["pos"]))
        self.marks.setContextMenuPolicy(Qt.CustomContextMenu)
        self.marks.customContextMenuRequested.connect(self._marks_menu)
        exp = QtWidgets.QPushButton(tr("📤 Uložit označené a poznámky…"))
        exp.clicked.connect(reader.export_notes)
        ml.addWidget(self.marks, 1)
        ml.addWidget(exp)
        self.addTab(mw, tr("Označené"))

    def fill_toc(self, chapters):
        self.toc.clear()
        for i, (name, pos) in enumerate(chapters):
            it = QtWidgets.QListWidgetItem(f"{i + 1}. {name}")
            it.setData(Qt.UserRole, pos)
            self.toc.addItem(it)

    def run_search(self):
        q = self.search.text().strip()
        self.results.clear()
        if len(q) < 2:
            self.search_info.setText(tr("Napište aspoň 2 písmena – na háčcích a velikosti písmen nezáleží."))
            self.reader.set_search(None)
            return
        hits = self.reader.find_all(q)
        self.search_info.setText(tr("Nalezeno: {}").format(len(hits)) if len(hits) < 500 else tr("Více než 500 nálezů – upřesněte hledání."))
        for pos, ln, snippet, chap in hits[:500]:
            it = QtWidgets.QListWidgetItem(f"{chap}\n{snippet}")
            it.setData(Qt.UserRole, (pos, ln))
            self.results.addItem(it)

    def fill_marks(self):
        self.marks.clear()
        r = self.reader
        for h in sorted(r.state.highlights, key=lambda x: x.get("pos", 0)):
            it = QtWidgets.QListWidgetItem(f"🖍 {h.get('text', '')[:120]}" + (f"\n📝 {h['note']}" if h.get("note") else ""))
            pm = QtGui.QPixmap(14, 14)
            pm.fill(QtGui.QColor(MARKS.get(h.get("color", "y"), MARKS["y"])[1]))
            it.setIcon(QtGui.QIcon(pm))
            it.setData(Qt.UserRole, {"kind": "h", "pos": h.get("pos", 0), "obj": h})
            self.marks.addItem(it)
        for b in r.state.bookmarks:
            it = QtWidgets.QListWidgetItem(f"🔖 {b.get('label', '')}")
            it.setData(Qt.UserRole, {"kind": "b", "pos": b.get("pos", 0), "obj": b})
            self.marks.addItem(it)

    def _marks_menu(self, pt):
        it = self.marks.itemAt(pt)
        if not it:
            return
        d = it.data(Qt.UserRole)
        m = QtWidgets.QMenu(self)
        if d["kind"] == "h":
            m.addAction(tr("📝 Upravit poznámku…"), lambda: self.reader.edit_note(d["obj"]))
        m.addAction(tr("✖ Smazat"), lambda: self.reader.remove_mark(d["kind"], d["obj"]))
        m.exec(self.marks.mapToGlobal(pt))


# ------------------------------------------------------------------ slovníček
class VocabDialog(QtWidgets.QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle(tr("📒 Slovníček"))
        self.resize(760, 520)
        lay = QtWidgets.QVBoxLayout(self)
        lay.addWidget(QtWidgets.QLabel(tr("Slova přeložená ve čtečce (dvojklik na slovo) i s větou, ve které byla.")))
        self.filter = QtWidgets.QLineEdit()
        self.filter.setPlaceholderText(tr("Hledat ve slovníčku"))
        self.filter.textChanged.connect(self.fill)
        lay.addWidget(self.filter)
        self.table = QtWidgets.QTableWidget(0, 4)
        self.table.setHorizontalHeaderLabels([tr("Slovo"), tr("Překlad"), tr("Věta"), tr("Kniha")])
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.setEditTriggers(QtWidgets.QAbstractItemView.NoEditTriggers)
        self.table.setSelectionBehavior(QtWidgets.QAbstractItemView.SelectRows)
        lay.addWidget(self.table, 1)
        row = QtWidgets.QHBoxLayout()
        for text, fn in ((tr("✖ Smazat vybrané"), self.delete), (tr("📋 Kopírovat vše"), self.copy),
                         (tr("📤 Uložit jako text…"), self.export)):
            b = QtWidgets.QPushButton(text)
            b.clicked.connect(fn)
            row.addWidget(b)
        row.addStretch(1)
        close = QtWidgets.QPushButton(tr("Zavřít"))
        close.clicked.connect(self.accept)
        row.addWidget(close)
        lay.addLayout(row)
        self.items = load_vocab()
        self.fill()

    def shown(self) -> list[dict]:
        q = fold(self.filter.text().strip())
        return [v for v in self.items if not q or q in fold(f"{v.get('word', '')} {v.get('translation', '')}")]

    def fill(self):
        rows = self.shown()
        self.table.setRowCount(len(rows))
        for r, v in enumerate(rows):
            for c, k in enumerate(("word", "translation", "sentence", "book")):
                it = QtWidgets.QTableWidgetItem(str(v.get(k, "")))
                it.setData(Qt.UserRole, v.get("at"))
                self.table.setItem(r, c, it)
        self.table.resizeColumnsToContents()

    def delete(self):
        ats = {self.table.item(i.row(), 0).data(Qt.UserRole) for i in self.table.selectionModel().selectedRows()}
        self.items = [v for v in self.items if v.get("at") not in ats]
        save_vocab(self.items)
        self.fill()

    def copy(self):
        QtWidgets.QApplication.clipboard().setText(vocab_text(self.items))

    def export(self):
        f, _ = QtWidgets.QFileDialog.getSaveFileName(self, tr("Uložit slovníček"), str(Path.home() / "slovnicek.txt"),
                                                     "Text (*.txt)")
        if f:
            Path(f).write_text(vocab_text(self.items), encoding="utf-8")


# ------------------------------------------------------------------ čtečka
SENTENCE_END = re.compile(r"[.!?…]+[\"'»“”)\]]*\s+")


def sentence_bounds(doc: QtGui.QTextDocument, pos: int) -> tuple[int, int]:
    """Začátek a konec věty (pozice v knize), ve které je pos – věta nepřesahuje odstavec."""
    b = doc.findBlock(max(0, pos))
    text, base = b.text(), b.position()
    i = max(0, min(len(text), pos - base))
    start = 0
    for m in SENTENCE_END.finditer(text):
        if m.end() <= i:
            start = m.end()
        else:
            end = m.end()
            break
    else:
        end = len(text)
    if start >= len(text):
        start = 0
    return base + start, base + end


class Reader(QtWidgets.QWidget):
    """Čtečka pro okno knihy. project = projekt knihy, app_cfg = nastavení programu (překladač, vzhled)."""

    voices_changed = QtCore.Signal()  # stažen nový hlas → obnovit výběr hlasů

    def __init__(self, project: dict, app_cfg: dict | None = None, save_cfg=None, parent=None):
        super().__init__(parent)
        self.project = project
        self.app_cfg = app_cfg if app_cfg is not None else {}
        self._save_cfg = save_cfg or (lambda: None)
        self.prefs = {**DEFAULT_PREFS, **self.app_cfg.get("reader", {})}
        self.state = ReaderState(project)
        self.search_sel: tuple[int, int] | None = None
        self.speak_block = -1
        self.speak_from = 0       # odkud v čteném odstavci se čte (pozice v knize)
        self.read_start: int | None = None  # kliknutím označené místo, odkud začne čtení nahlas
        self.speaking = False
        self.paused = False
        self.speaker = None
        self.translator = None
        self.chapters: list[tuple[str, int]] = []
        lay = QtWidgets.QHBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        lay.setSpacing(0)
        self.panel = SidePanel(self)
        self.view = PageView(self)
        right = QtWidgets.QVBoxLayout()
        right.setContentsMargins(0, 0, 0, 0)
        right.setSpacing(0)
        right.addWidget(self.view, 1)
        self.info = QtWidgets.QLabel("")
        self.info.setObjectName("Hint")
        self.info.setAlignment(Qt.AlignCenter)
        right.addWidget(self.info)
        lay.addWidget(self.panel)
        lay.addLayout(right, 1)
        self.panel.setVisible(bool(self.app_cfg.get("reader_panel", True)))
        self._save_t = QtCore.QTimer(self)
        self._save_t.setSingleShot(True)
        self._save_t.setInterval(800)
        self._save_t.timeout.connect(self.state.save)
        self.rebuild()

    # ---- sazba a nastavení
    def rebuild(self, keep_pos: int | None = None):
        pos = keep_pos if keep_pos is not None else (self.view.anchor if self.view.doc else self.state.pos)
        self.doc, self.chapters = build_reader_doc(self.project, self.prefs)
        self._relocate_marks()
        self.view.doc = self.doc
        self.view.relayout(keep_pos=pos)
        self.panel.fill_toc(self.chapters)
        self.panel.fill_marks()

    def set_pref(self, key: str, value):
        self.prefs[key] = value
        self.app_cfg.setdefault("reader", {})[key] = value
        self._save_cfg()
        if key in ("theme",):
            self.view.refresh()
        elif key in ("turn", "tts_rate", "tts_voice"):
            pass
        elif key == "spread":
            self.view.relayout()
        else:
            self.rebuild()

    def toggle_panel(self, on: bool | None = None):
        on = not self.panel.isVisible() if on is None else on
        self.panel.setVisible(on)
        self.app_cfg["reader_panel"] = on
        self._save_cfg()

    # ---- poloha
    def page_changed(self):
        if not hasattr(self, "doc"):
            return
        pos = self.view.anchor
        self.state.pos = pos
        self._save_t.start()
        ch = self.chapter_at(pos)
        pct = round(100 * pos / max(1, self.doc.characterCount()))
        v = self.view
        shown = f"{v.page + 1}–{min(v.pages, v.page + 2)}" if v.two else f"{v.page + 1}"
        self.info.setText(f"{ch} · {tr('strana')} {shown} / {v.pages} · {pct} %")

    def chapter_at(self, pos: int) -> str:
        name = ""
        for n, p in self.chapters:
            if p <= pos:
                name = n
        return name

    def goto_pos(self, pos: int, length: int = 0):
        if length:
            self.set_search((pos, length))
        self.view.goto_page(self.view.page_of(pos))
        self.view.anchor = pos
        self.page_changed()
        self.view.setFocus()

    def go_chapter(self, d: int):
        pos = self.view.first_pos()
        idx = max((i for i, (_n, p) in enumerate(self.chapters) if p <= pos), default=0)
        j = max(0, min(len(self.chapters) - 1, idx + d))
        if self.chapters:
            self.goto_pos(self.chapters[j][1])

    # ---- zvýraznění, hledání, čtený odstavec
    def selections(self):
        out = []
        night = self.prefs.get("theme") == "night"

        def sel(a: int, b: int, color: str):
            c = QtGui.QTextCursor(self.doc)
            c.setPosition(max(0, a))
            c.setPosition(min(self.doc.characterCount() - 1, b), QtGui.QTextCursor.KeepAnchor)
            s = QtGui.QAbstractTextDocumentLayout.Selection()
            s.cursor = c
            f = QtGui.QTextCharFormat()
            f.setBackground(QtGui.QColor(color))
            s.format = f
            out.append(s)

        for h in self.state.highlights:
            b = self.doc.findBlockByNumber(h.get("block", -1))
            if b.isValid():
                sel(b.position(), b.position() + b.length() - 1, MARKS.get(h.get("color", "y"), MARKS["y"])[2 if night else 1])
        if self.speak_block >= 0:
            b = self.doc.findBlockByNumber(self.speak_block)
            if b.isValid():
                sel(max(b.position(), self.speak_from), b.position() + b.length() - 1, "#3b4f7a" if night else "#dbe8ff")
        if self.read_start is not None and not self.speaking:
            a, z = sentence_bounds(self.doc, self.read_start)
            sel(a, z, "#2f5d3a" if night else "#c9efcf")
        if self.search_sel:
            sel(self.search_sel[0], self.search_sel[0] + self.search_sel[1], "#ffb300")
        return out

    def set_search(self, s):
        self.search_sel = s
        self.view.refresh()

    def find_all(self, q: str) -> list[tuple[int, int, str, str]]:
        fq = fold(q)
        out = []
        b = self.doc.begin()
        while b.isValid() and len(out) < 501:
            t = b.text()
            ft = fold(t)
            k = ft.find(fq)
            while k >= 0 and len(out) < 501:
                a = max(0, k - 40)
                snip = ("…" if a else "") + t[a:k] + "【" + t[k:k + len(q)] + "】" + t[k + len(q):k + len(q) + 60]
                out.append((b.position() + k, len(q), snip, self.chapter_at(b.position())))
                k = ft.find(fq, k + len(q))
            b = b.next()
        return out

    def _relocate_marks(self):
        """Označení se pamatují číslem odstavce; když se kniha mezitím změnila, najdou se podle textu."""
        for h in self.state.highlights:
            b = self.doc.findBlockByNumber(h.get("block", -1))
            if b.isValid() and b.text().startswith(h.get("text", "")[:40]):
                h["pos"] = b.position()
                continue
            b = self.doc.begin()
            while b.isValid():
                if h.get("text") and b.text().startswith(h["text"][:40]):
                    h["block"], h["pos"] = b.blockNumber(), b.position()
                    break
                b = b.next()

    def mark(self, pos: int, color: str | None, note: str | None = None):
        b = self.doc.findBlock(pos)
        if not b.isValid():
            return
        old = next((h for h in self.state.highlights if h.get("block") == b.blockNumber()), None)
        self.state.highlights = [h for h in self.state.highlights if h is not old]
        if color:
            self.state.highlights.append({"block": b.blockNumber(), "pos": b.position(), "color": color,
                                          "text": b.text()[:200], "note": note if note is not None else (old or {}).get("note", ""),
                                          "at": (old or {}).get("at", time.time())})
        self.state.save()
        self.panel.fill_marks()
        self.view.refresh()

    def edit_note(self, h: dict):
        text, ok = QtWidgets.QInputDialog.getMultiLineText(self, tr("Poznámka"), tr("Poznámka k odstavci:"), h.get("note", ""))
        if ok:
            h["note"] = text.strip()
            self.state.save()
            self.panel.fill_marks()

    def remove_mark(self, kind: str, obj: dict):
        if kind == "h":
            self.state.highlights = [h for h in self.state.highlights if h is not obj]
        else:
            self.state.bookmarks = [b for b in self.state.bookmarks if b is not obj]
        self.state.save()
        self.panel.fill_marks()
        self.view.refresh()

    def add_bookmark(self):
        pos = self.view.first_pos()
        label = f"{self.chapter_at(pos)} – {tr('strana')} {self.view.page + 1}"
        self.state.bookmarks.append({"pos": pos, "label": label, "at": time.time()})
        self.state.save()
        self.panel.fill_marks()
        self.info.setText("🔖 " + tr("Záložka uložena: {}").format(label))

    def export_notes(self):
        title = self.project.get("outline", {}).get("title", "kniha")
        f, _ = QtWidgets.QFileDialog.getSaveFileName(self, tr("Uložit označené a poznámky"),
                                                     str(Path.home() / f"{title} – poznámky.txt"), "Text (*.txt)")
        if not f:
            return
        lines = []
        for h in sorted(self.state.highlights, key=lambda x: x.get("pos", 0)):
            b = self.doc.findBlockByNumber(h.get("block", -1))
            lines.append(f"{self.chapter_at(h.get('pos', 0))}\n„{b.text() if b.isValid() else h.get('text', '')}“"
                         + (f"\nPoznámka: {h['note']}" if h.get("note") else "") + "\n")
        Path(f).write_text("\n".join(lines), encoding="utf-8")

    # ---- místní nabídka odstavce, překlad, slovníček
    def paragraph_menu(self, pos: int, gpos: QtCore.QPoint):
        b = self.doc.findBlock(pos)
        if not b.isValid() or not b.text().strip():
            return
        m = QtWidgets.QMenu(self)
        m.addAction(tr("🌍 Přeložit odstavec"), lambda: self.translate_text(b.text(), gpos))
        cm = m.addMenu(tr("🖍 Označit"))
        for k, (name, day, _night) in MARKS.items():
            pm = QtGui.QPixmap(14, 14)
            pm.fill(QtGui.QColor(day))
            cm.addAction(QtGui.QIcon(pm), tr(name), lambda k=k: self.mark(pos, k))
        h = next((h for h in self.state.highlights if h.get("block") == b.blockNumber()), None)
        if h:
            m.addAction(tr("📝 Poznámka…"), lambda: self.edit_note(h))
            m.addAction(tr("Zrušit označení"), lambda: self.mark(pos, None))
        else:
            m.addAction(tr("📝 Označit a připsat poznámku…"), lambda: (self.mark(pos, "y"), self.edit_note(
                next(x for x in self.state.highlights if x.get("block") == b.blockNumber()))))
        m.addSeparator()
        m.addAction(tr("🔊 Číst nahlas od této věty"), lambda: self.start_speaking(pos=pos))
        m.addAction(tr("🔊 Číst nahlas celý odstavec"), lambda: self.start_speaking(b.blockNumber()))
        m.addAction(tr("📋 Kopírovat odstavec"), lambda: QtWidgets.QApplication.clipboard().setText(b.text()))
        m.exec(gpos)

    def _translator(self):
        if self.translator is None:
            import app as core

            cfg = dict(self.app_cfg)
            if cfg.get("engine") == "microsoft_doc":
                cfg["engine"] = "microsoft"
            cfg.setdefault("engine", "google")
            cfg.setdefault("lang", "čeština")
            self.translator = core.build_translator(cfg, True, False, lambda *_: None, threading.Event())
        return self.translator

    def translate_text(self, text: str, gpos: QtCore.QPoint, word: str | None = None, sentence: str = ""):
        self.info.setText(tr("Překládám…"))

        def work():
            return self._translator().translate_segments([word or text], False)[0]

        def done(res, err):
            if err:
                QtWidgets.QMessageBox.warning(self, tr("Překlad"), str(err))
                self.info.setText("")
                return
            res = (res or "").strip()
            self.page_changed()
            if word:
                add_vocab({"word": word, "translation": res, "sentence": sentence[:240],
                           "book": self.project.get("outline", {}).get("title", ""),
                           "from": "", "to": self.app_cfg.get("lang", "čeština"), "at": time.time()})
                QtWidgets.QToolTip.showText(gpos, f"<b>{word}</b> → {res}<br><small>📒 {tr('uloženo do slovníčku')}</small>", self)
            else:
                box = QtWidgets.QMessageBox(self)
                box.setWindowTitle(tr("Překlad odstavce"))
                box.setTextFormat(Qt.PlainText)
                box.setText(res)
                box.setInformativeText(text[:600])
                box.exec()

        self.translator_thread = run_bg(work, done, owner=self)

    def word_at(self, pos: int, gpos: QtCore.QPoint):
        c = QtGui.QTextCursor(self.doc)
        c.setPosition(pos)
        c.select(QtGui.QTextCursor.WordUnderCursor)
        word = c.selectedText().strip(" .,;:!?„“\"'()«»–—")
        if not word:
            return
        b = self.doc.findBlock(pos)
        t = b.text()
        k = pos - b.position()
        a = max(t.rfind(".", 0, k), t.rfind("!", 0, k), t.rfind("?", 0, k)) + 1
        e = min([x for x in (t.find(".", k), t.find("!", k), t.find("?", k)) if x >= 0] or [len(t) - 1]) + 1
        self.translate_text(t, gpos, word=word, sentence=t[a:e].strip())

    def open_vocab(self):
        VocabDialog(self).exec()

    # ---- čtení nahlas
    def click_text(self, pos: int):
        """Klik do textu: označit větu, od které se bude číst nahlas; během čtení na ni rovnou přeskočit."""
        if self.speaking:
            self.start_speaking(pos=pos)
            return
        a, _z = sentence_bounds(self.doc, pos)
        self.read_start = None if self.read_start is not None and sentence_bounds(self.doc, self.read_start)[0] == a else a
        self.view.refresh()

    def start_speaking(self, block: int | None = None, pos: int | None = None):
        """Číst nahlas: od věty na pozici pos, od označeného místa, od odstavce block, jinak od začátku stránky."""
        import tts_win

        lang = self.book_lang()
        chosen = self.prefs.get("tts_voice") or ""
        if not chosen and tts_win.has_voice(lang) is not True and tts_win.PIPER_VOICES.get(lang):
            if self.offer_voice_download(lang):
                return  # čtení začne samo po stažení hlasu
            if not tts_win.available():
                return
        elif not tts_win.any_voice():
            QtWidgets.QMessageBox.information(self, tr("Čtení nahlas"), tr(
                "Čtení nahlas používá hlasy Windows. Na tomto počítači nejsou k dispozici."))
            return
        if self.speaker is None:
            self.speaker = tts_win.Speaker()
        if pos is None and block is None and self.read_start is not None:
            pos = self.read_start
        offset = 0
        if pos is not None:
            start = sentence_bounds(self.doc, pos)[0]
            b = self.doc.findBlock(start)
            block, offset = b.blockNumber(), start - b.position()
        elif block is None:
            block = self.doc.findBlock(self.view.first_pos()).blockNumber()
        self.read_start = None
        if self.speaking:  # přeskočit jinam během čtení
            self.speaker.stop()
        self.speaking = True
        self.paused = False
        self._speak_buttons()
        self.speak_next(block, offset)

    def book_lang(self) -> str:
        return LANG_CODES.get(str(self.project.get("language", "čeština")).lower(), "cs")

    def offer_voice_download(self, lang: str, ask: bool = True) -> bool:
        """Ve Windows chybí hlas pro jazyk knihy → nabídnout stažení hlasu Piper. True = stahuje se."""
        import tts_win
        from qt_common import run_bg

        model, name, gender, mb = tts_win.PIPER_VOICES[lang][0]
        lang_name = {"cs": "český", "sk": "slovenský"}.get(lang, lang)
        if ask:
            box = QtWidgets.QMessageBox(QtWidgets.QMessageBox.Question, tr("Čtení nahlas"), tr(
                "Ve Windows není {} hlas, proto by kniha zněla anglicky.\n\n"
                "Program může stáhnout {} hlas {} (zdarma, asi {} MB). Čte bez internetu, přímo v počítači.\n\n"
                "Jiná možnost: v Nastavení Windows → Čas a jazyk → Řeč → Přidat hlasy zvolte Čeština "
                "(hlas Microsoft Jakub) a program ho pak najde sám.").format(lang_name, lang_name, name, mb + 22),
                parent=self)
            b_dl = box.addButton(tr("⬇ Stáhnout hlas"), QtWidgets.QMessageBox.AcceptRole)
            box.addButton(tr("Číst hlasem Windows") if tts_win.available() else tr("Zrušit"),
                          QtWidgets.QMessageBox.RejectRole)
            box.setDefaultButton(b_dl)
            box.exec()
            if box.clickedButton() is not b_dl:
                return False
        prog = QtWidgets.QProgressDialog(tr("Stahuji hlas {}…").format(name), None, 0, 0, self)
        prog.setWindowTitle(tr("Čtení nahlas"))
        prog.setMinimumDuration(0)
        prog.show()
        log = lambda m: bridge().later(lambda: prog.setLabelText(m))  # noqa: E731

        def done(voice, err):
            prog.close()
            if err:
                QtWidgets.QMessageBox.warning(self, tr("Čtení nahlas"),
                                              tr("Hlas se nepodařilo stáhnout:\n{}").format(err))
                return
            self.set_pref("tts_voice", voice["name"])
            self.voices_changed.emit()
            self.start_speaking()

        run_bg(lambda: tts_win.download_piper(lang, log), done)
        return True

    def stop_speaking(self):
        self.speaking = False
        self.paused = False
        if self.speaker:
            self.speaker.stop()
        self.speak_block = -1
        self._speak_buttons()
        self.view.refresh()

    def toggle_speaking(self):
        """Jedno tlačítko: Číst nahlas → Pozastavit → Pokračovat."""
        if not self.speaking:
            self.start_speaking()
        elif self.paused:
            self.paused = False
            self.speaker.resume()
        else:
            self.paused = True
            self.speaker.pause()
        self._speak_buttons()

    def _speak_buttons(self):
        b = getattr(self, "b_speak", None)
        if b is not None:
            b.setText(tr("Pokračovat") if self.paused else tr("Pozastavit") if self.speaking else tr("Číst nahlas"))
            b.setIcon(emoji_icon("▶️" if self.paused else "⏸️" if self.speaking else "🔊"))
        st = getattr(self, "b_stop", None)
        if st is not None:
            st.setEnabled(self.speaking)

    def speak_next(self, n: int, offset: int = 0):
        if not self.speaking:
            return
        b = self.doc.findBlockByNumber(n)
        if offset and b.isValid() and not b.text()[offset:].strip():
            b, offset = b.next(), 0
        while b.isValid() and not b.text().strip():
            b, offset = b.next(), 0
        if not b.isValid():
            self.stop_speaking()
            return
        self.speak_block = b.blockNumber()
        self.speak_from = b.position() + offset
        page = self.view.page_of(self.speak_from)
        if not (self.view.page <= page < self.view.page + self.view.step()):
            self.view.goto_page(page, animate=True)
        self.view.refresh()
        lang = self.book_lang()
        nxt = b.blockNumber() + 1
        self.speaker.speak(b.text()[offset:].replace("\u2028", " "), lang, float(self.prefs.get("tts_rate", 1.0)),
                           on_done=lambda: bridge().later(lambda: self.speak_next(nxt)),
                           voice_name=self.prefs.get("tts_voice") or None)

    def set_rate(self, d: float):
        r = max(0.5, min(2.0, round(float(self.prefs.get("tts_rate", 1.0)) + d, 1)))
        self.set_pref("tts_rate", r)
        self.info.setText(tr("Rychlost čtení: {}×").format(r))

    def closeEvent(self, e):
        self.stop_speaking()
        self.state.save()
        super().closeEvent(e)


# ------------------------------------------------------------------ pás karet režimu Čtení
def reader_ribbon(reader: Reader, big, row, group_cls) -> QtWidgets.QWidget:
    """Karta „Čtení“ pro pás karet okna knihy (big = tlačítko s ikonou, row = řada skupin)."""
    nav = group_cls("Listovat")
    nav.grid.addWidget(big(emoji_icon("⏮️"), tr("Předchozí kapitola"), lambda: reader.go_chapter(-1)), 0, 0)
    nav.grid.addWidget(big(emoji_icon("◀️"), tr("Zpět"), lambda: reader.view.turn(-1)), 0, 1)
    nav.grid.addWidget(big(emoji_icon("▶️"), tr("Dál"), lambda: reader.view.turn(1)), 0, 2)
    nav.grid.addWidget(big(emoji_icon("⏭️"), tr("Další kapitola"), lambda: reader.go_chapter(1)), 0, 3)
    book = group_cls("Kniha")
    book.grid.addWidget(big(emoji_icon("☰"), tr("Obsah"), lambda: (reader.toggle_panel(True), reader.panel.setCurrentIndex(0))), 0, 0)
    book.grid.addWidget(big(emoji_icon("🔎"), tr("Hledat"), lambda: (reader.toggle_panel(True), reader.panel.setCurrentIndex(1),
                                                                    reader.panel.search.setFocus())), 0, 1)
    book.grid.addWidget(big(emoji_icon("🔖"), tr("Záložka"), reader.add_bookmark), 0, 2)
    book.grid.addWidget(big(emoji_icon("🖍️"), tr("Označené"), lambda: (reader.toggle_panel(True), reader.panel.setCurrentIndex(2))), 0, 3)
    voice = group_cls("Nahlas")
    reader.b_speak = big(emoji_icon("🔊"), tr("Číst nahlas"), reader.toggle_speaking)
    reader.b_speak.setToolTip(tr("Číst nahlas od začátku stránky, nebo od věty, na kterou kliknete v textu "
                                 "(zezelená); během čtení klik do textu přeskočí na tu větu. "
                                 "Tlačítkem pak pozastavit a pokračovat."))
    voice.grid.addWidget(reader.b_speak, 0, 0)
    reader.b_stop = big(emoji_icon("⏹️"), tr("Zastavit"), reader.stop_speaking)
    reader.b_stop.setEnabled(False)
    voice.grid.addWidget(reader.b_stop, 0, 1)
    voice.grid.addWidget(big(emoji_icon("🐢"), tr("Pomaleji"), lambda: reader.set_rate(-0.1)), 0, 2)
    voice.grid.addWidget(big(emoji_icon("🐇"), tr("Rychleji"), lambda: reader.set_rate(0.1)), 0, 3)
    vc = QtWidgets.QComboBox()
    vc.setToolTip(tr("Hlas pro čtení nahlas: hlasy Windows (Nastavení → Čas a jazyk → Řeč) "
                     "a stažené hlasy, které čtou bez internetu"))

    def fill_voices():
        import tts_win

        vc.blockSignals(True)
        vc.clear()
        voices = tts_win.list_voices()
        vc.addItem(tr("Hlas podle jazyka knihy"), "")
        book_lang = reader.book_lang()
        for v in sorted(voices, key=lambda v: (v["lang"] != book_lang, v["name"])):
            vc.addItem(v.get("label", v["name"]) + (f" ({tr(v['gender'])}, {v['lang']})" if v["gender"] else f" ({v['lang']})"),
                       v["name"])
        if book_lang in tts_win.PIPER_VOICES and not tts_win.piper_installed(book_lang):
            m = tts_win.PIPER_VOICES[book_lang][0]
            vc.addItem(tr("⬇ Stáhnout hlas {} ({}, bez internetu)…").format(m[1], book_lang), "download")
        vc.setCurrentIndex(max(0, vc.findData(reader.prefs.get("tts_voice", ""))))
        vc.blockSignals(False)

    def chosen(_i):
        if vc.currentData() == "download":
            vc.setCurrentIndex(max(0, vc.findData(reader.prefs.get("tts_voice", ""))))
            reader.offer_voice_download(reader.book_lang(), ask=False)
            return
        reader.set_pref("tts_voice", vc.currentData())

    fill_voices()
    vc.currentIndexChanged.connect(chosen)
    reader.voices_changed.connect(fill_voices)
    voice.grid.addWidget(vc, 1, 0, 1, 4)
    lang = group_cls("Překlad")
    lang.grid.addWidget(big(emoji_icon("📒"), tr("Slovníček"), reader.open_vocab), 0, 0)
    look = group_cls("Vzhled")
    combos = QtWidgets.QWidget()
    g = QtWidgets.QGridLayout(combos)
    g.setContentsMargins(0, 0, 0, 0)
    g.setSpacing(4)

    def combo(items: dict, key: str, cast=str):
        cb = QtWidgets.QComboBox()
        for k, v in items.items():
            cb.addItem(tr(v), k)
        cb.setCurrentIndex(max(0, cb.findData(str(reader.prefs.get(key)) if cast is str else reader.prefs.get(key))))
        cb.currentIndexChanged.connect(lambda _i: reader.set_pref(key, cast(cb.currentData())))
        return cb

    g.addWidget(QtWidgets.QLabel(tr("Barvy")), 0, 0)
    g.addWidget(combo({k: v[0] for k, v in THEMES.items()}, "theme"), 0, 1)
    g.addWidget(QtWidgets.QLabel(tr("Písmo")), 0, 2)
    g.addWidget(combo({"serif": "patkové", "sans": "bezpatkové"}, "font"), 0, 3)
    g.addWidget(QtWidgets.QLabel(tr("Listování")), 1, 0)
    g.addWidget(combo(TURNS, "turn"), 1, 1)
    g.addWidget(QtWidgets.QLabel(tr("Strany")), 1, 2)
    g.addWidget(combo(SPREADS, "spread"), 1, 3)
    g.addWidget(QtWidgets.QLabel(tr("Řádkování")), 2, 0)
    g.addWidget(combo({1.2: "těsné", 1.45: "běžné", 1.75: "volné"}, "line", float), 2, 1)
    g.addWidget(QtWidgets.QLabel(tr("Okraje")), 2, 2)
    g.addWidget(combo({24: "úzké", 48: "střední", 80: "široké"}, "margin", int), 2, 3)
    look.grid.addWidget(big(emoji_icon("🔠"), tr("Menší"), lambda: reader.set_pref("size", max(8.0, float(reader.prefs["size"]) - 1))), 0, 0)
    look.grid.addWidget(big(emoji_icon("🔡"), tr("Větší"), lambda: reader.set_pref("size", min(32.0, float(reader.prefs["size"]) + 1))), 0, 1)
    just = big(emoji_icon("📰"), tr("Do bloku"), lambda: reader.set_pref("justify", just.isChecked()))
    just.setCheckable(True)
    just.setChecked(bool(reader.prefs.get("justify", True)))
    look.grid.addWidget(just, 0, 2)
    look.grid.addWidget(combos, 0, 3)
    return row(nav, book, voice, lang, look)
