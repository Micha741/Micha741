"""Hlavní okno programu (Qt): Překlad, Napsat knihu, Nastavení."""

from __future__ import annotations

import os
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
from qt_common import STYLESHEET, app_icon, bridge, emoji_icon, label, run_bg, set_status
import updater
from qt_editor import RibbonGroup, vline
from qt_textassist import TextAssist
from version import VERSION

Qt = QtCore.Qt


def h_title(text: str) -> QtWidgets.QLabel:
    return label(text, "PageTitle", wrap=False)


def primary(text: str) -> QtWidgets.QPushButton:
    b = QtWidgets.QPushButton(text)
    b.setObjectName("Primary")
    return b


class LogView(QtWidgets.QPlainTextEdit):
    def __init__(self):
        super().__init__()
        self.setReadOnly(True)
        self.setMaximumBlockCount(5000)
        self.setFont(QtGui.QFont("Consolas", 9))

    def log(self, text: str) -> None:
        """Bezpečné volání i z vlákna."""
        bridge().later(lambda: (self.appendPlainText(text), self.ensureCursorVisible()))


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
        lay = QtWidgets.QVBoxLayout(self)
        lay.addWidget(h_title("Překlad a převod souborů"))

        files_box = QtWidgets.QGroupBox("Soubory")
        fl = QtWidgets.QHBoxLayout(files_box)
        self.files = FileList()
        fl.addWidget(self.files, 1)
        btns = QtWidgets.QVBoxLayout()
        b_add = QtWidgets.QPushButton("➕ Přidat soubory…")
        b_add.setToolTip("V okně můžete vybrat víc souborů najednou (Ctrl+klik, Shift+klik, Ctrl+A).")
        b_add.clicked.connect(self.pick)
        b_dir = QtWidgets.QPushButton("📁 Přidat složku…")
        b_dir.setToolTip("Přidá všechny podporované soubory ze složky včetně podsložek.")
        b_dir.clicked.connect(self.pick_dir)
        self.b_selall = QtWidgets.QPushButton("☑ Vybrat vše")
        self.b_selall.setToolTip("Ctrl+A")
        self.b_selall.clicked.connect(self.files.toggle_select_all)
        self.b_remove = QtWidgets.QPushButton("➖ Odebrat vybrané")
        self.b_remove.setToolTip("Klávesa Delete")
        self.b_remove.clicked.connect(self.remove_files)
        for b in (b_add, b_dir, self.b_selall, self.b_remove):
            b.setFixedWidth(190)  # šířka se nemění, když se text tlačítka přepne
            btns.addWidget(b)
        btns.addStretch(1)
        self.files_info = label("", "Hint", wrap=False)
        btns.addWidget(self.files_info)
        fl.addLayout(btns)
        lay.addWidget(files_box, 2)
        self.files.setContextMenuPolicy(Qt.CustomContextMenu)
        self.files.customContextMenuRequested.connect(self.files_menu)
        self.files.changed.connect(self.update_file_buttons)
        self.update_file_buttons()

        opts = QtWidgets.QGroupBox("Nastavení překladu")
        g = QtWidgets.QGridLayout(opts)
        self.mode_translate = QtWidgets.QRadioButton("Přeložit")
        self.mode_convert = QtWidgets.QRadioButton("Jen převést formát / přepsat text z obrázku")
        (self.mode_convert if cfg.get("mode") == "convert" else self.mode_translate).setChecked(True)
        mrow = QtWidgets.QHBoxLayout()
        mrow.addWidget(self.mode_translate)
        mrow.addWidget(self.mode_convert)
        mrow.addStretch(1)
        g.addLayout(mrow, 0, 0, 1, 4)

        self.lang = QtWidgets.QComboBox()
        self.lang.setEditable(True)
        self.lang.addItems(core.LANGUAGES)
        self.lang.setCurrentText(cfg.get("lang", "čeština"))
        self.out_fmt = QtWidgets.QComboBox()
        self.out_fmt.addItems([core.SAME_FORMAT] + OUTPUT_FORMATS)
        self.out_fmt.setCurrentText(cfg.get("out_fmt", core.SAME_FORMAT))
        g.addWidget(QtWidgets.QLabel("Cílový jazyk:"), 1, 0)
        g.addWidget(self.lang, 1, 1)
        g.addWidget(QtWidgets.QLabel("Výstupní formát:"), 1, 2)
        g.addWidget(self.out_fmt, 1, 3)

        self.engine = QtWidgets.QComboBox()
        for key, text in ENGINE_LABELS.items():
            self.engine.addItem(text, key)
        self.engine.setCurrentIndex(max(0, self.engine.findData(cfg.get("engine", "google"))))
        g.addWidget(QtWidgets.QLabel("Překladač:"), 2, 0)
        g.addWidget(self.engine, 2, 1, 1, 3)
        self.status = label("")
        g.addWidget(self.status, 3, 1, 1, 3)

        self.ocr = QtWidgets.QComboBox()
        for key, text in OCR_LABELS.items():
            self.ocr.addItem(text, key)
        self.ocr.setCurrentIndex(max(0, self.ocr.findData(cfg.get("ocr", "tesseract"))))
        self.ocr_lang = QtWidgets.QComboBox()
        self.ocr_lang.setEditable(True)
        self.ocr_lang.addItems(list(components.OCR_LANGUAGES) + ["eng+ces", "eng+deu"])
        self.ocr_lang.setCurrentText(cfg.get("ocr_lang", "eng"))
        g.addWidget(QtWidgets.QLabel("Text z obrázků/skenů:"), 4, 0)
        g.addWidget(self.ocr, 4, 1)
        g.addWidget(QtWidgets.QLabel("Jazyk originálu (OCR):"), 4, 2)
        g.addWidget(self.ocr_lang, 4, 3)

        self.notes = QtWidgets.QPlainTextEdit(cfg.get("notes", ""))
        self.notes.setPlaceholderText("Pokyny pro překlad – glosář, styl (Claude, Gemini, Ollama, OpenAI…)")
        self.notes.setMaximumHeight(60)
        g.addWidget(QtWidgets.QLabel("Pokyny:"), 5, 0)
        g.addWidget(self.notes, 5, 1, 1, 3)
        self.merge = QtWidgets.QCheckBox("Více obrázků spojit do jednoho DOCX")
        self.merge.setChecked(cfg.get("merge_images", True))
        g.addWidget(self.merge, 6, 1, 1, 3)
        g.setColumnStretch(1, 1)
        g.setColumnStretch(3, 1)
        lay.addWidget(opts)

        run = QtWidgets.QHBoxLayout()
        self.bar = QtWidgets.QProgressBar()
        self.bar.setRange(0, 1000)
        self.start_btn = primary("▶  Spustit")
        self.stop_btn = QtWidgets.QPushButton("■ Zastavit")
        self.stop_btn.setEnabled(False)
        self.start_btn.clicked.connect(self.start)
        self.stop_btn.clicked.connect(self.cancel.set)
        run.addWidget(self.bar, 1)
        run.addWidget(self.start_btn)
        run.addWidget(self.stop_btn)
        lay.addLayout(run)
        self.logv = LogView()
        lay.addWidget(self.logv, 2)

        self.engine.currentIndexChanged.connect(self.refresh_status)
        self.ocr.currentIndexChanged.connect(self.refresh_status)
        self.refresh_status()

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
                   lang=self.lang.currentText().strip() or "čeština", out_fmt=self.out_fmt.currentText(),
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

        def progress(f):
            bridge().later(lambda: self.bar.setValue(int(f * 1000)))

        def job():
            return core.run_jobs(files, translate, cfg["out_fmt"], tr, cfg.get("out_dir") or None,
                                 cfg["merge_images"], self.logv.log, progress,
                                 cfg["paths"].get("ebook_convert") or None, self.cancel)

        def done(res, err):
            self.start_btn.setEnabled(True)
            self.stop_btn.setEnabled(False)
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
        self.svc_status = label("", wrap=False)
        self.est = label("", "Hint", wrap=False)
        self.fmts = {}
        for f in ("epub", "docx", "pdf", "azw3"):
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
            return w

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
            fg.addWidget(cb, i // 2, i % 2)
        dir_w = QtWidgets.QWidget()
        dl = QtWidgets.QHBoxLayout(dir_w)
        dl.setContentsMargins(0, 0, 0, 0)
        dl.addWidget(self.bdir, 1)
        dl.addWidget(pick)
        scope_tab = ribbon_row(
            group("Kniha", [("Jazyk knihy:", self.blang), ("Kapitol:", self.nchap), ("Slov na kapitolu:", self.nwords)]),
            group("Umělá inteligence", [("Služba:", self.service), ("Model Claude:", self.model)]),
            group("Uložit jako", [("", fmt_w), ("Složka:", dir_w)]))
        ribbon = QtWidgets.QTabWidget()
        ribbon.setObjectName("Ribbon")
        ribbon.setDocumentMode(True)
        ribbon.addTab(style_tab, "Žánr a styl")
        ribbon.addTab(scope_tab, "Rozsah a služba")
        actions = RibbonGroup("Kniha")
        for i, b in enumerate((self.b_outline, self.b_write, self.b_stop, self.b_edit, self.b_load)):
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
        il.addWidget(self.svc_status)
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
        self.outline_assist = TextAssist(self.outline, ta_opts, win.save_cfg)
        for ed in (self.desc, self.outline):
            ed.setFont(QtGui.QFont("Georgia", 12))

        paper = QtWidgets.QFrame()
        paper.setObjectName("Paper")
        paper.setMaximumWidth(980)
        pl = QtWidgets.QVBoxLayout(paper)
        pl.setContentsMargins(56, 36, 56, 40)
        pl.setSpacing(6)
        pl.addWidget(heading("Popis knihy", "O čem kniha je – stačí kolem 20 vět. Žánr a styl vyberte nahoře "
                                            "v pásu karet."))
        pl.addWidget(self.desc)
        pl.addSpacing(10)
        pl.addWidget(heading("Osnova", "Kapitoly ve tvaru „1. Název — obsah“. Vznikne tlačítkem "
                                       "„1. Navrhnout osnovu“ a můžete ji upravit."))
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
        bottom = QtWidgets.QWidget()
        bl = QtWidgets.QVBoxLayout(bottom)
        bl.setContentsMargins(8, 4, 8, 6)
        bl.setSpacing(4)
        self.bar = QtWidgets.QProgressBar()
        self.bar.setRange(0, 1000)
        self.logv = LogView()
        self.logv.setMinimumHeight(60)
        bl.addWidget(self.bar)
        bl.addWidget(self.logv)
        split = QtWidgets.QSplitter(Qt.Vertical)
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
        self.b_edit.setEnabled(not self.busy and has_text)

    def set_busy(self, on: bool):
        self.busy = on
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
        path = self.book_dir() / (bw.safe_name(outline["title"]) + bw.PROJECT_SUFFIX)
        n = 2
        while path.exists():
            path = self.book_dir() / f"{bw.safe_name(outline['title'])} ({n}){bw.PROJECT_SUFFIX}"
            n += 1
        self.project, self.path = proj, path
        bw.save_project(path, proj)
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
        if proj is None or proj["outline"] != outline:
            if proj is not None and proj["chapters"]:
                if QtWidgets.QMessageBox.question(self, "Napsat knihu", "Osnova se změnila – začít psát od první "
                                                                        "kapitoly?") != QtWidgets.QMessageBox.Yes:
                    return
                self.new_project(outline)
            elif proj is not None:
                proj.update(outline=outline, words=self.nwords.value(), style=self.full_style(),
                            style_parts=self.parts(), style_extra=self.extra.text().strip(),
                            description=self.desc.toPlainText().strip(),
                            language=self.blang.currentText().strip() or "čeština")
                bw.save_project(self.path, proj)
            else:
                self.new_project(outline)
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
            estimate = wr.estimate(n, proj["words"])
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
                              "nebo později přes „Pokračovat v rozepsané…“.")
                return
            for f in files:
                self.logv.log(f"✓ Uloženo: {f}")
            if QtWidgets.QMessageBox.question(self, "Napsat knihu", "Kniha je hotová.\n\n" + "\n".join(files)
                                              + "\n\nOtevřít ji v editoru?") == QtWidgets.QMessageBox.Yes:
                self.open_editor()

        run_bg(job, done)

    def do_load(self):
        f, _ = QtWidgets.QFileDialog.getOpenFileName(self, "Rozepsaná kniha", str(self.book_dir()),
                                                     f"Rozepsaná kniha (*{bw.PROJECT_SUFFIX});;Vše (*.*)")
        if not f:
            return
        try:
            proj = bw.load_project(f)
        except Exception as e:  # noqa: BLE001
            QtWidgets.QMessageBox.critical(self, "Napsat knihu", str(e))
            return
        self.project, self.path = proj, Path(f)
        self.desc.setPlainText(proj.get("description", ""))
        parts = proj.get("style_parts") or {}
        for key, cb in self.cats.items():
            cb.setCurrentText(parts.get(key, ""))
        self.extra.setText(proj.get("style_extra", "") if parts else proj.get("style", ""))
        self.blang.setCurrentText(proj.get("language", "čeština"))
        self.nwords.setValue(int(proj.get("words", 2500)))
        self.nchap.setValue(len(proj["outline"]["chapters"]))
        i = self.model.findData(proj.get("model"))
        if i >= 0:
            self.model.setCurrentIndex(i)
        i = self.service.findData(proj.get("service", "claude"))
        if i >= 0:
            self.service.setCurrentIndex(i)
        self.bdir.setText(str(Path(f).parent))
        self.outline.setPlainText(bw.outline_to_text(proj["outline"]))
        self.update_buttons()
        self.logv.log(f"Načteno: {len(proj['chapters'])} z {len(proj['outline']['chapters'])} kapitol hotovo.")

    def open_editor_for(self, path):
        """Otevřený editor této knihy (nebo None)."""
        alive = []
        for ed in self.editors:
            try:
                ed.isVisible()
            except RuntimeError:  # okno už bylo zavřeno a smazáno
                continue
            alive.append(ed)
        self.editors = alive
        return next((ed for ed in alive if ed.isVisible() and path and ed.path == Path(path)), None)

    def open_editor(self):
        from qt_editor import BookEditor

        if not self.project or not self.project["chapters"]:
            QtWidgets.QMessageBox.information(self, "Upravit knihu", "Kniha zatím nemá napsanou žádnou kapitolu.")
            return
        if self.open_editor_for(self.path):
            ed = self.open_editor_for(self.path)
            ed.showMaximized()
            ed.raise_()
            ed.activateWindow()
            return
        ed = BookEditor(self.project, self.path, self.win.cfg["paths"].get("ebook_convert") or None,
                        autosave=self.win.cfg.get("autosave"),
                        text_assist=self.win.cfg.setdefault("text_assist", {}), save_options=self.win.save_cfg)
        self.editors.append(ed)
        ed.destroyed.connect(lambda *_: self.update_buttons())
        ed.showMaximized()


# ===================================================================== Nastavení
class SettingsPage(QtWidgets.QWidget):
    def __init__(self, win: "MainWindow"):
        super().__init__()
        self.win = win
        cfg = win.cfg
        lay = QtWidgets.QVBoxLayout(self)
        lay.addWidget(h_title("Nastavení"))
        tabs = QtWidgets.QTabWidget()
        lay.addWidget(tabs, 1)
        tabs.addTab(self._services_tab(cfg), "Služby a klíče")
        tabs.addTab(self._components_tab(cfg), "Součásti")
        tabs.addTab(self._general_tab(cfg), "Obecné")
        row = QtWidgets.QHBoxLayout()
        row.addWidget(label("Klíče se ukládají zašifrovaně (Windows DPAPI) jen pro váš účet ve Windows.", "Hint"))
        row.addStretch(1)
        save = primary("💾 Uložit nastavení")
        save.clicked.connect(self.save)
        row.addWidget(save)
        lay.addLayout(row)

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
        self.comp_log = LogView()
        self.comp_log.setMaximumHeight(140)
        lay.addWidget(self.comp_log)
        lay.addStretch(1)
        QtCore.QTimer.singleShot(300, self.refresh_components)
        return w

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
        g.addWidget(label(f"Nastavení programu: {core.config_path()}", "Hint"), 5, 0, 1, 3)
        g.setRowStretch(6, 1)
        g.setColumnStretch(1, 1)
        self.refresh_dictionary()
        return w

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
        for a in (self.win.book.desc_assist, self.win.book.outline_assist):
            a.on_dictionary_ready() if ta["spell"] else a.rehighlight()
        self.win.save_cfg()
        self.win.refresh_statuses()
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

        self.setWindowTitle(f"{core.APP_NAME} – verze {VERSION}")
        self.resize(1180, 860)
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
            wl.setContentsMargins(*((0, 0, 0, 0) if page is self.book else (20, 12, 20, 12)))
            wl.addWidget(page)
            self.stack.addWidget(wrap)
        h.addWidget(self.stack, 1)
        self.setCentralWidget(central)
        self.nav.currentRowChanged.connect(self.stack.setCurrentIndex)
        self.nav.setCurrentRow(0)
        self.set_sidebar_collapsed(bool(self.cfg.get("sidebar_collapsed")), save=False)

        if not paths["ebook_convert"]:
            self.translate.logv.log("Upozornění: Calibre nebylo nalezeno – bez něj nepůjdou AZW3, KFX, MOBI a RTF. "
                                    "Je součástí instalátoru Prekladac-Setup.exe.")
        if self.cfg.get("check_updates", True):
            QtCore.QTimer.singleShot(3000, self.check_updates)

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
    win = MainWindow()
    win.show()
    return qapp.exec()
