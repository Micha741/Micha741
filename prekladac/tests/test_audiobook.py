"""Audiokniha: kapitoly do MP3 se štítky ID3, seznam skladeb, jen povolené hlasy."""
import math
import struct
import sys
import wave
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import audiobook as ab  # noqa: E402

PROJ = {"outline": {"title": "Kůň a louka", "chapters": [{"title": "Žluťoučký začátek"}, {"title": "Konec"}]},
        "author": "Jan Novák",
        "chapters": [{"text": "První odstavec.\n\n[obrázek]\n\nDruhý [[STRANA]] odstavec."}, {"text": "Poslední věta."}]}


def tone_synth(seen):
    def synth(text, out):
        seen.append(text)
        rate, n = 22050, 4410
        with wave.open(out, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(b"".join(struct.pack("<h", int(6000 * math.sin(t / 8))) for t in range(n)))
    return synth


def test_chapter_texts_without_markers():
    chs = ab.chapter_texts(PROJ)
    assert chs[0] == ("Žluťoučký začátek", ["První odstavec.", "Druhý odstavec."])
    assert ab.count_chars(PROJ) == len("Žluťoučký začátek") + len("První odstavec.") + len("Druhý odstavec.") + len("Konec") + len("Poslední věta.")


def test_make_audiobook_mp3_tags_playlist(tmp_path):
    pytest.importorskip("lameenc")
    seen = []
    files = ab.make_audiobook(PROJ, tmp_path, tone_synth(seen), cover=b"\x89PNG\r\n\x1a\n" + b"0" * 20, log=lambda *_: None)
    assert [f.name for f in files] == ["01 Žluťoučký začátek.mp3", "02 Konec.mp3"]
    assert seen[0] == "Kapitola 1. Žluťoučký začátek." and "[obrázek]" not in " ".join(seen)
    data = files[0].read_bytes()
    assert data[:3] == b"ID3" and "Kůň a louka".encode("utf-16-le") in data and b"APIC" in data
    assert b"\xff\xfb" in data[:4000] or b"\xff\xf3" in data[:4000]  # rámec MP3 za štítkem
    m3u = (tmp_path / "Kůň a louka – audiokniha" / "Kůň a louka.m3u").read_text(encoding="utf-8")
    assert m3u.splitlines()[0] == "#EXTM3U" and "02 Konec.mp3" in m3u


def test_only_three_voices_and_clear_errors(monkeypatch):
    assert set(ab.VOICES) == {"jirka", "vlasta", "antonin", "chirp_kore", "chirp_aoede", "chirp_charon", "chirp_puck"}
    with pytest.raises(ab.AudiobookError, match="Google Chirp 3 HD"):
        ab.make_synth("google")
    with pytest.raises(ab.AudiobookError, match="Google Cloud"):
        ab.make_synth("chirp_kore", 1.0, {})
    with pytest.raises(ab.AudiobookError, match="Azure"):
        ab.make_synth("vlasta", 1.0, {})
    import tts_win
    monkeypatch.setattr(tts_win, "piper_exe", lambda: None)
    with pytest.raises(ab.AudiobookError, match="Jirka není stažený"):
        ab.make_synth("jirka")


def test_cancel(tmp_path):
    import threading
    ev = threading.Event()
    ev.set()
    with pytest.raises(ab.AudiobookError, match="Zastaveno"):
        ab.make_audiobook(PROJ, tmp_path, tone_synth([]), cancel=ev, log=lambda *_: None)
