"""Okno knihy → Kniha → ✨ Přepsat kapitolu: AI přepíše aktuální kapitolu (delší, kratší, napínavější, jednodušší,
opravit styl nebo vlastní pokyn). Nová verze se ukáže k porovnání a použije se až po potvrzení; Ctrl+Z ji vrátí."""
from __future__ import annotations

import threading

from PySide6 import QtWidgets
from PySide6.QtCore import Qt

import book_writer as bw
from i18n import tr
from qt_common import label, run_bg

SERVICES = [("Claude", "claude"), ("Google Gemini", "gemini"), ("OpenAI-kompatibilní (DeepSeek, OpenRouter…)", "openai"),
            ("Ollama (v počítači)", "ollama")]


class RewriteDialog(QtWidgets.QDialog):
    def __init__(self, editor, parent=None):
        super().__init__(parent or editor)
        self.editor = editor
        self.cancel = threading.Event()
        self.result_data: dict | None = None
        idx = editor.cur
        titles = editor.outline["chapters"]
        self.setWindowTitle(tr("Přepsat kapitolu {}: {}").format(idx + 1, titles[idx]["title"] if idx < len(titles) else ""))
        self.resize(900, 640)
        lay = QtWidgets.QVBoxLayout(self)
        lay.addWidget(label("AI přepíše tuto kapitolu podle zvoleného způsobu. Novou verzi nejdřív uvidíte a použijete "
                            "ji, jen když se vám líbí (v okně knihy ji vrátí Ctrl+Z). Obrázky v kapitole zůstanou.", "Hint"))
        modes = QtWidgets.QGroupBox(tr("Jak přepsat"))
        mg = QtWidgets.QGridLayout(modes)
        self.mode_buttons: dict[str, QtWidgets.QRadioButton] = {}
        for k, (key, (caption, _desc)) in enumerate(bw.REWRITE_MODES.items()):
            rb = QtWidgets.QRadioButton(tr(caption))
            rb.setToolTip(tr(_desc) if _desc else tr("Napište vlastní pokyn níže"))
            mg.addWidget(rb, k // 3, k % 3)
            self.mode_buttons[key] = rb
        self.mode_buttons["style"].setChecked(True)
        lay.addWidget(modes)
        self.extra = QtWidgets.QLineEdit()
        self.extra.setPlaceholderText(tr("Vlastní pokyn (nepovinné), např. „víc dialogů mezi Annou a Petrem“"))
        lay.addWidget(self.extra)
        row = QtWidgets.QHBoxLayout()
        row.addWidget(QtWidgets.QLabel(tr("AI:")))
        self.service = QtWidgets.QComboBox()
        for name, key in SERVICES:
            self.service.addItem(name, key)
        self.service.setCurrentIndex(max(0, self.service.findData(editor.project.get("service", "claude"))))
        row.addWidget(self.service)
        row.addStretch(1)
        self.b_run = QtWidgets.QPushButton(tr("✨ Přepsat"))
        self.b_run.setDefault(True)
        self.b_run.clicked.connect(self.run)
        row.addWidget(self.b_run)
        lay.addLayout(row)
        self.status = label("", "Hint")
        lay.addWidget(self.status)
        split = QtWidgets.QSplitter(Qt.Horizontal)
        self.old = QtWidgets.QPlainTextEdit(editor.project["chapters"][idx].get("text", ""))
        self.old.setReadOnly(True)
        self.new = QtWidgets.QPlainTextEdit()
        self.new.setPlaceholderText(tr("Tady se ukáže nová verze kapitoly – můžete ji ještě upravit."))
        for title, w in ((tr("Původní"), self.old), (tr("Nová verze"), self.new)):
            box = QtWidgets.QWidget()
            bl = QtWidgets.QVBoxLayout(box)
            bl.setContentsMargins(0, 0, 0, 0)
            bl.addWidget(QtWidgets.QLabel(f"<b>{title}</b>"))
            bl.addWidget(w)
            split.addWidget(box)
        lay.addWidget(split, 1)
        bb = QtWidgets.QHBoxLayout()
        bb.addStretch(1)
        self.b_use = QtWidgets.QPushButton(tr("✔ Použít novou verzi"))
        self.b_use.setEnabled(False)
        self.b_use.clicked.connect(self.use)
        close = QtWidgets.QPushButton(tr("Zavřít"))
        close.clicked.connect(self.reject)
        bb.addWidget(self.b_use)
        bb.addWidget(close)
        lay.addLayout(bb)

    def mode(self) -> str:
        return next(k for k, rb in self.mode_buttons.items() if rb.isChecked())

    def run(self):
        self.editor.store_current()
        proj, idx = self.editor.project, self.editor.cur
        mode, extra, svc = self.mode(), self.extra.text(), self.service.currentData()
        engines = (self.editor.app_cfg or {}).get("engines", {})
        self.b_run.setEnabled(False)
        self.b_use.setEnabled(False)
        self.cancel.clear()
        self.status.setText(tr("Přepisuji kapitolu (asi {} slov)… může to trvat i několik minut.").format(
            bw.rewrite_words(proj, idx, mode)))

        def work():
            backend = bw.make_backend(svc, engines, proj.get("language") or "čeština", lambda *_: None, self.cancel,
                                      proj.get("model") if svc == proj.get("service") else "")
            return bw.rewrite_chapter(backend, proj, idx, mode, extra)

        def done(res, err):
            self.b_run.setEnabled(True)
            if err:
                self.status.setText("⚠ " + str(err))
                return
            self.result_data = res
            self.new.setPlainText(res["text"])
            self.status.setText(tr("Hotovo: {} slov (původně {}).").format(len(res["text"].split()),
                                                                          len(self.old.toPlainText().split())))
            self.b_use.setEnabled(True)

        run_bg(work, done, owner=self)

    def use(self):
        text = self.new.toPlainText().strip()
        if text:
            self.editor.apply_rewrite(text, (self.result_data or {}).get("summary", ""))
        self.accept()

    def reject(self):
        self.cancel.set()
        super().reject()
