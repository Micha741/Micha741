"""Testy psaní knihy – Claude je nahrazen falešnou odpovědí (žádné placené volání)."""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import book_writer as bw  # noqa: E402
from claude_client import Cancelled  # noqa: E402

OUTLINE = {
    "title": "Strážce majáku",
    "synopsis": "Chlapec Tomáš najde v majáku tajemnou mapu.",
    "characters": [{"name": "Tomáš", "description": "dvanáctiletý zvědavý kluk"},
                   {"name": "Děda Karel", "description": "starý strážce majáku"}],
    "chapters": [{"title": "Bouře", "summary": "Tomáš přijíždí k dědovi."},
                 {"title": "Mapa", "summary": "Na půdě najde mapu."},
                 {"title": "Návrat", "summary": "Tajemství je odhaleno."}],
}


def test_outline_text_roundtrip():
    text = bw.outline_to_text(OUTLINE)
    assert "NÁZEV: Strážce majáku" in text and "2. Mapa — Na půdě najde mapu." in text
    assert bw.text_to_outline(text) == OUTLINE
    edited = text.replace("2. Mapa — Na půdě najde mapu.", "2. Stará mapa - Na půdě najde mapu a klíč.")
    edited += "4. Epilog\n"
    o = bw.text_to_outline(edited)
    assert o["chapters"][1] == {"title": "Stará mapa", "summary": "Na půdě najde mapu a klíč."}
    assert o["chapters"][3] == {"title": "Epilog", "summary": ""}
    with pytest.raises(bw.BookError):
        bw.text_to_outline("bez osnovy")


class FakeClaude:
    def __init__(self, stop_after=None):
        self.calls = []
        self.stop_after = stop_after

    def __call__(self, system, content, schema, max_tokens=32000):
        self.calls.append((system, content[0]["text"], schema, max_tokens))
        if schema is bw.OUTLINE_SCHEMA:
            return OUTLINE
        n = sum(1 for c in self.calls if c[2] is bw.CHAPTER_SCHEMA)
        if self.stop_after is not None and n > self.stop_after:
            raise Cancelled()
        filler = " ".join(["slovo"] * 1200)  # dost dlouhá kapitola, ať se nepřepisuje
        return {"text": f"Odstavec jedna kapitoly {n}. {filler}\n\nOdstavec dva kapitoly {n}.",
                "summary": f"Shrnutí {n}."}


def make_writer(monkeypatch, fake):
    backend = bw.ClaudeBackend("sk-test", "claude-opus-5-5", "čeština", lambda *_: None, None)
    monkeypatch.setattr(backend.claude, "_call", fake)
    return bw.BookWriter(backend, "čeština", log=lambda *_: None)


def test_outline_and_write_with_resume(monkeypatch, tmp_path):
    fake = FakeClaude(stop_after=2)
    w = make_writer(monkeypatch, fake)
    outline = w.make_outline("Kniha o majáku a tajemné mapě pro děti.", 3, 1500, "dobrodružná")
    assert outline["title"] == "Strážce majáku"
    assert "dobrodružná" in fake.calls[0][1] and "3" in fake.calls[0][1]

    project = {"description": "Kniha o majáku.", "style": "dobrodružná", "language": "čeština",
               "model": "claude-opus-5-5", "words": 1500, "outline": outline, "chapters": []}
    path = tmp_path / ("Strážce majáku" + bw.PROJECT_SUFFIX)
    with pytest.raises(Cancelled):
        w.write(project, path)
    saved = bw.load_project(path)
    assert len(saved["chapters"]) == 2  # dvě kapitoly uložené před přerušením

    # pokračování: dopíše jen třetí kapitolu
    fake2 = FakeClaude()
    w2 = make_writer(monkeypatch, fake2)
    done = w2.write(saved, path)
    assert len(done["chapters"]) == 3
    chapter_calls = [c for c in fake2.calls if c[2] is bw.CHAPTER_SCHEMA]
    assert len(chapter_calls) == 1
    system, prompt, _schema, max_tokens = chapter_calls[0]
    assert "Napiš kapitolu 3 z 3: „Návrat“" in prompt
    assert "Shrnutí 1." in prompt and "Shrnutí 2." in prompt  # navazuje na předchozí děj
    assert "Odstavec dva kapitoly 2." in prompt  # konec předchozí kapitoly
    assert "poslední kapitola" in prompt
    assert system[0]["cache_control"] == {"type": "ephemeral"} and "Strážce majáku" in system[0]["text"]
    assert max_tokens >= 1500 * 2
    assert json.loads(path.read_text(encoding="utf-8"))["chapters"][2]["summary"] == "Shrnutí 1."


def test_export_docx(tmp_path):
    import docx
    from docx.oxml.ns import qn

    text = "První odstavec.\n\nDruhý\nřádek.\n\n[[STRANA]]\n\nTřetí odstavec."
    project = {"language": "čeština", "outline": OUTLINE, "format": {"font": "Arial", "size": 14, "toc": True},
               "chapters": [{"text": text, "summary": ""}] * 3}
    files = bw.export(project, tmp_path / "out", ["docx"], log=lambda *_: None)
    assert len(files) == 1 and files[0].endswith("Strážce majáku.docx")
    d = docx.Document(files[0])
    heads = [p.text for p in d.paragraphs if p.style.name.startswith("Heading")]
    assert heads == ["Obsah", "1. Bouře", "2. Mapa", "3. Návrat"]
    texts = [p.text for p in d.paragraphs]
    assert "Druhý\nřádek." in texts  # zalomení řádku uvnitř odstavce
    assert "Třetí odstavec." in texts
    links = d.element.body.findall(".//" + qn("w:hyperlink"))
    assert [ln.get(qn("w:anchor")) for ln in links] == ["kapitola_1", "kapitola_2", "kapitola_3"]
    marks = [b.get(qn("w:name")) for b in d.element.body.findall(".//" + qn("w:bookmarkStart"))]
    assert marks == ["kapitola_1", "kapitola_2", "kapitola_3"]
    assert d.styles["Normal"].font.name == "Arial" and d.styles["Normal"].font.size.pt == 14
    breaks = d.element.body.findall(".//" + qn("w:br"))
    assert sum(1 for b in breaks if b.get(qn("w:type")) == "page") == 1 + 3 + 3  # obsah + kapitoly + [[STRANA]]
    assert d.core_properties.title == "Strážce majáku" and d.core_properties.language == "cs"

    project["format"]["toc"] = False
    d2 = docx.Document(bw.export(project, tmp_path / "out2", ["docx"], log=lambda *_: None)[0])
    assert [p.text for p in d2.paragraphs if p.style.name.startswith("Heading")][0] == "1. Bouře"


def test_text_and_book_stats():
    text = "Jedna dvě tři.\n\n[[STRANA]]\n\nČtyři pět.\nŠest."
    assert bw.text_stats(text) == (6, 2)
    assert bw.book_stats({"chapters": [{"text": text}, {"text": "Sedm."}]}) == (7, 3, 2)


def test_estimate_and_safe_name():
    w = bw.BookWriter(bw.ClaudeBackend("sk-test", "claude-sonnet-5-5", "čeština", print, None))
    assert "12 kapitol" in w.estimate(12, 2500) and "$" in w.estimate(12, 2500)
    assert bw.safe_name('Kniha: "Ano/Ne"?') == "Kniha AnoNe"


def test_engine_backends_write_a_book(monkeypatch, tmp_path):
    import free_engines as fe

    sent = []

    def fake_http(url, **kw):
        sent.append((url, kw))
        body = kw["data"]
        if "chat/completions" in url:  # OpenAI-kompatibilní
            schema_props = body["messages"][1]["content"]
            out = OUTLINE if '"synopsis"' in schema_props else {"text": "Kapitola.", "summary": "S."}
            return {"choices": [{"message": {"content": "```json\n" + json.dumps(out) + "\n```"},
                                 "finish_reason": "stop"}], "usage": {"prompt_tokens": 100, "completion_tokens": 50}}
        if "generateContent" in url:  # Gemini
            props = body["generationConfig"]["responseSchema"]["properties"]
            assert body["generationConfig"]["responseSchema"]["type"] == "OBJECT"
            out = OUTLINE if "synopsis" in props else {"text": "Kapitola.", "summary": "S."}
            return {"candidates": [{"content": {"parts": [{"text": json.dumps(out)}]}, "finishReason": "STOP"}],
                    "usageMetadata": {"promptTokenCount": 10, "candidatesTokenCount": 5}}
        # Ollama
        assert body["options"]["num_ctx"] >= 16384
        out = OUTLINE if "synopsis" in body["format"]["properties"] else {"text": "Kapitola.", "summary": "S."}
        return {"message": {"content": json.dumps(out)}, "prompt_eval_count": 7, "eval_count": 3}

    monkeypatch.setattr(fe, "http_json", fake_http)
    engines = [fe.OpenAICompatEngine("čeština", "https://api.deepseek.com/v1/", "k", "deepseek-chat"),
               fe.GeminiEngine("čeština", "k"), fe.OllamaEngine("čeština")]
    for eng in engines:
        w = bw.BookWriter(bw.EngineBackend(eng), "čeština", log=lambda *_: None)
        o = w.make_outline("Popis knihy o majáku.", 3, 1000)
        proj = {"description": "x", "words": 1000, "outline": o, "chapters": []}
        w.write(proj, tmp_path / f"{eng.name}.kniha.json")
        assert len(proj["chapters"]) == 3
        assert "tokenů" in w.backend.cost_summary()
    assert engines[0].name == "DeepSeek"
    assert sent[0][0] == "https://api.deepseek.com/v1/chat/completions"
    assert sent[0][1]["data"]["response_format"] == {"type": "json_object"}
    assert sent[0][1]["headers"]["Authorization"] == "Bearer k"


def test_style_options():
    import book_options as bo

    assert len(bo.GENRES) >= 30 and "Erotika" in bo.GENRES
    parts = {"genre": "Fantasy", "audience": "Mládež (young adult)", "narrator": "", "tone": "Napínavý"}
    assert bo.compose_style(parts, "hodně dialogů") == \
        "Žánr: Fantasy; Pro koho: Mládež (young adult); Tón / atmosféra: Napínavý; Další přání: hodně dialogů"
    assert bo.is_mature({"genre": "Erotika"}) and bo.is_mature({"audience": "Dospělí 18+"})
    assert not bo.is_mature(parts)


class LengthBackend:
    """Napoprvé vrátí krátkou kapitolu, při opakování delší; zapisuje si zadání."""

    def __init__(self):
        self.prompts = []

    def complete(self, system, user, schema, max_tokens, cache=False):
        self.prompts.append(user)
        n = 900 if "POZOR" in user else 100
        return {"text": " ".join(["slovo"] * n), "summary": "S."}

    def cost_summary(self):
        return ""


def test_chapter_length_is_enforced(tmp_path):
    be = LengthBackend()
    w = bw.BookWriter(be, "čeština", log=lambda *_: None)
    proj = {"description": "x", "words": 1000, "outline": OUTLINE, "chapters": []}
    w.write(proj, tmp_path / "k.kniha.json")
    assert "aspoň 850 a nejvýš 1200 slov" in be.prompts[0]
    assert len(be.prompts) == 6                     # každá krátká kapitola se jednou přepsala delší
    assert all(len(c["text"].split()) == 900 for c in proj["chapters"])
    # změněná délka v projektu se projeví v zadání další kapitoly
    proj2 = {"description": "x", "words": 3000, "outline": OUTLINE, "chapters": []}
    be2 = LengthBackend()
    bw.BookWriter(be2, "čeština", log=lambda *_: None).write(proj2, tmp_path / "k2.kniha.json")
    assert "přibližně 3000 slov" in be2.prompts[0]


def test_per_chapter_words_roundtrip_and_prompt(tmp_path):
    o = dict(OUTLINE, chapters=[dict(OUTLINE["chapters"][0]), dict(OUTLINE["chapters"][1], words=4000),
                                dict(OUTLINE["chapters"][2])])
    text = bw.outline_to_text(o)
    assert "2. Mapa [4000 slov] — Na půdě" in text
    back = bw.text_to_outline(text)
    assert back["chapters"][1] == {"title": "Mapa", "summary": "Na půdě najde mapu.", "words": 4000}
    assert "words" not in back["chapters"][0]
    # i ručně psané varianty
    t2 = text.replace("[4000 slov]", "(1 500 slov)")
    assert bw.text_to_outline(t2)["chapters"][1]["words"] == 1500
    assert bw.set_line_words("2. Mapa — Na půdě.", 3000) == "2. Mapa [3000 slov] — Na půdě."
    assert bw.set_line_words("2. Mapa [3000 slov] — Na půdě.", None) == "2. Mapa — Na půdě."
    assert bw.set_line_words("SHRNUTÍ:", 100) is None
    proj = {"description": "x", "words": 1000, "outline": back, "chapters": []}
    assert [bw.chapter_words(proj, i) for i in range(3)] == [1000, 4000, 1000]
    assert bw.total_words(proj) == 6000
    be = LengthBackend()
    bw.BookWriter(be, "čeština", log=lambda *_: None).write(proj, tmp_path / "k.kniha.json")
    first = [p for p in be.prompts if "POZOR" not in p]
    assert "přibližně 1000 slov" in first[0] and "přibližně 4000 slov" in first[1]
