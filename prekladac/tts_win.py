"""Čtení nahlas ve Windows – bez internetu.

Hlasy:
- hlasy Windows (SAPI 5) a „moderní“ hlasy Windows 10/11 (OneCore – např. český Microsoft Jakub,
  který se přidá v Nastavení Windows → Čas a jazyk → Řeč → Přidat hlasy → Čeština);
- Piper – volně šiřitelné hlasy, které program stáhne (český hlas Jirka, slovenský Lili); běží v počítači.

Hlas běží ve vlastním vlákně (COM objekt SAPI musí žít ve vlákně, které ho vytvořilo).
Mimo Windows (testy v Linuxu) jsou hlasy Windows nedostupné – available() vrátí False.
"""
from __future__ import annotations

import os
import queue
import subprocess
import sys
import tempfile
import threading
import time
import wave
from pathlib import Path
from typing import Callable

# „moderní“ hlasy Windows 10/11 nejsou v seznamu SAPI 5 – jsou v této větvi registru
ONECORE = r"HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech_OneCore\Voices"
PIPER_PREFIX = "piper:"
PIPER_ZIP = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip"
PIPER_VOICES_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/"
# jazyk → (model, jméno, pohlaví, velikost v MB)
PIPER_VOICES = {
    "cs": [("cs/cs_CZ/jirka/medium/cs_CZ-jirka-medium", "Jirka", "muž", 63)],
    "sk": [("sk/sk_SK/lili/medium/sk_SK-lili-medium", "Lili", "žena", 63)],
}
_NO_WINDOW = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0

# kód jazyka knihy → LCID hlasu Windows (atribut Language tokenu SAPI, šestnáctkově)
LCID = {"cs": "405", "sk": "41b", "en": "409", "de": "407", "pl": "415", "fr": "40c", "es": "c0a", "it": "410",
        "ru": "419", "uk": "422", "hu": "40e"}


def available() -> bool:
    if sys.platform != "win32":
        return False
    try:
        import comtypes.client  # noqa: F401
        return True
    except Exception:  # noqa: BLE001
        return False


def _all_tokens(voice) -> list:
    """Hlasy SAPI 5 + hlasy OneCore (Windows 10/11), bez dvojic se stejným jménem."""
    out, names = [], set()
    groups = []
    try:
        groups.append(voice.GetVoices())
    except Exception:  # noqa: BLE001
        pass
    try:
        import comtypes.client

        cat = comtypes.client.CreateObject("SAPI.SpObjectTokenCategory", dynamic=True)
        cat.SetId(ONECORE, False)
        groups.append(cat.EnumerateTokens())
    except Exception:  # noqa: BLE001 – starší Windows bez OneCore
        pass
    for tokens in groups:
        try:
            for i in range(tokens.Count):
                t = tokens.Item(i)
                name = str(t.GetAttribute("Name") or "")
                if name and name not in names:
                    names.add(name)
                    out.append(t)
        except Exception:  # noqa: BLE001
            continue
    return out


# ------------------------------------------------------------------ Piper (stažené hlasy)
def piper_dir() -> Path:
    base = os.environ.get("APPDATA") or os.path.expanduser("~")
    return Path(base) / "Prekladac" / "piper"


def piper_exe() -> Path | None:
    for p in (piper_dir() / "piper" / "piper.exe", piper_dir() / "piper.exe", piper_dir() / "piper" / "piper"):
        if p.is_file():
            return p
    return None


def piper_model_path(model: str) -> Path:
    return piper_dir() / "voices" / (model.rsplit("/", 1)[-1] + ".onnx")


def piper_installed(lang: str | None = None) -> list[dict]:
    """Stažené hlasy Piper (jen když je stažený i program piper)."""
    if piper_exe() is None:
        return []
    out = []
    for code, voices in PIPER_VOICES.items():
        if lang and code != lang:
            continue
        for model, name, gender, _mb in voices:
            if piper_model_path(model).is_file():
                out.append({"name": PIPER_PREFIX + model.rsplit("/", 1)[-1], "label": f"{name} (Piper)",
                            "lang": code, "gender": gender, "model": str(piper_model_path(model))})
    return out


def download_piper(lang: str, log: Callable[[str], None]) -> dict:
    """Stáhne program Piper (jednou, ~22 MB) a hlas pro jazyk (~63 MB). Vrátí údaje hlasu."""
    import io
    import zipfile

    from free_engines import EngineError, http_request

    voices = PIPER_VOICES.get(lang)
    if not voices:
        raise EngineError(f"Pro jazyk „{lang}“ zatím není hlas ke stažení.")
    model, name, _g, mb = voices[0]
    d = piper_dir()
    d.mkdir(parents=True, exist_ok=True)
    if piper_exe() is None:
        log("Stahuji program pro čtení nahlas Piper (asi 22 MB)…")
        data = http_request(PIPER_ZIP, timeout=600, service="Stažení hlasu", retries=2)
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            z.extractall(d)
        if piper_exe() is None:
            raise EngineError("V balíčku Piper chybí piper.exe.")
    dst = piper_model_path(model)
    dst.parent.mkdir(parents=True, exist_ok=True)
    for ext, minimum in ((".onnx.json", 500), (".onnx", 1_000_000)):
        target = dst.with_name(dst.stem + ext)
        if target.is_file() and target.stat().st_size >= minimum:
            continue
        log(f"Stahuji hlas {name} ({'asi %d MB' % mb if ext == '.onnx' else 'nastavení'})…")
        data = http_request(PIPER_VOICES_URL + model + ext + "?download=true", timeout=900,
                            service="Stažení hlasu", retries=2)
        if len(data) < minimum:
            raise EngineError(f"Hlas {name} se nepodařilo stáhnout (soubor je příliš malý).")
        tmp = target.with_suffix(target.suffix + ".part")
        tmp.write_bytes(data)
        tmp.replace(target)
    log(f"  ✓ hlas {name} je připravený")
    return next(v for v in piper_installed(lang) if v["name"].endswith(model.rsplit("/", 1)[-1]))


def piper_synthesize(text: str, model: str, rate: float, out: str) -> None:
    """Text → WAV hlasem Piper (rychlost: 1 = normální, 1.5 = rychleji)."""
    exe = piper_exe()
    if exe is None:
        raise RuntimeError("Program Piper není stažený.")
    cmd = [str(exe), "--model", model, "--output_file", out,
           "--length_scale", f"{1 / max(0.3, min(3.0, rate)):.2f}", "--sentence_silence", "0.25"]
    r = subprocess.run(cmd, input=text.replace("\n", " ").encode("utf-8"), capture_output=True,
                       timeout=300, creationflags=_NO_WINDOW, cwd=str(exe.parent))
    if r.returncode != 0 or not Path(out).is_file():
        raise RuntimeError("Piper: " + (r.stderr.decode("utf-8", "replace").strip()[-300:] or "neznámá chyba"))


def wav_seconds(path: str) -> float:
    with wave.open(path, "rb") as w:
        return w.getnframes() / float(w.getframerate() or 1)


def wav_tail(path: str, start: float, out: str) -> str:
    """Kopie WAV od času start (s) – pro pokračování po pozastavení."""
    with wave.open(path, "rb") as w:
        params = w.getparams()
        w.setpos(min(w.getnframes(), int(start * w.getframerate())))
        frames = w.readframes(w.getnframes())
    with wave.open(out, "wb") as o:
        o.setparams(params)
        o.writeframes(frames)
    return out


class WavPlayer:
    """Přehrání WAV ve Windows (winsound) – asynchronně, s ukončením."""

    def play(self, path: str):
        import winsound

        winsound.PlaySound(path, winsound.SND_FILENAME | winsound.SND_ASYNC | winsound.SND_NODEFAULT)

    def stop(self):
        import winsound

        winsound.PlaySound(None, 0)


class Speaker:
    """speak(text, lang, rate, on_done) – asynchronně; stop() přeruší. on_done se volá z vlákna hlasu."""

    def __init__(self):
        self._q: queue.Queue = queue.Queue()
        self._stop = threading.Event()
        self._pause = threading.Event()
        self._thread: threading.Thread | None = None
        self.error = ""
        self._voice, self._by_lang, self._by_name = None, {}, {}

    player_cls = WavPlayer

    def _sapi(self):
        """Hlas Windows (SAPI) – vytvoří se až při prvním použití, ve vlákně hlasu."""
        if self._voice is None:
            import comtypes
            import comtypes.client

            comtypes.CoInitialize()
            self._voice = comtypes.client.CreateObject("SAPI.SpVoice", dynamic=True)
            for t in _all_tokens(self._voice):
                lang = str(t.GetAttribute("Language") or "").lower().split(";")[0]
                self._by_lang.setdefault(lang, t)
                self._by_name[str(t.GetAttribute("Name") or "")] = t
        return self._voice

    def _run(self):
        self._voice, self._by_lang, self._by_name = None, {}, {}
        while True:
            cmd = self._q.get()
            if cmd is None:
                return
            text, lang, rate, on_done, name = cmd
            try:
                piper = None
                if name and name.startswith(PIPER_PREFIX):
                    piper = next((v for v in piper_installed() if v["name"] == name), None)
                elif not name and not available():  # bez hlasů Windows: stažený hlas pro jazyk knihy
                    piper = next(iter(piper_installed(lang)), None)
                if piper is None and not name:
                    try:  # hlas Windows pro jazyk knihy chybí → stažený hlas Piper
                        self._sapi()
                        if LCID.get(lang, "") not in self._by_lang:
                            piper = next(iter(piper_installed(lang)), None)
                    except Exception:  # noqa: BLE001
                        piper = next(iter(piper_installed(lang)), None)
                if piper is not None:
                    self._speak_piper(text, piper["model"], rate)
                else:
                    self._speak_sapi(text, lang, rate, name)
            except Exception as e:  # noqa: BLE001
                self.error = f"Hlas není k dispozici: {e}"
            if not self._stop.is_set() and on_done:
                on_done()

    def _speak_sapi(self, text, lang, rate, name):
        voice = self._sapi()
        tok = self._by_name.get(name or "") or self._by_lang.get(LCID.get(lang, ""))
        if tok is not None:
            voice.Voice = tok
        voice.Rate = max(-10, min(10, round((rate - 1) * 10)))
        voice.Speak(text, 1)  # SVSFlagsAsync
        paused = False
        while not voice.WaitUntilDone(80):
            if self._stop.is_set():
                if paused:
                    voice.Resume()
                voice.Speak("", 3)  # přerušit (SVSFPurgeBeforeSpeak | async)
                break
            if self._pause.is_set() != paused:  # pozastavit / pokračovat přesně tam, kde hlas skončil
                paused = self._pause.is_set()
                voice.Pause() if paused else voice.Resume()

    def _speak_piper(self, text, model, rate):
        tmp = Path(tempfile.gettempdir()) / f"prekladac_tts_{os.getpid()}_{threading.get_ident()}"
        wav, rest = str(tmp) + ".wav", str(tmp) + "_dal.wav"
        piper_synthesize(text, model, rate, wav)
        if self._stop.is_set():
            return
        player = self.player_cls()
        total, done = wav_seconds(wav), 0.0
        player.play(wav)
        started = time.monotonic()
        while True:
            if self._stop.is_set():
                player.stop()
                return
            if self._pause.is_set():
                player.stop()
                done += time.monotonic() - started
                while self._pause.is_set() and not self._stop.is_set():
                    time.sleep(0.05)
                if self._stop.is_set():
                    return
                player.play(wav_tail(wav, done, rest))  # pokračovat tam, kde se skončilo
                started = time.monotonic()
            if done + time.monotonic() - started >= total + 0.05:
                return
            time.sleep(0.04)

    def speak(self, text: str, lang: str, rate: float, on_done: Callable[[], None] | None = None,
              voice_name: str | None = None):
        self._stop.clear()
        self._pause.clear()
        if self._thread is None or not self._thread.is_alive():
            self._thread = threading.Thread(target=self._run, daemon=True)
            self._thread.start()
        self._q.put((text, lang, rate, on_done, voice_name))

    def pause(self):
        self._pause.set()

    def resume(self):
        self._pause.clear()

    def stop(self):
        self._stop.set()
        self._pause.clear()
        while not self._q.empty():
            try:
                self._q.get_nowait()
            except queue.Empty:
                break

    def has_voice(self, lang: str) -> bool | None:
        """Je pro jazyk hlas (Windows nebo stažený Piper)? None = nelze zjistit."""
        if piper_installed(lang):
            return True
        if not available():
            return None
        try:
            import comtypes.client

            v = comtypes.client.CreateObject("SAPI.SpVoice", dynamic=True)
            want = LCID.get(lang, "")
            return any(str(t.GetAttribute("Language") or "").lower().split(";")[0] == want for t in _all_tokens(v))
        except Exception:  # noqa: BLE001
            return None


def list_voices() -> list[dict]:
    """Hlasy: jméno, popis, jazyk (cs, en…), pohlaví (žena/muž). Hlasy Windows i stažené hlasy Piper."""
    out = [{"name": v["name"], "label": v["label"], "lang": v["lang"], "gender": v["gender"]} for v in piper_installed()]
    if not available():
        return out
    try:
        import comtypes.client

        v = comtypes.client.CreateObject("SAPI.SpVoice", dynamic=True)
        code_of = {lcid: code for code, lcid in LCID.items()}
        for i, t in enumerate(_all_tokens(v)):
            lcid = str(t.GetAttribute("Language") or "").lower().split(";")[0]
            g = str(t.GetAttribute("Gender") or "").lower()
            name = str(t.GetAttribute("Name") or f"Hlas {i + 1}")
            out.append({"name": name, "label": name, "lang": code_of.get(lcid, lcid),
                        "gender": "žena" if g == "female" else "muž" if g == "male" else ""})
    except Exception:  # noqa: BLE001
        pass
    return out


def any_voice() -> bool:
    return available() or bool(piper_installed())
