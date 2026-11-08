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
import ssl
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
_SSL_CONTEXTS: list | None = None


def ssl_contexts() -> list:
    """Způsoby ověření certifikátů, od nejlepšího: úložiště Windows (truststore), sada certifi, výchozí Python.

    Python v .exe jinak nevidí kořenové certifikáty, které si Windows stahují až při potřebě,
    ani certifikát antiviru, který kontroluje HTTPS – stahování pak končí CERTIFICATE_VERIFY_FAILED.
    """
    global _SSL_CONTEXTS
    if _SSL_CONTEXTS is None:
        ctxs = []
        if os.environ.get("SSL_CERT_FILE"):
            ctxs.append(ssl.create_default_context())
        try:
            import truststore

            ctxs.append(truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT))
        except Exception:
            pass
        try:
            import certifi

            ctxs.append(ssl.create_default_context(cafile=certifi.where()))
        except Exception:
            pass
        ctxs.append(ssl.create_default_context())
        _SSL_CONTEXTS = ctxs
    return _SSL_CONTEXTS


def _is_cert_error(e: BaseException) -> bool:
    reason = getattr(e, "reason", e)
    return isinstance(reason, ssl.SSLCertVerificationError) or "CERTIFICATE_VERIFY_FAILED" in str(reason)


def http_request(url: str, *, data=None, headers: dict | None = None, method: str | None = None,
                 timeout: float = 120, retries: int = 4, backoff: tuple = (3, 8, 20, 45), service: str = "",
                 cafile: str | None = None) -> bytes:
    """HTTP požadavek s opakováním při přetížení (429/5xx) a výpadku spojení."""
    hdrs = {"User-Agent": USER_AGENT}
    hdrs.update(headers or {})
    if isinstance(data, (dict, list)):
        data = json.dumps(data, ensure_ascii=False).encode("utf-8")
        hdrs.setdefault("Content-Type", "application/json")
    last = None
    ctxs = ssl_contexts()
    if cafile:  # server s vlastním kořenovým certifikátem (např. rejstřík pluginů Calibre)
        ctxs = [ssl.create_default_context(cafile=cafile)] + ctxs
    ctx_i = 0
    attempt = 0
    while attempt <= retries:
        req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=ctxs[ctx_i]) as resp:
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
            if _is_cert_error(e):
                if ctx_i + 1 < len(ctxs):
                    ctx_i += 1  # zkusit jiný způsob ověření certifikátu, bez čekání a bez započtení pokusu
                    continue
                raise EngineError(
                    f"{service}: nepodařilo se ověřit certifikát serveru ({getattr(e, 'reason', e)}). "
                    "Častou příčinou je antivirus, který kontroluje HTTPS spojení, nebo firemní proxy. "
                    "Zkuste v antiviru vypnout kontrolu HTTPS pro Prekladac.exe."
                ) from e
            last = str(getattr(e, "reason", e))
            delay = backoff[min(attempt, len(backoff) - 1)]
        attempt += 1
        if attempt <= retries:
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


class MicrosoftDocumentTranslator:
    """Druhé API Azure Translatoru: přeloží celý soubor najednou a zachová jeho vzhled (synchronní režim)."""

    API_VERSION = "2024-05-01"
    MAX_BYTES = 10 * 1024 * 1024
    CONTENT_TYPES = {
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".html": "text/html",
        ".htm": "text/html",
        ".odt": "application/vnd.oasis.opendocument.text",
        ".rtf": "application/rtf",
        ".md": "text/markdown",
    }
    SUPPORTED = set(CONTENT_TYPES)

    def __init__(self, target_lang: str, api_key: str, endpoint: str):
        if not api_key:
            raise EngineError("Microsoft: chybí klíč (Azure → Translator → Klíče a koncový bod).")
        if not endpoint:
            raise EngineError("Microsoft – překlad dokumentů: chybí adresa „Překlad dokumentu“ "
                              "(Azure → Translator → Klíče a koncový bod, např. https://nazev.cognitiveservices.azure.com/).")
        endpoint = endpoint.strip().rstrip("/")
        if not endpoint.startswith("https://"):
            endpoint = "https://" + endpoint.split("://")[-1]
        self.endpoint = endpoint
        self.key = re.sub(r"\s+", "", api_key)
        self.iso, _ = lang_codes(target_lang)
        self.target_lang = target_lang
        self.chars_files = 0

    def translate_document(self, src: str, dst: str, log: Callable[[str], None] = print) -> None:
        ext = os.path.splitext(src)[1].lower()
        data = open(src, "rb").read()
        if len(data) > self.MAX_BYTES:
            raise EngineError("Microsoft – překlad dokumentů: soubor je větší než 10 MB.")
        boundary = "----Prekladac" + os.urandom(8).hex()
        name = os.path.basename(src).replace('"', "")
        body = (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"document\"; filename=\"{name}\"\r\n"
            f"Content-Type: {self.CONTENT_TYPES[ext]}\r\n\r\n"
        ).encode("utf-8") + data + f"\r\n--{boundary}--\r\n".encode("ascii")
        params = urllib.parse.urlencode({"targetLanguage": self.iso, "api-version": self.API_VERSION})
        log("  Microsoft: překládám celý dokument…")
        result = http_request(
            f"{self.endpoint}/translator/document:translate?{params}", data=body, timeout=900,
            headers={"Ocp-Apim-Subscription-Key": self.key,
                     "Content-Type": f"multipart/form-data; boundary={boundary}"},
            service="Microsoft – překlad dokumentů",
        )
        if not result:
            raise EngineError("Microsoft – překlad dokumentů: služba vrátila prázdný soubor.")
        with open(dst, "wb") as f:
            f.write(result)
        self.chars_files += 1

    def cost_summary(self) -> str:
        return f"Microsoft – překlad dokumentů: přeloženo souborů: {self.chars_files}" if self.chars_files else ""


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
        # LibreTranslate u HTML někdy přidá na začátek odrážku „• “, která v originále není
        return [re.sub(r"^\s*•\s*", "", t) if not src.lstrip().startswith("•") else t for src, t in zip(texts, out)]


class _LLMEngine(Engine):
    max_chars = 8000
    max_items = 60
    uses_notes = True

    def __init__(self, target_lang: str, notes: str = ""):
        super().__init__(target_lang)
        self.notes = notes.strip()
        self.tokens_in = 0
        self.tokens_out = 0
        self._usage_lock = threading.Lock()

    def _add_usage(self, tokens_in, tokens_out) -> None:
        with self._usage_lock:
            self.tokens_in += int(tokens_in or 0)
            self.tokens_out += int(tokens_out or 0)

    def usage_info(self) -> str:
        if not (self.tokens_in or self.tokens_out):
            return ""
        return f"{self.name}: {self.tokens_in:,} vstupních + {self.tokens_out:,} výstupních tokenů".replace(",", " ")

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
    return {"type": "object", "properties": {"translations": {"type": "array", "items": {"type": "string"}}},
            "required": ["translations"]}


def to_gemini_schema(schema: dict) -> dict:
    """JSON Schema → formát responseSchema pro Gemini (typy velkými písmeny, bez additionalProperties)."""
    if not isinstance(schema, dict):
        return schema
    out = {}
    for k, v in schema.items():
        if k == "additionalProperties":
            continue
        if k == "type" and isinstance(v, str):
            out[k] = v.upper()
        elif k == "properties":
            out[k] = {name: to_gemini_schema(sub) for name, sub in v.items()}
        elif k == "items":
            out[k] = to_gemini_schema(v)
        else:
            out[k] = v
    return out


class GeminiEngine(_LLMEngine):
    name = "Google Gemini"
    workers = 1  # bezplatná úroveň má nízký limit požadavků za minutu
    DEFAULT_MODEL = "gemini-3.8-flash"

    def __init__(self, target_lang: str, api_key: str, model: str = "", notes: str = ""):
        super().__init__(target_lang, notes)
        if not api_key:
            raise EngineError("Gemini: chybí API klíč (zdarma na aistudio.google.com → Get API key).")
        self.key = api_key.strip()
        self.model = (model or self.DEFAULT_MODEL).strip()

    def _complete_json(self, system, user_parts, schema, max_tokens: int | None = None, temperature=None):
        config = {"responseMimeType": "application/json", "responseSchema": to_gemini_schema(schema)}
        if max_tokens:
            config["maxOutputTokens"] = max_tokens
        if temperature is not None:
            config["temperature"] = temperature
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": user_parts}],
            "generationConfig": config,
        }
        data = self._generate(body)
        cands = data.get("candidates") or []
        if not cands:
            raise BadResponse(f"Gemini nevrátil odpověď ({data.get('promptFeedback', '')})")
        meta = data.get("usageMetadata", {})
        self._add_usage(meta.get("promptTokenCount"), meta.get("candidatesTokenCount"))
        if cands[0].get("finishReason") == "MAX_TOKENS":
            raise BadResponse("Gemini: odpověď byla useknuta (příliš dlouhá)")
        text = "".join(p.get("text", "") for p in cands[0].get("content", {}).get("parts", []))
        return json.loads(text)

    _REPLACEMENT_RE = re.compile(r"use models/([\w.\-]+)")

    def _generate(self, body: dict) -> dict:
        """generateContent; když Google model vyřadil a v chybě doporučí nástupce, přejde na něj sám."""
        for attempt in range(2):
            url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
                   f"{urllib.parse.quote(self.model)}:generateContent")
            try:
                return http_json(url, data=body, headers={"x-goog-api-key": self.key}, service="Gemini",
                                 timeout=600, retries=5, backoff=(15, 30, 60, 60, 90))
            except EngineError as e:
                m = self._REPLACEMENT_RE.search(str(e)) if "HTTP 404" in str(e) else None
                if attempt or not m or m.group(1) == self.model:
                    raise
                self.model = m.group(1)
        raise AssertionError("unreachable")

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

    def _complete_json(self, system, user_parts, schema, max_tokens: int | None = None, temperature=None):
        # Ollama má výchozí kontext jen pár tisíc tokenů – delší zadání by bez num_ctx tiše ořízla
        options = {"temperature": 0.2 if temperature is None else temperature,
                   "num_ctx": 32768 if max_tokens else 16384}
        if max_tokens:
            options["num_predict"] = max_tokens
        body = {
            "model": self.model, "stream": False, "format": schema, "options": options,
            "messages": [{"role": "system", "content": system},
                         {"role": "user", "content": "".join(p.get("text", "") for p in user_parts)}],
        }
        try:
            data = http_json(f"{self.url}/api/chat", data=body, service="Ollama", timeout=1800, retries=1)
        except EngineError as e:
            raise EngineError(f"{e} Běží Ollama a je stažený model „{self.model}“ (ollama pull {self.model})?") from e
        self._add_usage(data.get("prompt_eval_count"), data.get("eval_count"))
        return json.loads(data["message"]["content"])


class OpenAICompatEngine(_LLMEngine):
    """Služby s rozhraním kompatibilním s OpenAI: OpenAI, DeepSeek, Mistral, OpenRouter, Groq…"""

    name = "OpenAI-kompatibilní"
    workers = 2
    PRESETS = {
        "OpenAI": "https://api.openai.com/v1",
        "DeepSeek": "https://api.deepseek.com/v1",
        "Mistral": "https://api.mistral.ai/v1",
        "OpenRouter": "https://openrouter.ai/api/v1",
        "Groq": "https://api.groq.com/openai/v1",
    }
    # Klíče, podle kterých jde poznat službu (DeepSeek i OpenAI mají obojí „sk-…“, ty poznat nejdou).
    KEY_PREFIXES = {"sk-or-": "OpenRouter", "gsk_": "Groq"}

    @classmethod
    def provider_for_key(cls, api_key: str) -> str | None:
        key = (api_key or "").strip()
        return next((n for p, n in cls.KEY_PREFIXES.items() if key.startswith(p)), None)

    def __init__(self, target_lang: str, url: str, api_key: str, model: str, notes: str = ""):
        super().__init__(target_lang, notes)
        self.key = (api_key or "").strip()
        url = (url or "").strip().rstrip("/")
        if url.endswith("/chat/completions"):
            url = url[: -len("/chat/completions")]
        detected = self.provider_for_key(self.key)
        # Prázdná adresa nebo výchozí adresa OpenAI s klíčem jiné služby → použij adresu té služby.
        if detected and (not url or url == self.PRESETS["OpenAI"]):
            url = self.PRESETS[detected]
        self.url = url or self.PRESETS["OpenAI"]
        self.model = (model or "").strip()
        if not self.model:
            raise EngineError("OpenAI-kompatibilní služba: zadejte v Nastavení název modelu (např. deepseek-chat).")
        if not self.key and "localhost" not in self.url and "127.0.0.1" not in self.url:
            raise EngineError("OpenAI-kompatibilní služba: chybí API klíč.")
        host = urllib.parse.urlparse(self.url).hostname or ""
        self.name = next((n for n, u in self.PRESETS.items() if host and host in u), host or self.name)

    def key_hint(self) -> str:
        detected = self.provider_for_key(self.key)
        if detected and detected != self.name:
            return (f"Klíč vypadá jako klíč služby {detected}, ale posílá se na {self.name}. "
                    f"V Nastavení vyplňte Adresu API: {self.PRESETS[detected]}")
        return (f"Zkontrolujte, že klíč patří službě {self.name} ({self.url}). Klíč z jiné služby "
                "(např. OpenRouter, DeepSeek) vyžaduje i její Adresu API – viz tlačítko Návod.")

    def _complete_json(self, system, user_parts, schema, max_tokens: int | None = None, temperature=None):
        user = "".join(p.get("text", "") for p in user_parts)
        user += ("\n\nOdpověz pouze platným JSON objektem (bez dalšího textu) přesně podle tohoto JSON Schema:\n"
                 + json.dumps(schema, ensure_ascii=False))
        body = {"model": self.model, "response_format": {"type": "json_object"},
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}
        # Bez limitu si OpenRouter dosadí maximum modelu (např. 16 384 tokenů) a předem na ně chce kredit.
        # Odpověď (překlad) je zhruba stejně dlouhá jako vstup: 1 token ≈ 2–3 znaky češtiny + rezerva.
        body["max_tokens"] = max_tokens or min(16384, max(1024, len(user) // 2 + 1024))
        if temperature is not None:
            body["temperature"] = temperature
        headers = {"Authorization": f"Bearer {self.key}"} if self.key else {}
        try:
            data = http_json(f"{self.url}/chat/completions", data=body, headers=headers, service=self.name,
                             timeout=900, retries=4, backoff=(10, 20, 40, 60))
        except EngineError as e:
            if "HTTP 401" in str(e):
                raise EngineError(f"{e}\n\n{self.key_hint()}") from e
            if "HTTP 402" in str(e):
                raise EngineError(
                    f"{self.name}: na účtu není dost kreditu pro model „{self.model}“ (HTTP 402).\n\n"
                    "Model je placený. Buď v Nastavení zadejte model zdarma – u OpenRouteru končí na „:free“ "
                    "(openrouter.ai/models → filtr Prompt pricing: FREE) –, nebo si dobijte kredit.") from e
            raise
        usage = data.get("usage") or {}
        self._add_usage(usage.get("prompt_tokens"), usage.get("completion_tokens"))
        choice = (data.get("choices") or [{}])[0]
        if choice.get("finish_reason") == "length":
            raise BadResponse(f"{self.name}: odpověď byla useknuta (příliš dlouhá)")
        content = (choice.get("message") or {}).get("content") or ""
        content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
        return json.loads(content)


ENGINE_LABELS = {
    "claude": "Claude API – placený, nejlepší kvalita",
    "deepl": "DeepL API Free – zdarma 500 000 znaků/měsíc",
    "google": "Google Překladač – zdarma, bez klíče",
    "microsoft": "Microsoft Translator – zdarma 2 mil. znaků/měsíc",
    "microsoft_doc": "Microsoft – překlad celých dokumentů se zachováním vzhledu (DOCX, PDF, PPTX…)",
    "gemini": "Google Gemini – bezplatná úroveň s limity",
    "ollama": "Ollama – AI v počítači, offline, zdarma",
    "openai": "OpenAI-kompatibilní – OpenAI, DeepSeek, Mistral, OpenRouter, Groq…",
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
    from components import bundled_exe

    cands.append(bundled_exe("Tesseract-OCR", "tesseract"))  # přibalený k programu
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
                "Tesseract nebyl nalezen. Nainstalujte ho v programu: Nastavení → Součásti → Nainstalovat Tesseract "
                "(nebo ručně z https://github.com/UB-Mannheim/tesseract/releases)."
            )
        self.lang = (lang or "eng").strip().replace(",", "+").replace(" ", "")
        self.log = log
        self._tessdata: str | None = None
        self._prepared = False
        self._lock = threading.Lock()

    def _prepare(self):
        """Chybějící jazyky stáhne do složky programu (jen jednou)."""
        with self._lock:
            if self._prepared:
                return
            from components import ensure_ocr_languages

            folder = ensure_ocr_languages(self.lang.split("+"), self.exe, self.log)
            self._tessdata = str(folder) if folder else None
            self._prepared = True

    def _ocr_png(self, png_path: str) -> str:
        self._prepare()
        flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        cmd = [self.exe, png_path, "stdout", "-l", self.lang, "--psm", "3"]
        if self._tessdata:
            cmd += ["--tessdata-dir", self._tessdata]
        proc = subprocess.run(cmd, capture_output=True, creationflags=flags)
        err = proc.stderr.decode("utf-8", errors="replace")
        if proc.returncode != 0:
            if "Failed loading language" in err or "Error opening data file" in err:
                raise EngineError(f"Tesseract nemá jazyk „{self.lang}“. Stáhněte ho v Nastavení → Součásti.")
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

    def __init__(self, segs, ocr, target_lang: str, document_translator=None):
        self.segs = segs  # může být None, když se jen přepisuje text bez překladu
        self.ocr = ocr
        self.document_translator = document_translator  # celé soubory (Microsoft), jinak None
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
        for obj in (self.document_translator, self.segs, self.ocr):
            if obj is not None and hasattr(obj, "cost_summary"):
                s = obj.cost_summary()
                if s and s not in parts:
                    parts.append(s)
        return "\n".join(parts)
