"""Pravítka pro editor knihy (jako ve Wordu).

HRuler – vodorovné pravítko nad stránkou: centimetry od levého okraje textu, šedé okraje stránky
         a značky odsazení aktuálního odstavce, které jde myší posouvat:
           ▽ nahoře  = odsazení prvního řádku
           △ dole    = levé odsazení odstavce
           △ vpravo  = pravé odsazení odstavce
VRuler – svislé pravítko vlevo: centimetry od horního okraje textu, posouvá se se stránkou.
"""
from __future__ import annotations

from PySide6 import QtCore, QtGui, QtWidgets
from PySide6.QtCore import Qt

SIZE = 22                 # výška vodorovného / šířka svislého pravítka v px
SNAP_CM = 0.25            # značky odsazení se přichytávají po čtvrt centimetru
BG = QtGui.QColor("#f1f5f9")
PAPER = QtGui.QColor("#ffffff")
MARGIN = QtGui.QColor("#cbd5e1")
TICK = QtGui.QColor("#64748b")
MARK = QtGui.QColor("#2563eb")


def px_per_cm(w: QtWidgets.QWidget) -> float:
    return w.logicalDpiX() / 2.54


class HRuler(QtWidgets.QWidget):
    def __init__(self, edit: QtWidgets.QTextEdit):
        super().__init__()
        self.edit = edit
        self.setFixedHeight(SIZE)
        self.setMouseTracking(True)
        self._drag: str | None = None
        edit.cursorPositionChanged.connect(self.update)
        edit.horizontalScrollBar().valueChanged.connect(self.update)
        edit.document().contentsChanged.connect(self.update)

    # ------------------------------------------------------------ geometrie
    def _origin(self) -> float:
        """x (v pravítku), kde začíná text, tj. levý okraj stránky."""
        return self.edit.document().documentMargin() - self.edit.horizontalScrollBar().value()

    def _text_width(self) -> float:
        return self.edit.viewport().width() - 2 * self.edit.document().documentMargin()

    def _fmt(self) -> QtGui.QTextBlockFormat:
        return self.edit.textCursor().blockFormat()

    def markers(self) -> dict[str, float]:
        f = self._fmt()
        doc = self.edit.document()
        left = self._origin() + f.leftMargin() + f.indent() * doc.indentWidth()
        right = self._origin() + self._text_width() - f.rightMargin()
        return {"first": left + f.textIndent(), "left": left, "right": right}

    def _hit(self, pos: QtCore.QPointF) -> str | None:
        """Která značka je pod myší: horní polovina = první řádek, dolní = levé odsazení, vpravo = pravé."""
        m = self.markers()
        near = [n for n in ("first", "left", "right") if abs(pos.x() - m[n]) <= 6]
        if not near:
            return None
        if "right" in near and len(near) == 1:
            return "right"
        if pos.y() < SIZE / 2:
            return "first" if "first" in near else near[0]
        return "left" if "left" in near else near[0]

    # ------------------------------------------------------------ kreslení
    def paintEvent(self, _e):
        p = QtGui.QPainter(self)
        p.setRenderHint(QtGui.QPainter.Antialiasing)
        p.fillRect(self.rect(), BG)
        cm = px_per_cm(self)
        x0, w = self._origin(), self._text_width()
        p.fillRect(QtCore.QRectF(x0, 3, w, SIZE - 6), PAPER)
        p.fillRect(QtCore.QRectF(0, 3, x0, SIZE - 6), MARGIN)
        p.fillRect(QtCore.QRectF(x0 + w, 3, self.width() - x0 - w, SIZE - 6), MARGIN)
        font = p.font()
        font.setPointSizeF(7)
        p.setFont(font)
        p.setPen(TICK)
        n = int(-x0 / cm * 4) - 1
        while True:
            x = x0 + n * cm / 4
            if x > self.width():
                break
            if x >= 0:
                if n % 4 == 0:
                    if n:
                        p.drawText(QtCore.QRectF(x - 10, 3, 20, SIZE - 6), Qt.AlignCenter, str(abs(n // 4)))
                elif n % 2 == 0:
                    p.drawLine(QtCore.QPointF(x, SIZE / 2 - 3), QtCore.QPointF(x, SIZE / 2 + 3))
                else:
                    p.drawLine(QtCore.QPointF(x, SIZE / 2 - 1), QtCore.QPointF(x, SIZE / 2 + 1))
            n += 1
        m = self.markers()
        p.setPen(QtGui.QPen(MARK.darker(120), 1))
        p.setBrush(MARK)
        self._tri(p, m["first"], down=True)
        self._tri(p, m["left"], down=False)
        self._tri(p, m["right"], down=False)
        p.end()

    @staticmethod
    def _tri(p: QtGui.QPainter, x: float, down: bool):
        if down:
            pts = [QtCore.QPointF(x - 5, 1), QtCore.QPointF(x + 5, 1), QtCore.QPointF(x, 8)]
        else:
            pts = [QtCore.QPointF(x - 5, SIZE - 1), QtCore.QPointF(x + 5, SIZE - 1), QtCore.QPointF(x, SIZE - 8)]
        p.drawPolygon(QtGui.QPolygonF(pts))

    # ------------------------------------------------------------ myš
    def mouseMoveEvent(self, e):
        pos = e.position()
        if self._drag:
            self.apply(self._drag, pos.x())
            return
        hit = self._hit(pos)
        self.setCursor(Qt.SizeHorCursor if hit else Qt.ArrowCursor)
        self.setToolTip({"first": "Odsazení prvního řádku", "left": "Levé odsazení odstavce",
                         "right": "Pravé odsazení odstavce"}.get(hit, "Pravítko (cm)"))

    def mousePressEvent(self, e):
        if e.button() == Qt.LeftButton:
            self._drag = self._hit(e.position())

    def mouseReleaseEvent(self, _e):
        if self._drag:
            self._drag = None
            self.edit.setFocus()

    def mouseDoubleClickEvent(self, _e):
        """Dvojklik vrátí odsazení odstavce na nulu."""
        c = self.edit.textCursor()
        f = QtGui.QTextBlockFormat()
        f.setLeftMargin(0)
        f.setRightMargin(0)
        f.setTextIndent(0)
        c.mergeBlockFormat(f)
        self.update()

    def apply(self, which: str, x: float):
        """Nastaví odsazení vybraných odstavců podle polohy myši (přichytí se po čtvrt cm)."""
        cm = px_per_cm(self)
        snap = cm * SNAP_CM
        doc = self.edit.document()
        cur = self._fmt()
        base = self._origin() + cur.indent() * doc.indentWidth()
        f = QtGui.QTextBlockFormat()
        if which == "left":
            left = max(0.0, round((x - base) / snap) * snap)
            left = min(left, self._text_width() - cur.rightMargin() - cm)
            first_abs = base + cur.leftMargin() + cur.textIndent()  # první řádek zůstává na místě
            f.setLeftMargin(left)
            f.setTextIndent(first_abs - base - left)
        elif which == "first":
            first = round((x - base - cur.leftMargin()) / snap) * snap
            first = max(-cur.leftMargin(), first)
            f.setTextIndent(first)
        else:
            right = max(0.0, round((self._origin() + self._text_width() - x) / snap) * snap)
            right = min(right, self._text_width() - cur.leftMargin() - cm)
            f.setRightMargin(right)
        c = self.edit.textCursor()
        c.mergeBlockFormat(f)
        val = {"left": f.leftMargin(), "first": f.textIndent(), "right": f.rightMargin()}[which] / cm
        QtWidgets.QToolTip.showText(self.mapToGlobal(QtCore.QPoint(int(x), SIZE)), f"{val:.2f} cm".replace(".", ","),
                                    self)
        self.update()


class VRuler(QtWidgets.QWidget):
    def __init__(self, edit: QtWidgets.QTextEdit):
        super().__init__()
        self.edit = edit
        self.setFixedWidth(SIZE)
        self.setToolTip("Pravítko (cm)")
        edit.verticalScrollBar().valueChanged.connect(self.update)
        edit.document().documentLayout().documentSizeChanged.connect(lambda *_: self.update())

    def paintEvent(self, _e):
        p = QtGui.QPainter(self)
        p.fillRect(self.rect(), BG)
        cm = self.logicalDpiY() / 2.54
        margin = self.edit.document().documentMargin()
        y0 = margin - self.edit.verticalScrollBar().value()
        doc_h = self.edit.document().size().height()
        p.fillRect(QtCore.QRectF(3, max(0.0, y0), SIZE - 6, max(0.0, doc_h - 2 * margin)), PAPER)
        if y0 > 0:
            p.fillRect(QtCore.QRectF(3, 0, SIZE - 6, y0), MARGIN)
        font = p.font()
        font.setPointSizeF(7)
        p.setFont(font)
        p.setPen(TICK)
        n = max(0, int(-y0 / cm * 4))
        while True:
            y = y0 + n * cm / 4
            if y > self.height():
                break
            if n % 4 == 0:
                if n:
                    p.drawText(QtCore.QRectF(3, y - 8, SIZE - 6, 16), Qt.AlignCenter, str(n // 4))
            elif n % 2 == 0:
                p.drawLine(QtCore.QPointF(SIZE / 2 - 3, y), QtCore.QPointF(SIZE / 2 + 3, y))
            else:
                p.drawLine(QtCore.QPointF(SIZE / 2 - 1, y), QtCore.QPointF(SIZE / 2 + 1, y))
            n += 1
        p.end()
