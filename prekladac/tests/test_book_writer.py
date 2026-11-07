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
        return {"text": f"Odstavec jedna kapitoly {n}.\n\nOdstavec dva kapitoly {n}.", "summary": f"Shrnutí {n}."}


def make_writer(monkeypatch, fake):
    w = bw.BookWriter("sk-test", "claude-opus-5-5", "čeština", log=lambda *_: None)
    monkeypatch.setattr(w.claude, "_call", fake)
    return w


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

    project = {"language": "čeština", "outline": OUTLINE,
               "chapters": [{"text": "První odstavec.\n\nDruhý\nodstavec.", "summary": ""}] * 3}
    files = bw.export(project, tmp_path / "out", ["docx"], log=lambda *_: None)
    assert len(files) == 1 and files[0].endswith("Strážce majáku.docx")
    d = docx.Document(files[0])
    heads = [p.text for p in d.paragraphs if p.style.name.startswith("Heading")]
    assert heads == ["1. Bouře", "2. Mapa", "3. Návrat"]
    assert "Druhý odstavec." in [p.text for p in d.paragraphs]
    assert d.core_properties.title == "Strážce majáku" and d.core_properties.language == "cs"


def test_estimate_and_safe_name():
    w = bw.BookWriter("sk-test", "claude-sonnet-5-5")
    assert "12 kapitol" in w.estimate(12, 2500) and "$" in w.estimate(12, 2500)
    assert bw.safe_name('Kniha: "Ano/Ne"?') == "Kniha AnoNe"
