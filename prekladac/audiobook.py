"""Audiokniha: celá kniha namluvená po kapitolách do MP3 (s názvem, autorem, číslem kapitoly a obálkou)
a seznam skladeb .m3u. Jen hlasy Jirka (Piper, bez internetu), Vlasta a Antonín (Microsoft Azure).

Azure je zdarma 500 000 znaků měsíčně (úroveň F0) – průměrná kniha má 300 000–700 000 znaků, proto program
před namluvením ukáže počet znaků. Jirka běží v počítači, zdarma a bez omezení.
"""
from __future__ import annotations

import re
import struct
import tempfile
import wave
from pathlib import Path

VOICES = {
    "jirka": {"name": "Jirka", "info": "bez internetu, zdarma", "kind": "piper",
              "model": "cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium"},
    "vlasta": {"name": "Vlasta", "info": "Microsoft Azure, přirozený ženský hlas", "kind": "azure",
               "voice": "cs-CZ-VlastaNeural"},
    "antonin": {"name": "Antonín", "info": "Microsoft Azure, přirozený mužský hlas", "kind": "azure",
                "voice": "cs-CZ-AntoninNeural"},
}
AZURE_FREE_CHARS = 500_000
PARA_PAUSE, TITLE_PAUSE = 0.45, 1.0  # sekundy ticha za odstavcem a za názvem kapitoly


class AudiobookError(Exception):
    pass


def chapter_texts(project: dict) -> list[tuple[str, list[str]]]:
    """[(název kapitoly, [odstavce])] – bez značek obrázků a zalomení stránek."""
    titles = (project.get("outline") or {}).get("chapters") or []
    out = []
    for i, ch in enumerate(project.get("chapters") or []):
        title = (titles[i]["title"] if i < len(titles) else "") or f"Kapitola {i + 1}"
        text = (ch.get("text") or "").replace("[[STRANA]]", "")
        paras = [re.sub(r"\s+", " ", p.replace("[obrázek]", "")).strip() for p in re.split(r"\n\s*\n", text)]
        out.append((title, [p for p in paras if p]))
    return out


def count_chars(project: dict, chapters: list[int] | None = None) -> int:
    chs = chapter_texts(project)
    idx = chapters if chapters is not None else range(len(chs))
    return sum(len(chs[i][0]) + sum(len(p) for p in chs[i][1]) for i in idx if i < len(chs))


def _read_wav(path: str) -> tuple[tuple, bytes]:
    with wave.open(path, "rb") as w:
        return (w.getnchannels(), w.getsampwidth(), w.getframerate()), w.readframes(w.getnframes())


def _silence(params: tuple, seconds: float) -> bytes:
    ch, width, rate = params
    return b"\x00" * int(rate * seconds) * ch * width


def chapter_pcm(title: str, paras: list[str], synth, number: int, cancel=None) -> tuple[tuple, bytes]:
    """Namluví kapitolu (název + odstavce) a vrátí (parametry zvuku, PCM)."""
    import tts_win

    params, chunks = None, []
    pieces: list[tuple[str, float]] = [(f"Kapitola {number}. {title}.", TITLE_PAUSE)]
    for p in paras:
        parts = tts_win.split_for_voice(p, 2500)
        pieces += [(t, 0.15) for t in parts[:-1]] + [(parts[-1], PARA_PAUSE)]
    with tempfile.TemporaryDirectory() as tmp:
        for k, (text, pause) in enumerate(pieces):
            if cancel is not None and cancel.is_set():
                raise AudiobookError("Zastaveno.")
            out = str(Path(tmp) / f"{k}.wav")
            synth(text, out)
            pr, pcm = _read_wav(out)
            if params is None:
                params = pr
            elif pr != params:
                raise AudiobookError("Hlas vrátil zvuk v jiném formátu – zkuste to znovu.")
            chunks += [pcm, _silence(params, pause)]
    return params, b"".join(chunks)


def encode_mp3(params: tuple, pcm: bytes, bitrate: int = 96) -> bytes | None:
    """PCM → MP3 (knihovna lameenc). None = knihovna chybí (uloží se WAV)."""
    try:
        import lameenc
    except ImportError:
        return None
    ch, width, rate = params
    if width != 2:
        raise AudiobookError("Nepodporovaný formát zvuku.")
    enc = lameenc.Encoder()
    enc.set_bit_rate(bitrate)
    enc.set_in_sample_rate(rate)
    enc.set_channels(ch)
    enc.set_quality(2)
    return bytes(enc.encode(pcm)) + bytes(enc.flush())


def _id3_frame(fid: str, data: bytes) -> bytes:
    return fid.encode("ascii") + struct.pack(">I", len(data)) + b"\x00\x00" + data


def _txt(fid: str, text: str) -> bytes:
    """Textový rámec ID3v2.3 v UTF-16 (s BOM) – diakritika se ve všech přehrávačích ukáže správně."""
    return _id3_frame(fid, b"\x01\xff\xfe" + text.encode("utf-16-le"))


def id3_tag(title: str, artist: str, album: str, track: int, total: int, cover: bytes | None = None) -> bytes:
    """Štítek ID3v2.3 (přehrávače ukážou název kapitoly, autora, knihu, číslo a obálku)."""
    frames = (_txt("TIT2", title) + _txt("TPE1", artist or "") + _txt("TALB", album) + _txt("TRCK", f"{track}/{total}")
              + _txt("TCON", "Audiobook"))
    if cover:
        mime = b"image/png" if cover[:4] == b"\x89PNG" else b"image/jpeg"
        frames += _id3_frame("APIC", b"\x00" + mime + b"\x00\x03" + b"Obalka\x00" + cover)
    size = len(frames)
    syncsafe = bytes([(size >> 21) & 0x7F, (size >> 14) & 0x7F, (size >> 7) & 0x7F, size & 0x7F])
    return b"ID3\x03\x00\x00" + syncsafe + frames


def safe_name(s: str) -> str:
    return re.sub(r'[\\/:*?"<>|]+', "_", s or "kniha").strip().rstrip(".")[:70] or "kniha"


def make_synth(voice: str, rate: float = 1.0, engines: dict | None = None):
    """Funkce text → WAV pro zvolený hlas (jen Jirka, Vlasta, Antonín)."""
    import tts_win

    v = VOICES.get(voice)
    if not v:
        raise AudiobookError("Audioknihu namluví jen Jirka, Vlasta nebo Antonín.")
    if v["kind"] == "piper":
        model = str(tts_win.piper_model_path(v["model"]))
        if not tts_win.piper_exe() or not Path(model).is_file():
            raise AudiobookError("Hlas Jirka není stažený – ve čtečce klikněte na Nahlas → stáhnout český hlas Jirka.")
        return lambda text, out: tts_win.piper_synthesize(text, model, rate, out, timeout=900)
    tts_win.configure_cloud(engines or {})
    if "azure" not in tts_win._cloud:
        raise AudiobookError("Hlasy Vlasta a Antonín potřebují klíč Microsoft Azure – Nastavení → Služby a klíče → "
                             "Hlasy Microsoft Azure (je tam Návod).")
    return lambda text, out: tts_win.cloud_synthesize(text, "azure", v["voice"], rate, out)


def make_audiobook(project: dict, out_dir: str | Path, synth, chapters: list[int] | None = None, bitrate: int = 96,
                   cover: bytes | None = None, log=print, progress=lambda f: None, cancel=None) -> list[Path]:
    """Namluví vybrané kapitoly do MP3 (jedna kapitola = jeden soubor) a uloží seznam skladeb. Vrátí soubory."""
    chs = chapter_texts(project)
    idx = [i for i in (chapters if chapters is not None else range(len(chs))) if 0 <= i < len(chs) and chs[i][1]]
    if not idx:
        raise AudiobookError("Kniha nemá žádný text k namluvení.")
    book = (project.get("outline") or {}).get("title") or "Kniha"
    author = project.get("author", "")
    folder = Path(out_dir) / f"{safe_name(book)} – audiokniha"
    folder.mkdir(parents=True, exist_ok=True)
    files: list[Path] = []
    total = len(chs)
    for k, i in enumerate(idx):
        title, paras = chs[i]
        log(f"🎧 Kapitola {i + 1}/{total}: {title}…")
        params, pcm = chapter_pcm(title, paras, synth, i + 1, cancel)
        mp3 = encode_mp3(params, pcm, bitrate)
        name = f"{i + 1:02d} {safe_name(title)}"
        if mp3 is None:
            path = folder / f"{name}.wav"
            with wave.open(str(path), "wb") as w:
                w.setnchannels(params[0])
                w.setsampwidth(params[1])
                w.setframerate(params[2])
                w.writeframes(pcm)
        else:
            path = folder / f"{name}.mp3"
            path.write_bytes(id3_tag(f"{i + 1}. {title}", author, book, i + 1, total, cover)
                             + mp3)
        files.append(path)
        seconds = len(pcm) / (params[0] * params[1] * params[2])
        log(f"   ✓ {path.name} ({int(seconds // 60)} min {int(seconds % 60)} s)")
        progress((k + 1) / len(idx))
    playlist = folder / f"{safe_name(book)}.m3u"
    playlist.write_text("#EXTM3U\n" + "".join(f"#EXTINF:-1,{f.stem}\n{f.name}\n" for f in files), encoding="utf-8")
    return files
