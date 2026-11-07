"""Komunikace s Claude API: překlad textových úseků a přepis (OCR) obrázků / PDF."""

from __future__ import annotations

import base64
import io
import json
import threading
from concurrent.futures import ThreadPoolExecutor
from typing import Callable

import anthropic

# Zobrazovaný název -> ID modelu
MODELS = {
    "Claude Opus 5.5 (nejlepší kvalita)": "claude-opus-5-5",
    "Claude Sonnet 5.5 (levnější, rychlejší)": "claude-sonnet-5-5",
    "Claude Haiku 5.5 (nejlevnější)": "claude-haiku-5-5",
}
DEFAULT_MODEL = "claude-opus-5-5"

# Orientační ceny v USD za 1 milion tokenů (vstup, výstup)
PRICES = {
    "claude-opus-5-5": (4.0, 20.0),
    "claude-sonnet-5-5": (2.0, 10.0),
    "claude-haiku-5-5": (0.10, 0.50),
}

# Modely, u kterých lze zapnout serverový fallback při odmítnutí požadavku
FALLBACK_MODELS = {"claude-opus-5-5", "claude-sonnet-5-5"}
FALLBACK_BETA = "server-side-fallback-2026-07-01"

MAX_BATCH_CHARS = 8000
MAX_BATCH_SEGMENTS = 60
MAX_IMAGE_EDGE = 2576
MAX_IMAGE_BYTES = 4_500_000

BLOCK_STYLES = ["heading1", "heading2", "heading3", "paragraph", "bullet", "numbered", "table_row"]

TRANSLATION_SCHEMA = {
    "type": "object",
    "properties": {"translations": {"type": "array", "items": {"type": "string"}}},
    "required": ["translations"],
    "additionalProperties": False,
}

BLOCKS_SCHEMA = {
    "type": "object",
    "properties": {
        "blocks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "style": {"type": "string", "enum": BLOCK_STYLES},
                    "text": {"type": "string"},
                },
                "required": ["style", "text"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["blocks"],
    "additionalProperties": False,
}


class Cancelled(Exception):
    """Uživatel zastavil zpracování."""


class ModelError(Exception):
    """Model nevrátil použitelnou odpověď (odmítnutí, useknutí, špatný počet úseků)."""


def _n(x: int) -> str:
    return f"{x:,}".replace(",", " ")


def _batches(segments: list[str]) -> list[list[int]]:
    """Rozdělí indexy úseků do dávek podle počtu znaků."""
    batches: list[list[int]] = []
    current: list[int] = []
    size = 0
    for i, seg in enumerate(segments):
        if current and (size + len(seg) > MAX_BATCH_CHARS or len(current) >= MAX_BATCH_SEGMENTS):
            batches.append(current)
            current, size = [], 0
        current.append(i)
        size += len(seg)
    if current:
        batches.append(current)
    return batches


def _prepare_image(path: str) -> tuple[str, str]:
    """Načte obrázek, případně ho zmenší, a vrátí (media_type, base64)."""
    from PIL import Image, ImageOps

    with open(path, "rb") as f:
        raw = f.read()
    img = Image.open(io.BytesIO(raw))
    img = ImageOps.exif_transpose(img)
    fmt = (img.format or "").upper()
    ok_format = fmt in {"JPEG", "PNG", "WEBP", "GIF"}
    if ok_format and max(img.size) <= MAX_IMAGE_EDGE and len(raw) <= MAX_IMAGE_BYTES:
        media = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp", "GIF": "image/gif"}[fmt]
        return media, base64.standard_b64encode(raw).decode("ascii")

    img.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    quality = 90
    while True:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality)
        if buf.tell() <= MAX_IMAGE_BYTES or quality <= 40:
            break
        quality -= 10
    return "image/jpeg", base64.standard_b64encode(buf.getvalue()).decode("ascii")


class ClaudeTranslator:
    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
        target_lang: str = "čeština",
        notes: str = "",
        workers: int = 4,
        effort: str = "medium",
        log: Callable[[str], None] = print,
        cancel_event: threading.Event | None = None,
    ):
        # Bez api_key si SDK vezme ANTHROPIC_API_KEY z prostředí.
        self.client = anthropic.Anthropic(api_key=api_key or None, max_retries=4)
        self.model = model
        self.target_lang = target_lang
        self.notes = notes.strip()
        self.workers = max(1, workers)
        self.effort = effort
        self.log = log
        self.cancel_event = cancel_event or threading.Event()
        self.usage_in = 0
        self.usage_out = 0
        self.usage_cache_write = 0
        self.usage_cache_read = 0
        self._lock = threading.Lock()

    # ------------------------------------------------------------------ API
    def _call(self, system, content: list[dict], schema: dict, max_tokens: int = 32000) -> dict:
        """system = text nebo seznam bloků (lze s cache_control pro opakovaně posílaný začátek)."""
        if self.cancel_event.is_set():
            raise Cancelled()
        kwargs: dict = dict(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": content}],
            output_config={"effort": self.effort, "format": {"type": "json_schema", "schema": schema}},
        )
        if self.model in FALLBACK_MODELS:
            kwargs["betas"] = [FALLBACK_BETA]
            kwargs["fallbacks"] = "default"
        with self.client.beta.messages.stream(**kwargs) as stream:
            message = stream.get_final_message()

        with self._lock:
            self.usage_in += message.usage.input_tokens or 0
            self.usage_out += message.usage.output_tokens or 0
            self.usage_cache_write += getattr(message.usage, "cache_creation_input_tokens", 0) or 0
            self.usage_cache_read += getattr(message.usage, "cache_read_input_tokens", 0) or 0

        if message.stop_reason == "refusal":
            raise ModelError("model požadavek odmítl")
        if message.stop_reason == "max_tokens":
            raise ModelError("odpověď byla příliš dlouhá a byla useknuta")
        text = next((b.text for b in message.content if b.type == "text"), None)
        if text is None:
            raise ModelError("odpověď neobsahuje text")
        return json.loads(text)

    def _system(self, extra: str) -> str:
        s = (
            f"Jsi profesionální literární překladatel. Překládáš do jazyka: {self.target_lang}. "
            "Překládej věrně, přirozeně a stylisticky dobře, jako by text původně vznikl v cílovém jazyce. "
            "Zachovej význam, tón, jména a odstavce. Nic nevynechávej, nepřidávej komentáře ani vysvětlivky. "
            "Pokud je úsek už v cílovém jazyce, nebo jde jen o čísla či značky, vrať ho beze změny. "
            + extra
        )
        if self.notes:
            s += f"\n\nPokyny od uživatele (glosář, styl):\n{self.notes}"
        return s

    # ------------------------------------------------------------ překlad
    def estimate(self, segments: list[str]) -> str:
        chars = sum(len(s) for s in segments)
        tokens = chars / 3.2
        p_in, p_out = PRICES.get(self.model, (4.0, 20.0))
        # výstup ~ stejně dlouhý jako vstup + rezerva na přemýšlení modelu
        cost = tokens * p_in / 1e6 + tokens * 1.6 * p_out / 1e6
        return f"{_n(chars)} znaků, odhad ~{_n(int(tokens))} tokenů, orientačně ${cost:.2f}"

    def translate_segments(
        self,
        segments: list[str],
        markup: bool,
        progress: Callable[[float], None] | None = None,
        context: str = "",
    ) -> list[str]:
        """Přeloží seznam úseků. markup=True: úseky jsou HTML fragmenty (zachovat značky)."""
        result = list(segments)
        todo = [i for i, s in enumerate(segments) if s.strip()]
        if not todo:
            return result
        sub = [segments[i] for i in todo]
        self.log(f"Překládám {len(sub)} úseků: {self.estimate(sub)}")
        batches = _batches(sub)
        done = 0

        def work(batch: list[int]) -> tuple[list[int], list[str]]:
            texts = [sub[i] for i in batch]
            return batch, self._translate_batch(texts, markup, context)

        with ThreadPoolExecutor(max_workers=self.workers) as pool:
            for batch, translated in pool.map(work, batches):
                for local_i, t in zip(batch, translated):
                    result[todo[local_i]] = t
                done += 1
                if progress:
                    progress(done / len(batches))
        return result

    def _translate_batch(self, texts: list[str], markup: bool, context: str) -> list[str]:
        if markup:
            extra = (
                "Každý úsek je fragment HTML/XHTML. Překládej pouze text; všechny značky (<b>, <i>, <a ...>, "
                "<span ...>, <br/> atd.) včetně atributů zachovej přesně, ve stejném počtu a správně vnořené. "
                "Entity jako &amp; ponech platné."
            )
        else:
            extra = "Úseky jsou prostý text; zachovej zalomení řádků uvnitř úseku."
        if context:
            extra += f" Kontext: {context}"
        extra += (
            " Dostaneš JSON se seznamem 'segments'. Vrať JSON {\"translations\": [...]} se stejným počtem "
            "položek ve stejném pořadí – i-tá položka je překlad i-tého úseku."
        )
        payload = json.dumps({"segments": texts}, ensure_ascii=False)
        try:
            data = self._call(self._system(extra), [{"type": "text", "text": payload}], TRANSLATION_SCHEMA)
            out = data["translations"]
            if len(out) != len(texts):
                raise ModelError(f"vrácen špatný počet úseků ({len(out)} místo {len(texts)})")
            return out
        except (ModelError, json.JSONDecodeError, KeyError) as e:
            if len(texts) > 1:
                mid = len(texts) // 2
                return self._translate_batch(texts[:mid], markup, context) + self._translate_batch(
                    texts[mid:], markup, context
                )
            self.log(f"  ! Úsek se nepodařilo přeložit ({e}), ponechán originál: {texts[0][:60]!r}")
            return texts

    # ------------------------------------------------------- OCR / PDF
    def _blocks_system(self, translate: bool) -> str:
        task = (
            f"Přepiš veškerý text z dodaného materiálu a zároveň ho přelož do jazyka: {self.target_lang}."
            if translate
            else "Přepiš veškerý text z dodaného materiálu přesně v původním jazyce (bez překladu)."
        )
        s = (
            f"{task} Postupuj v přirozeném pořadí čtení (sloupce zleva doprava). Vynech čísla stránek, "
            "opakující se záhlaví/zápatí a dělení slov na konci řádků (spoj je). Řádky jednoho odstavce spoj "
            "do jednoho bloku. Vrať JSON se seznamem bloků; style je jeden z: heading1, heading2, heading3, "
            "paragraph, bullet (odrážka), numbered (číslovaný bod), table_row (řádek tabulky, buňky oddělené "
            "' | '). U odrážek a číslování nevkládej samotnou značku do textu. Nepřidávej žádné komentáře."
        )
        if translate:
            s += " Překlad ať je přirozený a stylisticky dobrý."
            if self.notes:
                s += f"\n\nPokyny od uživatele (glosář, styl):\n{self.notes}"
        return s

    def image_blocks(self, path: str, translate: bool) -> list[dict]:
        media, data = _prepare_image(path)
        content = [
            {"type": "image", "source": {"type": "base64", "media_type": media, "data": data}},
            {"type": "text", "text": "Zpracuj tento obrázek."},
        ]
        return self._call(self._blocks_system(translate), content, BLOCKS_SCHEMA)["blocks"]

    def pdf_blocks(self, pdf_bytes: bytes, translate: bool) -> list[dict]:
        data = base64.standard_b64encode(pdf_bytes).decode("ascii")
        content = [
            {"type": "document", "source": {"type": "base64", "media_type": "application/pdf", "data": data}},
            {"type": "text", "text": "Zpracuj tyto stránky PDF."},
        ]
        return self._call(self._blocks_system(translate), content, BLOCKS_SCHEMA)["blocks"]

    def cost_summary(self) -> str:
        p_in, p_out = PRICES.get(self.model, (4.0, 20.0))
        cost = (self.usage_in + 1.25 * self.usage_cache_write + 0.1 * self.usage_cache_read) * p_in / 1e6 \
            + self.usage_out * p_out / 1e6
        total_in = self.usage_in + self.usage_cache_write + self.usage_cache_read
        return f"Spotřeba: {_n(total_in)} vstupních + {_n(self.usage_out)} výstupních tokenů ≈ ${cost:.2f}"
