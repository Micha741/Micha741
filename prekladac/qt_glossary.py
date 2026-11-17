"""Překlad → Překladač → 📖 Glosář knihy: jména a pojmy, které se v celé knize přeloží vždy stejně."""
from __future__ import annotations

import threading
from pathlib import Path

from PySide6 import QtWidgets
from PySide6.QtCore import Qt

import glossary
from i18n import tr
from qt_common import label, run_bg

AI_ENGINES = ("claude", "gemini", "openai", "ollama")


class GlossaryDialog(QtWidgets.QDialog):
    def __init__(self, files: list[str], cfg: dict, parent=None, current: str = ""):
        super().__init__(parent)
        self.cfg = cfg
        self.lang = cfg.get("lang") or "čeština"
        self.cancel = threading.Event()
        self.setWindowTitle(tr("Glosář knihy"))
        self.resize(760, 560)
        lay = QtWidgets.QVBoxLayout(self)
        lay.addWidget(label("Jména postav, místa a pojmy, které se v celé knize přeloží vždy stejně. AI překladače "
                            "(Claude, Gemini, OpenAI, Ollama) je navíc správně skloňují; ostatní (Google, DeepL…) "
                            "vloží zadaný překlad beze změny tvaru. Překlad shodný s originálem = výraz se nepřekládá.",
                            "Hint"))
        row = QtWidgets.QHBoxLayout()
        row.addWidget(QtWidgets.QLabel(tr("Kniha:")))
        self.book = QtWidgets.QComboBox()
        for f in files:
            self.book.addItem(Path(f).name, f)
        if current:
            self.book.setCurrentIndex(max(0, self.book.findData(current)))
        self.book.currentIndexChanged.connect(self.load)
        row.addWidget(self.book, 1)
        row.addWidget(QtWidgets.QLabel(tr("Cílový jazyk: {}").format(self.lang)))
        lay.addLayout(row)
        self.table = QtWidgets.QTableWidget(0, 3)
        self.table.setHorizontalHeaderLabels([tr("Originál"), tr("Překlad"), tr("Poznámka")])
        self.table.horizontalHeader().setSectionResizeMode(2, QtWidgets.QHeaderView.Stretch)
        self.table.setColumnWidth(0, 200)
        self.table.setColumnWidth(1, 200)
        lay.addWidget(self.table, 1)
        btns = QtWidgets.QHBoxLayout()
        self.b_suggest = QtWidgets.QPushButton(tr("✨ Navrhnout z knihy"))
        self.b_suggest.setToolTip(tr("AI vybere jména a pojmy a navrhne překlad; bez AI překladače se najdou opakovaná "
                                     "jména (ponechají se beze změny)"))
        self.b_suggest.clicked.connect(self.suggest)
        add = QtWidgets.QPushButton(tr("➕ Přidat řádek"))
        add.clicked.connect(lambda: self.add_row({"src": "", "dst": "", "note": ""}, edit=True))
        rem = QtWidgets.QPushButton(tr("🗑 Odebrat vybrané"))
        rem.clicked.connect(self.remove_rows)
        for b in (self.b_suggest, add, rem):
            btns.addWidget(b)
        btns.addStretch(1)
        lay.addLayout(btns)
        self.status = label("", "Hint")
        lay.addWidget(self.status)
        bb = QtWidgets.QDialogButtonBox(QtWidgets.QDialogButtonBox.Save | QtWidgets.QDialogButtonBox.Close)
        bb.accepted.connect(self.save_and_close)
        bb.rejected.connect(self.reject)
        lay.addWidget(bb)
        self.load()

    def source(self) -> str:
        return self.book.currentData() or ""

    def add_row(self, t: dict, edit=False):
        r = self.table.rowCount()
        self.table.insertRow(r)
        for c, key in enumerate(("src", "dst", "note")):
            self.table.setItem(r, c, QtWidgets.QTableWidgetItem(t.get(key, "")))
        if edit:
            self.table.editItem(self.table.item(r, 0))

    def terms(self) -> list[dict]:
        out = []
        for r in range(self.table.rowCount()):
            vals = [(self.table.item(r, c).text() if self.table.item(r, c) else "") for c in range(3)]
            out.append({"src": vals[0], "dst": vals[1], "note": vals[2]})
        return glossary.clean_terms(out)

    def load(self):
        self.table.setRowCount(0)
        for t in glossary.load(self.source(), self.lang):
            self.add_row(t)
        n = self.table.rowCount()
        self.status.setText(tr("Glosář má {} výrazů.").format(n) if n else tr("Zatím prázdný – klikněte na Navrhnout "
                                                                             "z knihy nebo přidejte výrazy ručně."))

    def remove_rows(self):
        for r in sorted({i.row() for i in self.table.selectedIndexes()}, reverse=True):
            self.table.removeRow(r)

    def suggest(self):
        src = self.source()
        if not src:
            return
        engine = self.cfg.get("engine", "google")
        engines = self.cfg.get("engines", {})
        lang = self.lang
        self.b_suggest.setEnabled(False)
        self.status.setText(tr("Hledám jména a pojmy v knize…") if engine not in AI_ENGINES else
                            tr("AI vybírá jména a pojmy a navrhuje překlad…"))

        def work():
            text = glossary.sample_text(src)
            if not text.strip():
                raise ValueError(tr("V souboru se nepodařilo najít text."))
            if engine in AI_ENGINES:
                import book_writer as bw

                backend = bw.make_backend(engine, engines, lang, lambda *_: None, self.cancel)
                return glossary.suggest_ai(backend.complete, text, lang), True
            return glossary.suggest_names(text), False

        def done(res, err):
            self.b_suggest.setEnabled(True)
            if err:
                self.status.setText("⚠ " + str(err))
                return
            found, ai = res
            have = {t["src"].lower() for t in self.terms()}
            new = [t for t in found if t["src"].lower() not in have]
            for t in new:
                self.add_row(t)
            self.status.setText(tr("Přidáno {} návrhů – zkontrolujte je a uložte.").format(len(new)) +
                                ("" if ai else " " + tr("(Bez AI jen jména beze změny; s AI překladačem i překlady pojmů.)")))

        run_bg(work, done, owner=self)

    def save_and_close(self):
        glossary.save(self.source(), self.lang, self.terms())
        self.accept()

    def reject(self):
        self.cancel.set()
        super().reject()
