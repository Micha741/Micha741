"""Další překladače (DeepL, Google, Microsoft, Gemini, Ollama, LibreTranslate) a OCR přes Tesseract.

Všechny překladače mají stejné rozhraní jako ClaudeTranslator (translate_segments, image_blocks,
pdf_blocks), takže je converters.py používá stejně.
"""

from __future__ import annotations

import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from typing import Callable

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Prekladac/1.0"

# název jazyka -> (ISO kód, kód pro DeepL)
LANGS = {
    "čeština": ("cs", "CS"), "slovenština": ("sk", "SK"), "angličtina": ("en", "EN-US"),
    "němčina": ("de", "DE"), "polština": ("pl", "PL"), "francouzština": ("fr", "FR"),
    "španělština": ("es", "ES"), "italština": ("it", "IT"), "ruština": ("ru", "RU"),
    "ukrajinština": ("uk", "UK"), "maďarština": ("hu", "HU"),
}

BLOCK_STYLES = ["heading1", "heading2", "heading3", "paragraph", "bullet", "numbered", "table_row"]


class EngineError(Exception):
    """Chyba, kvůli které nemá smysl pokračovat (špatný klíč, vyčerpaný limit, nedostupná služba)."""


class BadResponse(Exception):
    """Odpověď nejde použít (např. jiný počet úseků) – dávka se rozdělí a zkusí znovu."""


def lang_codes(name: str) -> tuple[str, str]:
    key = name.strip().lower()
    if key in LANGS:
        return LANGS[key]
    # uživatel mohl zadat přímo kód, např. "cs" nebo "en"
    code = key[:2] if len(key) <= 5 else "cs"
    return code, code.upper()


# ------------------------------------------------------------------ HTTP
def http_request(url: str, *, data=None, headers: dict | None = None, method: str | None = None,
                 timeout: float = 120, retries: int = 4, backoff: tuple = (3, 8, 20, 45), service: str = "") -> bytes:
    """HTTP požadavek s opakováním při přetížení (429/5xx) a výpadku spojení."""
    hdrs = {"User-Agent": USER_AGENT}
    hdrs.update(headers or {})
    if isinstance(data, (dict, list)):
        data = json.dumps(data, ensure_ascii=False).encode("utf-8")
        hdrs.setdefault("Content-Type", "application/json")
    last = None
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")[:500]
            if e.code in (401, 403):
                raise EngineError(f"{service}: neplatný nebo chybějící klíč (HTTP {e.code}). {body}") from e
            if e.code == 456:
                raise EngineError(f"{service}: vyčerpán měsíční limit znaků.") from e
            if e.code == 404:
                raise EngineError(f"{service}: adresa nebo model nenalezen (HTTP 404). {body}") from e
            if e.code in (429, 500, 502, 503, 504, 529):
                last = f"HTTP {e.code} {body}"
                wait = e.headers.get("Retry-After")
                delay = float(wait) if wait and wait.isdigit() else backoff[min(attempt, len(backoff) - 1)]
            else:
                raise EngineError(f"{service}: chyba HTTP {e.code}: {body}") from e
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            last = str(getattr(e, "reason", e))
            delay = backoff[min(attempt, len(backoff) - 1)]
        if attempt < retries:
            time.sleep(delay)
    raise EngineError(f"{service}: služba neodpovídá ({last}).")


def http_json(url: str, **kw):
    return json.loads(http_request(url, **kw).decode("utf-8"))


# ------------------------------------------------- pomocné funkce textu
_TAG = re.compile(r"<[^>]+>")
_PH = re.compile(r"\{\s*\{\s*(\d+)\s*\}\s*\}")


def protect_tags(fragment: str) -> tuple[str, list[str]]:
    """Nahradí HTML značky zástupnými symboly {{n}} a entity převede na znaky."""
    tags: list[str] = []
    out = []
    pos = 0
    for m in _TAG.finditer(fragment):
        out.append(html.unescape(fragment[pos:m.start()]))
        out.append("{{%d}}" % len(tags))
        tags.append(m.group(0))
        pos = m.end()
    out.append(html.unescape(fragment[pos:]))
    return "".join(out), tags


def _tags_nest(tags_in_order: list[str]) -> bool:
    stack = []
    for t in tags_in_order:
        m = re.match(r"<\s*(/?)\s*([\w:.-]+)", t)
        if not m or t.endswith("/>"):
            continue
        name = m.group(2).lower()
        if m.group(1):
            if not stack or stack.pop() != name:
                return False
        elif name not in ("br", "img", "hr", "wbr"):
            stack.append(name)
    return not stack


def restore_tags(text: str, tags: list[str]) -> str:
    """Vrátí značky na místo zástupných symbolů; když to nejde, vrátí text bez značek."""
    found = [int(m.group(1)) for m in _PH.finditer(text)]
    pieces = _PH.split(text)  # text, id, text, id, ...
    escaped = [html.escape(p, quote=False) if i % 2 == 0 else p for i, p in enumerate(pieces)]
    if sorted(found) == list(range(len(tags))) and _tags_nest([tags[i] for i in found]):
        return "".join(tags[int(p)] if i % 2 else p for i, p in enumerate(escaped))
    # značky se nepodařilo zachovat – použijeme čistý text (zalomení <br> jako mezera)
    return re.sub(r"\s{2,}", " ", "".join(p for i, p in enumerate(escaped) if i % 2 == 0)).strip()


def split_long(text: str, limit: int) -> list[str]:
    """Rozdělí příliš dlouhý text po větách."""
    if len(text) <= limit:
        return [text]
    parts = re.split(r"(?<=[.!?…])\s+", text)
    chunks, buf = [], ""
    for p in parts:
        while len(p) > limit:
            chunks.append(p[:limit])
            p = p[limit:]
        if buf and len(buf) + len(p) + 1 > limit:
            chunks.append(buf)
            buf = ""
        buf = f"{buf} {p}" if buf else p
    if buf:
        chunks.append(buf)
    return chunks


def llm_instructions(target_lang: str, markup: bool, context: str, notes: str) -> str:
    s = (
        f"Jsi profesionální literární překladatel. Překládáš do jazyka: {target_lang}. "
        "Překládej věrně, přirozeně a stylisticky dobře. Nic nevynechávej a nepřidávej komentáře. "
        "Pokud je úsek už v cílovém jazyce nebo jde jen o čísla, vrať ho beze změny. "
    )
    if markup:
        s += ("Každý úsek je fragment HTML. Překládej jen text, všechny značky včetně atributů zachovej přesně "
              "a správně vnořené. ")
    else:
        s += "Úseky jsou prostý text; zachovej zalomení řádků uvnitř úseku. "
    if context:
        s += context + " "
    s += ("Dostaneš JSON se seznamem 'segments'. Vrať JSON {\"translations\": [...]} se stejným počtem položek "
          "ve stejném pořadí.")
    if notes:
        s += f"\n\nPokyny od uživatele (glosář, styl):\n{notes}"
    return s


OCR_INSTRUCTIONS = (
    "Přepiš veškerý text z dodaného materiálu přesně v původním jazyce (bez překladu), v přirozeném pořadí "
    "čtení. Vynech čísla stránek a opakující se záhlaví/zápatí, spoj slova rozdělená na konci řádku a řádky "
    "jednoho odstavce spoj do jednoho bloku. Vrať JSON se seznamem bloků; style je jeden z: heading1, heading2, "
    "heading3, paragraph, bullet, numbered, table_row (buňky oddělené ' | '). Nepřidávej komentáře."
)


# ======================================================== překladače
class Engine:
    """Základ: přeloží jednu dávku úseků. Dávkování a opakování řeší EngineTranslator."""

    name = "?"
    max_chars = 5000
    max_items = 50
    workers = 2
    uses_notes = False

    def __init__(self, target_lang: str):
        self.target_lang = target_lang
        self.iso, self.deepl_code = lang_codes(target_lang)

    def translate_batch(self, texts: list[str], markup: bool, context: str) -> list[str]:
        raise NotImplementedError

    def usage_info(self) -> str:
        return ""


class DeepLEngine(Engine):
    name = "DeepL"
    max_chars = 25000
    max_items = 50
    workers = 2

    def __init__(self, target_lang: str, api_key: str):
        super().__init__(target_lang)
        if not api_key:
            raise EngineError("DeepL: chybí API klíč (zdarma na deepl.com → API Free).")
        self.key = api_key.strip()
        host = "api-free.deepl.com" if self.key.endswith(":fx") else "api.deepl.com"
        self.base = f"https://{host}/v2"

    def _headers(self):
        return {"Authorization": f"DeepL-Auth-Key {self.key}"}

    def translate_batch(self, texts, markup, context):
        body = {"text": texts, "target_lang": self.deepl_code, "preserve_formatting": True}
        if markup:
            body["tag_handling"] = "html"
        if context:
            body["context"] = context
        data = http_json(f"{self.base}/translate", data=body, headers=self._headers(), service="DeepL")
        out = [t["text"] for t in data.get("translations", [])]
        if len(out) != len(texts):
            raise BadResponse("DeepL vrátil jiný počet úseků")
        return out

    def usage_info(self):
        try:
            u = http_json(f"{self.base}/usage", headers=self._headers(), service="DeepL", retries=1)
            return f"DeepL: tento měsíc využito {u['character_count']:,} z {u['character_limit']:,} znaků".replace(
                ",", " ")
        except Exception:
            return ""


class GoogleFreeEngine(Engine):
    name = "Google Překladač"
    max_chars = 4000
    max_items = 80
    workers = 2
    URL = "https://translate.googleapis.com/translate_a/single"

    def _call(self, text: str) -> str:
        params = urllib.parse.urlencode({"client": "gtx", "sl": "auto", "tl": self.iso, "dt": "t"})
        body = urllib.parse.urlencode({"q": text}).encode("utf-8")
        data = http_json(
            f"{self.URL}?{params}", data=body,
            headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
            service="Google Překladač", backoff=(5, 15, 30, 60),
        )
        time.sleep(0.2)  # šetrně, ať Google neblokuje
        return "".join(part[0] for part in (data[0] or []) if part and part[0])

    def _translate_one(self, text: str) -> str:
        return " ".join(self._call(c) for c in split_long(text, self.max_chars))

    def translate_batch(self, texts, markup, context):
        prepared, tag_lists = [], []
        for t in texts:
            if markup:
                plain, tags = protect_tags(re.sub(r"\s*\n\s*", " ", t))
            else:
                plain, tags = t, []
            prepared.append(plain)
            tag_lists.append(tags)

        joinable = all("\n" not in p for p in prepared) and len(prepared) > 1
        result = None
        if joinable and sum(len(p) + 1 for p in prepared) <= self.max_chars:
            lines = self._call("\n".join(prepared)).split("\n")
            if len(lines) == len(prepared):
                result = [line.strip() for line in lines]
        if result is None:
            result = [self._translate_one(p) for p in prepared]
        return [restore_tags(r, tags) if markup else r for r, tags in zip(result, tag_lists)]


class MicrosoftEngine(Engine):
    name = "Microsoft Translator"
    max_chars = 20000
    max_items = 100
    workers = 2

    def __init__(self, target_lang: str, api_key: str, region: str = ""):
        super().__init__(target_lang)
        if not api_key:
            raise EngineError("Microsoft Translator: chybí klíč (Azure → Translator, cenová úroveň F0 je zdarma).")
        self.key = re.sub(r"\s+", "", api_key)
        self.region = self.normalize_region(region)

    @staticmethod
    def normalize_region(region: str) -> str:
        """„West Europe“ → „westeurope“; „Global“ znamená bez oblasti."""
        r = re.sub(r"[\s_-]+", "", (region or "").lower())
        return "" if r in ("", "global") else r

    def translate_batch(self, texts, markup, context):
        params = urllib.parse.urlencode({"api-version": "3.0", "to": self.iso,
                                         "textType": "html" if markup else "plain"})
        headers = {"Ocp-Apim-Subscription-Key": self.key}
        if self.region:
            headers["Ocp-Apim-Subscription-Region"] = self.region
        try:
            data = http_json(f"https://api.cognitive.microsofttranslator.com/translate?{params}",
                             data=[{"Text": t} for t in texts], headers=headers, service="Microsoft Translator")
        except EngineError as e:
            if "HTTP 401" in str(e):
                region = f"„{self.region}“" if self.region else "prázdná"
                raise EngineError(
                    f"{e}\nZkontrolujte v portálu Azure → váš Translator → Keys and Endpoint: "
                    f"1) klíč je KEY 1 přímo ze služby Translator (ne z jiné služby), "
                    f"2) pole Oblast odpovídá údaji „Location/Region“ (teď: {region}; u oblasti Global nechte prázdné), "
                    f"3) nová služba se může aktivovat až několik minut."
                ) from e
            raise
        out = [item["translations"][0]["text"] for item in data]
        if len(out) != len(texts):
            raise BadResponse("Microsoft vrátil jiný počet úseků")
        return out


class LibreTranslateEngine(Engine):
    name = "LibreTranslate"
    max_chars = 5000
    max_items = 40
    workers = 2

    def __init__(self, target_lang: str, url: str, api_key: str = ""):
        super().__init__(target_lang)
        self.url = (url or "http://localhost:5000").rstrip("/")
        self.key = api_key.strip()

    def translate_batch(self, texts, markup, context):
        body = {"q": texts, "source": "auto", "target": self.iso, "format": "html" if markup else "text"}
        if self.key:
            body["api_key"] = self.key
        data = http_json(f"{self.url}/translate", data=body, service="LibreTranslate", timeout=600)
        out = data.get("translatedText")
        if isinstance(out, str):
            out = [out]
        if not isinstance(out, list) or len(out) != len(texts):
            raise BadResponse("LibreTranslate vrátil jiný počet úseků")
        return out


class _LLMEngine(Engine):
    max_chars = 8000
    max_items = 60
    uses_notes = True

    def __init__(self, target_lang: str, notes: str = ""):
        super().__init__(target_lang)
        self.notes = notes.strip()

    def _complete_json(self, system: str, user_parts: list, schema: dict) -> dict:
        raise NotImplementedError

    def translate_batch(self, texts, markup, context):
        system = llm_instructions(self.target_lang, markup, context, self.notes)
        payload = json.dumps({"segments": texts}, ensure_ascii=False)
        try:
            data = self._complete_json(system, [{"text": payload}], _translation_schema(self))
            out = data["translations"]
        except (KeyError, TypeError, json.JSONDecodeError) as e:
            raise BadResponse(f"neplatná odpověď modelu ({e})") from e
        if len(out) != len(texts):
            raise BadResponse(f"model vrátil {len(out)} úseků místo {len(texts)}")
        return [str(x) for x in out]


def _translation_schema(engine) -> dict:
    if isinstance(engine, GeminiEngine):
        return {"type": "OBJECT", "properties": {"translations": {"type": "ARRAY", "items": {"type": "STRING"}}},
                "required": ["translations"]}
    return {"type": "object", "properties": {"translations": {"type": "array", "items": {"type": "string"}}},
            "required": ["translations"]}


class GeminiEngine(_LLMEngine):
    name = "Google Gemini"
    workers = 1  # bezplatná úroveň má nízký limit požadavků za minutu
    DEFAULT_MODEL = "gemini-2.5-flash"

    def __init__(self, target_lang: str, api_key: str, model: str = "", notes: str = ""):
        super().__init__(target_lang, notes)
        if not api_key:
            raise EngineError("Gemini: chybí API klíč (zdarma na aistudio.google.com → Get API key).")
        self.key = api_key.strip()
        self.model = (model or self.DEFAULT_MODEL).strip()

    def _complete_json(self, system, user_parts, schema):
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": user_parts}],
            "generationConfig": {"responseMimeType": "application/json", "responseSchema": schema},
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{urllib.parse.quote(self.model)}:generateContent"
        data = http_json(url, data=body, headers={"x-goog-api-key": self.key}, service="Gemini", timeout=600,
                         retries=5, backoff=(15, 30, 60, 60, 90))
        cands = data.get("candidates") or []
        if not cands:
            raise BadResponse(f"Gemini nevrátil odpověď ({data.get('promptFeedback', '')})")
        text = "".join(p.get("text", "") for p in cands[0].get("content", {}).get("parts", []))
        return json.loads(text)

    # --- OCR přes Gemini
    def _blocks(self, part: dict) -> list[dict]:
        schema = {"type": "OBJECT", "properties": {"blocks": {"type": "ARRAY", "items": {
            "type": "OBJECT", "properties": {"style": {"type": "STRING", "enum": BLOCK_STYLES},
                                             "text": {"type": "STRING"}}, "required": ["style", "text"]}}},
            "required": ["blocks"]}
        return self._complete_json(OCR_INSTRUCTIONS, [part, {"text": "Zpracuj tento materiál."}], schema)["blocks"]

    def image_blocks(self, path: str, translate: bool = False) -> list[dict]:
        from claude_client import _prepare_image

        media, data = _prepare_image(path)
        return self._blocks({"inline_data": {"mime_type": media, "data": data}})

    def pdf_blocks(self, pdf_bytes: bytes, translate: bool = False) -> list[dict]:
        import base64

        data = base64.standard_b64encode(pdf_bytes).decode("ascii")
        return self._blocks({"inline_data": {"mime_type": "application/pdf", "data": data}})


class OllamaEngine(_LLMEngine):
    name = "Ollama"
    workers = 1
    max_chars = 4000
    max_items = 30
    DEFAULT_MODEL = "gemma3:12b"

    def __init__(self, target_lang: str, url: str = "", model: str = "", notes: str = ""):
        super().__init__(target_lang, notes)
        self.url = (url or "http://localhost:11434").rstrip("/")
        self.model = (model or self.DEFAULT_MODEL).strip()

    def _complete_json(self, system, user_parts, schema):
        body = {
            "model": self.model, "stream": False, "format": schema, "options": {"temperature": 0.2},
            "messages": [{"role": "system", "content": system},
                         {"role": "user", "content": "".join(p.get("text", "") for p in user_parts)}],
        }
        try:
            data = http_json(f"{self.url}/api/chat", data=body, service="Ollama", timeout=1800, retries=1)
        except EngineError as e:
            raise EngineError(f"{e} Běží Ollama a je stažený model „{self.model}“ (ollama pull {self.model})?") from e
        return json.loads(data["message"]["content"])


ENGINE_LABELS = {
    "claude": "Claude API – placený, nejlepší kvalita",
    "deepl": "DeepL API Free – zdarma 500 000 znaků/měsíc",
    "google": "Google Překladač – zdarma, bez klíče",
    "microsoft": "Microsoft Translator – zdarma 2 mil. znaků/měsíc",
    "gemini": "Google Gemini – bezplatná úroveň s limity",
    "ollama": "Ollama – AI v počítači, offline, zdarma",
    "libre": "LibreTranslate – vlastní server, zdarma",
}

OCR_LABELS = {
    "tesseract": "Tesseract – zdarma, offline",
    "gemini": "Google Gemini – bezplatná úroveň",
    "claude": "Claude – placený, nejlepší",
}


# =================================================== obal s dávkováním
class EngineTranslator:
    """Dávkování, paralelní běh a opakování pro libovolný Engine (stejné rozhraní jako ClaudeTranslator)."""

    def __init__(self, engine: Engine, log: Callable[[str], None] = print, cancel_event: threading.Event | None = None):
        self.engine = engine
        self.target_lang = engine.target_lang
        self.workers = engine.workers
        self.log = log
        self.cancel_event = cancel_event or threading.Event()
        self.chars = 0
        self._lock = threading.Lock()

    def _batches(self, texts: list[str]) -> list[list[int]]:
        out, cur, size = [], [], 0
        for i, t in enumerate(texts):
            if cur and (size + len(t) > self.engine.max_chars or len(cur) >= self.engine.max_items):
                out.append(cur)
                cur, size = [], 0
            cur.append(i)
            size += len(t)
        if cur:
            out.append(cur)
        return out

    def _run(self, texts, markup, context) -> list[str]:
        if self.cancel_event.is_set():
            from claude_client import Cancelled
            raise Cancelled()
        try:
            out = self.engine.translate_batch(texts, markup, context)
            with self._lock:
                self.chars += sum(len(t) for t in texts)
            return out
        except BadResponse as e:
            if len(texts) > 1:
                mid = len(texts) // 2
                return self._run(texts[:mid], markup, context) + self._run(texts[mid:], markup, context)
            self.log(f"  ! Úsek se nepodařilo přeložit ({e}), ponechán originál: {texts[0][:60]!r}")
            return texts

    def translate_segments(self, segments, markup, progress=None, context=""):
        result = list(segments)
        todo = [i for i, s in enumerate(segments) if s.strip()]
        if not todo:
            return result
        sub = [segments[i] for i in todo]
        self.log(f"Překládám {len(sub)} úseků přes {self.engine.name} ({sum(len(s) for s in sub):,} znaků)".replace(
            ",", " "))
        batches = self._batches(sub)
        done = 0
        with ThreadPoolExecutor(max_workers=self.workers) as pool:
            for batch, out in pool.map(lambda b: (b, self._run([sub[i] for i in b], markup, context)), batches):
                for local_i, t in zip(batch, out):
                    result[todo[local_i]] = t
                done += 1
                if progress:
                    progress(done / len(batches))
        return result

    def cost_summary(self) -> str:
        s = f"{self.engine.name}: přeloženo {self.chars:,} znaků (zdarma v rámci limitu služby)".replace(",", " ")
        extra = self.engine.usage_info()
        return f"{s}\n{extra}" if extra else s


# ========================================================== Tesseract
def find_tesseract(custom: str | None = None) -> str | None:
    cands = [custom] if custom else []
    cands.append(shutil.which("tesseract"))
    for base in (os.environ.get("ProgramFiles", r"C:\Program Files"), os.environ.get("ProgramFiles(x86)", ""),
                 os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs")):
        if base:
            cands.append(os.path.join(base, "Tesseract-OCR", "tesseract.exe"))
    for c in cands:
        if c and os.path.isfile(c):
            return c
    return None


def text_to_paragraphs(text: str) -> list[str]:
    """Spojí řádky z OCR / PDF do odstavců (a slova rozdělená spojovníkem)."""
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\x0c", "\n\n")
    paragraphs: list[str] = []
    for block in re.split(r"\n\s*\n", text):
        lines = [ln.strip() for ln in block.split("\n") if ln.strip()]
        if not lines:
            continue
        longest = max(len(ln) for ln in lines)
        cur = lines[0]
        for prev, ln in zip(lines, lines[1:]):
            ends_sentence = re.search(r"[.!?…:\"”»]$", prev) is not None
            short = len(prev) < 0.7 * longest
            if ends_sentence and short:
                paragraphs.append(cur)
                cur = ln
            elif cur.endswith("-") and ln[:1].islower():
                cur = cur[:-1] + ln
            else:
                cur = f"{cur} {ln}"
        paragraphs.append(cur)
    return paragraphs


class TesseractOCR:
    workers = 2

    def __init__(self, lang: str = "eng", exe: str | None = None, log: Callable[[str], None] = print):
        self.exe = find_tesseract(exe)
        if not self.exe:
            raise EngineError(
                "Tesseract nebyl nalezen. Nainstalujte ho (https://github.com/UB-Mannheim/tesseract/wiki) "
                "a při instalaci vyberte jazyky, které potřebujete, nebo nastavte cestu k tesseract.exe."
            )
        self.lang = (lang or "eng").strip().replace(",", "+").replace(" ", "")
        self.log = log

    def _ocr_png(self, png_path: str) -> str:
        flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        proc = subprocess.run([self.exe, png_path, "stdout", "-l", self.lang, "--psm", "3"],
                              capture_output=True, creationflags=flags)
        err = proc.stderr.decode("utf-8", errors="replace")
        if proc.returncode != 0:
            if "Failed loading language" in err or "Error opening data file" in err:
                raise EngineError(f"Tesseract nemá nainstalovaný jazyk „{self.lang}“. Doinstalujte ho "
                                  "(instalátor Tesseractu → Additional language data).")
            raise EngineError(f"Tesseract selhal: {err[-500:]}")
        return proc.stdout.decode("utf-8", errors="replace")

    def _ocr_image(self, img) -> str:
        with tempfile.TemporaryDirectory(prefix="prekladac_ocr_") as tmp:
            p = os.path.join(tmp, "page.png")
            img.save(p)
            return self._ocr_png(p)

    def image_blocks(self, path: str, translate: bool = False) -> list[dict]:
        from PIL import Image, ImageOps

        img = ImageOps.exif_transpose(Image.open(path))
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        return [{"style": "paragraph", "text": p} for p in text_to_paragraphs(self._ocr_image(img))]

    def pdf_blocks(self, pdf_bytes: bytes, translate: bool = False) -> list[dict]:
        import pypdfium2 as pdfium

        pdf = pdfium.PdfDocument(pdf_bytes)
        blocks: list[dict] = []
        try:
            for i in range(len(pdf)):
                page = pdf[i]
                text = page.get_textpage().get_text_range()
                if len(text.strip()) < 30:  # stránka bez textové vrstvy → sken → OCR
                    text = self._ocr_image(page.render(scale=300 / 72).to_pil())
                blocks.extend({"style": "paragraph", "text": p} for p in text_to_paragraphs(text))
        finally:
            pdf.close()
        return blocks

    def cost_summary(self) -> str:
        return ""


# ============================================================ pipeline
class Pipeline:
    """Spojí OCR (Tesseract/Gemini/Claude) s libovolným překladačem."""

    def __init__(self, segs, ocr, target_lang: str):
        self.segs = segs  # může být None, když se jen přepisuje text bez překladu
        self.ocr = ocr
        self.target_lang = target_lang
        self.workers = getattr(ocr, "workers", 2) if ocr is not None else getattr(segs, "workers", 2)

    def translate_segments(self, segments, markup, progress=None, context=""):
        if self.segs is None:
            raise EngineError("Není nastaven překladač.")
        return self.segs.translate_segments(segments, markup, progress=progress, context=context)

    def _need_ocr(self):
        if self.ocr is None:
            raise EngineError("Není nastaveno OCR pro obrázky a skeny.")
        return self.ocr

    def _translate_blocks(self, blocks: list[dict]) -> list[dict]:
        pieces, where = [], []
        for bi, b in enumerate(blocks):
            cells = b["text"].split(" | ") if b["style"] == "table_row" else [b["text"]]
            for ci, c in enumerate(cells):
                pieces.append(c)
                where.append((bi, ci, len(cells)))
        out = self.translate_segments(pieces, markup=False)
        rows: dict[int, list[str]] = {}
        for (bi, ci, n), t in zip(where, out):
            rows.setdefault(bi, [""] * n)[ci] = t
        return [{"style": b["style"], "text": " | ".join(rows.get(bi, [b["text"]]))} for bi, b in enumerate(blocks)]

    def image_blocks(self, path: str, translate: bool) -> list[dict]:
        blocks = self._need_ocr().image_blocks(path, False)
        return self._translate_blocks(blocks) if translate else blocks

    def pdf_blocks(self, pdf_bytes: bytes, translate: bool) -> list[dict]:
        blocks = self._need_ocr().pdf_blocks(pdf_bytes, False)
        return self._translate_blocks(blocks) if translate else blocks

    def cost_summary(self) -> str:
        parts = []
        for obj in (self.segs, self.ocr):
            if obj is not None and hasattr(obj, "cost_summary"):
                s = obj.cost_summary()
                if s and s not in parts:
                    parts.append(s)
        return "\n".join(parts)
