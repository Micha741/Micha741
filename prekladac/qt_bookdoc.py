"""Kniha jako QTextDocument – pro tisk, náhled tisku a uložení do ODT (OpenDocument).

Titulní strana (název, autor), každá kapitola od nové stránky s nadpisem, formátování z editoru
a značky [[STRANA]] jako skutečné zalomení stránky.
"""
from __future__ import annotations

from PySide6 import QtCore, QtGui

from html_docx import PAGE_BREAK, plain_to_html

Qt = QtCore.Qt


def book_document(project: dict, chapter_index: int | None = None, title: str | None = None,
                  author: str | None = None) -> QtGui.QTextDocument:
    """Celá kniha (chapter_index=None), nebo jen jedna kapitola bez titulní strany."""
    fmt = project.get("format", {})
    outline = project.get("outline", {})
    doc = QtGui.QTextDocument()
    base = QtGui.QFont(fmt.get("font") or "Georgia")
    base.setPointSizeF(float(fmt.get("size") or 12))
    doc.setDefaultFont(base)
    import book_images

    for name in project.get("images") or {}:  # obrázky knihy jako zdroje dokumentu (tisk, ODT)
        img = QtGui.QImage.fromData(book_images.get_image(project, name) or b"")
        if not img.isNull():
            doc.addResource(QtGui.QTextDocument.ImageResource, QtCore.QUrl(name), img)
    cur = QtGui.QTextCursor(doc)
    title = (title if title is not None else outline.get("title", "")) or ""
    author = (author if author is not None else project.get("author", "")) or ""
    chapters = list(enumerate(project.get("chapters", [])))
    whole = chapter_index is None
    if not whole:
        chapters = [chapters[chapter_index]] if 0 <= chapter_index < len(chapters) else []
    first = True

    def block(page_break: bool, align=Qt.AlignLeft, top=0.0, bottom=0.0):
        nonlocal first
        f = QtGui.QTextBlockFormat()
        f.setAlignment(align)
        f.setTopMargin(top)
        f.setBottomMargin(bottom)
        if page_break and not first:
            f.setPageBreakPolicy(QtGui.QTextFormat.PageBreak_AlwaysBefore)
        if first:
            cur.setBlockFormat(f)
            first = False
        else:
            cur.insertBlock(f)

    def text(t: str, size: float, bold=True):
        cf = QtGui.QTextCharFormat()
        cf.setFont(base)
        cf.setFontPointSize(size)
        cf.setFontWeight(QtGui.QFont.Bold if bold else QtGui.QFont.Normal)
        cur.insertText(t, cf)

    cover = project.get("cover")
    if whole and cover and (project.get("images") or {}).get(cover):  # obálka přes celou stránku
        img = doc.resource(QtGui.QTextDocument.ImageResource, QtCore.QUrl(cover))
        block(False, Qt.AlignHCenter)
        f = QtGui.QTextImageFormat()
        f.setName(cover)
        w, h = (img.width(), img.height()) if hasattr(img, "width") else (600, 900)
        f.setWidth(min(600.0, 860.0 * w / max(1, h)))
        cur.insertImage(f)
    if whole:  # titulní strana (po obálce od nové stránky)
        block(True, Qt.AlignHCenter, top=220)
        text(title, 26)
        if author:
            block(False, Qt.AlignHCenter, top=24)
            text(author, 15, bold=False)
    titles = outline.get("chapters", [])
    for i, ch in chapters:
        name = ch.get("title") or (titles[i]["title"] if i < len(titles) else f"Kapitola {i + 1}")
        block(True, top=12, bottom=18)
        text(f"{i + 1}. {name}", 18)
        block(False)
        cur.setCharFormat(QtGui.QTextCharFormat())
        cur.insertFragment(QtGui.QTextDocumentFragment.fromHtml(ch.get("html") or plain_to_html(ch.get("text", ""))))
    # značky [[STRANA]] z editoru → skutečné zalomení stránky
    b = doc.begin()
    while b.isValid():
        nxt = b.next()
        if b.text().strip() == PAGE_BREAK and nxt.isValid():
            c = QtGui.QTextCursor(nxt)
            f = nxt.blockFormat()
            f.setPageBreakPolicy(QtGui.QTextFormat.PageBreak_AlwaysBefore)
            c.setBlockFormat(f)
            c = QtGui.QTextCursor(b)
            c.select(QtGui.QTextCursor.BlockUnderCursor)
            c.removeSelectedText()
        b = nxt
    return doc


def write_odt(project: dict, dst: str) -> None:
    """Uloží knihu jako ODT (LibreOffice/OpenOffice Writer) se zachovaným formátováním."""
    w = QtGui.QTextDocumentWriter(str(dst))
    w.setFormat(b"odf")
    if not w.write(book_document(project)):
        raise OSError(f"ODT se nepodařilo zapsat: {dst}")
