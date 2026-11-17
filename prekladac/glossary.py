"""Glosář knihy: jména postav, místa a pojmy se v celé knize přeloží vždy stejně.

Glosář patří ke knize a cílovému jazyku (uložený ve složce programu „glosare“, je i v záloze nastavení).
- AI překladače (Claude, Gemini, OpenAI-kompatibilní, Ollama) dostanou glosář jako závazné pokyny a výrazy
  správně skloňují.
- Ostatní (Google, DeepL, Microsoft, offline…) výraz nahradí značkou ⟦G1⟧, kterou překladač nechá beze změny,
  a po překladu se vloží zadaný překlad – vždy stejně, jen bez skloňování (u jmen to obvykle nevadí).
Návrh glosáře: AI vybere jména a pojmy z textu knihy a navrhne překlad; bez AI se najdou opakovaná jména
(slova s velkým písmenem uprostřed věty), která se ponechají beze změny.
"""
from __future__ import annotations

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

import components

TOKEN_RE = re.compile(r"⟦\s*G\s*(\d+)\s*⟧")


def _fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    return re.sub(r"[^a-z0-9]+", "-", "".join(c for c in s if not unicodedata.combining(c)).lower()).strip("-")


def glossary_dir() -> Path:
    d = components.app_dir() / "glosare"
    d.mkdir(parents=True, exist_ok=True)
    return d


def path_for(source: str | Path, lang: str) -> Path:
    stem = Path(source).name
    for suf in (".kniha.json",):
        stem = stem[:-len(suf)] if stem.lower().endswith(suf) else stem
    stem = stem.rsplit(".", 1)[0] if "." in stem else stem
    return glossary_dir() / f"{_fold(stem)[:80] or 'kniha'}__{_fold(lang) or 'jazyk'}.json"


def clean_terms(terms: list[dict]) -> list[dict]:
    out, seen = [], set()
    for t in terms or []:
        src, dst = str(t.get("src", "")).strip(), str(t.get("dst", "")).strip()
        if not src or src.lower() in seen:
            continue
        seen.add(src.lower())
        out.append({"src": src, "dst": dst or src, "note": str(t.get("note", "")).strip()})
    return out


def load(source: str | Path, lang: str) -> list[dict]:
    try:
        return clean_terms(json.loads(path_for(source, lang).read_text(encoding="utf-8")).get("terms", []))
    except (OSError, ValueError):
        return []


def save(source: str | Path, lang: str, terms: list[dict]) -> Path:
    p = path_for(source, lang)
    terms = clean_terms(terms)
    if not terms:
        p.unlink(missing_ok=True)
        return p
    p.write_text(json.dumps({"book": Path(source).name, "lang": lang, "terms": terms}, ensure_ascii=False, indent=1),
                 encoding="utf-8")
    return p


def notes_text(terms: list[dict]) -> str:
    """Glosář jako pokyn pro AI překladač."""
    if not terms:
        return ""
    lines = ["GLOSÁŘ KNIHY – tyto výrazy překládej v celé knize vždy takto (správně je skloňuj, výraz uvedený "
             "beze změny ponech v originále):"]
    for t in terms:
        same = t["dst"] == t["src"]
        lines.append(f"- {t['src']} → {t['src'] + ' (beze změny)' if same else t['dst']}"
                     + (f"  [{t['note']}]" if t.get("note") else ""))
    return "\n".join(lines)


def _pattern(src: str) -> re.Pattern:
    return re.compile(r"(?<![\w])" + re.escape(src) + r"(?![\w])")


def protect(text: str, terms: list[dict]) -> str:
    """Výrazy z glosáře → značky ⟦Gn⟧ (delší výrazy dřív, ať „New York City“ nevyhraje „York“)."""
    order = sorted(range(len(terms)), key=lambda i: -len(terms[i]["src"]))
    for i in order:
        text = _pattern(terms[i]["src"]).sub(f"⟦G{i + 1}⟧", text)
    return text


def restore(text: str, terms: list[dict]) -> str:
    def rep(m):
        i = int(m.group(1)) - 1
        return terms[i]["dst"] if 0 <= i < len(terms) else m.group(0)
    return TOKEN_RE.sub(rep, text)


def is_ai(tr) -> bool:
    """Překladač, který rozumí pokynům (Claude, Gemini, OpenAI-kompatibilní, Ollama)."""
    if type(tr).__name__ == "ClaudeTranslator":
        return True
    eng = getattr(tr, "engine", None)
    return eng is not None and hasattr(eng, "notes")


class GlossaryTranslator:
    """Obal překladače pro jednu knihu: AI dostane glosář v pokynech, ostatní výrazy chráněné značkami."""

    def __init__(self, tr, terms: list[dict]):
        self._tr, self.terms = tr, terms
        self._ai = is_ai(tr)

    def __getattr__(self, name):
        return getattr(self._tr, name)

    def translate_segments(self, segments, markup, *args, **kwargs):
        if not self.terms:
            return self._tr.translate_segments(segments, markup, *args, **kwargs)
        if self._ai:
            target = self._tr if hasattr(self._tr, "notes") else self._tr.engine
            old = target.notes
            target.notes = (old + "\n\n" if old else "") + notes_text(self.terms)
            try:
                return self._tr.translate_segments(segments, markup, *args, **kwargs)
            finally:
                target.notes = old
        out = self._tr.translate_segments([protect(s, self.terms) for s in segments], markup, *args, **kwargs)
        return [restore(s, self.terms) for s in out]


def wrap(tr, source: str | Path, lang: str):
    """Překladač pro tento soubor: s glosářem, když ho kniha má (jinak beze změny)."""
    if tr is None:
        return tr
    terms = load(source, lang)
    return GlossaryTranslator(tr, terms) if terms else tr


# ------------------------------------------------------------------ návrh glosáře
_STOP = {"I", "The", "A", "An", "He", "She", "It", "We", "They", "You", "But", "And", "Mr", "Mrs", "Ms", "Dr", "Sir",
         "Der", "Die", "Das", "Ein", "Eine", "Und", "Er", "Sie", "Es", "Wir", "Ich", "Le", "La", "Les", "Il", "Elle",
         "Chapter", "Kapitel", "Kapitola", "Oh", "Yes", "No", "Ja", "Nein", "God", "Gott", "OK", "Okay"}


def suggest_names(text: str, min_count: int = 3, limit: int = 60) -> list[dict]:
    """Bez AI: opakovaná vlastní jména (velké písmeno uprostřed věty) – navrhnou se beze změny."""
    counts, starts = Counter(), Counter()
    for sent in re.split(r"(?<=[.!?…:;\"“”«»])\s+|\n+", text):
        words = re.findall(r"[^\W\d_][\w'’-]*", sent)
        for k, w in enumerate(words):
            if w[:1].isupper() and len(w) > 1 and not w.isupper():
                (starts if k == 0 else counts)[w] += 1
    # jméno: aspoň jednou uprostřed věty (běžná slova s velkým písmenem bývají jen na začátku věty)
    names = [(w, c + starts[w]) for w, c in counts.items()
             if c + starts[w] >= min_count and w not in _STOP and c * 2 >= starts[w]]
    names.sort(key=lambda x: -x[1])
    return [{"src": w, "dst": w, "note": f"jméno ({c}×)"} for w, c in names[:limit]]


SUGGEST_SCHEMA = {
    "type": "object",
    "properties": {"terms": {"type": "array", "items": {
        "type": "object", "properties": {"src": {"type": "string"}, "dst": {"type": "string"}, "note": {"type": "string"}},
        "required": ["src", "dst", "note"], "additionalProperties": False}}},
    "required": ["terms"], "additionalProperties": False,
}


def suggest_ai(complete, text: str, lang: str, limit_chars: int = 24000) -> list[dict]:
    """S AI: complete(system, user, schema, max_tokens) → návrh jmen a pojmů s překladem do cílového jazyka."""
    system = ("Jsi zkušený literární překladatel. Z ukázky knihy vyber jména postav, míst, organizací, vymyšlené pojmy "
              "a opakované odborné výrazy, které je potřeba v celé knize překládat stejně. U každého uveď originál, "
              f"doporučený překlad do jazyka: {lang} (jména osob obvykle beze změny; zavedené překlady použij, "
              "pokud existují) a krátkou poznámku (postava, místo, pojem…). Nanejvýš 60 výrazů, bez běžných slov.")
    res = complete(system, "UKÁZKA KNIHY:\n" + text[:limit_chars], SUGGEST_SCHEMA, 6000)
    return clean_terms(res.get("terms", []))


def sample_text(path: str | Path) -> str:
    """Text knihy pro návrh glosáře (prvních asi 60 000 znaků)."""
    p = Path(path)
    try:
        if p.name.lower().endswith(".kniha.json"):
            proj = json.loads(p.read_text(encoding="utf-8"))
            return "\n\n".join(c.get("text", "") for c in proj.get("chapters", []))[:60000]
        import ebook

        book = ebook.read_book(p)
        return "\n\n".join(ebook.plain_text(c.html) for c in book.chapters)[:60000]
    except Exception:  # noqa: BLE001 – formát, který umí jen Calibre, nebo obrázek
        try:
            return p.read_text(encoding="utf-8", errors="ignore")[:60000]
        except OSError:
            return ""
