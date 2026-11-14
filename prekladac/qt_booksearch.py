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


DRM_TEXT = {"free": ("🔓", "bez DRM"), "drm": ("🔒", "DRM"), "none": ("—", "jen katalog"), "unknown": ("❓", "nevíme")}


class BookSearch(QtWidgets.QWidget):
    """Hledání knih jako „Získat knihy“: název / autor / klíčové slovo, zdroje se zaškrtávátky, tabulka výsledků
    s cenou, DRM a tím, jestli knihu Překladač otevře. open_book(cesta) = otevřít staženou knihu ve čtečce."""

    COLS = ("Obálka", "Název a autor", "Cena", "DRM", "Obchod", "Otevře Překladač")

    def __init__(self, cfg: dict, save_cfg, open_book, parent=None):
        super().__init__(parent)
        self.cfg, self.save_cfg, self.open_book = cfg, save_cfg, open_book
        self.books: list[bs.FoundBook] = []
        self._covers: dict[str, QtGui.QPixmap] = {}
        self._req = 0
        lay = QtWidgets.QVBoxLayout(self)
        lay.setContentsMargins(0, 6, 0, 0)

        # ---- hledaná slova
        form = QtWidgets.QGridLayout()
        self.q = QtWidgets.QLineEdit()        # název
        self.author = QtWidgets.QLineEdit()
        self.keyword = QtWidgets.QLineEdit()
        for w, ph in ((self.q, "Hledat podle názvu"), (self.author, "Hledat podle autora"),
                      (self.keyword, "Hledat podle klíčového slova (téma, ISBN…)")):
            w.setPlaceholderText(tr(ph))
            w.setClearButtonEnabled(True)
            w.returnPressed.connect(self.search)
        self.model = QtCore.QStringListModel(self)
        self.completer = QtWidgets.QCompleter(self.model, self)
        self.completer.setCaseSensitivity(Qt.CaseInsensitive)
        self.completer.setFilterMode(Qt.MatchContains)
        self.completer.activated.connect(lambda t: (self.q.setText(t), self.search()))
        self.q.setCompleter(self.completer)
        self.q.textEdited.connect(self._typed)
        self.lang = QtWidgets.QComboBox()
        for name, code in LANGS:
            self.lang.addItem(tr(name), code)
        self.lang.setCurrentIndex(max(0, self.lang.findData(cfg.get("book_search_lang", ""))))
        self.b_go = QtWidgets.QPushButton(emoji_icon("🔎"), tr(" Hledat"))
        self.b_go.setObjectName("BigPrimary")
        self.b_go.setMinimumHeight(56)
        self.b_go.clicked.connect(self.search)
        for r, (text, w) in enumerate(((tr("Název:"), self.q), (tr("Autor:"), self.author),
                                       (tr("Klíčové slovo:"), self.keyword))):
            form.addWidget(QtWidgets.QLabel(text), r, 0)
            form.addWidget(w, r, 1)
        form.addWidget(QtWidgets.QLabel(tr("Jazyk:")), 0, 2)
        form.addWidget(self.lang, 0, 3)
        form.addWidget(self.b_go, 1, 2, 2, 2)
        form.setColumnStretch(1, 1)
        lay.addLayout(form)
        self._suggest_t = QtCore.QTimer(self, singleShot=True, interval=350)
        self._suggest_t.timeout.connect(self._suggest)

        split = QtWidgets.QSplitter(Qt.Horizontal)
        # ---- vlevo: zdroje
        left = QtWidgets.QWidget()
        ll = QtWidgets.QVBoxLayout(left)
        ll.setContentsMargins(0, 0, 0, 0)
        ll.addWidget(label(tr("Hledat přímo v programu:"), None))
        chosen = set(cfg.get("book_search_sources") or bs.CATALOGS)
        self.src_checks: dict[str, QtWidgets.QCheckBox] = {}
        for sid, (name, note) in bs.CATALOGS.items():
            cb = QtWidgets.QCheckBox(tr(name))
            cb.setToolTip(tr(note))
            cb.setChecked(sid in chosen)
            cb.toggled.connect(self._remember_sources)
            self.src_checks[sid] = cb
            ll.addWidget(cb)
        ll.addSpacing(8)
        ll.addWidget(label(tr("Obchody a knihovny (otevře se v prohlížeči s hledaným textem):"), "Hint"))
        stores = QtWidgets.QListWidget()
        kinds = {"free": "🆓", "social": "🛍️", "drm": "🔒", "library": "🏛️"}
        for src in bs.SOURCES:
            if src.id == "gutenberg-web":
                continue
            it = QtWidgets.QListWidgetItem(f"{kinds[src.kind]} {src.name}")
            it.setToolTip(f"{tr(bs.KIND_LABEL[src.kind])}\n{tr(src.note)}")
            it.setData(Qt.UserRole, src.id)
            stores.addItem(it)
        stores.itemActivated.connect(self._open_store)
        stores.itemClicked.connect(self._open_store)
        self.stores = stores
        ll.addWidget(stores, 1)
        left.setMinimumWidth(230)
        split.addWidget(left)

        # ---- vpravo: tabulka výsledků a podrobnosti
        right = QtWidgets.QWidget()
        rl = QtWidgets.QVBoxLayout(right)
        rl.setContentsMargins(0, 0, 0, 0)
        self.status = label(tr("Zadejte název, autora nebo klíčové slovo a stiskněte Enter."), "Hint")
        rl.addWidget(self.status)
        self.results = QtWidgets.QTableWidget(0, len(self.COLS))
        self.results.setHorizontalHeaderLabels([tr(c) for c in self.COLS])
        self.results.setSelectionBehavior(QtWidgets.QAbstractItemView.SelectRows)
        self.results.setSelectionMode(QtWidgets.QAbstractItemView.SingleSelection)
        self.results.setEditTriggers(QtWidgets.QAbstractItemView.NoEditTriggers)
        self.results.verticalHeader().setVisible(False)
        self.results.verticalHeader().setDefaultSectionSize(76)
        self.results.setIconSize(QtCore.QSize(46, 70))
        self.results.setWordWrap(True)
        h = self.results.horizontalHeader()
        h.setSectionResizeMode(1, QtWidgets.QHeaderView.Stretch)
        for c, w in ((0, 60), (2, 90), (3, 90), (4, 150), (5, 130)):
            self.results.setColumnWidth(c, w)
        self.results.itemSelectionChanged.connect(lambda: self.show_detail(self.results.currentRow()))
        self.results.cellDoubleClicked.connect(lambda r, c: self.read_selected())
        rl.addWidget(self.results, 3)

        det = QtWidgets.QWidget()
        dl = QtWidgets.QHBoxLayout(det)
        dl.setContentsMargins(0, 4, 0, 0)
        self.d_cover = QtWidgets.QLabel()
        self.d_cover.setFixedSize(90, 135)
        self.d_cover.setAlignment(Qt.AlignCenter)
        dl.addWidget(self.d_cover, 0, Qt.AlignTop)
        tl = QtWidgets.QVBoxLayout()
        self.d_title = label("", "PageTitle")
        self.d_info = label("", "Hint")
        self.d_desc = label("", None)
        self.d_desc.setTextInteractionFlags(Qt.TextSelectableByMouse)
        btns = QtWidgets.QHBoxLayout()
        self.b_read = QtWidgets.QPushButton(emoji_icon("📥"), tr(" Stáhnout a číst"))
        self.b_read.setObjectName("BigPrimary")
        self.b_read.clicked.connect(self.read_selected)
        self.b_preview = QtWidgets.QPushButton(emoji_icon("👁️"), tr(" Ukázka"))
        self.b_preview.setToolTip(tr("Ukázka nebo stránka knihy na webu"))
        self.b_preview.clicked.connect(lambda: self._open(self.cur().preview if self.cur() else None))
        self.b_buy = QtWidgets.QPushButton(emoji_icon("🛒"), tr(" Koupit / podrobnosti"))
        self.b_buy.clicked.connect(lambda: self._open(self.cur().buy if self.cur() else None))
        for b in (self.b_read, self.b_preview, self.b_buy):
            btns.addWidget(b)
        btns.addStretch(1)
        tl.addWidget(self.d_title)
        tl.addWidget(self.d_info)
        tl.addLayout(btns)
        tl.addWidget(self.d_desc)
        tl.addStretch(1)
        dl.addLayout(tl, 1)
        scroll = QtWidgets.QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QtWidgets.QFrame.NoFrame)
        scroll.setWidget(det)
        rl.addWidget(scroll, 1)
        split.addWidget(right)
        split.setSizes([260, 900])
        lay.addWidget(split, 1)
        self.show_detail(-1)

    # ---- pomocné
    def query(self) -> str:
        return " ".join(x for x in (self.q.text().strip(), self.author.text().strip(), self.keyword.text().strip()) if x)

    def cur(self) -> bs.FoundBook | None:
        i = self.results.currentRow()
        return self.books[i] if 0 <= i < len(self.books) else None

    def _open(self, url: str | None):
        if url:
            webbrowser.open(url)

    def _open_store(self, item):
        src = next((s for s in bs.SOURCES if s.id == item.data(Qt.UserRole)), None)
        if src:
            self._open(src.url(self.query() or "e-kniha"))

    def _remember_sources(self, *_):
        self.cfg["book_search_sources"] = [s for s, cb in self.src_checks.items() if cb.isChecked()]
        self.save_cfg()

    def _key(self) -> str | None:
        """Klíč Google Cloud z nastavení (pokud je) – Google Books s ním má vyšší limit dotazů."""
        k = ((self.cfg.get("engines") or {}).get("google_cloud") or {}).get("api_key") or ""
        if k.startswith("dpapi:"):
            try:
                import components

                k = components.unprotect_secret(k)
            except Exception:  # noqa: BLE001
                k = ""
        return k or None

    # ---- našeptávač (pole Název)
    def _typed(self, text: str):
        hist = self.cfg.get("book_search_history", [])
        self.model.setStringList(bs.merge_suggestions(text, hist, []))
        if len(text.strip()) >= 3:
            self._suggest_t.start()

    def _suggest(self):
        q = self.q.text().strip()
        hist = list(self.cfg.get("book_search_history", []))
        lang = self.lang.currentData() or None

        def done(res, err):
            if err or q != self.q.text().strip():
                return
            self.model.setStringList(res)
            if res and self.q.hasFocus():
                self.completer.complete()

        run_bg(lambda: bs.suggest(q, hist, lang), done, owner=self)

    # ---- hledání
    def search(self):
        title, author, kw = self.q.text().strip(), self.author.text().strip(), self.keyword.text().strip()
        q = self.query()
        if not q:
            return
        sources = [s for s, cb in self.src_checks.items() if cb.isChecked()]
        if not sources:
            self.status.setText(tr("Zaškrtněte vlevo aspoň jeden zdroj."))
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
            books, status = res
            self.set_results(books)
            parts = []
            for sid, st in status.items():
                name = tr(bs.CATALOGS[sid][0])
                parts.append(f"{name}: " + (tr("{} knih").format(st) if st.isdigit() else tr("⚠ ") + st))
            opens = sum(1 for b in books if b.opens)
            head = (tr("Nalezeno {} knih, z toho {} otevře Překladač.").format(len(books), opens) if books
                    else tr("Nic nenalezeno – zkuste jiný název nebo obchody vlevo."))
            self.status.setText(head + "  ·  " + "  ·  ".join(parts))
            self.status.setToolTip("\n".join(parts))

        run_bg(lambda: bs.search_sources(title, author, kw, sources, lang, key), done, owner=self)

    def set_results(self, books: list[bs.FoundBook]):
        self.books = books
        t = self.results
        t.setRowCount(0)
        t.setRowCount(len(books))
        for r, b in enumerate(books):
            cover = QtWidgets.QTableWidgetItem()
            cover.setIcon(emoji_icon("📗" if b.opens else "📘"))
            t.setItem(r, 0, cover)
            t.setItem(r, 1, QtWidgets.QTableWidgetItem(f"{b.title}\n{b.authors or '—'}"))
            t.setItem(r, 2, QtWidgets.QTableWidgetItem(b.price or "—"))
            icon, text = DRM_TEXT.get(b.drm, DRM_TEXT["unknown"])
            drm = QtWidgets.QTableWidgetItem(f"{icon} {tr(text)}")
            drm.setToolTip(tr({"free": "Bez šifrování – kniha jde otevřít v jakékoli čtečce",
                               "drm": "Zašifrovaná (DRM) – čte se jen v aplikaci obchodu nebo po zapůjčení",
                               "none": "Jen záznam v katalogu – e-kniha tu není",
                               "unknown": "Obchod neuvádí, zda je kniha šifrovaná"}[b.drm if b.drm in DRM_TEXT else "unknown"]))
            t.setItem(r, 3, drm)
            t.setItem(r, 4, QtWidgets.QTableWidgetItem(tr(b.store or b.source)))
            o = QtWidgets.QTableWidgetItem("✅ " + tr("ano") if b.opens else "❌ " + tr("ne") if b.opens is False
                                           else "❓ " + tr("nevíme"))
            o.setToolTip(tr("Ano = stáhne se a otevře ve čtečce (dvojklik). Ne = šifrovaná kniha, jen v aplikaci "
                            "obchodu. Nevíme = zkontrolujte u obchodu."))
            t.setItem(r, 5, o)
        if books:
            t.selectRow(0)
        else:
            self.show_detail(-1)
        self._load_covers(books)

    def _load_covers(self, books):
        from free_engines import http_request

        todo = [(i, b.cover) for i, b in enumerate(books) if b.cover][:30]
        req = self._req

        def job():
            for i, url in todo:
                if req != self._req:
                    return
                try:
                    data = http_request(url, timeout=15, retries=0, service="Obálka")
                except Exception:  # noqa: BLE001
                    continue
                bridge().later(lambda i=i, d=data: self._set_cover(req, i, d))

        run_bg(job, None, owner=self)

    def _set_cover(self, req: int, i: int, data: bytes):
        if req != self._req or i >= self.results.rowCount():
            return
        pm = QtGui.QPixmap()
        if pm.loadFromData(data):
            self._covers[self.books[i].id] = pm
            it = self.results.item(i, 0)
            if it is not None:
                it.setIcon(QtGui.QIcon(pm))
            if i == self.results.currentRow():
                self.show_detail(i)

    def show_detail(self, i: int):
        b = self.books[i] if 0 <= i < len(self.books) else None
        for w in (self.b_read, self.b_preview, self.b_buy):
            w.setVisible(False)
        if b is None:
            self.d_title.setText(tr("Hledání knih"))
            self.d_info.setText(tr("Napište název, autora nebo klíčové slovo a stiskněte Enter. V poli Název se "
                                   "nabízejí názvy. Knihy označené ✅ se stáhnou a otevřou ve čtečce."))
            self.d_desc.setText("")
            self.d_cover.setPixmap(QtGui.QPixmap())
            self.d_cover.setText("📚")
            return
        self.d_title.setText(b.title)
        icon, text = DRM_TEXT.get(b.drm, DRM_TEXT["unknown"])
        info = [b.authors or "", tr(b.store or b.source), b.language, b.price or "", f"{icon} {tr(text)}"]
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
