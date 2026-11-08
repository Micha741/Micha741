"""Pomocník pro psaní v textových polích: menu pravého tlačítka, kontrola pravopisu a návrhy slov (T9).

Použití:  TextAssist(edit, options, save_options, extra_menu=fn)
  edit          QTextEdit nebo QPlainTextEdit
  options       slovník {"spell": bool, "complete": bool} (sdílený s nastavením programu)
  save_options  zavolá se po přepnutí volby v menu
  extra_menu    fn(menu, cursor) – doplní vlastní položky (např. formát písma v editoru knihy)
"""
from __future__ import annotations

from PySide6 import QtCore, QtGui, QtWidgets
from PySide6.QtCore import Qt

import spell
from qt_common import bridge, run_bg

DEFAULT_OPTIONS = {"spell": True, "complete": True, "capitalize": True}

# zkratky, po jejichž tečce věta nekončí (malými písmeny, bez tečky)
ABBREVIATIONS = {
    "např", "tzv", "tj", "tzn", "atd", "apod", "resp", "popř", "mj", "aj", "tř", "č", "s", "str", "r", "sv",
    "p", "pí", "sl", "ing", "mgr", "bc", "dr", "mudr", "judr", "phdr", "rndr", "doc", "prof", "cca", "kap",
    "obr", "tab", "viz", "min", "max", "hod", "ul", "nám", "tel", "zn", "vč", "kč", "ks", "odst", "písm",
    "srov", "pozn", "př", "angl", "lat", "něm", "fr", "st", "mil", "tis", "mld", "hl", "o", "a", "e", "u",
}
SENTENCE_END = ".!?…"


def should_capitalize(before: str) -> bool:
    """True, když další písmeno začíná větu: začátek odstavce nebo konec věty a mezera.

    `before` je text odstavce před kurzorem. Po zkratkách („např.“) a pořadových číslech („1.“) ne.
    """
    if not before.strip():
        return True  # začátek odstavce (i za odrážkou z mezer)
    if not before[-1].isspace():
        return False
    t = before.rstrip()
    t = t.rstrip("\"'“”„»«)]")  # konec věty může být v uvozovkách nebo závorce
    if not t or t[-1] not in SENTENCE_END:
        return False
    if t[-1] == ".":
        word = t[:-1].split()[-1] if t[:-1].split() else ""
        word = word.lstrip("(\"'„“«»")
        if word.isdigit():
            return t[:-1].strip() == word  # „1. Název“ na začátku řádku (osnova, seznam) ano, „5. května“ ne
        if word.lower() in ABBREVIATIONS:
            return False
        if t.endswith("..."):
            return False  # trojtečka uprostřed věty
    return True


class SpellHighlighter(QtGui.QSyntaxHighlighter):
    """Červeně vlnovkou podtrhne slova, která nejsou ve slovníku. Do textu knihy nic nepřidává."""

    def __init__(self, document, assist: "TextAssist"):
        super().__init__(document)
        self.assist = assist
        self.fmt = QtGui.QTextCharFormat()
        self.fmt.setUnderlineStyle(QtGui.QTextCharFormat.SpellCheckUnderline)
        self.fmt.setUnderlineColor(QtGui.QColor("#dc2626"))

    def highlightBlock(self, text: str):
        sp = spell.get()
        if not sp or not self.assist.spell_on():
            return
        for m in spell.WORD_RE.finditer(text):
            if not sp.check(m.group()):
                self.setFormat(m.start(), m.end() - m.start(), self.fmt)


class TextAssist(QtCore.QObject):
    def __init__(self, edit, options: dict | None = None, save_options=None, extra_menu=None,
                 spelling: bool = True):
        super().__init__(edit)
        self.edit = edit
        self.options = options if options is not None else dict(DEFAULT_OPTIONS)
        for k, v in DEFAULT_OPTIONS.items():
            self.options.setdefault(k, v)
        self.save_options = save_options or (lambda: None)
        self.extra_menu = extra_menu
        self.spelling = spelling  # False = text není česky (kontrola by hlásila skoro každé slovo)
        self._learned = None
        self._learned_rev = -1

        edit.setContextMenuPolicy(Qt.CustomContextMenu)
        edit.customContextMenuRequested.connect(self.show_menu)
        self.highlighter = SpellHighlighter(edit.document(), self)

        self.model = QtCore.QStringListModel(self)
        self.completer = QtWidgets.QCompleter(self.model, self)
        self.completer.setWidget(edit)
        self.completer.setCompletionMode(QtWidgets.QCompleter.UnfilteredPopupCompletion)
        self.completer.setCaseSensitivity(Qt.CaseInsensitive)
        self.completer.setMaxVisibleItems(7)
        self.completer.activated[str].connect(self.insert_completion)
        self.completer.popup().setObjectName("T9Popup")
        self.completer.popup().setStyleSheet(
            "QListView#T9Popup { border: 1px solid #94a3b8; border-radius: 6px; padding: 2px; "
            "background: white; font-size: 10.5pt; }"
            "QListView#T9Popup::item { padding: 3px 10px; }"
            "QListView#T9Popup::item:selected { background: #2563eb; color: white; }")
        edit.installEventFilter(self)
        self.completer.popup().installEventFilter(self)
        self.completer.popup().setToolTip("Tab = vložit návrh · šipky = vybrat · Esc = zavřít")
        self._complete_timer = QtCore.QTimer(self)
        self._complete_timer.setSingleShot(True)
        self._complete_timer.setInterval(120)
        self._complete_timer.timeout.connect(self.update_completion)

        spell.load_async(lambda: bridge().later(self.on_dictionary_ready))

    # ------------------------------------------------------------ stav
    def spell_on(self) -> bool:
        return self.spelling and bool(self.options.get("spell", True))

    def complete_on(self) -> bool:
        return bool(self.options.get("complete", True))

    def on_dictionary_ready(self):
        sp = spell.get()
        if not sp or not self.spell_on():
            return
        text = self.edit.toPlainText()
        run_bg(lambda: sp.warm(text), lambda *_: self.rehighlight())

    def rehighlight(self):
        try:
            self.highlighter.rehighlight()
        except RuntimeError:  # okno už je zavřené
            pass

    # ------------------------------------------------------------ návrhy slov (T9)
    NAV_KEYS = (Qt.Key_Up, Qt.Key_Down, Qt.Key_PageUp, Qt.Key_PageDown)

    def eventFilter(self, obj, ev):
        if ev.type() != QtCore.QEvent.KeyPress:
            return super().eventFilter(obj, ev)
        popup = self.completer.popup()
        if obj is popup and popup.isVisible():
            # Seznam návrhů je otevřený: šipky vybírají, Tab vezme (první) návrh, Enter jen vybraný.
            key = ev.key()
            cur = popup.currentIndex()
            if key == Qt.Key_Tab:
                idx = cur if cur.isValid() else self.model.index(0, 0)
                self.insert_completion(idx.data())
                popup.hide()
                return True
            if key in (Qt.Key_Return, Qt.Key_Enter) and cur.isValid():
                self.insert_completion(cur.data())
                popup.hide()
                return True
            if key == Qt.Key_Escape:
                popup.hide()
                return True
            if key in self.NAV_KEYS:
                return False  # vybírání v seznamu obstará QCompleter
            # ostatní klávesy patří textu – pošleme je do pole i přes jeho filtry (automatické ukládání)
            if not (ev.text().isalpha() or key == Qt.Key_Backspace):
                popup.hide()
            copy = QtGui.QKeyEvent(ev.type(), key, ev.modifiers(), ev.text(), ev.isAutoRepeat(), ev.count())
            QtCore.QCoreApplication.sendEvent(self.edit, copy)
            return True
        if obj is self.edit:
            txt = ev.text()
            if (len(txt) == 1 and txt.islower() and self.options.get("capitalize", True) and not self.edit.isReadOnly()
                    and not ev.modifiers() & (Qt.ControlModifier | Qt.AltModifier)):
                c = self.edit.textCursor()
                if not c.hasSelection() and should_capitalize(c.block().text()[:c.positionInBlock()]):
                    # stejná klávesa s velkým písmenem – projde i ostatními filtry (automatické ukládání)
                    up = QtGui.QKeyEvent(ev.type(), ev.key(), ev.modifiers() | Qt.ShiftModifier, txt.upper(),
                                         ev.isAutoRepeat(), ev.count())
                    QtCore.QCoreApplication.sendEvent(self.edit, up)
                    self._complete_timer.start()
                    return True
            if ev.text().isalpha() or ev.key() == Qt.Key_Backspace:
                self._complete_timer.start()
            elif ev.key() not in self.NAV_KEYS:
                self._complete_timer.stop()
        return super().eventFilter(obj, ev)

    def _prefix(self) -> str:
        c = self.edit.textCursor()
        if c.hasSelection():
            return ""
        block = c.block().text()
        pos = c.positionInBlock()
        if pos < len(block) and block[pos].isalpha():
            return ""  # kurzor uprostřed slova – nedoplňovat
        start = pos
        while start > 0 and block[start - 1].isalpha():
            start -= 1
        return block[start:pos]

    def learned(self):
        rev = self.edit.document().revision()
        if self._learned is None or rev - self._learned_rev > 40:
            self._learned = spell.learn_words(self.edit.toPlainText())
            self._learned_rev = rev
        return self._learned

    def update_completion(self):
        popup = self.completer.popup()
        sp = spell.get()
        prefix = self._prefix()
        if not self.complete_on() or not sp or len(prefix) < spell.MIN_COMPLETE or not self.edit.hasFocus():
            popup.hide()
            return
        words = sp.completions(prefix, self.learned())
        words = [w for w in words if w.lower() != prefix.lower()]
        if not words:
            popup.hide()
            return
        self.model.setStringList(words)
        self.completer.setCompletionPrefix("")
        rect = self.edit.cursorRect()
        rect.setWidth(max(180, popup.sizeHintForColumn(0) + popup.verticalScrollBar().sizeHint().width() + 24))
        self.completer.complete(rect)
        popup.setCurrentIndex(QtCore.QModelIndex())  # nic nevybráno → Enter dál dělá nový řádek

    def insert_completion(self, word: str):
        prefix = self._prefix()
        c = self.edit.textCursor()
        c.beginEditBlock()
        c.movePosition(QtGui.QTextCursor.Left, QtGui.QTextCursor.KeepAnchor, len(prefix))
        c.insertText(word)
        c.endEditBlock()
        self.edit.setTextCursor(c)

    # ------------------------------------------------------------ pravé tlačítko
    def _word_at(self, pos) -> QtGui.QTextCursor:
        c = self.edit.cursorForPosition(pos)
        c.select(QtGui.QTextCursor.WordUnderCursor)
        return c

    def build_menu(self, pos) -> QtWidgets.QMenu:
        e = self.edit
        menu = QtWidgets.QMenu(e)
        sp = spell.get()
        wc = self._word_at(pos)
        word = wc.selectedText().strip()
        sel = e.textCursor().hasSelection()
        ro = e.isReadOnly()

        if (sp and self.spell_on() and word and spell.WORD_RE.fullmatch(word) and not sp.check(word)
                and not ro):
            QtWidgets.QApplication.setOverrideCursor(Qt.WaitCursor)
            try:
                sugg = sp.suggest(word)
            finally:
                QtWidgets.QApplication.restoreOverrideCursor()
            bold = menu.font()
            bold.setBold(True)
            if sugg:
                for s in sugg:
                    a = menu.addAction(s, lambda s=s, wc=QtGui.QTextCursor(wc): self.replace_word(wc, s))
                    a.setFont(bold)
            else:
                menu.addAction("(žádné návrhy)").setEnabled(False)
            menu.addAction("➕ Přidat do slovníku", lambda: (sp.add_word(word), self.rehighlight()))
            menu.addAction("Ignorovat všude", lambda: (sp.ignore(word), self.rehighlight()))
            menu.addSeparator()

        doc = e.document()
        menu.addAction("↶ Zpět", e.undo, QtGui.QKeySequence.Undo).setEnabled(doc.isUndoAvailable() and not ro)
        menu.addAction("↷ Znovu", e.redo, QtGui.QKeySequence.Redo).setEnabled(doc.isRedoAvailable() and not ro)
        menu.addSeparator()
        menu.addAction("✂ Vyjmout", e.cut, QtGui.QKeySequence.Cut).setEnabled(sel and not ro)
        menu.addAction("📄 Kopírovat", e.copy, QtGui.QKeySequence.Copy).setEnabled(sel)
        menu.addAction("📋 Vložit", e.paste, QtGui.QKeySequence.Paste).setEnabled(e.canPaste() and not ro)
        if isinstance(e, QtWidgets.QTextEdit):
            menu.addAction("Vložit jen text (bez formátu)", self.paste_plain).setEnabled(e.canPaste() and not ro)
        menu.addAction("Odstranit", lambda: e.textCursor().removeSelectedText()).setEnabled(sel and not ro)
        menu.addSeparator()
        menu.addAction("Vybrat vše", e.selectAll, QtGui.QKeySequence.SelectAll)

        if self.extra_menu and not ro:
            menu.addSeparator()
            self.extra_menu(menu, wc)

        menu.addSeparator()
        tools = menu.addMenu("📖 Psaní a slovník")
        a = tools.addAction("Kontrola pravopisu (červené podtržení)")
        a.setCheckable(True)
        a.setChecked(bool(self.options.get("spell", True)))
        a.setEnabled(self.spelling)
        a.toggled.connect(lambda v: self.set_option("spell", v))
        a = tools.addAction("Velké písmeno na začátku věty")
        a.setCheckable(True)
        a.setChecked(bool(self.options.get("capitalize", True)))
        a.toggled.connect(lambda v: self.set_option("capitalize", v))
        a = tools.addAction("Návrhy slov při psaní (T9)")
        a.setCheckable(True)
        a.setChecked(self.complete_on())
        a.toggled.connect(lambda v: self.set_option("complete", v))
        st = spell.status()
        if st in ("missing", "error"):
            tools.addSeparator()
            tools.addAction("⬇ Stáhnout český slovník", self.download)
        elif st == "loading":
            tools.addSeparator()
            tools.addAction("Slovník se načítá…").setEnabled(False)
        return menu

    def show_menu(self, pos):
        self.build_menu(pos).exec(self.edit.mapToGlobal(pos))

    def replace_word(self, cursor: QtGui.QTextCursor, word: str):
        cursor.beginEditBlock()
        cursor.insertText(word)
        cursor.endEditBlock()

    def paste_plain(self):
        txt = QtWidgets.QApplication.clipboard().text()
        if txt:
            self.edit.textCursor().insertText(txt)

    def set_option(self, key: str, value: bool):
        self.options[key] = value
        self.save_options()
        if key == "spell":
            self.on_dictionary_ready() if value else self.rehighlight()
        if key == "complete" and not value:
            self.completer.popup().hide()

    def download(self):
        win = self.edit.window()

        def log(msg):
            bridge().later(lambda: win.statusBar().showMessage(msg, 8000)
                           if isinstance(win, QtWidgets.QMainWindow) else None)

        spell.load_async(lambda: bridge().later(self.on_dictionary_ready), download=True, log=log)
