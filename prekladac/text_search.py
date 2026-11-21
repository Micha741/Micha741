"""Vzor pro hledání v knize: shodně v Pythonu (re) i v Qt (QRegularExpression / PCRE2).

- mezery: jedna mezera v hledaném textu najde i pevnou mezeru (nbsp – „v domě“ po typografii), tabulátor
  i víc mezer za sebou,
- uvozovky, apostrofy a pomlčky: „“ " « » / ' ’ ‚ / - – — se berou jako stejný znak,
- bez ohledu na diakritiku (volitelně): „zluty“ najde „žlutý“, „Žlutý“ i „zlutý“,
- jen celá slova, velká a malá písmena.
"""
from __future__ import annotations

import re
import unicodedata

_SPACE = "[ \\t\u00a0\u2007\u2009\u202f]+"
_GROUPS = ('"„“”«»‟〞', "'’‘‚‛`´", "-–—‒−")
_LETTERS = "áäàâãåāăąčćçďđéěëèêēęíïìîīĺľłňńñóöòôõőøřŕšśşťţúůüùûűūýÿžźż"


def _fold(ch: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", ch) if not unicodedata.combining(c)) or ch


def _variants() -> dict[str, str]:
    groups: dict[str, set[str]] = {}
    for c in _LETTERS + _LETTERS.upper():
        base = _fold(c)
        if len(base) == 1:
            groups.setdefault(base, {base}).add(c)
    return {k: "".join(sorted(v)) for k, v in groups.items()}


_VAR = _variants()


def _cls(chars: str) -> str:
    return "[" + "".join("\\" + c if c in "\\]^-[" else c for c in chars) + "]"


def search_regex(needle: str, case: bool = False, words: bool = False, loose: bool = True) -> str:
    """Regulární výraz (bez příznaků) pro hledaný text; prázdný text → ''."""
    out, prev_space = [], False
    for ch in needle.strip():  # mezery na začátku a konci bývají omylem (kopírování)
        if ch.isspace():
            if not prev_space:
                out.append(_SPACE)
            prev_space = True
            continue
        prev_space = False
        grp = next((g for g in _GROUPS if ch in g), None)
        if grp:
            out.append(_cls(grp))
            continue
        if loose and ch.isalpha():
            base = _fold(ch)
            if len(base) == 1:
                chars = _VAR.get(base, base)
                if not case:
                    low, up = _VAR.get(base.lower(), base.lower()), _VAR.get(base.upper(), base.upper())
                    chars = "".join(dict.fromkeys(low + up))
                out.append(_cls(chars) if len(chars) > 1 else re.escape(chars))
                continue
        out.append(re.escape(ch))
    p = "".join(out)
    if not p:
        return ""
    if words:
        p = rf"(?<!\w)(?:{p})(?!\w)"
    return p


def compile_py(needle: str, case: bool = False, words: bool = False, loose: bool = True) -> re.Pattern | None:
    p = search_regex(needle, case, words, loose)
    return re.compile(p, 0 if case else re.IGNORECASE) if p else None
