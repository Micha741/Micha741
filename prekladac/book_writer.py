"""Napsání knihy podle popisu přes Claude API: osnova → kapitoly → DOCX/EPUB/PDF/AZW3.

Postup:
1. make_outline(): z popisu vznikne osnova (název, shrnutí, postavy, kapitoly).
2. Osnovu si uživatel může upravit jako text (outline_to_text / text_to_outline).
3. write(): kapitoly se píší postupně; každá dostane osnovu, shrnutí předchozích kapitol
   a konec předchozí kapitoly. Po každé kapitole se projekt uloží (*.kniha.json),
   takže po přerušení jde pokračovat.
4. export(): DOCX (nadpisy kapitol) a přes Calibre další formáty.
"""

from __future__ import annotations

import json
import re
import threading
from pathlib import Path
from typing import Callable

from claude_client import PRICES, Cancelled, ClaudeTranslator, ModelError

OUTLINE_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "synopsis": {"type": "string"},
        "characters": {"type": "array", "items": {
            "type": "object",
            "properties": {"name": {"type": "string"}, "description": {"type": "string"}},
            "required": ["name", "description"], "additionalProperties": False}},
        "chapters": {"type": "array", "items": {
            "type": "object",
            "properties": {"title": {"type": "string"}, "summary": {"type": "string"}},
            "required": ["title", "summary"], "additionalProperties": False}},
    },
    "required": ["title", "synopsis", "characters", "chapters"],
    "additionalProperties": False,
}

CHAPTER_SCHEMA = {
    "type": "object",
    "properties": {"text": {"type": "string"}, "summary": {"type": "string"}},
    "required": ["text", "summary"],
    "additionalProperties": False,
}

PROJECT_SUFFIX = ".kniha.json"
TOKENS_PER_WORD = 2.6  # orientačně pro češtinu
TAIL_WORDS = 1200  # kolik slov konce předchozí kapitoly dostane model pro plynulé navázání


class BookError(Exception):
    pass


# ------------------------------------------------------------ osnova jako text
def outline_to_text(o: dict) -> str:
    lines = [f"NÁZEV: {o['title']}", "", "SHRNUTÍ:", o["synopsis"].strip(), "", "POSTAVY:"]
    lines += [f"- {c['name']}: {c['description']}" for c in o.get("characters", [])]
    lines += ["", "KAPITOLY:"]
    lines += [f"{i}. {ch['title']}{words_tag(ch.get('words'))} — {ch['summary']}"
              for i, ch in enumerate(o["chapters"], 1)]
    return "\n".join(lines) + "\n"


WORDS_RE = re.compile(r"\s*[\[(]\s*(\d[\d\s]*)\s*slov\w*\s*[\])]\s*$", re.I)


def words_tag(words) -> str:
    return f" [{int(words)} slov]" if words else ""


def split_words(title: str) -> tuple[str, int | None]:
    """„Bitva u řeky [4000 slov]“ → („Bitva u řeky“, 4000). Délka jedné kapitoly v osnově je nepovinná."""
    m = WORDS_RE.search(title)
    if not m:
        return title.strip(), None
    n = int(re.sub(r"\s", "", m.group(1)))
    return title[:m.start()].strip(), max(100, min(n, 20000))


CHAPTER_LINE_RE = re.compile(r"^(\s*\d+[.)]\s*)(.+?)(\s+[—–-]\s+.*)?$")


def set_line_words(line: str, words: int | None) -> str | None:
    """Řádek kapitoly z osnovy s novou délkou (None = výchozí délka). Pro jiné řádky None."""
    m = CHAPTER_LINE_RE.match(line)
    if not m:
        return None
    title, _old = split_words(m.group(2))
    return f"{m.group(1)}{title}{words_tag(words)}{m.group(3) or ''}"


def chapter_words(project: dict, idx: int) -> int:
    """Délka kapitoly: vlastní z osnovy, jinak výchozí „Slov na kapitolu“ knihy."""
    chs = project["outline"]["chapters"]
    return int((chs[idx].get("words") if idx < len(chs) else None) or project["words"])


def total_words(project: dict) -> int:
    return sum(chapter_words(project, i) for i in range(len(project["outline"]["chapters"])))


def text_to_outline(text: str) -> dict:
    """Načte (uživatelem upravenou) osnovu zpět. Kapitoly: „1. Název — obsah“."""
    title_m = re.search(r"^\s*NÁZEV:\s*(.+)$", text, re.M)
    if not title_m:
        raise BookError("V osnově chybí řádek „NÁZEV: …“.")
    sections = re.split(r"^\s*(SHRNUTÍ|POSTAVY|KAPITOLY):\s*$", text, flags=re.M)
    parts = {sections[i]: sections[i + 1] for i in range(1, len(sections) - 1, 2)}
    synopsis = parts.get("SHRNUTÍ", "").strip()
    characters = []
    for line in parts.get("POSTAVY", "").splitlines():
        m = re.match(r"^\s*[-•*]\s*([^:]+):\s*(.+)$", line)
        if m:
            characters.append({"name": m.group(1).strip(), "description": m.group(2).strip()})
    chapters = []
    for line in parts.get("KAPITOLY", "").splitlines():
        m = re.match(r"^\s*\d+[.)]\s*(.+?)\s+[—–-]\s+(.+)$", line)
        if m:
            title, summary = m.group(1), m.group(2).strip()
        elif re.match(r"^\s*\d+[.)]\s*\S", line):
            title, summary = re.sub(r"^\s*\d+[.)]\s*", "", line), ""
        else:
            continue
        title, words = split_words(title)
        ch = {"title": title, "summary": summary}
        if words:
            ch["words"] = words
        chapters.append(ch)
    if not chapters:
        raise BookError("V osnově nejsou žádné kapitoly (řádky „1. Název — obsah“ pod „KAPITOLY:“).")
    return {"title": title_m.group(1).strip(), "synopsis": synopsis, "characters": characters,
            "chapters": chapters}


def safe_name(title: str) -> str:
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", title).strip().rstrip(".")
    return name[:80] or "Kniha"


# ---------------------------------------------------------------- projekt
def save_project(path: Path, project: dict, backup: bool = True) -> None:
    """Uloží projekt bezpečně (přes dočasný soubor); předchozí verze zůstane jako *.bak."""
    path = Path(path)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")
    if backup and path.exists():
        bak = path.with_name(path.name + ".bak")
        try:
            path.replace(bak)
        except OSError:
            pass
    tmp.replace(path)


def load_project(path: str | Path) -> dict:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if "outline" not in data or "chapters" not in data:
        raise BookError("Soubor není rozepsaná kniha z Překladače.")
    return data


class ClaudeBackend:
    """Claude API: začátek zadání (osnova) se ukládá do mezipaměti, takže se neplatí u každé kapitoly znovu."""

    name = "Claude"

    def __init__(self, api_key: str, model: str, language: str, log, cancel_event, effort: str = "high"):
        self.model = model
        self.claude = ClaudeTranslator(api_key=api_key, model=model, target_lang=language, log=log,
                                       cancel_event=cancel_event, effort=effort)

    def complete(self, system: str, user: str, schema: dict, max_tokens: int, cache: bool = False) -> dict:
        sys_blocks = [{"type": "text", "text": system, **({"cache_control": {"type": "ephemeral"}} if cache else {})}]
        return self.claude._call(sys_blocks, [{"type": "text", "text": user}], schema, max_tokens=max_tokens)

    def price_note(self, in_tokens: float, out_tokens: float) -> str:
        p_in, p_out = PRICES.get(self.model, (4.0, 20.0))
        low = in_tokens * p_in / 1e6 + out_tokens * p_out / 1e6
        return f"Orientační cena: ${low:.0f}–{low * 1.6:.0f} (platí se z kreditu Claude API)."

    def cost_summary(self) -> str:
        return self.claude.cost_summary()


class EngineBackend:
    """Gemini, Ollama nebo služba kompatibilní s OpenAI (DeepSeek, Mistral, OpenRouter…)."""

    def __init__(self, engine, cancel_event: threading.Event | None = None):
        self.engine = engine
        self.name = engine.name
        self.cancel_event = cancel_event or threading.Event()

    def complete(self, system: str, user: str, schema: dict, max_tokens: int, cache: bool = False) -> dict:
        from free_engines import BadResponse

        if self.cancel_event.is_set():
            raise Cancelled()
        try:
            return self.engine._complete_json(system, [{"text": user}], schema, max_tokens=max_tokens,
                                              temperature=0.8)
        except (BadResponse, json.JSONDecodeError, KeyError, TypeError) as e:
            raise ModelError(str(e)) from e

    def price_note(self, in_tokens: float, out_tokens: float) -> str:
        from free_engines import GeminiEngine, OllamaEngine

        if isinstance(self.engine, OllamaEngine):
            return "Zdarma (běží ve vašem počítači; psaní může trvat hodiny)."
        if isinstance(self.engine, GeminiEngine):
            return "V bezplatné úrovni Gemini zdarma, ale s limity požadavků (psaní může trvat déle)."
        return (f"Cena podle ceníku služby {self.name}: zhruba {in_tokens / 1e6:.2f} mil. vstupních "
                f"a {out_tokens / 1e6:.2f} mil. výstupních tokenů.")

    def cost_summary(self) -> str:
        return self.engine.usage_info() or f"{self.name}: hotovo"


class BookWriter:
    def __init__(self, backend, language: str = "čeština", log: Callable[[str], None] = print):
        self.backend = backend
        self.language = language
        self.log = log

    # ------------------------------------------------------------ odhad
    def estimate(self, chapters: int, words: int) -> str:
        out_tokens = chapters * words * TOKENS_PER_WORD * 1.6  # + přemýšlení modelu
        in_tokens = chapters * (4000 + TAIL_WORDS * TOKENS_PER_WORD + chapters * 120)
        return (f"{chapters} kapitol × ~{words} slov ≈ {chapters * words:,} slov (asi {chapters * words // 300} stran). "
                .replace(",", " ") + self.backend.price_note(in_tokens, out_tokens))

    # ------------------------------------------------------------ osnova
    def make_outline(self, description: str, chapters: int, words: int, style: str = "") -> dict:
        system = (
            "Jsi zkušený spisovatel a editor. Na základě zadání navrhni osnovu knihy v jazyce: "
            f"{self.language}. Vymysli výstižný název, krátké shrnutí celého příběhu (5–8 vět), "
            "hlavní postavy (jméno a krátký popis: věk, povaha, role v příběhu) a přesně "
            f"{chapters} kapitol. U každé kapitoly uveď název a 2–4 věty, co se v ní stane. "
            "Děj musí mít jasný vývoj, napětí a uspokojivé zakončení; kapitoly na sebe logicky navazují. "
            "Vše piš v zadaném jazyce."
        )
        user = f"ZADÁNÍ KNIHY:\n{description.strip()}\n\nPočet kapitol: {chapters}\nDélka kapitoly: asi {words} slov"
        if style.strip():
            user += f"\nŽánr a styl: {style.strip()}"
        self.log("Navrhuji osnovu…")
        outline = self.backend.complete(system, user, OUTLINE_SCHEMA, max_tokens=16000)
        if not outline.get("chapters"):
            raise BookError("Model nevrátil žádné kapitoly.")
        return outline

    # ----------------------------------------------------------- kapitoly
    def _chapter_system(self, project: dict) -> str:
        o = project["outline"]
        text = (
            f"Jsi zkušený spisovatel. Píšeš knihu v jazyce: {self.language}. Piš čtivě, přirozeně a s citem "
            "pro jazyk: živé popisy, uvěřitelné dialogy (v češtině s uvozovkami „ “), střídání tempa, "
            "vnitřní prožitky postav. Drž se osnovy, jmen a povah postav; neprozrazuj předčasně, co se stane "
            "v pozdějších kapitolách. Neopakuj stále stejné obraty. "
            "Text kapitoly piš jako souvislou prózu v odstavcích oddělených prázdným řádkem, bez nadpisu "
            "kapitoly, bez Markdownu a bez komentářů pro autora. Kromě textu vrať i stručné shrnutí kapitoly "
            "(4–6 vět: co se stalo, kdo co ví, v jakém stavu postavy končí) – slouží k navázání dalších kapitol."
        )
        if project.get("style"):
            text += f"\n\nŽánr a styl: {project['style']}"
        text += "\n\nPŮVODNÍ ZADÁNÍ:\n" + project.get("description", "").strip()
        text += "\n\nOSNOVA KNIHY:\n" + outline_to_text(o)
        return text

    def _chapter_prompt(self, project: dict, idx: int) -> str:
        chapters = project["outline"]["chapters"]
        done = project["chapters"]
        parts = []
        if done:
            parts.append("CO SE STALO V PŘEDCHOZÍCH KAPITOLÁCH:")
            parts += [f"{i}. {c['summary']}" for i, c in enumerate(done, 1)]
            tail = " ".join(done[-1]["text"].split()[-TAIL_WORDS:])
            parts.append(f"\nKONEC PŘEDCHOZÍ KAPITOLY (pro plynulé navázání):\n…{tail}")
        ch = chapters[idx]
        parts.append(f"\nNapiš kapitolu {idx + 1} z {len(chapters)}: „{ch['title']}“.")
        if ch.get("summary"):
            parts.append(f"Obsah podle osnovy: {ch['summary']}")
        w = chapter_words(project, idx)
        parts.append(f"Délka: přibližně {w} slov – na délce záleží: napiš aspoň {int(w * 0.85)} a nejvýš "
                     f"{int(w * 1.2)} slov. Když děj z osnovy nevystačí, rozveď scény, dialogy, popisy a prožitky "
                     "postav; nepřidávej ale děj z dalších kapitol.")
        if idx == len(chapters) - 1:
            parts.append("Je to poslední kapitola – příběh uzavři.")
        return "\n".join(parts)

    def write(self, project: dict, project_path: Path, progress: Callable[[float], None] = lambda f: None) -> dict:
        """Dopíše chybějící kapitoly; po každé kapitole uloží projekt."""
        chapters = project["outline"]["chapters"]
        system = self._chapter_system(project)
        for idx in range(len(project["chapters"]), len(chapters)):
            self.log(f"Píšu kapitolu {idx + 1}/{len(chapters)}: {chapters[idx]['title']}…")
            prompt = self._chapter_prompt(project, idx)
            # text + přemýšlení modelu; rezerva, aby se kapitola neusekla
            max_tokens = min(64000, int(chapter_words(project, idx) * TOKENS_PER_WORD * 4) + 16000)
            try:
                res = self.backend.complete(system, prompt, CHAPTER_SCHEMA, max_tokens=max_tokens, cache=True)
            except ModelError as e:
                raise BookError(f"Kapitolu {idx + 1} se nepodařilo napsat ({e}). Rozepsaná kniha je uložená, "
                                "můžete pokračovat později.") from e
            text = res["text"].strip()
            target = chapter_words(project, idx)
            if len(text.split()) < target * 0.6:  # model psal výrazně kratší – jeden pokus o delší verzi
                n = len(text.split())
                self.log(f"  kapitola má jen {n} slov z ~{target}, píšu ji znovu podrobněji…")
                retry = (prompt + f"\n\nPOZOR: předchozí verze měla jen {n} slov, to je málo. Napiš kapitolu "
                         f"znovu, mnohem podrobněji – alespoň {int(target * 0.85)} slov.")
                try:
                    res2 = self.backend.complete(system, retry, CHAPTER_SCHEMA, max_tokens=max_tokens, cache=True)
                    if len(res2["text"].split()) > n:
                        res, text = res2, res2["text"].strip()
                except ModelError as e:
                    self.log(f"  delší verze se nepovedla ({e}), ponechávám kratší.")
            project["chapters"].append({"text": text, "summary": res["summary"].strip()})
            save_project(project_path, project)
            self.log(f"  ✓ hotovo ({len(text.split()):,} slov) – {self.backend.cost_summary()}".replace(",", " "))
            progress(len(project["chapters"]) / len(chapters))
        return project


# ------------------------------------------------------------------ export
LANG_CODES = {"čeština": "cs", "slovenština": "sk", "angličtina": "en", "němčina": "de", "polština": "pl"}
PAGE_BREAK = "[[STRANA]]"  # samostatný řádek v textu kapitoly = zalomení stránky
DEFAULT_FORMAT = {"font": "Georgia", "size": 12, "toc": True}
TOC_TITLES = {"cs": "Obsah", "sk": "Obsah", "en": "Contents", "de": "Inhalt", "pl": "Spis treści"}


def split_paragraphs(text: str) -> list[str]:
    """Odstavce oddělené prázdným řádkem; samostatný řádek [[STRANA]] je zalomení stránky."""
    text = re.sub(r"[ \t]*" + re.escape(PAGE_BREAK) + r"[ \t]*", "\n\n" + PAGE_BREAK + "\n\n", text)
    return [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]


def text_stats(text: str) -> tuple[int, int]:
    """(počet slov, počet odstavců) – bez značek zalomení stránky."""
    paras = [p for p in split_paragraphs(text) if p != PAGE_BREAK]
    return sum(len(p.split()) for p in paras), len(paras)


def book_stats(project: dict) -> tuple[int, int, int]:
    """(slova, odstavce, napsané kapitoly) celé knihy."""
    words = paras = 0
    for ch in project["chapters"]:
        w, p = text_stats(ch["text"])
        words += w
        paras += p
    return words, paras, len(project["chapters"])


def _bookmark(paragraph, name: str, bid: int) -> None:
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    start = OxmlElement("w:bookmarkStart")
    start.set(qn("w:id"), str(bid))
    start.set(qn("w:name"), name)
    end = OxmlElement("w:bookmarkEnd")
    end.set(qn("w:id"), str(bid))
    paragraph._p.insert(1 if paragraph._p.pPr is not None else 0, start)
    paragraph._p.append(end)


def _internal_link(paragraph, text: str, anchor: str) -> None:
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn

    link = OxmlElement("w:hyperlink")
    link.set(qn("w:anchor"), anchor)
    link.set(qn("w:history"), "1")
    run = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "1F4E99")
    rpr.append(color)
    run.append(rpr)
    t = OxmlElement("w:t")
    t.text = text
    t.set(qn("xml:space"), "preserve")
    run.append(t)
    link.append(run)
    paragraph._p.append(link)


def _set_fonts(document, font: str, size: int) -> None:
    from docx.oxml.ns import qn
    from docx.shared import Pt

    for name in ("Normal", "Title", "Heading 1", "Heading 2"):
        try:
            st = document.styles[name]
        except KeyError:
            continue
        st.font.name = font
        rpr = st.element.get_or_add_rPr()
        rfonts = rpr.find(qn("w:rFonts"))
        if rfonts is None:
            rfonts = rpr.makeelement(qn("w:rFonts"), {})
            rpr.append(rfonts)
        for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
            rfonts.set(qn(attr), font)
        for theme_attr in ("w:asciiTheme", "w:hAnsiTheme", "w:cstheme", "w:eastAsiaTheme"):
            rfonts.attrib.pop(qn(theme_attr), None)
        if name == "Normal":
            st.font.size = Pt(size)


EBOOK_FORMATS = ("epub", "mobi", "azw3")  # obálka jako obálka e-knihy (Calibre --cover), ne jako první strana


def build_docx(project: dict, dst: str | Path, cover_page: bool = True) -> None:
    """DOCX knihy: (obálka), titulní strana, obsah s odkazy, kapitoly s formátováním a obrázky."""
    import io

    import docx
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
    from docx.shared import Inches

    import book_images

    o = project["outline"]
    fmt_cfg = {**DEFAULT_FORMAT, **project.get("format", {})}
    written = list(zip(o["chapters"], project["chapters"]))
    images = {n: book_images.get_image(project, n) for n in (project.get("images") or {})}

    d = docx.Document()
    _set_fonts(d, fmt_cfg["font"], int(fmt_cfg["size"]))
    d.core_properties.title = o["title"]
    d.core_properties.author = project.get("author", "")
    code = LANG_CODES.get(project.get("language", "").lower())
    if code:
        d.core_properties.language = code
    cover = images.get(project.get("cover") or "")
    if cover_page and cover:  # obálka přes celou stránku
        w, h = book_images.size_px(cover)
        width = min(book_images.PAGE_WIDTH_IN, book_images.PAGE_HEIGHT_IN * w / max(1, h))
        cp = d.add_paragraph()
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp.add_run().add_picture(io.BytesIO(cover), width=Inches(width))
        cp.add_run().add_break(WD_BREAK.PAGE)
    t = d.add_paragraph(o["title"], style="Title")
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if project.get("author"):
        a = d.add_paragraph(project["author"])
        a.alignment = WD_ALIGN_PARAGRAPH.CENTER

    if fmt_cfg.get("toc") and written:
        d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
        d.add_heading(TOC_TITLES.get(code or "cs", "Obsah"), level=1)
        for i, (ch_plan, _ch) in enumerate(written, 1):
            _internal_link(d.add_paragraph(), f"{i}. {ch_plan['title']}", f"kapitola_{i}")

    for i, (ch_plan, ch) in enumerate(written, 1):
        d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
        h = d.add_heading(f"{i}. {ch_plan['title']}", level=1)
        _bookmark(h, f"kapitola_{i}", i)
        if ch.get("html"):  # kapitola upravená v editoru – s formátováním a obrázky
            from html_docx import add_html

            add_html(d, ch["html"], images)
            continue
        for para in split_paragraphs(ch["text"]):
            if para == PAGE_BREAK:
                d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
                continue
            p = d.add_paragraph()
            lines = [" ".join(line.split()) for line in para.split("\n")]
            for li, line in enumerate(lines):
                run = p.add_run(line)
                if li < len(lines) - 1:
                    run.add_break()  # zalomení řádku uvnitř odstavce
    d.save(str(dst))


def export(project: dict, out_dir: str | Path, formats: list[str], log: Callable[[str], None] = print,
           ebook_convert: str | None = None) -> list[str]:
    """Uloží knihu: vždy DOCX (písmo, obsah s odkazy, zalomení stránek), z něj přes Calibre EPUB/PDF/AZW3…"""
    from converters import output_path

    o = project["outline"]
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    base = out_dir / safe_name(o["title"])
    docx_path = output_path(str(base) + ".docx", None, "docx", "")
    build_docx(project, docx_path)
    results = []
    if "docx" in formats:
        results.append(docx_path)
    for fmt in formats:
        if fmt == "docx":
            continue
        dst = output_path(str(base) + "." + fmt, None, fmt, "")
        write_format(project, docx_path, dst, fmt, log, ebook_convert)
        results.append(dst)
    if "docx" not in formats:
        Path(docx_path).unlink(missing_ok=True)
    return results


# formáty, do kterých jde knihu uložit (Uložit jako / Export); popisky pro dialog
SAVE_FORMATS = {
    "docx": "Word (*.docx)",
    "pdf": "PDF (*.pdf)",
    "epub": "EPUB – e-kniha (*.epub)",
    "mobi": "MOBI – Kindle (*.mobi)",
    "azw3": "AZW3 – Kindle, jen s Calibre (*.azw3)",
    "pdb": "PDB – PalmDoc (*.pdb)",
    "odt": "OpenDocument – LibreOffice (*.odt)",
    "rtf": "RTF – Rich Text, jen s Calibre (*.rtf)",
    "txt": "Prostý text (*.txt)",
}


def book_plain_text(project: dict) -> str:
    """Kniha jako prostý text: název, autor, kapitoly s nadpisy (zalomení stránek se vynechají)."""
    o = project["outline"]
    lines = [o.get("title", "")]
    if project.get("author"):
        lines.append(project["author"])
    for i, (plan, ch) in enumerate(zip(o["chapters"], project["chapters"]), 1):
        lines += ["", "", f"{i}. {ch.get('title') or plan['title']}", ""]
        paras = [p.replace("\ufffc", "[obrázek]") for p in split_paragraphs(ch.get("text", ""))
                 if p.strip() != PAGE_BREAK]
        lines.append("\n\n".join(paras))
    return "\n".join(lines).strip() + "\n"


def write_format(project: dict, docx_path: str, dst: str, fmt: str, log: Callable[[str], None] = print,
                 ebook_convert: str | None = None) -> None:
    """Jeden výstupní formát: TXT, ODT, EPUB, MOBI, PDB a PDF přímo, AZW3 a RTF přes Calibre."""
    if fmt in ("epub", "mobi", "pdb", "pdf"):
        import ebook

        ebook.write_book(ebook.from_project(project), dst)
        log(f"✓ {Path(dst).name}")
    elif fmt == "txt":
        Path(dst).write_text(book_plain_text(project), encoding="utf-8")
    elif fmt == "odt":
        from qt_bookdoc import write_odt  # Calibre do ODT neukládá – zapíše ho Qt

        write_odt(project, dst)
    elif fmt in EBOOK_FORMATS and project.get("cover"):
        # e-kniha: obálka jako skutečná obálka (ve čtečce v knihovně), v textu se neopakuje
        import shutil
        import tempfile

        import book_images
        from converters import calibre_convert

        tmp = Path(tempfile.mkdtemp(prefix="prekladac_"))
        try:
            name = project["cover"]
            cover = tmp / ("obalka" + Path(name).suffix)
            cover.write_bytes(book_images.get_image(project, name) or b"")
            src = tmp / "kniha.docx"
            build_docx(project, src, cover_page=False)
            calibre_convert(str(src), dst, log, ebook_convert, ["--cover", str(cover)])
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    else:
        from converters import calibre_convert

        calibre_convert(docx_path, dst, log, ebook_convert)


def save_as(project: dict, dst: str | Path, log: Callable[[str], None] = print,
            ebook_convert: str | None = None) -> str:
    """Uloží knihu do jednoho souboru přesně pod zadaným jménem; formát podle přípony."""
    import shutil
    import tempfile

    dst = Path(dst)
    fmt = dst.suffix.lower().lstrip(".")
    if fmt not in SAVE_FORMATS:
        raise BookError(f"Formát .{fmt} neumím uložit (podporované: {', '.join(SAVE_FORMATS)}).")
    dst.parent.mkdir(parents=True, exist_ok=True)
    if fmt in ("txt", "odt"):
        write_format(project, "", str(dst), fmt, log, ebook_convert)
        return str(dst)
    tmp = Path(tempfile.mkdtemp(prefix="prekladac_"))
    try:
        docx_path = export(project, tmp, ["docx"], log, ebook_convert)[0]
        if fmt == "docx":
            shutil.copyfile(docx_path, dst)
        else:
            write_format(project, docx_path, str(dst), fmt, log, ebook_convert)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return str(dst)
