"""Převod formátovaného textu z editoru (HTML z Qt) do dokumentu Word (python-docx)."""

from __future__ import annotations

import html as htmllib
import re
import threading

from bs4 import BeautifulSoup, NavigableString, Tag

PAGE_BREAK = "[[STRANA]]"
_BLOCKS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "div", "blockquote", "pre"}
_HEADING_STYLE = {"h1": "Heading 2", "h2": "Heading 2", "h3": "Heading 3", "h4": "Heading 4",
                  "h5": "Heading 4", "h6": "Heading 4"}


def _css(tag: Tag) -> dict[str, str]:
    out = {}
    for part in (tag.get("style") or "").split(";"):
        if ":" in part:
            k, v = part.split(":", 1)
            out[k.strip().lower()] = v.strip()
    return out


def _hex(color: str) -> str | None:
    color = color.strip().lower()
    m = re.fullmatch(r"#([0-9a-f]{6})", color)
    if m:
        return m.group(1).upper()
    m = re.fullmatch(r"#([0-9a-f]{3})", color)
    if m:
        return "".join(c * 2 for c in m.group(1)).upper()
    m = re.fullmatch(r"rgba?\((\d+),\s*(\d+),\s*(\d+)", color)
    if m:
        return "".join(f"{int(x):02X}" for x in m.groups())
    return None


def _px_to_pt(value: str) -> float | None:
    m = re.fullmatch(r"(-?[\d.]+)\s*(px|pt)?", value.strip())
    if not m:
        return None
    n = float(m.group(1))
    return n * 0.75 if (m.group(2) or "px") == "px" else n


def _merge_fmt(fmt: dict, tag: Tag) -> dict:
    f = dict(fmt)
    name = tag.name
    if name in ("b", "strong"):
        f["bold"] = True
    if name in ("i", "em"):
        f["italic"] = True
    if name == "u":
        f["underline"] = True
    if name in ("s", "strike", "del"):
        f["strike"] = True
    if name == "sup":
        f["sup"] = True
    if name == "sub":
        f["sub"] = True
    css = _css(tag)
    weight = css.get("font-weight", "")
    if weight:
        f["bold"] = weight == "bold" or (weight.isdigit() and int(weight) >= 600)
    if "font-style" in css:
        f["italic"] = css["font-style"] == "italic"
    deco = css.get("text-decoration", "")
    if "underline" in deco:
        f["underline"] = True
    if "line-through" in deco:
        f["strike"] = True
    va = css.get("vertical-align", "")
    if va == "super":
        f["sup"] = True
    elif va == "sub":
        f["sub"] = True
    if css.get("color") and _hex(css["color"]):
        f["color"] = _hex(css["color"])
    if css.get("background-color") and _hex(css["background-color"]):
        f["bg"] = _hex(css["background-color"])
    family = css.get("font-family", "").strip("'\" ")
    if family and family.lower() not in ("sans serif", "sans-serif", "serif"):
        f["font"] = family.split(",")[0].strip("'\" ")
    size = css.get("font-size", "")
    if size.endswith("pt"):
        try:
            f["size"] = float(size[:-2])
        except ValueError:
            pass
    return f


def _apply_run(run, fmt: dict) -> None:
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Pt, RGBColor

    if fmt.get("bold"):
        run.bold = True
    if fmt.get("italic"):
        run.italic = True
    if fmt.get("underline"):
        run.underline = True
    if fmt.get("strike"):
        run.font.strike = True
    if fmt.get("sup"):
        run.font.superscript = True
    if fmt.get("sub"):
        run.font.subscript = True
    if fmt.get("color"):
        run.font.color.rgb = RGBColor.from_string(fmt["color"])
    if fmt.get("font"):
        run.font.name = fmt["font"]
    if fmt.get("size"):
        run.font.size = Pt(fmt["size"])
    if fmt.get("bg"):
        shd = OxmlElement("w:shd")
        shd.set(qn("w:val"), "clear")
        shd.set(qn("w:color"), "auto")
        shd.set(qn("w:fill"), fmt["bg"])
        run._r.get_or_add_rPr().append(shd)


_IMAGES = threading.local()  # obrázky knihy pro právě převáděné HTML (název → data)


def _add_picture(par, tag: Tag) -> None:
    import io

    from docx.shared import Inches

    from book_images import docx_width_inches

    data = (getattr(_IMAGES, "map", None) or {}).get(tag.get("src", ""))
    if not data:
        par.add_run("[obrázek]")
        return
    try:
        width = float(tag.get("width")) if tag.get("width") else None
    except ValueError:
        width = None
    par.add_run().add_picture(io.BytesIO(data), width=Inches(docx_width_inches(width, data)))


def _fill_paragraph(par, node: Tag, fmt: dict) -> None:
    for child in node.children:
        if isinstance(child, NavigableString):
            text = str(child)
            if text:
                _apply_run(par.add_run(text), fmt)
        elif isinstance(child, Tag):
            if child.name == "img":
                _add_picture(par, child)
            elif child.name == "br":
                par.add_run().add_break()
            elif child.name in ("ul", "ol"):
                continue  # vnořený seznam se zpracuje zvlášť
            else:
                _fill_paragraph(par, child, _merge_fmt(fmt, child))


def _format_paragraph(par, tag: Tag) -> None:
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Pt

    align = (tag.get("align") or _css(tag).get("text-align", "")).lower()
    par.alignment = {"center": WD_ALIGN_PARAGRAPH.CENTER, "right": WD_ALIGN_PARAGRAPH.RIGHT,
                     "justify": WD_ALIGN_PARAGRAPH.JUSTIFY}.get(align, par.alignment)
    css = _css(tag)
    if "page-break-before" in css and css["page-break-before"] == "always":
        par.paragraph_format.page_break_before = True
    left = _px_to_pt(css.get("margin-left", "")) if css.get("margin-left") else None
    block_indent = css.get("-qt-block-indent", "0")
    if block_indent.isdigit() and int(block_indent):
        left = (left or 0) + int(block_indent) * 30
    if left:
        par.paragraph_format.left_indent = Pt(left)
    right = _px_to_pt(css.get("margin-right", "")) if css.get("margin-right") else None
    if right:
        par.paragraph_format.right_indent = Pt(right)
    first = _px_to_pt(css.get("text-indent", "")) if css.get("text-indent") else None
    if first:
        par.paragraph_format.first_line_indent = Pt(first)
    lh = css.get("line-height", "")
    if lh.endswith("%"):
        try:
            par.paragraph_format.line_spacing = float(lh[:-1]) / 100
        except ValueError:
            pass


def _plain(tag: Tag) -> str:
    return htmllib.unescape(tag.get_text()).strip()


def add_html(document, html: str, images: dict | None = None) -> None:
    """Přidá obsah HTML (z editoru) jako odstavce dokumentu; images = název obrázku → data."""
    from docx.enum.text import WD_BREAK

    _IMAGES.map = images or {}

    soup = BeautifulSoup(html, "lxml")
    body = soup.body or soup
    base = _merge_fmt({}, body) if body.name == "body" else {}
    base.pop("font", None)
    base.pop("size", None)  # výchozí písmo editoru se v knize nepoužije – platí písmo knihy

    def handle(node: Tag, fmt: dict, list_style: str | None = None) -> None:
        for el in node.children:
            if not isinstance(el, Tag):
                if isinstance(el, NavigableString) and str(el).strip():
                    _apply_run(document.add_paragraph().add_run(str(el).strip()), fmt)
                continue
            if el.name in ("ul", "ol"):
                handle(el, fmt, "List Number" if el.name == "ol" else "List Bullet")
            elif el.name == "hr":
                document.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
            elif el.name == "table":
                for row in el.find_all("tr"):
                    cells = [_plain(c) for c in row.find_all(["td", "th"])]
                    document.add_paragraph(" | ".join(cells))
            elif el.name in _BLOCKS:
                if _plain(el) == PAGE_BREAK:
                    document.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
                    continue
                if el.name in _HEADING_STYLE:
                    style = _HEADING_STYLE[el.name]
                elif el.name == "li":
                    style = list_style or "List Bullet"
                else:
                    style = None
                par = document.add_paragraph(style=style) if style else document.add_paragraph()
                _format_paragraph(par, el)
                block_fmt = _merge_fmt(fmt, el) if el.name not in _HEADING_STYLE else fmt
                _fill_paragraph(par, el, block_fmt)
                for sub in el.find_all(["ul", "ol"], recursive=False):
                    handle(sub, fmt, "List Number" if sub.name == "ol" else "List Bullet")
            else:
                handle(el, _merge_fmt(fmt, el), list_style)

    handle(body, base)


def plain_to_html(text: str) -> str:
    """Prostý text kapitoly (odstavce oddělené prázdným řádkem) → HTML pro editor."""
    parts = []
    for para in re.split(r"\n\s*\n", text.strip()):
        if not para.strip():
            continue
        lines = [htmllib.escape(line) for line in para.strip().split("\n")]
        parts.append("<p>" + "<br/>".join(lines) + "</p>")
    return "".join(parts)
