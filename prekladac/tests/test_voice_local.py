"""Trénink hlasu v tomto počítači (WSL): příprava složky, cesty, spouštěcí soubory, stav a načtení hlasu."""
import json
import sys
import wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import components  # noqa: E402
import voice_studio as vs  # noqa: E402
import voice_train_local as vt  # noqa: E402


def test_win_to_wsl():
    assert vt.win_to_wsl(r"C:\Users\Jan Novák\AppData\x") == "/mnt/c/Users/Jan Novák/AppData/x"
    assert vt.win_to_wsl("D:/") == "/mnt/d"


def test_prepare_status_and_load(tmp_path, monkeypatch):
    monkeypatch.setattr(components, "app_dir", lambda: tmp_path)
    import tts_win

    monkeypatch.setattr(tts_win, "piper_dir", lambda: tmp_path / "piper")
    ds = vs.Dataset("Můj hlas")
    ds.add_sentences([f"Věta číslo {i} pro trénink." for i in range(60)])
    for i in range(60):
        with wave.open(str(ds.wav_path(i)), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(22050)
            w.writeframes(b"\0\0" * 100)
    d = vt.prepare(ds)
    assert d == tmp_path / "trenink_hlasu" / ds.name
    assert [p.name for p in d.glob("*.zip")] == [f"{ds.name}-hlas.zip"]
    sh = (d / vt.SCRIPT).read_bytes()
    assert b"\r\n" not in sh and sh.startswith(b"#!/usr/bin/env bash")
    bat = (d / "trenovat.bat").read_text(encoding="utf-8")
    assert "--system" in bat and f'"{vt.win_to_wsl(d)}"' in bat and "pause" in bat
    assert "--export" in (d / "ukazka.bat").read_text(encoding="utf-8")
    assert "--znovu" in (d / "znovu_od_jirky.bat").read_text(encoding="utf-8")
    assert vt.status(d) == {"epoch": None, "epochs": None, "voice": None}
    (d / "trenink.log").write_text("Epoch 0/1999 ━━\nEpoch 41/1999 ━━━ 30/30\n", encoding="utf-8")
    try:
        vt.load_voice(d)
        raise AssertionError("bez hlasu má selhat")
    except vs.StudioError:
        pass
    (d / "hotovo").mkdir(exist_ok=True)
    (d / "hotovo" / f"{ds.name}.onnx").write_bytes(b"onnx")
    (d / "hotovo" / f"{ds.name}.onnx.json").write_text(json.dumps(
        {"phoneme_id_map": {"a": [1]}, "audio": {"sample_rate": 22050}, "dataset": ds.name}), encoding="utf-8")
    st = vt.status(d)
    assert st["epoch"] == 42 and st["epochs"] == 2000 and st["voice"].name == f"{ds.name}.onnx"
    dst = vt.load_voice(d)
    assert dst.is_file() and dst.parent.name == "vlastni"
    # nový export ZIPu nahradí starý (nepomíchají se nahrávky)
    (d / "stary.zip").write_bytes(b"x")
    vt.prepare(ds)
    assert len(list(d.glob("*.zip"))) == 1


def test_script_merges_zips_like_colab(tmp_path):
    """Část skriptu, která spojí ZIPy (stejné věty jen jednou) – spuštěná skutečným Pythonem."""
    import re
    import subprocess
    import zipfile

    sh = vt.script_source().read_text(encoding="utf-8")
    code = re.search(r"VOICE=\$\(python3 - \"\$SLOZKA\" \"\$HOME_T/data\" <<'PY'\n(.*?)\nPY\n\)", sh, re.S).group(1)
    src = tmp_path / "src"
    src.mkdir()
    for k, texts in enumerate((["Ahoj.", "Dobrý den."], ["dobrý den.", "Nová věta."])):
        with zipfile.ZipFile(src / f"{k}.zip", "w") as z:
            for i, t in enumerate(texts):
                z.writestr(f"hlas{k}/wavs/{i}.wav", b"RIFF")
            z.writestr(f"hlas{k}/metadata.csv", "".join(f"{i}.wav|{t}\n" for i, t in enumerate(texts)))
    out = tmp_path / "data"
    r = subprocess.run([sys.executable, "-c", code, str(src), str(out)], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert r.stdout.strip() == "hlas1" and "vět: 3" in r.stderr
    assert (out / "metadata.csv").read_text(encoding="utf-8").count("\n") == 3
    assert len(list((out / "wavs").glob("*.wav"))) == 3 and (out / "otisk").is_file()


def test_local_train_dialog(tmp_path, monkeypatch):
    import pytest

    QtWidgets = pytest.importorskip("PySide6.QtWidgets")
    monkeypatch.setattr(components, "app_dir", lambda: tmp_path)
    app = QtWidgets.QApplication.instance() or QtWidgets.QApplication([])
    from qt_voice_studio import LocalTrainDialog

    monkeypatch.setattr(vt, "wsl_available", lambda: False)
    d = LocalTrainDialog(None, "muj_hlas")
    assert "wsl --install" in d.info.text() and not d.b_run.isEnabled() and not d.b_load.isEnabled()
    launched = []
    monkeypatch.setattr(vt, "wsl_available", lambda: True)
    monkeypatch.setattr(vt, "launch", lambda folder, which="trenovat.bat": launched.append(which))
    ds = vs.Dataset("muj_hlas")
    ds.add_sentences([f"Věta číslo {i} pro trénink." for i in range(60)])
    for i in range(60):
        with wave.open(str(ds.wav_path(i)), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(22050)
            w.writeframes(b"\0\0" * 100)
    d.refresh()
    assert d.b_run.isEnabled() and "Nahraných vět: 60" in d.info.text()
    d.b_run.click()
    d.b_sample.click()
    assert launched == ["trenovat.bat", "ukazka.bat"]
    d.close()
    app.processEvents()
