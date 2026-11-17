"""Okno knihy → Kniha → 🎧 Audiokniha: kapitoly do MP3 hlasem Jirka, Vlasta nebo Antonín."""
from __future__ import annotations

import os
import threading
from pathlib import Path

from PySide6 import QtCore, QtWidgets

import audiobook as ab
import book_images
from i18n import tr
from qt_common import label, run_bg
from qt_common import bridge


class AudiobookDialog(QtWidgets.QDialog):
    def __init__(self, editor, parent=None):
        super().__init__(parent or editor)
        self.editor = editor
        self.cancel = threading.Event()
        self.busy = False
        editor.store_current()
        proj = editor.project
        self.setWindowTitle(tr("Audiokniha – {}").format(editor.outline.get("title") or tr("kniha")))
        self.resize(620, 520)
        lay = QtWidgets.QVBoxLayout(self)
        lay.addWidget(label("Každá kapitola se uloží jako jeden soubor MP3 (s názvem kapitoly, autorem, knihou "
                            "a obálkou) a k nim seznam skladeb .m3u – přehrajete v telefonu, v autě i v počítači.", "Hint"))
        vbox = QtWidgets.QGroupBox(tr("Hlas"))
        vg = QtWidgets.QVBoxLayout(vbox)
        self.voice_buttons: dict[str, QtWidgets.QRadioButton] = {}
        for key, v in ab.VOICES.items():
            rb = QtWidgets.QRadioButton(f"{v['name']} – {tr(v['info'])}")
            vg.addWidget(rb)
            self.voice_buttons[key] = rb
        last = (editor.app_cfg or {}).get("audiobook_voice", "jirka")
        self.voice_buttons.get(last, self.voice_buttons["jirka"]).setChecked(True)
        lay.addWidget(vbox)
        form = QtWidgets.QFormLayout()
        self.rate = QtWidgets.QDoubleSpinBox()
        self.rate.setRange(0.7, 1.5)
        self.rate.setSingleStep(0.05)
        self.rate.setValue(float((editor.app_cfg or {}).get("audiobook_rate", 1.0)))
        self.rate.setSuffix(" ×")
        form.addRow(tr("Rychlost řeči:"), self.rate)
        n = len(proj["chapters"])
        row = QtWidgets.QHBoxLayout()
        self.ch_from, self.ch_to = QtWidgets.QSpinBox(), QtWidgets.QSpinBox()
        for sb in (self.ch_from, self.ch_to):
            sb.setRange(1, max(1, n))
            sb.valueChanged.connect(self.update_info)
        self.ch_to.setValue(n)
        row.addWidget(self.ch_from)
        row.addWidget(QtWidgets.QLabel(tr("až")))
        row.addWidget(self.ch_to)
        row.addStretch(1)
        form.addRow(tr("Kapitoly:"), row)
        self.bitrate = QtWidgets.QComboBox()
        for kbps, text in ((64, "64 kb/s – nejmenší soubory"), (96, "96 kb/s – doporučeno pro řeč"), (128, "128 kb/s")):
            self.bitrate.addItem(tr(text), kbps)
        self.bitrate.setCurrentIndex(1)
        form.addRow(tr("Kvalita MP3:"), self.bitrate)
        self.folder = QtWidgets.QLabel(str(editor.export_dir()))
        self.folder.setObjectName("Hint")
        form.addRow(tr("Uloží se do:"), self.folder)
        lay.addLayout(form)
        self.info = label("", "Hint")
        lay.addWidget(self.info)
        for rb in self.voice_buttons.values():
            rb.toggled.connect(self.update_info)
        self.bar = QtWidgets.QProgressBar()
        self.bar.setRange(0, 1000)
        self.bar.setVisible(False)
        lay.addWidget(self.bar)
        self.log = QtWidgets.QPlainTextEdit()
        self.log.setReadOnly(True)
        self.log.setMaximumHeight(120)
        lay.addWidget(self.log, 1)
        bb = QtWidgets.QHBoxLayout()
        bb.addStretch(1)
        self.b_start = QtWidgets.QPushButton(tr("🎧 Namluvit"))
        self.b_start.setDefault(True)
        self.b_start.clicked.connect(self.start)
        self.b_open = QtWidgets.QPushButton(tr("📂 Otevřít složku"))
        self.b_open.setVisible(False)
        self.b_close = QtWidgets.QPushButton(tr("Zavřít"))
        self.b_close.clicked.connect(self.reject)
        for b in (self.b_start, self.b_open, self.b_close):
            bb.addWidget(b)
        lay.addLayout(bb)
        self.update_info()

    def voice(self) -> str:
        return next(k for k, rb in self.voice_buttons.items() if rb.isChecked())

    def chapters(self) -> list[int]:
        a, b = sorted((self.ch_from.value(), self.ch_to.value()))
        return list(range(a - 1, b))

    def update_info(self, *_):
        chars = ab.count_chars(self.editor.project, self.chapters())
        minutes = chars / 15 / 60  # asi 15 znaků za sekundu
        text = tr("{} znaků, asi {} h {} min poslechu.").format(f"{chars:,}".replace(",", " "), int(minutes // 60),
                                                               int(minutes % 60))
        if ab.VOICES[self.voice()]["kind"] == "azure":
            text += " " + (tr("Azure je zdarma do 500 000 znaků měsíčně – tahle část se do limitu vejde.")
                           if chars <= ab.AZURE_FREE_CHARS else
                           tr("⚠ Víc než 500 000 znaků – překročí bezplatný měsíční limit Azure (F0 pak přestane "
                              "fungovat do konce měsíce). Zvolte méně kapitol nebo hlas Jirka."))
        self.info.setText(text)

    def append(self, msg: str):
        bridge().later(lambda: self.log.appendPlainText(msg))

    def start(self):
        cfg = self.editor.app_cfg if self.editor.app_cfg is not None else {}
        voice, rate = self.voice(), self.rate.value()
        cfg["audiobook_voice"], cfg["audiobook_rate"] = voice, rate
        try:
            synth = ab.make_synth(voice, rate, cfg.get("engines", {}))
        except ab.AudiobookError as e:
            QtWidgets.QMessageBox.warning(self, tr("Audiokniha"), str(e))
            return
        proj = self.editor.project
        cover = book_images.get_image(proj, proj.get("cover") or "") if proj.get("cover") else None
        self.busy = True
        self.cancel.clear()
        self.b_start.setEnabled(False)
        self.b_close.setText(tr("Zastavit"))
        self.bar.setVisible(True)
        self.bar.setValue(0)
        out_dir = self.editor.export_dir()

        def work():
            return ab.make_audiobook(proj, out_dir, synth, self.chapters(), self.bitrate.currentData(), cover,
                                     log=self.append, progress=lambda f: bridge().later(lambda: self.bar.setValue(int(f * 1000))),
                                     cancel=self.cancel)

        def done(files, err):
            self.busy = False
            self.b_start.setEnabled(True)
            self.b_close.setText(tr("Zavřít"))
            if err:
                self.log.appendPlainText("✗ " + str(err))
                return
            self.files = files
            self.log.appendPlainText(tr("✓ Hotovo: {} souborů ve složce {}").format(len(files), files[0].parent))
            self.b_open.setVisible(True)
            try:
                self.b_open.clicked.disconnect()
            except (RuntimeError, TypeError):
                pass
            self.b_open.clicked.connect(lambda: os.startfile(str(files[0].parent)) if hasattr(os, "startfile") else None)

        run_bg(work, done, owner=self)

    def reject(self):
        if self.busy:
            self.cancel.set()
            self.log.appendPlainText(tr("Zastavuji po dokončení věty…"))
            return
        super().reject()
