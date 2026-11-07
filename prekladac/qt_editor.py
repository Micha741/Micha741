"""Editor knihy ve stylu Wordu: pás karet (písmo, odstavec, styly, úpravy), kapitoly, hledání, export."""

from __future__ import annotations

from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets

import book_writer as bw
from html_docx import PAGE_BREAK, plain_to_html
from qt_common import emoji_icon, label, lines_icon, run_bg, text_icon

Qt = QtCore.Qt
AUTOSAVE_MODES = {  # klíč: popis v Nastavení
    "sentence": "Po každé větě",
    "word": "Po každém slově",
    "chars": "Po zadaném počtu znaků",
    "time": "Každých N sekund",
    "off": "Vypnuto (jen ručně Ctrl+S)",
}
AUTOSAVE_DEFAULT = {"mode": "sentence", "seconds": 30, "chars": 200}
MIN_SAVE_GAP = 2.0  # sekundy – častěji se na disk nezapisuje, i když píšete rychle
SIZES = ["8", "9", "10", "10.5", "11", "12", "14", "16", "18", "20", "24", "28", "36", "48", "72"]
TEXT_COLORS = ["#000000", "#c00000", "#e36c09", "#2e7d32", "#1565c0", "#6a1b9a", "#7f7f7f", "#ffffff"]
HIGHLIGHTS = ["#ffff00", "#00ff00", "#00ffff", "#ff66ff", "#ffc000", "#d9d9d9", None]


def document_to_plain(doc: QtGui.QTextDocument) -> str:
    """Text dokumentu: odstavce oddělené prázdným řádkem (pro AI, statistiky a hledání v celé knize)."""
    blocks = []
    b = doc.begin()
    while b.isValid():
        blocks.append(b.text().replace(" ", "\n"))
        b = b.next()
    return "\n\n".join(t for t in blocks if t.strip())


class RibbonGroup(QtWidgets.QFrame):
    def __init__(self, title: str):
        super().__init__()
        self.setObjectName("RibbonGroup")
        outer = QtWidgets.QVBoxLayout(self)
        outer.setContentsMargins(6, 2, 6, 0)
        outer.setSpacing(2)
        self.grid = QtWidgets.QGridLayout()
        self.grid.setSpacing(2)
        outer.addLayout(self.grid)
        lb = QtWidgets.QLabel(title)
        lb.setObjectName("RibbonLabel")
        lb.setAlignment(Qt.AlignCenter)
        outer.addWidget(lb)


def vline() -> QtWidgets.QFrame:
    f = QtWidgets.QFrame()
    f.setFrameShape(QtWidgets.QFrame.VLine)
    f.setStyleSheet("color: #e2e8f0;")
    return f


class FindDialog(QtWidgets.QDialog):
    def __init__(self, editor: "BookEditor"):
        super().__init__(editor)
        self.ed = editor
        self.setWindowTitle("Najít a nahradit")
        form = QtWidgets.QFormLayout(self)
        self.find = QtWidgets.QLineEdit()
        self.repl = QtWidgets.QLineEdit()
        self.case = QtWidgets.QCheckBox("Rozlišovat velká a malá písmena")
        self.whole = QtWidgets.QCheckBox("Hledat v celé knize")
        self.whole.setChecked(True)
        self.info = label("", "Hint")
        form.addRow("Najít:", self.find)
        form.addRow("Nahradit:", self.repl)
        form.addRow(self.case)
        form.addRow(self.whole)
        row = QtWidgets.QHBoxLayout()
        for text, fn in (("Najít další", self.find_next), ("Nahradit", self.replace_one),
                         ("Nahradit vše", self.replace_all)):
            b = QtWidgets.QPushButton(text)
            b.clicked.connect(fn)
            row.addWidget(b)
        form.addRow(row)
        form.addRow(self.info)
        self.find.returnPressed.connect(self.find_next)

    def _flags(self):
        return QtGui.QTextDocument.FindCaseSensitively if self.case.isChecked() else QtGui.QTextDocument.FindFlags()

    def find_next(self) -> bool:
        needle = self.find.text()
        if not needle:
            return False
        ed = self.ed
        if ed.text.find(needle, self._flags()):
            self.info.setText("")
            return True
        if self.whole.isChecked():
            ed.store_current()
            n = len(ed.project["chapters"])
            for step in range(1, n + 1):
                j = (ed.cur + step) % n
                hay = ed.project["chapters"][j]["text"]
                hit = needle in hay if self.case.isChecked() else needle.lower() in hay.lower()
                if hit:
                    ed.select_chapter(j)
                    ed.text.moveCursor(QtGui.QTextCursor.Start)
                    if ed.text.find(needle, self._flags()):
                        self.info.setText(f"Kapitola {j + 1}")
                        return True
        else:
            ed.text.moveCursor(QtGui.QTextCursor.Start)
            if ed.text.find(needle, self._flags()):
                return True
        self.info.setText("Nenalezeno.")
        return False

    def replace_one(self):
        c = self.ed.text.textCursor()
        if c.hasSelection() and (c.selectedText() == self.find.text() or
                                 (not self.case.isChecked() and c.selectedText().lower() == self.find.text().lower())):
            c.insertText(self.repl.text())
        self.find_next()

    def replace_all(self):
        needle, repl = self.find.text(), self.repl.text()
        if not needle:
            return
        ed = self.ed
        ed.store_current()
        targets = range(len(ed.project["chapters"])) if self.whole.isChecked() else [ed.cur]
        total = 0
        current = ed.cur
        for j in targets:
            ed.select_chapter(j)
            ed.text.moveCursor(QtGui.QTextCursor.Start)
            cur = ed.text.textCursor()
            cur.beginEditBlock()
            while ed.text.find(needle, self._flags()):
                ed.text.textCursor().insertText(repl)
                total += 1
            cur.endEditBlock()
            ed.store_current()
        ed.select_chapter(current)
        self.info.setText(f"Nahrazeno {total}×.")


class BookEditor(QtWidgets.QMainWindow):
    def __init__(self, project: dict, path: Path, ebook_convert: str | None, parent=None,
                 autosave: dict | None = None):
        super().__init__(parent)
        self.autosave = {**AUTOSAVE_DEFAULT, **(autosave or {})}
        self._chars_since_save = 0
        self._last_save = 0.0
        self.project = project
        self.path = Path(path)
        self.ebook_convert = ebook_convert
        self.outline = project["outline"]
        self.fmt = {**bw.DEFAULT_FORMAT, **project.get("format", {})}
        project["format"] = self.fmt
        self.cur = 0
        self.dirty = False
        self.loading = False
        self.painter_fmt: QtGui.QTextCharFormat | None = None
        self.find_dlg: FindDialog | None = None
        self.setAttribute(Qt.WA_DeleteOnClose)
        self.resize(1300, 860)

        self.text = QtWidgets.QTextEdit()
        self.text.setAcceptRichText(True)
        self.text.setTabStopDistance(40)
        self.text.document().setDocumentMargin(48)
        self.text.setStyleSheet("QTextEdit { border: none; background: white; }")
        page = QtWidgets.QFrame()
        page.setStyleSheet("background: #e8ebf0;")
        pl = QtWidgets.QHBoxLayout(page)
        pl.setContentsMargins(24, 16, 24, 16)
        self.text.setMaximumWidth(980)
        pl.addWidget(self.text)

        central = QtWidgets.QWidget()
        cl = QtWidgets.QVBoxLayout(central)
        cl.setContentsMargins(0, 0, 0, 0)
        cl.setSpacing(0)
        cl.addWidget(self._build_ribbon())
        cl.addWidget(page, 1)
        self.setCentralWidget(central)
        self._build_chapters_dock()
        self._build_status()
        self._shortcuts()

        self.text.document().contentsChanged.connect(self._changed)
        self.text.installEventFilter(self)
        self._auto_timer = QtCore.QTimer(self)  # „každých N sekund“
        self._auto_timer.timeout.connect(self._autosave_now)
        if self.autosave["mode"] == "time":
            self._auto_timer.start(max(5, int(self.autosave["seconds"])) * 1000)
        self._pending_timer = QtCore.QTimer(self)  # odložené uložení, když se ukládalo před chvílí
        self._pending_timer.setSingleShot(True)
        self._pending_timer.timeout.connect(self._autosave_now)
        self.text.cursorPositionChanged.connect(self._sync_toolbar)
        self.text.selectionChanged.connect(self._apply_painter)
        self.refresh_list()
        if project["chapters"]:
            self.select_chapter(0)
        self._update_title()

    # ================================================================ pás karet
    def _tb(self, icon, tip, fn=None, checkable=False, shortcut=None) -> QtWidgets.QToolButton:
        b = QtWidgets.QToolButton()
        b.setIcon(icon)
        b.setIconSize(QtCore.QSize(22, 22))
        b.setToolTip(tip + (f" ({shortcut})" if shortcut else ""))
        b.setCheckable(checkable)
        b.setAutoRaise(True)
        if fn:
            b.clicked.connect(fn)
        return b

    def _big(self, icon, text, fn) -> QtWidgets.QToolButton:
        b = QtWidgets.QToolButton()
        b.setIcon(icon)
        b.setIconSize(QtCore.QSize(30, 30))
        b.setText(text)
        b.setToolButtonStyle(Qt.ToolButtonTextUnderIcon)
        b.setAutoRaise(True)
        b.clicked.connect(fn)
        return b

    def _build_ribbon(self) -> QtWidgets.QWidget:
        tabs = QtWidgets.QTabWidget()
        tabs.setObjectName("Ribbon")
        tabs.setDocumentMode(True)
        tabs.addTab(self._home_tab(), "Domů")
        tabs.addTab(self._book_tab(), "Kniha")
        tabs.setMaximumHeight(150)
        return tabs

    def _row(self, *groups) -> QtWidgets.QWidget:
        w = QtWidgets.QWidget()
        lay = QtWidgets.QHBoxLayout(w)
        lay.setContentsMargins(4, 4, 4, 2)
        lay.setSpacing(4)
        for i, g in enumerate(groups):
            if i:
                lay.addWidget(vline())
            lay.addWidget(g)
        lay.addStretch(1)
        return w

    def _home_tab(self) -> QtWidgets.QWidget:
        t = self.text
        # --- Schránka
        clip = RibbonGroup("Schránka")
        clip.grid.addWidget(self._big(emoji_icon("📋"), "Vložit", t.paste), 0, 0, 2, 1)
        clip.grid.addWidget(self._tb(emoji_icon("✂️"), "Vyjmout", t.cut, shortcut="Ctrl+X"), 0, 1)
        clip.grid.addWidget(self._tb(emoji_icon("📄"), "Kopírovat", t.copy, shortcut="Ctrl+C"), 1, 1)
        self.b_painter = self._tb(emoji_icon("🖌️"), "Kopírovat formát (pak označte text, na který ho přenést)",
                                  self._painter, checkable=True)
        clip.grid.addWidget(self.b_painter, 0, 2)

        # --- Písmo
        font = RibbonGroup("Písmo")
        self.font_box = QtWidgets.QFontComboBox()
        self.font_box.setMaximumWidth(190)
        self.font_box.currentFontChanged.connect(lambda f: self._merge(family=f.family()))
        self.size_box = QtWidgets.QComboBox()
        self.size_box.setEditable(True)
        self.size_box.addItems(SIZES)
        self.size_box.setMaximumWidth(64)
        self.size_box.textActivated.connect(lambda s: self._merge(size=s))
        font.grid.addWidget(self.font_box, 0, 0, 1, 5)
        font.grid.addWidget(self.size_box, 0, 5, 1, 2)
        font.grid.addWidget(self._tb(text_icon("A↑", size_pt=11), "Zvětšit písmo", lambda: self._grow(1)), 0, 7)
        font.grid.addWidget(self._tb(text_icon("A↓", size_pt=11), "Zmenšit písmo", lambda: self._grow(-1)), 0, 8)
        self.b_bold = self._tb(text_icon("B", bold=True), "Tučné", self._bold, True, "Ctrl+B")
        self.b_italic = self._tb(text_icon("I", italic=True, family="Georgia"), "Kurzíva",
                                 lambda c: self._merge(italic=c), True, "Ctrl+I")
        self.b_under = self._tb(text_icon("U", underline=True), "Podtržené", lambda c: self._merge(underline=c),
                                True, "Ctrl+U")
        self.b_strike = self._tb(text_icon("ab", strike=True, size_pt=12), "Přeškrtnuté",
                                 lambda c: self._merge(strike=c), True)
        self.b_sub = self._tb(text_icon("x₂", size_pt=12), "Dolní index", lambda c: self._valign(c, "sub"), True)
        self.b_sup = self._tb(text_icon("x²", size_pt=12), "Horní index", lambda c: self._valign(c, "sup"), True)
        color_btn = self._tb(text_icon("A", bold=True, bar="#c00000"), "Barva písma")
        color_btn.setPopupMode(QtWidgets.QToolButton.MenuButtonPopup)
        color_btn.setMenu(self._color_menu(TEXT_COLORS, self._set_color, "Další barvy…"))
        color_btn.clicked.connect(lambda: self._set_color(self._last_color))
        self._last_color = "#c00000"
        hl_btn = self._tb(text_icon("ab", bar="#ffff00", size_pt=11), "Zvýraznění textu")
        hl_btn.setPopupMode(QtWidgets.QToolButton.MenuButtonPopup)
        hl_btn.setMenu(self._color_menu(HIGHLIGHTS, self._set_highlight, "Bez zvýraznění"))
        hl_btn.clicked.connect(lambda: self._set_highlight("#ffff00"))
        clear = self._tb(text_icon("A⌫", size_pt=10), "Vymazat formátování", self._clear_format)
        for i, b in enumerate((self.b_bold, self.b_italic, self.b_under, self.b_strike, self.b_sub, self.b_sup,
                               color_btn, hl_btn, clear)):
            font.grid.addWidget(b, 1, i)

        # --- Odstavec
        para = RibbonGroup("Odstavec")
        para.grid.addWidget(self._tb(lines_icon("bullets"), "Odrážky", lambda: self._list(QtGui.QTextListFormat.ListDisc)), 0, 0)
        para.grid.addWidget(self._tb(lines_icon("numbers"), "Číslování",
                                     lambda: self._list(QtGui.QTextListFormat.ListDecimal)), 0, 1)
        para.grid.addWidget(self._tb(lines_icon("indent_less"), "Zmenšit odsazení", lambda: self._indent(-1)), 0, 2)
        para.grid.addWidget(self._tb(lines_icon("indent_more"), "Zvětšit odsazení", lambda: self._indent(1)), 0, 3)
        spacing = self._tb(text_icon("↕≡", size_pt=12), "Řádkování")
        spacing.setPopupMode(QtWidgets.QToolButton.InstantPopup)
        menu = QtWidgets.QMenu(spacing)
        for val in (100, 115, 150, 200):
            menu.addAction(f"{val / 100:g}".replace(".", ","), lambda v=val: self._line_height(v))
        spacing.setMenu(menu)
        para.grid.addWidget(spacing, 0, 4)
        self.align_btns = {}
        for i, (kind, al, tip) in enumerate((("align_left", Qt.AlignLeft, "Zarovnat doleva"),
                                             ("align_center", Qt.AlignHCenter, "Zarovnat na střed"),
                                             ("align_right", Qt.AlignRight, "Zarovnat doprava"),
                                             ("align_justify", Qt.AlignJustify, "Do bloku"))):
            b = self._tb(lines_icon(kind), tip, lambda _c, a=al: self._align(a), True)
            self.align_btns[al] = b
            para.grid.addWidget(b, 1, i)
        para.grid.addWidget(self._tb(lines_icon("page_break"), "Zalomení stránky", self._page_break), 1, 4)

        # --- Styly
        styles = RibbonGroup("Styly")
        for i, (name, fn) in enumerate((("Normální", lambda: self._style(0)), ("Nadpis", lambda: self._style(2)),
                                        ("Podnadpis", lambda: self._style(3)), ("Citace", self._quote))):
            b = QtWidgets.QPushButton(name)
            b.setStyleSheet("padding: 4px 10px;" + {"Nadpis": "font-weight:700; font-size:11pt;",
                                                    "Podnadpis": "font-weight:600;",
                                                    "Citace": "font-style:italic;"}.get(name, ""))
            b.clicked.connect(fn)
            styles.grid.addWidget(b, i // 2, i % 2)

        # --- Úpravy
        edit = RibbonGroup("Úpravy")
        edit.grid.addWidget(self._big(emoji_icon("🔍"), "Najít", self.open_find), 0, 0, 2, 1)
        edit.grid.addWidget(self._tb(emoji_icon("↩️"), "Zpět", t.undo, shortcut="Ctrl+Z"), 0, 1)
        edit.grid.addWidget(self._tb(emoji_icon("↪️"), "Znovu", t.redo, shortcut="Ctrl+Y"), 1, 1)
        edit.grid.addWidget(self._tb(emoji_icon("🔎"), "Přiblížit", lambda: t.zoomIn(1)), 0, 2)
        edit.grid.addWidget(self._tb(emoji_icon("🔍"), "Oddálit", lambda: t.zoomOut(1)), 1, 2)

        save = RibbonGroup("Soubor")
        save.grid.addWidget(self._big(emoji_icon("💾"), "Uložit", self.save), 0, 0, 2, 1)
        save.grid.addWidget(self._big(emoji_icon("📤"), "Exportovat", self.export), 0, 1, 2, 1)
        return self._row(clip, font, para, styles, edit, save)

    def _book_tab(self) -> QtWidgets.QWidget:
        info = RibbonGroup("Kniha")
        self.title_edit = QtWidgets.QLineEdit(self.outline["title"])
        self.author_edit = QtWidgets.QLineEdit(self.project.get("author", ""))
        self.title_edit.setMinimumWidth(260)
        info.grid.addWidget(QtWidgets.QLabel("Název:"), 0, 0)
        info.grid.addWidget(self.title_edit, 0, 1)
        info.grid.addWidget(QtWidgets.QLabel("Autor:"), 1, 0)
        info.grid.addWidget(self.author_edit, 1, 1)
        self.title_edit.textEdited.connect(self._changed)
        self.author_edit.textEdited.connect(self._changed)

        look = RibbonGroup("Výchozí písmo knihy")
        self.book_font = QtWidgets.QFontComboBox()
        self.book_font.setCurrentFont(QtGui.QFont(self.fmt["font"]))
        self.book_size = QtWidgets.QSpinBox()
        self.book_size.setRange(8, 28)
        self.book_size.setValue(int(self.fmt["size"]))
        look.grid.addWidget(self.book_font, 0, 0)
        look.grid.addWidget(self.book_size, 0, 1)
        self.toc = QtWidgets.QCheckBox("Obsah s odkazy na kapitoly")
        self.toc.setChecked(bool(self.fmt.get("toc", True)))
        look.grid.addWidget(self.toc, 1, 0, 1, 2)
        for w_ in (self.book_font, self.book_size, self.toc):
            sig = getattr(w_, "currentFontChanged", None) or getattr(w_, "valueChanged", None) or w_.toggled
            sig.connect(self._changed)

        exp = RibbonGroup("Export")
        self.fmt_checks = {}
        for i, f in enumerate(("epub", "docx", "pdf", "azw3")):
            cb = QtWidgets.QCheckBox(f.upper())
            cb.setChecked(f in ("epub", "docx"))
            self.fmt_checks[f] = cb
            exp.grid.addWidget(cb, i // 2, i % 2)
        exp.grid.addWidget(self._big(emoji_icon("📤"), "Exportovat", self.export), 0, 2, 2, 1)

        chap = RibbonGroup("Kapitoly")
        chap.grid.addWidget(self._big(emoji_icon("➕"), "Nová kapitola", self.add_chapter), 0, 0, 2, 1)
        chap.grid.addWidget(self._tb(emoji_icon("⬆️"), "Posunout nahoru", lambda: self.move_chapter(-1)), 0, 1)
        chap.grid.addWidget(self._tb(emoji_icon("⬇️"), "Posunout dolů", lambda: self.move_chapter(1)), 1, 1)
        chap.grid.addWidget(self._tb(emoji_icon("🗑️"), "Smazat kapitolu", self.delete_chapter), 0, 2)
        return self._row(info, look, exp, chap)

    def _color_menu(self, colors, fn, extra_text):
        menu = QtWidgets.QMenu(self)
        grid = QtWidgets.QWidget()
        gl = QtWidgets.QGridLayout(grid)
        gl.setContentsMargins(6, 6, 6, 6)
        for i, c in enumerate(colors):
            if c is None:
                continue
            b = QtWidgets.QToolButton()
            b.setFixedSize(22, 22)
            b.setStyleSheet(f"background:{c}; border:1px solid #94a3b8; border-radius:3px;")
            b.clicked.connect(lambda _c=False, col=c: (fn(col), menu.close()))
            gl.addWidget(b, i // 4, i % 4)
        act = QtWidgets.QWidgetAction(menu)
        act.setDefaultWidget(grid)
        menu.addAction(act)
        if None in colors:
            menu.addAction(extra_text, lambda: fn(None))
        else:
            menu.addAction(extra_text, lambda: (c := QtWidgets.QColorDialog.getColor(parent=self)).isValid()
                           and fn(c.name()))
        return menu

    # ============================================================ kapitoly
    def _build_chapters_dock(self):
        dock = QtWidgets.QDockWidget("Kapitoly", self)
        dock.setFeatures(QtWidgets.QDockWidget.DockWidgetMovable)
        w = QtWidgets.QWidget()
        lay = QtWidgets.QVBoxLayout(w)
        self.chapters = QtWidgets.QListWidget()
        self.chapters.currentRowChanged.connect(lambda r: r >= 0 and r != self.cur and self.select_chapter(r))
        self.ch_title = QtWidgets.QLineEdit()
        self.ch_title.setPlaceholderText("Název kapitoly")
        self.ch_title.textEdited.connect(self._title_edited)
        lay.addWidget(label("Název vybrané kapitoly:", "Hint"))
        lay.addWidget(self.ch_title)
        lay.addWidget(self.chapters, 1)
        dock.setWidget(w)
        dock.setMinimumWidth(240)
        self.addDockWidget(Qt.LeftDockWidgetArea, dock)

    def refresh_list(self):
        self.chapters.blockSignals(True)
        self.chapters.clear()
        for i, _ch in enumerate(self.project["chapters"]):
            self.chapters.addItem(f"{i + 1}. {self.outline['chapters'][i]['title']}")
        if self.project["chapters"]:
            self.chapters.setCurrentRow(min(self.cur, len(self.project["chapters"]) - 1))
        self.chapters.blockSignals(False)

    def store_current(self):
        if not self.project["chapters"] or self.cur >= len(self.project["chapters"]):
            return
        doc = self.text.document()
        ch = self.project["chapters"][self.cur]
        ch["html"] = doc.toHtml()
        ch["text"] = document_to_plain(doc)

    def select_chapter(self, i: int):
        if self.project["chapters"] and self.cur < len(self.project["chapters"]) and i != self.cur:
            self.store_current()
        self.cur = i
        ch = self.project["chapters"][i]
        self.loading = True
        self.text.setHtml(ch.get("html") or plain_to_html(ch["text"]))
        base = QtGui.QFont(self.fmt["font"], int(self.fmt["size"]) + 1)
        self.text.document().setDefaultFont(base)
        self.text.document().clearUndoRedoStacks()
        self.ch_title.setText(self.outline["chapters"][i]["title"])
        self.loading = False
        self.chapters.blockSignals(True)
        self.chapters.setCurrentRow(i)
        self.chapters.blockSignals(False)
        self.text.moveCursor(QtGui.QTextCursor.Start)
        self.update_stats()

    def _title_edited(self, t):
        if self.project["chapters"]:
            self.outline["chapters"][self.cur]["title"] = t
            item = self.chapters.item(self.cur)
            if item:
                item.setText(f"{self.cur + 1}. {t}")
            self._changed()

    def add_chapter(self):
        self.store_current()
        n = len(self.project["chapters"])
        title, ok = QtWidgets.QInputDialog.getText(self, "Nová kapitola", "Název kapitoly:", text=f"Kapitola {n + 1}")
        if not ok:
            return
        pos = self.cur + 1 if n else 0
        self.outline["chapters"].insert(pos, {"title": title, "summary": ""})
        self.project["chapters"].insert(pos, {"text": "", "summary": ""})
        self.cur = pos
        self.refresh_list()
        self.select_chapter(pos)
        self._changed()

    def delete_chapter(self):
        if not self.project["chapters"]:
            return
        t = self.outline["chapters"][self.cur]["title"]
        if QtWidgets.QMessageBox.question(self, "Smazat kapitolu", f"Opravdu smazat kapitolu „{t}“?") \
                != QtWidgets.QMessageBox.Yes:
            return
        del self.project["chapters"][self.cur]
        del self.outline["chapters"][self.cur]
        self.cur = max(0, self.cur - 1)
        self.refresh_list()
        if self.project["chapters"]:
            self.loading = True
            self.select_chapter(self.cur)
        else:
            self.text.clear()
        self._changed()

    def move_chapter(self, d: int):
        j = self.cur + d
        if not (0 <= j < len(self.project["chapters"])):
            return
        self.store_current()
        for lst in (self.project["chapters"], self.outline["chapters"]):
            lst[self.cur], lst[j] = lst[j], lst[self.cur]
        self.cur = j
        self.refresh_list()
        self._changed()

    # ============================================================ formát
    def _merge(self, family=None, size=None, italic=None, underline=None, strike=None, bold=None):
        f = QtGui.QTextCharFormat()
        if family:
            f.setFontFamilies([family])
        if size:
            try:
                f.setFontPointSize(float(str(size).replace(",", ".")))
            except ValueError:
                return
        if italic is not None:
            f.setFontItalic(italic)
        if underline is not None:
            f.setFontUnderline(underline)
        if strike is not None:
            f.setFontStrikeOut(strike)
        if bold is not None:
            f.setFontWeight(QtGui.QFont.Bold if bold else QtGui.QFont.Normal)
        self._apply(f)

    def _apply(self, f: QtGui.QTextCharFormat):
        c = self.text.textCursor()
        if not c.hasSelection():
            c.select(QtGui.QTextCursor.WordUnderCursor)
        c.mergeCharFormat(f)
        self.text.mergeCurrentCharFormat(f)
        self.text.setFocus()

    def _bold(self, checked):
        self._merge(bold=checked)

    def _valign(self, checked, kind):
        f = QtGui.QTextCharFormat()
        if checked:
            f.setVerticalAlignment(QtGui.QTextCharFormat.AlignSuperScript if kind == "sup"
                                   else QtGui.QTextCharFormat.AlignSubScript)
        else:
            f.setVerticalAlignment(QtGui.QTextCharFormat.AlignNormal)
        self._apply(f)

    def _grow(self, d):
        size = self.text.currentCharFormat().fontPointSize() or self.text.font().pointSizeF()
        self._merge(size=max(6, size + d * 2))

    def _set_color(self, col):
        if not col:
            return
        self._last_color = col
        f = QtGui.QTextCharFormat()
        f.setForeground(QtGui.QColor(col))
        self._apply(f)

    def _set_highlight(self, col):
        f = QtGui.QTextCharFormat()
        if col:
            f.setBackground(QtGui.QColor(col))
            self._apply(f)
        else:
            c = self.text.textCursor()
            fmt = c.charFormat()
            fmt.clearBackground()
            c.setCharFormat(fmt)

    def _clear_format(self):
        c = self.text.textCursor()
        c.setCharFormat(QtGui.QTextCharFormat())
        self.text.setCurrentCharFormat(QtGui.QTextCharFormat())

    def _painter(self, checked):
        self.painter_fmt = self.text.currentCharFormat() if checked else None
        self.text.viewport().setCursor(Qt.PointingHandCursor if checked else Qt.IBeamCursor)

    def _apply_painter(self):
        if self.painter_fmt is not None and self.text.textCursor().hasSelection():
            self.text.textCursor().setCharFormat(self.painter_fmt)
            self.painter_fmt = None
            self.b_painter.setChecked(False)
            self.text.viewport().setCursor(Qt.IBeamCursor)

    def _align(self, al):
        self.text.setAlignment(al)
        self._sync_toolbar()

    def _list(self, style):
        c = self.text.textCursor()
        lst = c.currentList()
        if lst and lst.format().style() == style:  # druhé kliknutí seznam zruší
            lst.remove(c.block())
            bf = c.blockFormat()
            bf.setIndent(0)
            c.setBlockFormat(bf)
            return
        fmt = QtGui.QTextListFormat()
        fmt.setStyle(style)
        c.createList(fmt)

    def _indent(self, d):
        c = self.text.textCursor()
        bf = c.blockFormat()
        bf.setIndent(max(0, bf.indent() + d))
        c.setBlockFormat(bf)

    def _line_height(self, pct):
        c = self.text.textCursor()
        bf = c.blockFormat()
        bf.setLineHeight(pct, QtGui.QTextBlockFormat.ProportionalHeight.value)
        c.setBlockFormat(bf)

    def _style(self, heading_level: int):
        c = self.text.textCursor()
        c.beginEditBlock()
        bf = c.blockFormat()
        bf.setHeadingLevel(heading_level)
        bf.setIndent(0)
        c.setBlockFormat(bf)
        c.select(QtGui.QTextCursor.BlockUnderCursor)
        f = QtGui.QTextCharFormat()
        sizes = {0: None, 2: 16, 3: 13}
        f.setFontWeight(QtGui.QFont.Bold if heading_level else QtGui.QFont.Normal)
        f.setFontItalic(False)
        if sizes[heading_level]:
            f.setFontPointSize(sizes[heading_level])
        else:
            f.setFontPointSize(int(self.fmt["size"]) + 1)
        c.mergeCharFormat(f)
        c.endEditBlock()

    def _quote(self):
        c = self.text.textCursor()
        c.beginEditBlock()
        bf = c.blockFormat()
        bf.setHeadingLevel(0)
        bf.setIndent(1)
        c.setBlockFormat(bf)
        c.select(QtGui.QTextCursor.BlockUnderCursor)
        f = QtGui.QTextCharFormat()
        f.setFontItalic(True)
        f.setForeground(QtGui.QColor("#475569"))
        c.mergeCharFormat(f)
        c.endEditBlock()

    def _page_break(self):
        c = self.text.textCursor()
        if c.hasSelection():  # označený text nemazat – zalomení vložit za něj
            c.setPosition(c.selectionEnd())
        c.movePosition(QtGui.QTextCursor.EndOfBlock)
        c.insertBlock()
        f = QtGui.QTextCharFormat()
        f.setForeground(QtGui.QColor("#94a3b8"))
        c.insertText(PAGE_BREAK, f)
        c.insertBlock()
        c.setCharFormat(QtGui.QTextCharFormat())

    def _sync_toolbar(self):
        f = self.text.currentCharFormat()
        for b, val in ((self.b_bold, f.fontWeight() >= QtGui.QFont.DemiBold), (self.b_italic, f.fontItalic()),
                       (self.b_under, f.fontUnderline()), (self.b_strike, f.fontStrikeOut()),
                       (self.b_sup, f.verticalAlignment() == QtGui.QTextCharFormat.AlignSuperScript),
                       (self.b_sub, f.verticalAlignment() == QtGui.QTextCharFormat.AlignSubScript)):
            b.blockSignals(True)
            b.setChecked(bool(val))
            b.blockSignals(False)
        fam = (f.fontFamilies() or [None])[0] if f.fontFamilies() else None
        self.font_box.blockSignals(True)
        self.font_box.setCurrentFont(QtGui.QFont(fam or self.fmt["font"]))
        self.font_box.blockSignals(False)
        size = f.fontPointSize() or (int(self.fmt["size"]) + 1)
        self.size_box.setEditText(f"{size:g}")
        al = self.text.alignment()
        for a, b in self.align_btns.items():
            b.blockSignals(True)
            b.setChecked(bool(al & a) if a != Qt.AlignLeft else not (al & (Qt.AlignHCenter | Qt.AlignRight |
                                                                           Qt.AlignJustify)))
            b.blockSignals(False)

    # ============================================================ stav, uložení
    def _build_status(self):
        self._stats_timer = QtCore.QTimer(self)
        self._stats_timer.setSingleShot(True)
        self._stats_timer.setInterval(400)
        self._stats_timer.timeout.connect(self.update_stats)
        sb = self.statusBar()
        self.stats = QtWidgets.QLabel("")
        self.saved = QtWidgets.QLabel("")
        sb.addWidget(self.stats, 1)
        sb.addPermanentWidget(self.saved)

    def _shortcuts(self):
        for seq, fn in (("Ctrl+S", self.save), ("Ctrl+F", self.open_find), ("Ctrl+H", self.open_find),
                        ("Ctrl+B", lambda: self.b_bold.click()), ("Ctrl+I", lambda: self.b_italic.click()),
                        ("Ctrl+U", lambda: self.b_under.click()), ("Ctrl+Return", self._page_break)):
            QtGui.QShortcut(QtGui.QKeySequence(seq), self, activated=fn)

    def _changed(self, *_):
        if self.loading:
            return
        self.dirty = True
        self._stats_timer.start()  # statistiky až po chvilce, ne při každém stisku klávesy

    def update_stats(self):
        if self.project["chapters"]:
            self.project["chapters"][self.cur]["text"] = document_to_plain(self.text.document())
        words, paras, n = bw.book_stats(self.project)

        def num(x):
            return f"{x:,}".replace(",", " ")

        cur = ""
        if self.project["chapters"]:
            cw, cp = bw.text_stats(self.project["chapters"][self.cur]["text"])
            cur = f"Kapitola {self.cur + 1}: {num(cw)} slov, {num(cp)} odstavců     "
        self.stats.setText(cur + f"Kniha: {n} kapitol · {num(words)} slov · {num(paras)} odstavců · "
                                 f"asi {num(max(1, words // 300))} stran")
        self.saved.setText("● neuloženo" if self.dirty else "✓ uloženo")
        self._update_title()

    def _update_title(self):
        self.setWindowTitle(f"{'● ' if self.dirty else ''}{self.title_edit.text() or self.outline['title']}"
                            " – Upravit knihu")

    # ------------------------------------------------------- automatické ukládání
    def eventFilter(self, obj, ev):
        if obj is self.text and ev.type() == QtCore.QEvent.KeyPress and not self.loading:
            ch = ev.text()
            mode = self.autosave["mode"]
            if ch:
                self._chars_since_save += 1
            if mode == "sentence" and ch in (".", "!", "?", "…", "\r", "\n"):
                self.request_autosave()
            elif mode == "word" and ch in (" ", "\r", "\n", "\t", ".", ",", "!", "?", ";", ":"):
                self.request_autosave()
            elif mode == "chars" and self._chars_since_save >= max(1, int(self.autosave["chars"])):
                self.request_autosave()
        return super().eventFilter(obj, ev)

    def request_autosave(self):
        import time

        if self.autosave["mode"] == "off":
            return
        wait = MIN_SAVE_GAP - (time.monotonic() - self._last_save)
        if wait > 0:
            if not self._pending_timer.isActive():
                self._pending_timer.start(int(wait * 1000) + 50)
            return
        QtCore.QTimer.singleShot(0, self._autosave_now)  # až po vložení znaku do textu

    def _autosave_now(self):
        if not self.dirty:
            return
        try:
            self.save()
        except Exception as e:  # noqa: BLE001 – automatické uložení nesmí shodit editor
            self.statusBar().showMessage(f"Automatické uložení se nepovedlo: {e}", 8000)
            return
        self.statusBar().showMessage(f"Automaticky uloženo {QtCore.QTime.currentTime().toString('HH:mm:ss')}", 4000)

    def save(self):
        import time

        self._last_save = time.monotonic()
        self._chars_since_save = 0
        self.store_current()
        self.outline["title"] = self.title_edit.text().strip() or self.outline["title"]
        self.project["author"] = self.author_edit.text().strip()
        self.fmt.update(font=self.book_font.currentFont().family(), size=self.book_size.value(),
                        toc=self.toc.isChecked())
        bw.save_project(self.path, self.project)
        self.dirty = False
        self.update_stats()

    def export(self):
        self.save()
        formats = [f for f, cb in self.fmt_checks.items() if cb.isChecked()] or ["docx"]
        self.statusBar().showMessage("Exportuji…")

        def done(files, err):
            self.statusBar().clearMessage()
            if err:
                QtWidgets.QMessageBox.critical(self, "Export", str(err))
            else:
                QtWidgets.QMessageBox.information(self, "Export", "Uloženo:\n\n" + "\n".join(files))

        run_bg(lambda: bw.export(self.project, self.path.parent, formats, lambda *_: None, self.ebook_convert), done)

    def open_find(self):
        if not self.find_dlg:
            self.find_dlg = FindDialog(self)
        c = self.text.textCursor()
        if c.hasSelection():
            self.find_dlg.find.setText(c.selectedText())
        self.find_dlg.show()
        self.find_dlg.raise_()
        self.find_dlg.find.setFocus()

    def closeEvent(self, e):
        if self.dirty:
            ans = QtWidgets.QMessageBox.question(
                self, "Upravit knihu", "Uložit změny?",
                QtWidgets.QMessageBox.Save | QtWidgets.QMessageBox.Discard | QtWidgets.QMessageBox.Cancel)
            if ans == QtWidgets.QMessageBox.Cancel:
                e.ignore()
                return
            if ans == QtWidgets.QMessageBox.Save:
                self.save()
        e.accept()
