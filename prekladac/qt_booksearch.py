"""Čtečka → Hledat knihy: Gutenberg a Google Books přímo v programu, obchody a knihovny v prohlížeči,
stažení knihy nebo ukázky a otevření ve čtečce."""
from __future__ import annotations

import webbrowser
from pathlib import Path

from PySide6 import QtCore, QtGui, QtWidgets
from PySide6.QtCore import Qt

import book_search as bs
from i18n import tr
from qt_common import bridge, emoji_icon, label, run_bg

LANGS = [("Všechny jazyky", ""), ("čeština", "cs"), ("slovenština", "sk"), ("angličtina", "en"), ("němčina", "de"),
         ("francouzština", "fr"), ("španělština", "es"), ("italština", "it"), ("polština", "pl"), ("ruština", "ru")]


class BookSearch(QtWidgets.QWidget):
    """open_book(cesta) = otevřít staženou knihu ve čtečce."""

    def __init__(self, cfg: dict, save_cfg, open_book, parent=None):
        super().__init__(parent)
        self.cfg, self.save_cfg, self.open_book = cfg, save_cfg, open_book
        self.books: list[bs.FoundBook] = []
        self._covers: dict[str, QtGui.QPixmap] = {}
        self._req = 0
        lay = QtWidgets.QVBoxLayout(self)
        lay.setContentsMargins(0, 6, 0, 0)

        row = QtWidgets.QHBoxLayout()
        self.q = QtWidgets.QLineEdit()
        self.q.setPlaceholderText(tr("Název knihy nebo autor…"))
        self.q.setClearButtonEnabled(True)
        self.q.setMinimumHeight(32)
        self.model = QtCore.QStringListModel(self)
        self.completer = QtWidgets.QCompleter(self.model, self)
        self.completer.setCaseSensitivity(Qt.CaseInsensitive)
        self.completer.setFilterMode(Qt.MatchContains)
        self.completer.activated.connect(lambda t: (self.q.setText(t), self.search()))
        self.q.setCompleter(self.completer)
        self.q.returnPressed.connect(self.search)
        self.q.textEdited.connect(self._typed)
        self.lang = QtWidgets.QComboBox()
        for name, code in LANGS:
            self.lang.addItem(tr(name), code)
        self.lang.setCurrentIndex(max(0, self.lang.findData(cfg.get("book_search_lang", ""))))
        self.b_go = QtWidgets.QPushButton(emoji_icon("🔎"), tr(" Hledat"))
        self.b_go.setObjectName("BigPrimary")
        self.b_go.clicked.connect(self.search)
        row.addWidget(self.q, 1)
        row.addWidget(self.lang)
        row.addWidget(self.b_go)
        lay.addLayout(row)
        self._suggest_t = QtCore.QTimer(self, singleShot=True, interval=350)
        self._suggest_t.timeout.connect(self._suggest)

        split = QtWidgets.QSplitter(Qt.Horizontal)
        left = QtWidgets.QWidget()
        ll = QtWidgets.QVBoxLayout(left)
        ll.setContentsMargins(0, 0, 0, 0)
        self.status = label(tr("Hledá v Project Gutenberg a Google Books. Volná díla se stáhnou a otevřou ve čtečce, "
                               "u ostatních je ukázka a odkaz na obchod."), "Hint")
        ll.addWidget(self.status)
        self.results = QtWidgets.QListWidget()
        self.results.setIconSize(QtCore.QSize(48, 72))
        self.results.setSpacing(2)
        self.results.currentRowChanged.connect(self.show_detail)
        self.results.itemDoubleClicked.connect(lambda _it: self.read_selected())
        ll.addWidget(self.results, 1)
        split.addWidget(left)

        right = QtWidgets.QScrollArea()
        right.setWidgetResizable(True)
        det = QtWidgets.QWidget()
        self.det = QtWidgets.QVBoxLayout(det)
        self.d_cover = QtWidgets.QLabel()
        self.d_cover.setFixedSize(120, 180)
        self.d_cover.setAlignment(Qt.AlignCenter)
        self.d_title = label("", "PageTitle")
        self.d_info = label("", "Hint")
        self.d_desc = label("", None)
        self.d_desc.setTextInteractionFlags(Qt.TextSelectableByMouse)
        btns = QtWidgets.QHBoxLayout()
        self.b_read = QtWidgets.QPushButton(emoji_icon("📥"), tr(" Stáhnout a číst"))
        self.b_read.setObjectName("BigPrimary")
        self.b_read.clicked.connect(self.read_selected)
        self.b_preview = QtWidgets.QPushButton(emoji_icon("👁️"), tr(" Ukázka"))
        self.b_preview.setToolTip(tr("Ukázka knihy na webu (Google Books / Project Gutenberg)"))
        self.b_preview.clicked.connect(lambda: self._open(self.cur().preview if self.cur() else None))
        self.b_buy = QtWidgets.QPushButton(emoji_icon("🛒"), tr(" Koupit / podrobnosti"))
        self.b_buy.clicked.connect(lambda: self._open(self.cur().buy if self.cur() else None))
        for b in (self.b_read, self.b_preview, self.b_buy):
            btns.addWidget(b)
        btns.addStretch(1)
        top = QtWidgets.QHBoxLayout()
        top.addWidget(self.d_cover, 0, Qt.AlignTop)
        tl = QtWidgets.QVBoxLayout()
        tl.addWidget(self.d_title)
        tl.addWidget(self.d_info)
        tl.addLayout(btns)
        tl.addStretch(1)
        top.addLayout(tl, 1)
        self.det.addLayout(top)
        self.det.addWidget(self.d_desc)
        # obchody a knihovny – otevřou se v prohlížeči s hledaným názvem
        self.det.addWidget(label(tr("Hledat v obchodech a knihovnách (otevře se v prohlížeči):"), "Hint"))
        grid = QtWidgets.QGridLayout()
        kinds = {"free": "🆓", "social": "🛍️", "drm": "🔒", "library": "🏛️"}
        for i, src in enumerate(bs.SOURCES):
            b = QtWidgets.QPushButton(f"{kinds[src.kind]} {src.name}")
            b.setToolTip(f"{tr(bs.KIND_LABEL[src.kind])}\n{tr(src.note)}")
            b.setStyleSheet("text-align:left; padding:4px 8px;")
            b.clicked.connect(lambda _=False, s=src: self._open(s.url(self.query() or "e-kniha")))
            grid.addWidget(b, i // 2, i % 2)
        self.det.addLayout(grid)
        self.det.addWidget(label(tr("🆓 zdarma · 🛍️ koupě bez šifrování (otevře se ve čtečce) · 🔒 jen v aplikaci "
                                    "obchodu (Kindle, Google Play) · 🏛️ knihovna"), "Hint"))
        self.det.addStretch(1)
        right.setWidget(det)
        split.addWidget(right)
        split.setSizes([420, 560])
        lay.addWidget(split, 1)
        self.show_detail(-1)

    # ---- pomocné
    def query(self) -> str:
        return self.q.text().strip()

    def cur(self) -> bs.FoundBook | None:
        i = self.results.currentRow()
        return self.books[i] if 0 <= i < len(self.books) else None

    def _open(self, url: str | None):
        if url:
            webbrowser.open(url)

    def _key(self) -> str | None:
        """Klíč Google Cloud z nastavení (pokud je) – Google Books s ním má vyšší limit dotazů."""
        try:
            import components

            k = ((self.cfg.get("engines") or {}).get("google_cloud") or {}).get("api_key") or ""
            return components.unprotect_secret(k) if k else None
        except Exception:  # noqa: BLE001
            return None

    # ---- našeptávač
    def _typed(self, text: str):
        hist = self.cfg.get("book_search_history", [])
        self.model.setStringList(bs.merge_suggestions(text, hist, []))
        if len(text.strip()) >= 3:
            self._suggest_t.start()

    def _suggest(self):
        q = self.query()
        hist = list(self.cfg.get("book_search_history", []))
        lang = self.lang.currentData() or None

        def done(res, err):
            if err or q != self.query():
                return
            self.model.setStringList(res)
            if res and self.q.hasFocus():
                self.completer.complete()

        run_bg(lambda: bs.suggest(q, hist, lang), done, owner=self)

    # ---- hledání
    def search(self):
        q = self.query()
        if not q:
            return
        self.completer.popup().hide()
        self.cfg["book_search_history"] = bs.add_history(self.cfg.get("book_search_history"), q)
        self.cfg["book_search_lang"] = self.lang.currentData()
        self.save_cfg()
        self._req += 1
        req = self._req
        self.status.setText(tr("Hledám „{}“…").format(q))
        self.b_go.setEnabled(False)
        lang, key = self.lang.currentData() or None, self._key()

        def done(res, err):
            if req != self._req:
                return
            self.b_go.setEnabled(True)
            if err:
                self.status.setText(tr("Hledání se nepodařilo: {}").format(err))
                return
            books, errors = res
            self.set_results(books)
            msg = tr("Nalezeno {} knih.").format(len(books)) if books else tr(
                "V katalozích nic – zkuste jiný název nebo obchody a knihovny vpravo.")
            if errors:
                msg += " " + tr("Nedostupné: {}").format("; ".join(e.split(":")[0] for e in errors))
            self.status.setText(msg)

        run_bg(lambda: bs.search(q, lang, key), done, owner=self)

    def set_results(self, books: list[bs.FoundBook]):
        self.books = books
        self.results.clear()
        for b in books:
            tag = "📥 " + tr("zdarma ke stažení") if b.download else ("👁 " + tr("ukázka")) if b.preview else (
                b.price or "")
            it = QtWidgets.QListWidgetItem(f"{b.title}\n{b.authors or '—'}\n{b.source} · {tag}")
            it.setIcon(emoji_icon("📗" if b.download else "📘"))
            self.results.addItem(it)
        if books:
            self.results.setCurrentRow(0)
        self._load_covers(books)

    def _load_covers(self, books):
        from free_engines import http_request

        todo = [(i, b.cover) for i, b in enumerate(books) if b.cover][:20]
        req = self._req

        def job():
            out = {}
            for i, url in todo:
                try:
                    out[i] = http_request(url, timeout=15, retries=0, service="Obálka")
                except Exception:  # noqa: BLE001
                    continue
                bridge().later(lambda i=i, d=out[i]: self._set_cover(req, i, d))
            return out

        run_bg(job, None, owner=self)

    def _set_cover(self, req: int, i: int, data: bytes):
        if req != self._req or i >= self.results.count():
            return
        pm = QtGui.QPixmap()
        if pm.loadFromData(data):
            self._covers[self.books[i].id] = pm
            self.results.item(i).setIcon(QtGui.QIcon(pm))
            if i == self.results.currentRow():
                self.show_detail(i)

    def show_detail(self, i: int):
        b = self.books[i] if 0 <= i < len(self.books) else None
        for w in (self.b_read, self.b_preview, self.b_buy):
            w.setVisible(False)
        if b is None:
            self.d_title.setText(tr("Hledání knih"))
            self.d_info.setText(tr("Napište název nebo autora a stiskněte Enter. Při psaní se nabízejí názvy."))
            self.d_desc.setText("")
            self.d_cover.setPixmap(QtGui.QPixmap())
            self.d_cover.setText("📚")
            return
        self.d_title.setText(b.title)
        info = [b.authors or "", b.source]
        if b.language:
            info.append(b.language)
        if b.price:
            info.append(b.price)
        self.d_info.setText(" · ".join(x for x in info if x))
        self.d_desc.setText(b.description)
        pm = self._covers.get(b.id)
        if pm:
            self.d_cover.setPixmap(pm.scaled(self.d_cover.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation))
        else:
            self.d_cover.setPixmap(QtGui.QPixmap())
            self.d_cover.setText("📖")
        self.b_read.setVisible(bool(b.download))
        self.b_preview.setVisible(bool(b.preview))
        self.b_buy.setVisible(bool(b.buy))

    def read_selected(self):
        b = self.cur()
        if b is None:
            return
        if not b.download:
            self._open(b.preview or b.buy)
            return
        self.download_and_open(b.download, f"{b.title} – {b.authors}" if b.authors else b.title)

    def download_and_open(self, url: str, title: str | None = None):
        self.status.setText(tr("Stahuji knihu…"))
        self.b_read.setEnabled(False)

        def done(path, err):
            self.b_read.setEnabled(True)
            if err:
                self.status.setText(tr("Stažení se nepodařilo."))
                QtWidgets.QMessageBox.warning(self, tr("Stáhnout knihu"), str(err))
                return
            self.status.setText(tr("Uloženo: {}").format(path))
            self.open_book(str(path))

        run_bg(lambda: bs.download_book(url, title), done, owner=self)


class MyBooksExtras(QtWidgets.QWidget):
    """Moje knihy: otevřít z odkazu, knihy ve složce Stažené soubory, koupené knihy v obchodech."""

    def __init__(self, open_book, download, parent=None):
        super().__init__(parent)
        self.open_book, self.download = open_book, download
        lay = QtWidgets.QVBoxLayout(self)
        lay.setContentsMargins(0, 0, 0, 0)
        b_url = QtWidgets.QPushButton(emoji_icon("🔗"), tr(" Otevřít z odkazu…"))
        b_url.setToolTip(tr("Odkaz na soubor knihy nebo ukázky (EPUB, PDF, MOBI…) – stáhne se a otevře ve čtečce"))
        b_url.clicked.connect(self.from_url)
        row = QtWidgets.QHBoxLayout()
        row.addWidget(b_url)
        row.addStretch(1)
        lay.addLayout(row)

        self.dl_box = QtWidgets.QGroupBox(tr("Ve složce Stažené soubory (knihy a ukázky z obchodů)"))
        self.dl = QtWidgets.QVBoxLayout(self.dl_box)
        lay.addWidget(self.dl_box)

        acc = QtWidgets.QGroupBox(tr("Koupené knihy v obchodech"))
        al = QtWidgets.QVBoxLayout(acc)
        al.addWidget(label(tr("Přihlaste se v prohlížeči a knihu stáhněte (EPUB nebo PDF bez šifrování) – objeví se "
                              "výše ve Stažených souborech. Program vaše hesla nezná a nikam je neposílá. Knihy "
                              "z Kindle a Google Play jsou zašifrované (DRM) – čtou se jen v jejich aplikaci."), "Hint"))
        g = QtWidgets.QGridLayout()
        for i, (name, url) in enumerate(bs.ACCOUNTS):
            b = QtWidgets.QPushButton(emoji_icon("👤"), " " + tr(name))
            b.setStyleSheet("text-align:left; padding:4px 8px;")
            b.clicked.connect(lambda _=False, u=url: webbrowser.open(u))
            g.addWidget(b, i // 2, i % 2)
        al.addLayout(g)
        lay.addWidget(acc)

    def refresh(self):
        while self.dl.count():
            w = self.dl.takeAt(0).widget()
            if w:
                w.deleteLater()
        files = bs.recent_downloads(limit=8)
        if not files:
            self.dl.addWidget(label(tr("Zatím žádné knihy – stažené EPUB, PDF a další se objeví tady."), "Hint"))
        for p in files:
            b = QtWidgets.QToolButton()
            b.setObjectName("RecentBook")
            b.setText("📥 " + (p.name if len(p.name) <= 60 else p.name[:59] + "…"))
            b.setToolTip(str(p))
            b.setSizePolicy(QtWidgets.QSizePolicy.Expanding, QtWidgets.QSizePolicy.Fixed)
            b.clicked.connect(lambda _=False, p=p: self.open_book(str(p)))
            self.dl.addWidget(b)

    def from_url(self):
        url, ok = QtWidgets.QInputDialog.getText(self, tr("Otevřít z odkazu"), tr(
            "Odkaz na soubor knihy nebo ukázky (EPUB, PDF, MOBI…):"))
        if ok and url.strip():
            self.download(url.strip(), None)
