"""Vlastní hlas: věty k nahrání, kontrola nahrávek, export LJSpeech a import hlasu Piper do čtečky a audioknihy."""
import json
import math
import struct
import sys
import zipfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import voice_studio as vs  # noqa: E402


@pytest.fixture(autouse=True)
def appdata(tmp_path, monkeypatch):
    monkeypatch.setenv("APPDATA", str(tmp_path / "appdata"))


def speech(seconds=1.5, rate=22050, lead=0.6, amp=8000):
    """Ticho – „řeč“ (tón) – ticho."""
    n_lead = int(lead * rate)
    body = [int(amp * math.sin(t / 5)) for t in range(int(seconds * rate))]
    return struct.pack(f"<{n_lead}h", *([0] * n_lead)) + struct.pack(f"<{len(body)}h", *body) + struct.pack(f"<{n_lead}h", *([0] * n_lead))


def test_sentences_from_text_filters():
    text = ("Byl pozdní večer, první máj, večerní máj, byl lásky čas. Krátká věta. V roce 1836 vyšel Máj. "
            "Viz str. 5 a také kap. 3 v knize o lese. Hrdliččin zval ke lásce hlas, kde borový zaváněl háj! "
            "Byl pozdní večer, první máj, večerní máj, byl lásky čas.")
    got = vs.sentences_from_text(text)
    assert got == ["Byl pozdní večer, první máj, večerní máj, byl lásky čas.",
                   "Hrdliččin zval ke lásce hlas, kde borový zaváněl háj!"]


def test_record_trim_quality_and_export(tmp_path):
    ds = vs.Dataset("Můj hlas", root=tmp_path)
    assert ds.name == "Můj_hlas" and len(ds.sentences) == len(vs.STARTER)
    q = ds.save_take(0, speech(2.5))
    assert q["ok"], q
    import wave
    with wave.open(str(ds.wav_path(0)), "rb") as w:
        assert (w.getframerate(), w.getnchannels()) == (22050, 1)
        assert w.getnframes() / 22050 < 2.5 + 0.4, "ticho na začátku a konci oříznuté"
    bad = ds.save_take(1, speech(0.3, amp=100))
    assert not bad["ok"] and any("potichu" in p for p in bad["problems"])
    assert ds.recorded() == [0, 1] and ds.next_missing() == 2
    with pytest.raises(vs.StudioError, match="aspoň 300"):
        ds.export_zip(tmp_path / "x.zip")
    ds.add_sentences([f"Tohle je doplňková věta číslo {'jedna dva tři čtyři pět'.split()[k % 5]} {k}." for k in range(20)])
    for i in range(2, 50):
        ds.save_take(i, speech(2.0))
    out = ds.export_zip(tmp_path / "hlas.zip")
    z = zipfile.ZipFile(out)
    meta = z.read("Můj_hlas/metadata.csv").decode("utf-8").splitlines()
    assert meta[0] == f"0001.wav|{vs.STARTER[0]}" and len(meta) == 50
    assert "Můj_hlas/wavs/0050.wav" in z.namelist()
    before = len(ds.sentences)
    assert ds.add_sentences(["Nová věta pro hlas k nahrání.", vs.STARTER[0]]) == 1 and len(ds.sentences) == before + 1
    assert vs.Dataset("Můj hlas", root=tmp_path).sentences[-1] == "Nová věta pro hlas k nahrání."


def fake_voice(folder: Path, name="test") -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    onnx = folder / f"{name}.onnx"
    onnx.write_bytes(b"ONNX")
    (folder / f"{name}.onnx.json").write_text(json.dumps({"audio": {"sample_rate": 22050}, "phoneme_id_map": {"a": [1]},
                                                          "language": {"code": "cs_CZ"}, "espeak": {"voice": "cs"}}))
    return onnx


def test_import_voice_appears_in_reader_and_audiobook(tmp_path, monkeypatch):
    import audiobook as ab
    import tts_win

    src = fake_voice(tmp_path / "stazene", "cs_CZ-muj-medium")
    dst = vs.import_voice(src, "Michal")
    assert dst.name == "Michal.onnx" and json.loads(Path(str(dst) + ".json").read_text())["dataset"] == "Michal"
    voices = tts_win.custom_piper_voices("cs")
    assert voices[0]["name"] == "piper:vlastni/Michal" and "vlastní hlas" in voices[0]["label"]
    assert tts_win.custom_piper_voices("en") == []
    monkeypatch.setattr(tts_win, "piper_exe", lambda: tmp_path / "piper.exe")
    assert any(v["name"] == "piper:vlastni/Michal" for v in tts_win.piper_installed("cs"))
    assert "vlastni:Michal" in ab.all_voices()
    calls = []
    monkeypatch.setattr(tts_win, "piper_synthesize", lambda text, model, rate, out, timeout=300: calls.append(model))
    ab.make_synth("vlastni:Michal")("Ahoj.", str(tmp_path / "o.wav"))
    assert calls == [str(dst)]
    with pytest.raises(vs.StudioError, match=".onnx.json"):
        bad = tmp_path / "bez.onnx"
        bad.write_bytes(b"x")
        vs.import_voice(bad)
    vs.remove_voice(dst)
    assert tts_win.custom_piper_voices() == []


def test_colab_notebook_is_valid():
    nb = json.loads((Path(vs.__file__).parent / "tools" / "vlastni_hlas_colab.ipynb").read_text(encoding="utf-8"))
    src = "".join("".join(c["source"]) for c in nb["cells"])
    assert "piper.train fit" in src and "export_onnx" in src and "--data.espeak_voice cs" in src
    assert nb["metadata"]["accelerator"] == "GPU"
