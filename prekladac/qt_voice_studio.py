"""Nastavení → Součásti → Vlastní hlas: nahrávací studio, export pro trénování a import hotového hlasu Piper."""
from __future__ import annotations

from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets
from PySide6.QtCore import Qt

import voice_studio as vs
from i18n import tr
from qt_common import label, run_bg

COLAB_URL = "https://colab.research.google.com/github/Micha741/Micha741/blob/main/prekladac/tools/vlastni_hlas_colab.ipynb"


class StudioDialog(QtWidgets.QDialog):
    def __init__(self, parent=None, name: str = "muj_hlas"):
        super().__init__(parent)
        self.setWindowTitle(tr("Nahrávací studio – vlastní hlas"))
        self.resize(820, 560)
        self.ds = vs.Dataset(name)
        self.rec: vs.Recorder | None = None
        self.i = max(0, self.ds.next_missing())
        lay = QtWidgets.QVBoxLayout(self)
        lay.addWidget(label("Čtěte přirozeně a v klidu, jako byste předčítal knihu – vždy stejně daleko od mikrofonu, "
                            "v tiché místnosti. Na kvalitě mikrofonu záleží (stačí dobrý náhlavní). Nahrávat jde po "
                            "částech, nahrané věty se ukládají hned. Pro dobrý hlas nahrajte aspoň 300 vět (asi 30–60 minut).",
                            "Hint"))
        top = QtWidgets.QHBoxLayout()
        top.addWidget(QtWidgets.QLabel(tr("Hlas:")))
        self.name = QtWidgets.QComboBox()
        self.name.setEditable(True)
        names = sorted(p.name for p in vs.voices_root().iterdir() if p.is_dir()) or [self.ds.name]
        self.name.addItems(names)
        self.name.setCurrentText(self.ds.name)
        self.name.lineEdit().editingFinished.connect(self.switch)
        self.name.activated.connect(lambda _i: self.switch())
        top.addWidget(self.name, 1)
        self.progress = QtWidgets.QLabel()
        top.addWidget(self.progress)
        lay.addLayout(top)
        self.text = QtWidgets.QLabel()
        self.text.setWordWrap(True)
        self.text.setAlignment(Qt.AlignCenter)
        self.text.setMinimumHeight(140)
        f = self.text.font()
        f.setPointSize(18)
        self.text.setFont(f)
        self.text.setFrameShape(QtWidgets.QFrame.StyledPanel)
        lay.addWidget(self.text, 1)
        self.level = QtWidgets.QProgressBar()
        self.level.setRange(0, 32767)
        self.level.setTextVisible(False)
        self.level.setMaximumHeight(10)
        lay.addWidget(self.level)
        self.quality = label("", "Hint")
        lay.addWidget(self.quality)
        row = QtWidgets.QHBoxLayout()
        self.b_prev = QtWidgets.QPushButton("◀")
        self.b_prev.clicked.connect(lambda: self.go(self.i - 1))
        self.b_rec = QtWidgets.QPushButton(tr("🎙 Nahrát (mezerník)"))
        self.b_rec.setDefault(True)
        self.b_rec.clicked.connect(self.toggle)
        self.b_play = QtWidgets.QPushButton(tr("▶ Přehrát"))
        self.b_play.clicked.connect(self.play)
        self.b_del = QtWidgets.QPushButton(tr("🗑 Smazat nahrávku"))
        self.b_del.clicked.connect(self.delete_take)
        self.b_next = QtWidgets.QPushButton("▶▶ " + tr("Další nenahraná"))
        self.b_next.clicked.connect(lambda: self.go(self.ds.next_missing(self.i + 1)))
        for b in (self.b_prev, self.b_rec, self.b_play, self.b_del, self.b_next):
            row.addWidget(b)
        lay.addLayout(row)
        row2 = QtWidgets.QHBoxLayout()
        b_add = QtWidgets.QPushButton(tr("➕ Přidat věty z knihy…"))
        b_add.setToolTip(tr("Vybere vhodné věty (5–22 slov, bez čísel a zkratek) z knihy v češtině"))
        b_add.clicked.connect(self.add_from_book)
        b_exp = QtWidgets.QPushButton(tr("📦 Export pro trénování…"))
        b_exp.clicked.connect(self.export)
        b_help = QtWidgets.QPushButton(tr("📘 Jak natrénovat hlas"))
        b_help.clicked.connect(lambda: show_training_help(self))
        for b in (b_add, b_exp, b_help):
            row2.addWidget(b)
        row2.addStretch(1)
        close = QtWidgets.QPushButton(tr("Zavřít"))
        close.clicked.connect(self.reject)
        row2.addWidget(close)
        lay.addLayout(row2)
        self.timer = QtCore.QTimer(self)
        self.timer.setInterval(60)
        self.timer.timeout.connect(lambda: self.level.setValue(self.rec.level if self.rec else 0))
        QtGui.QShortcut(QtGui.QKeySequence(Qt.Key_Space), self, activated=self.toggle)
        self.show_sentence()

    # ---- věty
    def switch(self):
        name = self.name.currentText().strip()
        if name and vs.safe(name) != self.ds.name:
            self.ds = vs.Dataset(name)
            self.i = max(0, self.ds.next_missing())
            self.show_sentence()

    def go(self, i: int):
        if i < 0 or i >= len(self.ds.sentences) or self.rec:
            return
        self.i = i
        self.quality.setText("")
        self.show_sentence()

    def show_sentence(self):
        done = self.ds.recorded()
        self.text.setText(self.ds.sentences[self.i])
        have = self.ds.wav_path(self.i).is_file()
        self.progress.setText(tr("Věta {} z {} · nahráno {} ({:.0f} min)").format(
            self.i + 1, len(self.ds.sentences), len(done), self.ds.minutes()) + (" · ✓" if have else ""))
        self.b_play.setEnabled(have)
        self.b_del.setEnabled(have)

    # ---- nahrávání
    def toggle(self):
        if self.rec is None:
            rec = vs.Recorder()
            try:
                rec.start()
            except vs.StudioError as e:
                QtWidgets.QMessageBox.warning(self, tr("Mikrofon"), str(e))
                return
            self.rec = rec
            self.b_rec.setText(tr("⏹ Hotovo (mezerník)"))
            self.timer.start()
            return
        pcm = self.rec.stop()
        self.rec = None
        self.timer.stop()
        self.level.setValue(0)
        self.b_rec.setText(tr("🎙 Nahrát (mezerník)"))
        self.store(pcm)

    def store(self, pcm: bytes):
        q = self.ds.save_take(self.i, pcm)
        if q["ok"]:
            self.quality.setText(tr("✓ Uloženo ({} s). Další věta…").format(q["seconds"]))
            nxt = self.ds.next_missing(self.i + 1)
            if nxt >= 0:
                self.i = nxt
        else:
            self.quality.setText("⚠ " + tr("Uloženo, ale zkontrolujte: ") + ", ".join(q["problems"]) +
                                 tr(" – nahrajte znovu, nebo pokračujte ▶▶."))
        self.show_sentence()

    def play(self):
        p = self.ds.wav_path(self.i)
        if p.is_file():
            try:
                import tts_win

                tts_win.WavPlayer().play(str(p))
            except Exception as e:  # noqa: BLE001 – přehrávání jen ve Windows
                self.quality.setText(tr("Nahrávku nejde přehrát: {}").format(e))

    def delete_take(self):
        self.ds.wav_path(self.i).unlink(missing_ok=True)
        self.show_sentence()

    def add_from_book(self):
        import book_import

        f, _ = QtWidgets.QFileDialog.getOpenFileName(self, tr("Kniha v češtině (věty k nahrání)"), str(Path.home()),
                                                     book_import.OPEN_FILTER)
        if not f:
            return

        def work():
            import glossary

            return vs.sentences_from_text(glossary.sample_text(f), 800)

        def done(found, err):
            if err:
                QtWidgets.QMessageBox.warning(self, tr("Věty z knihy"), str(err))
                return
            n = self.ds.add_sentences(found)
            self.quality.setText(tr("Přidáno {} vět z knihy.").format(n))
            self.show_sentence()

        run_bg(work, done, owner=self)

    def export(self):
        f, _ = QtWidgets.QFileDialog.getSaveFileName(self, tr("Uložit data pro trénování"),
                                                     str(Path.home() / f"{self.ds.name}-hlas.zip"), "ZIP (*.zip)")
        if not f:
            return
        try:
            self.ds.export_zip(f)
        except vs.StudioError as e:
            QtWidgets.QMessageBox.warning(self, tr("Export"), str(e))
            return
        if QtWidgets.QMessageBox.question(self, tr("Export"), tr(
                "Data uložena ✓\n\n{}\n\nOtevřít teď sešit Google Colab pro trénování hlasu (v prohlížeči, zdarma)?")
                .format(f)) == QtWidgets.QMessageBox.Yes:
            import webbrowser

            webbrowser.open(COLAB_URL)

    def reject(self):
        if self.rec is not None:
            self.rec.stop()
            self.rec = None
        super().reject()


def show_training_help(parent):
    from guides import GUIDES
    from qt_common import guide_view

    d = QtWidgets.QDialog(parent)
    d.setWindowTitle(tr("Vlastní hlas – jak natrénovat"))
    d.resize(760, 560)
    lay = QtWidgets.QVBoxLayout(d)
    lay.addWidget(guide_view(GUIDES.get("vlastni_hlas", "")))
    b = QtWidgets.QPushButton(tr("Zavřít"))
    b.clicked.connect(d.accept)
    lay.addWidget(b, 0, Qt.AlignRight)
    d.exec()


def import_voice_dialog(parent) -> bool:
    f, _ = QtWidgets.QFileDialog.getOpenFileName(parent, tr("Importovat hlas Piper"), str(Path.home()),
                                                 tr("Hlas Piper (*.onnx)"))
    if not f:
        return False
    name, ok = QtWidgets.QInputDialog.getText(parent, tr("Název hlasu"), tr("Jak se má hlas jmenovat?"),
                                              text=Path(f).stem.split(".")[0])
    if not ok:
        return False
    try:
        vs.import_voice(f, name)
    except vs.StudioError as e:
        QtWidgets.QMessageBox.warning(parent, tr("Import hlasu"), str(e))
        return False
    QtWidgets.QMessageBox.information(parent, tr("Import hlasu"), tr(
        "Hlas „{}“ je připravený ✓\n\nNajdete ho ve čtečce (Čtení nahlas → hlas) i v audioknize. Funguje bez internetu.")
        .format(name))
    return True
