"""Nastavení → Vzhled: výběr, instalace, export a odebrání skinů."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets
from PySide6.QtCore import Qt

import skins
from i18n import tr
from qt_common import label


def swatch(skin: skins.Skin, w: int = 64, h: int = 40) -> QtGui.QIcon:
    """Malý náhled skinu: postranní panel, pás karet, plocha a stránka."""
    pm = QtGui.QPixmap(w, h)
    pm.fill(QtGui.QColor(skin.color("canvas")))
    p = QtGui.QPainter(pm)
    c = lambda t: QtGui.QColor(skin.color(t))  # noqa: E731
    p.fillRect(0, 0, 14, h, c("sidebar"))
    p.fillRect(3, 6, 8, 5, c("accent"))
    p.fillRect(14, 0, w - 14, 9, c("surface"))
    p.fillRect(17, 3, 10, 4, c("soft_border"))
    p.fillRect(26, 13, w - 34, h - 16, c("paper"))
    p.setPen(c("doc_text"))
    for y in (19, 25, 31):
        p.drawLine(30, y, w - 13, y)
    p.setPen(c("border"))
    p.drawRect(0, 0, w - 1, h - 1)
    p.end()
    return QtGui.QIcon(pm)


def apply_logo(lb: QtWidgets.QLabel, fallback: QtGui.QIcon, size: int = 36) -> None:
    logo = skins.current().images.get("logo")
    pm = QtGui.QPixmap(str(logo)) if logo else QtGui.QPixmap()
    if pm.isNull():
        pm = fallback.pixmap(QtCore.QSize(size, size))
    else:
        pm = pm.scaled(size * 2, size * 2, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        pm.setDevicePixelRatio(2)
    lb.setPixmap(pm)


class SkinsTab(QtWidgets.QWidget):
    """Seznam skinů; klepnutím se vzhled hned změní a zapamatuje."""

    def __init__(self, cfg: dict, save_cfg):
        super().__init__()
        self.cfg, self.save_cfg = cfg, save_cfg
        self.setAcceptDrops(True)
        lay = QtWidgets.QVBoxLayout(self)
        lay.addWidget(label("Skin mění barvy, písmo, logo, pozadí a ikony programu – podobně jako ve Winampu. "
                            "Vzhled se změní hned. Další skiny se dají doinstalovat ze souboru .skin "
                            "(stačí ho sem přetáhnout nebo na něj ve Windows dvakrát klepnout).", "Hint"))
        self.list = QtWidgets.QListWidget()
        self.list.setObjectName("SkinList")
        self.list.setIconSize(QtCore.QSize(64, 40))
        self.list.setMinimumHeight(220)
        self.list.currentItemChanged.connect(self._selected)
        lay.addWidget(self.list, 1)
        self.info = label("", "Hint")
        lay.addWidget(self.info)
        row = QtWidgets.QGridLayout()  # 2×2 – na malé obrazovce se tlačítka nevejdou vedle sebe
        b_inst = QtWidgets.QPushButton(tr("📥 Instalovat skin…"))
        b_inst.clicked.connect(self.install_dialog)
        self.b_export = QtWidgets.QPushButton(tr("📤 Uložit jako šablonu…"))
        self.b_export.setToolTip(tr("Uloží vybraný skin do souboru .skin – můžete ho upravit a poslat dál. "
                                    "Uvnitř je NAVOD.txt."))
        self.b_export.clicked.connect(self.export_dialog)
        self.b_remove = QtWidgets.QPushButton(tr("🗑️ Odebrat"))
        self.b_remove.setObjectName("Danger")
        self.b_remove.clicked.connect(self.remove_selected)
        b_dir = QtWidgets.QPushButton(tr("📁 Složka skinů"))
        b_dir.clicked.connect(lambda: open_folder(skins.skins_dir()))
        for i, b in enumerate((b_inst, self.b_export, self.b_remove, b_dir)):
            row.addWidget(b, i // 2, i % 2)
        row.setColumnStretch(2, 1)
        lay.addLayout(row)
        self.reload()

    # ---------------------------------------------------------------- seznam
    def reload(self, select: str | None = None):
        select = select or self.cfg.get("skin") or "default"
        self.list.blockSignals(True)
        self.list.clear()
        for s in skins.all_skins():
            text = tr(s.name) if s.builtin else s.name
            if s.author and not s.builtin:
                text += f"  –  {s.author}"
            it = QtWidgets.QListWidgetItem(swatch(s), text)
            it.setData(Qt.UserRole, s.id)
            it.setToolTip(tr(s.description) if s.builtin else s.description)
            self.list.addItem(it)
            if s.id == select:
                self.list.setCurrentItem(it)
        self.list.blockSignals(False)
        self._update_info()

    def selected(self) -> skins.Skin:
        it = self.list.currentItem()
        return skins.find(it.data(Qt.UserRole) if it else None)

    def _update_info(self):
        s = self.selected()
        desc = tr(s.description) if s.builtin else s.description
        extra = []
        if not s.builtin:
            if s.images:
                extra.append(tr("vlastní obrázky"))
            if s.folder and (s.folder / "icons").is_dir():
                extra.append(tr("vlastní ikony"))
        self.info.setText(desc + (f"  ({', '.join(extra)})" if extra else ""))
        self.b_remove.setEnabled(not s.builtin)

    def _selected(self, *_):
        self.use(self.selected())

    def use(self, skin: skins.Skin):
        skins.apply(skin)
        self.cfg["skin"] = skin.id
        self.save_cfg()
        self._update_info()

    # ---------------------------------------------------------------- akce
    def install_file(self, path: str) -> bool:
        try:
            skin = skins.install(path)
        except skins.SkinError as e:
            QtWidgets.QMessageBox.warning(self, tr("Skin"), tr("Skin nejde nainstalovat:") + "\n" + str(e))
            return False
        except Exception as e:  # noqa: BLE001
            QtWidgets.QMessageBox.warning(self, tr("Skin"), tr("Skin nejde nainstalovat:") + f"\n{e}")
            return False
        self.reload(select=skin.id)
        self.use(skin)
        return True

    def install_dialog(self):
        f, _ = QtWidgets.QFileDialog.getOpenFileName(self, tr("Instalovat skin"), "",
                                                     tr("Skin") + " (*.skin *.zip *.json)")
        if f:
            self.install_file(f)

    def export_dialog(self):
        s = self.selected()
        f, _ = QtWidgets.QFileDialog.getSaveFileName(self, tr("Uložit skin"),
                                                     str(Path.home() / f"{skins.slug(s.name)}.skin"),
                                                     tr("Skin") + " (*.skin)")
        if f:
            out = skins.export(s, f)
            QtWidgets.QMessageBox.information(self, tr("Skin"), tr("Skin uložen:") + f"\n{out}\n\n" +
                                              tr("Přejmenujte ho na .zip, rozbalte a upravte barvy v skin.json – "
                                                 "návod je v souboru NAVOD.txt."))

    def remove_selected(self):
        s = self.selected()
        if s.builtin:
            return
        if QtWidgets.QMessageBox.question(self, tr("Skin"), tr("Odebrat skin?") + f"\n{s.name}") != \
                QtWidgets.QMessageBox.Yes:
            return
        skins.remove(s)
        self.cfg["skin"] = "default"
        self.reload(select="default")
        self.use(skins.find("default"))

    # ---------------------------------------------------------------- přetažení souboru
    def dragEnterEvent(self, e):
        if any(u.toLocalFile().lower().endswith((".skin", ".zip", ".json")) for u in e.mimeData().urls()):
            e.acceptProposedAction()

    def dropEvent(self, e):
        for u in e.mimeData().urls():
            if u.toLocalFile():
                self.install_file(u.toLocalFile())
        e.acceptProposedAction()


def open_folder(path: Path) -> None:
    try:
        if sys.platform == "win32":
            os.startfile(str(path))  # noqa: S606
        else:
            subprocess.Popen(["xdg-open", str(path)])  # noqa: S603,S607
    except Exception:  # noqa: BLE001
        QtGui.QDesktopServices.openUrl(QtCore.QUrl.fromLocalFile(str(path)))
