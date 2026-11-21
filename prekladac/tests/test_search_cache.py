"""Hledání bez diakritiky, mezipaměť překladů."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import text_search  # noqa: E402
import translation_cache as tc  # noqa: E402


def test_search_regex_loose_spaces_quotes():
    def hit(needle, text, **kw):
        return bool(text_search.compile_py(needle, **kw).search(text))

    assert hit("zluty kun", "Ten Žlutý  kůň běžel")
    assert not hit("zluty", "Žlutý", case=True)
    assert hit("Žlutý", "žlutý") and not hit("Žlutý", "žlutý", case=True)
    assert hit("v domě", "byl v domě", loose=False)        # pevná mezera po typografii
    assert hit('řekl "ahoj"', "řekl „ahoj“", loose=False)
    assert hit("a-b", "a–b") and hit("rock'n'roll", "rock’n’roll")
    assert not hit("kočka", "kočkovitá", words=True) and hit("kočka", "Kočka!", words=True)
    assert text_search.search_regex("   ") == ""
    assert hit("a+b (c)", "a+b (c)")  # zvláštní znaky se berou doslova


class FakeTr:
    target_lang = "čeština"

    def __init__(self):
        self.calls = []

    def translate_segments(self, segments, markup, progress=None, context=""):
        self.calls.append(list(segments))
        if progress:
            progress(1.0)
        return [s if s == "NEJDE" else s.upper() for s in segments]


def test_cached_translator_reuses_dedupes_and_resumes(tmp_path):
    cache = tc.TranslationCache(tmp_path / "c.sqlite")
    inner, logs = FakeTr(), []
    tr = tc.wrap(inner, "google|cs", log=logs.append, cache=cache)
    segs = ["ahoj", "", "svět", "ahoj", "NEJDE"]
    assert tr.translate_segments(segs, False) == ["AHOJ", "", "SVĚT", "AHOJ", "NEJDE"]
    assert inner.calls == [["ahoj", "svět", "NEJDE"]]             # stejná věta jen jednou
    assert tr.target_lang == "čeština"                             # ostatní vlastnosti z překladače
    inner.calls.clear()
    assert tr.translate_segments(segs, False) == ["AHOJ", "", "SVĚT", "AHOJ", "NEJDE"]
    assert inner.calls == [["NEJDE"]]                               # nepřeložené se neukládá
    assert any("Z mezipaměti: 3 z 4" in m for m in logs)
    # jiný druh textu, jiný překladač nebo glosář = nový překlad
    inner.calls.clear()
    tr.translate_segments(["ahoj"], True)
    tc.wrap(inner, "deepl|cs", cache=cache, log=logs.append).translate_segments(["ahoj"], False)
    tc.wrap(inner, "google|cs", extra="glosar", cache=cache, log=logs.append).translate_segments(["ahoj"], False)
    assert len(inner.calls) == 3
    n, size = cache.stats()
    assert n == 5 and size > 0 and "Uloženo 5" in tc.describe(cache)
    cache.clear()
    assert cache.stats()[0] == 0 and tc.describe(cache) == "Mezipaměť je prázdná."


def test_cached_translator_saves_chunks_before_interruption(tmp_path):
    class Stops(FakeTr):
        def translate_segments(self, segments, markup, progress=None, context=""):
            if len(self.calls) == 2:
                raise RuntimeError("přerušeno")
            return super().translate_segments(segments, markup, progress, context)

    cache = tc.TranslationCache(tmp_path / "c.sqlite")
    segs = [f"věta {i} " + "x" * 40 for i in range(10)]
    inner = Stops()
    try:
        tc.CachedTranslator(inner, cache, "id", log=lambda *_: None, chunk_chars=100).translate_segments(segs, False)
    except RuntimeError:
        pass
    assert cache.stats()[0] == 4                                    # dvě hotové části zůstaly uložené
    inner2, prog = FakeTr(), []
    out = tc.CachedTranslator(inner2, cache, "id", log=lambda *_: None, chunk_chars=100).translate_segments(
        segs, False, progress=prog.append)
    assert out == [s.upper() for s in segs] and sum(len(c) for c in inner2.calls) == 6
    assert prog[-1] == 1.0 and all(0 <= p <= 1.0 for p in prog)


def test_build_translator_sets_cache_id(monkeypatch):
    import threading

    import app

    s = {"engine": "google", "lang": "čeština", "notes": "", "engines": {}}
    tr = app.build_translator(s, True, False, lambda *_: None, threading.Event())
    assert tr.cache_id.startswith("google|") and "čeština" in tr.cache_id
    tr = app.build_translator({**s, "translation_cache": False}, True, False, lambda *_: None, threading.Event())
    assert not getattr(tr, "cache_id", "")


def test_run_jobs_uses_cache(tmp_path, monkeypatch):
    import threading

    import app
    import components

    monkeypatch.setattr(components, "app_dir", lambda: tmp_path)
    src = tmp_path / "a.txt"
    src.write_text("Jedna věta.\n\nDruhá věta.\n\nJedna věta.\n", encoding="utf-8")
    inner = FakeTr()
    inner.cache_id = "fake|cs"
    for _ in range(2):
        app.run_jobs([str(src)], True, "txt", inner, str(tmp_path / "out"), False, lambda *_: None,
                     lambda *_: None, None, threading.Event())
    assert len(inner.calls) == 1  # podruhé vše z mezipaměti
