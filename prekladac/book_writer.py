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
    lines += [f"{i}. {ch['title']} — {ch['summary']}" for i, ch in enumerate(o["chapters"], 1)]
    return "\n".join(lines) + "\n"


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
            chapters.append({"title": m.group(1).strip(), "summary": m.group(2).strip()})
        elif re.match(r"^\s*\d+[.)]\s*\S", line):
            chapters.append({"title": re.sub(r"^\s*\d+[.)]\s*", "", line).strip(), "summary": ""})
    if not chapters:
        raise BookError("V osnově nejsou žádné kapitoly (řádky „1. Název — obsah“ pod „KAPITOLY:“).")
    return {"title": title_m.group(1).strip(), "synopsis": synopsis, "characters": characters,
            "chapters": chapters}


def safe_name(title: str) -> str:
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", title).strip().rstrip(".")
    return name[:80] or "Kniha"


# ---------------------------------------------------------------- projekt
def save_project(path: Path, project: dict) -> None:
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding="utf-8")
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
        parts.append(f"Délka: přibližně {project['words']} slov.")
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
            max_tokens = min(64000, int(project["words"] * TOKENS_PER_WORD * 4) + 16000)
            try:
                res = self.backend.complete(system, prompt, CHAPTER_SCHEMA, max_tokens=max_tokens, cache=True)
            except ModelError as e:
                raise BookError(f"Kapitolu {idx + 1} se nepodařilo napsat ({e}). Rozepsaná kniha je uložená, "
                                "můžete pokračovat později.") from e
            text = res["text"].strip()
            project["chapters"].append({"text": text, "summary": res["summary"].strip()})
            save_project(project_path, project)
            self.log(f"  ✓ hotovo ({len(text.split()):,} slov) – {self.backend.cost_summary()}".replace(",", " "))
            progress(len(project["chapters"]) / len(chapters))
        return project


# ------------------------------------------------------------------ export
LANG_CODES = {"čeština": "cs", "slovenština": "sk", "angličtina": "en", "němčina": "de", "polština": "pl"}


def export(project: dict, out_dir: str | Path, formats: list[str], log: Callable[[str], None] = print,
           ebook_convert: str | None = None) -> list[str]:
    """Uloží hotovou knihu: vždy DOCX, z něj přes Calibre EPUB/PDF/AZW3."""
    import docx
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK

    from converters import calibre_convert, output_path

    o = project["outline"]
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    base = out_dir / safe_name(o["title"])

    d = docx.Document()
    d.core_properties.title = o["title"]
    d.core_properties.author = project.get("author", "")
    code = LANG_CODES.get(project.get("language", "").lower())
    if code:
        d.core_properties.language = code
    t = d.add_paragraph(o["title"], style="Title")
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for i, (ch_plan, ch) in enumerate(zip(o["chapters"], project["chapters"]), 1):
        d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
        d.add_heading(f"{i}. {ch_plan['title']}", level=1)
        for para in re.split(r"\n\s*\n", ch["text"]):
            para = " ".join(para.split())
            if para:
                d.add_paragraph(para)
    docx_path = output_path(str(base) + ".docx", None, "docx", "")
    d.save(docx_path)
    results = []
    if "docx" in formats:
        results.append(docx_path)
    for fmt in formats:
        if fmt == "docx":
            continue
        dst = output_path(str(base) + "." + fmt, None, fmt, "")
        calibre_convert(docx_path, dst, log, ebook_convert)
        results.append(dst)
    if "docx" not in formats:
        Path(docx_path).unlink(missing_ok=True)
    return results
