"""Další formáty bez Calibre: RTF, FB2, ODT, HTMLZ (čtení i zápis), AZW3/KF8 a PDF (čtení).

Kniha je ebook.RichBook – kapitoly jako čisté HTML (p, h1–h6, b, i, u, s, sub, sup, br, img, blockquote,
ul/ol/li, <hr/> = zalomení stránky).
"""
from __future__ import annotations

import base64
import html as htmllib
import io
import re
import struct
import time
import zipfile

from bs4 import BeautifulSoup, NavigableString, Tag

import ebook
from ebook import Chapter, RichBook, clean_html, esc, image_ext, split_chapters

TOKEN = re.compile(r"<(/?)([a-z0-9]+)([^>]*)>|([^<]+)", re.I)


def _blocks(html: str) -> list[str]:
    """Čisté HTML kapitoly → seznam bloků nejvyšší úrovně."""
    out, depth, cur = [], 0, ""
    for m in re.finditer(r"<(/?)(p|h[1-6]|ul|ol|blockquote)\b[^>]*>|<hr/>", html):
        if m.group(0) == "<hr/>" and depth == 0:
            out.append("<hr/>")
            continue
        if not m.group(1):
            if depth == 0:
                start = m.start()
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                out.append(html[start:m.end()])
    return out


def _inline_segments(fragment: str):
    """Vložené HTML → [(text, {b,i,u,s,sup,sub}) | ("\n", br) | ("<img>", name)]."""
    soup = BeautifulSoup(f"<x>{fragment}</x>", "html.parser").x
    out = []

    def walk(node, fmt):
        for c in node.children:
            if isinstance(c, NavigableString):
                if str(c):
                    out.append(("t", str(c), frozenset(fmt)))
            elif isinstance(c, Tag):
                if c.name == "br":
                    out.append(("br", "", frozenset(fmt)))
                elif c.name == "img":
                    out.append(("img", c.get("src", ""), frozenset(fmt)))
                else:
                    walk(c, fmt | ({c.name} if c.name in ("b", "i", "u", "s", "sup", "sub") else set()))

    walk(soup, set())
    return out


def _align_of(block: str) -> str:
    m = re.match(r'<[a-z0-9]+ style="text-align:(\w+)"', block)
    return m.group(1) if m else ""


def _inner(block: str) -> str:
    return re.sub(r"^<[^>]+>|</[a-z0-9]+>$", "", block)


# ================================================================== RTF
def _rtf_text(t: str) -> str:
    out = []
    for ch in t:
        o = ord(ch)
        if ch in "\\{}":
            out.append("\\" + ch)
        elif ch == "\n":
            out.append("\\line ")
        elif o < 128:
            out.append(ch)
        else:
            if o > 0xFFFF:  # mimo BMP – dvojice náhradních znaků
                o -= 0x10000
                for u in (0xD800 + (o >> 10), 0xDC00 + (o & 0x3FF)):
                    out.append(f"\\u{u - 65536 if u > 32767 else u}?")
                continue
            out.append(f"\\u{o - 65536 if o > 32767 else o}?")
    return "".join(out)


def _rtf_pict(data: bytes, width_px: int | None = None) -> str:
    ext = image_ext(data)
    if ext not in ("jpg", "png"):
        try:
            from PIL import Image

            with Image.open(io.BytesIO(data)) as im:
                b = io.BytesIO()
                im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB").save(b, "PNG")
                data, ext = b.getvalue(), "png"
        except Exception:  # noqa: BLE001
            return ""
    try:
        import book_images

        w, h = book_images.size_px(data)
    except Exception:  # noqa: BLE001
        w, h = 800, 600
    inches = min(6.3, (width_px / 800 * 6.3) if width_px else w / 96)
    gw = int(inches * 1440)
    gh = int(gw * h / max(1, w))
    blip = "\\jpegblip" if ext == "jpg" else "\\pngblip"
    return f"{{\\pict{blip}\\picw{w}\\pich{h}\\picwgoal{gw}\\pichgoal{gh} {data.hex()}}}"


def write_rtf(book: RichBook) -> bytes:
    out = ["{\\rtf1\\ansi\\ansicpg1250\\deff0\\uc1{\\fonttbl{\\f0\\froman Georgia;}}",
           "\\paperw11906\\paperh16838\\margl1418\\margr1418\\margt1418\\margb1418",
           f"{{\\info{{\\title {_rtf_text(book.title)}}}{{\\author {_rtf_text(book.author)}}}}}",
           "\\f0\\fs24 "]

    def inline(fragment):
        parts = []
        for kind, val, fmt in _inline_segments(fragment):
            if kind == "br":
                parts.append("\\line ")
                continue
            if kind == "img":
                data = book.images.get(htmllib.unescape(val))
                parts.append(_rtf_pict(data) if data else "")
                continue
            codes = "".join({"b": "\\b", "i": "\\i", "u": "\\ul", "s": "\\strike", "sup": "\\super",
                             "sub": "\\sub"}[f] for f in sorted(fmt))
            txt = _rtf_text(val.replace("\n", " "))
            parts.append(f"{{{codes} {txt}}}" if codes else txt)
        return "".join(parts)

    q = {"center": "\\qc", "right": "\\qr", "justify": "\\qj"}
    if book.cover in book.images:
        out.append(f"\\pard\\qc {_rtf_pict(book.images[book.cover], 640)}\\par\\page ")
    out.append(f"\\pard\\qc\\sb2400\\sa480{{\\b\\fs56 {_rtf_text(book.title)}}}\\par ")
    if book.author:
        out.append(f"\\pard\\qc{{\\fs30 {_rtf_text(book.author)}}}\\par ")
    for ch in book.chapters:
        out.append("\\page ")
        for blk in _blocks(ch.html):
            if blk == "<hr/>":
                out.append("\\page ")
                continue
            tag = re.match(r"<([a-z0-9]+)", blk).group(1)
            al = q.get(_align_of(blk), "")
            if tag.startswith("h"):
                lv = int(tag[1])
                size = {1: 40, 2: 36, 3: 30}.get(lv, 26)
                out.append(f"\\pard\\keepn\\outlinelevel{lv - 1}\\sb240\\sa180{al or ('\\qc' if lv <= 2 else '')}"
                           f"{{\\b\\fs{size} {inline(_inner(blk))}}}\\par ")
            elif tag in ("ul", "ol"):
                for n, li in enumerate(re.findall(r"<li>(.*?)</li>", blk, re.S), 1):
                    mark = f"{n}." if tag == "ol" else "\\bullet"
                    out.append(f"\\pard\\fi-360\\li720\\sa60 {mark}\\tab {inline(li)}\\par ")
            elif tag == "blockquote":
                for p in re.findall(r"<p[^>]*>(.*?)</p>", blk, re.S):
                    out.append(f"\\pard\\li720\\ri720\\sa120{{\\i {inline(p)}}}\\par ")
            else:
                indent = "" if al == "\\qc" or "<img" in blk else "\\fi340"
                out.append(f"\\pard{al or '\\qj'}{indent}\\sa120 {inline(_inner(blk))}\\par ")
    out.append("}")
    return "".join(out).encode("ascii")


_RTF_SKIP = {"fonttbl", "colortbl", "stylesheet", "info", "header", "footer", "headerl", "headerr", "footerl",
             "footerr", "listtable", "listoverridetable", "rsidtbl", "xmlnstbl", "generator", "themedata",
             "colorschememapping", "datastore", "latentstyles", "fldinst", "nonshppict", "pgdsctbl", "revtbl",
             "mmathPr", "filetbl", "bkmkstart", "bkmkend", "object", "objdata", "pntext", "pntxta", "pntxtb",
             "listtext", "fftitle", "ffdeftext"}


def read_rtf(data: bytes, base: str = "Kniha") -> RichBook:
    text = data.decode("latin-1")
    book = RichBook(title=base)
    m = re.search(r"\\ansicpg(\d+)", text)
    codepage = f"cp{m.group(1)}" if m else "cp1252"
    tok = re.compile(r"\\([a-zA-Z]+)(-?\d+)? ?|\\'([0-9a-fA-F]{2})|\\(.)|([{}])|([^\\{}\r\n]+)|[\r\n]+", re.S)
    blocks: list[str] = []
    segs: list[tuple[str, frozenset]] = []
    stack = [{"fmt": set(), "skip": False, "uc": 1, "pict": None, "dest": ""}]
    para = {"align": "", "outline": None, "i_all": False}
    pending_bytes = bytearray()
    skip_chars = 0
    info: dict[str, str] = {}

    def st():
        return stack[-1]

    def flush_bytes():
        if pending_bytes:
            add_text(pending_bytes.decode(codepage, errors="replace"))
            pending_bytes.clear()

    def add_text(t):
        s = st()
        if s["dest"] in ("title", "author"):
            info[s["dest"]] = info.get(s["dest"], "") + t
            return
        if s["skip"] or s["pict"] is not None:
            return
        segs.append((t, frozenset(s["fmt"])))

    def end_par(page=False):
        flush_bytes()
        html = ""
        for t, fmt in segs:
            if t.startswith("\x00img"):
                continue
            piece = esc(t)
            for f in ("sub", "sup", "s", "u", "i", "b"):
                if f in fmt:
                    piece = f"<{f}>{piece}</{f}>"
            html += piece
        html = html.replace("\n", "<br/>")
        for f in ("b", "i", "u", "s", "sup", "sub"):
            html = html.replace(f"</{f}><{f}>", "")
        imgs = [t[4:] for t, _ in segs if t.startswith("\x00img")]
        plain = re.sub(r"<[^>]+>", "", html).strip()
        al = f' style="text-align:{para["align"]}"' if para["align"] else ""
        if plain:
            if para["outline"] is not None:
                lv = min(6, para["outline"] + 1)
                blocks.append(f"<h{lv}{al}>{re.sub(r'</?b>', '', html.strip())}</h{lv}>")
            else:
                blocks.append(f"<p{al}>{html.strip()}</p>")
        for n in imgs:
            blocks.append(f'<p style="text-align:center"><img src="{n}"/></p>')
        segs.clear()
        if page:
            blocks.append("<hr/>")

    for mt in tok.finditer(text):
        word, num, hexb, sym, brace, plain = mt.groups()
        if skip_chars and (plain or hexb or sym):
            if plain:
                n = min(skip_chars, len(plain))
                skip_chars -= n
                plain = plain[n:]
                if not plain:
                    continue
            else:
                skip_chars -= 1
                continue
        if hexb:
            s = st()
            if s["pict"] is not None:
                continue
            pending_bytes.append(int(hexb, 16))
            continue
        flush_bytes() if not hexb else None
        if brace == "{":
            top = st()
            stack.append({"fmt": set(top["fmt"]), "skip": top["skip"], "uc": top["uc"], "pict": None,
                          "dest": "" if top["dest"] not in ("title", "author") else top["dest"], "first": True})
            continue
        if brace == "}":
            done = stack.pop() if len(stack) > 1 else st()
            if done["pict"] is not None and not done["skip"]:
                hexdata = re.sub(r"[^0-9a-fA-F]", "", done["pict"])
                try:
                    raw = bytes.fromhex(hexdata[: len(hexdata) // 2 * 2])
                    if image_ext(raw):
                        segs.append(("\x00img" + book.add_image(raw), frozenset()))
                except ValueError:
                    pass
            continue
        s = st()
        first = s.pop("first", False)
        if sym:
            if sym == "*":
                s["skip"] = True
            elif sym in "\\{}":
                add_text(sym)
            elif sym == "~":
                add_text("\u00a0")
            elif sym == "-":
                pass
            elif sym in ("_",):
                add_text("-")
            continue
        if word:
            n = int(num) if num is not None else None
            if first and word in _RTF_SKIP:
                s["skip"] = True
                continue
            if word in ("title", "author") and first:
                s["dest"] = word
                continue
            if word == "pict":
                s["pict"] = ""
                continue
            if word in ("b", "i", "ul", "strike", "super", "sub"):
                key = {"ul": "u", "strike": "s", "super": "sup"}.get(word, word)
                (s["fmt"].discard if n == 0 else s["fmt"].add)(key)
            elif word in ("ulnone",):
                s["fmt"].discard("u")
            elif word == "nosupersub":
                s["fmt"].discard("sup")
                s["fmt"].discard("sub")
            elif word == "plain":
                s["fmt"].clear()
            elif word == "pard":
                para.update(align="", outline=None)
            elif word in ("qc", "qr", "qj", "ql"):
                para["align"] = {"qc": "center", "qr": "right", "qj": "", "ql": ""}[word]
            elif word == "outlinelevel":
                para["outline"] = n
            elif word in ("par", "sect"):
                end_par()
            elif word == "page":
                end_par(page=True)
            elif word == "line":
                add_text("\n")
            elif word == "tab":
                add_text(" ")
            elif word == "uc":
                s["uc"] = n or 0
            elif word == "u":
                add_text(chr(n + 65536 if n < 0 else n))
                skip_chars = s["uc"]
            elif word in ("emdash", "endash"):
                add_text("—" if word == "emdash" else "–")
            elif word in ("lquote", "rquote", "ldblquote", "rdblquote"):
                add_text({"lquote": "‘", "rquote": "’", "ldblquote": "“", "rdblquote": "”"}[word])
            elif word == "bullet":
                add_text("•")
            continue
        if plain:
            if st()["pict"] is not None:
                st()["pict"] += plain
            else:
                add_text(plain)
    end_par()
    # obsah se sloučí: náhradní dvojice z \uN
    blocks = [b.encode("utf-16", "surrogatepass").decode("utf-16", errors="replace") for b in blocks]
    book.title = info.get("title", "").strip() or book.title
    book.author = info.get("author", "").strip()
    if blocks and re.fullmatch(r'<p style="text-align:center"><img src="[^"]+"/></p>', blocks[0]) and len(blocks) > 1 \
            and blocks[1] == "<hr/>":
        book.cover = re.search(r'src="([^"]+)"', blocks[0]).group(1)
        blocks = blocks[2:]
    # titulní strana (název velkým písmem) z našeho zápisu
    book.chapters = split_chapters(blocks, book.title)
    return book


# ================================================================== FB2
FB2_NS = "http://www.gribuser.ru/xml/fictionbook/2.0"


def write_fb2(book: RichBook) -> bytes:
    names = {}

    def img_id(n):
        if n not in names:
            names[n] = re.sub(r"[^A-Za-z0-9._-]", "_", n)
        return names[n]

    def inline(fragment):
        out = []
        for kind, val, fmt in _inline_segments(fragment):
            if kind == "br":
                out.append("</p><p>")
                continue
            if kind == "img":
                continue
            t = esc(val)
            for f, tag in (("sub", "sub"), ("sup", "sup"), ("s", "strikethrough"), ("i", "emphasis"), ("b", "strong")):
                if f in fmt:
                    t = f"<{tag}>{t}</{tag}>"
            out.append(t)
        return "".join(out)

    sections = []
    for ch in book.chapters:
        parts = [f"<title><p>{esc(ch.title)}</p></title>"]
        first_heading = True
        for blk in _blocks(ch.html):
            if blk == "<hr/>":
                parts.append("<empty-line/>")
                continue
            tag = re.match(r"<([a-z0-9]+)", blk).group(1)
            for n in re.findall(r'<img src="([^"]+)"', blk):
                if htmllib.unescape(n) in book.images:
                    parts.append(f'<image l:href="#{img_id(htmllib.unescape(n))}"/>')
            if tag.startswith("h"):
                if first_heading:  # nadpis kapitoly je už v <title>
                    first_heading = False
                    continue
                parts.append(f"<subtitle>{inline(_inner(blk))}</subtitle>")
            elif tag in ("ul", "ol"):
                for k, li in enumerate(re.findall(r"<li>(.*?)</li>", blk, re.S), 1):
                    parts.append(f"<p>{f'{k}.' if tag == 'ol' else '•'} {inline(li)}</p>")
            elif tag == "blockquote":
                parts.append("<cite>" + "".join(f"<p>{inline(p)}</p>" for p in re.findall(r"<p[^>]*>(.*?)</p>", blk, re.S))
                             + "</cite>")
            else:
                txt = inline(_inner(blk))
                if re.sub(r"<[^>]+>", "", txt).strip():
                    parts.append(f"<p>{txt}</p>")
        sections.append("<section>" + "".join(parts).replace("<p></p>", "") + "</section>")
    first, _, last = book.author.rpartition(" ")
    author = f"<author><first-name>{esc(first)}</first-name><last-name>{esc(last)}</last-name></author>" if book.author \
        else "<author><nickname>neznámý</nickname></author>"
    cover = f'<coverpage><image l:href="#{img_id(book.cover)}"/></coverpage>' if book.cover in book.images else ""
    bins = "".join(
        f'<binary id="{img_id(n)}" content-type="{ebook.MIME.get(image_ext(book.images[n]), "image/jpeg")}">'
        f'{base64.b64encode(book.images[n]).decode()}</binary>' for n in names if n in book.images)
    xml = (f'<?xml version="1.0" encoding="utf-8"?>\n<FictionBook xmlns="{FB2_NS}" xmlns:l="http://www.w3.org/1999/xlink">'
           f'<description><title-info><genre>prose</genre>{author}<book-title>{esc(book.title)}</book-title>{cover}'
           f'<lang>{book.language}</lang></title-info><document-info>{author}<program-used>Překladač</program-used>'
           f'<date>{time.strftime("%Y-%m-%d")}</date><id>{int(time.time())}</id><version>1.0</version></document-info>'
           f'</description><body><title><p>{esc(book.title)}</p></title>{"".join(sections)}</body>{bins}</FictionBook>')
    return xml.encode("utf-8")


def read_fb2(data: bytes, base: str = "Kniha") -> RichBook:
    soup = BeautifulSoup(data, "xml")
    ti = soup.find("title-info")
    book = RichBook(title=base)
    if ti:
        if ti.find("book-title"):
            book.title = ti.find("book-title").get_text(strip=True) or base
        authors = []
        for a in ti.find_all("author"):
            nm = " ".join(x.get_text(strip=True) for x in a.find_all(["first-name", "middle-name", "last-name"]))
            authors.append(nm or (a.find("nickname").get_text(strip=True) if a.find("nickname") else ""))
        book.author = ", ".join(a for a in authors if a)
        if ti.find("lang"):
            book.language = ti.find("lang").get_text(strip=True)[:2].lower() or "cs"
    binaries = {b.get("id"): b for b in soup.find_all("binary")}
    loaded: dict[str, str] = {}

    def image(href):
        bid = (href or "").lstrip("#")
        if bid in loaded:
            return loaded[bid]
        b = binaries.get(bid)
        if not b:
            return None
        try:
            raw = base64.b64decode(re.sub(r"\s+", "", b.get_text()))
        except ValueError:
            return None
        loaded[bid] = book.add_image(raw)
        return loaded[bid]

    def href_of(el):
        for k, v in el.attrs.items():
            if k.endswith("href"):
                return v
        return ""

    if ti and ti.find("coverpage") and ti.find("coverpage").find("image"):
        book.cover = image(href_of(ti.find("coverpage").find("image")))

    def inline(el) -> str:
        out = []
        for c in el.children:
            if isinstance(c, NavigableString):
                out.append(esc(str(c)))
            elif isinstance(c, Tag):
                tag = {"strong": "b", "emphasis": "i", "strikethrough": "s", "sub": "sub", "sup": "sup"}.get(c.name)
                inner = inline(c)
                if c.name == "image":
                    n = image(href_of(c))
                    out.append(f'<img src="{n}"/>' if n else "")
                elif tag and inner.strip():
                    out.append(f"<{tag}>{inner}</{tag}>")
                else:
                    out.append(inner)
        return "".join(out)

    def section_blocks(sec, level=2) -> list[str]:
        out = []
        for c in sec.children:
            if not isinstance(c, Tag):
                continue
            if c.name == "title":
                t = " ".join(p.get_text(" ", strip=True) for p in c.find_all("p")) or c.get_text(" ", strip=True)
                out.append(f"<h{min(level, 6)}>{esc(t)}</h{min(level, 6)}>")
            elif c.name == "p":
                t = inline(c).strip()
                if t:
                    out.append(f"<p>{t}</p>")
            elif c.name == "subtitle":
                out.append(f"<h{min(level + 1, 6)}>{inline(c).strip()}</h{min(level + 1, 6)}>")
            elif c.name == "image":
                n = image(href_of(c))
                if n:
                    out.append(f'<p style="text-align:center"><img src="{n}"/></p>')
            elif c.name in ("cite", "epigraph", "poem"):
                inner = [f"<p>{inline(p).strip()}</p>" for p in c.find_all(["p", "v", "text-author"]) if inline(p).strip()]
                if inner:
                    out.append(f"<blockquote>{''.join(inner)}</blockquote>")
            elif c.name == "section":
                out += section_blocks(c, level + 1)
            elif c.name == "table":
                for tr in c.find_all("tr"):
                    out.append("<p>" + " | ".join(inline(td).strip() for td in tr.find_all(["td", "th"])) + "</p>")
        return out

    blocks = []
    for body in soup.find_all("body"):
        if body.get("name") == "notes":
            blocks.append("<h2>Poznámky</h2>")
        for c in body.children:
            if isinstance(c, Tag) and c.name == "section":
                blocks += section_blocks(c, 2) + ["<hr/>"]
            elif isinstance(c, Tag) and c.name == "title":
                continue
    book.chapters = split_chapters(blocks, book.title)
    return book


# ================================================================== ODT
def read_odt(data: bytes, base: str = "Kniha") -> RichBook:
    z = zipfile.ZipFile(io.BytesIO(data))
    content = BeautifulSoup(z.read("content.xml"), "xml")
    book = RichBook(title=base)
    if "meta.xml" in z.namelist():
        meta = BeautifulSoup(z.read("meta.xml"), "xml")
        t = meta.find("title")
        if t and t.get_text(strip=True):
            book.title = t.get_text(strip=True)
        a = meta.find("initial-creator") or meta.find("creator")
        if a:
            book.author = a.get_text(strip=True)
    styles: dict[str, dict] = {}
    docs = [content] + ([BeautifulSoup(z.read("styles.xml"), "xml")] if "styles.xml" in z.namelist() else [])
    for d in docs:
        for s in d.find_all("style"):
            name = s.get("style:name") or s.get("name")
            tp = s.find("text-properties") or {}
            pp = s.find("paragraph-properties") or {}
            g = (lambda el, k: el.get(k) if hasattr(el, "get") else None)
            styles[name] = {
                "parent": s.get("style:parent-style-name") or s.get("parent-style-name"),
                "b": g(tp, "fo:font-weight") in ("bold", "700", "600"),
                "i": g(tp, "fo:font-style") == "italic",
                "u": (g(tp, "style:text-underline-style") or "none") != "none",
                "s": (g(tp, "style:text-line-through-style") or "none") != "none",
                "pos": g(tp, "style:text-position") or "",
                "align": {"center": "center", "end": "right", "right": "right", "justify": "justify"}.get(
                    g(pp, "fo:text-align") or "", ""),
                "break": g(pp, "fo:break-before") == "page",
            }

    def fmt_of(name, key):
        seen = 0
        while name and name in styles and seen < 10:
            v = styles[name].get(key)
            if v:
                return v
            name, seen = styles[name]["parent"], seen + 1
        return None

    def image(href):
        if href in z.namelist():
            return book.add_image(z.read(href))
        return None

    def inline(el, fmt=frozenset()) -> str:
        out = []
        for c in el.children:
            if isinstance(c, NavigableString):
                t = esc(str(c))
                for f in ("sub", "sup", "s", "u", "i", "b"):
                    if f in fmt:
                        t = f"<{f}>{t}</{f}>"
                out.append(t)
            elif isinstance(c, Tag):
                n = c.name
                if n == "s":
                    out.append(" " * int(c.get("text:c", "1") or 1))
                elif n == "tab":
                    out.append(" ")
                elif n == "line-break":
                    out.append("<br/>")
                elif n == "frame":
                    img = c.find("image")
                    if img is not None:
                        nm = image(img.get("xlink:href", ""))
                        if nm:
                            out.append(f'<img src="{nm}"/>')
                elif n in ("note", "annotation", "bookmark-ref", "soft-page-break"):
                    continue
                else:
                    sty = c.get("text:style-name") or ""
                    add = {k for k in ("b", "i", "u", "s") if fmt_of(sty, k)}
                    pos = fmt_of(sty, "pos") or ""
                    if pos.startswith("super"):
                        add.add("sup")
                    elif pos.startswith("sub"):
                        add.add("sub")
                    out.append(inline(c, frozenset(fmt | add)))
        return "".join(out)

    blocks: list[str] = []

    def walk(el):
        for c in el.children:
            if not isinstance(c, Tag):
                continue
            sty = c.get("text:style-name") or ""
            if c.name in ("p", "h"):
                if fmt_of(sty, "break") and blocks:
                    blocks.append("<hr/>")
                html = inline(c).strip()
                al = fmt_of(sty, "align") or ""
                attr = f' style="text-align:{al}"' if al else ""
                if not re.sub(r"<br/>|\s", "", html):
                    continue
                if c.name == "h":
                    lv = int(c.get("text:outline-level", "1") or 1)
                    blocks.append(f"<h{min(lv + 1, 6)}{attr}>{re.sub(r'</?b>', '', html)}</h{min(lv + 1, 6)}>")
                elif (fmt_of(sty, "parent") or "").lower().startswith("title") or sty.lower() == "title":
                    if book.title == base:
                        book.title = re.sub(r"<[^>]+>", "", html)
                else:
                    blocks.append(f"<p{attr}>{html}</p>")
            elif c.name == "list":
                items = [inline(p).strip() for li in c.find_all("list-item") for p in li.find_all("p", recursive=False)]
                if items:
                    blocks.append("<ul>" + "".join(f"<li>{i}</li>" for i in items if i) + "</ul>")
            elif c.name == "table":
                for tr in c.find_all("table-row"):
                    blocks.append("<p>" + " | ".join(inline(td).strip() for td in tr.find_all("table-cell")) + "</p>")
            elif c.name in ("section", "text"):
                walk(c)

    body = content.find("text") if content.find("body") is None else content.find("body").find("text")
    if body is not None:
        walk(body)
    if blocks and re.fullmatch(r'<p style="text-align:center"><img src="[^"]+"/></p>', blocks[0]) and len(blocks) > 1 \
            and blocks[1] == "<hr/>":
        book.cover = re.search(r'src="([^"]+)"', blocks[0]).group(1)
        blocks = blocks[2:]
    book.chapters = split_chapters(blocks, book.title)
    return book


ODF_NS = ('xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" '
          'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" '
          'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" '
          'xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" '
          'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" '
          'xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:dc="http://purl.org/dc/elements/1.1/" '
          'xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" '
          'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" office:version="1.2"')

ODT_STYLES = f"""<?xml version="1.0" encoding="UTF-8"?><office:document-styles {ODF_NS}><office:font-face-decls/>
<office:styles>
<style:default-style style:family="paragraph"><style:paragraph-properties fo:margin-bottom="0.15cm"/>
<style:text-properties style:font-name="Georgia" fo:font-family="Georgia" fo:font-size="12pt" fo:language="cs" fo:country="CZ"/></style:default-style>
<style:style style:name="Standard" style:family="paragraph"><style:paragraph-properties fo:text-align="justify" fo:text-indent="0.6cm"/></style:style>
<style:style style:name="Title" style:family="paragraph"><style:paragraph-properties fo:text-align="center" fo:margin-top="6cm" fo:margin-bottom="1cm"/>
<style:text-properties fo:font-size="28pt" fo:font-weight="bold"/></style:style>
<style:style style:name="Heading_20_1" style:display-name="Heading 1" style:family="paragraph" style:default-outline-level="1">
<style:paragraph-properties fo:text-align="center" fo:margin-top="0.8cm" fo:margin-bottom="0.6cm" fo:keep-with-next="always"/>
<style:text-properties fo:font-size="18pt" fo:font-weight="bold"/></style:style>
<style:style style:name="Heading_20_2" style:display-name="Heading 2" style:family="paragraph" style:default-outline-level="2">
<style:paragraph-properties fo:margin-top="0.5cm" fo:margin-bottom="0.3cm" fo:keep-with-next="always"/>
<style:text-properties fo:font-size="14pt" fo:font-weight="bold"/></style:style>
<style:style style:name="Quote" style:family="paragraph"><style:paragraph-properties fo:margin-left="1cm" fo:margin-right="1cm"/>
<style:text-properties fo:font-style="italic"/></style:style>
</office:styles><office:automatic-styles><style:page-layout style:name="pm1"><style:page-layout-properties fo:page-width="21cm"
 fo:page-height="29.7cm" fo:margin-top="2cm" fo:margin-bottom="2cm" fo:margin-left="2.5cm" fo:margin-right="2.5cm"/></style:page-layout>
</office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="pm1"/></office:master-styles>
</office:document-styles>"""


def write_odt(book: RichBook, dst) -> None:
    """ODT (LibreOffice Writer) vlastním kódem: nadpisy s úrovní osnovy, formátování, obrázky, obálka."""
    tstyles: dict[frozenset, str] = {}
    pics: dict[str, str] = {}

    def tstyle(fmt: frozenset) -> str:
        if fmt not in tstyles:
            props = []
            if "b" in fmt:
                props.append('fo:font-weight="bold"')
            if "i" in fmt:
                props.append('fo:font-style="italic"')
            if "u" in fmt:
                props.append('style:text-underline-style="solid" style:text-underline-width="auto" '
                             'style:text-underline-color="font-color"')
            if "s" in fmt:
                props.append('style:text-line-through-style="solid"')
            if "sup" in fmt:
                props.append('style:text-position="super 58%"')
            elif "sub" in fmt:
                props.append('style:text-position="sub 58%"')
            tstyles[fmt] = (f"T{len(tstyles) + 1}", " ".join(props))
        return tstyles[fmt][0]

    def frame(name: str, width_px: int | None = None) -> str:
        data = book.images.get(name)
        if not data:
            return ""
        if name not in pics:
            pics[name] = f"Pictures/{len(pics) + 1:04d}.{image_ext(data) or 'jpg'}"
        try:
            import book_images

            w, h = book_images.size_px(data)
        except Exception:  # noqa: BLE001
            w, h = 800, 600
        cm = min(16.0, (width_px / 800 * 16.0) if width_px else w / 96 * 2.54)
        return (f'<draw:frame draw:style-name="fr1" text:anchor-type="as-char" svg:width="{cm:.2f}cm" '
                f'svg:height="{cm * h / max(1, w):.2f}cm"><draw:image xlink:href="{pics[name]}" xlink:type="simple" '
                'xlink:show="embed" xlink:actuate="onLoad"/></draw:frame>')

    def inline(fragment: str) -> str:
        out = []
        for kind, val, fmt in _inline_segments(fragment):
            if kind == "br":
                out.append("<text:line-break/>")
            elif kind == "img":
                out.append(frame(htmllib.unescape(val)))
            elif val:
                t = esc(val.replace("\n", " "))
                out.append(f'<text:span text:style-name="{tstyle(fmt)}">{t}</text:span>' if fmt else t)
        return "".join(out)

    pstyle = {"center": "Pc", "right": "Pr", "justify": "Pj"}
    body = []
    if book.cover in book.images:
        body.append(f'<text:p text:style-name="Pc">{frame(book.cover, 640)}</text:p>')
    body.append(f'<text:p text:style-name="{"PTitleBreak" if book.cover in book.images else "Title"}">'
                f'{esc(book.title)}</text:p>')
    if book.author:
        body.append(f'<text:p text:style-name="Pc">{esc(book.author)}</text:p>')
    for ch in book.chapters:
        first = True
        brk = False
        for blk in _blocks(ch.html):
            if blk == "<hr/>":
                brk = True
                continue
            tag = re.match(r"<([a-z0-9]+)", blk).group(1)
            if tag.startswith("h"):
                lv = max(1, int(tag[1]) - 1)
                style = "H1Break" if first and lv == 1 else f"Heading_20_{min(lv, 2)}"
                body.append(f'<text:h text:style-name="{style}" text:outline-level="{lv}">{inline(_inner(blk))}</text:h>')
            elif tag in ("ul", "ol"):
                items = "".join(f'<text:list-item><text:p text:style-name="Pl">{inline(li)}</text:p></text:list-item>'
                                for li in re.findall(r"<li>(.*?)</li>", blk, re.S))
                body.append(f"<text:list>{items}</text:list>")
            elif tag == "blockquote":
                for p in re.findall(r"<p[^>]*>(.*?)</p>", blk, re.S):
                    body.append(f'<text:p text:style-name="Quote">{inline(p)}</text:p>')
            else:
                al = _align_of(blk)
                st = "PBreak" if brk else pstyle.get(al, "Standard")
                if "<img" in blk and not brk:
                    st = "Pc"
                body.append(f'<text:p text:style-name="{st}">{inline(_inner(blk))}</text:p>')
            first = False
            brk = False
    autos = ['<style:style style:name="Pc" style:family="paragraph" style:parent-style-name="Standard">'
             '<style:paragraph-properties fo:text-align="center" fo:text-indent="0cm"/></style:style>',
             '<style:style style:name="Pr" style:family="paragraph" style:parent-style-name="Standard">'
             '<style:paragraph-properties fo:text-align="end" fo:text-indent="0cm"/></style:style>',
             '<style:style style:name="Pj" style:family="paragraph" style:parent-style-name="Standard">'
             '<style:paragraph-properties fo:text-align="justify"/></style:style>',
             '<style:style style:name="Pl" style:family="paragraph" style:parent-style-name="Standard">'
             '<style:paragraph-properties fo:text-indent="0cm"/></style:style>',
             '<style:style style:name="PBreak" style:family="paragraph" style:parent-style-name="Standard">'
             '<style:paragraph-properties fo:break-before="page"/></style:style>',
             '<style:style style:name="PTitleBreak" style:family="paragraph" style:parent-style-name="Title">'
             '<style:paragraph-properties fo:break-before="page"/></style:style>',
             '<style:style style:name="H1Break" style:family="paragraph" style:parent-style-name="Heading_20_1" '
             'style:default-outline-level="1"><style:paragraph-properties fo:break-before="page"/></style:style>',
             '<style:style style:name="fr1" style:family="graphic"><style:graphic-properties style:wrap="none" '
             'style:vertical-pos="top" style:vertical-rel="baseline"/></style:style>']
    autos += [f'<style:style style:name="{n}" style:family="text"><style:text-properties {p}/></style:style>'
              for n, p in tstyles.values()]
    content = (f'<?xml version="1.0" encoding="UTF-8"?><office:document-content {ODF_NS}><office:automatic-styles>'
               f'{"".join(autos)}</office:automatic-styles><office:body><office:text>{"".join(body)}</office:text>'
               '</office:body></office:document-content>')
    meta = (f'<?xml version="1.0" encoding="UTF-8"?><office:document-meta {ODF_NS}><office:meta>'
            f'<dc:title>{esc(book.title)}</dc:title><meta:initial-creator>{esc(book.author)}</meta:initial-creator>'
            f'<dc:creator>{esc(book.author)}</dc:creator><dc:language>{book.language}</dc:language>'
            '<meta:generator>Překladač</meta:generator></office:meta></office:document-meta>')
    files = "".join(f'<manifest:file-entry manifest:full-path="{p}" manifest:media-type="'
                    f'{ebook.MIME.get(p.rsplit(".", 1)[-1], "image/jpeg")}"/>' for p in pics.values())
    manifest = ('<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:'
                'opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="/" '
                'manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>'
                '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>'
                '<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>'
                '<manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>'
                f'{files}</manifest:manifest>')
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(zipfile.ZipInfo("mimetype"), "application/vnd.oasis.opendocument.text",
                   compress_type=zipfile.ZIP_STORED)
        z.writestr("META-INF/manifest.xml", manifest)
        z.writestr("content.xml", content)
        z.writestr("styles.xml", ODT_STYLES)
        z.writestr("meta.xml", meta)
        for name, path in pics.items():
            z.writestr(path, book.images[name])


# ================================================================== HTMLZ (Calibre: index.html + obrázky)
def write_htmlz(book: RichBook) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        html = ebook.book_html(book)
        for n in set(re.findall(r'<img src="([^"]+)"', html)):
            data = book.images.get(htmllib.unescape(n))
            if data:
                z.writestr(f"images/{htmllib.unescape(n)}", data)
        z.writestr("index.html", re.sub(r'<img src="([^"]+)"', r'<img src="images/\1"', html))
        if book.cover in book.images:
            z.writestr("cover.jpg" if image_ext(book.images[book.cover]) == "jpg" else "cover.png", book.images[book.cover])
        z.writestr("metadata.opf", f'<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" '
                   f'version="2.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>{esc(book.title)}'
                   f'</dc:title><dc:creator>{esc(book.author)}</dc:creator><dc:language>{book.language}</dc:language>'
                   '</metadata></package>')
    return buf.getvalue()


def read_htmlz(data: bytes, base: str = "Kniha") -> RichBook:
    z = zipfile.ZipFile(io.BytesIO(data))
    names = z.namelist()
    index = next((n for n in names if n.lower() in ("index.html", "index.htm")), None) or \
        next((n for n in names if n.lower().endswith((".html", ".htm"))), None)
    if not index:
        raise ValueError("HTMLZ neobsahuje HTML.")
    book = RichBook(title=base)
    if "metadata.opf" in names:
        meta = BeautifulSoup(z.read("metadata.opf"), "xml")
        if meta.find("title"):
            book.title = meta.find("title").get_text(strip=True) or base
        if meta.find("creator"):
            book.author = meta.find("creator").get_text(strip=True)
    loaded: dict[str, str] = {}

    def image(src, _rec):
        path = ebook._resolve(index, src) if src else ""
        if path in loaded:
            return loaded[path]
        if path in names:
            loaded[path] = book.add_image(z.read(path))
            return loaded[path]
        return None

    for cv in ("cover.jpg", "cover.png", "cover.jpeg"):
        if cv in names:
            book.cover = book.add_image(z.read(cv))
            break
    blocks = clean_html(ebook.decode_text(z.read(index)), image)
    # obálka z book_html (obrázek a zalomení na začátku) se neopakuje
    if book.cover and blocks and blocks[0].startswith('<p style="text-align:center"><img') and len(blocks) > 1 and blocks[1] == "<hr/>":
        blocks = blocks[2:]
    book.chapters = split_chapters(blocks, book.title)
    return book


# ================================================================== AZW3 (KF8) – čtení
B32 = "0123456789ABCDEFGHIJKLMNOPQRSTUV"


def _b32(s: str) -> int:
    n = 0
    for ch in s.upper():
        n = n * 32 + B32.index(ch)
    return n


def read_kf8(recs: list[bytes], start: int, base: str) -> RichBook:
    """KF8 (AZW3): text = XHTML kostra + fragmenty za sebou; obrázky kindle:embed:XXXX."""
    r0 = recs[start]
    comp, text_len, count = struct.unpack(">HxxIH", r0[:10])
    if struct.unpack(">H", r0[12:14])[0]:
        raise ValueError("Kniha je chráněná DRM a nejde otevřít.")
    if comp == 17480:
        raise ebook.NeedsCalibre("komprese HUFF/CDIC (knihy z obchodu Amazon)")
    hlen, = struct.unpack(">I", r0[20:24])
    encoding, = struct.unpack(">I", r0[28:32])
    first_res, = struct.unpack(">I", r0[108:112])
    flags = struct.unpack(">H", r0[0xF2:0xF4])[0] if hlen >= 0xE4 else 0
    fdst_idx = struct.unpack(">I", r0[0xC0:0xC4])[0] if hlen >= 0xC4 - 16 else 0xFFFFFFFF
    codec = "utf-8" if encoding == 65001 else "cp1252"
    meta: dict[int, list[bytes]] = {}
    if struct.unpack(">I", r0[128:132])[0] & 0x40 and r0[16 + hlen:20 + hlen] == b"EXTH":
        n = struct.unpack(">I", r0[24 + hlen:28 + hlen])[0]
        p = 28 + hlen
        for _ in range(n):
            t, ln = struct.unpack(">II", r0[p:p + 8])
            meta.setdefault(t, []).append(r0[p + 8:p + ln])
            p += ln
    raw = b""
    for r in recs[start + 1:start + 1 + count]:
        body = r[:len(r) - ebook._trailing_size(r, flags)]
        raw += ebook.palmdoc_decompress(body) if comp == 2 else body
    raw = raw[:text_len]
    if fdst_idx != 0xFFFFFFFF and start + fdst_idx < len(recs) and recs[start + fdst_idx][:4] == b"FDST":
        f = recs[start + fdst_idx]
        if struct.unpack(">I", f[8:12])[0] >= 1:
            raw = raw[:struct.unpack(">I", f[16:20])[0]]  # tok 0 = text knihy (ostatní: CSS, SVG)
    dec = lambda b: b.decode(codec, errors="replace")  # noqa: E731
    book = RichBook(title=dec(meta[503][0]) if 503 in meta else base,
                    author=", ".join(dec(a) for a in meta.get(100, [])),
                    language=dec(meta[524][0])[:2].lower() if 524 in meta else "cs")
    first_res += start if first_res != 0xFFFFFFFF and start else 0
    cache: dict[int, str] = {}

    def res(idx: int):
        if first_res == 0xFFFFFFFF:
            return None
        if idx in cache:
            return cache[idx]
        k = first_res + idx
        if not 0 <= k < len(recs) or not image_ext(recs[k]):
            return None
        cache[idx] = book.add_image(recs[k])
        return cache[idx]

    if 201 in meta:
        book.cover = res(struct.unpack(">I", meta[201][0][:4])[0])

    def image(src, _rec):
        m = re.search(r"kindle:embed:([0-9A-Va-v]{4})", src or "")
        n = res(_b32(m.group(1)) - 1) if m else None
        return None if n is None or n == book.cover else n

    text = dec(raw)
    text = re.sub(r"<\?xml[^>]*\?>|<!DOCTYPE[^>]*>", "", text)
    text = re.sub(r"</?(html|body)\b[^>]*>|<head\b.*?</head>", "", text, flags=re.S | re.I)  # kostry souborů za sebou
    book.chapters = split_chapters(clean_html(f"<body>{text}</body>", image), book.title)
    return book


def kf8_start(recs: list[bytes]) -> int | None:
    """Index záznamu 0 části KF8: samostatné AZW3 (verze 8), nebo kombinované MOBI (EXTH 121)."""
    r0 = recs[0]
    if len(r0) < 40 or r0[16:20] != b"MOBI":
        return None
    if struct.unpack(">I", r0[36:40])[0] >= 8:
        return 0
    hlen, = struct.unpack(">I", r0[20:24])
    if struct.unpack(">I", r0[128:132])[0] & 0x40 and r0[16 + hlen:20 + hlen] == b"EXTH":
        n = struct.unpack(">I", r0[24 + hlen:28 + hlen])[0]
        p = 28 + hlen
        for _ in range(n):
            t, ln = struct.unpack(">II", r0[p:p + 8])
            if t == 121:
                b = struct.unpack(">I", r0[p + 8:p + 12])[0]
                if 0 < b + 1 < len(recs) and recs[b] == b"BOUNDARY":
                    return b + 1
            p += ln
    return None


# ================================================================== PDF – čtení textu
def read_pdf(data: bytes, base: str = "Kniha") -> RichBook:
    try:
        from pypdf import PdfReader
    except ImportError as e:  # pragma: no cover
        raise ebook.NeedsCalibre("chybí knihovna pypdf") from e
    r = PdfReader(io.BytesIO(data))
    meta = r.metadata or {}
    pages = [(p.extract_text() or "") for p in r.pages]
    if not "".join(pages).strip():
        raise ValueError("PDF neobsahuje text (asi sken) – převeďte ho přes OCR na kartě Obrázky a OCR.")
    lines = [ln.rstrip() for pg in pages for ln in pg.split("\n") + [""]]
    lengths = sorted(len(x) for x in lines if x.strip())
    typical = lengths[int(len(lengths) * 0.8)] if lengths else 60
    paras, cur = [], ""
    for ln in lines:
        s = ln.strip()
        if not s:
            if cur:
                paras.append(cur)
                cur = ""
            continue
        if re.fullmatch(r"\d{1,4}|[-–]\s*\d+\s*[-–]", s):  # číslo stránky
            continue
        if ebook.NUM_TITLE.match(s) or ebook.WORD_TITLE.match(s):
            if cur:
                paras.append(cur)
            paras.append(s)
            cur = ""
            continue
        if cur.endswith("-") and s[:1].islower():
            cur = cur[:-1] + s
        else:
            cur = f"{cur} {s}".strip()
        if len(s) < typical * 0.75 and re.search(r"[.!?…:\"“”»]$", s):
            paras.append(cur)
            cur = ""
    if cur:
        paras.append(cur)
    title, chapters = ebook.chapters_from_text("\n\n".join(paras), base)
    book = RichBook(title=str(meta.get("/Title") or "").strip() or title or base,
                    author=str(meta.get("/Author") or "").strip(), chapters=chapters)
    return book
