"""Testy součástí, uložení klíčů a překladu celých dokumentů (Microsoft) – bez sítě."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import components  # noqa: E402
import free_engines as fe  # noqa: E402


@pytest.fixture(autouse=True)
def appdata(tmp_path, monkeypatch):
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))
    return tmp_path / "appdata"


def test_secret_roundtrip():
    enc = components.protect_secret("abc:fx")
    assert enc and enc != "abc:fx"
    assert components.unprotect_secret(enc) == "abc:fx"
    assert components.unprotect_secret("starý-prostý-text") == "starý-prostý-text"
    assert components.unprotect_secret("") == ""


def test_config_keys_encrypted_on_disk(appdata):
    import app

    cfg = app.load_config()
    cfg["engines"]["deepl"]["api_key"] = "tajny:fx"
    cfg["engines"]["microsoft"]["region"] = "westeurope"
    app.save_config(cfg)
    raw = app.config_path().read_text(encoding="utf-8")
    assert "tajny:fx" not in raw and "westeurope" in raw
    assert app.load_config()["engines"]["deepl"]["api_key"] == "tajny:fx"


def test_document_translator_multipart(tmp_path, monkeypatch):
    sent = {}

    def fake_request(url, **kw):
        sent["url"] = url
        sent.update(kw)
        return b"PRELOZENY-DOKUMENT"

    monkeypatch.setattr(fe, "http_request", fake_request)
    src = tmp_path / "zprava.docx"
    src.write_bytes(b"PK\x03\x04obsah")
    dst = tmp_path / "out.docx"
    doc = fe.MicrosoftDocumentTranslator("čeština", " k e y ", "moje-sluzba.cognitiveservices.azure.com/")
    doc.translate_document(str(src), str(dst), lambda *_: None)
    assert dst.read_bytes() == b"PRELOZENY-DOKUMENT"
    assert sent["url"].startswith(
        "https://moje-sluzba.cognitiveservices.azure.com/translator/document:translate?targetLanguage=cs")
    assert "api-version=" in sent["url"]
    assert sent["headers"]["Ocp-Apim-Subscription-Key"] == "key"
    assert sent["headers"]["Content-Type"].startswith("multipart/form-data; boundary=")
    body = sent["data"]
    assert b'name="document"; filename="zprava.docx"' in body
    assert b"wordprocessingml.document" in body and b"PK\x03\x04obsah" in body
    assert "souborů: 1" in doc.cost_summary()
    with pytest.raises(fe.EngineError):
        fe.MicrosoftDocumentTranslator("čeština", "k", "")


def test_process_file_uses_document_translator(tmp_path):
    import converters

    class Doc:
        SUPPORTED = {".docx", ".pptx", ".pdf"}

        def translate_document(self, src, dst, log):
            Path(dst).write_bytes(b"translated " + Path(src).read_bytes())

    tr = fe.Pipeline(None, None, "čeština", document_translator=Doc())
    for name in ("a.pptx", "b.pdf"):
        src = tmp_path / name
        src.write_bytes(b"x")
        out = converters.process_file(str(src), None, True, tr, str(tmp_path))
        assert out.endswith(f"{Path(name).stem} (čeština){Path(name).suffix}")  # PDF zůstane PDF
        assert Path(out).read_bytes() == b"translated x"
    with pytest.raises(ValueError, match="Microsoft"):
        converters.process_file(str(tmp_path / "a.pptx"), None, True, fe.Pipeline(None, None, "čeština"))


def test_build_translator_microsoft_doc():
    import threading

    import app

    s = {"engine": "microsoft_doc", "lang": "čeština", "engines": {"microsoft": {
        "api_key": "k", "region": "West Europe", "endpoint": "https://x.cognitiveservices.azure.com"}}}
    tr = app.build_translator(s, True, False, lambda *_: None, threading.Event())
    assert isinstance(tr.document_translator, fe.MicrosoftDocumentTranslator)
    assert tr.segs.engine.region == "westeurope"
    assert not app.files_need_ocr(["a.pdf"], None, True, "microsoft_doc")
    assert app.files_need_ocr(["a.pdf"], None, True, "google")


def test_ensure_ocr_languages_downloads_missing(monkeypatch):
    got = []

    def fake_download(lang, log):
        got.append(lang)
        p = components.tessdata_dir() / f"{lang}.traineddata"
        p.write_bytes(b"x")
        return p

    monkeypatch.setattr(components, "download_tessdata", fake_download)
    monkeypatch.setattr(components, "installed_tessdata_dir", lambda exe: None)
    folder = components.ensure_ocr_languages(["eng", "ces"], None, lambda *_: None)
    assert folder == components.tessdata_dir() and got == ["eng", "ces"]
    got.clear()
    components.ensure_ocr_languages(["eng", "ces"], None, lambda *_: None)
    assert got == []  # podruhé už se nestahuje


def test_kfx_plugin_urls():
    index = {
        "Other": {"name": "Other", "file": "1.zip", "thread_id": 1},
        "KFX Input": {"name": "KFX Input", "file": "staging_291290.zip", "thread_id": 291290},
    }
    assert components.kfx_plugin_urls(index) == [
        "https://code.calibre-ebook.com/plugins/staging_291290.zip",
        "https://code.calibre-ebook.com/plugins/291290.zip",
    ]
    assert components.kfx_plugin_urls({"x": {"name": "Nothing"}}) == []


def test_bundled_exe_found_next_to_program(tmp_path, monkeypatch):
    import converters

    monkeypatch.setattr(components, "bundled_dir", lambda: tmp_path)
    monkeypatch.setattr(converters.shutil, "which", lambda name: None)
    monkeypatch.setenv("ProgramFiles", str(tmp_path / "nic"))
    monkeypatch.setenv("ProgramFiles(x86)", str(tmp_path / "nic"))
    exe = "ebook-convert" + (".exe" if sys.platform == "win32" else "")
    (tmp_path / "Calibre2").mkdir()
    (tmp_path / "Calibre2" / exe).write_text("")
    assert converters.find_ebook_convert() == str(tmp_path / "Calibre2" / exe)


def test_kfx_conversion_installs_missing_plugin(monkeypatch, tmp_path):
    import converters

    calls = []
    monkeypatch.setattr(components, "calibre_kfx_plugin", lambda exe: False)
    monkeypatch.setattr(components, "install_kfx_plugin", lambda exe, log: calls.append(exe))
    converters._ensure_kfx_plugin("/x/ebook-convert", lambda *_: None)
    assert calls == ["/x/ebook-convert"]
    monkeypatch.setattr(components, "calibre_kfx_plugin", lambda exe: True)
    converters._ensure_kfx_plugin("/x/ebook-convert", lambda *_: None)
    assert calls == ["/x/ebook-convert"]  # nainstalovaný plugin se znovu neinstaluje
