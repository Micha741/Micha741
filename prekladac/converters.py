"""Převody formátů a překlad souborů (EPUB, AZW3, KFX, MOBI, PDF, DOCX, TXT, RTF, obrázky)."""

from __future__ import annotations

import copy
import html
import io
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Callable, Protocol

# ---------------------------------------------------------------- typy
EBOOK_EXT = {".epub", ".azw3", ".azw", ".kfx", ".mobi", ".fb2", ".rtf", ".odt", ".htmlz", ".lit", ".pdb"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff", ".gif"}
DOC_EXT = {".docx", ".txt", ".pdf"}
# tyto formáty umí jen „Microsoft – překlad celých dokumentů“
DOC_ONLY_EXT = {".pptx", ".xlsx", ".md"}
SUPPORTED_EXT = EBOOK_EXT | IMAGE_EXT | DOC_EXT | DOC_ONLY_EXT
OUTPUT_FORMATS = ["epub", "azw3", "docx", "pdf", "txt", "rtf", "mobi", "pdb", "fb2", "odt", "htmlz"]
NATIVE_OUTPUT = {"epub", "docx", "pdf", "txt", "mobi", "pdb", "rtf", "fb2", "odt", "htmlz"}  # bez Calibre

LANG_CODES = {
    "čeština": "cs", "slovenština": "sk", "angličtina": "en", "němčina": "de", "polština": "pl",
    "francouzština": "fr", "španělština": "es", "italština": "it", "ruština": "ru", "ukrajinština": "uk",
}

PDF_PAGES_PER_CHUNK = 5


class Translator(Protocol):
    target_lang: str

    def translate_segments(self, segments, markup, progress=None, context="") -> list[str]: ...
    def image_blocks(self, path: str, translate: bool) -> list[dict]: ...
    def pdf_blocks(self, pdf_bytes: bytes, translate: bool) -> list[dict]: ...


Log = Callable[[str], None]
Progress = Callable[[float], None]


def _noop(*_a, **_k):
    pass


# ------------------------------------------------------------- Calibre
def find_ebook_convert(custom: str | None = None) -> str | None:
    """Nastavená cesta → nainstalované Calibre → Calibre přibalené k programu."""
    from components import bundled_exe

    candidates = [custom] if custom else []
    candidates.append(shutil.which("ebook-convert"))
    for base in (os.environ.get("ProgramFiles", r"C:\Program Files"), os.environ.get("ProgramFiles(x86)", "")):
        if base:
            candidates.append(os.path.join(base, "Calibre2", "ebook-convert.exe"))
            candidates.append(os.path.join(base, "Calibre", "ebook-convert.exe"))
    candidates.append("/Applications/calibre.app/Contents/MacOS/ebook-convert")
    candidates.append(bundled_exe("Calibre2", "ebook-convert"))
    for c in candidates:
        if c and os.path.isfile(c):
            return c
    return None


class CalibreMissing(Exception):
    pass


def _missing_msg(src: str, dst: str) -> str:
    return (f"Převod {Path(src).suffix.upper()} → {Path(dst).suffix.upper()} umí jen Calibre, které není nainstalované. "
            "EPUB, MOBI, AZW3 (čtení), PDB, DOCX, RTF, ODT, FB2, HTMLZ, TXT a PDF převede Překladač sám; Calibre je "
            "potřeba jen pro zápis AZW3, pro KFX a LIT. Nainstalujte ho zdarma (Nastavení → Součásti → Stáhnout "
            "Calibre) a spusťte převod znovu.")


def calibre_convert(src: str, dst: str, log: Log = _noop, ebook_convert: str | None = None,
                    extra: list[str] | None = None) -> None:
    exe = find_ebook_convert(ebook_convert)
    if not exe:
        raise CalibreMissing(_missing_msg(src, dst))
    if src.lower().endswith(".kfx"):
        _ensure_kfx_plugin(exe, log)
    log(f"  Calibre: {Path(src).suffix} → {Path(dst).suffix}")
    flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
    proc = subprocess.run([exe, src, dst, *(extra or [])], capture_output=True, text=True, errors="replace",
                          creationflags=flags)
    if proc.returncode != 0 or not os.path.exists(dst):
        tail = (proc.stderr or proc.stdout or "")[-1500:]
        hint = ""
        if src.lower().endswith(".kfx"):
            hint = "\nPro KFX nainstalujte do Calibre plugin „KFX Input“ (Předvolby → Moduly → Získat nové moduly)."
        raise RuntimeError(f"Calibre převod selhal:\n{tail}{hint}")


def convert(src: str, dst: str, log: Log = _noop, ebook_convert: str | None = None,
            extra: list[str] | None = None) -> None:
    """Převod formátu vlastním kódem (ebook.py), Calibre jen pro zápis AZW3, KFX a LIT."""
    import ebook

    if not extra:
        try:
            ebook.convert(src, dst, log)
            return
        except ebook.NeedsCalibre as e:
            if not find_ebook_convert(ebook_convert):
                raise CalibreMissing(f"{e}.\n\n{_missing_msg(src, dst)}") from e
            log(f"  {e} – převádím přes Calibre")
    calibre_convert(src, dst, log, ebook_convert, extra)


def _ensure_kfx_plugin(exe: str, log: Log) -> None:
    """Pro KFX je potřeba plugin KFX Input – když chybí, stáhne a nainstaluje ho."""
    import components

    if components.calibre_kfx_plugin(exe) is False:
        log("  Plugin KFX Input v Calibre chybí, instaluji ho…")
        try:
            components.install_kfx_plugin(exe, log)
        except Exception as e:  # noqa: BLE001 – převod se i tak zkusí, chyba se vypíše
            log(f"  ! {e}")


# ----------------------------------------------------------------- EPUB
BLOCK_TAGS = {
    "p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "td", "th", "dt", "dd", "blockquote", "figcaption",
    "caption", "div", "section", "article", "aside", "header", "footer", "pre", "address", "title",
    "ol", "ul", "dl", "table", "tr", "tbody", "thead", "tfoot", "body", "nav", "figure", "hr",
}
SKIP_TAGS = {"script", "style", "svg", "math", "head", "code"}


def _local(name: str | None) -> str:
    return (name or "").split(":")[-1].lower()


def _collect_epub_segments(soup) -> list:
    """Najde prvky, jejichž obsah se přeloží jako jeden HTML fragment."""
    from bs4 import NavigableString, Tag
    from bs4.element import Comment, ProcessingInstruction, Doctype, CData

    targets: list = []

    def has_block_child(el) -> bool:
        return any(isinstance(d, Tag) and _local(d.name) in BLOCK_TAGS for d in el.descendants)

    def walk(el):
        for child in list(el.children):
            if isinstance(child, (Comment, ProcessingInstruction, Doctype, CData)):
                continue
            if isinstance(child, NavigableString):
                if child.strip():
                    targets.append(child)  # volný text mezi bloky
                continue
            if not isinstance(child, Tag):
                continue
            name = _local(child.name)
            if name in SKIP_TAGS:
                continue
            if name in BLOCK_TAGS:
                if has_block_child(child):
                    walk(child)
                elif child.get_text().strip():
                    targets.append(child)
            elif child.get_text().strip():
                # vložený (inline) prvek přímo v bloku s dalšími bloky – např. <a> v obsahu
                if has_block_child(child):
                    walk(child)
                else:
                    targets.append(child)

    body = soup.find(lambda t: _local(t.name) == "body")
    head_title = soup.find(lambda t: _local(t.name) == "title")
    if head_title is not None and head_title.get_text().strip():
        targets.append(head_title)
    if body is not None:
        walk(body)
    return targets


def _inner_html(node) -> str:
    from bs4 import NavigableString

    if isinstance(node, NavigableString):
        return html.escape(str(node), quote=False)
    return "".join(str(c) for c in node.contents)


def _replace_inner(node, fragment: str) -> None:
    from bs4 import BeautifulSoup, NavigableString

    if isinstance(node, NavigableString):
        node.replace_with(html.unescape(re.sub(r"<[^>]+>", "", fragment)))
        return
    # holé „&“ (častá chyba v odpovědi) převedeme na platnou entitu
    fragment = re.sub(r"&(?!#?\w+;)", "&amp;", fragment)
    try:
        wrapper = BeautifulSoup(f'<x xmlns="http://www.w3.org/1999/xhtml">{fragment}</x>', "xml").find("x")
        if wrapper is None:
            raise ValueError
        new_children = [c.extract() for c in list(wrapper.contents)]
    except Exception:
        new_children = None
    node.clear()
    if new_children is None:
        node.append(html.unescape(re.sub(r"<[^>]+>", "", fragment)))
    else:
        for c in new_children:
            node.append(c)


def translate_epub(src: str, dst: str, tr: Translator, log: Log = _noop, progress: Progress = _noop) -> None:
    from bs4 import BeautifulSoup

    with zipfile.ZipFile(src) as zin:
        infos = zin.infolist()
        files = {i.filename: zin.read(i.filename) for i in infos}

    doc_names = [n for n in files if n.lower().endswith((".xhtml", ".html", ".htm"))]
    ncx_names = [n for n in files if n.lower().endswith(".ncx")]
    opf_names = [n for n in files if n.lower().endswith(".opf")]

    soups: dict[str, BeautifulSoup] = {}
    nodes: list = []
    for name in doc_names:
        soup = BeautifulSoup(files[name], "xml")
        soups[name] = soup
        nodes.extend(_collect_epub_segments(soup))
    for name in ncx_names:
        soup = BeautifulSoup(files[name], "xml")
        soups[name] = soup
        nodes.extend(t for t in soup.find_all(lambda t: _local(t.name) == "text") if t.get_text().strip())

    title = ""
    for name in opf_names:
        opf = BeautifulSoup(files[name], "xml")
        t = opf.find(lambda t: _local(t.name) == "title")
        if t is not None:
            title = t.get_text().strip()
        code = LANG_CODES.get(tr.target_lang.lower())
        lang = opf.find(lambda t: _local(t.name) == "language")
        if code and lang is not None:
            lang.string = code
            files[name] = str(opf).encode("utf-8")

    log(f"  EPUB: {len(doc_names)} kapitol, {len(nodes)} textových bloků")
    segments = [_inner_html(n) for n in nodes]
    context = f"Jde o úseky z knihy „{title}“." if title else ""
    translated = tr.translate_segments(segments, markup=True, progress=progress, context=context)
    for node, text in zip(nodes, translated):
        _replace_inner(node, text)

    for name, soup in soups.items():
        files[name] = str(soup).encode("utf-8")

    _write_epub(dst, infos, files)


def _write_epub(dst: str, infos, files: dict[str, bytes]) -> None:
    with zipfile.ZipFile(dst, "w") as zout:
        if "mimetype" in files:
            zout.writestr(zipfile.ZipInfo("mimetype"), files["mimetype"], compress_type=zipfile.ZIP_STORED)
        for info in infos:
            if info.filename == "mimetype" or info.is_dir():
                continue
            zout.writestr(info.filename, files[info.filename], compress_type=zipfile.ZIP_DEFLATED)


# ----------------------------------------------------------------- DOCX
_NON_TEXT_RUN = (
    "w:drawing", "w:pict", "w:object", "w:fldChar", "w:instrText", "mc:AlternateContent", "w:footnoteReference",
    "w:endnoteReference", "w:sym",
)


def _text_runs(p):
    from docx.oxml.ns import qn

    runs = []
    for r in p.iter(qn("w:r")):
        # jen běhy patřící přímo tomuto odstavci (ne odstavcům v textových polích uvnitř)
        anc = r.getparent()
        while anc is not None and anc.tag != qn("w:p"):
            anc = anc.getparent()
        if anc is not p:
            continue
        if any(r.find(".//" + qn(t)) is not None for t in _NON_TEXT_RUN if not t.startswith("mc:")):
            continue
        if any(child.tag.endswith("}AlternateContent") for child in r):
            continue
        if r.find(qn("w:t")) is None:
            continue
        runs.append(r)
    return runs


def _run_fmt(run) -> tuple[bool, bool, bool]:
    return bool(run.bold), bool(run.italic), bool(run.underline)


def _encode_runs(runs) -> tuple[str, bool]:
    """Vrátí text odstavce; pokud se formátování běhů liší, s inline značkami <b>/<i>/<u>."""
    fmts = [_run_fmt(r) for r in runs]
    if len(set(fmts)) <= 1:
        return "".join(r.text for r in runs), False
    out = []
    for r, (b, i, u) in zip(runs, fmts):
        t = html.escape(r.text, quote=False)
        if u:
            t = f"<u>{t}</u>"
        if i:
            t = f"<i>{t}</i>"
        if b:
            t = f"<b>{t}</b>"
        out.append(t)
    return "".join(out), True


def _decode_markup(text: str) -> list[tuple[str, bool, bool, bool]]:
    pieces = []
    state = {"b": 0, "i": 0, "u": 0}
    for tok in re.split(r"(</?[biu]>)", text):
        m = re.fullmatch(r"<(/?)([biu])>", tok)
        if m:
            state[m.group(2)] += -1 if m.group(1) else 1
            state[m.group(2)] = max(0, state[m.group(2)])
        elif tok:
            plain = html.unescape(re.sub(r"<[^>]+>", "", tok))
            pieces.append((plain, state["b"] > 0, state["i"] > 0, state["u"] > 0))
    return pieces


def _apply_translation(p, run_elems, translated: str, markup: bool) -> None:
    from docx.oxml.ns import qn
    from docx.text.run import Run

    base = run_elems[0]
    base_run = Run(base, None)
    base_b, base_i, base_u = _run_fmt(base_run)
    pieces = _decode_markup(translated) if markup else [(translated, base_b, base_i, base_u)]

    # Ostatní textové běhy vyprázdníme (běhy s obrázky apod. zůstávají na místě).
    for r in run_elems[1:]:
        for child in list(r):
            if child.tag in (qn("w:t"), qn("w:tab"), qn("w:br"), qn("w:cr")):
                r.remove(child)
        if all(child.tag == qn("w:rPr") for child in r) and r.getparent() is not None:
            r.getparent().remove(r)

    template = copy.deepcopy(base)
    prev = base
    for idx, (text, b, i, u) in enumerate(pieces or [("", base_b, base_i, base_u)]):
        elem = base if idx == 0 else copy.deepcopy(template)
        if idx > 0:
            prev.addnext(elem)
        run = Run(elem, None)
        run.text = text
        if markup:
            run.bold = True if b else (False if base_b else None)
            run.italic = True if i else (False if base_i else None)
            run.underline = True if u else (False if base_u else None)
        prev = elem


def _docx_paragraph_parts(document):
    parts = [document.element.body]
    seen = set()
    for section in document.sections:
        for hf in (
            section.header, section.footer, section.first_page_header, section.first_page_footer,
            section.even_page_header, section.even_page_footer,
        ):
            try:
                if hf.is_linked_to_previous:
                    continue
                el = hf._element
            except Exception:
                continue
            if id(el) not in seen:
                seen.add(id(el))
                parts.append(el)
    return parts


def translate_docx(src: str, dst: str, tr: Translator, log: Log = _noop, progress: Progress = _noop) -> None:
    import docx
    from docx.oxml.ns import qn
    from docx.text.run import Run

    document = docx.Document(src)
    items = []  # (paragraph element, text runs, markup)
    for part in _docx_paragraph_parts(document):
        for p in part.iter(qn("w:p")):
            runs = _text_runs(p)
            if not runs:
                continue
            text, markup = _encode_runs([Run(r, None) for r in runs])
            if text.strip():
                items.append((p, runs, text, markup))

    log(f"  DOCX: {len(items)} odstavců")
    title = (document.core_properties.title or "").strip()
    context = f"Jde o odstavce z dokumentu „{title}“." if title else ""
    # Odstavce se značkami a bez nich se posílají zvlášť (jiný pokyn pro model).
    plain_idx = [k for k, it in enumerate(items) if not it[3]]
    mark_idx = [k for k, it in enumerate(items) if it[3]]
    total = max(1, len(items))
    results: dict[int, str] = {}
    for idxs, markup in ((plain_idx, False), (mark_idx, True)):
        if not idxs:
            continue
        share = len(idxs) / total
        offset = (len(plain_idx) / total) if markup else 0.0
        out = tr.translate_segments(
            [items[k][2] for k in idxs], markup=markup, context=context,
            progress=lambda f, s=share, o=offset: progress(o + f * s),
        )
        results.update(zip(idxs, out))

    for k, (p, runs, _text, markup) in enumerate(items):
        _apply_translation(p, runs, results[k], markup)

    code = LANG_CODES.get(tr.target_lang.lower())
    if code:
        document.core_properties.language = code
    stamp_docx(document)
    document.save(dst)


# ------------------------------------------------------------------ TXT
def read_text_file(path: str) -> str:
    raw = Path(path).read_bytes()
    if raw[:2] in (b"\xff\xfe", b"\xfe\xff"):
        return raw.decode("utf-16")
    for enc in ("utf-8-sig", "cp1250"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1")


def split_text(text: str, limit: int = 4000) -> list[str]:
    """Rozdělí text na odstavce (prázdné řádky); příliš dlouhé odstavce dělí po řádcích."""
    parts = re.split(r"(\n\s*\n)", text.replace("\r\n", "\n"))
    out: list[str] = []
    for part in parts:
        if len(part) <= limit or not part.strip():
            out.append(part)
            continue
        buf = ""
        for line in part.splitlines(keepends=True):
            if buf and len(buf) + len(line) > limit:
                out.append(buf)
                buf = ""
            buf += line
        if buf:
            out.append(buf)
    return out


def translate_txt(src: str, dst: str, tr: Translator, log: Log = _noop, progress: Progress = _noop) -> None:
    chunks = split_text(read_text_file(src))
    idx = [i for i, c in enumerate(chunks) if c.strip()]
    log(f"  TXT: {len(idx)} odstavců")
    translated = tr.translate_segments([chunks[i] for i in idx], markup=False, progress=progress)
    for i, t in zip(idx, translated):
        # zachová okolní bílé znaky původního úseku
        lead = chunks[i][: len(chunks[i]) - len(chunks[i].lstrip())]
        trail = chunks[i][len(chunks[i].rstrip()):]
        chunks[i] = lead + t.strip() + trail
    Path(dst).write_text("".join(chunks), encoding="utf-8")


# ------------------------------------------------- bloky → DOCX (OCR/PDF)
def blocks_to_docx(document, blocks: list[dict]) -> None:
    table_rows: list[list[str]] = []

    def flush_table():
        if not table_rows:
            return
        cols = max(len(r) for r in table_rows)
        table = document.add_table(rows=len(table_rows), cols=cols)
        try:
            table.style = "Table Grid"
        except Exception:
            pass
        for ri, row in enumerate(table_rows):
            for ci, cell in enumerate(row):
                table.cell(ri, ci).text = cell
        table_rows.clear()

    for b in blocks:
        style, text = b.get("style", "paragraph"), b.get("text", "")
        if style == "table_row":
            table_rows.append([c.strip() for c in text.split(" | ")])
            continue
        flush_table()
        if not text.strip():
            continue
        if style.startswith("heading"):
            document.add_heading(text, level=int(style[-1]))
        elif style == "bullet":
            document.add_paragraph(text, style="List Bullet")
        elif style == "numbered":
            document.add_paragraph(text, style="List Number")
        else:
            document.add_paragraph(text)
    flush_table()


def stamp_docx(document, title: str | None = None) -> None:
    """Vlastnosti dokumentu (Word → Soubor → Informace): skutečné datum a čas vytvoření a úpravy místo
    data prázdné šablony knihovny (23. 12. 2013) a bez autora „python-docx“."""
    import datetime as _dt

    cp = document.core_properties
    now = _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0)
    if (cp.author or "").strip() == "python-docx":
        cp.author = ""
    created = cp.created
    if created is None or (created.year, created.month, created.day) == (2013, 12, 23):
        cp.created = now
    cp.modified = now
    cp.last_modified_by = "Překladač"
    if title and not (cp.title or "").strip():
        cp.title = title


def images_to_docx(paths: list[str], dst: str, tr: Translator, translate: bool, log: Log = _noop,
                   progress: Progress = _noop) -> None:
    import docx

    document = docx.Document()
    for n, path in enumerate(paths):
        log(f"  Obrázek {n + 1}/{len(paths)}: {Path(path).name}")
        blocks = tr.image_blocks(path, translate)
        if n > 0:
            document.add_page_break()
        blocks_to_docx(document, blocks)
        progress((n + 1) / len(paths))
    stamp_docx(document, Path(paths[0]).stem if paths else None)
    document.save(dst)


def pdf_to_docx(src: str, dst: str, tr: Translator, translate: bool, log: Log = _noop,
                progress: Progress = _noop) -> None:
    import docx
    from pypdf import PdfReader, PdfWriter

    from ebook_more import open_pdf

    reader = open_pdf(Path(src).read_bytes())  # zašifrované PDF: prázdné nebo zadané heslo
    total = len(reader.pages)
    chunks = [(s, min(s + PDF_PAGES_PER_CHUNK, total)) for s in range(0, total, PDF_PAGES_PER_CHUNK)]
    log(f"  PDF: {total} stran, {len(chunks)} částí po {PDF_PAGES_PER_CHUNK} stranách")

    def chunk_bytes(a: int, b: int) -> bytes:
        w = PdfWriter()
        for i in range(a, b):
            w.add_page(reader.pages[i])
        buf = io.BytesIO()
        w.write(buf)
        return buf.getvalue()

    from concurrent.futures import ThreadPoolExecutor

    datas = [chunk_bytes(a, b) for a, b in chunks]
    workers = getattr(tr, "workers", 3)
    document = docx.Document()
    done = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for blocks in pool.map(lambda d: tr.pdf_blocks(d, translate), datas):
            blocks_to_docx(document, blocks)
            done += 1
            log(f"  hotovo {min(done * PDF_PAGES_PER_CHUNK, total)}/{total} stran")
            progress(done / len(chunks))
    stamp_docx(document, Path(src).stem)
    document.save(dst)


# ------------------------------------------------------------ orchestrace
def default_output_format(ext: str) -> str:
    ext = ext.lower().lstrip(".")
    if ext in ("mobi", "pdb"):
        return ext
    if ext in ("kfx", "azw", "lit"):
        return "azw3"
    if ext in ("pdf",) or "." + ext in IMAGE_EXT:
        return "docx"
    if ext in ("fb2", "odt", "htmlz", "rtf"):
        return ext
    return ext


def output_path(src: str, out_dir: str | None, fmt: str, suffix: str) -> str:
    p = Path(src)
    folder = Path(out_dir) if out_dir else p.parent
    folder.mkdir(parents=True, exist_ok=True)
    candidate = folder / f"{p.stem}{suffix}.{fmt}"
    n = 2
    while candidate.exists():
        candidate = folder / f"{p.stem}{suffix} ({n}).{fmt}"
        n += 1
    return str(candidate)


def process_file(
    src: str,
    out_fmt: str | None,
    translate: bool,
    tr: Translator | None,
    out_dir: str | None = None,
    log: Log = _noop,
    progress: Progress = _noop,
    ebook_convert: str | None = None,
) -> str:
    """Zpracuje jeden soubor. out_fmt=None → výchozí formát podle vstupu. Vrátí cestu k výsledku."""
    ext = Path(src).suffix.lower()
    if ext not in SUPPORTED_EXT:
        raise ValueError(f"Nepodporovaný formát: {ext}")
    doc_tr = getattr(tr, "document_translator", None) if translate and tr is not None else None
    use_doc = doc_tr is not None and ext in doc_tr.SUPPORTED
    fmt = (out_fmt or (ext.lstrip(".") if use_doc else default_output_format(ext))).lower()
    suffix = f" ({tr.target_lang})" if translate and tr else ""
    dst = output_path(src, out_dir, fmt, suffix if translate else " (převod)")
    conv = lambda a, b: convert(a, b, log, ebook_convert)  # noqa: E731

    with tempfile.TemporaryDirectory(prefix="prekladac_") as tmp:
        def tmpfile(name: str) -> str:
            return os.path.join(tmp, name)

        def finish(produced: str) -> str:
            if Path(produced).suffix.lower() == "." + fmt:
                shutil.move(produced, dst)
            else:
                conv(produced, dst)
            return dst

        # --- celý dokument přeloží služba najednou (Microsoft – překlad dokumentů)
        if use_doc:
            produced = tmpfile("vystup" + ext)
            doc_tr.translate_document(src, produced, log)
            progress(1.0)
            return finish(produced)

        if ext in DOC_ONLY_EXT:
            raise ValueError(f"Formát {ext} umí přeložit jen překladač „Microsoft – překlad celých dokumentů“.")

        # --- obrázek do PDF bez překladu: jen stránka s obrázkem
        if ext in IMAGE_EXT and images_pdf_only(translate, fmt):
            images_to_pdf([src], dst, log, progress)
            return dst

        # --- obrázky a PDF: OCR / text z PDF (a překlad) → DOCX
        if ext in IMAGE_EXT or (ext == ".pdf" and (translate or fmt == "docx")):
            if tr is None:
                raise ValueError("Pro obrázky a PDF je potřeba nastavit OCR (Tesseract, Gemini nebo Claude).")
            produced = tmpfile("vystup.docx")
            if ext in IMAGE_EXT:
                images_to_docx([src], produced, tr, translate, log, progress)
            else:
                pdf_to_docx(src, produced, tr, translate, log, progress)
            return finish(produced)

        # --- jen převod formátu
        if not translate:
            if ext == "." + fmt:
                shutil.copyfile(src, dst)
            else:
                conv(src, dst)
            progress(1.0)
            return dst

        assert tr is not None
        if ext == ".docx":
            produced = tmpfile("vystup.docx")
            translate_docx(src, produced, tr, log, progress)
            return finish(produced)
        if ext == ".txt":
            produced = tmpfile("vystup.txt")
            translate_txt(src, produced, tr, log, progress)
            return finish(produced)

        # --- e-knihy (a RTF): → EPUB → překlad → cílový formát
        epub_in = src
        if ext != ".epub":
            epub_in = tmpfile("vstup.epub")
            conv(src, epub_in)
        produced = tmpfile("vystup.epub")
        translate_epub(epub_in, produced, tr, log, progress)
        return finish(produced)


def images_to_pdf(paths: list[str], dst: str, log: Log = _noop, progress: Progress = _noop) -> None:
    """Obrázky (nafocené či naskenované stránky) → jedno PDF, každý obrázek na vlastní stránce. Bez OCR."""
    from PIL import Image, ImageOps

    pages = []
    for i, p in enumerate(paths, 1):
        with Image.open(p) as im:
            im = ImageOps.exif_transpose(im)  # fotka z mobilu otočená správně
            pages.append(im.convert("RGB"))
        progress(i / len(paths) * 0.9)
    if not pages:
        raise ValueError("Žádné obrázky.")
    dpi = 200.0
    pages[0].save(dst, "PDF", save_all=True, append_images=pages[1:], resolution=dpi)
    log(f"  PDF: {len(pages)} stran")
    progress(1.0)


def images_pdf_only(translate: bool, fmt: str | None) -> bool:
    """Obrázky do PDF bez překladu = jen poskládat stránky (bez rozpoznávání textu)."""
    return not translate and fmt == "pdf"


def process_images_together(
    paths: list[str], translate: bool, tr: Translator | None, out_dir: str | None = None,
    log: Log = _noop, progress: Progress = _noop, fmt: str | None = None, ebook_convert: str | None = None,
) -> str:
    """Více obrázků (např. nafocené stránky) → jeden dokument (DOCX, nebo vícestránkové PDF a další formáty)."""
    fmt = fmt if fmt and fmt != "docx" else "docx"
    if images_pdf_only(translate, fmt):
        dst = output_path(paths[0], out_dir, "pdf", " (stránky)")
        images_to_pdf(paths, dst, log, progress)
        return dst
    if tr is None:
        raise ValueError("Pro text z obrázků je potřeba nastavit OCR (Tesseract, Gemini nebo Claude).")
    suffix = f" ({tr.target_lang})" if translate else " (přepis)"
    dst = output_path(paths[0], out_dir, fmt, suffix)
    if fmt == "docx":
        images_to_docx(paths, dst, tr, translate, log, progress)
        return dst
    tmp = Path(tempfile.mkdtemp(prefix="prekladac_")) / "obrazky.docx"
    try:
        images_to_docx(paths, str(tmp), tr, translate, log, lambda f: progress(f * 0.9))
        log(f"  převádím do {fmt.upper()}…")
        convert(str(tmp), dst, log, ebook_convert)
    finally:
        shutil.rmtree(tmp.parent, ignore_errors=True)
    progress(1.0)
    return dst
