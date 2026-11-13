"""Čtení nahlas: stažený český hlas Piper (bez internetu), pozastavení a pokračování od místa přerušení."""
import os
import sys
import threading
import time
import wave
import zipfile
import io
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import tts_win  # noqa: E402


def make_wav(path, seconds=0.6, rate=16000):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b"\x00\x01" * int(seconds * rate))


@pytest.fixture
def appdata(tmp_path, monkeypatch):
    monkeypatch.setenv("APPDATA", str(tmp_path))
    return tmp_path


def test_download_piper_and_list_voice(appdata, monkeypatch):
    import free_engines

    exe_zip = io.BytesIO()
    with zipfile.ZipFile(exe_zip, "w") as z:
        z.writestr("piper/piper.exe", b"MZ")
        z.writestr("piper/espeak-ng-data/x", b"")
    got = []

    def fake_http(url, **k):
        got.append(url)
        if url == tts_win.PIPER_ZIP:
            return exe_zip.getvalue()
        return b"{}" * 400 if url.split("?")[0].endswith(".json") else b"\0" * 2_000_000

    monkeypatch.setattr(free_engines, "http_request", fake_http)
    monkeypatch.setattr(tts_win, "available", lambda: False)  # jen stažené hlasy (bez hlasů Windows počítače)
    assert tts_win.piper_installed("cs") == []
    v = tts_win.download_piper("cs", lambda m: None)
    assert v["name"] == "piper:cs_CZ-jirka-medium" and v["lang"] == "cs" and v["gender"] == "muž"
    assert any("cs_CZ-jirka-medium.onnx?download=true" in u for u in got)
    assert [x["name"] for x in tts_win.list_voices()] == ["piper:cs_CZ-jirka-medium"]
    assert tts_win.any_voice() and tts_win.Speaker().has_voice("cs") is True and tts_win.has_voice("cs") is True
    n = len(got)
    tts_win.download_piper("cs", lambda m: None)  # podruhé už se nic nestahuje
    assert len(got) == n
    with pytest.raises(Exception):
        tts_win.download_piper("xx", lambda m: None)


def test_wav_tail(tmp_path):
    src, out = tmp_path / "a.wav", tmp_path / "b.wav"
    make_wav(src, 1.0)
    assert abs(tts_win.wav_seconds(str(src)) - 1.0) < 0.01
    tts_win.wav_tail(str(src), 0.25, str(out))
    assert abs(tts_win.wav_seconds(str(out)) - 0.75) < 0.01


class FakePlayer:
    log = []

    def play(self, path):
        FakePlayer.log.append(("play", round(tts_win.wav_seconds(path), 1)))

    def stop(self):
        FakePlayer.log.append(("stop",))


def test_speaker_piper_pause_resume(appdata, monkeypatch):
    (appdata / "Prekladac" / "piper" / "piper").mkdir(parents=True)
    (appdata / "Prekladac" / "piper" / "piper" / "piper.exe").write_bytes(b"MZ")
    model = tts_win.piper_model_path(tts_win.PIPER_VOICES["cs"][0][0])
    model.parent.mkdir(parents=True)
    model.write_bytes(b"x")
    calls = []

    def synth(text, m, rate, out):
        calls.append((text, Path(m).name, rate))
        make_wav(out, 0.6)

    monkeypatch.setattr(tts_win, "piper_synthesize", synth)
    monkeypatch.setattr(tts_win, "available", lambda: False)
    FakePlayer.log = []
    sp = tts_win.Speaker()
    sp.player_cls = FakePlayer
    done = threading.Event()
    sp.speak("Dobrý den.", "cs", 1.2, on_done=done.set)  # bez hlasu Windows → stažený český hlas
    time.sleep(0.2)
    sp.pause()
    time.sleep(0.3)
    sp.resume()
    assert done.wait(3), sp.error
    assert calls == [("Dobrý den.", "cs_CZ-jirka-medium.onnx", 1.2)]
    assert FakePlayer.log[0] == ("play", 0.6) and FakePlayer.log[1] == ("stop",)
    assert FakePlayer.log[2][0] == "play" and 0.3 <= FakePlayer.log[2][1] <= 0.5  # pokračuje od místa pauzy
    # zastavení během čtení: on_done se nezavolá
    done2 = threading.Event()
    sp.speak("Druhá věta.", "cs", 1.0, on_done=done2.set, voice_name="piper:cs_CZ-jirka-medium")
    time.sleep(0.15)
    sp.stop()
    assert not done2.wait(1)
    assert FakePlayer.log[-1] == ("stop",)


def test_piper_synthesize_command(appdata, monkeypatch):
    exe = appdata / "Prekladac" / "piper" / "piper" / "piper.exe"
    exe.parent.mkdir(parents=True)
    exe.write_bytes(b"MZ")
    seen = {}

    class R:
        returncode = 0
        stderr = b""

    def run(cmd, input=None, **k):
        seen["cmd"], seen["input"] = cmd, input
        make_wav(cmd[cmd.index("--output_file") + 1], 0.1)
        return R()

    monkeypatch.setattr(tts_win.subprocess, "run", run)
    out = appdata / "o.wav"
    tts_win.piper_synthesize("Žluťoučký kůň\núpěl.", "m.onnx", 2.0, str(out))
    assert seen["cmd"][0] == str(exe) and "--length_scale" in seen["cmd"]
    assert seen["cmd"][seen["cmd"].index("--length_scale") + 1] == "0.50"
    assert seen["input"] == "Žluťoučký kůň úpěl.".encode("utf-8")


def test_fix_piper_config(tmp_path):
    import json

    p = tmp_path / "v.onnx.json"
    p.write_text(json.dumps({"phoneme_id_map": {"a": [1], "aɪ": [161], "ʃ": [2]}, "audio": {"sample_rate": 22050}},
                            ensure_ascii=False), encoding="utf-8")
    assert tts_win.fix_piper_config(p) is True
    cfg = json.loads(p.read_text(encoding="utf-8"))
    assert cfg["phoneme_id_map"] == {"a": [1], "ʃ": [2]} and cfg["audio"]["sample_rate"] == 22050
    assert tts_win.fix_piper_config(p) is False  # podruhé už není co upravit


def test_cloud_voices_azure_google(tmp_path, monkeypatch):
    """Přirozené hlasy z internetu: Azure (SSML → WAV) a Google (JSON → WAV), klíče z Nastavení."""
    import base64
    import json
    import free_engines

    tts_win.configure_cloud({})
    assert tts_win.cloud_voices() == []
    tts_win.configure_cloud({"azure_speech": {"api_key": "AZ", "region": "West Europe"},
                             "google_cloud": {"api_key": "GC"}})
    names = [v["name"] for v in tts_win.cloud_voices("cs")]
    assert names == ["cloud:azure:cs-CZ-VlastaNeural", "cloud:azure:cs-CZ-AntoninNeural", "cloud:google:cs-CZ-Wavenet-A"]
    wav = tmp_path / "w.wav"
    make_wav(wav, 0.3)
    calls = []

    def fake(url, data=None, headers=None, method=None, **k):
        calls.append((url, data, headers))
        if "googleapis" in url:
            return json.dumps({"audioContent": base64.b64encode(wav.read_bytes()).decode()}).encode()
        return wav.read_bytes()

    monkeypatch.setattr(free_engines, "http_request", fake)
    out = tmp_path / "o.wav"
    tts_win.cloud_synthesize("Dobrý den <a> & ty", "azure", "cs-CZ-VlastaNeural", 1.2, str(out))
    url, data, headers = calls[-1]
    assert url == "https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1"
    assert headers["Ocp-Apim-Subscription-Key"] == "AZ" and headers["X-Microsoft-OutputFormat"].startswith("riff")
    assert "name='cs-CZ-VlastaNeural'" in data.decode() and "rate='+20%'" in data.decode()
    assert "Dobrý den &lt;a&gt; &amp; ty" in data.decode()
    assert abs(tts_win.wav_seconds(str(out)) - 0.3) < 0.01
    tts_win.cloud_synthesize("Ahoj", "google", "cs-CZ-Wavenet-A", 1.0, str(out))
    url, data, _h = calls[-1]
    assert url.endswith("?key=GC") and data["voice"]["name"] == "cs-CZ-Wavenet-A"
    # vlastní klíč pro hlasy má přednost před klíčem překladače
    tts_win.configure_cloud({"google_tts": {"api_key": "TTS"}, "google_cloud": {"api_key": "GC"}})
    tts_win.cloud_synthesize("Ahoj", "google", "cs-CZ-Wavenet-A", 1.0, str(out))
    assert calls[-1][0].endswith("?key=TTS")
    with pytest.raises(Exception, match="Chybí klíč"):
        tts_win.cloud_synthesize("x", "azure", "cs-CZ-VlastaNeural", 1.0, str(out))
    assert [len(p) <= 1200 for p in tts_win.split_for_voice("Věta číslo jedna. " * 300)] == [True] * 5


def test_speaker_cloud_voice_and_error(appdata, monkeypatch):
    synth = []

    def fake(text, svc, vid, rate, out):
        synth.append((text[:10], svc, vid))
        if text.startswith("CHYBA"):
            raise RuntimeError("bez internetu")
        make_wav(out, 0.2)

    monkeypatch.setattr(tts_win, "cloud_synthesize", fake)
    FakePlayer.log = []
    sp = tts_win.Speaker()
    sp.player_cls = FakePlayer
    done = threading.Event()
    sp.speak("Dlouhá věta. " * 200, "cs", 1.0, on_done=done.set, voice_name="cloud:azure:cs-CZ-VlastaNeural")
    assert done.wait(5) and not sp.error
    assert len(synth) == 3 and all(s[1:] == ("azure", "cs-CZ-VlastaNeural") for s in synth)  # po kouscích
    done2 = threading.Event()
    sp.speak("CHYBA", "cs", 1.0, on_done=done2.set, voice_name="cloud:google:cs-CZ-Wavenet-A")
    assert done2.wait(3) and "bez internetu" in sp.error
