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
        b_local = QtWidgets.QPushButton(tr("🖥 Trénovat v tomto počítači…"))
        b_local.setToolTip(tr("S grafikou NVIDIA (např. RTX 3050) přes WSL – bez Colabu a bez odpojování."))
        b_local.clicked.connect(lambda: LocalTrainDialog(self, self.ds.name).exec())
        b_help = QtWidgets.QPushButton(tr("📘 Jak natrénovat hlas"))
        b_help.clicked.connect(lambda: show_training_help(self))
        for b in (b_add, b_exp, b_local, b_help):
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


class LocalTrainDialog(QtWidgets.QDialog):
    """Trénink hlasu v tomto počítači (WSL + grafika NVIDIA) – bez Colabu, bez limitů a odpojování."""

    def __init__(self, parent=None, name: str = ""):
        import voice_train_local as vt

        super().__init__(parent)
        self.vt = vt
        self.setWindowTitle(tr("Trénovat hlas v tomto počítači (NVIDIA)"))
        self.resize(640, 420)
        lay = QtWidgets.QVBoxLayout(self)
        lay.addWidget(label(tr(
            "Hlas se dotrénuje z Jirky na vaší grafice NVIDIA (stačí GeForce s 6–8 GB, např. RTX 3050) ve WSL – "
            "Linuxu zabudovaném ve Windows. Trénink běží v samostatném okně, můžete ho kdykoli zavřít (Ctrl+C) "
            "a později pokračovat. Ukázku hlasu si poslechnete kdykoli během tréninku."), "Hint"))
        top = QtWidgets.QHBoxLayout()
        top.addWidget(QtWidgets.QLabel(tr("Hlas:")))
        self.name = QtWidgets.QComboBox()
        names = sorted(p.name for p in vs.voices_root().iterdir() if p.is_dir() and (p / "wavs").is_dir())
        self.name.addItems(names or [vs.safe(name or "muj_hlas")])
        if name:
            self.name.setCurrentText(vs.safe(name))
        self.name.currentTextChanged.connect(lambda _t: self.refresh())
        top.addWidget(self.name, 1)
        lay.addLayout(top)
        self.info = label("", "Hint")
        lay.addWidget(self.info)
        grid = QtWidgets.QGridLayout()
        self.b_run = QtWidgets.QPushButton(tr("▶ Spustit / pokračovat v tréninku"))
        self.b_run.clicked.connect(lambda: self.start("trenovat.bat", fresh_zip=True))
        self.b_sample = QtWidgets.QPushButton(tr("🔊 Ukázka z průběhu"))
        self.b_sample.setToolTip(tr("Vytvoří hlas z dosavadního tréninku (trénink může dál běžet), pak ho načtěte."))
        self.b_sample.clicked.connect(lambda: self.start("ukazka.bat"))
        self.b_load = QtWidgets.QPushButton(tr("📥 Načíst natrénovaný hlas"))
        self.b_load.clicked.connect(self.load)
        self.b_again = QtWidgets.QPushButton(tr("🔁 Začít znovu od Jirky"))
        self.b_again.clicked.connect(self.again)
        self.b_folder = QtWidgets.QPushButton(tr("📂 Otevřít složku"))
        self.b_folder.clicked.connect(lambda: QtGui.QDesktopServices.openUrl(
            QtCore.QUrl.fromLocalFile(str(self.vt.train_dir(self.name.currentText())))))
        b_help = QtWidgets.QPushButton(tr("📘 Návod"))
        b_help.clicked.connect(lambda: show_training_help(self))
        for i, b in enumerate((self.b_run, self.b_sample, self.b_load, self.b_again, self.b_folder, b_help)):
            grid.addWidget(b, i // 2, i % 2)
        lay.addLayout(grid)
        lay.addStretch(1)
        close = QtWidgets.QPushButton(tr("Zavřít"))
        close.clicked.connect(self.accept)
        lay.addWidget(close, 0, Qt.AlignRight)
        self.timer = QtCore.QTimer(self)
        self.timer.timeout.connect(self.refresh)
        self.timer.start(5000)
        self.refresh()

    def _dir(self) -> Path:
        return self.vt.train_dir(self.name.currentText())

    def refresh(self):
        vt = self.vt
        parts = []
        if not vt.wsl_available():
            parts.append(tr("⚠ WSL není nainstalované. Spusťte příkazový řádek jako správce, zadejte  wsl --install  "
                            "a restartujte počítač (podrobně v Návodu)."))
        ds = vs.Dataset(self.name.currentText())
        n = len(ds.recorded())
        parts.append(tr("Nahraných vět: {}").format(n) + ("" if n >= 300 else tr(" (doporučeno aspoň 300)")))
        st = vt.status(self._dir())
        if st["epoch"]:
            parts.append(tr("Trénink: epocha {} z {}").format(st["epoch"], st["epochs"]))
        if st["voice"] is not None:
            parts.append(tr("Připravený hlas: {}").format(st["voice"].name))
        self.info.setText("\n".join(parts))
        for b in (self.b_run, self.b_sample, self.b_again):
            b.setEnabled(vt.wsl_available() and n >= 50)
        self.b_load.setEnabled(st["voice"] is not None)

    def start(self, which: str, fresh_zip: bool = False):
        try:
            ds = vs.Dataset(self.name.currentText())
            d = self.vt.prepare(ds) if fresh_zip or not (self._dir() / self.vt.SCRIPT).is_file() else self._dir()
            self.vt.write_bats(d, ds.name)
            self.vt.launch(d, which)
        except (vs.StudioError, OSError) as e:
            QtWidgets.QMessageBox.warning(self, tr("Trénink hlasu"), str(e))
            return
        self.info.setText(self.info.text() + "\n" + tr("Otevřelo se okno s tréninkem – první spuštění instaluje "
                                                       "(asi 15 minut, stáhne se i Jirka 849 MB)."))

    def again(self):
        if QtWidgets.QMessageBox.question(self, tr("Začít znovu"), tr(
                "Smazat dosavadní průběh tréninku a začít znovu od Jirky?\n(Nahrávky zůstanou.)")) \
                == QtWidgets.QMessageBox.Yes:
            self.start("znovu_od_jirky.bat", fresh_zip=True)

    def load(self):
        try:
            dst = self.vt.load_voice(self._dir())
        except vs.StudioError as e:
            QtWidgets.QMessageBox.warning(self, tr("Načíst hlas"), str(e))
            return
        QtWidgets.QMessageBox.information(self, tr("Načíst hlas"), tr(
            "Hlas „{}“ je připravený ✓\n\nNajdete ho ve čtečce (Čtení nahlas → hlas) i v audioknize. "
            "Po dalším tréninku ho načtěte znovu – nahradí se.").format(dst.stem))
