"""Testy bezplatných překladačů – síťová volání jsou podvržená (kromě volitelného živého testu Googlu)."""

import json
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import free_engines as fe  # noqa: E402
from free_engines import (  # noqa: E402
    BadResponse, DeepLEngine, EngineError, EngineTranslator, GeminiEngine, GoogleFreeEngine, LibreTranslateEngine,
    MicrosoftEngine, OllamaEngine, Pipeline, protect_tags, restore_tags, text_to_paragraphs,
)


class FakeHTTP:
    """Nahrazuje fe.http_json; zaznamená požadavek a vrátí odpověď z funkce."""

    def __init__(self, responder):
        self.responder = responder
        self.calls = []

    def __call__(self, url, **kw):
        self.calls.append((url, kw))
        return self.responder(url, kw)


def test_protect_restore_roundtrip():
    plain, tags = protect_tags('Hello <em class="x">dear</em> reader &amp; friend<br/>bye')
    assert plain == "Hello {{0}}dear{{1}} reader & friend{{2}}bye"
    translated = "Ahoj {{0}}milý{{1}} čtenáři & příteli{{2}}sbohem"
    assert restore_tags(translated, tags) == 'Ahoj <em class="x">milý</em> čtenáři &amp; příteli<br/>sbohem'
    # Google občas přidá mezery do zástupného symbolu
    assert restore_tags("Ahoj { {0} }milý{{1}}{{2}}", tags) == 'Ahoj <em class="x">milý</em><br/>'


def test_restore_bad_nesting_falls_back_to_text():
    _, tags = protect_tags("<b>a</b> <i>b</i>")
    assert restore_tags("{{1}}a{{0}} {{2}}b{{3}}", tags) == "a b"
    assert restore_tags("chybí značky", tags) == "chybí značky"


def test_text_to_paragraphs():
    text = ("This is a long line of text that goes on and\ncontinues on the next line of the page.\nEnds here.\n"
            "A new paragraph starts on this line.\n\nNext para-\ngraph here.")
    assert text_to_paragraphs(text) == [
        "This is a long line of text that goes on and continues on the next line of the page. Ends here.",
        "A new paragraph starts on this line.",
        "Next paragraph here.",
    ]


def test_deepl(monkeypatch):
    def resp(url, kw):
        body = json.loads(kw["data"]) if isinstance(kw["data"], (bytes, str)) else kw["data"]
        return {"translations": [{"text": t.upper()} for t in body["text"]]}

    fake = FakeHTTP(resp)
    monkeypatch.setattr(fe, "http_json", fake)
    eng = DeepLEngine("čeština", "abc:fx")
    assert eng.translate_batch(["<b>a</b>", "b"], True, "ctx") == ["<B>A</B>", "B"]
    url, kw = fake.calls[0]
    assert url == "https://api-free.deepl.com/v2/translate"
    assert kw["headers"]["Authorization"] == "DeepL-Auth-Key abc:fx"
    assert kw["data"]["target_lang"] == "CS" and kw["data"]["tag_handling"] == "html"
    assert kw["data"]["context"] == "ctx"
    assert DeepLEngine("angličtina", "pro-key").base == "https://api.deepl.com/v2"
    with pytest.raises(EngineError):
        DeepLEngine("čeština", "")


def test_google_batching(monkeypatch):
    sent = []

    def resp(url, kw):
        q = __import__("urllib.parse").parse.parse_qs(kw["data"].decode())["q"][0]
        sent.append(q)
        return [[[q.upper(), q]]]

    monkeypatch.setattr(fe, "http_json", FakeHTTP(resp))
    monkeypatch.setattr(fe.time, "sleep", lambda s: None)
    eng = GoogleFreeEngine("čeština")
    out = eng.translate_batch(["Hello <i>you</i>", "World &amp; co"], True, "")
    assert out == ["HELLO <i>YOU</i>", "WORLD &amp; CO"]
    assert sent == ["Hello {{0}}you{{1}}\nWorld & co"]  # jeden požadavek pro obě věty
    sent.clear()
    assert eng.translate_batch(["a\nb", "c"], False, "") == ["A\nB", "C"]
    assert len(sent) == 2  # víceřádkové úseky jdou zvlášť


def test_microsoft_libre(monkeypatch):
    fake = FakeHTTP(lambda url, kw: [{"translations": [{"text": t["Text"] + "!"}]} for t in kw["data"]])
    monkeypatch.setattr(fe, "http_json", fake)
    assert MicrosoftEngine("čeština", "k", "westeurope").translate_batch(["a", "b"], True, "") == ["a!", "b!"]
    url, kw = fake.calls[0]
    assert "to=cs" in url and "textType=html" in url
    assert kw["headers"]["Ocp-Apim-Subscription-Region"] == "westeurope"

    assert MicrosoftEngine.normalize_region("West Europe") == "westeurope"
    assert MicrosoftEngine.normalize_region("Global") == ""
    assert MicrosoftEngine("čeština", " ab c ").key == "abc"

    def unauthorized(url, **kw):
        raise EngineError("Microsoft Translator: neplatný nebo chybějící klíč (HTTP 401).")

    monkeypatch.setattr(fe, "http_json", unauthorized)
    with pytest.raises(EngineError, match="Location/Region"):
        MicrosoftEngine("čeština", "k", "West Europe").translate_batch(["a"], False, "")

    fake2 = FakeHTTP(lambda url, kw: {"translatedText": [t + "?" for t in kw["data"]["q"]]})
    monkeypatch.setattr(fe, "http_json", fake2)
    assert LibreTranslateEngine("čeština", "http://x:5000/").translate_batch(["a"], False, "") == ["a?"]
    assert fake2.calls[0][0] == "http://x:5000/translate"


def test_gemini_and_ollama(monkeypatch):
    def gem(url, kw):
        segs = json.loads(kw["data"]["contents"][0]["parts"][0]["text"])["segments"]
        text = json.dumps({"translations": [s + " CZ" for s in segs]})
        return {"candidates": [{"content": {"parts": [{"text": text}]}}]}

    fake = FakeHTTP(gem)
    monkeypatch.setattr(fe, "http_json", fake)
    g = GeminiEngine("čeština", "key", notes="jména nepřekládej")
    assert g.translate_batch(["a", "b"], False, "") == ["a CZ", "b CZ"]
    url, kw = fake.calls[0]
    assert url.endswith("/models/gemini-2.5-flash:generateContent")
    assert kw["headers"]["x-goog-api-key"] == "key"
    assert "jména nepřekládej" in kw["data"]["systemInstruction"]["parts"][0]["text"]

    def oll(url, kw):
        segs = json.loads(kw["data"]["messages"][1]["content"])["segments"]
        return {"message": {"content": json.dumps({"translations": segs[:1]})}}  # špatný počet

    monkeypatch.setattr(fe, "http_json", FakeHTTP(oll))
    with pytest.raises(BadResponse):
        OllamaEngine("čeština").translate_batch(["a", "b"], False, "")


def test_engine_translator_splits_and_keeps_order(monkeypatch):
    class Flaky(fe.Engine):
        name = "flaky"
        max_items = 3
        workers = 2

        def translate_batch(self, texts, markup, context):
            if len(texts) > 1 and "x" in texts:
                raise BadResponse("bad")
            if texts == ["x"]:
                raise BadResponse("bad")
            return [t.upper() for t in texts]

    tr = EngineTranslator(Flaky("čeština"), log=lambda *_: None)
    out = tr.translate_segments(["a", "", "b", "x", "c", "d", "e"], markup=False)
    assert out == ["A", "", "B", "x", "C", "D", "E"]
    assert "přeloženo" in tr.cost_summary()


def test_engine_error_stops(monkeypatch):
    class Broken(fe.Engine):
        def translate_batch(self, texts, markup, context):
            raise EngineError("limit")

    with pytest.raises(EngineError):
        EngineTranslator(Broken("čeština"), log=lambda *_: None).translate_segments(["a"], markup=False)


def test_pipeline_translates_ocr_blocks():
    class OCR:
        workers = 1

        def image_blocks(self, path, translate):
            assert translate is False
            return [{"style": "heading1", "text": "Title"}, {"style": "table_row", "text": "a | b"}]

    class Segs:
        def translate_segments(self, segments, markup, progress=None, context=""):
            return [s.upper() for s in segments]

    p = Pipeline(Segs(), OCR(), "čeština")
    assert p.image_blocks("x.png", True) == [{"style": "heading1", "text": "TITLE"},
                                             {"style": "table_row", "text": "A | B"}]
    assert p.image_blocks("x.png", False)[0]["text"] == "Title"


tesseract_ok = fe.find_tesseract() is not None


@pytest.mark.skipif(not tesseract_ok, reason="Tesseract není nainstalovaný")
def test_tesseract_image_and_pdf(tmp_path):
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", (1400, 300), "white")
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 48)
    except OSError:
        font = ImageFont.load_default(size=48)
    d.text((40, 60), "The quick brown fox jumps.", fill="black", font=font)
    d.text((40, 160), "Hello world again.", fill="black", font=font)
    p = tmp_path / "scan.png"
    img.save(p)
    ocr = fe.TesseractOCR("eng", log=lambda *_: None)
    text = " ".join(b["text"] for b in ocr.image_blocks(str(p)))
    assert "quick brown fox" in text and "Hello world" in text

    # PDF bez textové vrstvy (obrázek) → OCR
    pdf = tmp_path / "scan.pdf"
    img.save(pdf, "PDF", resolution=150)
    text = " ".join(b["text"] for b in ocr.pdf_blocks(pdf.read_bytes()))
    assert "quick brown fox" in text


@pytest.mark.skipif(not os.environ.get("PREKLADAC_LIVE"), reason="živý test – nastavte PREKLADAC_LIVE=1")
def test_google_live():
    out = EngineTranslator(GoogleFreeEngine("čeština"), log=print).translate_segments(
        ["Hello <i>dear</i> reader.", "The book is on the table."], markup=True)
    print(out)
    assert "<i>" in out[0] and out[1] != "The book is on the table."
