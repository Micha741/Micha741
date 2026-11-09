"""Editor knihy ve stylu Wordu: pás karet (písmo, odstavec, styly, úpravy), kapitoly, hledání, export."""

from __future__ import annotations

import re
from pathlib import Path

from PySide6 import QtCore, QtGui, QtPrintSupport, QtWidgets

import book_images
import book_writer as bw
from html_docx import PAGE_BREAK, plain_to_html
from i18n import tr
from qt_common import emoji_icon, label, lines_icon, run_bg, text_icon
from qt_ruler import HRuler, VRuler
from qt_textassist import TextAssist

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


class BookTextEdit(QtWidgets.QTextEdit):
    """Text kapitoly: obrázky se načítají z knihy; obrázek jde vložit ze schránky i přetažením myší."""

    IMAGE_EXT = (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tif", ".tiff")

    def __init__(self, editor: "BookEditor"):
        super().__init__()
        self.editor = editor

    def loadResource(self, rtype, url):
        if rtype == QtGui.QTextDocument.ImageResource:
            data = book_images.get_image(self.editor.project, url.toString())
            if data:
                return QtGui.QImage.fromData(data)
        return super().loadResource(rtype, url)

    def _image_files(self, source) -> list[str]:
        return [u.toLocalFile() for u in source.urls() if u.isLocalFile()
                and u.toLocalFile().lower().endswith(self.IMAGE_EXT)] if source.hasUrls() else []

    def canInsertFromMimeData(self, source):
        return source.hasImage() or bool(self._image_files(source)) or super().canInsertFromMimeData(source)

    def insertFromMimeData(self, source):
        files = self._image_files(source)
        if files:
            for f in files:
                self.editor.insert_image_data(Path(f).read_bytes())
            return
        if source.hasImage() and not source.hasText():
            img = source.imageData()
            buf = QtCore.QBuffer()
            buf.open(QtCore.QIODevice.WriteOnly)
            QtGui.QImage(img).save(buf, "PNG")
            self.editor.insert_image_data(bytes(buf.data()))
            return
        super().insertFromMimeData(source)


def document_to_plain(doc: QtGui.QTextDocument) -> str:
    """Text dokumentu: odstavce oddělené prázdným řádkem (pro AI, statistiky a hledání v celé knize)."""
    blocks = []
    b = doc.begin()
    while b.isValid():
        blocks.append(b.text().replace(" ", "\n").replace("\ufffc", "[obrázek]"))
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


class HScroll(QtWidgets.QScrollArea):
    """Řádek pásu karet: když se na menší obrazovku nevejde, neroztáhne okno ani neukáže posuvník –
    na krajích se objeví šipky ◀ ▶ (jde i kolečkem myši)."""

    STEP = 240

    def __init__(self, content: QtWidgets.QWidget):
        super().__init__()
        self.setWidget(content)
        self.setWidgetResizable(True)
        self.setFrameShape(QtWidgets.QFrame.NoFrame)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.setSizePolicy(QtWidgets.QSizePolicy.Expanding, QtWidgets.QSizePolicy.Fixed)
        self.viewport().setAutoFillBackground(False)
        content.setAutoFillBackground(False)
        self.arrows = []
        for text, step in (("◀", -1), ("▶", 1)):
            b = QtWidgets.QToolButton(self)
            b.setObjectName("RibbonArrow")
            b.setText(text)
            b.setAutoRepeat(True)
            b.setCursor(Qt.PointingHandCursor)
            b.setToolTip(tr("Další tlačítka pásu karet"))
            b.setStyleSheet("QToolButton#RibbonArrow { background: rgba(241,245,249,235); border: 1px solid #cbd5e1;"
                            " border-radius: 4px; color: #334155; font-size: 9pt; }"
                            "QToolButton#RibbonArrow:hover { background: #dbeafe; }")
            b.clicked.connect(lambda _=False, st=step: self._scroll(st * self.STEP))
            b.hide()
            self.arrows.append(b)
        self.horizontalScrollBar().valueChanged.connect(lambda *_: self._place_arrows())
        self._fit()

    def _scroll(self, dx: int):
        sb = self.horizontalScrollBar()
        sb.setValue(sb.value() + dx)

    def wheelEvent(self, e):
        d = e.angleDelta()
        if self.horizontalScrollBar().maximum() > 0 and (d.y() or d.x()):
            self._scroll(-(d.y() or d.x()) // 2)
            e.accept()
        else:
            super().wheelEvent(e)

    def _fit(self):
        h = self.widget().sizeHint().height()
        if self.height() != h or self.minimumHeight() != h:
            self.setFixedHeight(h)
        self._place_arrows()

    def _place_arrows(self):
        sb = self.horizontalScrollBar()
        w, h = 20, max(24, self.height() - 16)
        left, right = self.arrows
        left.setGeometry(0, (self.height() - h) // 2, w, h)
        right.setGeometry(self.width() - w, (self.height() - h) // 2, w, h)
        left.setVisible(sb.value() > 0)
        right.setVisible(sb.value() < sb.maximum())
        for b in self.arrows:
            b.raise_()

    def minimumSizeHint(self) -> QtCore.QSize:
        return QtCore.QSize(120, self.height())

    def sizeHint(self) -> QtCore.QSize:
        return QtCore.QSize(self.widget().sizeHint().width(), self.height())

    def resizeEvent(self, e):
        super().resizeEvent(e)
        self._fit()


def panel_icon() -> QtGui.QIcon:
    """Ikona „okno s postranním panelem“ (jako ve VS Code) pro skrytí panelu kapitol."""
    icon = QtGui.QIcon()
    for size in (16, 20, 32):
        pm = QtGui.QPixmap(size, size)
        pm.fill(Qt.transparent)
        p = QtGui.QPainter(pm)
        p.setRenderHint(QtGui.QPainter.Antialiasing)
        pen = QtGui.QPen(QtGui.QColor("#334155"), max(1.2, size / 14))
        p.setPen(pen)
        m = size * 0.12
        r = QtCore.QRectF(m, m * 1.4, size - 2 * m, size - 2.8 * m)
        p.drawRoundedRect(r, size * 0.12, size * 0.12)
        p.fillRect(QtCore.QRectF(r.left() + pen.widthF(), r.top() + pen.widthF(), r.width() * 0.3,
                                 r.height() - 2 * pen.widthF()), QtGui.QColor("#64748b"))
        p.end()
        icon.addPixmap(pm)
    return icon


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
    closed = QtCore.Signal()  # editor byl zavřen (hlavní okno se vrátí na Napsat knihu)

    def __init__(self, project: dict, path: Path, ebook_convert: str | None, parent=None,
                 autosave: dict | None = None, text_assist: dict | None = None, save_options=None):
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

        self.text = BookTextEdit(self)
        self.text.setAcceptRichText(True)
        self.text.setTabStopDistance(40)
        self.text.document().setDocumentMargin(48)
        self.text.setStyleSheet("QTextEdit { border: none; background: white; }")
        self.view_opts = text_assist if text_assist is not None else {}
        self._save_view = save_options or (lambda: None)
        page = QtWidgets.QFrame()
        page.setStyleSheet("background: #e8ebf0;")
        pl = QtWidgets.QHBoxLayout(page)
        pl.setContentsMargins(24, 16, 24, 16)
        sheet = QtWidgets.QWidget()  # stránka s pravítky: [roh][vodorovné] / [svislé][text]
        sheet.setMaximumWidth(980 + 22)
        sg = QtWidgets.QGridLayout(sheet)
        sg.setContentsMargins(0, 0, 0, 0)
        sg.setSpacing(0)
        self.hruler = HRuler(self.text)
        self.vruler = VRuler(self.text)
        self.ruler_corner = QtWidgets.QWidget()
        self.ruler_corner.setFixedSize(22, 22)
        self.ruler_corner.setStyleSheet("background: #f1f5f9;")
        sg.addWidget(self.ruler_corner, 0, 0)
        sg.addWidget(self.hruler, 0, 1)
        sg.addWidget(self.vruler, 1, 0)
        sg.addWidget(self.text, 1, 1)
        pl.addWidget(sheet)

        central = QtWidgets.QWidget()
        cl = QtWidgets.QVBoxLayout(central)
        cl.setContentsMargins(0, 0, 0, 0)
        cl.setSpacing(0)
        cl.addWidget(self._build_ribbon())
        cl.addWidget(page, 1)
        self.setCentralWidget(central)
        self._build_chapters_dock()
        self.set_chapters_panel(bool(self.view_opts.get("chapters_panel", True)), save=False)
        self._build_status()
        self.sb_panel.setChecked(bool(self.view_opts.get("chapters_panel", True)))
        self._shortcuts()

        self.text.document().contentsChanged.connect(self._doc_changed)
        self.text.installEventFilter(self)
        lang = str(project.get("language") or "čeština").lower()
        self.assist = TextAssist(self.text, text_assist, save_options, extra_menu=self._extra_menu,
                                 spelling=lang.startswith(("češ", "ces", "cz", "cs")))
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
        b.setToolTip(tr(tip) + (f" ({shortcut})" if shortcut else ""))
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
        tabs.addTab(self._file_tab(), "Soubor")
        tabs.addTab(self._home_tab(), "Domů")
        tabs.addTab(self._book_tab(), "Kniha")
        tabs.addTab(self._view_tab(), "Zobrazení")
        tabs.setCurrentIndex(1)
        back = QtWidgets.QToolButton()
        back.setObjectName("RibbonBack")
        back.setText(tr("← Zpět"))
        back.setToolTip(tr("Uložit knihu a vrátit se na stránku Napsat knihu (Alt+←)"))
        back.setAutoRaise(True)
        back.setCursor(Qt.PointingHandCursor)
        back.setStyleSheet("QToolButton#RibbonBack { font-weight: 600; padding: 4px 12px; color: #1d4ed8; }"
                           "QToolButton#RibbonBack:hover { background: #dbeafe; border-radius: 4px; }")
        back.clicked.connect(self.go_back)
        tabs.setCornerWidget(back, Qt.TopLeftCorner)
        self.b_back = back
        self.ribbon = tabs
        return tabs

    def _file_tab(self) -> QtWidgets.QWidget:
        """Karta Soubor jako ve Wordu: uložit, uložit jako (DOCX, PDF, MOBI, ODT, TXT…), export, tisk."""
        f = RibbonGroup("Soubor")
        f.grid.addWidget(self._big(emoji_icon("💾"), "Uložit", self.save), 0, 0)
        self.b_saveas = self._big(emoji_icon("🗂️"), "Uložit jako…", self.save_as)
        self.b_saveas.setToolTip("Uložit knihu do jednoho souboru: DOCX, PDF, MOBI, EPUB, AZW3, ODT, TXT, "
                                 "nebo jako projekt *.kniha.json (Ctrl+Shift+S)")
        f.grid.addWidget(self.b_saveas, 0, 1)
        f.grid.addWidget(self._big(emoji_icon("📤"), "Exportovat", self.export), 0, 2)
        pr = RibbonGroup("Tisk")
        self.b_print = self._big(emoji_icon("🖨️"), "Tisk", lambda: self.print_book(True))
        self.b_print.setToolTip("Vytisknout knihu (Ctrl+P). Šipkou vyberete tisk kapitoly nebo náhled.")
        pm = QtWidgets.QMenu(self.b_print)
        pm.addAction("🖨 Vytisknout celou knihu…  (Ctrl+P)", lambda: self.print_book(True))
        pm.addAction("Vytisknout jen tuto kapitolu…", lambda: self.print_book(False))
        pm.addSeparator()
        pm.addAction("🔍 Náhled tisku – celá kniha", lambda: self.print_preview(True))
        pm.addAction("Náhled tisku – tato kapitola", lambda: self.print_preview(False))
        self.b_print.setMenu(pm)
        self.b_print.setPopupMode(QtWidgets.QToolButton.MenuButtonPopup)
        pr.grid.addWidget(self.b_print, 0, 0)
        pr.grid.addWidget(self._big(emoji_icon("🔍"), "Náhled tisku", lambda: self.print_preview(True)), 0, 1)
        win = RibbonGroup("Okno")
        win.grid.addWidget(self._big(emoji_icon("⬅️"), "Hlavní okno", self.go_back), 0, 0)
        win.grid.addWidget(self._big(emoji_icon("✖️"), "Zavřít", self.close), 0, 1)
        return self._row(f, pr, win)

    def go_back(self):
        """Zpět na hlavní obrazovku: kniha se uloží a editor zavře (bez dotazu)."""
        if self.dirty:
            try:
                self.save()
            except Exception as e:  # noqa: BLE001
                QtWidgets.QMessageBox.warning(self, "Upravit knihu", f"Knihu se nepodařilo uložit:\n{e}")
                return
        self.close()

    def save_as(self):
        """Uložit jako: formát podle zvoleného typu souboru; projekt *.kniha.json přepne editor na nový soubor."""
        self.store_current()
        filters = [f"Projekt knihy (*{bw.PROJECT_SUFFIX})"] + list(bw.SAVE_FORMATS.values())
        start = str(self.path.parent / bw.safe_name(self.title_edit.text().strip() or self.outline["title"]))
        f, chosen = QtWidgets.QFileDialog.getSaveFileName(self, "Uložit jako", start, ";;".join(filters),
                                                          bw.SAVE_FORMATS["docx"])
        if not f:
            return
        ext = {v: k for k, v in bw.SAVE_FORMATS.items()}.get(chosen)
        if chosen.startswith("Projekt") or f.endswith(bw.PROJECT_SUFFIX):
            if not f.endswith(bw.PROJECT_SUFFIX):
                f = re.sub(r"\.(kniha|json)$", "", f) + bw.PROJECT_SUFFIX
            self.path = Path(f)
            self.save()
            self._update_title()
            self.statusBar().showMessage(f"Uloženo jako {f}", 6000)
            return
        if ext and not f.lower().endswith("." + ext):
            f += "." + ext
        self.save()
        self.statusBar().showMessage("Ukládám…")

        def done(path, err):
            self.statusBar().clearMessage()
            if err:
                QtWidgets.QMessageBox.critical(self, "Uložit jako", str(err))
            else:
                self.statusBar().showMessage(f"Uloženo: {path}", 8000)
                QtWidgets.QMessageBox.information(self, "Uložit jako", f"Uloženo:\n\n{path}")

        if f.lower().endswith(".odt"):  # ODT zapisuje Qt – v okenním vlákně
            try:
                done(bw.save_as(self.project, f, lambda *_: None, self.ebook_convert), None)
            except Exception as e:  # noqa: BLE001
                done(None, e)
            return
        run_bg(lambda: bw.save_as(self.project, f, lambda *_: None, self.ebook_convert), done, owner=self)

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
        return HScroll(w)

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

        ins = RibbonGroup("Vložení")
        b_img = self._big(emoji_icon("🖼️"), "Obrázek", self.pick_image)
        b_img.setToolTip("Vložit obrázek ze souboru (JPG, PNG…). Jde i Ctrl+V ze schránky nebo přetažením myší. "
                         "Velikost a zarovnání změníte pravým tlačítkem na obrázku.")
        ins.grid.addWidget(b_img, 0, 0)
        return self._row(clip, font, para, ins, styles, edit)

    # ================================================================ tisk
    def print_document(self, whole: bool = True) -> QtGui.QTextDocument:
        """Dokument k tisku: titulní strana a kapitoly (každá od nové stránky) nebo jen aktuální kapitola."""
        from qt_bookdoc import book_document

        self.store_current()
        return book_document(self.project, None if whole else self.cur,
                             title=self.title_edit.text().strip() or self.outline.get("title", ""),
                             author=self.author_edit.text().strip())

    def _printer(self) -> QtPrintSupport.QPrinter:
        pr = QtPrintSupport.QPrinter(QtPrintSupport.QPrinter.HighResolution)
        pr.setPageSize(QtGui.QPageSize(QtGui.QPageSize.A4))
        # okraje 2 cm přidá tisk dokumentu sám (QTextDocument.print_), proto zde nulové – jinak by se sčítaly
        pr.setPageMargins(QtCore.QMarginsF(0, 0, 0, 0), QtGui.QPageLayout.Millimeter)
        pr.setDocName(self.title_edit.text().strip() or "Kniha")
        return pr

    def print_book(self, whole: bool = True):
        pr = self._printer()
        dlg = QtPrintSupport.QPrintDialog(pr, self)
        dlg.setWindowTitle("Tisk – " + ("celá kniha" if whole else "tato kapitola"))
        if dlg.exec() == QtWidgets.QDialog.Accepted:
            self.print_document(whole).print_(pr)
            self.statusBar().showMessage("Odesláno na tiskárnu.", 5000)

    def print_preview(self, whole: bool = True):
        pr = self._printer()
        doc = self.print_document(whole)
        dlg = QtPrintSupport.QPrintPreviewDialog(pr, self)
        dlg.setWindowTitle("Náhled tisku – " + ("celá kniha" if whole else "tato kapitola"))
        dlg.paintRequested.connect(doc.print_)
        dlg.resize(1000, 800)
        dlg.exec()

    def print_to_pdf(self, path: str, whole: bool = True) -> None:
        """Totéž co tisk, jen do souboru PDF (použito v testech)."""
        pr = self._printer()
        pr.setOutputFormat(QtPrintSupport.QPrinter.PdfFormat)
        pr.setOutputFileName(str(path))
        self.print_document(whole).print_(pr)

    def _view_tab(self) -> QtWidgets.QWidget:
        show = RibbonGroup("Zobrazit")
        self.b_ruler = self._big(emoji_icon("📏"), "Pravítko", lambda: self.set_ruler(self.b_ruler.isChecked()))
        self.b_ruler.setCheckable(True)
        self.b_ruler.setToolTip("Pravítka nad a vlevo od stránky. Na vodorovném jde myší posouvat odsazení "
                                "odstavce (▽ první řádek, △ levé a pravé odsazení); dvojklik ho zruší.")
        show.grid.addWidget(self.b_ruler, 0, 0)
        self.b_panel = self._big(emoji_icon("📑"), "Panel kapitol", lambda: self.set_chapters_panel(
            self.b_panel.isChecked()))
        self.b_panel.setCheckable(True)
        self.b_panel.setToolTip("Zobrazit / skrýt seznam kapitol vlevo (F9)")
        show.grid.addWidget(self.b_panel, 0, 1)
        on = bool(self.view_opts.get("ruler", True))
        self.b_ruler.setChecked(on)
        self.set_ruler(on, save=False)
        return self._row(show)

    def go_chapter(self, step: int):
        n = len(self.project["chapters"])
        i = self.cur + step
        if 0 <= i < n:
            self.select_chapter(i)

    def _dock_visibility(self, visible: bool):
        try:
            if hasattr(self, "b_panel") and not self.isMinimized():
                self.b_panel.setChecked(visible)
                if hasattr(self, "sb_panel"):
                    self.sb_panel.setChecked(visible)
        except RuntimeError:  # okno se právě zavírá
            pass

    def set_chapters_panel(self, on: bool, save: bool = True):
        """Skrytí panelu kapitol dá stránce celou šířku okna; stav se pamatuje."""
        self.chapters_dock.setVisible(on)
        self.b_panel.setChecked(on)
        if hasattr(self, "sb_panel"):
            self.sb_panel.setChecked(on)
        if save:
            self.view_opts["chapters_panel"] = on
            self._save_view()

    def set_ruler(self, on: bool, save: bool = True):
        for w in (self.hruler, self.vruler, self.ruler_corner):
            w.setVisible(on)
        if save:
            self.view_opts["ruler"] = on
            self._save_view()

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
        for i, f in enumerate(("epub", "docx", "pdf", "azw3", "mobi", "odt", "rtf", "txt")):
            cb = QtWidgets.QCheckBox(f.upper())
            cb.setChecked(f in ("epub", "docx"))
            self.fmt_checks[f] = cb
            exp.grid.addWidget(cb, i % 2, i // 2)
        exp.grid.addWidget(self._big(emoji_icon("📤"), "Exportovat", self.export), 0, 4, 2, 1)

        chap = RibbonGroup("Kapitoly")
        chap.grid.addWidget(self._big(emoji_icon("➕"), "Nová kapitola", self.add_chapter), 0, 0, 2, 1)
        chap.grid.addWidget(self._tb(emoji_icon("⬆️"), "Posunout nahoru", lambda: self.move_chapter(-1)), 0, 1)
        chap.grid.addWidget(self._tb(emoji_icon("⬇️"), "Posunout dolů", lambda: self.move_chapter(1)), 1, 1)
        chap.grid.addWidget(self._tb(emoji_icon("🗑️"), "Smazat kapitolu", self.delete_chapter), 0, 2)
        cov = RibbonGroup("Obálka")
        self.cover_thumb = QtWidgets.QLabel()
        self.cover_thumb.setFixedSize(46, 64)
        self.cover_thumb.setAlignment(Qt.AlignCenter)
        self.cover_thumb.setStyleSheet("border: 1px solid #cbd5e1; background: white; color: #94a3b8;")
        cov.grid.addWidget(self.cover_thumb, 0, 0, 2, 1)
        b_cov = self._big(emoji_icon("🖼️"), "Obálka…", self.pick_cover)
        b_cov.setToolTip("Obrázek obálky: v EPUB, MOBI a AZW3 jako obálka e-knihy ve čtečce, v DOCX, PDF a tisku "
                         "jako první strana.")
        cov.grid.addWidget(b_cov, 0, 1, 2, 1)
        cov.grid.addWidget(self._tb(emoji_icon("🗑️"), "Odebrat obálku", self.remove_cover), 0, 2)
        self.update_cover_thumb()
        return self._row(info, look, cov, exp, chap)

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
        dock.setFeatures(QtWidgets.QDockWidget.DockWidgetMovable | QtWidgets.QDockWidget.DockWidgetClosable)
        dock.visibilityChanged.connect(self._dock_visibility)
        self.chapters_dock = dock
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
        self.text.document().setModified(False)
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

    def _extra_menu(self, menu: QtWidgets.QMenu, word_cursor: QtGui.QTextCursor):
        """Položky editoru knihy v menu pravého tlačítka."""
        img = self.image_at(word_cursor)
        if img is not None:
            im = menu.addMenu("🖼 Obrázek")
            for pct in (25, 50, 75, 100):
                im.addAction(f"Šířka {pct} %", lambda p=pct, c=QtGui.QTextCursor(img): self.set_image_width(c, p))
            im.addAction("Vlastní šířka…", lambda c=QtGui.QTextCursor(img): self.ask_image_width(c))
            im.addSeparator()
            for text_, al in (("Zarovnat vlevo", Qt.AlignLeft), ("Na střed", Qt.AlignHCenter), ("Vpravo", Qt.AlignRight)):
                def align(c=QtGui.QTextCursor(img), a=al):
                    bf = c.blockFormat()
                    bf.setAlignment(a)
                    c.setBlockFormat(bf)
                    self._changed()
                im.addAction(text_, align)
            im.addSeparator()
            im.addAction("Nahradit obrázek…", lambda c=QtGui.QTextCursor(img): self.replace_image(c))
            im.addAction("🗑 Smazat obrázek", lambda c=QtGui.QTextCursor(img): (c.removeSelectedText(), self._changed()))
            menu.addSeparator()
        menu.addAction("🖼 Vložit obrázek…", self.pick_image)
        fmt = menu.addMenu("🅰 Formát písma")
        for b, text, key in ((self.b_bold, "Tučné", "Ctrl+B"), (self.b_italic, "Kurzíva", "Ctrl+I"),
                             (self.b_under, "Podtržené", "Ctrl+U"), (self.b_strike, "Přeškrtnuté", None)):
            a = fmt.addAction(text, b.click)
            a.setCheckable(True)
            a.setChecked(b.isChecked())
            if key:
                a.setShortcut(QtGui.QKeySequence(key))
        fmt.addSeparator()
        fmt.addAction("Zvětšit písmo", lambda: self._grow(1))
        fmt.addAction("Zmenšit písmo", lambda: self._grow(-1))
        fmt.addSeparator()
        fmt.addAction("Vymazat formátování", self._clear_format)
        para = menu.addMenu("¶ Odstavec")
        for text, al in (("Zarovnat vlevo", Qt.AlignLeft), ("Na střed", Qt.AlignHCenter),
                         ("Vpravo", Qt.AlignRight), ("Do bloku", Qt.AlignJustify)):
            para.addAction(text, lambda al=al: self.text.setAlignment(al))
        menu.addAction("Zalomit řádek", lambda: self.text.textCursor().insertText("\u2028"),
                       QtGui.QKeySequence("Shift+Return"))
        menu.addAction("⤓ Zalomit stránku", self._page_break, QtGui.QKeySequence("Ctrl+Return"))
        menu.addSeparator()
        menu.addAction("🔍 Najít a nahradit…", self.open_find, QtGui.QKeySequence("Ctrl+F"))

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
        self.sb_panel = QtWidgets.QToolButton()
        self.sb_panel.setIcon(panel_icon())
        self.sb_panel.setCheckable(True)
        self.sb_panel.setAutoRaise(True)
        self.sb_panel.setToolTip(tr("Zobrazit nebo skrýt panel kapitol (F9)"))
        self.sb_panel.clicked.connect(lambda on: self.set_chapters_panel(on))
        self.sb_prev = QtWidgets.QToolButton()
        self.sb_prev.setText("‹")
        self.sb_prev.setToolTip(tr("Předchozí kapitola (Ctrl+PgUp)"))
        self.sb_prev.clicked.connect(lambda: self.go_chapter(-1))
        self.sb_next = QtWidgets.QToolButton()
        self.sb_next.setText("›")
        self.sb_next.setToolTip(tr("Další kapitola (Ctrl+PgDown)"))
        self.sb_next.clicked.connect(lambda: self.go_chapter(1))
        for b in (self.sb_prev, self.sb_next):
            b.setAutoRaise(True)
            b.setStyleSheet("font-size: 13pt; padding: 0 6px;")
        for b in (self.sb_panel, self.sb_prev, self.sb_next):
            sb.addWidget(b)
        self.stats = QtWidgets.QLabel("")
        self.saved = QtWidgets.QLabel("")
        sb.addWidget(self.stats, 1)
        sb.addPermanentWidget(self.saved)

    def _shortcuts(self):
        for seq, fn in (("Ctrl+S", self.save), ("Ctrl+F", self.open_find), ("Ctrl+H", self.open_find),
                        ("Ctrl+B", lambda: self.b_bold.click()), ("Ctrl+I", lambda: self.b_italic.click()),
                        ("Ctrl+U", lambda: self.b_under.click()), ("Ctrl+Return", self._page_break),
                        ("Ctrl+P", lambda: self.print_book(True)), ("Ctrl+Shift+S", self.save_as),
                        ("F9", lambda: self.set_chapters_panel(not self.chapters_dock.isVisible())),
                        ("Alt+Left", self.go_back), ("Ctrl+PgUp", lambda: self.go_chapter(-1)),
                        ("Ctrl+PgDown", lambda: self.go_chapter(1))):
            sc = QtGui.QShortcut(QtGui.QKeySequence(seq), self, activated=fn)
            sc.setContext(Qt.WidgetWithChildrenShortcut)  # jen v editoru, ne na jiných stránkách okna

    def _doc_changed(self):
        # kontrola pravopisu jen překresluje podtržení – to není úprava textu
        if self.text.document().isModified():
            self._changed()

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
        self.stats.setText(tr(cur) + tr(f"Kniha: {n} kapitol · {num(words)} slov · {num(paras)} odstavců · "
                                        f"asi {num(max(1, words // 300))} stran"))
        self.saved.setText("● neuloženo" if self.dirty else "✓ uloženo")
        self._update_title()

    def _update_title(self):
        title = f"{'● ' if self.dirty else ''}{self.title_edit.text() or self.outline['title']} – Upravit knihu"
        self.setWindowTitle(title)
        top = self.window()
        if top is not self and top.isVisible() and getattr(top, "editor", None) is self \
                and top.stack.currentWidget() is self:
            top.setWindowTitle(title)

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

    # ================================================================ obrázky a obálka
    IMAGE_FILTER = "Obrázky (*.jpg *.jpeg *.png *.gif *.bmp *.webp *.tif *.tiff);;Vše (*.*)"

    def pick_image(self):
        f, _ = QtWidgets.QFileDialog.getOpenFileName(self, "Vložit obrázek", str(self.path.parent), self.IMAGE_FILTER)
        if f:
            self.insert_image_data(Path(f).read_bytes())

    def insert_image_data(self, data: bytes, cursor: QtGui.QTextCursor | None = None) -> str | None:
        """Vloží obrázek do textu jako samostatný odstavec na střed; data se uloží do knihy."""
        try:
            data, ext = book_images.shrink(data)
        except Exception as e:  # noqa: BLE001
            QtWidgets.QMessageBox.warning(self, "Obrázek", f"Obrázek se nepodařilo načíst:\n{e}")
            return None
        name = book_images.add_image(self.project, data, ext)
        w, _h = book_images.size_px(data)
        c = cursor or self.text.textCursor()
        c.beginEditBlock()
        if c.block().text().strip():
            c.movePosition(QtGui.QTextCursor.EndOfBlock)
            c.insertBlock()
        bf = c.blockFormat()
        bf.setAlignment(Qt.AlignHCenter)
        c.setBlockFormat(bf)
        f = QtGui.QTextImageFormat()
        f.setName(name)
        f.setWidth(min(w, book_images.PAGE_PX * 0.8))
        c.insertImage(f)
        c.insertBlock()
        bf.setAlignment(Qt.AlignLeft)
        c.setBlockFormat(bf)
        c.endEditBlock()
        self.text.setTextCursor(c)
        self._changed()
        return name

    def image_at(self, cursor: QtGui.QTextCursor) -> QtGui.QTextCursor | None:
        """Kurzor s označeným obrázkem v místě kliknutí (nebo None)."""
        doc = self.text.document()
        base = cursor.selectionStart() if cursor.hasSelection() else cursor.position()
        for i in dict.fromkeys((base, base - 1, cursor.selectionEnd() - 1, base + 1)):
            if 0 <= i < doc.characterCount() - 1 and doc.characterAt(i) == "\ufffc":
                c = QtGui.QTextCursor(doc)
                c.setPosition(i)
                c.setPosition(i + 1, QtGui.QTextCursor.KeepAnchor)
                if c.charFormat().isImageFormat():
                    return c
        return None

    def set_image_width(self, c: QtGui.QTextCursor, percent: int):
        f = c.charFormat().toImageFormat()
        nf = QtGui.QTextImageFormat()
        nf.setName(f.name())
        nf.setWidth(book_images.PAGE_PX * percent / 100)
        c.setCharFormat(nf)  # jen nový formát obrázku – text se nemění
        self._changed()

    def ask_image_width(self, c: QtGui.QTextCursor):
        cur = c.charFormat().toImageFormat().width()
        pct = round(cur / book_images.PAGE_PX * 100) if cur else 80
        v, ok = QtWidgets.QInputDialog.getInt(self, "Velikost obrázku", "Šířka obrázku v % šířky stránky:",
                                              max(5, min(100, pct)), 5, 100, 5)
        if ok:
            self.set_image_width(c, v)

    def replace_image(self, c: QtGui.QTextCursor):
        f, _ = QtWidgets.QFileDialog.getOpenFileName(self, "Nahradit obrázek", str(self.path.parent),
                                                     self.IMAGE_FILTER)
        if f:
            c.removeSelectedText()
            self.insert_image_data(Path(f).read_bytes(), c)

    def pick_cover(self):
        f, _ = QtWidgets.QFileDialog.getOpenFileName(self, "Obrázek obálky", str(self.path.parent), self.IMAGE_FILTER)
        if not f:
            return
        try:
            data, ext = book_images.shrink(Path(f).read_bytes())
        except Exception as e:  # noqa: BLE001
            QtWidgets.QMessageBox.warning(self, "Obálka", f"Obrázek se nepodařilo načíst:\n{e}")
            return
        self.project["cover"] = book_images.add_image(self.project, data, ext)
        self.update_cover_thumb()
        self._changed()

    def remove_cover(self):
        if self.project.pop("cover", None):
            self.update_cover_thumb()
            self._changed()

    def update_cover_thumb(self):
        data = book_images.get_image(self.project, self.project.get("cover") or "")
        if data:
            pm = QtGui.QPixmap()
            pm.loadFromData(data)
            self.cover_thumb.setPixmap(pm.scaled(self.cover_thumb.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation))
            self.cover_thumb.setToolTip("Obálka knihy")
        else:
            self.cover_thumb.setPixmap(QtGui.QPixmap())
            self.cover_thumb.setText("bez\nobálky")

    def save(self):
        import time

        self._last_save = time.monotonic()
        self._chars_since_save = 0
        self.store_current()
        self.outline["title"] = self.title_edit.text().strip() or self.outline["title"]
        self.project["author"] = self.author_edit.text().strip()
        self.fmt.update(font=self.book_font.currentFont().family(), size=self.book_size.value(),
                        toc=self.toc.isChecked())
        book_images.prune(self.project)  # obrázky smazané z textu už v souboru nebudou
        bw.save_project(self.path, self.project)
        self.dirty = False
        self.text.document().setModified(False)
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

        run_bg(lambda: bw.export(self.project, self.path.parent, formats, lambda *_: None, self.ebook_convert), done, owner=self)

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
        self.closed.emit()
