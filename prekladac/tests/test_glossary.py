"""Glosář knihy: uložení, pokyn pro AI, ochrana výrazů u ostatních překladačů a návrh jmen."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import glossary  # noqa: E402


@pytest.fixture(autouse=True)
def appdata(tmp_path, monkeypatch):
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))


TERMS = [{"src": "Hogwarts", "dst": "Bradavice", "note": "škola"}, {"src": "Harry", "dst": "Harry", "note": ""},
         {"src": "Diagon Alley", "dst": "Příčná ulice", "note": ""}]


def test_save_load_per_book_and_language(tmp_path):
    glossary.save(tmp_path / "Kniha 1.epub", "čeština", TERMS + [{"src": "harry", "dst": "x"}, {"src": " ", "dst": "y"}])
    assert [t["src"] for t in glossary.load(tmp_path / "jinde" / "Kniha 1.epub", "čeština")] == ["Hogwarts", "Harry", "Diagon Alley"]
    assert glossary.load(tmp_path / "Kniha 1.epub", "němčina") == []
    glossary.save(tmp_path / "Kniha 1.epub", "čeština", [])
    assert glossary.load(tmp_path / "Kniha 1.epub", "čeština") == []


class FakeMT:
    """Nepřekládá, jen značky vrací s mezerami (jak to některé překladače dělají)."""
    target_lang = "čeština"

    def __init__(self):
        self.seen = []

    def translate_segments(self, segments, markup, progress=None, context=""):
        self.seen += segments
        return [s.replace("⟦G", "⟦ G").replace("went to", "šel do") for s in segments]


def test_non_ai_protects_terms_and_restores_translation():
    mt = FakeMT()
    g = glossary.GlossaryTranslator(mt, glossary.clean_terms(TERMS))
    out = g.translate_segments(["Harry went to Hogwarts via Diagon Alley.", "Harryho"], False)
    assert "Hogwarts" not in mt.seen[0] and "⟦G" in mt.seen[0]
    assert out[0] == "Harry šel do Bradavice via Příčná ulice."
    assert out[1] == "Harryho"   # jen celé slovo
    assert g.target_lang == "čeština"  # ostatní vlastnosti překladače zůstávají


class FakeAI:
    target_lang = "čeština"

    def __init__(self):
        self.notes = "Vykat."
        self.used = ""

    def translate_segments(self, segments, markup, progress=None, context=""):
        self.used = self.notes
        return segments


def test_ai_gets_glossary_in_notes_and_notes_restored():
    ai = FakeAI()
    ai.__class__.__name__ = "ClaudeTranslator"
    g = glossary.GlossaryTranslator(ai, glossary.clean_terms(TERMS))
    g.translate_segments(["Harry went to Hogwarts."], False)
    assert "Vykat." in ai.used and "Hogwarts → Bradavice" in ai.used and "Harry → Harry (beze změny)" in ai.used
    assert ai.notes == "Vykat."


def test_wrap_only_when_book_has_glossary(tmp_path):
    mt = FakeMT()
    assert glossary.wrap(mt, tmp_path / "a.epub", "čeština") is mt
    glossary.save(tmp_path / "a.epub", "čeština", TERMS)
    assert isinstance(glossary.wrap(mt, tmp_path / "a.epub", "čeština"), glossary.GlossaryTranslator)


def test_suggest_names_and_ai():
    text = ("It was late. Harry looked at Hermione. Then Hermione smiled at Harry and Ron. "
            "Later Ron said hello to Harry. Hermione laughed. The castle was dark. Ron ran.")
    names = {t["src"] for t in glossary.suggest_names(text, min_count=2)}
    assert {"Harry", "Hermione", "Ron"} <= names and "The" not in names and "It" not in names
    got = glossary.suggest_ai(lambda system, user, schema, mt: {"terms": [{"src": "Hogwarts", "dst": "Bradavice", "note": "škola"}]},
                              "text", "čeština")
    assert got == [{"src": "Hogwarts", "dst": "Bradavice", "note": "škola"}]


def test_run_jobs_uses_glossary(tmp_path, monkeypatch):
    import app

    src = tmp_path / "kniha.txt"
    src.write_text("Harry went to Hogwarts.", encoding="utf-8")
    glossary.save(src, "čeština", TERMS)
    seen = {}

    def fake_process(path, fmt, translate, tr, out_dir, log, step, conv):
        seen["out"] = tr.translate_segments(["Harry went to Hogwarts."], False)
        return str(path)

    monkeypatch.setattr(app, "process_file", fake_process)
    logs = []
    app.run_jobs([str(src)], True, None, FakeMT(), None, False, logs.append, lambda f: None, None,
                 __import__("threading").Event())
    assert seen["out"] == ["Harry šel do Bradavice."]
    assert any("Glosář knihy: 3" in m for m in logs)
