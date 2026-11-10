"""Vlastní převody e-knih bez Calibre: EPUB, MOBI, PDB (PalmDoc), DOCX, TXT, HTML a PDF (přes Qt).

Kniha = RichBook: kapitoly jako čisté HTML (p, h1–h6, b, i, u, s, sub, sup, br, img, blockquote, ul/ol/li,
<hr/> = zalomení stránky, zarovnání přes style="text-align:…"), obrázky (název → data) a obálka.
Formáty, které tu nejsou (AZW3, KFX, RTF, ODT, FB2, LIT…), dál převádí Calibre, pokud je nainstalované.
Stejná pravidla používá i verze pro Android (prekladac-android/src/core).
"""
from __future__ import annotations

import html as htmllib
import io
import json
import random
import re
import struct
import time
import zipfile
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath

from bs4 import BeautifulSoup, NavigableString, Tag

READ_FORMATS = {"epub", "mobi", "prc", "azw", "pdb", "docx", "txt", "md", "html", "htm", "json"}
WRITE_FORMATS = {"epub", "mobi", "pdb", "docx", "txt", "pdf", "html"}
TOC_NAMES = {"obsah", "contents", "table of contents", "inhalt", "inhaltsverzeichnis", "spis treści",
             "table des matières", "índice"}
NUM_TITLE = re.compile(r"^\s*(\d{1,3})[.)]\s+(\S.{0,120})$")
WORD_TITLE = re.compile(r"^\s*(kapitola|chapter|kapitel|rozdział|část|chapitre|capítulo|capitolo)\s+[\w.]+.*$", re.I)
LCID = {"cs": 1029, "sk": 1051, "en": 1033, "de": 1031, "pl": 1045, "fr": 1036, "es": 3082, "it": 1040,
        "ru": 1049, "uk": 1058, "hu": 1038}


class NeedsCalibre(Exception):
    """Soubor tímto modulem otevřít nejde – převod musí udělat Calibre."""


@dataclass
class Chapter:
    title: str
    html: str  # čisté HTML včetně nadpisu kapitoly


@dataclass
class RichBook:
    title: str = "Kniha"
    author: str = ""
    language: str = "cs"
    chapters: list[Chapter] = field(default_factory=list)
    images: dict[str, bytes] = field(default_factory=dict)
    cover: str | None = None

    def add_image(self, data: bytes, ext: str | None = None) -> str:
        ext = (ext or image_ext(data)).lstrip(".")
        name = f"img{len(self.images) + 1:04d}.{ext}"
        while name in self.images:
            name = f"img{random.randint(10000, 99999)}.{ext}"
        self.images[name] = data
        return name


# ------------------------------------------------------------------ pomůcky
def image_ext(data: bytes) -> str:
    if data[:2] == b"\xff\xd8":
        return "jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:3] == b"GIF":
        return "gif"
    if data[:2] == b"BM":
        return "bmp"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return ""


MIME = {"jpg": "image/jpeg", "png": "image/png", "gif": "image/gif", "bmp": "image/bmp", "webp": "image/webp",
        "svg": "image/svg+xml"}


def decode_text(data: bytes) -> str:
    """Text v UTF-8 / UTF-16, jinak cp1250 (čeština) nebo cp1252."""
    if data[:2] in (b"\xff\xfe", b"\xfe\xff"):
        return data.decode("utf-16")
    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError:
        cz = sum(data.count(bytes([c])) for c in (0xE8, 0xF8, 0xEC, 0x9A, 0x9E, 0xF9, 0x9D, 0xEF, 0xF2, 0xC8, 0xD8,
                                                    0x8A, 0x8E))
        return data.decode("cp1250" if cz else "cp1252", errors="replace")


def clean_title(t: str) -> str:
    t = " ".join(t.split())
    m = NUM_TITLE.match(t)
    return m.group(2).strip() if m else t


def esc(t: str) -> str:
    return htmllib.escape(t, quote=False)


def plain_text(fragment: str) -> str:
    """Čisté HTML → prostý text (odstavce oddělené prázdným řádkem)."""
    soup = BeautifulSoup(fragment, "html.parser")
    for br in soup.find_all("br"):
        br.replace_with("\n")
    for img in soup.find_all("img"):
        img.replace_with("[obrázek]")
    paras = []
    for el in soup.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "hr"]):
        if el.name == "hr":
            continue
        t = el.get_text()
        t = "\n".join(" ".join(line.split()) for line in t.split("\n")).strip()
        if t:
            paras.append(t)
    return "\n\n".join(paras)


# ------------------------------------------------------------------ čištění HTML
_HEAD = {"h1", "h2", "h3", "h4", "h5", "h6"}
_LEAF = _HEAD | {"p", "li", "pre", "figcaption", "dt", "dd", "td", "th", "caption"}
_CONTAINER = {"div", "section", "article", "body", "center", "figure", "header", "footer", "aside", "main", "dl",
              "html", "blockquote", "ul", "ol", "table", "tbody", "thead", "tfoot", "tr", "nav", "span"}
_SKIP = {"script", "style", "head", "title", "svg", "noscript", "object", "iframe", "math"}
_INLINE_MAP = {"b": "b", "strong": "b", "i": "i", "em": "i", "cite": "i", "dfn": "i", "var": "i", "u": "u",
               "ins": "u", "s": "s", "strike": "s", "del": "s", "sub": "sub", "sup": "sup"}


def _style(tag: Tag) -> dict[str, str]:
    out = {}
    for part in (tag.get("style") or "").split(";"):
        if ":" in part:
            k, v = part.split(":", 1)
            out[k.strip().lower()] = v.strip().lower()
    return out


def _align(tag: Tag) -> str:
    a = (tag.get("align") or _style(tag).get("text-align") or "").lower()
    if tag.name == "center":
        a = "center"
    return f' style="text-align:{a}"' if a in ("center", "right", "justify") else ""


def _page_break(tag: Tag) -> tuple[bool, bool]:
    s = _style(tag)
    return s.get("page-break-before") == "always" or s.get("break-before") == "page", \
        s.get("page-break-after") == "always" or s.get("break-after") == "page"


class Cleaner:
    """Libovolné HTML (EPUB, MOBI, editor) → seznam čistých bloků. image(src, recindex) → název obrázku."""

    def __init__(self, image=None):
        self.image = image or (lambda src, rec: src or None)
        self.blocks: list[str] = []
        self.pending: list[str] = []
        self.pending_align = ""

    def flush(self):
        text = "".join(self.pending).strip()
        if text and re.sub(r"<br/>|\s|&nbsp;| ", "", text):
            self.blocks.append(f"<p{self.pending_align}>{text}</p>")
        elif "<img" in text:
            self.blocks.append(f'<p style="text-align:center">{text}</p>')
        self.pending = []
        self.pending_align = ""

    def pb(self):
        self.flush()
        if self.blocks and self.blocks[-1] != "<hr/>":
            self.blocks.append("<hr/>")

    def inline(self, node) -> str:
        if isinstance(node, NavigableString):
            if type(node).__name__ in ("Comment", "CData", "ProcessingInstruction", "Doctype", "Declaration"):
                return ""
            return esc(re.sub(r"[ \t\r\n]+", " ", str(node)))
        if not isinstance(node, Tag):
            return ""
        name = node.name.lower().split(":")[-1]
        if name in _SKIP:
            return ""
        if name == "br":
            return "<br/>"
        if name in ("img", "image"):
            src = node.get("src") or node.get("xlink:href") or node.get("href") or ""
            n = self.image(src, node.get("recindex"))
            if not n:
                return ""
            w = node.get("width")
            w = f' width="{int(float(w))}"' if w and re.fullmatch(r"\d+(\.\d+)?", str(w)) else ""
            return f'<img src="{esc(n)}"{w}/>'
        inner = "".join(self.inline(c) for c in node.children)
        tag = _INLINE_MAP.get(name)
        st = _style(node)
        if not tag:
            if st.get("font-weight") in ("bold", "bolder", "600", "700", "800", "900"):
                inner = f"<b>{inner}</b>"
            if st.get("font-style") == "italic":
                inner = f"<i>{inner}</i>"
            if "underline" in st.get("text-decoration", ""):
                inner = f"<u>{inner}</u>"
            return inner
        return f"<{tag}>{inner}</{tag}>" if inner.strip() else inner

    def has_blocks(self, tag: Tag) -> bool:
        for c in tag.children:
            if isinstance(c, Tag):
                n = c.name.lower().split(":")[-1]
                if n in _LEAF or (n in _CONTAINER and n != "span") or n in ("hr", "pagebreak"):
                    return True
        return False

    def block(self, node):
        if isinstance(node, NavigableString):
            if str(node).strip():
                self.pending.append(self.inline(node))
            return
        if not isinstance(node, Tag):
            return
        name = node.name.lower()
        short = name.split(":")[-1]
        if short in _SKIP:
            return
        if name == "mbp:pagebreak" or short == "pagebreak" or short == "hr":
            self.pb()
            return
        before, after = _page_break(node)
        if before:
            self.pb()
        if short in ("ul", "ol"):
            self.flush()
            items = []
            for li in node.find_all("li", recursive=False):
                sub = Cleaner(self.image)
                sub.pending = [sub.inline(c) for c in li.children if not (isinstance(c, Tag) and c.name in ("ul", "ol"))]
                t = "".join(sub.pending).strip()
                if t:
                    items.append(f"<li>{t}</li>")
            if items:
                self.blocks.append(f"<{short}>{''.join(items)}</{short}>")
        elif short == "blockquote":
            self.flush()
            sub = Cleaner(self.image)
            for c in node.children:
                sub.block(c)
            sub.flush()
            if sub.blocks:
                self.blocks.append(f"<blockquote>{''.join(b for b in sub.blocks if b != '<hr/>')}</blockquote>")
        elif short == "table":
            self.flush()
            for tr in node.find_all("tr"):
                cells = [self.inline(td).strip() for td in tr.find_all(["td", "th"])]
                if any(cells):
                    self.blocks.append(f"<p>{' | '.join(cells)}</p>")
        elif short in _LEAF and not self.has_blocks(node):
            self.flush()
            inner = "".join(self.inline(c) for c in node.children).strip()
            if short == "pre":
                inner = inner.replace("\n", "<br/>")
            if re.sub(r"<br/>|\s", "", inner):
                tag = short if short in _HEAD else "p"
                self.blocks.append(f"<{tag}{_align(node)}>{inner}</{tag}>")
            elif "<img" in inner:
                self.blocks.append(f'<p style="text-align:center">{inner}</p>')
        elif short in _CONTAINER or short in _LEAF or self.has_blocks(node):
            if short not in ("span",):
                self.flush()
            align = _align(node)
            for c in node.children:
                if isinstance(c, Tag) and (c.name.lower().split(":")[-1] in _LEAF | _CONTAINER - {"span"}
                                           or c.name.lower() in ("hr", "mbp:pagebreak")):
                    self.block(c)
                else:
                    if not self.pending:
                        self.pending_align = align
                    self.pending.append(self.inline(c))
            if short not in ("span",):
                self.flush()
        else:
            if not self.pending:
                self.pending_align = ""
            self.pending.append(self.inline(node))
        if after:
            self.pb()

    def run(self, html: str) -> list[str]:
        html = re.sub(r"<mbp:pagebreak\s*/?>", "<hr/>", html, flags=re.I)
        soup = BeautifulSoup(html, "lxml")
        for c in list((soup.body or soup).children):
            self.block(c)
        self.flush()
        while self.blocks and self.blocks[0] == "<hr/>":
            self.blocks.pop(0)
        while self.blocks and self.blocks[-1] == "<hr/>":
            self.blocks.pop()
        return self.blocks


def clean_html(html: str, image=None) -> list[str]:
    return Cleaner(image).run(html)


def _heading(block: str) -> tuple[int, str] | None:
    m = re.match(r"<h([1-6])[^>]*>(.*)</h\1>$", block, re.S)
    if not m:
        return None
    return int(m.group(1)), BeautifulSoup(m.group(2), "html.parser").get_text().strip()


def split_chapters(blocks: list[str], book_title: str) -> list[Chapter]:
    """Bloky → kapitoly podle nadpisů h1/h2 (h3, když vyšších není dost), jinak podle zalomení stránek."""
    heads = [h for h in (_heading(b) for b in blocks) if h]
    level = next((lv for lv in (1, 2, 3) if sum(1 for h in heads if h[0] <= lv) >= 2), 0)
    chapters: list[tuple[str, list[str]]] = []
    cur_title, cur = "", []
    for b in blocks:
        h = _heading(b)
        split = (h is not None and h[0] <= level) if level else b == "<hr/>"
        if split:
            if any(x != "<hr/>" for x in cur):
                chapters.append((cur_title, cur))
            cur_title, cur = (clean_title(h[1]) if h else ""), ([b] if h else [])
            continue
        if not level and not cur_title and h:
            cur_title = clean_title(h[1])
        cur.append(b)
    if any(x != "<hr/>" for x in cur):
        chapters.append((cur_title, cur))
    chapters = [c for c in chapters if c[0].lower() not in TOC_NAMES]
    if len(chapters) > 1 and (not chapters[0][0] or chapters[0][0].lower() == book_title.strip().lower()):
        body = chapters[0][1]
        text = plain_text("".join(body))
        if len(text) < 200 and "<img" not in "".join(body):
            chapters.pop(0)
        else:
            chapters[0] = ("Úvod", body)
    out = []
    for i, (t, body) in enumerate(chapters):
        while body and body[-1] == "<hr/>":
            body.pop()
        out.append(Chapter(t or (book_title if len(chapters) == 1 else f"Kapitola {i + 1}"), "".join(body)))
    return out


def chapters_from_text(text: str, fallback: str) -> tuple[str, list[Chapter]]:
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    title = next((ln.strip() for ln in lines if ln.strip()), fallback)
    chapters: list[tuple[str, list[str]]] = []
    front: list[str] = []
    paras = front
    buf: list[str] = []

    def flush():
        if buf:
            paras.append("\n".join(buf).strip())
            buf.clear()

    prev_blank = True
    for ln in lines:
        s = ln.strip()
        if prev_blank and s and len(s) < 120 and (NUM_TITLE.match(s) or WORD_TITLE.match(s)):
            flush()
            paras = []
            chapters.append((clean_title(s), paras))
        elif not s:
            flush()
        elif s == "[[STRANA]]":
            flush()
            paras.append("\f")
        else:
            buf.append(s)
        prev_blank = not s
    flush()

    def html(ps):
        return "".join("<hr/>" if p == "\f" else f"<p>{esc(p).replace(chr(10), '<br/>')}</p>" for p in ps if p)

    if not chapters:
        body = front[1:] if len(front) > 1 and front[0] == title else front
        return title, [Chapter(title, html(body))]
    return title, [Chapter(t, f"<h2>{esc(t)}</h2>" + html(ps)) for t, ps in chapters]


# ------------------------------------------------------------------ PalmDOC a PDB
def palmdoc_decompress(src: bytes) -> bytes:
    out = bytearray()
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        i += 1
        if c == 0 or 0x09 <= c <= 0x7F:
            out.append(c)
        elif c <= 0x08:
            out += src[i:i + c]
            i += c
        elif c >= 0xC0:
            out += bytes((0x20, c ^ 0x80))
        else:
            if i >= n:
                break
            pair = ((c << 8) | src[i]) & 0x3FFF
            i += 1
            dist, length = pair >> 3, (pair & 7) + 3
            if dist == 0 or dist > len(out):
                continue
            for _ in range(length):
                out.append(out[-dist])
    return bytes(out)


def palmdoc_compress(src: bytes) -> bytes:
    out = bytearray()
    n = len(src)
    head: dict[bytes, list[int]] = {}
    i = 0
    plain = lambda c: c == 0 or 0x09 <= c <= 0x7F  # noqa: E731

    def insert(p):
        if p + 2 < n:
            head.setdefault(src[p:p + 3], []).append(p)

    while i < n:
        best_len = best_dist = 0
        if i + 2 < n:
            for cand in reversed(head.get(src[i:i + 3], [])[-64:]):
                if i - cand > 2047:
                    break
                ln = 0
                while ln < 10 and i + ln < n and src[cand + ln] == src[i + ln]:
                    ln += 1
                if ln > best_len:
                    best_len, best_dist = ln, i - cand
                    if ln == 10:
                        break
        if best_len >= 3:
            v = 0x8000 | (best_dist << 3) | (best_len - 3)
            out += bytes((v >> 8, v & 0xFF))
            for k in range(best_len):
                insert(i + k)
            i += best_len
            continue
        c = src[i]
        if c == 0x20 and i + 1 < n and 0x40 <= src[i + 1] <= 0x7F:
            out.append(src[i + 1] ^ 0x80)
            insert(i)
            insert(i + 1)
            i += 2
            continue
        if plain(c):
            out.append(c)
            insert(i)
            i += 1
            continue
        cnt = 0
        while cnt < 8 and i + cnt < n and not plain(src[i + cnt]):
            cnt += 1
        out.append(cnt)
        out += src[i:i + cnt]
        for k in range(cnt):
            insert(i + k)
        i += cnt
    return bytes(out)


def split_records(data: bytes, size: int = 4096) -> list[bytes]:
    out, i = [], 0
    while i < len(data):
        end = min(len(data), i + size)
        while i < end < len(data) and (data[end] & 0xC0) == 0x80:  # nerozdělit znak UTF-8
            end -= 1
        out.append(data[i:end])
        i = end
    return out


def read_pdb(data: bytes) -> tuple[str, str, list[bytes]]:
    if len(data) < 78:
        raise ValueError("Soubor je příliš krátký na PDB/MOBI.")
    name = data[:32].split(b"\0")[0].decode("latin-1")
    kind = data[60:68].decode("latin-1")
    count = struct.unpack(">H", data[76:78])[0]
    offs = [struct.unpack(">I", data[78 + i * 8:82 + i * 8])[0] for i in range(count)] + [len(data)]
    return name, kind, [data[offs[i]:max(offs[i], offs[i + 1])] for i in range(count)]


def write_pdb(name: str, kind: bytes, records: list[bytes]) -> bytes:
    n = len(records)
    now = int(time.time()) + 2082844800
    head = bytearray(78)
    nm = re.sub(r"[^\x20-\x7e]", "_", name)[:31].encode("ascii")
    head[:len(nm)] = nm
    struct.pack_into(">HHII", head, 32, 0, 0, now, now)
    head[60:68] = kind
    struct.pack_into(">IIH", head, 68, 2 * n - 1, 0, n)
    table = bytearray()
    off = 78 + n * 8 + 2
    for i, r in enumerate(records):
        table += struct.pack(">I", off) + bytes((0,)) + (2 * i).to_bytes(3, "big")
        off += len(r)
    return bytes(head) + bytes(table) + b"\0\0" + b"".join(records)


# ------------------------------------------------------------------ čtení
def read_book(path: str | Path) -> RichBook:
    path = Path(path)
    name = path.name.lower()
    ext = "json" if name.endswith(".kniha.json") else path.suffix.lower().lstrip(".")
    if ext not in READ_FORMATS:
        raise NeedsCalibre(f"Formát .{ext} otevře jen Calibre.")
    data = path.read_bytes()
    base = path.name[: -len(".kniha.json")] if name.endswith(".kniha.json") else path.stem
    if ext == "epub":
        return read_epub(data, base)
    if ext in ("mobi", "prc", "azw", "pdb"):
        return read_mobi_pdb(data, base)
    if ext == "docx":
        return read_docx(data, base)
    if ext == "json":
        return from_project(json.loads(decode_text(data)))
    if ext in ("html", "htm"):
        book = RichBook(title=base)
        soup = BeautifulSoup(decode_text(data), "lxml")
        if soup.title and soup.title.get_text(strip=True):
            book.title = soup.title.get_text(strip=True)
        folder = path.parent

        def image(src, _rec):
            p = (folder / src.split("#")[0]).resolve() if src and not src.startswith(("http:", "https:", "data:")) else None
            if p and p.is_file():
                return book.add_image(p.read_bytes())
            return None

        book.chapters = split_chapters(clean_html(str(soup), image), book.title)
        return book
    title, chapters = chapters_from_text(decode_text(data), base)
    return RichBook(title=title or base, chapters=chapters)


def _resolve(base: str, href: str) -> str:
    from urllib.parse import unquote

    href = unquote(href.split("#")[0])
    parts = ([] if href.startswith("/") else list(PurePosixPath(base).parent.parts)) + href.lstrip("/").split("/")
    out: list[str] = []
    for p in parts:
        if p == "..":
            if out:
                out.pop()
        elif p and p != ".":
            out.append(p)
    return "/".join(out)


def read_epub(data: bytes, base: str = "Kniha") -> RichBook:
    z = zipfile.ZipFile(io.BytesIO(data))
    names = set(z.namelist())
    container = BeautifulSoup(z.read("META-INF/container.xml"), "xml")
    rf = container.find("rootfile")
    if not rf or not rf.get("full-path"):
        raise ValueError("EPUB nemá popis obsahu (content.opf).")
    opf_path = rf["full-path"]
    opf = BeautifulSoup(z.read(opf_path), "xml")

    def meta(tag):
        el = opf.find(tag) or opf.find(tag.split(":")[-1])
        return el.get_text(strip=True) if el else ""

    book = RichBook(title=meta("dc:title") or base, author=meta("dc:creator"),
                    language=(meta("dc:language") or "cs")[:2].lower())
    items = {}
    for it in opf.find_all("item"):
        href = _resolve(opf_path, it.get("href", ""))
        mt = it.get("media-type") or ("application/xhtml+xml" if re.search(r"\.x?html?$", href, re.I) else
                                      MIME.get(Path(href).suffix.lower().lstrip(".").replace("jpeg", "jpg"), ""))
        items[it.get("id")] = (href, mt, it.get("properties", "") or "")
    loaded: dict[str, str] = {}

    def load(path):
        if path in loaded:
            return loaded[path]
        if path not in names:
            return None
        d = z.read(path)
        ext = image_ext(d) or Path(path).suffix.lstrip(".").lower() or "jpg"
        loaded[path] = book.add_image(d, ext)
        return loaded[path]

    cover_item = next((v for v in items.values() if "cover-image" in v[2]), None)
    if not cover_item:
        m = opf.find("meta", attrs={"name": "cover"})
        cover_item = items.get(m.get("content")) if m else None
    if cover_item and cover_item[1].startswith("image/"):
        book.cover = load(cover_item[0])
    blocks: list[str] = []
    for ref in opf.find_all("itemref"):
        it = items.get(ref.get("idref"))
        if not it or "nav" in it[2] or not re.search("html|xml", it[1]) or it[0] not in names:
            continue
        doc_path = it[0]

        def image(src, _rec, doc_path=doc_path):
            n = load(_resolve(doc_path, src)) if src else None
            return None if n is None or n == book.cover else n

        part = clean_html(decode_text(z.read(doc_path)), image)
        if part:
            blocks += part + ["<hr/>"]
    while blocks and blocks[-1] == "<hr/>":
        blocks.pop()
    book.chapters = split_chapters(blocks, book.title)
    return book


def _trailing_size(rec: bytes, flags: int) -> int:
    size, num = len(rec), 0

    def entry(end):
        result = bitpos = 0
        p = end
        while p > 0:
            v = rec[p - 1]
            result |= (v & 0x7F) << bitpos
            bitpos += 7
            p -= 1
            if v & 0x80 or bitpos >= 28:
                break
        return result

    f = flags >> 1
    while f:
        if f & 1:
            num += entry(size - num)
        f >>= 1
    if flags & 1 and size - num - 1 >= 0:
        num += (rec[size - num - 1] & 3) + 1
    return min(num, size)


def read_mobi_pdb(data: bytes, base: str = "Kniha") -> RichBook:
    name, kind, recs = read_pdb(data)
    if kind == "TEXtREAd":
        comp, _unused, length, count = struct.unpack(">HHIH", recs[0][:10])
        raw = b"".join(palmdoc_decompress(r) if comp == 2 else r for r in recs[1:1 + count])
        title, chapters = chapters_from_text(decode_text(raw[:length or None]), name or base)
        return RichBook(title=title or name or base, chapters=chapters)
    if kind == "PNRdPPrs":
        raise NeedsCalibre("PDB ve formátu eReader (Peanut Press)")
    if kind != "BOOKMOBI":
        raise NeedsCalibre(f"neznámý typ PDB ({kind.strip()})")
    r0 = recs[0]
    comp, text_len, count, _size, enc = struct.unpack(">HxxIHHH", r0[:14])
    if enc:
        raise ValueError("Kniha je chráněná DRM a nejde otevřít.")
    if comp == 17480:
        raise NeedsCalibre("komprese HUFF/CDIC (knihy z obchodu Amazon)")
    hlen, = struct.unpack(">I", r0[20:24])
    encoding, = struct.unpack(">I", r0[28:32])
    first_image, = struct.unpack(">I", r0[108:112])
    flags = struct.unpack(">H", r0[0xF2:0xF4])[0] if hlen >= 0xE4 else 0
    exth_flags, = struct.unpack(">I", r0[128:132])
    codec = "utf-8" if encoding == 65001 else "cp1252"
    meta: dict[int, list[bytes]] = {}
    if exth_flags & 0x40 and r0[16 + hlen:20 + hlen] == b"EXTH":
        n = struct.unpack(">I", r0[24 + hlen:28 + hlen])[0]
        p = 28 + hlen
        for _ in range(n):
            t, ln = struct.unpack(">II", r0[p:p + 8])
            meta.setdefault(t, []).append(r0[p + 8:p + ln])
            p += ln
    fo, fl = struct.unpack(">II", r0[84:92])
    full_name = r0[fo:fo + fl].decode(codec, errors="replace")
    text = b"".join(
        palmdoc_decompress(r[:len(r) - _trailing_size(r, flags)]) if comp == 2 else r[:len(r) - _trailing_size(r, flags)]
        for r in recs[1:1 + count])[:text_len]
    dec = lambda b: b.decode(codec, errors="replace")  # noqa: E731
    book = RichBook(title=dec(meta[503][0]) if 503 in meta else (full_name or base),
                    author=", ".join(dec(a) for a in meta.get(100, [])),
                    language=(dec(meta[524][0])[:2].lower() if 524 in meta else "cs"))
    cache: dict[int, str] = {}

    def image_for(rec: int):
        if first_image == 0xFFFFFFFF:
            return None
        if rec in cache:
            return cache[rec]
        idx = first_image + rec - 1
        if not 0 <= idx < len(recs) or not image_ext(recs[idx]):
            return None
        cache[rec] = book.add_image(recs[idx])
        return cache[rec]

    if 201 in meta and first_image != 0xFFFFFFFF:
        book.cover = image_for(struct.unpack(">I", meta[201][0][:4])[0] + 1)
    blocks = clean_html(text.decode(codec, errors="replace"),
                        lambda _src, rec: image_for(int(rec)) if rec and rec.isdigit() else None)
    if book.cover and blocks and blocks[0] == f'<p style="text-align:center"><img src="{book.cover}"/></p>':
        blocks.pop(0)
    book.chapters = split_chapters(blocks, book.title)
    return book


def read_docx(data: bytes, base: str = "Kniha") -> RichBook:
    import docx
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    d = docx.Document(io.BytesIO(data))
    book = RichBook(title=(d.core_properties.title or "").strip() or base,
                    author=(d.core_properties.author or "").strip())
    ns_a = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
    ns_r = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
    ns_w = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    imgs: dict[str, str] = {}
    blocks: list[str] = []
    in_toc = False
    title = ""
    for p in d.paragraphs:
        style = (p.style.name if p.style is not None else "").lower()
        parts = []
        page_break_after = False
        for run in p.runs:
            el = run._element
            for br in el.iter(f"{ns_w}br"):
                if br.get(f"{ns_w}type") == "page":
                    if parts:
                        page_break_after = True
                    else:
                        blocks.append("<hr/>")
            for blip in el.iter(f"{ns_a}blip"):
                rid = blip.get(f"{ns_r}embed")
                part = p.part.related_parts.get(rid) if rid else None
                if part is not None:
                    if rid not in imgs:
                        imgs[rid] = book.add_image(part.blob)
                    parts.append(f'<img src="{imgs[rid]}"/>')
            t = esc(run.text).replace("\n", "<br/>").replace("\t", " ")
            if not t:
                continue
            if run.bold:
                t = f"<b>{t}</b>"
            if run.italic:
                t = f"<i>{t}</i>"
            if run.underline:
                t = f"<u>{t}</u>"
            if run.font.strike:
                t = f"<s>{t}</s>"
            if run.font.superscript:
                t = f"<sup>{t}</sup>"
            if run.font.subscript:
                t = f"<sub>{t}</sub>"
            parts.append(t)
        inner = re.sub(r"</(b|i|u|s)><\1>", "", "".join(parts)).strip()
        text = p.text.strip()
        if style == "title":
            title = title or text
            continue
        m = re.match(r"(?:heading|nadpis)\s?([1-6])$", style)
        if m:
            if text.lower() in TOC_NAMES:
                in_toc = True
                continue
            in_toc = False
            if text:
                blocks.append(f"<h{m.group(1)}>{esc(text)}</h{m.group(1)}>")
            continue
        if in_toc or style.startswith("toc"):
            continue
        if not inner:
            if page_break_after:
                blocks.append("<hr/>")
            continue
        al = {WD_ALIGN_PARAGRAPH.CENTER: "center", WD_ALIGN_PARAGRAPH.RIGHT: "right",
              WD_ALIGN_PARAGRAPH.JUSTIFY: "justify"}.get(p.alignment, "")
        if "<img" in inner and not text:
            al = al or "center"
        attr = f' style="text-align:{al}"' if al else ""
        blocks.append(f"<p{attr}>{inner}</p>")
        if page_break_after:
            blocks.append("<hr/>")
    if title and book.title == base:
        book.title = title
    # obálka = obrázek na úplném začátku, za ním zalomení stránky
    m = re.match(r'<p style="text-align:center"><img src="([^"]+)"/></p>$', blocks[0]) if blocks else None
    if m and len(blocks) > 1 and blocks[1] == "<hr/>":
        book.cover = m.group(1)
        blocks = blocks[2:]
    book.chapters = split_chapters(blocks, book.title)
    return book


# ------------------------------------------------------------------ projekt *.kniha.json
def from_project(proj: dict) -> RichBook:
    import book_images
    from html_docx import PAGE_BREAK, plain_to_html

    if "outline" not in proj or "chapters" not in proj:
        raise ValueError("Soubor není projekt knihy z Překladače.")
    o = proj["outline"]
    lang = str(proj.get("language") or "cs").lower()
    code = {"čeština": "cs", "slovenčina": "sk", "angličtina": "en", "němčina": "de"}.get(lang, lang[:2])
    book = RichBook(title=o.get("title") or "Kniha", author=proj.get("author") or "", language=code)
    for n in proj.get("images") or {}:
        book.images[n] = book_images.get_image(proj, n) or b""
    if proj.get("cover") in book.images:
        book.cover = proj["cover"]
    titles = o.get("chapters", [])
    for i, ch in enumerate(proj["chapters"]):
        t = ch.get("title") or (titles[i]["title"] if i < len(titles) else f"Kapitola {i + 1}")
        src = ch.get("html") or plain_to_html(ch.get("text", ""))
        blocks = ["<hr/>" if plain_text(b).strip() == PAGE_BREAK else b for b in clean_html(src)]
        book.chapters.append(Chapter(t, f"<h2>{i + 1}. {esc(t)}</h2>" + "".join(blocks)))
    return book


def to_project(book: RichBook) -> dict:
    import base64

    def body(ch: Chapter) -> str:
        return re.sub(r"^<h[1-3][^>]*>.*?</h[1-3]>", "", ch.html, count=1, flags=re.S)

    chapters = []
    for ch in book.chapters:
        b = body(ch)
        text = plain_text(b.replace("<hr/>", "<p>[[STRANA]]</p>"))
        entry = {"text": text, "summary": ""}
        if re.search(r"<(img|b|i|u|s|sub|sup|ul|ol|blockquote)\b|text-align", b):
            entry["html"] = b.replace("<hr/>", "<p>[[STRANA]]</p>")
        chapters.append(entry)
    words = [len(c["text"].split()) for c in chapters] or [2500]
    proj = {
        "language": {"cs": "čeština", "sk": "slovenčina", "en": "angličtina", "de": "němčina"}.get(book.language,
                                                                                                book.language),
        "description": "", "style": "", "words": max(300, round(sum(words) / len(words), -2) or 300),
        "outline": {"title": book.title, "synopsis": "", "characters": [],
                    "chapters": [{"title": c.title, "summary": ""} for c in book.chapters]},
        "chapters": chapters,
        "images": {n: base64.b64encode(d).decode("ascii") for n, d in book.images.items()},
    }
    if book.author:
        proj["author"] = book.author
    if book.cover:
        proj["cover"] = book.cover
    return proj


# ------------------------------------------------------------------ zápis
def write_book(book: RichBook, dst: str | Path) -> str:
    dst = Path(dst)
    fmt = dst.suffix.lower().lstrip(".")
    dst.parent.mkdir(parents=True, exist_ok=True)
    if fmt == "epub":
        dst.write_bytes(write_epub(book))
    elif fmt == "mobi":
        dst.write_bytes(write_mobi(book))
    elif fmt == "pdb":
        dst.write_bytes(write_palmdoc(book))
    elif fmt == "txt":
        dst.write_text(book_text(book), encoding="utf-8")
    elif fmt == "docx":
        write_docx(book, dst)
    elif fmt == "pdf":
        write_pdf(book, dst)
    elif fmt in ("html", "htm"):
        dst.write_text(book_html(book, inline_images=True), encoding="utf-8")
    else:
        raise NeedsCalibre(f"Formát .{fmt} uloží jen Calibre.")
    return str(dst)


def book_text(book: RichBook) -> str:
    out = [book.title] + ([book.author] if book.author else [])
    for i, ch in enumerate(book.chapters, 1):
        body = re.sub(r"^<h[1-3][^>]*>.*?</h[1-3]>", "", ch.html, count=1, flags=re.S)
        out += ["", "", f"{i}. {ch.title}", "", plain_text(body)]
    return "\n".join(out).strip() + "\n"


CSS = """body{font-family:Georgia,serif;line-height:1.5;margin:0 4%}
h1,h2{text-align:center;margin:1.2em 0 .8em;page-break-after:avoid}h3,h4{margin:1em 0 .5em}
p{text-indent:1.2em;margin:0 0 .35em;text-align:justify}
p[style*="center"],p[style*="right"]{text-indent:0}img{max-width:100%}
blockquote{margin:.6em 2em;font-style:italic}.pb{page-break-after:always}
.title{text-align:center;margin-top:30%;font-size:2em}.author{text-align:center;font-size:1.2em;text-indent:0}"""


def _xhtml(title: str, body: str, lang: str) -> str:
    return (f'<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" '
            f'xmlns:epub="http://www.idpf.org/2007/ops" lang="{lang}" xml:lang="{lang}"><head><meta charset="utf-8"/>'
            f'<title>{esc(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>'
            f'<body>{body}</body></html>')


def _safe(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def write_epub(book: RichBook) -> bytes:
    buf = io.BytesIO()
    lang = book.language or "cs"
    uid = f"urn:uuid:{random.getrandbits(64):016x}-{int(time.time()):x}"
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        z.writestr("META-INF/container.xml", '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:'
                   'tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" '
                   'media-type="application/oebps-package+xml"/></rootfiles></container>')
        z.writestr("OEBPS/style.css", CSS)
        manifest = ['<item id="css" href="style.css" media-type="text/css"/>',
                    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
                    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>']
        spine = []
        used = set(re.findall(r'<img src="([^"]+)"', "".join(c.html for c in book.chapters)))
        if book.cover:
            used.add(book.cover)
        files, cover_id = {}, ""
        for k, n in enumerate(sorted(used), 1):
            data = book.images.get(n)
            if not data:
                continue
            ext = image_ext(data) or Path(n).suffix.lstrip(".") or "jpg"
            files[n] = f"images/{_safe(Path(n).stem)}.{ext}"
            z.writestr(f"OEBPS/{files[n]}", data)
            props = ' properties="cover-image"' if n == book.cover else ""
            if n == book.cover:
                cover_id = f"img{k}"
            manifest.append(f'<item id="img{k}" href="{files[n]}" media-type="{MIME.get(ext, "image/jpeg")}"{props}/>')

        def fix(html):
            html = re.sub(r'<img src="([^"]+)"', lambda m: f'<img alt="" src="{files.get(htmllib.unescape(m.group(1)), m.group(1))}"', html)
            html = re.sub(r'(<img [^>]*?)width="(\d+)"', lambda m: f'{m.group(1)}style="width:{min(100, round(int(m.group(2)) / 8))}%"', html)
            return html.replace("<hr/>", '<div class="pb" style="page-break-after:always"></div>')

        if book.cover in files:
            z.writestr("OEBPS/cover.xhtml", _xhtml("Obálka", f'<div style="text-align:center"><img src="{files[book.cover]}" '
                                                           f'alt="Obálka" style="max-height:100%"/></div>', lang))
            manifest.append('<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>')
            spine.append('<itemref idref="cover" linear="no"/>')
        z.writestr("OEBPS/title.xhtml", _xhtml(book.title, f'<h1 class="title">{esc(book.title)}</h1>' + (
            f'<p class="author">{esc(book.author)}</p>' if book.author else ""), lang))
        manifest.append('<item id="titlepage" href="title.xhtml" media-type="application/xhtml+xml"/>')
        spine.append('<itemref idref="titlepage"/>')
        nav, ncx = [], []
        for i, ch in enumerate(book.chapters, 1):
            fn = f"ch{i:03d}.xhtml"
            z.writestr(f"OEBPS/{fn}", _xhtml(ch.title, fix(ch.html), lang))
            manifest.append(f'<item id="c{i}" href="{fn}" media-type="application/xhtml+xml"/>')
            spine.append(f'<itemref idref="c{i}"/>')
            nav.append(f'<li><a href="{fn}">{esc(ch.title)}</a></li>')
            ncx.append(f'<navPoint id="n{i}" playOrder="{i}"><navLabel><text>{esc(ch.title)}</text></navLabel>'
                       f'<content src="{fn}"/></navPoint>')
        z.writestr("OEBPS/nav.xhtml", _xhtml("Obsah", f'<nav epub:type="toc" id="toc"><h2>Obsah</h2><ol>{"".join(nav)}'
                                                     f'</ol></nav>', lang))
        z.writestr("OEBPS/toc.ncx", f'<?xml version="1.0" encoding="utf-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" '
                   f'version="2005-1"><head><meta name="dtb:uid" content="{uid}"/></head><docTitle><text>{esc(book.title)}'
                   f'</text></docTitle><navMap>{"".join(ncx)}</navMap></ncx>')
        modified = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        z.writestr("OEBPS/content.opf", (
            f'<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" '
            f'unique-identifier="bookid" xml:lang="{lang}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
            f'<dc:identifier id="bookid">{uid}</dc:identifier><dc:title>{esc(book.title)}</dc:title><dc:language>{lang}'
            f'</dc:language>{f"<dc:creator>{esc(book.author)}</dc:creator>" if book.author else ""}'
            f'<meta property="dcterms:modified">{modified}</meta>'
            f'{f"<meta name=\"cover\" content=\"{cover_id}\"/>" if cover_id else ""}</metadata>'
            f'<manifest>{"".join(manifest)}</manifest><spine toc="ncx">{"".join(spine)}</spine>'
            f'{"<guide><reference type=\"cover\" title=\"Obálka\" href=\"cover.xhtml\"/></guide>" if cover_id else ""}'
            '</package>'))
    return buf.getvalue()


def _kindle_image(data: bytes) -> bytes:
    """Kindle (MOBI) zobrazí JPEG a GIF; ostatní se převedou, velké se zmenší."""
    ext = image_ext(data)
    if ext in ("jpg", "gif") and len(data) <= 512 * 1024:
        return data
    try:
        from PIL import Image

        with Image.open(io.BytesIO(data)) as im:
            im.thumbnail((1600, 1600))
            if im.mode in ("RGBA", "LA", "P"):
                bg = Image.new("RGB", im.size, "white")
                bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[3])
                im = bg
            out = io.BytesIO()
            im.convert("RGB").save(out, "JPEG", quality=85, optimize=True)
            return out.getvalue()
    except Exception:  # noqa: BLE001 – neznámý obrázek ponecháme
        return data


def write_mobi(book: RichBook) -> bytes:
    """MOBI 6 (Kindle): PalmDOC komprese, EXTH (autor, název, jazyk, obálka), obrázky, obsah s odkazy."""
    order: list[str] = []
    if book.cover in book.images:
        order.append(book.cover)
    for ch in book.chapters:
        for n in re.findall(r'<img src="([^"]+)"', ch.html):
            n = htmllib.unescape(n)
            if n in book.images and n not in order:
                order.append(n)
    rec = {n: f"{i + 1:05d}" for i, n in enumerate(order)}

    def kindle(html: str) -> str:
        html = html.replace("<hr/>", "<mbp:pagebreak/>")
        html = re.sub(r'<img src="([^"]+)"(?: width="\d+")?/>',
                      lambda m: f'<img recindex="{rec.get(htmllib.unescape(m.group(1)), "00000")}"/>'
                      if htmllib.unescape(m.group(1)) in rec else "", html)
        html = re.sub(r'<(p|h[1-6]) style="text-align:(\w+)">', r'<\1 align="\2">', html)
        return html.replace("<s>", "<strike>").replace("</s>", "</strike>")

    FP = "0000000000"
    pieces: list = ['<html><head><guide><reference type="toc" title="Obsah" filepos=@toc /><reference type="text" '
                    'title="Začátek" filepos=@start /></guide></head><body>']
    if book.cover in rec:
        pieces.append(f'<p align="center"><img recindex="{rec[book.cover]}"/></p><mbp:pagebreak/>')
    pieces.append(f'<p align="center"><font size="+3"><b>{esc(book.title)}</b></font></p>')
    if book.author:
        pieces.append(f'<p align="center"><font size="+1">{esc(book.author)}</font></p>')
    pieces.append("<mbp:pagebreak/>")
    pieces += [("mark", "toc"), "<h2>Obsah</h2>"]
    pieces += [f"<p><a filepos=@ch{i}>{esc(c.title)}</a></p>" for i, c in enumerate(book.chapters)]
    pieces += ["<mbp:pagebreak/>", ("mark", "start")]
    for i, ch in enumerate(book.chapters):
        pieces += [("mark", f"ch{i}"), kindle(ch.html)]
        if i < len(book.chapters) - 1:
            pieces.append("<mbp:pagebreak/>")
    pieces.append("</body></html>")
    out = bytearray()
    marks: dict[str, int] = {}
    holes: list[tuple[int, str]] = []
    for p in pieces:
        if isinstance(p, tuple):
            marks[p[1]] = len(out)
            continue
        last = 0
        for m in re.finditer(r"@(toc|start|ch\d+)", p):
            out += p[last:m.start()].encode("utf-8")
            holes.append((len(out), m.group(1)))
            out += FP.encode()
            last = m.end()
        out += p[last:].encode("utf-8")
    for at, mk in holes:
        out[at:at + 10] = f"{marks.get(mk, 0):010d}".encode()
    text = bytes(out)
    recs = [palmdoc_compress(r) for r in split_records(text)]
    t = len(recs)
    images = [_kindle_image(book.images[n]) for n in order]
    first_image = t + 1 if images else 0xFFFFFFFF
    flis_idx = t + 1 + len(images)

    exth_recs = []

    def exth(kind, data: bytes):
        exth_recs.append(struct.pack(">II", kind, len(data) + 8) + data)

    if book.author:
        exth(100, book.author.encode("utf-8"))
    exth(503, book.title.encode("utf-8"))
    exth(524, (book.language or "cs").encode("utf-8"))
    exth(106, time.strftime("%Y-%m-%d").encode())
    exth(108, "Prekladac".encode())
    if book.cover in rec:
        exth(201, struct.pack(">I", 0))
        exth(202, struct.pack(">I", 0))
    body = b"".join(exth_recs)
    pad = (4 - (12 + len(body)) % 4) % 4
    exth_block = b"EXTH" + struct.pack(">II", 12 + len(body) + pad, len(exth_recs)) + body + b"\0" * pad
    title = book.title.encode("utf-8")
    hlen = 232
    full_off = 16 + hlen + len(exth_block)
    mobi = bytearray(hlen)
    mobi[0:4] = b"MOBI"
    struct.pack_into(">IIIII", mobi, 4, hlen, 2, 65001, random.getrandbits(32), 6)
    for o in range(24, 64, 4):
        struct.pack_into(">I", mobi, o, 0xFFFFFFFF)
    struct.pack_into(">IIIIIIII", mobi, 64, t + 1, full_off, len(title), LCID.get(book.language, 0), 0, 0, 6, first_image)
    struct.pack_into(">I", mobi, 112, 0x50)
    for o in (148, 152, 156, 208, 216, 220, 228):
        struct.pack_into(">I", mobi, o, 0xFFFFFFFF)
    struct.pack_into(">HHIIIIII", mobi, 176, 1, t + len(images), 1, flis_idx + 1, 1, flis_idx, 1, 0)
    struct.pack_into(">I", mobi, 224, 0)
    palm = struct.pack(">HHIHHHH", 2, 0, len(text), t, 4096, 0, 0)
    tail = b"\0" * (2 + (4 - (full_off + len(title) + 2) % 4) % 4)
    rec0 = palm + bytes(mobi) + exth_block + title + tail
    flis = bytes.fromhex("464c4953000000080041000000000000ffffffff000100030000000300000001ffffffff")
    fcis = b"FCIS" + struct.pack(">IIIII", 0x14, 0x10, 1, 0, len(text)) + struct.pack(">IIIHHI", 0, 0x20, 8, 1, 1, 0)
    eof = b"\xe9\x8e\r\n"
    return write_pdb(book.title, b"BOOKMOBI", [rec0, *recs, *images, flis, fcis, eof])


def write_palmdoc(book: RichBook) -> bytes:
    text = book_text(book).encode("utf-8")
    recs = [palmdoc_compress(r) for r in split_records(text)]
    rec0 = struct.pack(">HHIHHI", 2, 0, len(text), len(recs), 4096, 0)
    return write_pdb(book.title, b"TEXtREAd", [rec0, *recs])


def write_docx(book: RichBook, dst: str | Path) -> None:
    import docx
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
    from docx.shared import Inches

    import book_images
    from html_docx import add_html

    d = docx.Document()
    d.core_properties.title = book.title
    d.core_properties.author = book.author
    try:
        d.core_properties.language = book.language
    except Exception:  # noqa: BLE001
        pass
    if book.cover in book.images:
        data = book.images[book.cover]
        try:
            w, h = book_images.size_px(data)
        except Exception:  # noqa: BLE001
            w, h = 600, 900
        p = d.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(io.BytesIO(data), width=Inches(min(6.0, 9.0 * w / max(1, h))))
        p.add_run().add_break(WD_BREAK.PAGE)
    t = d.add_paragraph(book.title, style="Title")
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if book.author:
        a = d.add_paragraph(book.author)
        a.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for ch in book.chapters:
        d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
        add_html(d, ch.html, book.images)
    d.save(str(dst))


def book_html(book: RichBook, inline_images: bool = False) -> str:
    """Celá kniha jako jedno HTML (pro PDF a uložení .html)."""
    import base64

    def src(m):
        n = htmllib.unescape(m.group(1))
        data = book.images.get(n)
        if inline_images and data:
            return f'<img src="data:{MIME.get(image_ext(data), "image/jpeg")};base64,{base64.b64encode(data).decode()}"'
        return f'<img src="{esc(n)}"'

    parts = []
    if book.cover in book.images:
        parts.append(f'<p style="text-align:center"><img src="{esc(book.cover)}" height="900"/></p>'
                     '<p style="page-break-after:always"></p>')
    parts.append(f'<h1 style="text-align:center;margin-top:200px">{esc(book.title)}</h1>')
    if book.author:
        parts.append(f'<p style="text-align:center">{esc(book.author)}</p>')
    for ch in book.chapters:
        html = ch.html.replace("<hr/>", '<p style="page-break-after:always"></p>')
        parts.append(f'<div style="page-break-before:always">{html}</div>')
    body = re.sub(r'<img src="([^"]+)"', src, "".join(parts))
    return (f'<!DOCTYPE html><html lang="{book.language}"><head><meta charset="utf-8"/><title>{esc(book.title)}</title>'
            f'<style>{CSS}</style></head><body>{body}</body></html>')


def write_pdf(book: RichBook, dst: str | Path) -> None:
    """PDF (A4) přes Qt – bez Calibre. Z vlákna na pozadí se zápis provede v hlavním vlákně okna."""
    import sys

    from PySide6 import QtCore, QtGui

    app = QtGui.QGuiApplication.instance()
    if app is None:  # spuštění bez okna (příkazová řádka, testy)
        import os

        if sys.platform != "win32":
            os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
        app = QtGui.QGuiApplication([])
        _keep_app.append(app)
    if QtCore.QThread.currentThread() is not app.thread():
        runner = _MainThreadCall(lambda: _write_pdf(book, dst))
        runner.moveToThread(app.thread())
        QtCore.QMetaObject.invokeMethod(runner, "run", QtCore.Qt.BlockingQueuedConnection)
        if runner.error:
            raise runner.error
        return
    _write_pdf(book, dst)


_keep_app: list = []


def _main_thread_class():
    from PySide6 import QtCore

    class MainThreadCall(QtCore.QObject):
        def __init__(self, fn):
            super().__init__()
            self.fn, self.error = fn, None

        @QtCore.Slot()
        def run(self):
            try:
                self.fn()
            except Exception as e:  # noqa: BLE001 – předá se volajícímu vláknu
                self.error = e

    return MainThreadCall


def _MainThreadCall(fn):  # noqa: N802 – třída se vytvoří až při prvním použití (Qt se načítá líně)
    global _MTC
    try:
        cls = _MTC
    except NameError:
        cls = _MTC = _main_thread_class()
    return cls(fn)


def _write_pdf(book: RichBook, dst: str | Path) -> None:
    from PySide6 import QtCore, QtGui

    doc = QtGui.QTextDocument()
    font = QtGui.QFont("Georgia")
    font.setPointSizeF(12)
    doc.setDefaultFont(font)
    doc.setDefaultStyleSheet("p{margin-bottom:6px} h1{font-size:26pt} h2{font-size:18pt} blockquote{font-style:italic}")
    for n, data in book.images.items():
        img = QtGui.QImage.fromData(data)
        if not img.isNull():
            if img.width() > 1400:
                img = img.scaledToWidth(1400, QtCore.Qt.SmoothTransformation)
            doc.addResource(QtGui.QTextDocument.ImageResource, QtCore.QUrl(n), img)
    html = book_html(book)
    # Qt neumí šířku v procentech u obrázků – omezí se na šířku stránky
    html = re.sub(r'(<img src="[^"]+")(?: width="(\d+)")?(/?>)',
                  lambda m: f'{m.group(1)} width="{min(int(m.group(2) or 800), 800) * 0.8:.0f}"{m.group(3)}', html)
    doc.setHtml(html)
    writer = QtGui.QPdfWriter(str(dst))
    writer.setPageSize(QtGui.QPageSize(QtGui.QPageSize.A4))
    writer.setPageMargins(QtCore.QMarginsF(20, 20, 20, 20), QtGui.QPageLayout.Millimeter)
    writer.setTitle(book.title)
    writer.setCreator("Překladač")
    doc.print_(writer)
    if not Path(dst).exists() or Path(dst).stat().st_size < 100:
        raise OSError(f"PDF se nepodařilo zapsat: {dst}")


def convert(src: str | Path, dst: str | Path, log=print) -> str:
    """Převod bez Calibre; NeedsCalibre, když formát neumí."""
    s = Path(src)
    sx = "json" if s.name.lower().endswith(".kniha.json") else s.suffix.lower().lstrip(".")
    dx = Path(dst).suffix.lower().lstrip(".")
    if sx not in READ_FORMATS:
        raise NeedsCalibre(f"Formát .{sx} otevře jen Calibre.")
    if dx not in WRITE_FORMATS:
        raise NeedsCalibre(f"Formát .{dx} uloží jen Calibre.")
    book = read_book(s)
    write_book(book, dst)
    log(f"Převedeno bez Calibre: {s.name} → {Path(dst).name} ({len(book.chapters)} kapitol, {len(book.images)} obrázků)")
    return str(dst)
