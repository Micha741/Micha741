"""Český slovník: kontrola pravopisu, návrhy oprav a doplňování slov při psaní (jako T9).

Slovník je oficiální český slovník Hunspell z LibreOffice (GPL). Instalátor ho přibaluje do
složky `dict` u programu; když chybí (spuštění z Pythonu), dá se stáhnout do %APPDATA%\\Prekladac\\dict.
Kontrolu dělá knihovna spylls (čistý Python, bez DLL).
"""
from __future__ import annotations

import bisect
import itertools
import re
import threading
from collections import Counter
from pathlib import Path
from typing import Callable

import components

DICT_NAME = "cs_CZ"
DICT_BASE_URL = "https://raw.githubusercontent.com/LibreOffice/dictionaries/master/cs_CZ/"
WORD_RE = re.compile(r"[^\W\d_]+(?:['’][^\W\d_]+)?")
MIN_COMPLETE = 3  # od kolika napsaných písmen nabízet doplnění


def user_dict_path() -> Path:
    return components.app_dir() / "slovnik_uzivatele.txt"


def dict_dirs() -> list[Path]:
    return [components.bundled_dir() / "dict", components.app_dir() / "dict"]


def find_dictionary() -> Path | None:
    """Cesta bez přípony (…/cs_CZ), pokud existuje .aff i .dic."""
    for d in dict_dirs():
        base = d / DICT_NAME
        if base.with_suffix(".aff").is_file() and base.with_suffix(".dic").is_file():
            return base
    return None


def download_dictionary(log: Callable[[str], None] = print) -> Path:
    from free_engines import http_request

    target = components.app_dir() / "dict"
    target.mkdir(parents=True, exist_ok=True)
    for ext in (".aff", ".dic"):
        log(f"Stahuji český slovník ({DICT_NAME}{ext})…")
        data = http_request(DICT_BASE_URL + DICT_NAME + ext, timeout=120, retries=2, service="Slovník")
        tmp = target / (DICT_NAME + ext + ".part")
        tmp.write_bytes(data)
        tmp.replace(target / (DICT_NAME + ext))
    return target / DICT_NAME


class Speller:
    def __init__(self, base: Path):
        from spylls.hunspell import Dictionary

        self.base = Path(base)
        self._dic = Dictionary.from_files(str(self.base))
        self._cache: dict[str, bool] = {}
        self._lock = threading.Lock()
        self.ignored: set[str] = set()
        self.user_words: set[str] = set()
        p = user_dict_path()
        if p.is_file():
            self.user_words = {w.strip() for w in p.read_text(encoding="utf-8").splitlines() if w.strip()}
        # základní tvary ze slovníku pro doplňování (seřazené, hledá se půlením)
        stems = set()
        with open(self.base.with_suffix(".dic"), encoding="utf-8", errors="replace") as f:
            next(f, None)  # první řádek je počet slov
            for line in f:
                w = line.split("/", 1)[0].strip()
                if len(w) >= MIN_COMPLETE + 1 and w.isalpha():
                    stems.add(w)
        self._stems = sorted(stems, key=str.lower)
        self._stems_low = [s.lower() for s in self._stems]

    # ------------------------------------------------------------ kontrola
    def check(self, word: str) -> bool:
        if len(word) < 2 or word in self.user_words or word in self.ignored or word.isupper():
            return True
        hit = self._cache.get(word)
        if hit is None:
            with self._lock:
                hit = bool(self._dic.lookup(word))
            self._cache[word] = hit
        return hit

    def suggest(self, word: str, limit: int = 6) -> list[str]:
        with self._lock:
            return list(itertools.islice(self._dic.suggest(word), limit))

    def warm(self, text: str) -> None:
        """Předem zkontroluje všechna slova textu (ve vlákně na pozadí), ať je zvýraznění pak okamžité."""
        for w in set(WORD_RE.findall(text)):
            self.check(w)

    def add_word(self, word: str) -> None:
        self.user_words.add(word)
        p = user_dict_path()
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text("\n".join(sorted(self.user_words)) + "\n", encoding="utf-8")

    def ignore(self, word: str) -> None:
        self.ignored.add(word)

    # ------------------------------------------------------------ doplňování
    def completions(self, prefix: str, learned: Counter | None = None, limit: int = 7) -> list[str]:
        """Návrhy slov začínajících na `prefix`: nejdřív slova z rozepsaného textu, pak ze slovníku."""
        if len(prefix) < MIN_COMPLETE:
            return []
        low = prefix.lower()
        out: list[str] = []
        seen = {low}
        for w, _n in (learned or Counter()).most_common():
            if len(out) >= limit:
                break
            if w.lower().startswith(low) and w.lower() not in seen:
                out.append(w)
                seen.add(w.lower())
        for w in sorted((w for w in self.user_words if w.lower().startswith(low)), key=len):
            if len(out) >= limit:
                break
            if w.lower() not in seen:
                out.append(w)
                seen.add(w.lower())
        i = bisect.bisect_left(self._stems_low, low)
        extra = []
        while i < len(self._stems_low) and self._stems_low[i].startswith(low) and len(extra) < 200:
            extra.append(self._stems[i])
            i += 1
        lower_first = prefix[:1].islower()
        for w in sorted(extra, key=lambda s: (lower_first and s[:1].isupper(), len(s), s.lower())):
            if len(out) >= limit:
                break
            if w.lower() not in seen:
                out.append(w)
                seen.add(w.lower())
        res: list[str] = []
        for w in out:
            # slovo z textu s velkým písmenem jen kvůli začátku věty („Kniha …“) nabídnout malým
            if prefix[:1].islower() and w[:1].isupper() and w[1:].islower() and self.check(w.lower()):
                w = w.lower()
            w = match_case(prefix, w)
            if w not in res:
                res.append(w)
        return res


def match_case(prefix: str, word: str) -> str:
    """Doplní slovo ve stejné velikosti písmen, jak je uživatel začal psát."""
    if prefix.isupper() and len(prefix) > 1:
        return word.upper()
    if prefix[:1].isupper():
        return word[:1].upper() + word[1:]
    if word[:1].isupper() and not prefix[:1].isupper() and word[1:].islower():
        return word  # vlastní jméno ponechat velkým písmenem
    return word


def learn_words(text: str) -> Counter:
    return Counter(w for w in WORD_RE.findall(text) if len(w) > MIN_COMPLETE)


# ---------------------------------------------------------------- sdílená instance
_state = {"speller": None, "loading": False, "error": None}
_listeners: list[Callable[[], None]] = []
_state_lock = threading.Lock()


def get() -> Speller | None:
    return _state["speller"]


def status() -> str:
    if _state["speller"]:
        return "ready"
    if _state["loading"]:
        return "loading"
    if _state["error"]:
        return "error"
    return "missing" if not find_dictionary() else "idle"


def last_error() -> str | None:
    return _state["error"]


def load_async(on_ready: Callable[[], None] | None = None, download: bool = False,
               log: Callable[[str], None] = lambda _m: None) -> None:
    """Načte slovník na pozadí (jednou za běh programu); on_ready se zavolá z vlákna na pozadí."""
    with _state_lock:
        if on_ready:
            if _state["speller"]:
                on_ready()
            else:
                _listeners.append(on_ready)
        if _state["speller"] or _state["loading"]:
            return
        base = find_dictionary()
        if not base and not download:
            return
        _state["loading"], _state["error"] = True, None

    def job():
        try:
            b = base or download_dictionary(log)
            sp = Speller(b)
            _state["speller"] = sp
        except Exception as e:  # noqa: BLE001
            _state["error"] = str(e)
            log(f"Slovník se nepodařilo načíst: {e}")
        finally:
            _state["loading"] = False
        with _state_lock:
            calls = list(_listeners)
            _listeners.clear()
        if _state["speller"]:
            for fn in calls:
                try:
                    fn()
                except Exception:  # noqa: BLE001
                    pass

    threading.Thread(target=job, daemon=True).start()
