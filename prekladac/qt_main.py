"""Hlavní okno programu (Qt): Překlad, Napsat knihu, Nastavení."""

from __future__ import annotations

import os
import re
import sys
import threading
import webbrowser
from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets

import app as core
import book_options as bo
import book_writer as bw
import components
from claude_client import DEFAULT_MODEL, MODELS, Cancelled
from converters import DOC_ONLY_EXT, OUTPUT_FORMATS, SUPPORTED_EXT, find_ebook_convert
from free_engines import ENGINE_LABELS, OCR_LABELS, EngineError, GeminiEngine, OllamaEngine, find_tesseract
from guides import GUIDES
from qt_common import STYLESHEET, app_icon, asset, bridge, emoji_icon, label, run_bg, set_status
import i18n
import updater
from qt_editor import HScroll, RibbonGroup, vline
from qt_textassist import TextAssist
from version import VERSION

Qt = QtCore.Qt


def h_title(text: str) -> QtWidgets.QLabel:
    return label(text, "PageTitle", wrap=False)


def scrolled(w: QtWidgets.QWidget) -> QtWidgets.QScrollArea:
    """Obsah s posuvníkem – když se okno zmenší, nic se neschová mimo obrazovku."""
    sa = QtWidgets.QScrollArea()
    sa.setWidgetResizable(True)
    sa.setFrameShape(QtWidgets.QFrame.NoFrame)
    sa.setWidget(w)
    return sa


# offline balíčky nabízené v Nastavení (nejčastěji z angličtiny a němčiny do češtiny)
OFFLINE_PAIRS = [("en", "cs"), ("de", "en"), ("cs", "en"), ("en", "de"), ("fr", "en"), ("es", "en"), ("it", "en"),
                 ("pl", "en"), ("ru", "en"), ("sk", "en"), ("nl", "en"), ("pt", "en"), ("uk", "en"), ("hu", "en"),
                 ("en", "sk")]


def big_button(icon: str, text: str, tip: str = "", obj: str = "BigAction") -> QtWidgets.QToolButton:
    """Velké tlačítko pásu karet (ikona nad textem) jako ve Wordu."""
    b = QtWidgets.QToolButton()
    b.setObjectName(obj)
    b.setIcon(emoji_icon(icon))
    b.setIconSize(QtCore.QSize(28, 28))
    b.setText(text)
    b.setToolTip(tip)
    b.setToolButtonStyle(Qt.ToolButtonTextUnderIcon)
    b.setMinimumWidth(92)
    return b


def ribbon_group(title: str, rows) -> "RibbonGroup":
    """Skupina pásu karet: řádky (popisek, prvek); prázdný popisek = prvek přes celou šířku."""
    g = RibbonGroup(title)
    for r, (text, w) in enumerate(rows):
        if text:
            g.grid.addWidget(QtWidgets.QLabel(text), r, 0)
            g.grid.addWidget(w, r, 1)
        else:
            g.grid.addWidget(w, r, 0, 1, 2)
    g.grid.setHorizontalSpacing(6)
    g.grid.setVerticalSpacing(4)
    return g


def ribbon_row(*groups) -> QtWidgets.QWidget:
    w = QtWidgets.QWidget()
    hl = QtWidgets.QHBoxLayout(w)
    hl.setContentsMargins(4, 6, 4, 2)
    hl.setSpacing(6)
    for i, g in enumerate(groups):
        if i:
            hl.addWidget(vline())
        hl.addWidget(g)
    hl.addStretch(1)
    return HScroll(w)


def doc_heading(text: str, hint: str) -> QtWidgets.QWidget:
    w = QtWidgets.QWidget()
    v = QtWidgets.QVBoxLayout(w)
    v.setContentsMargins(0, 8, 0, 2)
    v.setSpacing(0)
    v.addWidget(label(text, "DocHeading", wrap=False))
    v.addWidget(label(hint, "Hint"))
    return w


def paper_canvas(widgets) -> QtWidgets.QScrollArea:
    """Bílá „stránka“ na šedém pozadí (jako ve Wordu) s posuvníkem."""
    paper = QtWidgets.QFrame()
    paper.setObjectName("Paper")
    paper.setMaximumWidth(980)
    pl = QtWidgets.QVBoxLayout(paper)
    pl.setContentsMargins(56, 30, 56, 36)
    pl.setSpacing(6)
    for w in widgets:
        pl.addWidget(w)
    canvas = QtWidgets.QWidget()
    canvas.setObjectName("Canvas")
    cl = QtWidgets.QHBoxLayout(canvas)
    cl.setContentsMargins(24, 20, 24, 24)
    cl.addStretch(1)
    cl.addWidget(paper, 30)
    cl.addStretch(1)
    scroll = QtWidgets.QScrollArea()
    scroll.setObjectName("CanvasScroll")
    scroll.setWidgetResizable(True)
    scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
    scroll.setWidget(canvas)
    scroll.paper, scroll.canvas_layout = paper, cl
    return scroll


PAPER_WIDTH = 980


def set_paper_full_width(paper: QtWidgets.QWidget, canvas_layout: QtWidgets.QBoxLayout, full: bool) -> None:
    """Stránka uprostřed s šedými okraji (jako ve Wordu), nebo přes celou šířku okna."""
    paper.setMaximumWidth(16777215 if full else PAPER_WIDTH)
    canvas_layout.setContentsMargins(*((8, 8, 8, 8) if full else (24, 20, 24, 24)))
    canvas_layout.setStretch(0, 0 if full else 1)
    canvas_layout.setStretch(2, 0 if full else 1)


def primary(text: str) -> QtWidgets.QPushButton:
    b = QtWidgets.QPushButton(text)
    b.setObjectName("Primary")
    return b


class LogView(QtWidgets.QPlainTextEdit):
    appended = QtCore.Signal(str)

    def __init__(self):
        super().__init__()
        self.setReadOnly(True)
        self.setMaximumBlockCount(5000)
        self.setFont(QtGui.QFont("Consolas", 9))

    def log(self, text: str) -> None:
        """Bezpečné volání i z vlákna."""
        text = i18n.tr_lines(text)
        bridge().later(lambda: (self.appendPlainText(text), self.ensureCursorVisible(), self.appended.emit(text)))


class WorkPanel(QtWidgets.QWidget):
    """Průběh a záznam dole. Záznam jde skrýt – pak se při práci ukáže jen tenký proužek
    s poslední zprávou a po chybě se záznam ukáže sám."""

    def __init__(self, show_log: bool = True):
        super().__init__()
        bl = QtWidgets.QVBoxLayout(self)
        bl.setContentsMargins(8, 4, 8, 6)
        bl.setSpacing(4)
        self.bar = QtWidgets.QProgressBar()
        self.bar.setRange(0, 1000)
        self.logv = LogView()
        self.logv.setMinimumHeight(60)
        bl.addWidget(self.bar)
        bl.addWidget(self.logv)
        self.show_log = show_log
        self.busy = False
        self.error_shown = False
        self.logv.appended.connect(self._message)
        self._update()

    def _message(self, text: str):
        last = text.strip().splitlines()[-1] if text.strip() else ""
        if not self.show_log:
            self.bar.setFormat(f"{last[:120]}   %p %" if last else "%p %")
            if last.startswith(("✗", "!")) or "chyba" in last.lower() or "error" in last.lower():
                self.error_shown = True  # chybu nesmí uživatel přehlédnout
                self._update()

    def set_log_visible(self, on: bool):
        self.show_log = on
        self.error_shown = False
        self.bar.setFormat("%p %")
        self._update()

    def set_busy(self, on: bool):
        self.busy = on
        if on:
            self.error_shown = False
        self._update()

    def _update(self):
        log = self.show_log or self.error_shown
        self.logv.setVisible(log)
        self.setVisible(log or self.busy)
        if log:
            self.setMaximumHeight(16777215)
        else:
            self.setMaximumHeight(self.bar.sizeHint().height() + 12)


def view_group(win: "MainWindow", key: str, panel: WorkPanel, paper, canvas_layout) -> "RibbonGroup":
    """Karta Zobrazení: stránka přes celou šířku a záznam průběhu (stav se pamatuje)."""
    opts = win.cfg.setdefault("view", {}).setdefault(key, {})
    full = QtWidgets.QCheckBox("Stránka přes celou šířku okna (bez šedých okrajů)")
    full.setChecked(bool(opts.get("full_width", False)))
    log = QtWidgets.QCheckBox("Zobrazit záznam průběhu dole")
    log.setToolTip("Když je vypnutý, při práci se ukáže jen proužek s poslední zprávou; při chybě se záznam "
                   "ukáže sám.")
    log.setChecked(bool(opts.get("log", True)))

    def apply(save=True):
        opts["full_width"], opts["log"] = full.isChecked(), log.isChecked()
        set_paper_full_width(paper, canvas_layout, full.isChecked())
        panel.set_log_visible(log.isChecked())
        if save:
            win.save_cfg()

    full.toggled.connect(lambda *_: apply())
    log.toggled.connect(lambda *_: apply())
    apply(save=False)
    g = ribbon_group("Zobrazení", [("", full), ("", log)])
    g.full_width, g.show_log = full, log
    return g


class FileList(QtWidgets.QListWidget):
    """Seznam souborů: přetahování myší, výběr více souborů (Ctrl, Shift, Ctrl+A), Delete odebere vybrané."""

    changed = QtCore.Signal()

    def __init__(self):
        super().__init__()
        self.setAcceptDrops(True)
        self.setSelectionMode(QtWidgets.QAbstractItemView.ExtendedSelection)
        self.setMinimumHeight(130)
        self.files: list[str] = []
        self.skipped: list[str] = []
        self.itemSelectionChanged.connect(self.changed)

    def add(self, paths) -> int:
        """Přidá podporované soubory (složky projde včetně podsložek). Vrátí počet přidaných."""
        added = 0
        self.skipped = []
        for p in paths:
            path = Path(str(p))
            if path.is_dir():
                items = sorted(f for f in path.rglob("*") if f.is_file())
            else:
                items = [path]
            for f in items:
                fs = str(f)
                if f.suffix.lower() not in SUPPORTED_EXT:
                    if not path.is_dir():
                        self.skipped.append(f.name)
                    continue
                if fs in self.files:
                    continue
                self.files.append(fs)
                it = QtWidgets.QListWidgetItem(emoji_icon("📄"), f"{f.name}   —   {f.parent}")
                it.setData(Qt.UserRole, fs)
                it.setToolTip(fs)
                self.addItem(it)
                added += 1
        self.changed.emit()
        return added

    def all_selected(self) -> bool:
        return self.count() > 0 and len(self.selectedItems()) == self.count()

    def remove_selected(self):
        for item in self.selectedItems():
            self.files.remove(item.data(Qt.UserRole))
            self.takeItem(self.row(item))
        self.changed.emit()

    def clear_all(self):
        self.files.clear()
        self.clear()
        self.changed.emit()

    def toggle_select_all(self):
        if self.all_selected():
            self.clearSelection()
        else:
            self.selectAll()

    def keyPressEvent(self, e):
        if e.key() in (Qt.Key_Delete, Qt.Key_Backspace) and self.selectedItems():
            self.remove_selected()
            return
        super().keyPressEvent(e)

    def dragEnterEvent(self, e):
        if e.mimeData().hasUrls():
            e.acceptProposedAction()

    def dragMoveEvent(self, e):
        e.acceptProposedAction()

    def dropEvent(self, e):
        self.add(u.toLocalFile() for u in e.mimeData().urls())
        e.acceptProposedAction()

    def paintEvent(self, e):
        super().paintEvent(e)
        if not self.files:
            p = QtGui.QPainter(self.viewport())
            p.setPen(QtGui.QColor("#94a3b8"))
            p.drawText(self.viewport().rect(), Qt.AlignCenter,
                       "Přetáhněte sem soubory\n(EPUB, AZW3, KFX, MOBI, PDF, DOCX, TXT, RTF, JPG, PNG…)")


# ======================================================================== Překlad
class TranslatePage(QtWidgets.QWidget):
    def __init__(self, win: "MainWindow"):
        super().__init__()
        self.win = win
        cfg = win.cfg
        self.cancel = threading.Event()
        # ---------- prvky
        self.files = FileList()
        self.files.setMinimumHeight(220)
        self.files.setContextMenuPolicy(Qt.CustomContextMenu)
        self.files.customContextMenuRequested.connect(self.files_menu)
        self.files.changed.connect(self.update_file_buttons)
        b_add = big_button("➕", "Přidat\nsoubory…", "V okně můžete vybrat víc souborů najednou (Ctrl+klik, "
                                                     "Shift+klik, Ctrl+A).")
        b_add.clicked.connect(self.pick)
        b_dir = big_button("📁", "Přidat\nsložku…", "Přidá všechny podporované soubory ze složky včetně podsložek.")
        b_dir.clicked.connect(self.pick_dir)
        self.b_selall = QtWidgets.QPushButton("☑ Vybrat vše")
        self.b_selall.setToolTip("Ctrl+A")
        self.b_selall.clicked.connect(self.files.toggle_select_all)
        self.b_remove = QtWidgets.QPushButton("➖ Odebrat vybrané")
        self.b_remove.setToolTip("Klávesa Delete")
        self.b_remove.clicked.connect(self.remove_files)
        for b in (self.b_selall, self.b_remove):
            b.setFixedWidth(190)  # šířka se nemění, když se text tlačítka přepne
        self.files_info = label("", "Hint", wrap=False)

        self.mode_translate = QtWidgets.QRadioButton("Přeložit")
        self.mode_convert = QtWidgets.QRadioButton("Jen převést formát / přepsat text z obrázku")
        (self.mode_convert if cfg.get("mode") == "convert" else self.mode_translate).setChecked(True)
        self.lang = QtWidgets.QComboBox()
        self.lang.setEditable(True)
        self.lang.addItems(core.LANGUAGES)
        self.lang.setCurrentText(cfg.get("lang", "čeština"))
        self.lang.setMinimumWidth(170)
        self.out_fmt = QtWidgets.QComboBox()
        for f in [core.SAME_FORMAT] + OUTPUT_FORMATS:  # hodnota v data – text se může přeložit
            self.out_fmt.addItem(f, f)
        self.out_fmt.setCurrentIndex(max(0, self.out_fmt.findData(cfg.get("out_fmt", core.SAME_FORMAT))))
        self.out_fmt.setMinimumWidth(170)
        self.engine = QtWidgets.QComboBox()
        for key, text in ENGINE_LABELS.items():
            self.engine.addItem(text, key)
        self.engine.setCurrentIndex(max(0, self.engine.findData(cfg.get("engine", "google"))))
        self.engine.setMinimumWidth(360)
        self.status = label("", wrap=False)
        self.ocr = QtWidgets.QComboBox()
        for key, text in OCR_LABELS.items():
            self.ocr.addItem(text, key)
        self.ocr.setCurrentIndex(max(0, self.ocr.findData(cfg.get("ocr", "tesseract"))))
        self.ocr.setMinimumWidth(230)
        self.ocr_lang = QtWidgets.QComboBox()
        self.ocr_lang.setEditable(True)
        self.ocr_lang.addItems(list(components.OCR_LANGUAGES) + ["eng+ces", "eng+deu"])
        self.ocr_lang.setCurrentText(cfg.get("ocr_lang", "eng"))
        self.merge = QtWidgets.QCheckBox("Více obrázků spojit do jednoho dokumentu (DOCX, nebo vícestránkové PDF)")
        self.merge.setChecked(cfg.get("merge_images", True))
        self.notes = QtWidgets.QPlainTextEdit(cfg.get("notes", ""))
        self.notes.setObjectName("DocText")
        self.notes.setPlaceholderText("Pokyny pro překlad – glosář, styl (Claude, Gemini, Ollama, OpenAI…)")
        self.notes.setMinimumHeight(110)
        self.start_btn = big_button("▶️", "Spustit", "Spustí překlad / převod všech souborů v seznamu", "BigPrimary")
        self.stop_btn = big_button("⏹️", "Zastavit", "Zastaví po dokončení rozpracovaného souboru")
        self.stop_btn.setEnabled(False)
        self.start_btn.clicked.connect(self.start)
        self.stop_btn.clicked.connect(self.cancel.set)
        b_out = big_button("📂", "Výstupní\nsložka", "Otevře složku s výsledky")
        b_out.clicked.connect(self.open_output)

        # ---------- pás karet
        mode_w = QtWidgets.QWidget()
        ml = QtWidgets.QVBoxLayout(mode_w)
        ml.setContentsMargins(0, 0, 0, 0)
        ml.addWidget(self.mode_translate)
        ml.addWidget(self.mode_convert)
        sel = RibbonGroup("Výběr")
        sel.grid.addWidget(self.b_selall, 0, 0)
        sel.grid.addWidget(self.b_remove, 1, 0)
        sel.grid.addWidget(self.files_info, 2, 0)
        add = RibbonGroup("Přidat")
        add.grid.addWidget(b_add, 0, 0)
        add.grid.addWidget(b_dir, 0, 1)
        files_tab = ribbon_row(add, sel)
        tr_tab = ribbon_row(
            ribbon_group("Režim", [("", mode_w)]),
            ribbon_group("Jazyk a formát", [("Cílový jazyk:", self.lang), ("Výstupní formát:", self.out_fmt)]),
            ribbon_group("Překladač", [("", self.engine), ("", self.status)]))
        ocr_tab = ribbon_row(
            ribbon_group("Text z obrázků a skenů (OCR)", [("Rozpoznávání:", self.ocr),
                                                          ("Jazyk originálu:", self.ocr_lang)]),
            ribbon_group("Obrázky", [("", self.merge)]))
        ribbon = QtWidgets.QTabWidget()
        ribbon.setObjectName("Ribbon")
        ribbon.setDocumentMode(True)
        ribbon.addTab(files_tab, "Soubory")
        ribbon.addTab(tr_tab, "Překlad")
        ribbon.addTab(ocr_tab, "Obrázky a OCR")
        ribbon.setCurrentIndex(1)
        self.ribbon = ribbon
        actions = RibbonGroup("Spustit")
        for i, b in enumerate((self.start_btn, self.stop_btn, b_out)):
            actions.grid.addWidget(b, 0, i)
        top = QtWidgets.QFrame()
        top.setObjectName("RibbonBar")
        tl = QtWidgets.QHBoxLayout(top)
        tl.setContentsMargins(0, 0, 8, 0)
        tl.addWidget(ribbon, 1)
        tl.addWidget(vline())
        tl.addWidget(actions)

        # ---------- stránka: soubory a pokyny
        canvas = paper_canvas([
            doc_heading("Soubory", "Přetáhněte sem soubory, nebo je přidejte na kartě Soubory. Pravé tlačítko "
                                   "a klávesa Delete fungují i v seznamu."),
            self.files,
            doc_heading("Pokyny pro překlad", "Nepovinné – glosář, jména, tykání/vykání, styl. Platí pro Claude, "
                                              "Gemini, Ollama a OpenAI-kompatibilní služby."),
            self.notes,
        ])

        # ---------- průběh a záznam dole
        bottom = self.work = WorkPanel()
        self.bar, self.logv = bottom.bar, bottom.logv
        self.view = view_group(win, "translate", bottom, canvas.paper, canvas.canvas_layout)
        ribbon.addTab(ribbon_row(self.view), "Zobrazení")
        split = QtWidgets.QSplitter(Qt.Vertical)
        split.setChildrenCollapsible(False)
        split.addWidget(canvas)
        split.addWidget(bottom)
        split.setStretchFactor(0, 5)
        split.setStretchFactor(1, 2)
        split.setSizes([560, 170])

        outer = QtWidgets.QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(0)
        outer.addWidget(top)
        outer.addWidget(split, 1)
        self.update_file_buttons()

        self.engine.currentIndexChanged.connect(self.refresh_status)
        self.ocr.currentIndexChanged.connect(self.refresh_status)
        self.refresh_status()

    def open_output(self):
        """Otevře výstupní složku (z Nastavení), jinak složku prvního souboru v seznamu."""
        d = self.win.cfg.get("out_dir") or (str(Path(self.files.files[0]).parent) if self.files.files else "")
        if d and Path(d).is_dir():
            QtGui.QDesktopServices.openUrl(QtCore.QUrl.fromLocalFile(d))
        else:
            QtWidgets.QMessageBox.information(self, "Výstupní složka", "Výsledky se ukládají vedle originálů. "
                                                                     "Nejdřív přidejte soubory, nebo nastavte "
                                                                     "výstupní složku v Nastavení → Obecné.")

    def pick(self):
        exts = " ".join(f"*{e}" for e in sorted(SUPPORTED_EXT))
        files, _ = QtWidgets.QFileDialog.getOpenFileNames(
            self, "Vyberte soubory (víc najednou: Ctrl+klik, Shift+klik nebo Ctrl+A)",
            self.win.cfg.get("last_dir", ""), f"Podporované soubory ({exts});;Vše (*.*)")
        if files:
            self.win.cfg["last_dir"] = str(Path(files[0]).parent)
            self._added(self.files.add(files))

    def pick_dir(self):
        d = QtWidgets.QFileDialog.getExistingDirectory(self, "Vyberte složku se soubory",
                                                       self.win.cfg.get("last_dir", ""))
        if d:
            self.win.cfg["last_dir"] = d
            n = self.files.add([d])
            self._added(n)
            if not n:
                self.logv.log(f"Ve složce {d} nejsou žádné podporované soubory (nebo už jsou v seznamu).")

    def _added(self, n: int):
        if self.files.skipped:
            self.logv.log("Nepodporovaný formát, přeskočeno: " + ", ".join(self.files.skipped))

    def remove_files(self):
        if self.files.all_selected():
            self.files.clear_all()
        else:
            self.files.remove_selected()

    def update_file_buttons(self):
        total, sel = self.files.count(), len(self.files.selectedItems())
        allsel = self.files.all_selected()
        self.b_remove.setText("🗑 Odebrat vše" if allsel and total > 1 else
                              f"➖ Odebrat vybrané ({sel})" if sel > 1 else "➖ Odebrat vybrané")
        self.b_remove.setEnabled(sel > 0)
        self.b_selall.setText("☐ Zrušit výběr" if allsel else "☑ Vybrat vše")
        self.b_selall.setEnabled(total > 0)
        word = "soubor" if total == 1 else "soubory" if 2 <= total <= 4 else "souborů"
        self.files_info.setText(f"{total} {word}" + (f", vybráno {sel}" if sel else "") if total else "")

    def files_menu(self, pos):
        m = QtWidgets.QMenu(self)
        m.addAction("➕ Přidat soubory…", self.pick)
        m.addAction("📁 Přidat složku…", self.pick_dir)
        m.addSeparator()
        m.addAction("Vybrat vše", self.files.selectAll, QtGui.QKeySequence.SelectAll).setEnabled(self.files.count() > 0)
        sel = self.files.selectedItems()
        m.addAction(self.b_remove.text(), self.remove_files, QtGui.QKeySequence.Delete).setEnabled(bool(sel))
        if len(sel) == 1:
            path = sel[0].data(Qt.UserRole)
            m.addSeparator()
            m.addAction("📂 Otevřít složku souboru",
                        lambda: QtGui.QDesktopServices.openUrl(QtCore.QUrl.fromLocalFile(str(Path(path).parent))))
        m.exec(self.files.viewport().mapToGlobal(pos))

    def refresh_status(self):
        cfg = self.win.cfg
        e = self.engine.currentData()
        ok, text = core.service_ready(cfg, core.service_of(e))
        if e == "microsoft_doc" and ok and not cfg["engines"].get("microsoft", {}).get("endpoint"):
            ok, text = False, "chybí adresa „Překlad dokumentu“ – otevřete Nastavení"
        o = self.ocr.currentData()
        if o == "tesseract" and not cfg["paths"].get("tesseract"):
            text += " · Tesseract nenalezen (Nastavení → Součásti)"
        elif o in ("gemini", "claude") and not core.service_ready(cfg, o)[0]:
            text += f" · OCR {o}: chybí klíč"
        set_status(self.status, ok, text)

    def remember(self):
        cfg = self.win.cfg
        cfg.update(mode="translate" if self.mode_translate.isChecked() else "convert",
                   lang=self.lang.currentText().strip() or "čeština", out_fmt=self.out_fmt.currentData(),
                   engine=self.engine.currentData(), ocr=self.ocr.currentData(),
                   ocr_lang=self.ocr_lang.currentText().strip(), merge_images=self.merge.isChecked(),
                   notes=self.notes.toPlainText().strip())
        self.win.save_cfg()

    def start(self):
        files = list(self.files.files)
        if not files:
            QtWidgets.QMessageBox.warning(self, core.APP_NAME, "Nejdřív přidejte soubory.")
            return
        self.remember()
        cfg = self.win.cfg
        translate = cfg["mode"] == "translate"
        if any(Path(f).suffix.lower() in DOC_ONLY_EXT for f in files) and (
                cfg["engine"] != "microsoft_doc" or not translate):
            QtWidgets.QMessageBox.warning(self, core.APP_NAME, "PPTX, XLSX a MD umí přeložit jen překladač "
                                                               "„Microsoft – překlad celých dokumentů“.")
            return
        self.cancel.clear()
        try:
            tr = core.build_translator(dict(cfg), translate,
                                       core.files_need_ocr(files, cfg["out_fmt"], translate, cfg["engine"]),
                                       self.logv.log, self.cancel)
        except Exception as ex:  # noqa: BLE001
            QtWidgets.QMessageBox.critical(self, core.APP_NAME, str(ex))
            return
        self.start_btn.setEnabled(False)
        self.stop_btn.setEnabled(True)
        self.bar.setValue(0)
        self.work.set_busy(True)

        def progress(f):
            bridge().later(lambda: self.bar.setValue(int(f * 1000)))

        def job():
            return core.run_jobs(files, translate, cfg["out_fmt"], tr, cfg.get("out_dir") or None,
                                 cfg["merge_images"], self.logv.log, progress,
                                 cfg["paths"].get("ebook_convert") or None, self.cancel)

        def done(res, err):
            self.start_btn.setEnabled(True)
            self.stop_btn.setEnabled(False)
            self.work.set_busy(False)
            if err:
                self.logv.log(f"Neočekávaná chyba: {err}")
            elif res:
                QtWidgets.QMessageBox.information(self, core.APP_NAME, f"Hotovo. Vytvořeno souborů: {len(res)}")

        run_bg(job, done)


# ================================================================== Napsat knihu
BOOK_SERVICES = {
    "Claude (placené, nejlepší kvalita)": "claude",
    "Google Gemini (bezplatná úroveň s limity)": "gemini",
    "OpenAI-kompatibilní (DeepSeek, OpenAI, Mistral, OpenRouter…)": "openai",
    "Ollama (zdarma, v počítači)": "ollama",
}


class BookPage(QtWidgets.QWidget):
    def __init__(self, win: "MainWindow"):
        super().__init__()
        self.win = win
        cfg = win.cfg
        self.project: dict | None = None
        self.path: Path | None = None
        self.cancel = threading.Event()
        self.busy = False
        self.editors = []

        ta_opts = win.cfg.setdefault("text_assist", {})
        # ---------- prvky (rozmístí je pás karet a stránka níže)
        self.cats: dict[str, QtWidgets.QComboBox] = {}
        for key, text, values in bo.CATEGORIES:
            cb = QtWidgets.QComboBox()
            cb.setEditable(True)
            cb.addItems([""] + values)
            cb.setMaxVisibleItems(25)
            cb.setMinimumWidth(190)
            cb.lineEdit().setPlaceholderText("(nevybráno)")
            cb.currentTextChanged.connect(self.on_category)
            self.cats[key] = cb
        self.extra = QtWidgets.QLineEdit()
        self.extra.setMinimumWidth(260)
        self.extra.setPlaceholderText("např. hodně dialogů, krátké kapitoly s napínavým koncem")
        self.mature = label("", "Warn")
        self.blang = QtWidgets.QComboBox()
        self.blang.setEditable(True)
        self.blang.addItems(core.LANGUAGES)
        self.blang.setCurrentText(cfg.get("lang", "čeština"))
        self.service = QtWidgets.QComboBox()
        for text, key in BOOK_SERVICES.items():
            self.service.addItem(text, key)
        self.service.setCurrentIndex(max(0, self.service.findData(cfg.get("book_service", "claude"))))
        self.model = QtWidgets.QComboBox()
        for text, mid in MODELS.items():
            self.model.addItem(text, mid)
        self.nchap = QtWidgets.QSpinBox()
        self.nchap.setRange(1, 60)
        self.nchap.setValue(int(cfg.get("book_chapters", 12)))
        self.nwords = QtWidgets.QSpinBox()
        self.nwords.setRange(500, 8000)
        self.nwords.setSingleStep(100)
        self.nwords.setValue(int(cfg.get("book_words", 2500)))
        self.svc_status = label("")  # zalamuje se, aby úzké okno nebylo širší než obrazovka
        self.est = label("", "Hint")
        self.fmts = {}
        for f in ("epub", "docx", "pdf", "azw3", "mobi", "odt", "rtf", "txt"):
            c = QtWidgets.QCheckBox(f.upper())
            c.setChecked(f in ("epub", "docx"))
            self.fmts[f] = c
        self.bdir = QtWidgets.QLineEdit(cfg.get("out_dir") or str(Path.home() / "Documents" / "Knihy"))
        self.bdir.setMinimumWidth(260)
        pick = QtWidgets.QPushButton("📁 Vybrat…")
        pick.clicked.connect(lambda: (d := QtWidgets.QFileDialog.getExistingDirectory(self, "Složka knih"))
                             and self.bdir.setText(d))

        def big(icon, text, tip, obj="BigAction"):
            b = QtWidgets.QToolButton()
            b.setObjectName(obj)
            b.setIcon(emoji_icon(icon))
            b.setIconSize(QtCore.QSize(28, 28))
            b.setText(text)
            b.setToolTip(tip)
            b.setToolButtonStyle(Qt.ToolButtonTextUnderIcon)
            b.setMinimumWidth(92)
            return b

        self.b_outline = big("🧭", "1. Navrhnout\nosnovu", "AI navrhne název, postavy a obsah kapitol", "BigPrimary")
        self.b_write = big("✍️", "2. Napsat\nknihu", "AI napíše knihu kapitolu po kapitole podle osnovy",
                           "BigPrimary")
        self.b_stop = big("⏹️", "Zastavit", "Zastaví psaní (rozepsaná kniha zůstane uložená)")
        self.b_edit = big("📖", "Upravit\nknihu", "Otevře editor ve stylu Wordu")
        self.b_load = big("📂", "Otevřít\nrozepsanou", "Pokračovat v rozepsané knize (*.kniha.json)")

        # ---------- pás karet
        def group(title, rows):
            g = RibbonGroup(title)
            for r, (text, w) in enumerate(rows):
                if text:
                    g.grid.addWidget(QtWidgets.QLabel(text), r, 0)
                    g.grid.addWidget(w, r, 1)
                else:
                    g.grid.addWidget(w, r, 0, 1, 2)
            g.grid.setHorizontalSpacing(6)
            g.grid.setVerticalSpacing(4)
            return g

        def ribbon_row(*groups):
            w = QtWidgets.QWidget()
            hl = QtWidgets.QHBoxLayout(w)
            hl.setContentsMargins(4, 6, 4, 2)
            hl.setSpacing(6)
            for i, g in enumerate(groups):
                if i:
                    hl.addWidget(vline())
                hl.addWidget(g)
            hl.addStretch(1)
            return HScroll(w)

        c = self.cats
        style_tab = ribbon_row(
            group("Žánr", [("Žánr:", c["genre"]), ("Pro koho:", c["audience"])]),
            group("Vyprávění", [("Vypravěč:", c["narrator"]), ("Tempo:", c["tempo"])]),
            group("Atmosféra", [("Tón:", c["tone"]), ("Prostředí:", c["setting"])]),
            group("Jazyk a přání", [("Jazyk:", c["language_style"]), ("Další přání:", self.extra)]))
        fmt_w = QtWidgets.QWidget()
        fg = QtWidgets.QGridLayout(fmt_w)
        fg.setContentsMargins(0, 0, 0, 0)
        for i, cb in enumerate(self.fmts.values()):
            fg.addWidget(cb, i // 4, i % 4)
        dir_w = QtWidgets.QWidget()
        dl = QtWidgets.QHBoxLayout(dir_w)
        dl.setContentsMargins(0, 0, 0, 0)
        dl.addWidget(self.bdir, 1)
        dl.addWidget(pick)
        scope_tab = ribbon_row(
            group("Kniha", [("Jazyk knihy:", self.blang), ("Kapitol:", self.nchap), ("Slov na kapitolu:", self.nwords)]),
            group("Umělá inteligence", [("Služba:", self.service), ("Model Claude:", self.model)]),
            group("Uložit jako", [("", fmt_w), ("Složka:", dir_w)]))
        # karta Soubor (jako ve Wordu): nová, otevřít, uložit, uložit jako, naposledy otevřené
        self.b_new = big("📄", "Nová\nkniha", "Začít novou knihu (Ctrl+N)")
        self.b_save = big("💾", "Uložit", "Uložit knihu – popis, žánr, rozsah i osnovu (Ctrl+S)")
        self.b_saveas = big("🗂️", "Uložit\njako…", "Uložit knihu pod jiným názvem nebo jinam (Ctrl+Shift+S)")
        self.b_load.setText("Otevřít…")
        self.b_load.setToolTip("Otevřít uloženou nebo rozepsanou knihu *.kniha.json (Ctrl+O)")
        filegrp = RibbonGroup("Soubor")
        for i, b in enumerate((self.b_new, self.b_load, self.b_save, self.b_saveas)):
            filegrp.grid.addWidget(b, 0, i)
        self.recent_grp = RibbonGroup("Naposledy otevřené")
        self.recent_grp.setMinimumWidth(320)
        self.path_info = label("", "Hint")
        self.path_info.setMaximumWidth(420)
        cur = RibbonGroup("Otevřená kniha")
        cur.grid.addWidget(self.path_info, 0, 0)
        file_tab = ribbon_row(filegrp, self.recent_grp, cur)
        ribbon = QtWidgets.QTabWidget()
        ribbon.setObjectName("Ribbon")
        ribbon.setDocumentMode(True)
        ribbon.addTab(file_tab, "Soubor")
        ribbon.addTab(style_tab, "Žánr a styl")
        ribbon.addTab(scope_tab, "Rozsah a služba")
        ribbon.setCurrentIndex(1)
        actions = RibbonGroup("Kniha")
        for i, b in enumerate((self.b_outline, self.b_write, self.b_stop, self.b_edit)):
            actions.grid.addWidget(b, 0, i)
        top = QtWidgets.QFrame()
        top.setObjectName("RibbonBar")
        tl = QtWidgets.QHBoxLayout(top)
        tl.setContentsMargins(0, 0, 8, 0)
        tl.addWidget(ribbon, 1)
        tl.addWidget(vline())
        tl.addWidget(actions)

        # informační řádek pod pásem (jako ve Wordu)
        info = QtWidgets.QFrame()
        info.setObjectName("InfoBar")
        il = QtWidgets.QHBoxLayout(info)
        il.setContentsMargins(14, 4, 14, 4)
        il.addWidget(self.svc_status, 1)
        il.addWidget(label("·", "Hint", wrap=False))
        il.addWidget(self.est, 1)
        il.addWidget(self.mature)

        # ---------- stránka s popisem a osnovou
        def heading(text, hint):
            w = QtWidgets.QWidget()
            v = QtWidgets.QVBoxLayout(w)
            v.setContentsMargins(0, 8, 0, 2)
            v.setSpacing(0)
            v.addWidget(label(text, "DocHeading", wrap=False))
            v.addWidget(label(hint, "Hint"))
            return w

        self.desc = QtWidgets.QPlainTextEdit()
        self.desc.setObjectName("DocText")
        self.desc.setPlaceholderText("O čem kniha je, hlavní postavy, prostředí, pro koho je, jak má skončit… "
                                     "(stačí kolem 20 vět)")
        self.desc.setMinimumHeight(220)
        self.desc_assist = TextAssist(self.desc, ta_opts, win.save_cfg)
        self.outline = QtWidgets.QPlainTextEdit()
        self.outline.setObjectName("DocText")
        self.outline.setPlaceholderText("Sem se vloží osnova po kliknutí na „1. Navrhnout osnovu“. "
                                        "Můžete ji upravit, přidat nebo ubrat kapitoly.")
        self.outline.setMinimumHeight(320)
        self.outline_assist = TextAssist(self.outline, ta_opts, win.save_cfg, extra_menu=self._outline_menu)
        for ed in (self.desc, self.outline):
            ed.setFont(QtGui.QFont("Georgia", 12))

        paper = QtWidgets.QFrame()
        paper.setObjectName("Paper")
        paper.setMaximumWidth(PAPER_WIDTH)
        pl = QtWidgets.QVBoxLayout(paper)
        pl.setContentsMargins(56, 36, 56, 40)
        pl.setSpacing(6)
        pl.addWidget(heading("Popis knihy", "O čem kniha je – stačí kolem 20 vět. Žánr a styl vyberte nahoře "
                                            "v pásu karet."))
        pl.addWidget(self.desc)
        pl.addSpacing(10)
        pl.addWidget(heading("Osnova", "Kapitoly ve tvaru „1. Název — obsah“. Vznikne tlačítkem "
                                       "„1. Navrhnout osnovu“ a můžete ji upravit. Délku jedné kapitoly "
                                       "změníte pravým tlačítkem na jejím řádku (v osnově pak „[4000 slov]“)."))
        pl.addWidget(self.outline)
        canvas = QtWidgets.QWidget()
        canvas.setObjectName("Canvas")
        cl = QtWidgets.QHBoxLayout(canvas)
        cl.setContentsMargins(24, 20, 24, 24)
        cl.addStretch(1)
        cl.addWidget(paper, 30)
        cl.addStretch(1)
        scroll = QtWidgets.QScrollArea()
        scroll.setObjectName("CanvasScroll")
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        scroll.setWidget(canvas)

        # ---------- průběh a záznam dole
        bottom = self.work = WorkPanel()
        self.bar, self.logv = bottom.bar, bottom.logv
        self.view = view_group(win, "book", bottom, paper, cl)
        ribbon.addTab(ribbon_row(self.view), "Zobrazení")
        split = QtWidgets.QSplitter(Qt.Vertical)
        split.setChildrenCollapsible(False)
        split.addWidget(scroll)
        split.addWidget(bottom)
        split.setStretchFactor(0, 5)
        split.setStretchFactor(1, 1)
        split.setSizes([640, 100])

        outer = QtWidgets.QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(0)
        outer.addWidget(top)
        outer.addWidget(info)
        outer.addWidget(split, 1)

        self.b_outline.clicked.connect(self.do_outline)
        self.b_write.clicked.connect(self.do_write)
        self.b_stop.clicked.connect(self.cancel.set)
        self.b_edit.clicked.connect(self.open_editor)
        self.b_load.clicked.connect(self.do_load)
        self.b_new.clicked.connect(self.new_book)
        self.b_save.clicked.connect(lambda: self.save_book(False))
        self.b_saveas.clicked.connect(lambda: self.save_book(True))
        for seq, fn in (("Ctrl+S", lambda: self.save_book(False)), ("Ctrl+Shift+S", lambda: self.save_book(True)),
                        ("Ctrl+O", self.do_load), ("Ctrl+N", self.new_book)):
            sc = QtGui.QShortcut(QtGui.QKeySequence(seq), self, activated=fn)
            sc.setContext(Qt.WidgetWithChildrenShortcut)  # jen na stránce Napsat knihu
        self.rebuild_recent()
        self.update_path_info()
        self.outline.textChanged.connect(self.update_buttons)
        for sig in (self.service.currentIndexChanged, self.model.currentIndexChanged, self.nchap.valueChanged,
                    self.nwords.valueChanged):
            sig.connect(self.on_service)
        for ed in (self.nchap, self.nwords):
            ed.editingFinished.connect(self.remember_scope)
            ed.valueChanged.connect(lambda *_: self._scope_timer.start())
        self._scope_timer = QtCore.QTimer(self)  # uložit až chvíli po poslední změně, ne při každém kliknutí
        self._scope_timer.setSingleShot(True)
        self._scope_timer.setInterval(800)
        self._scope_timer.timeout.connect(self.remember_scope)
        self.on_service()
        self.update_buttons()

    # --------------------------------------------------------------- pomocné
    def parts(self) -> dict:
        return {k: cb.currentText() for k, cb in self.cats.items()}

    def full_style(self) -> str:
        return bo.compose_style(self.parts(), self.extra.text())

    def on_category(self, *_):
        self.mature.setText(bo.MATURE_NOTE if bo.is_mature(self.parts()) else "")

    def writer(self) -> bw.BookWriter:
        cfg = self.win.cfg
        svc = self.service.currentData()
        language = self.blang.currentText().strip() or "čeština"
        if svc == "claude":
            c = cfg["engines"].get("claude", {})
            key = c.get("api_key") or os.environ.get("ANTHROPIC_API_KEY")
            if not key:
                raise EngineError("Chybí Claude API klíč – zadejte ho v Nastavení (je tam i Návod).")
            backend = bw.ClaudeBackend(key, self.model.currentData(), language, self.logv.log, self.cancel)
        else:
            eng = core.make_engine(svc, language, cfg["engines"].get(svc, {}), "")
            backend = bw.EngineBackend(eng, self.cancel)
        return bw.BookWriter(backend, language, self.logv.log)

    def _outline_menu(self, menu: QtWidgets.QMenu, cursor: QtGui.QTextCursor):
        """Pravé tlačítko na řádku kapitoly v osnově: délka jen této kapitoly."""
        block = cursor.block()
        line = block.text()
        if not bw.CHAPTER_LINE_RE.match(line) or "KAPITOLY:" not in self.outline.toPlainText()[:cursor.position()]:
            return
        title, words = bw.split_words(bw.CHAPTER_LINE_RE.match(line).group(2))
        menu.addAction(f"📏 Délka kapitoly „{title[:30]}“…", lambda: self.ask_chapter_words(block, words))
        if words:
            menu.addAction("Použít výchozí délku (Slov na kapitolu)",
                           lambda: self.set_chapter_words(block, None))

    def ask_chapter_words(self, block: QtGui.QTextBlock, current: int | None):
        n, ok = QtWidgets.QInputDialog.getInt(
            self, "Délka kapitoly", "Kolik slov má mít tato kapitola?\n"
            "(ostatní kapitoly mají výchozí délku z „Slov na kapitolu“)",
            current or self.nwords.value(), 100, 20000, 100)
        if ok:
            self.set_chapter_words(block, n)

    def set_chapter_words(self, block: QtGui.QTextBlock, words: int | None):
        new = bw.set_line_words(block.text(), words)
        if new is None:
            return
        c = QtGui.QTextCursor(block)
        c.movePosition(QtGui.QTextCursor.StartOfBlock)
        c.movePosition(QtGui.QTextCursor.EndOfBlock, QtGui.QTextCursor.KeepAnchor)
        c.insertText(new)

    def remember_scope(self, *_):
        """Počet kapitol a délka kapitoly zůstanou nastavené i po zavření programu."""
        cfg = self.win.cfg
        if (cfg.get("book_chapters"), cfg.get("book_words")) != (self.nchap.value(), self.nwords.value()):
            cfg["book_chapters"], cfg["book_words"] = self.nchap.value(), self.nwords.value()
            self.win.save_cfg()

    def on_service(self, *_):
        cfg = self.win.cfg
        svc = self.service.currentData()
        self.model.setEnabled(svc == "claude")
        ok, text = core.service_ready(cfg, svc)
        sect = cfg["engines"].get(svc, {})
        model = self.model.currentData() if svc == "claude" else (sect.get("model") or {
            "gemini": GeminiEngine.DEFAULT_MODEL, "ollama": OllamaEngine.DEFAULT_MODEL}.get(svc, "?"))
        set_status(self.svc_status, ok, f"{text} · model: {model}")
        try:
            self.est.setText(self.writer().estimate(self.nchap.value(), self.nwords.value()))
        except Exception as e:  # noqa: BLE001
            self.est.setText(str(e))

    def update_buttons(self):
        has_outline = bool(self.outline.toPlainText().strip())
        has_text = bool(self.project and self.project["chapters"])
        self.b_outline.setEnabled(not self.busy)
        self.b_write.setEnabled(not self.busy and has_outline)
        if self.path and self.open_editor_for(self.path):
            self.b_write.setToolTip("Kniha je otevřená v editoru – nejdřív ho zavřete.")
        else:
            self.b_write.setToolTip("")
        self.b_stop.setEnabled(self.busy)
        self.b_load.setEnabled(not self.busy)
        for b in (self.b_new, self.b_save, self.b_saveas):
            b.setEnabled(not self.busy)
        self.b_edit.setEnabled(not self.busy and has_text)

    def set_busy(self, on: bool):
        self.busy = on
        self.work.set_busy(on)
        self.update_buttons()

    def book_dir(self) -> Path:
        d = Path(self.bdir.text().strip() or Path.home() / "Documents" / "Knihy")
        d.mkdir(parents=True, exist_ok=True)
        return d

    def new_project(self, outline: dict):
        proj = {"description": self.desc.toPlainText().strip(), "style": self.full_style(),
                "style_parts": self.parts(), "style_extra": self.extra.text().strip(),
                "language": self.blang.currentText().strip() or "čeština", "service": self.service.currentData(),
                "model": self.model.currentData(), "words": self.nwords.value(), "outline": outline, "chapters": []}
        if self.project is not None and self.path and not self.project.get("chapters"):
            path = self.path  # kniha už je uložená (zatím bez kapitol) – osnova do stejného souboru
        else:
            path = self.book_dir() / (bw.safe_name(outline["title"]) + bw.PROJECT_SUFFIX)
            n = 2
            while path.exists():
                path = self.book_dir() / f"{bw.safe_name(outline['title'])} ({n}){bw.PROJECT_SUFFIX}"
                n += 1
        self.project, self.path = proj, path
        bw.save_project(path, proj)
        self.remember_recent(path)
        self.update_path_info()
        self.logv.log(f"Osnova uložena: {path}")

    # ------------------------------------------------------------------ akce
    def do_outline(self):
        text = self.desc.toPlainText().strip()
        if len(text) < 30:
            QtWidgets.QMessageBox.warning(self, "Napsat knihu", "Napište popis knihy (aspoň pár vět).")
            return
        try:
            wr = self.writer()
        except Exception as e:  # noqa: BLE001
            QtWidgets.QMessageBox.critical(self, "Napsat knihu", str(e))
            return
        self.cancel.clear()
        self.set_busy(True)
        style = self.full_style()

        def done(o, err):
            self.set_busy(False)
            if err:
                self.logv.log(f"✗ {err}")
                return
            self.outline.setPlainText(bw.outline_to_text(o))
            try:
                self.new_project(o)
            except Exception as e:  # noqa: BLE001
                self.logv.log(f"! Osnovu se nepodařilo uložit: {e}")
            self.update_buttons()
            self.logv.log("✓ Osnova je hotová. Projděte ji, případně upravte, a klikněte na „2. Napsat knihu“.")

        run_bg(lambda: wr.make_outline(text, self.nchap.value(), self.nwords.value(), style), done)

    def do_write(self):
        try:
            outline = bw.text_to_outline(self.outline.toPlainText())
        except bw.BookError as e:
            QtWidgets.QMessageBox.critical(self, "Napsat knihu", str(e))
            return
        formats = [f for f, c in self.fmts.items() if c.isChecked()] or ["docx"]
        if self.path and self.open_editor_for(self.path):
            QtWidgets.QMessageBox.warning(
                self, "Napsat knihu", "Kniha je otevřená v editoru. Nejdřív editor uložte a zavřete – "
                                      "jinak by se psaní AI a vaše úpravy navzájem přepsaly.")
            return
        proj = self.project
        if proj is None:
            self.new_project(outline)
        elif proj["outline"] != outline:
            done = len(proj["chapters"])
            if not done:
                proj.update(outline=outline, words=self.nwords.value(), style=self.full_style(),
                            style_parts=self.parts(), style_extra=self.extra.text().strip(),
                            description=self.desc.toPlainText().strip(),
                            language=self.blang.currentText().strip() or "čeština")
                bw.save_project(self.path, proj)
            else:
                old = proj["outline"]["chapters"]

                def key(c):
                    return c["title"].strip(), c.get("summary", "").strip()

                same = done <= len(outline["chapters"]) and all(
                    key(old[i]) == key(outline["chapters"][i]) for i in range(done))
                if not same:  # změnila se už napsaná kapitola
                    box = QtWidgets.QMessageBox(self)
                    box.setWindowTitle("Napsat knihu")
                    box.setIcon(QtWidgets.QMessageBox.Icon.Question)
                    box.setText(f"V osnově jste změnil(a) i kapitoly, které už jsou napsané ({done}).")
                    box.setInformativeText("Napsané kapitoly můžete ponechat a pokračovat dál, nebo začít psát "
                                           "celou knihu znovu (jako nový soubor – původní zůstane).")
                    keep = box.addButton("Ponechat napsané a pokračovat", QtWidgets.QMessageBox.AcceptRole)
                    restart = box.addButton("Začít znovu od 1. kapitoly", QtWidgets.QMessageBox.DestructiveRole)
                    box.addButton("Zrušit", QtWidgets.QMessageBox.RejectRole)
                    box.setDefaultButton(keep)
                    box.exec()
                    if box.clickedButton() is restart:
                        self.new_project(outline)
                    elif box.clickedButton() is not keep:
                        return
                if self.project is proj:
                    proj["outline"] = outline
                    bw.save_project(self.path, proj)
                    self.logv.log(f"Osnova upravena – {done} napsaných kapitol zůstává, pokračuje se "
                                  f"kapitolou {done + 1}.")
                    if done >= len(outline["chapters"]):
                        QtWidgets.QMessageBox.information(
                            self, "Napsat knihu", "Všechny kapitoly z osnovy už jsou napsané. Pro další "
                                                  "kapitoly je přidejte na konec osnovy.")
                        return
        proj, path = self.project, self.path
        n = len(outline["chapters"])
        if n != self.nchap.value() and not proj["chapters"]:
            ans = QtWidgets.QMessageBox.question(
                self, "Napsat knihu",
                f"Osnova má {n} kapitol, ale v „Rozsah a služba“ je nastaveno {self.nchap.value()}.\n\n"
                "Počet kapitol určuje osnova. Pokračovat s osnovou tak, jak je?\n\n"
                "(Pro jiný počet klikněte na Ne a nechte znovu „1. Navrhnout osnovu“, nebo kapitoly "
                "v osnově přidejte či smažte.)")
            if ans != QtWidgets.QMessageBox.Yes:
                return
        if int(proj.get("words", 0)) != self.nwords.value():  # délku kapitoly jde změnit i po návrhu osnovy
            old_words = proj.get("words")
            proj["words"] = self.nwords.value()
            bw.save_project(path, proj)
            self.logv.log(f"Délka kapitoly změněna z {old_words} na {proj['words']} slov"
                          + (" (platí pro kapitoly, které se teprve napíšou)." if proj["chapters"] else "."))
        try:
            wr = self.writer()
            estimate = wr.estimate(n, bw.total_words(proj) // n)
        except Exception as e:  # noqa: BLE001
            QtWidgets.QMessageBox.critical(self, "Napsat knihu", str(e))
            return
        self.win.cfg["book_service"] = self.service.currentData()
        self.win.save_cfg()
        if QtWidgets.QMessageBox.question(
                self, "Napsat knihu", f"Napsat {n - len(proj['chapters'])} kapitol?\n\n{estimate}\n\n"
                                      f"Rozepsaná kniha se průběžně ukládá do:\n{path}") != QtWidgets.QMessageBox.Yes:
            return
        self.cancel.clear()
        self.set_busy(True)
        self.bar.setValue(int(len(proj["chapters"]) / n * 1000))
        ebook_convert = self.win.cfg["paths"].get("ebook_convert") or None

        def job():
            try:
                wr.write(proj, path, lambda f: bridge().later(lambda: self.bar.setValue(int(f * 1000))))
            except Cancelled:
                return "stopped"
            return bw.export(proj, path.parent, formats, self.logv.log, ebook_convert)

        def done(files, err):
            self.set_busy(False)
            self.logv.log(wr.backend.cost_summary())
            if err:
                self.logv.log(f"✗ {err}")
                return
            if files == "stopped":
                self.logv.log("Zastaveno. Rozepsaná kniha je uložená – pokračujte tlačítkem „2. Napsat knihu“ "
                              "nebo později přes Soubor → Otevřít.")
                return
            for f in files:
                self.logv.log(f"✓ Uloženo: {f}")
            if QtWidgets.QMessageBox.question(self, "Napsat knihu", "Kniha je hotová.\n\n" + "\n".join(files)
                                              + "\n\nOtevřít ji v editoru?") == QtWidgets.QMessageBox.Yes:
                self.open_editor()

        run_bg(job, done)

    def do_load(self):
        f, _ = QtWidgets.QFileDialog.getOpenFileName(self, "Otevřít knihu", str(self.book_dir()),
                                                     f"Kniha (*{bw.PROJECT_SUFFIX});;Vše (*.*)")
        if f:
            self.load_path(f)

    def load_path(self, f) -> bool:
        if self.busy:
            return False
        try:
            proj = bw.load_project(f)
        except Exception as e:  # noqa: BLE001
            QtWidgets.QMessageBox.critical(self, "Otevřít knihu", f"Knihu se nepodařilo otevřít:\n{e}")
            self.forget_recent(f)
            return False
        self.project, self.path = proj, Path(f)
        self.desc.setPlainText(proj.get("description", ""))
        parts = proj.get("style_parts") or {}
        for key, cb in self.cats.items():
            cb.setCurrentText(parts.get(key, ""))
        self.extra.setText(proj.get("style_extra", "") if parts else proj.get("style", ""))
        self.blang.setCurrentText(proj.get("language", "čeština"))
        self.nwords.setValue(int(proj.get("words", 2500)))
        n = len(proj["outline"].get("chapters", []))
        if n:
            self.nchap.setValue(n)
        i = self.model.findData(proj.get("model"))
        if i >= 0:
            self.model.setCurrentIndex(i)
        i = self.service.findData(proj.get("service", "claude"))
        if i >= 0:
            self.service.setCurrentIndex(i)
        self.bdir.setText(str(Path(f).parent))
        # rozpracovaná (i neúplná) osnova se ukládá jako text, aby se úpravy neztratily
        self.outline.setPlainText(proj.get("outline_text") or (bw.outline_to_text(proj["outline"]) if n else ""))
        self.remember_recent(f)
        self.update_buttons()
        self.update_path_info()
        self.logv.log(f"Otevřeno: {f} – napsáno {len(proj['chapters'])} z {n} kapitol.")
        return True

    def new_book(self):
        if self.busy:
            return
        has = self.desc.toPlainText().strip() or self.outline.toPlainText().strip()
        if has and QtWidgets.QMessageBox.question(
                self, "Nová kniha", "Začít novou knihu?\n\nPopis a osnova se vyprázdní. Pokud je chcete "
                                    "zachovat, nejdřív klikněte na Uložit.") != QtWidgets.QMessageBox.Yes:
            return
        self.project, self.path = None, None
        self.desc.clear()
        self.outline.clear()
        for cb in self.cats.values():
            cb.setCurrentText("")
        self.extra.clear()
        self.bar.setValue(0)
        self.update_buttons()
        self.update_path_info()
        self.desc.setFocus()

    def gather_project(self) -> dict:
        """Projekt podle toho, co je právě v okně (popis, žánr, rozsah, služba, osnova)."""
        proj = dict(self.project) if self.project else {"chapters": [],
                                                        "outline": {"title": "", "synopsis": "", "characters": [],
                                                                    "chapters": []}}
        proj.update(description=self.desc.toPlainText().strip(), style=self.full_style(),
                    style_parts=self.parts(), style_extra=self.extra.text().strip(),
                    language=self.blang.currentText().strip() or "čeština", service=self.service.currentData(),
                    model=self.model.currentData(), words=self.nwords.value())
        text = self.outline.toPlainText()
        proj["outline_text"] = text
        try:
            outline = bw.text_to_outline(text)
        except bw.BookError:
            outline = None
        done = len(proj.get("chapters", []))
        if outline and (not done or (done <= len(outline["chapters"]) and all(
                (outline["chapters"][i]["title"], outline["chapters"][i]["summary"]) ==
                (proj["outline"]["chapters"][i]["title"], proj["outline"]["chapters"][i].get("summary", ""))
                for i in range(done)))):
            proj["outline"] = outline
        return proj

    def save_book(self, as_new: bool = False) -> bool:
        if self.busy:
            return False
        proj = self.gather_project()
        path = self.path
        if as_new or path is None:
            title = proj["outline"].get("title") or "Nová kniha"
            start = str((Path(path).parent if path else self.book_dir()) / (bw.safe_name(title) + bw.PROJECT_SUFFIX))
            f, _ = QtWidgets.QFileDialog.getSaveFileName(self, "Uložit knihu jako", start,
                                                         f"Kniha (*{bw.PROJECT_SUFFIX})")
            if not f:
                return False
            if not f.endswith(bw.PROJECT_SUFFIX):  # „Kniha“, „Kniha.kniha“ i „Kniha.json“ → „Kniha.kniha.json“
                for ext in (".json", ".kniha"):
                    if f.endswith(ext):
                        f = f[:-len(ext)]
                f += bw.PROJECT_SUFFIX
            path = Path(f)
        try:
            bw.save_project(path, proj)
        except OSError as e:
            QtWidgets.QMessageBox.critical(self, "Uložit knihu", f"Knihu se nepodařilo uložit:\n{e}")
            return False
        self.project, self.path = proj, path
        self.remember_recent(path)
        self.update_path_info()
        self.update_buttons()
        self.logv.log(f"💾 Uloženo: {path}")
        return True

    # ------------------------------------------------- naposledy otevřené
    def remember_recent(self, path):
        lst = [p for p in self.win.cfg.get("recent_books", []) if Path(p) != Path(path)]
        self.win.cfg["recent_books"] = ([str(path)] + lst)[:8]
        self.win.save_cfg()
        self.rebuild_recent()

    def forget_recent(self, path):
        self.win.cfg["recent_books"] = [p for p in self.win.cfg.get("recent_books", []) if Path(p) != Path(path)]
        self.win.save_cfg()
        self.rebuild_recent()

    def rebuild_recent(self):
        grid = self.recent_grp.grid
        while grid.count():
            w = grid.takeAt(0).widget()
            if w:
                w.deleteLater()
        recent = [p for p in self.win.cfg.get("recent_books", []) if Path(p).exists()][:6]
        if not recent:
            grid.addWidget(label("Zatím žádné – uložené a otevřené knihy se objeví tady.", "Hint"), 0, 0)
            return
        for i, p in enumerate(recent):
            b = QtWidgets.QToolButton()
            b.setObjectName("RecentBook")
            name = Path(p).name[:-len(bw.PROJECT_SUFFIX)] if p.endswith(bw.PROJECT_SUFFIX) else Path(p).name
            b.setText("📘 " + (name if len(name) <= 34 else name[:33] + "…"))
            b.setToolTip(p)
            b.setToolButtonStyle(Qt.ToolButtonTextOnly)
            b.setSizePolicy(QtWidgets.QSizePolicy.Expanding, QtWidgets.QSizePolicy.Fixed)
            b.clicked.connect(lambda _=False, p=p: self.load_path(p))
            grid.addWidget(b, i % 3, i // 3)

    def update_path_info(self):
        if self.path:
            done = len(self.project.get("chapters", [])) if self.project else 0
            total = len(self.project["outline"].get("chapters", [])) if self.project else 0
            self.path_info.setText(f"<b>{Path(self.path).name}</b><br>{Path(self.path).parent}<br>"
                                   f"napsáno {done} z {total} kapitol")
        else:
            self.path_info.setText("Nová, zatím neuložená kniha.<br>Uloží se sama po návrhu osnovy, "
                                   "nebo klikněte na Uložit.")

    def open_editor_for(self, path):
        """Otevřený editor této knihy (nebo None)."""
        ed = self.win.editor
        return ed if ed is not None and path and ed.path == Path(path) else None

    def open_editor(self):
        from qt_editor import BookEditor

        if not self.project or not self.project["chapters"]:
            QtWidgets.QMessageBox.information(self, "Upravit knihu", "Kniha zatím nemá napsanou žádnou kapitolu.")
            return
        if self.open_editor_for(self.path):
            self.win.show_editor(self.open_editor_for(self.path))
            return
        if self.win.editor is not None and not self.win.close_editor():
            return  # jiná kniha v editoru a uživatel zavření zrušil
        ed = BookEditor(self.project, self.path, self.win.cfg["paths"].get("ebook_convert") or None,
                        autosave=self.win.cfg.get("autosave"),
                        text_assist=self.win.cfg.setdefault("text_assist", {}), save_options=self.win.save_cfg)
        self.win.show_editor(ed)
        self.update_buttons()


# ===================================================================== Nastavení
class SettingsPage(QtWidgets.QWidget):
    def __init__(self, win: "MainWindow"):
        super().__init__()
        self.win = win
        cfg = win.cfg
        lay = QtWidgets.QVBoxLayout(self)
        # nadpis a tlačítko Uložit nahoře – na menší obrazovce tak nezmizí pod lištou Windows
        head = QtWidgets.QHBoxLayout()
        head.addWidget(h_title("Nastavení"))
        head.addSpacing(16)
        head.addWidget(label("Klíče se ukládají zašifrovaně (Windows DPAPI) jen pro váš účet ve Windows.", "Hint"),
                       1)
        self.save_btn = primary("💾 Uložit nastavení")
        self.save_btn.setToolTip("Ctrl+S")
        self.save_btn.clicked.connect(self.save)
        head.addWidget(self.save_btn)
        lay.addLayout(head)
        tabs = QtWidgets.QTabWidget()
        lay.addWidget(tabs, 1)
        tabs.addTab(self._services_tab(cfg), "Služby a klíče")
        tabs.addTab(scrolled(self._components_tab(cfg)), "Součásti")
        tabs.addTab(scrolled(self._general_tab(cfg)), "Obecné")
        tabs.addTab(self._info_tab(cfg), "Info")
        sc = QtGui.QShortcut(QtGui.QKeySequence("Ctrl+S"), self, activated=self.save)
        sc.setContext(Qt.WidgetWithChildrenShortcut)

    def _services_tab(self, cfg) -> QtWidgets.QWidget:
        scroll = QtWidgets.QScrollArea()
        scroll.setWidgetResizable(True)
        inner = QtWidgets.QWidget()
        lay = QtWidgets.QVBoxLayout(inner)
        self.fields: dict[str, dict[str, QtWidgets.QWidget]] = {}
        for name, (title, fields) in core.SERVICES.items():
            box = QtWidgets.QGroupBox(title)
            g = QtWidgets.QGridLayout(box)
            help_text, url = core.SERVICE_HELP[name]
            g.addWidget(label(help_text, "Hint"), 0, 0, 1, 2)
            self.fields[name] = {}
            r = 1
            for key, text, secret, default, choices in fields:
                val = cfg["engines"].get(name, {}).get(key) or default
                if choices == "claude_models":
                    w = QtWidgets.QComboBox()
                    for t, mid in MODELS.items():
                        w.addItem(t, mid)
                    w.setCurrentIndex(max(0, w.findData(val or DEFAULT_MODEL)))
                else:
                    w = QtWidgets.QLineEdit(val)
                    if secret:
                        w.setEchoMode(QtWidgets.QLineEdit.Password)
                        act = w.addAction(emoji_icon("👁"), QtWidgets.QLineEdit.TrailingPosition)
                        act.setToolTip("Zobrazit / skrýt")
                        act.triggered.connect(lambda _c=False, e=w: e.setEchoMode(
                            QtWidgets.QLineEdit.Normal if e.echoMode() == QtWidgets.QLineEdit.Password
                            else QtWidgets.QLineEdit.Password))
                g.addWidget(QtWidgets.QLabel(text + ":"), r, 0)
                g.addWidget(w, r, 1)
                self.fields[name][key] = w
                r += 1
            btns = QtWidgets.QHBoxLayout()
            gb = QtWidgets.QPushButton("📘 Návod")
            gb.clicked.connect(lambda _c=False, n=name: self.show_guide(n))
            btns.addWidget(gb)
            if url:
                wb = QtWidgets.QPushButton("🌐 Získat klíč / web")
                wb.clicked.connect(lambda _c=False, u=url: webbrowser.open(u))
                btns.addWidget(wb)
            tb = QtWidgets.QPushButton("✔ Otestovat")
            tb.clicked.connect(lambda _c=False, n=name, b=tb: self.test(n, b))
            btns.addWidget(tb)
            btns.addStretch(1)
            g.addLayout(btns, r, 0, 1, 2)
            g.setColumnStretch(1, 1)
            lay.addWidget(box)
        lay.addStretch(1)
        scroll.setWidget(inner)
        return scroll

    def collect(self):
        cfg = self.win.cfg
        for name, ws in self.fields.items():
            sect = cfg["engines"].setdefault(name, {})
            for key, w in ws.items():
                sect[key] = w.currentData() if isinstance(w, QtWidgets.QComboBox) else w.text().strip()

    def show_guide(self, name):
        d = QtWidgets.QDialog(self)
        d.setWindowTitle(f"Návod – {core.SERVICES[name][0]}")
        d.resize(760, 520)
        lay = QtWidgets.QVBoxLayout(d)
        t = QtWidgets.QPlainTextEdit(GUIDES.get(name, "Návod není k dispozici."))
        t.setReadOnly(True)
        lay.addWidget(t)
        b = QtWidgets.QPushButton("Zavřít")
        b.clicked.connect(d.accept)
        lay.addWidget(b, 0, Qt.AlignRight)
        d.exec()

    def test(self, name, btn):
        self.collect()
        btn.setEnabled(False)
        btn.setText("Testuji…")
        lang = self.win.cfg.get("lang", "čeština")

        def done(res, err):
            btn.setEnabled(True)
            btn.setText("✔ Otestovat")
            title = f"Test – {core.SERVICES[name][0]}"
            if err:
                QtWidgets.QMessageBox.critical(self, title, str(err))
            else:
                QtWidgets.QMessageBox.information(self, title, f"Funguje ✓\n\n{res}")

        run_bg(lambda: core.test_service(name, self.win.cfg, lang), done)

    def _components_tab(self, cfg) -> QtWidgets.QWidget:
        w = QtWidgets.QWidget()
        lay = QtWidgets.QVBoxLayout(w)
        cal = QtWidgets.QGroupBox("Calibre – převody e-knih (AZW3, KFX, MOBI, RTF…)")
        cg = QtWidgets.QGridLayout(cal)
        self.cal_status = label("Zjišťuji…")
        self.cal_path = QtWidgets.QLineEdit(cfg["paths"].get("ebook_convert", ""))
        cg.addWidget(self.cal_status, 0, 0, 1, 3)
        cg.addWidget(QtWidgets.QLabel("ebook-convert.exe:"), 1, 0)
        cg.addWidget(self.cal_path, 1, 1)
        b = QtWidgets.QPushButton("Najít…")
        b.clicked.connect(lambda: self.pick_exe(self.cal_path, "ebook-convert"))
        cg.addWidget(b, 1, 2)
        row = QtWidgets.QHBoxLayout()
        kfx = QtWidgets.QPushButton("Nainstalovat plugin KFX Input")
        kfx.clicked.connect(self.install_kfx)
        web = QtWidgets.QPushButton("🌐 Web Calibre")
        web.clicked.connect(lambda: webbrowser.open(core.CALIBRE_URL))
        row.addWidget(kfx)
        row.addWidget(web)
        row.addStretch(1)
        cg.addLayout(row, 2, 0, 1, 3)
        lay.addWidget(cal)

        tes = QtWidgets.QGroupBox("Tesseract – čtení textu z obrázků a skenů (OCR)")
        tg = QtWidgets.QGridLayout(tes)
        self.tes_status = label("Zjišťuji…")
        self.tes_path = QtWidgets.QLineEdit(cfg["paths"].get("tesseract", ""))
        tg.addWidget(self.tes_status, 0, 0, 1, 3)
        tg.addWidget(QtWidgets.QLabel("tesseract.exe:"), 1, 0)
        tg.addWidget(self.tes_path, 1, 1)
        b = QtWidgets.QPushButton("Najít…")
        b.clicked.connect(lambda: self.pick_exe(self.tes_path, "tesseract"))
        tg.addWidget(b, 1, 2)
        lay.addWidget(tes)

        langs = QtWidgets.QGroupBox("Jazyky pro OCR (stáhnou se do složky programu; chybějící i automaticky)")
        lg = QtWidgets.QGridLayout(langs)
        self.lang_checks = {}
        for i, (code, name) in enumerate(components.OCR_LANGUAGES.items()):
            c = QtWidgets.QCheckBox(f"{name} ({code})")
            self.lang_checks[code] = c
            lg.addWidget(c, i // 4, i % 4)
        dl = QtWidgets.QPushButton("Stáhnout zaškrtnuté jazyky")
        dl.clicked.connect(self.download_langs)
        lg.addWidget(dl, 99, 0, 1, 2)
        lay.addWidget(langs)

        import offline_mt

        off = QtWidgets.QGroupBox("Offline překlad – v počítači, bez internetu (Argos Translate)")
        og = QtWidgets.QGridLayout(off)
        og.addWidget(label("Zdarma a bez odesílání textu. Kvalita je nižší než u DeepL nebo Google. Každý balíček má "
                           "kolem 100 MB. Když přímý pár chybí, překládá se přes angličtinu (např. němčina → "
                           "angličtina → čeština) – stačí balíčky „… → angličtina“ a „angličtina → čeština“.", "Hint"),
                     0, 0, 1, 4)
        self.off_checks = {}
        for i, (a, b) in enumerate(OFFLINE_PAIRS):
            c = QtWidgets.QCheckBox(f"{offline_mt.LANG_NAMES[a]} → {offline_mt.LANG_NAMES[b]}")
            c.setChecked((a, b) in offline_mt.RECOMMENDED and (a, b) not in offline_mt.installed())
            self.off_checks[(a, b)] = c
            og.addWidget(c, 1 + i // 4, i % 4)
        self.off_status = label("", wrap=False)
        og.addWidget(self.off_status, 90, 0, 1, 4)
        bdl = QtWidgets.QPushButton("⬇ Stáhnout zaškrtnuté balíčky")
        bdl.clicked.connect(self.download_offline)
        brm = QtWidgets.QPushButton("🗑 Odebrat zaškrtnuté")
        brm.clicked.connect(self.remove_offline)
        og.addWidget(bdl, 99, 0, 1, 2)
        og.addWidget(brm, 99, 2)
        lay.addWidget(off)
        self.refresh_offline()
        self.comp_log = LogView()
        self.comp_log.setMaximumHeight(140)
        lay.addWidget(self.comp_log)
        lay.addStretch(1)
        QtCore.QTimer.singleShot(300, self.refresh_components)
        return w

    def refresh_offline(self):
        import offline_mt

        have = offline_mt.installed()
        for (a, b), c in self.off_checks.items():
            c.setText(f"{offline_mt.LANG_NAMES[a]} → {offline_mt.LANG_NAMES[b]}" + (" ✓" if (a, b) in have else ""))
        set_status(self.off_status, bool(have),
                   ("nainstalováno: " + ", ".join(f"{offline_mt.LANG_NAMES.get(a, a)} → "
                                                  f"{offline_mt.LANG_NAMES.get(b, b)}" for a, b in sorted(have)))
                   if have else "zatím žádný balíček – zaškrtněte a stáhněte")
        if hasattr(self.win, "translate"):
            self.win.translate.refresh_status()

    def download_offline(self):
        import offline_mt

        want = [p for p, c in self.off_checks.items() if c.isChecked() and p not in offline_mt.installed()]
        if not want:
            QtWidgets.QMessageBox.information(self, "Offline překlad", "Zaškrtněte balíčky, které ještě nemáte.")
            return

        def job():
            index = offline_mt.available()
            for a, b in want:
                pkgs = [p for p in index if p["from_code"] == a and p["to_code"] == b]
                if not pkgs:
                    self.comp_log.log(f"Balíček {a} → {b} není k dispozici.")
                    continue
                pkg = max(pkgs, key=lambda p: [int(x) for x in re.findall(r"\d+", str(p.get("package_version")))])
                offline_mt.install(pkg, self.comp_log.log)

        run_bg(job, lambda _r, err: (self.comp_log.log(f"✗ {err}" if err else "✓ Offline balíčky staženy."),
                                     self.refresh_offline()))

    def remove_offline(self):
        import offline_mt

        chosen = [p for p, c in self.off_checks.items() if c.isChecked() and p in offline_mt.installed()]
        if not chosen:
            return
        if QtWidgets.QMessageBox.question(self, "Offline překlad", "Odebrat zaškrtnuté offline balíčky z počítače?") \
                != QtWidgets.QMessageBox.Yes:
            return
        for p in chosen:
            offline_mt.remove(p)
        self.refresh_offline()

    def pick_exe(self, edit, name):
        f, _ = QtWidgets.QFileDialog.getOpenFileName(self, f"Najděte {name}", "", f"{name} ({name}*);;Vše (*.*)")
        if f:
            edit.setText(f)
            self.refresh_components()

    def refresh_components(self):
        cp = find_ebook_convert(self.cal_path.text() or None)
        tp = find_tesseract(self.tes_path.text() or None)
        if cp and not self.cal_path.text():
            self.cal_path.setText(cp)
        if tp and not self.tes_path.text():
            self.tes_path.setText(tp)

        def done(res, err):
            kfx, langs = res if res else (None, [])
            if cp:
                kfx_txt = {True: "plugin KFX Input je nainstalovaný",
                           False: "chybí plugin KFX Input (nainstaluje se i sám při prvním KFX)",
                           None: "plugin KFX Input nelze ověřit"}[kfx]
                where = "přibalené k programu" if cp == components.bundled_exe("Calibre2", "ebook-convert") \
                    else "nalezeno"
                set_status(self.cal_status, kfx is not False, f"Calibre {where} · {kfx_txt}")
            else:
                set_status(self.cal_status, False, "Calibre nebylo nalezeno – je součástí instalátoru")
            if tp:
                set_status(self.tes_status, True, f"Tesseract nalezen · jazyky: {', '.join(langs) or 'žádné'}")
            else:
                set_status(self.tes_status, False, "Tesseract nebyl nalezen – je součástí instalátoru")
            for code, c in self.lang_checks.items():
                c.setText(f"{components.OCR_LANGUAGES[code]} ({code})" + (" ✓" if code in langs else ""))

        run_bg(lambda: (components.calibre_kfx_plugin(cp), sorted(components.tesseract_languages(tp))), done)

    def install_kfx(self):
        cp = find_ebook_convert(self.cal_path.text() or None)
        run_bg(lambda: components.install_kfx_plugin(cp, self.comp_log.log),
               lambda _r, err: (self.comp_log.log(f"✗ {err}" if err else "✓ Hotovo."), self.refresh_components()))

    def download_langs(self):
        chosen = [c for c, cb in self.lang_checks.items() if cb.isChecked()]
        if not chosen:
            QtWidgets.QMessageBox.information(self, "Jazyky OCR", "Zaškrtněte jazyky, které chcete stáhnout.")
            return

        def job():
            for c in chosen:
                components.download_tessdata(c, self.comp_log.log)

        run_bg(job, lambda _r, err: (self.comp_log.log(f"✗ {err}" if err else "✓ Jazyky staženy."),
                                     self.refresh_components()))

    def _general_tab(self, cfg) -> QtWidgets.QWidget:
        w = QtWidgets.QWidget()
        g = QtWidgets.QGridLayout(w)
        self.out_dir = QtWidgets.QLineEdit(cfg.get("out_dir", ""))
        self.out_dir.setPlaceholderText("prázdné = výsledek se uloží vedle originálu")
        b = QtWidgets.QPushButton("Vybrat…")
        b.clicked.connect(lambda: (d := QtWidgets.QFileDialog.getExistingDirectory(self, "Výstupní složka"))
                          and self.out_dir.setText(d))
        g.addWidget(QtWidgets.QLabel("Výstupní složka:"), 0, 0)
        g.addWidget(self.out_dir, 0, 1)
        g.addWidget(b, 0, 2)
        from qt_editor import AUTOSAVE_DEFAULT, AUTOSAVE_MODES

        auto = {**AUTOSAVE_DEFAULT, **cfg.get("autosave", {})}
        abox = QtWidgets.QGroupBox("Automatické ukládání v editoru knihy")
        ag = QtWidgets.QGridLayout(abox)
        self.auto_mode = QtWidgets.QComboBox()
        for key, text in AUTOSAVE_MODES.items():
            self.auto_mode.addItem(text, key)
        self.auto_mode.setCurrentIndex(max(0, self.auto_mode.findData(auto["mode"])))
        self.auto_seconds = QtWidgets.QSpinBox()
        self.auto_seconds.setRange(5, 3600)
        self.auto_seconds.setSuffix(" s")
        self.auto_seconds.setValue(int(auto["seconds"]))
        self.auto_chars = QtWidgets.QSpinBox()
        self.auto_chars.setRange(10, 100000)
        self.auto_chars.setSuffix(" znaků")
        self.auto_chars.setValue(int(auto["chars"]))
        ag.addWidget(QtWidgets.QLabel("Ukládat:"), 0, 0)
        ag.addWidget(self.auto_mode, 0, 1)
        ag.addWidget(QtWidgets.QLabel("Interval:"), 1, 0)
        ag.addWidget(self.auto_seconds, 1, 1)
        ag.addWidget(QtWidgets.QLabel("Počet znaků:"), 2, 0)
        ag.addWidget(self.auto_chars, 2, 1)
        ag.addWidget(label("Na disk se zapisuje nejvýš jednou za 2 sekundy, i když píšete rychle. Předchozí verze "
                           "zůstává jako záloha „*.kniha.json.bak“. Psaní knihy přes AI ukládá samo po každé "
                           "kapitole; dokud je kniha otevřená v editoru, AI do ní nepíše.", "Hint"), 3, 0, 1, 2)

        def auto_visibility(*_):
            m = self.auto_mode.currentData()
            self.auto_seconds.setEnabled(m == "time")
            self.auto_chars.setEnabled(m == "chars")

        self.auto_mode.currentIndexChanged.connect(auto_visibility)
        auto_visibility()
        g.addWidget(abox, 1, 0, 1, 3)
        g.addWidget(QtWidgets.QLabel(f"Verze programu: {VERSION}"), 2, 0, 1, 2)
        self.upd_btn = QtWidgets.QPushButton("🌐 Zkontrolovat novou verzi")
        self.upd_btn.clicked.connect(lambda: self.win.check_updates(manual=True))
        g.addWidget(self.upd_btn, 2, 2)
        self.check_updates = QtWidgets.QCheckBox("Při spuštění zkontrolovat, zda je k dispozici nová verze")
        self.check_updates.setChecked(cfg.get("check_updates", True))
        g.addWidget(self.check_updates, 3, 0, 1, 3)

        tbox = QtWidgets.QGroupBox("Psaní textu (editor knihy, popis a osnova)")
        tg = QtWidgets.QGridLayout(tbox)
        ta = cfg.get("text_assist", {})
        self.ta_spell = QtWidgets.QCheckBox("Kontrola pravopisu – chybná slova červeně podtrhnout")
        self.ta_spell.setChecked(ta.get("spell", True))
        self.ta_complete = QtWidgets.QCheckBox("Návrhy slov při psaní (T9) – Tab vloží návrh, šipkami vyberete jiný")
        self.ta_complete.setChecked(ta.get("complete", True))
        self.ta_caps = QtWidgets.QCheckBox("Velké písmeno na začátku věty (po tečce, otazníku, vykřičníku)")
        self.ta_caps.setChecked(ta.get("capitalize", True))
        self.dict_status = label("", "Hint")
        self.dict_btn = QtWidgets.QPushButton("⬇ Stáhnout český slovník")
        self.dict_btn.clicked.connect(self.download_dictionary)
        tg.addWidget(self.ta_spell, 0, 0, 1, 2)
        tg.addWidget(self.ta_complete, 1, 0, 1, 2)
        tg.addWidget(self.ta_caps, 2, 0, 1, 2)
        tg.addWidget(self.dict_status, 3, 0)
        tg.addWidget(self.dict_btn, 3, 1)
        tg.addWidget(label("Pravým tlačítkem na podtržené slovo nabídne opravy, „Přidat do slovníku“ si slovo "
                           "zapamatuje (jména postav apod.). Kontrola se zapíná jen u knih v češtině.", "Hint"),
                     4, 0, 1, 2)
        tg.setColumnStretch(0, 1)
        g.addWidget(tbox, 4, 0, 1, 3)

        lbox = QtWidgets.QGroupBox("Jazyk programu")
        lg = QtWidgets.QGridLayout(lbox)
        self.ui_lang = QtWidgets.QComboBox()
        self.fill_ui_langs(cfg.get("ui_lang") or i18n.current())
        self.lang_dl = QtWidgets.QPushButton("⬇ Stáhnout další jazyky…")
        self.lang_dl.clicked.connect(self.download_ui_lang)
        lg.addWidget(QtWidgets.QLabel("Jazyk programu:"), 0, 0)
        lg.addWidget(self.ui_lang, 0, 1)
        lg.addWidget(self.lang_dl, 0, 2)
        lg.addWidget(label("Texty programu; návody ke službám a podrobné chybové hlášky zůstávají česky.", "Hint"),
                     1, 0, 1, 3)
        lg.setColumnStretch(1, 1)
        g.addWidget(lbox, 5, 0, 1, 3)
        g.addWidget(label(f"Nastavení programu: {core.config_path()}", "Hint"), 6, 0, 1, 3)
        g.setRowStretch(7, 1)
        g.setColumnStretch(1, 1)
        self.refresh_dictionary()
        return w

    def _info_tab(self, cfg) -> QtWidgets.QWidget:
        """O programu: verze, co umí, historie verzí, plány a vlastní poznámky uživatele."""
        w = QtWidgets.QWidget()
        lay = QtWidgets.QVBoxLayout(w)
        head = QtWidgets.QHBoxLayout()
        logo = QtWidgets.QLabel()
        logo.setPixmap(app_icon().pixmap(QtCore.QSize(56, 56)))
        head.addWidget(logo)
        info = QtWidgets.QVBoxLayout()
        info.addWidget(label(core.APP_NAME, "PageTitle", wrap=False))
        info.addWidget(label(f"Verze programu: {VERSION}", wrap=False))
        info.addWidget(label("© 2026 Micha741 · zdarma pro osobní použití", "Hint", wrap=False))
        head.addLayout(info, 1)
        web = QtWidgets.QPushButton("🌐 Stránka programu")
        web.clicked.connect(lambda: webbrowser.open(updater.RELEASE_URL))
        head.addWidget(web, 0, Qt.AlignTop)
        lay.addLayout(head)
        split = QtWidgets.QSplitter(Qt.Vertical)
        self.changelog = QtWidgets.QTextBrowser()
        self.changelog.setOpenExternalLinks(True)
        try:
            self.changelog.setMarkdown(Path(asset("changelog.md")).read_text(encoding="utf-8"))
        except OSError:
            self.changelog.setPlainText("Seznam změn není k dispozici.")
        split.addWidget(self.changelog)
        nbox = QtWidgets.QGroupBox("Moje poznámky a nápady")
        nl = QtWidgets.QVBoxLayout(nbox)
        nl.addWidget(label("Co ještě chcete v programu mít nebo vyzkoušet – uloží se tlačítkem Uložit nastavení.",
                           "Hint"))
        self.my_notes = QtWidgets.QPlainTextEdit(cfg.get("my_notes", ""))
        self.my_notes.setPlaceholderText("např. přidat tlačítko Přepsat kapitolu, vyzkoušet DeepL u PDF…")
        nl.addWidget(self.my_notes)
        split.addWidget(nbox)
        split.setSizes([420, 160])
        lay.addWidget(split, 1)
        return w

    def fill_ui_langs(self, select: str):
        self.ui_lang.blockSignals(True)
        self.ui_lang.clear()
        for code, name in i18n.installed().items():
            self.ui_lang.addItem(name, code)  # názvy jazyků se nepřekládají (každý ve svém jazyce)
            self.ui_lang.setItemText(self.ui_lang.count() - 1, name)
        self.ui_lang.setCurrentIndex(max(0, self.ui_lang.findData(select)))
        self.ui_lang.blockSignals(False)

    def download_ui_lang(self):
        self.lang_dl.setEnabled(False)

        def got(online, err):
            self.lang_dl.setEnabled(True)
            if err:
                QtWidgets.QMessageBox.warning(self, "Jazyk programu", f"Jazyky se nepodařilo stáhnout:\n{err}")
                return
            have = i18n.installed()
            new = {c: n for c, n in online.items() if c not in have}
            if not new:
                QtWidgets.QMessageBox.information(self, "Jazyk programu", "Žádné další jazyky ke stažení nejsou.")
                return
            names = list(new.values())
            name, ok = QtWidgets.QInputDialog.getItem(self, "Jazyk programu", "Vyberte jazyk ke stažení:",
                                                      names, 0, False)
            if not ok:
                return
            code = next(c for c, n in new.items() if n == name)
            self.lang_dl.setEnabled(False)

            def done(_r, e):
                self.lang_dl.setEnabled(True)
                if e:
                    QtWidgets.QMessageBox.warning(self, "Jazyk programu", f"Jazyky se nepodařilo stáhnout:\n{e}")
                    return
                self.fill_ui_langs(code)
                QtWidgets.QMessageBox.information(self, "Jazyk programu", f"✓ Jazyk {name} je nainstalovaný.")

            run_bg(lambda: i18n.download(code), done)

        run_bg(i18n.available_online, got)

    def refresh_dictionary(self):
        import spell

        st = spell.status()
        text = {"ready": "✓ Český slovník je načtený.",
                "loading": "Slovník se načítá…",
                "idle": "✓ Český slovník je nainstalovaný.",
                "missing": "Český slovník chybí (je součástí instalátoru, nebo ho stáhněte).",
                "error": f"✗ Slovník se nepodařilo načíst: {spell.last_error()}"}[st]
        self.dict_status.setText(text)
        self.dict_btn.setVisible(st in ("missing", "error"))

    def download_dictionary(self):
        import spell

        self.dict_btn.setEnabled(False)
        self.dict_status.setText("Stahuji a načítám slovník…")

        def ready():
            bridge().later(lambda: (self.dict_btn.setEnabled(True), self.refresh_dictionary()))

        def log(msg):
            bridge().later(lambda: (self.dict_status.setText(msg), self.dict_btn.setEnabled(True))
                           if msg.startswith("Slovník se nepodařilo") else self.dict_status.setText(msg))

        spell.load_async(ready, download=True, log=log)

    def save(self):
        self.collect()
        cfg = self.win.cfg
        cfg["paths"]["ebook_convert"] = self.cal_path.text().strip()
        cfg["paths"]["tesseract"] = self.tes_path.text().strip()
        cfg["out_dir"] = self.out_dir.text().strip()
        cfg["autosave"] = {"mode": self.auto_mode.currentData(), "seconds": self.auto_seconds.value(),
                           "chars": self.auto_chars.value()}
        cfg["check_updates"] = self.check_updates.isChecked()
        ta = cfg.setdefault("text_assist", {})  # stejný slovník sdílí otevřená textová pole
        ta["spell"] = self.ta_spell.isChecked()
        ta["complete"] = self.ta_complete.isChecked()
        ta["capitalize"] = self.ta_caps.isChecked()
        cfg["my_notes"] = self.my_notes.toPlainText()
        for a in (self.win.book.desc_assist, self.win.book.outline_assist):
            a.on_dictionary_ready() if ta["spell"] else a.rehighlight()
        new_lang = self.ui_lang.currentData() or "cs"
        lang_changed = new_lang != (cfg.get("ui_lang") or i18n.current())
        cfg["ui_lang"] = new_lang
        self.win.save_cfg()
        self.win.refresh_statuses()
        if lang_changed:
            if QtWidgets.QMessageBox.question(self, "Jazyk programu", "Jazyk se změní po restartu programu. "
                                                                     "Restartovat teď?") == QtWidgets.QMessageBox.Yes:
                restart_app()
            return
        QtWidgets.QMessageBox.information(self, "Nastavení", "Nastavení uloženo.")


# ==================================================================== hlavní okno
class MainWindow(QtWidgets.QMainWindow):
    def __init__(self):
        super().__init__()
        self.cfg = core.load_config()
        paths = self.cfg.setdefault("paths", {})
        for old in ("ebook_convert", "tesseract"):
            if self.cfg.get(old) and not paths.get(old):
                paths[old] = self.cfg.pop(old)
        paths["ebook_convert"] = paths.get("ebook_convert") or find_ebook_convert() or ""
        paths["tesseract"] = paths.get("tesseract") or find_tesseract() or ""

        self.setWindowTitle(self.title())
        # velikost podle obrazovky (např. notebook 1366×768 s lištou Windows)
        avail = QtGui.QGuiApplication.primaryScreen().availableGeometry()
        self.resize(min(1180, int(avail.width() * 0.95)), min(860, int(avail.height() * 0.92)))
        self.move(avail.center() - self.rect().center())
        self._restore_geometry()
        central = QtWidgets.QWidget()
        h = QtWidgets.QHBoxLayout(central)
        h.setContentsMargins(0, 0, 0, 0)
        h.setSpacing(0)

        self.setWindowIcon(app_icon())
        self.side = side = QtWidgets.QWidget()
        side.setStyleSheet("background: #1e293b;")
        sl = QtWidgets.QVBoxLayout(side)
        sl.setContentsMargins(0, 0, 0, 0)
        sl.setSpacing(0)
        head = QtWidgets.QWidget()
        head.setObjectName("SideHeader")
        hl = QtWidgets.QHBoxLayout(head)
        hl.setContentsMargins(12, 14, 8, 12)
        hl.setSpacing(10)
        self.logo = QtWidgets.QLabel()
        self.logo.setPixmap(app_icon().pixmap(QtCore.QSize(36, 36)))
        self.logo.setFixedSize(36, 36)
        self.brand = QtWidgets.QWidget()
        bl = QtWidgets.QVBoxLayout(self.brand)
        bl.setContentsMargins(0, 0, 0, 0)
        bl.setSpacing(0)
        bl.addWidget(label("Překladač", "AppName", wrap=False))
        bl.addWidget(label(f"verze {VERSION}" if VERSION[:1].isdigit() else VERSION, "AppVersion", wrap=False))
        self.side_toggle = QtWidgets.QToolButton()
        self.side_toggle.setObjectName("SideToggle")
        self.side_toggle.setText("☰")
        self.side_toggle.setCursor(Qt.PointingHandCursor)
        self.side_toggle.clicked.connect(lambda: self.set_sidebar_collapsed(not self.sidebar_collapsed))
        hl.addWidget(self.logo)
        hl.addWidget(self.brand, 1)
        hl.addWidget(self.side_toggle)
        sl.addWidget(head)
        self.nav = QtWidgets.QListWidget()
        self.nav.setObjectName("Sidebar")
        self.nav.setIconSize(QtCore.QSize(22, 22))
        self.nav.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.nav.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        for icon, text in (("🌍", "Překlad"), ("✍️", "Napsat knihu"), ("⚙️", "Nastavení")):
            it = QtWidgets.QListWidgetItem(emoji_icon(icon), text)
            it.setData(Qt.UserRole, text)
            self.nav.addItem(it)
        sl.addWidget(self.nav, 1)
        h.addWidget(side)
        self.sidebar_collapsed = False

        self.stack = QtWidgets.QStackedWidget()
        self.translate = TranslatePage(self)
        self.book = BookPage(self)
        self.settings = SettingsPage(self)
        for page in (self.translate, self.book, self.settings):
            wrap = QtWidgets.QWidget()
            wl = QtWidgets.QVBoxLayout(wrap)
            wl.setContentsMargins(*((20, 12, 20, 12) if page is self.settings else (0, 0, 0, 0)))
            wl.addWidget(page)
            self.stack.addWidget(wrap)  # posuvníky mají stránky uvnitř
        h.addWidget(self.stack, 1)
        self.setCentralWidget(central)
        self.editor = None  # editor knihy otevřený uvnitř okna místo stránky Napsat knihu
        self.nav.currentRowChanged.connect(self._nav_changed)
        self.nav.setCurrentRow(0)
        self.set_sidebar_collapsed(bool(self.cfg.get("sidebar_collapsed")), save=False)

        if not paths["ebook_convert"]:
            self.translate.logv.log("Upozornění: Calibre nebylo nalezeno – bez něj nepůjdou AZW3, KFX, MOBI a RTF. "
                                    "Je součástí instalátoru Prekladac-Setup.exe.")
        if self.cfg.get("check_updates", True):
            QtCore.QTimer.singleShot(3000, self.check_updates)

    def title(self) -> str:
        return f"{core.APP_NAME} – verze {VERSION}"

    def _nav_changed(self, row: int):
        if row == 1 and self.editor is not None:
            self.stack.setCurrentWidget(self.editor)
            self.editor._update_title()
        else:
            self.stack.setCurrentIndex(row)
            self.setWindowTitle(self.title())

    def show_editor(self, ed):
        """Editor knihy se zobrazí v hlavním okně místo stránky Napsat knihu (jako ve Wordu)."""
        if ed is not self.editor:
            ed.setWindowFlags(Qt.Widget)
            self.stack.addWidget(ed)
            self.editor = ed
            ed.destroyed.connect(self._editor_destroyed)
            ed.closed.connect(lambda e=ed: self._editor_closed(e))
        if self.nav.currentRow() != 1:
            self.nav.setCurrentRow(1)  # → _nav_changed
        else:
            self._nav_changed(1)
        ed.show()
        ed.text.setFocus()

    def close_editor(self) -> bool:
        """Zavře editor (zeptá se na neuložené změny); False, když uživatel zavření zrušil."""
        return self.editor is None or self.editor.close()

    def _editor_closed(self, ed):
        if ed is not self.editor:
            return
        self.editor = None
        self.stack.removeWidget(ed)
        self._nav_changed(self.nav.currentRow())
        self.book.update_buttons()

    def _editor_destroyed(self, *_):
        try:
            self.book.update_buttons()
        except RuntimeError:  # okno se zavírá
            pass

    def _restore_geometry(self):
        """Velikost a poloha okna z minula – jen když se vejde na některou z obrazovek."""
        geo = self.cfg.get("window_geometry")
        if not geo:
            return
        old = self.saveGeometry()
        if not self.restoreGeometry(QtCore.QByteArray.fromBase64(geo.encode("ascii"))):
            return
        fits = any(s.availableGeometry().adjusted(-20, -20, 20, 20).contains(self.frameGeometry())
                   for s in QtGui.QGuiApplication.screens())
        if not fits and not self.isMaximized():
            self.restoreGeometry(old)

    def closeEvent(self, e):
        if not self.close_editor():
            e.ignore()
            return
        try:
            self.cfg["window_geometry"] = bytes(self.saveGeometry().toBase64()).decode("ascii")
            self.save_cfg()
        except Exception:  # noqa: BLE001 – zavření okna nesmí spadnout kvůli nastavení
            pass
        super().closeEvent(e)

    def set_sidebar_collapsed(self, collapsed: bool, save: bool = True):
        """Sbalený panel = úzký proužek jen s ikonami; tlačítko ☰ ho zase rozbalí."""
        self.sidebar_collapsed = collapsed
        self.side.setFixedWidth(72 if collapsed else 220)
        self.logo.setVisible(not collapsed)
        self.brand.setVisible(not collapsed)
        self.side_toggle.setToolTip("Rozbalit panel" if collapsed else "Skrýt panel")
        for i in range(self.nav.count()):
            it = self.nav.item(i)
            name = it.data(Qt.UserRole)
            it.setText("" if collapsed else name)
            it.setToolTip(name if collapsed else "")
        if save:
            self.cfg["sidebar_collapsed"] = collapsed
            self.save_cfg()

    def check_updates(self, manual: bool = False):
        """Zjistí na GitHubu novou verzi; při automatické kontrole mlčí, když žádná není."""
        skip = "" if manual else self.cfg.get("skip_version", "")

        def done(info, err):
            if err:
                if manual:
                    QtWidgets.QMessageBox.warning(self, "Nová verze",
                                                  f"Novou verzi se nepodařilo zjistit:\n{err}")
                return
            if info:
                self.offer_update(info)
            elif manual:
                QtWidgets.QMessageBox.information(
                    self, "Nová verze", f"Máte nejnovější verzi ({VERSION})." if VERSION[:1].isdigit()
                    else "Vývojová verze (spuštěná z Pythonu) se neaktualizuje.")

        run_bg(lambda: updater.check(VERSION, skip), done)

    def offer_update(self, info: dict):
        box = QtWidgets.QMessageBox(self)
        box.setWindowTitle("Nová verze")
        box.setIcon(QtWidgets.QMessageBox.Icon.Information)
        box.setText(f"<b>Je k dispozici nová verze {info['version']}</b> (máte {VERSION}).")
        box.setInformativeText(
            "Stáhněte Prekladac-Setup.exe a spusťte ho – nainstaluje se přes stávající verzi. "
            "Nastavení, klíče i rozepsané knihy zůstanou zachované. Před instalací program zavřete.")
        dl = box.addButton("⬇ Stáhnout novou verzi", QtWidgets.QMessageBox.ButtonRole.AcceptRole)
        skip = box.addButton("Tuto verzi přeskočit", QtWidgets.QMessageBox.ButtonRole.RejectRole)
        box.addButton("Později", QtWidgets.QMessageBox.ButtonRole.RejectRole)
        box.setDefaultButton(dl)
        box.exec()
        if box.clickedButton() is dl:
            webbrowser.open(info["setup_url"])
        elif box.clickedButton() is skip:
            self.cfg["skip_version"] = info["version"]
            self.save_cfg()

    def save_cfg(self):
        try:
            core.save_config(self.cfg)
        except Exception as e:  # noqa: BLE001
            self.translate.logv.log(f"Nastavení se nepodařilo uložit: {e}")

    def refresh_statuses(self):
        self.translate.refresh_status()
        self.book.on_service()


def restart_app() -> None:
    """Spustí program znovu (po změně jazyka) a tento zavře."""
    args = sys.argv[1:] if getattr(sys, "frozen", False) else sys.argv
    QtCore.QProcess.startDetached(sys.executable, args)
    QtWidgets.QApplication.quit()


def main() -> int:
    QtWidgets.QApplication.setHighDpiScaleFactorRoundingPolicy(
        QtCore.Qt.HighDpiScaleFactorRoundingPolicy.PassThrough)
    if sys.platform == "win32":  # vlastní ikona na hlavním panelu Windows (ne ikona Pythonu)
        try:
            import ctypes

            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("Micha741.Prekladac")
        except Exception:  # noqa: BLE001
            pass
    qapp = QtWidgets.QApplication.instance() or QtWidgets.QApplication(sys.argv)
    qapp.setApplicationName(core.APP_NAME)
    qapp.setWindowIcon(app_icon())
    qapp.setStyle("Fusion")
    qapp.setStyleSheet(STYLESHEET)
    bridge()
    try:  # jazyk programu (čeština = beze změny)
        cfg = core.load_config()
        if not i18n.load(cfg.get("ui_lang") or i18n.system_language()):
            i18n.load("cs")
        i18n.install(qapp)
    except Exception:  # noqa: BLE001 – chyba jazyka nesmí zabránit spuštění
        i18n.load("cs")
    win = MainWindow()
    win.show()
    return qapp.exec()
