"""Otevření už hotové knihy (DOCX, TXT, EPUB, ODT, RTF, MOBI, AZW3, FB2, PDF…) jako projekt *.kniha.json.

Kapitoly se poznají podle nadpisů (DOCX „Nadpis 1“, EPUB soubory kapitol, v TXT řádky „1. Název“
nebo „Kapitola 1“). Formáty, které neumíme číst přímo, převede Calibre nejdřív do EPUB.
"""
from __future__ import annotations

import re
import subprocess
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

from book_writer import PROJECT_SUFFIX, BookError, load_project

DIRECT = {".docx", ".txt", ".md", ".epub"}
VIA_CALIBRE = {".odt", ".rtf", ".mobi", ".azw", ".azw3", ".fb2", ".pdf", ".doc", ".htmlz", ".html", ".htm",
               ".lit", ".pdb", ".kfx"}
OPEN_FILTER = ("Knihy (*.kniha.json *.docx *.epub *.txt *.odt *.rtf *.mobi *.azw *.azw3 *.pdb *.fb2 *.pdf "
               "*.doc *.lit *.htmlz *.html *.htm);;"
               f"Projekt knihy (*{PROJECT_SUFFIX});;Vše (*.*)")
TOC_NAMES = {"obsah", "contents", "table of contents", "inhalt", "inhaltsverzeichnis", "spis treści"}
NUM_TITLE = re.compile(r"^\s*(\d{1,3})[.)]\s+(\S.{0,120})$")
WORD_TITLE = re.compile(r"^\s*(kapitola|chapter|kapitel|rozdział|část)\s+[\w.]+.*$", re.I)


def is_project(path: str | Path) -> bool:
    return str(path).lower().endswith(PROJECT_SUFFIX)


def read_text_any(path: Path) -> str:
    """Text v UTF-8, nebo ve starším českém kódování Windows (cp1250)."""
    data = path.read_bytes()
    for enc in ("utf-8-sig", "utf-16") if data[:2] in (b"\xff\xfe", b"\xfe\xff") else ("utf-8-sig",):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            pass
    try:
        return data.decode("cp1250")
    except UnicodeDecodeError:
        return data.decode("latin-1")


def _clean_title(t: str) -> str:
    t = " ".join(t.split())
    m = NUM_TITLE.match(t)
    return m.group(2).strip() if m else t


def make_project(title: str, chapters: list[tuple[str, list[str]]], source: Path, author: str = "") -> dict:
    chapters = [(t or f"Kapitola {i}", [p for p in paras if p.strip()])
                for i, (t, paras) in enumerate(chapters, 1)]
    chapters = [c for c in chapters if c[1]] or chapters
    if not chapters or not any(c[1] for c in chapters):
        raise BookError("V souboru se nenašel žádný text knihy.")
    texts = ["\n\n".join(paras) for _t, paras in chapters]
    avg = max(300, sum(len(t.split()) for t in texts) // len(texts))
    proj = {
        "language": "čeština", "description": "", "style": "", "words": int(round(avg, -2)) or avg,
        "outline": {"title": title or source.stem, "synopsis": "", "characters": [],
                    "chapters": [{"title": t, "summary": ""} for t, _p in chapters]},
        "chapters": [{"text": text, "summary": ""} for text in texts],
        "imported_from": source.name,
    }
    if author:
        proj["author"] = author
    return proj


# ------------------------------------------------------------------ DOCX
def import_docx(path: Path) -> dict:
    import docx

    d = docx.Document(str(path))
    title = (d.core_properties.title or "").strip()
    author = (d.core_properties.author or "").strip()
    chapters: list[tuple[str, list[str]]] = []
    front: list[str] = []
    skipping_toc = False
    for p in d.paragraphs:
        style = (p.style.name if p.style is not None else "").lower()
        text = p.text.strip()
        if style == "title":
            title = title or text
            continue
        if style.startswith(("heading 1", "nadpis 1")) or style == "heading" or (
                style.startswith(("heading 2", "nadpis 2")) and not chapters):
            if text.lower() in TOC_NAMES:
                skipping_toc = True
                continue
            skipping_toc = False
            if text:
                chapters.append((_clean_title(text), []))
            continue
        if skipping_toc or not text:
            continue
        (chapters[-1][1] if chapters else front).append(text)
    if not chapters:  # bez nadpisů: celá kniha jako jedna kapitola
        chapters = [(title or path.stem, front)]
    elif title == "" and front:
        title = front[0]
    return make_project(title, chapters, path, author)


# ------------------------------------------------------------------ TXT
def import_txt(path: Path) -> dict:
    lines = read_text_any(path).replace("\r\n", "\n").replace("\r", "\n").split("\n")
    title = next((ln.strip() for ln in lines if ln.strip()), path.stem)
    chapters: list[tuple[str, list[str]]] = []
    buf: list[str] = []
    paras: list[str] = []

    def flush_para():
        if buf:
            paras.append("\n".join(buf).strip())
            buf.clear()

    prev_blank = True
    started = False
    for ln in lines:
        s = ln.strip()
        heading = prev_blank and s and len(s) < 120 and (NUM_TITLE.match(s) or WORD_TITLE.match(s))
        if heading:
            flush_para()
            if chapters:
                chapters[-1] = (chapters[-1][0], paras)
            elif paras:
                paras = paras[1:] if paras and paras[0] == title else paras  # název knihy nahoře
            chapters.append((_clean_title(s), []))
            paras = []
            started = True
        elif not s:
            flush_para()
        else:
            buf.append(s)
        prev_blank = not s
    flush_para()
    if started:
        chapters[-1] = (chapters[-1][0], paras)
    else:
        body = paras[1:] if len(paras) > 1 and paras[0] == title else paras
        chapters = [(title, body)]
    return make_project(title, chapters, path)


# ------------------------------------------------------------------ EPUB
def import_epub(path: Path) -> dict:
    from bs4 import BeautifulSoup

    with zipfile.ZipFile(path) as z:
        container = BeautifulSoup(z.read("META-INF/container.xml"), "xml")
        opf_path = container.find("rootfile")["full-path"]
        opf = BeautifulSoup(z.read(opf_path), "xml")
        base = PurePosixPath(opf_path).parent
        title = (opf.find("dc:title") or opf.find("title"))
        creator = (opf.find("dc:creator") or opf.find("creator"))
        manifest = {it.get("id"): it for it in opf.find_all("item")}
        chapters: list[tuple[str, list[str]]] = []
        for ref in opf.find_all("itemref"):
            it = manifest.get(ref.get("idref"))
            if it is None or "nav" in (it.get("properties") or ""):
                continue
            name = str(base / it.get("href")).lstrip("./") if str(base) != "." else it.get("href")
            try:
                html = z.read(name)
            except KeyError:
                continue
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style"]):
                tag.decompose()
            h = soup.find(["h1", "h2", "h3"])
            head = h.get_text(" ", strip=True) if h else ""
            if h:
                h.decompose()
            blocks = soup.find_all(["p", "li", "blockquote", "pre"])
            paras = [" ".join(b.get_text(" ", strip=True).split()) for b in blocks] if blocks else \
                [ln.strip() for ln in soup.get_text("\n").split("\n")]
            paras = [p for p in paras if p]
            if head.lower() in TOC_NAMES or sum(len(p) for p in paras) < 40:
                continue  # obálka, titulní strana, obsah
            chapters.append((_clean_title(head) if head else "", paras))
    return make_project(title.get_text(strip=True) if title else path.stem, chapters, path,
                        creator.get_text(strip=True) if creator else "")


# ------------------------------------------------------------------ ostatní přes Calibre
def import_via_calibre(path: Path, ebook_convert: str | None) -> dict:
    if not ebook_convert:
        raise BookError(f"Soubor {path.suffix.upper()} umí program otevřít jen s Calibre (je součástí "
                        "instalátoru). Jinak knihu otevřete jako DOCX, EPUB nebo TXT.")
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "kniha.epub"
        flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        r = subprocess.run([ebook_convert, str(path), str(out)], capture_output=True, text=True,
                           creationflags=flags, timeout=900)
        if r.returncode != 0 or not out.exists():
            raise BookError(f"Calibre soubor nepřevedlo: {(r.stderr or r.stdout).strip()[-400:]}")
        proj = import_epub(out)
    proj["imported_from"] = path.name
    return proj


def import_book(path: str | Path, ebook_convert: str | None = None) -> dict:
    path = Path(path)
    ext = path.suffix.lower()
    if is_project(path):
        return load_project(path)
    if ext == ".docx":
        return import_docx(path)
    if ext in (".txt", ".md"):
        return import_txt(path)
    if ext == ".epub":
        return import_epub(path)
    if ext == ".json":
        return load_project(path)
    return import_via_calibre(path, ebook_convert)


def project_path_for(source: str | Path) -> Path:
    """Nový soubor projektu vedle původní knihy (nepřepíše existující)."""
    source = Path(source)
    stem = source.name[: -len(source.suffix)] if source.suffix else source.name
    p = source.with_name(stem + PROJECT_SUFFIX)
    i = 2
    while p.exists():
        p = source.with_name(f"{stem} ({i}){PROJECT_SUFFIX}")
        i += 1
    return p
