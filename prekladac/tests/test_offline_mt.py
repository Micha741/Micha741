import io
import json
import sys
import zipfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import offline_mt  # noqa: E402


@pytest.fixture(autouse=True)
def appdata(tmp_path, monkeypatch):
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))
    offline_mt.OfflineTranslator._models.clear()


def fake_package(a, b, extra=None):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr(f"translate-{a}_{b}/metadata.json", json.dumps({"from_code": a, "to_code": b, "type": "translate"}))
        z.writestr(f"translate-{a}_{b}/model/model.bin", b"x")
        for name, data in (extra or {}).items():
            z.writestr(name, data)
    return buf.getvalue()


def install_fake(monkeypatch, a, b, extra=None):
    import free_engines
    monkeypatch.setattr(free_engines, "http_request", lambda url, **k: fake_package(a, b, extra))
    return offline_mt.install({"from_code": a, "to_code": b, "links": ["https://x/p.argosmodel"]}, lambda m: None)


def test_detect_and_split():
    assert offline_mt.detect_language("The fox jumps over the dog and it is fast.") == "en"
    assert offline_mt.detect_language("Der Fuchs springt über den Hund und ist nicht langsam.") == "de"
    assert offline_mt.detect_language("Hi") is None
    s = offline_mt.split_sentences('He said: "Go." Then he left! Was it 5 p.m.? "Yes." 2 dogs ran.')
    assert s == ['He said: "Go."', "Then he left!", "Was it 5 p.m.?", '"Yes."', "2 dogs ran."]
    long = "word, " * 400
    assert all(len(p) <= 900 for p in offline_mt.split_sentences(long))
    assert offline_mt.code_of("čeština") == "cs" and offline_mt.code_of("němčina") == "de"


def test_install_route_remove(monkeypatch):
    assert offline_mt.route("en", "cs") is None
    p = install_fake(monkeypatch, "en", "cs")
    assert (p / "metadata.json").exists() and p.parent == offline_mt.models_dir()
    assert offline_mt.route("en", "cs") == [("en", "cs")]
    assert offline_mt.route("de", "cs") is None
    install_fake(monkeypatch, "de", "en")
    assert offline_mt.route("de", "cs") == [("de", "en"), ("en", "cs")]   # přes angličtinu
    offline_mt.remove(("de", "en"))
    assert set(offline_mt.installed()) == {("en", "cs")}
    assert "němčina → angličtina" in offline_mt.missing_message("de", "cs")


def test_install_rejects_bad_zip(monkeypatch):
    from free_engines import EngineError
    with pytest.raises(EngineError):
        install_fake(monkeypatch, "en", "cs", {"../evil.txt": "x"})
    assert not offline_mt.installed()


def test_bpe_segmentation(tmp_path):
    pytest.importorskip("sacremoses")
    m = tmp_path / "bpe.model"
    m.write_text("#version: 0.2\nl o\nlo w</w>\ne r</w>\n", encoding="utf-8")
    bpe = offline_mt._BPE(m, "en", "cs")
    assert bpe._segment("low") == ["low"]
    assert bpe._segment("lower") == ["lo@@", "w@@", "er"]
    assert bpe.decode(["lo@@", "w@@", "er", "."]) == "lower."


def test_offline_engine(monkeypatch):
    from free_engines import EngineError, OfflineEngine
    with pytest.raises(EngineError):
        OfflineEngine("čeština")                      # žádný balíček
    install_fake(monkeypatch, "en", "cs")
    install_fake(monkeypatch, "de", "en")
    calls = []

    def fake_translate(self, texts, src, dst):
        calls.append((src, dst))
        return [f"[{src}->{dst}] {t}" for t in texts]
    monkeypatch.setattr(offline_mt.OfflineTranslator, "translate", fake_translate)
    e = OfflineEngine("čeština")
    out = e.translate_batch(["Der Hund ist nicht in dem Haus und die Katze auch."], False, "")
    assert calls == [("de", "cs")] and out[0].startswith("[de->cs]")
    # značky: model dostane čistý text, výsledek bez zástupných symbolů
    e2 = OfflineEngine("čeština")
    out = e2.translate_batch(["The <b>dog</b> is in the house and it is fast."], True, "")
    assert "{{" not in out[0] and "dog" in out[0]


def test_cli_install_offline(monkeypatch, tmp_path):
    import app
    import free_engines
    idx = json.dumps([{"from_code": "en", "to_code": "cs", "package_version": "1.9.6", "type": "translate",
                       "links": ["https://x/en_cs.argosmodel"]}]).encode()
    monkeypatch.setattr(free_engines, "http_request",
                        lambda url, **k: idx if url.endswith("index.json") else fake_package("en", "cs"))
    rep = tmp_path / "r.txt"
    assert app._install_offline("en_cs,xx_yy", rep) == 0
    text = rep.read_text(encoding="utf-8")
    assert "nainstalováno" in text and "xx_yy: balíček neexistuje" in text
    assert ("en", "cs") in offline_mt.installed()
