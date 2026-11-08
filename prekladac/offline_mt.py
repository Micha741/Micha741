"""Offline překlad v počítači – modely Argos Translate (stejné jako používá LibreTranslate).

Bez serveru, bez internetu (po stažení balíčků) a bez PyTorche: stačí CTranslate2 + SentencePiece
(+ sacremoses u balíčků s „bpe.model“). Balíček = zip *.argosmodel s metadata.json, složkou model/
(CTranslate2) a sentencepiece.model nebo bpe.model. Balíčky se stahují do %APPDATA%\\Prekladac\\offline.
Když přímý pár chybí (např. němčina → čeština), překládá se přes angličtinu (de → en → cs).
"""
from __future__ import annotations

import io
import json
import re
import shutil
import threading
import zipfile
from pathlib import Path
from typing import Callable

import components

INDEX_URL = "https://raw.githubusercontent.com/argosopentech/argospm-index/main/index.json"
# doporučené balíčky (uživatel překládá nejčastěji z angličtiny a němčiny do češtiny)
RECOMMENDED = [("en", "cs"), ("de", "en")]
LANG_NAMES = {"en": "angličtina", "cs": "čeština", "de": "němčina", "sk": "slovenština", "pl": "polština",
              "fr": "francouzština", "es": "španělština", "it": "italština", "ru": "ruština", "uk": "ukrajinština",
              "hu": "maďarština", "nl": "nizozemština", "pt": "portugalština", "ja": "japonština", "zh": "čínština"}
# jazyk programu/knihy (česky) → kód
NAME_TO_CODE = {v: k for k, v in LANG_NAMES.items()} | {"slovenčina": "sk"}

# nejčastější slova pro rozpoznání jazyka originálu
_STOP = {
    "en": "the and of to in is that it for was with as on be at by this have from are not but had his they you",
    "de": "der die und in den von zu das mit sich des auf für ist im dem nicht ein eine als auch es an werden aus",
    "fr": "le la les de des et est en un une du que qui dans pour pas au sur ne se ce il elle avec",
    "es": "el la de que y en los del se las por un para con no una su al es lo como más pero sus",
    "it": "il di che la e per un in non una sono del con le si da al della è come anche ma ho",
    "pl": "i w nie na się z do że to jest jak o ale po co tak za od jego jej przez",
    "cs": "a se na je že v to s z do o ale jak by jsem jsou byl jeho tak pro které",
    "sk": "a sa na je že v to s z do o ale ako by som sú bol jeho tak pre ktoré",
    "ru": "и в не на что я с он как это по но из у за от к так же",
    "nl": "de het een en van is dat in op te zijn met voor niet aan er ook als",
    "pt": "de a o que e do da em um para é com não uma os no se na por",
}
_STOP = {k: set(v.split()) for k, v in _STOP.items()}
_WORD = re.compile(r"[^\W\d_]+", re.U)


def models_dir() -> Path:
    d = components.app_dir() / "offline"
    d.mkdir(parents=True, exist_ok=True)
    return d


def code_of(name: str) -> str | None:
    n = (name or "").strip().lower()
    if n in NAME_TO_CODE:
        return NAME_TO_CODE[n]
    return n if re.fullmatch(r"[a-z]{2}", n) else None


def detect_language(text: str, candidates=None) -> str | None:
    """Jazyk textu podle nejčastějších slov (stačí na rozlišení angličtiny, němčiny atd.)."""
    words = [w.lower() for w in _WORD.findall(text[:20000])]
    if len(words) < 3:
        return None
    best, score = None, 0
    for code, stop in _STOP.items():
        if candidates and code not in candidates:
            continue
        s = sum(1 for w in words if w in stop)
        if s > score:
            best, score = code, s
    return best if score >= max(2, len(words) // 40) else None


# ------------------------------------------------------------------ balíčky
def installed() -> dict[tuple[str, str], Path]:
    out = {}
    for meta in models_dir().glob("*/metadata.json"):
        try:
            m = json.loads(meta.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        if m.get("type", "translate") == "translate" and m.get("from_code") and m.get("to_code"):
            out[(m["from_code"], m["to_code"])] = meta.parent
    return out


def available(timeout: float = 30) -> list[dict]:
    """Balíčky ke stažení z rejstříku Argos (od, do, verze, odkazy)."""
    from free_engines import http_request

    data = json.loads(http_request(INDEX_URL, timeout=timeout, retries=2, service="Offline překlad"))
    return [p for p in data if p.get("type", "translate") == "translate" and p.get("links")]


def install(pkg: dict, log: Callable[[str], None] = print) -> Path:
    """Stáhne a rozbalí balíček (*.argosmodel) do složky offline modelů."""
    from free_engines import EngineError, http_request

    name = f"{pkg['from_code']}_{pkg['to_code']}"
    if not re.fullmatch(r"[a-z]{2,3}_[a-z]{2,3}", name):
        raise EngineError(f"Neplatný balíček: {name}")
    log(f"Stahuji offline balíček {LANG_NAMES.get(pkg['from_code'], pkg['from_code'])} → "
        f"{LANG_NAMES.get(pkg['to_code'], pkg['to_code'])} (asi 100 MB)…")
    last = None
    for url in pkg["links"]:
        try:
            data = http_request(url, timeout=900, retries=2, service="Offline překlad")
            break
        except EngineError as e:
            last = e
    else:
        raise last or EngineError("Balíček se nepodařilo stáhnout.")
    target = models_dir() / name
    tmp = models_dir() / (name + ".part")
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir()
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        root = tmp.resolve()
        for member in z.infolist():  # ochrana proti cestám mimo složku
            dest = (tmp / member.filename).resolve()
            if root not in dest.parents and dest != root:
                raise EngineError("Balíček obsahuje neplatné cesty.")
        z.extractall(tmp)
    metas = list(tmp.glob("*/metadata.json")) + list(tmp.glob("metadata.json"))
    if not metas:
        shutil.rmtree(tmp, ignore_errors=True)
        raise EngineError("Balíček nemá metadata.json – není to balíček Argos Translate.")
    shutil.rmtree(target, ignore_errors=True)
    metas[0].parent.rename(target)
    shutil.rmtree(tmp, ignore_errors=True)
    log(f"  ✓ nainstalováno ({len(data) // 1024 // 1024} MB)")
    return target


def remove(pair: tuple[str, str]) -> None:
    p = installed().get(pair)
    if p:
        shutil.rmtree(p, ignore_errors=True)


def route(src: str, dst: str) -> list[tuple[str, str]] | None:
    """Cesta překladu přes nainstalované balíčky: přímo, nebo přes angličtinu."""
    have = installed()
    if (src, dst) in have:
        return [(src, dst)]
    if src != "en" and dst != "en" and (src, "en") in have and ("en", dst) in have:
        return [(src, "en"), ("en", dst)]
    return None


# ------------------------------------------------------------------ překlad
class _Model:
    """Jeden načtený balíček (CTranslate2 + tokenizér)."""

    def __init__(self, path: Path):
        import ctranslate2

        self.path = path
        meta = json.loads((path / "metadata.json").read_text(encoding="utf-8"))
        self.prefix = meta.get("target_prefix", "")
        self.translator = ctranslate2.Translator(str(path / "model"), device="cpu", compute_type="auto",
                                                 inter_threads=1, intra_threads=0)
        sp = path / "sentencepiece.model"
        if sp.exists():
            import sentencepiece

            self.sp = sentencepiece.SentencePieceProcessor(model_file=str(sp))
            self.bpe = None
        else:
            self.sp = None
            self.bpe = _BPE(path / "bpe.model", meta.get("from_code", "en"), meta.get("to_code", "en"))

    def encode(self, s: str) -> list[str]:
        return self.sp.encode(s, out_type=str) if self.sp else self.bpe.encode(s)

    def decode(self, tokens: list[str]) -> str:
        if self.sp:
            return self.sp.decode_pieces(tokens).replace("▁", " ")
        return self.bpe.decode(tokens)

    def translate(self, sentences: list[str]) -> list[str]:
        if not sentences:
            return []
        tok = [self.encode(s) for s in sentences]
        prefix = [[self.prefix]] * len(tok) if self.prefix else None
        res = self.translator.translate_batch(tok, target_prefix=prefix, replace_unknowns=True, max_batch_size=32,
                                              batch_type="examples", beam_size=2, length_penalty=0.2)
        out = []
        for r in res:
            v = self.decode(r.hypotheses[0])
            if self.prefix and v.startswith(self.prefix):
                v = v[len(self.prefix):]
            out.append(v.strip())
        return out


class _BPE:
    """Balíčky s „bpe.model“ (Moses tokenizace + BPE) – potřebují sacremoses."""

    def __init__(self, model: Path, src: str, dst: str):
        from sacremoses import MosesDetokenizer, MosesPunctNormalizer, MosesTokenizer

        self.tok, self.detok, self.norm = MosesTokenizer(src), MosesDetokenizer(dst), MosesPunctNormalizer(src)
        merges = []
        with open(model, encoding="utf-8") as f:
            for line in f:
                if line.startswith("#version") or not line.strip():
                    continue
                parts = line.rstrip("\n").split(" ")
                if len(parts) == 2:
                    merges.append(tuple(parts))
        self.ranks = {m: i for i, m in enumerate(merges)}
        self.cache: dict[str, list[str]] = {}

    def _segment(self, word: str) -> list[str]:
        if word in self.cache:
            return self.cache[word]
        chars = list(word[:-1]) + [word[-1] + "</w>"]
        while len(chars) > 1:
            pairs = [(self.ranks.get((chars[i], chars[i + 1]), 1 << 30), i) for i in range(len(chars) - 1)]
            rank, i = min(pairs)
            if rank == 1 << 30:
                break
            chars = chars[:i] + [chars[i] + chars[i + 1]] + chars[i + 2:]
        if chars[-1] == "</w>":
            chars = chars[:-1]
        elif chars[-1].endswith("</w>"):
            chars[-1] = chars[-1][:-4]
        out = [c + "@@" for c in chars[:-1]] + [chars[-1]]
        self.cache[word] = out
        return out

    def encode(self, s: str) -> list[str]:
        words = self.tok.tokenize(self.norm.normalize(s))
        return [p for w in words for p in self._segment(w)]

    def decode(self, tokens: list[str]) -> str:
        return self.detok.detokenize(" ".join(tokens).replace("@@ ", "").split(" "))


# konec věty: . ! ? … (případně s uzavírací uvozovkou/závorkou), mezera a velké písmeno nebo číslice
_SENT = re.compile(r"[.!?…]+[\"'“”»«)]*(\s+)(?=[\"'„“«(]*[A-ZÁ-Ž0-9])")


def split_sentences(text: str) -> list[str]:
    parts, start = [], 0
    for m in _SENT.finditer(text):
        parts.append(text[start:m.start(1)])
        start = m.end(1)
    parts.append(text[start:])
    parts = [p.strip() for p in parts if p.strip()]
    out = []
    for p in parts:  # velmi dlouhé věty rozdělit (model má omezenou délku)
        while len(p) > 900:
            cut = p.rfind(", ", 0, 900)
            cut = cut + 1 if cut > 200 else 900
            out.append(p[:cut].strip())
            p = p[cut:].strip()
        out.append(p)
    return out


class OfflineTranslator:
    """Načtené modely se drží v paměti (načtení trvá pár sekund)."""

    _models: dict[tuple[str, str], _Model] = {}
    _lock = threading.Lock()

    def model(self, pair: tuple[str, str]) -> _Model:
        with self._lock:
            m = self._models.get(pair)
            if m is None:
                path = installed().get(pair)
                if not path:
                    raise RuntimeError(f"Chybí offline balíček {pair[0]} → {pair[1]}.")
                m = self._models[pair] = _Model(path)
            return m

    def translate(self, texts: list[str], src: str, dst: str) -> list[str]:
        steps = route(src, dst)
        if not steps:
            raise RuntimeError(missing_message(src, dst))
        out = list(texts)
        for pair in steps:
            m = self.model(pair)
            nxt = []
            for t in out:
                sents = split_sentences(t)
                nxt.append(" ".join(m.translate(sents)) if sents else t)
            out = nxt
        return out


def missing_message(src: str, dst: str) -> str:
    a, b = LANG_NAMES.get(src, src), LANG_NAMES.get(dst, dst)
    need = f"{a} → {b}" if src == "en" or dst == "en" else f"{a} → angličtina a angličtina → {b}"
    return (f"Pro offline překlad {a} → {b} chybí balíček ({need}). Stáhněte ho v ⚙ Nastavení → Součásti → "
            "Offline překlad.")
