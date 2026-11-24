"""Synchronizace s telefonem přes Google Disk – okno přihlášení, knihy na Disku a pokračování ve čtení.

Ve čtečce: při otevření knihy se stáhne místo čtení, záložky a označené z Disku (když jste mezitím četli v telefonu,
kniha se otevře tam), při čtení se změny po chvíli nahrají zpět. Kniha se na Disk nahraje jako EPUB, aby se dala
otevřít v telefonu.
"""
from __future__ import annotations

import json
import re
import webbrowser
from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets
from PySide6.QtCore import Qt

import cloud_sync
import components
from i18n import tr
from qt_common import emoji_icon, label, run_bg


def gdrive_cfg(cfg: dict) -> dict:
    return (cfg or {}).get("engines", {}).get("gdrive", {})


def drive_from_cfg(cfg: dict, need_login: bool = True) -> cloud_sync.GoogleDrive | None:
    g = gdrive_cfg(cfg)
    if not g.get("client_id") or (need_login and not g.get("refresh_token")):
        return None
    return cloud_sync.GoogleDrive(g.get("client_id", ""), g.get("client_secret", ""), g.get("refresh_token", ""))


def storage_from_cfg(cfg: dict):
    """Úložiště pro synchronizaci: Google Disk, nebo Synology / WebDAV (podle volby v Čtečce → Moje knihy)."""
    return cloud_sync.storage_from_config((cfg or {}).get("engines", {}), (cfg or {}).get("cloud_provider", ""))


def provider_of(cfg: dict) -> str:
    st = storage_from_cfg(cfg)
    return "webdav" if isinstance(st, cloud_sync.WebDav) else (cfg or {}).get("cloud_provider") or "gdrive"


def cloud_dir() -> Path:
    d = components.app_dir() / "cloud"
    d.mkdir(parents=True, exist_ok=True)
    return d


def cache_path() -> Path:
    return cloud_dir() / "posledni_stav.json"


def load_cache() -> dict:
    try:
        return json.loads(cache_path().read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return {"v": 1, "books": {}}


def save_cache(state: dict) -> None:
    try:
        cache_path().write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
    except OSError:
        pass


def safe_name(s: str) -> str:
    return re.sub(r'[\\/:*?"<>|]+', "_", s or "kniha").strip()[:80] or "kniha"


# ------------------------------------------------------------------ přihlášení kódem
class LoginDialog(QtWidgets.QDialog):
    """Přihlášení ke Google Disku: program ukáže kód, uživatel ho zadá na google.com/device (i v telefonu)."""

    def __init__(self, cfg: dict, save_cfg, parent=None):
        super().__init__(parent)
        self.cfg, self.save_cfg = cfg, save_cfg
        self.setWindowTitle(tr("Přihlášení ke Google Disku"))
        self.resize(480, 300)
        lay = QtWidgets.QVBoxLayout(self)
        self.info = label(tr("Připojuji se ke Googlu…"))
        lay.addWidget(self.info)
        self.code = QtWidgets.QLabel("")
        self.code.setAlignment(Qt.AlignCenter)
        self.code.setTextInteractionFlags(Qt.TextSelectableByMouse)
        f = self.code.font()
        f.setPointSize(26)
        f.setBold(True)
        self.code.setFont(f)
        lay.addWidget(self.code)
        row = QtWidgets.QHBoxLayout()
        self.b_open = QtWidgets.QPushButton(emoji_icon("🌐"), tr(" Otevřít google.com/device"))
        self.b_open.setEnabled(False)
        self.b_copy = QtWidgets.QPushButton(emoji_icon("📋"), tr(" Kopírovat kód"))
        self.b_copy.setEnabled(False)
        row.addWidget(self.b_open)
        row.addWidget(self.b_copy)
        lay.addLayout(row)
        lay.addStretch(1)
        bb = QtWidgets.QDialogButtonBox(QtWidgets.QDialogButtonBox.Cancel)
        bb.rejected.connect(self.reject)
        lay.addWidget(bb)
        self.drive = drive_from_cfg(cfg, need_login=False) or cloud_sync.GoogleDrive("", "")
        self.timer = QtCore.QTimer(self)
        self.timer.timeout.connect(self._poll)
        self.device = None
        self._busy = False
        run_bg(self.drive.device_start, self._started, owner=self)

    def _started(self, res, err):
        if err:
            self.info.setText("⚠ " + str(err))
            return
        self.device = res
        url = res.get("verification_url", "https://www.google.com/device")
        self.info.setText(tr("1. Otevřete {} (v počítači nebo v telefonu) a přihlaste se účtem Google.\n"
                             "2. Zadejte tento kód a povolte přístup k Disku:").format(url))
        self.code.setText(res.get("user_code", ""))
        self.b_open.setEnabled(True)
        self.b_copy.setEnabled(True)
        self.b_open.clicked.connect(lambda: webbrowser.open(url))
        self.b_copy.clicked.connect(lambda: QtGui.QGuiApplication.clipboard().setText(res.get("user_code", "")))
        self.timer.start(max(5, int(res.get("interval", 5))) * 1000)

    def _poll(self):
        if self._busy or not self.device:
            return
        self._busy = True
        run_bg(lambda: self.drive.device_poll(self.device["device_code"]), self._polled, owner=self)

    def _polled(self, ok, err):
        self._busy = False
        if err:
            self.timer.stop()
            self.info.setText("⚠ " + str(err))
            return
        if ok:
            self.timer.stop()
            self.cfg.setdefault("engines", {}).setdefault("gdrive", {})["refresh_token"] = self.drive.refresh_token
            self.save_cfg()
            self.accept()


# ------------------------------------------------------------------ knihy na Disku (Čtečka → Moje knihy)
class CloudBooksBox(QtWidgets.QGroupBox):
    """☁ Google Disk: synchronizace a knihy nahrané z telefonu nebo z jiného počítače."""

    def __init__(self, cfg: dict, save_cfg, open_path, parent=None):
        super().__init__(tr("☁ Knihy a čtení i v telefonu (Google Disk nebo Synology)"), parent)
        self.cfg, self.save_cfg, self.open_path = cfg, save_cfg, open_path
        lay = QtWidgets.QVBoxLayout(self)
        self.status = label("", "Hint")
        lay.addWidget(self.status)
        row = QtWidgets.QHBoxLayout()
        self.provider = QtWidgets.QComboBox()
        self.provider.addItem(emoji_icon("☁"), tr("Google Disk"), "gdrive")
        self.provider.addItem(emoji_icon("🗄"), tr("Synology / WebDAV"), "webdav")
        self.provider.setToolTip(tr("Kam se ukládají knihy a místo čtení – v telefonu zvolte totéž"))
        self.provider.setCurrentIndex(max(0, self.provider.findData(provider_of(cfg))))
        self.provider.currentIndexChanged.connect(self._provider_changed)
        row.addWidget(self.provider)
        self.b_login = QtWidgets.QPushButton(emoji_icon("🔑"), tr(" Přihlásit…"))
        self.b_login.clicked.connect(self.login)
        self.b_sync = QtWidgets.QPushButton(emoji_icon("🔄"), tr(" Synchronizovat"))
        self.b_sync.setToolTip(tr("Stáhne seznam knih a míst čtení z Disku (z telefonu) a nahraje změny z počítače"))
        self.b_sync.clicked.connect(self.sync)
        row.addWidget(self.b_login)
        row.addWidget(self.b_sync)
        row.addStretch(1)
        lay.addLayout(row)
        self.list = QtWidgets.QVBoxLayout()
        lay.addLayout(self.list)
        self.refresh()

    def _provider_changed(self):
        self.cfg["cloud_provider"] = self.provider.currentData()
        self.save_cfg()
        save_cache({"v": 1, "books": {}})  # seznam knih patří k úložišti
        self.refresh()

    def refresh(self):
        g = gdrive_cfg(self.cfg)
        if self.provider.currentData() == "webdav":
            ok = storage_from_cfg(self.cfg) is not None
            self.b_login.setVisible(False)
            self.b_sync.setEnabled(ok)
            self.status.setText(tr("Synology / WebDAV: místo čtení, záložky a označené se synchronizují samy při čtení.")
                                if ok else tr("Nastavení → Služby a klíče → Synology / WebDAV: vyplňte adresu, "
                                              "uživatele a heslo (podle Návodu) a klikněte na Otestovat."))
            self.show_books(load_cache())
            return
        self.b_login.setVisible(True)
        if not g.get("client_id"):
            self.status.setText(tr("Nastavení → Služby a klíče → Google Disk: vyplňte ID klienta a tajný klíč "
                                   "(podle Návodu), pak se tady přihlaste."))
        elif not g.get("refresh_token"):
            self.status.setText(tr("Nejste přihlášeni. Klikněte na Přihlásit – stejným způsobem se přihlásíte i v telefonu."))
        else:
            self.status.setText(tr("Přihlášeno. Místo čtení, záložky a označené se synchronizují samy při čtení."))
        self.b_sync.setEnabled(bool(g.get("refresh_token")))
        self.b_login.setText(tr(" Přihlásit znovu…") if g.get("refresh_token") else tr(" Přihlásit…"))
        self.show_books(load_cache())

    def login(self):
        if not gdrive_cfg(self.cfg).get("client_id"):
            QtWidgets.QMessageBox.information(self, tr("Google Disk"), tr(
                "Nejdřív vyplňte ID klienta a tajný klíč klienta v Nastavení → Služby a klíče → Google Disk "
                "(📘 Návod popisuje, jak je jednou vytvořit)."))
            return
        if LoginDialog(self.cfg, self.save_cfg, self).exec():
            self.refresh()
            self.sync()

    def sync(self):
        d = storage_from_cfg(self.cfg)
        if not d:
            return
        self.b_sync.setEnabled(False)
        self.status.setText(tr("Synchronizuji…"))

        def work():
            st = d.sync(load_cache())
            save_cache(st)
            return st

        def done(st, err):
            self.b_sync.setEnabled(True)
            if err:
                self.status.setText("⚠ " + str(err))
                return
            n = sum(1 for e in st["books"].values() if e.get("file"))
            self.status.setText(tr("Synchronizováno ({}) – uloženo {} knih.").format(d.name, n))
            self.show_books(st)

        run_bg(work, done, owner=self)

    def show_books(self, st: dict):
        while self.list.count():
            w = self.list.takeAt(0).widget()
            if w:
                w.deleteLater()
        for key, e in sorted(st.get("books", {}).items(), key=lambda kv: -((kv[1].get("pos") or {}).get("at", 0))):
            if not e.get("file"):
                continue
            p = e.get("pos") or {}
            where = (tr(" · naposledy: {}, kapitola {}").format(p.get("device", ""), int(p.get("chapter", 0)) + 1)
                     if p else "")
            b = QtWidgets.QToolButton()
            b.setObjectName("RecentBook")
            b.setText(f"☁ {e.get('title') or e['file'].get('name')}{' – ' + e['author'] if e.get('author') else ''}{where}")
            b.setSizePolicy(QtWidgets.QSizePolicy.Expanding, QtWidgets.QSizePolicy.Fixed)
            b.setToolTip(tr("Stáhnout z Disku a číst"))
            b.clicked.connect(lambda _=False, e=e: self.open_cloud(e))
            self.list.addWidget(b)

    def open_cloud(self, e: dict):
        d = storage_from_cfg(self.cfg)
        if not d:
            return
        target = cloud_dir() / safe_name(e["file"].get("name") or (e.get("title", "kniha") + ".epub"))
        self.status.setText(tr("Stahuji z Disku: {}…").format(e.get("title", "")))

        def work():
            target.write_bytes(d.download(e["file"]["id"]))
            return str(target)

        def done(path, err):
            if err:
                self.status.setText("⚠ " + str(err))
                return
            self.status.setText(tr("Staženo: {}").format(Path(path).name))
            self.open_path(path)

        run_bg(work, done, owner=self)


# ------------------------------------------------------------------ čtečka: pokračování a nahrávání změn
class ReaderCloud(QtCore.QObject):
    """Připojí čtečku k Disku: při otevření stáhne stav knihy, při čtení po chvíli nahraje změny a knihu."""

    PUSH_DELAY = 20_000

    def __init__(self, reader, drive: cloud_sync.Storage):
        super().__init__(reader)
        self.reader, self.drive = reader, drive
        self.key = cloud_sync.book_key(reader.project.get("outline", {}).get("title", ""), reader.project.get("author", ""))
        self.timer = QtCore.QTimer(self)
        self.timer.setSingleShot(True)
        self.timer.setInterval(self.PUSH_DELAY)
        self.timer.timeout.connect(self.push)
        self._busy = False
        self.pull()

    @classmethod
    def attach(cls, reader):
        d = storage_from_cfg(reader.app_cfg)
        return cls(reader, d) if d and reader.app_cfg.get("cloud_sync", True) else None

    def changed(self):
        self.timer.start()

    def _work(self):
        """Ve vlákně: sloučí stav knihy s Diskem a nahraje knihu, když na Disku ještě není."""
        local = {"v": 1, "books": {self.key: self.entry}}
        st = self.drive.sync(local)
        e = st["books"].get(self.key) or {}
        if not e.get("file"):
            import ebook

            data = ebook.write_epub(ebook.from_project(self.reader.project))
            name = safe_name(e.get("title") or "kniha") + ".epub"
            fid = self.drive.upload(name, data, "application/epub+zip")
            e["file"] = {"id": fid, "name": name, "at": cloud_sync.now_ms()}
            st = self.drive.sync({"v": 1, "books": {self.key: e}})
        cache = load_cache()
        cache.setdefault("books", {}).update(st["books"])
        save_cache(cache)
        return st["books"].get(self.key) or e

    def pull(self):
        self.entry = self.reader.sync_entry()
        self._busy = True
        run_bg(self._work, self._pulled, owner=self.reader)

    def _pulled(self, e, err):
        self._busy = False
        if err:
            self.reader.notify("☁ " + str(err))
            return
        if self.reader.apply_sync(e):
            p = e.get("pos") or {}
            self.reader.notify(tr("☁ Pokračujete tam, kde jste skončil ({}, kapitola {}).").format(
                p.get("device", ""), int(p.get("chapter", 0)) + 1))

    def push(self):
        if self._busy:
            self.timer.start()
            return
        self.entry = self.reader.sync_entry()
        self._busy = True

        def done(e, err):
            self._busy = False

        run_bg(self._work, done, owner=self.reader)


def qr_pixmap(text: str, size: int = 320) -> QtGui.QPixmap:
    """QR kód jako obrázek (černé moduly na bílém, s tichým okrajem)."""
    import settings_transfer

    m = settings_transfer.qr_matrix(text)
    n = len(m)
    img = QtGui.QImage(n, n, QtGui.QImage.Format_RGB32)
    img.fill(QtGui.QColor("white"))
    for y, row in enumerate(m):
        for x, on in enumerate(row):
            if on:
                img.setPixel(x, y, 0xFF000000)
    return QtGui.QPixmap.fromImage(img.scaled(size, size, Qt.KeepAspectRatio, Qt.FastTransformation))


class TransferDialog(QtWidgets.QDialog):
    """📱 Přenést do telefonu: QR kód s nastavením synchronizace (bez opisování klíčů v telefonu)."""

    def __init__(self, cfg: dict, parent=None):
        import settings_transfer
        from qt_reader import device_name

        super().__init__(parent)
        self.setWindowTitle(tr("Přenést nastavení do telefonu"))
        lay = QtWidgets.QVBoxLayout(self)
        data = settings_transfer.payload(cfg.get("engines", {}), provider_of(cfg), device_name())
        self.link = settings_transfer.encode(data)
        what = []
        if "g" in data:
            what.append(tr("Google Disk") + (tr(" (i s přihlášením)") if data["g"].get("t") else ""))
        if "w" in data:
            what.append(tr("Synology / WebDAV"))
        lay.addWidget(label(tr("V telefonu otevřete Překladač → Nastavení → Služby a klíče → „📷 Načíst z počítače“ "
                               "a vyfoťte tento kód. Nebo ho naskenujte fotoaparátem telefonu (Google Lens) – "
                               "otevře se Překladač a nastavení se načte.") + "\n" +
                            tr("Přenese se: {}.").format(", ".join(what))))
        self.qr = QtWidgets.QLabel()
        self.qr.setAlignment(Qt.AlignCenter)
        self.qr.setPixmap(qr_pixmap(self.link, 360))
        self.qr.setStyleSheet("background: white; padding: 8px;")
        lay.addWidget(self.qr)
        warn = label(tr("⚠ Kód obsahuje přístup k vašemu úložišti (klíč, přihlášení, heslo). Ukazujte ho jen svému "
                        "telefonu a okno po přenosu zavřete."), "Hint")
        warn.setStyleSheet("color: #c0392b;")
        lay.addWidget(warn)
        b = QtWidgets.QPushButton(tr("Zavřít"))
        b.clicked.connect(self.accept)
        lay.addWidget(b, 0, Qt.AlignRight)
        QtCore.QTimer.singleShot(5 * 60 * 1000, self.accept)  # po 5 minutách se okno samo zavře


def show_transfer(cfg: dict, parent=None) -> bool:
    import settings_transfer

    try:
        TransferDialog(cfg, parent).exec()
    except settings_transfer.TransferError as e:
        QtWidgets.QMessageBox.information(parent, tr("Přenést do telefonu"), str(e))
        return False
    return True
