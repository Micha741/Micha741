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
        if ext == ".onnx.json":
            fix_piper_config(target)
    log(f"  ✓ hlas {name} je připravený")
    return next(v for v in piper_installed(lang) if v["name"].endswith(model.rsplit("/", 1)[-1]))


def fix_piper_config(path: Path) -> bool:
    """Program Piper (verze pro Windows) neumí v nastavení hlasu fonémy z více znaků (např. „aɪ“) a skončí chybou
    „is not a single codepoint“. Takové zápisy se vynechají – čeština je při čtení nepoužívá. True = upraveno."""
    import json

    try:
        cfg = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    ids = cfg.get("phoneme_id_map") or {}
    bad = [k for k in ids if len(k) != 1]
    if not bad:
        return False
    for k in bad:
        del ids[k]
    path.write_text(json.dumps(cfg, ensure_ascii=False), encoding="utf-8")
    return True


def piper_synthesize(text: str, model: str, rate: float, out: str) -> None:
    """Text → WAV hlasem Piper (rychlost: 1 = normální, 1.5 = rychleji)."""
    exe = piper_exe()
    if exe is None:
        raise RuntimeError("Program Piper není stažený.")
    fix_piper_config(Path(model + ".json"))  # i u hlasu staženého dřív
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


# ------------------------------------------------------------------ přirozené hlasy na internetu (klíč v Nastavení)
CLOUD_PREFIX = "cloud:"
# jazyk → (služba, hlas, jméno, pohlaví)
CLOUD_VOICES = {
    "cs": [("azure", "cs-CZ-VlastaNeural", "Vlasta", "žena"), ("azure", "cs-CZ-AntoninNeural", "Antonín", "muž"),
           ("google", "cs-CZ-Wavenet-A", "Google Wavenet", "žena")],
    "sk": [("azure", "sk-SK-ViktoriaNeural", "Viktória", "žena"), ("azure", "sk-SK-LukasNeural", "Lukáš", "muž"),
           ("google", "sk-SK-Wavenet-A", "Google Wavenet", "žena")],
    "en": [("azure", "en-US-AvaNeural", "Ava", "žena"), ("azure", "en-US-AndrewNeural", "Andrew", "muž"),
           ("google", "en-US-Wavenet-F", "Google Wavenet", "žena")],
    "de": [("azure", "de-DE-KatjaNeural", "Katja", "žena"), ("azure", "de-DE-ConradNeural", "Conrad", "muž"),
           ("google", "de-DE-Wavenet-C", "Google Wavenet", "žena")],
}
_cloud: dict = {}  # klíče z Nastavení (v paměti, na disk je ukládá program šifrovaně)


def configure_cloud(engines: dict) -> None:
    """Klíče hlasů z nastavení programu (engines = cfg["engines"])."""
    az = engines.get("azure_speech") or {}
    gk = (engines.get("google_tts") or {}).get("api_key") or (engines.get("google_cloud") or {}).get("api_key") or ""
    _cloud.clear()
    if az.get("api_key") and az.get("region"):
        _cloud["azure"] = (az["api_key"].strip(), az["region"].strip().lower().replace(" ", ""))
    if gk.strip():  # vlastní klíč, jinak klíč Google Cloud Translation (v projektu musí být zapnuté Text-to-Speech)
        _cloud["google"] = (gk.strip(),)


def cloud_voices(lang: str | None = None) -> list[dict]:
    """Přirozené hlasy služeb, které mají v Nastavení klíč."""
    out = []
    for code, voices in CLOUD_VOICES.items():
        if lang and code != lang:
            continue
        for svc, vid, name, gender in voices:
            if svc in _cloud:
                out.append({"name": f"{CLOUD_PREFIX}{svc}:{vid}", "label": f"{name} ({'Azure' if svc == 'azure' else 'Google'}, "
                            "přirozený, online)", "lang": code, "gender": gender})
    return out


def _escape(t: str) -> str:
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def cloud_synthesize(text: str, service: str, voice: str, rate: float, out: str) -> None:
    """Text → WAV přirozeným hlasem Azure nebo Google (potřebuje internet a klíč)."""
    import base64
    import json

    from free_engines import EngineError, http_request

    if service not in _cloud:
        raise EngineError("Chybí klíč – ⚙ Nastavení → Služby a klíče → Hlasy " +
                          ("Microsoft Azure" if service == "azure" else "Google Cloud"))
    pct = round((max(0.5, min(2.0, rate)) - 1) * 100)
    if service == "azure":
        key, region = _cloud["azure"]
        lang = voice[:5]
        ssml = (f"<speak version='1.0' xml:lang='{lang}'><voice name='{voice}'><prosody rate='{pct:+d}%'>"
                f"{_escape(text)}</prosody></voice></speak>")
        data = http_request(f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
                            data=ssml.encode("utf-8"), method="POST", timeout=60, retries=2, service="Hlas Azure",
                            headers={"Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml",
                                     "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm"})
    else:
        (key,) = _cloud["google"]
        body = {"input": {"text": text}, "voice": {"languageCode": voice[:5], "name": voice},
                "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": 24000,
                                "speakingRate": max(0.5, min(2.0, rate))}}
        res = json.loads(http_request("https://texttospeech.googleapis.com/v1/text:synthesize?key=" + key,
                                      data=body, method="POST", timeout=60, retries=2, service="Hlas Google"))
        data = base64.b64decode(res.get("audioContent") or "")
    if not data.startswith(b"RIFF"):
        raise EngineError("Služba nevrátila zvuk.")
    Path(out).write_bytes(data)


def split_for_voice(text: str, limit: int = 1200) -> list[str]:
    """Dlouhý odstavec na kratší kusy podle vět (služby mají limit délky a kratší kus začne hrát dřív)."""
    import re as _re

    if len(text) <= limit:
        return [text]
    parts, cur = [], ""
    for sent in _re.split(r"(?<=[.!?…])\s+", text):
        while len(sent) > limit:  # extrémně dlouhá „věta“ bez teček
            cut = sent.rfind(" ", 0, limit)
            cut = cut if cut > limit // 2 else limit
            if cur:
                parts.append(cur)
                cur = ""
            parts.append(sent[:cut])
            sent = sent[cut:].lstrip()
        if cur and len(cur) + 1 + len(sent) > limit:
            parts.append(cur)
            cur = sent
        else:
            cur = f"{cur} {sent}".strip()
    if cur:
        parts.append(cur)
    return parts


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
        self._pause = threading.Event()
        self._thread: threading.Thread | None = None
        self.error = ""
        self._voice, self._by_lang, self._by_name = None, {}, {}
        self._gen = self._cur = 0

    player_cls = WavPlayer

    def _halted(self) -> bool:
        """Zastaveno (stop) – platí jen pro větu, která se čte teď, ne pro nově zadanou."""
        return self._cur != self._gen

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
            text, lang, rate, on_done, name, self._cur = cmd
            if self._cur != self._gen:  # zastaveno dřív, než na větu přišla řada
                continue
            self.error = ""
            try:
                piper = None
                if name and name.startswith(CLOUD_PREFIX):
                    _p, svc, vid = name.split(":", 2)
                    for part in split_for_voice(text):
                        if self._halted():
                            break
                        self._speak_file(lambda out, t=part: cloud_synthesize(t, svc, vid, rate, out))
                    name = None
                    piper = False
                elif name and name.startswith(PIPER_PREFIX):
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
                if piper is False:
                    pass  # přečteno hlasem z internetu
                elif piper is not None:
                    self._speak_piper(text, piper["model"], rate)
                else:
                    self._speak_sapi(text, lang, rate, name)
            except Exception as e:  # noqa: BLE001
                self.error = f"Hlas není k dispozici: {e}"
            if not self._halted() and on_done:
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
            if self._halted():
                if paused:
                    voice.Resume()
                voice.Speak("", 3)  # přerušit (SVSFPurgeBeforeSpeak | async)
                break
            if self._pause.is_set() != paused:  # pozastavit / pokračovat přesně tam, kde hlas skončil
                paused = self._pause.is_set()
                voice.Pause() if paused else voice.Resume()

    def _speak_piper(self, text, model, rate):
        self._speak_file(lambda out: piper_synthesize(text, model, rate, out))

    def _speak_file(self, synth):
        """synth(cesta) vytvoří WAV; přehraje se s pozastavením a pokračováním."""
        tmp = Path(tempfile.gettempdir()) / f"prekladac_tts_{os.getpid()}_{threading.get_ident()}"
        wav, rest = str(tmp) + ".wav", str(tmp) + "_dal.wav"
        synth(wav)
        if self._halted():
            return
        player = self.player_cls()
        total, done = wav_seconds(wav), 0.0
        player.play(wav)
        started = time.monotonic()
        while True:
            if self._halted():
                player.stop()
                return
            if self._pause.is_set():
                player.stop()
                done += time.monotonic() - started
                while self._pause.is_set() and not self._halted():
                    time.sleep(0.05)
                if self._halted():
                    return
                player.play(wav_tail(wav, done, rest))  # pokračovat tam, kde se skončilo
                started = time.monotonic()
            if done + time.monotonic() - started >= total + 0.05:
                return
            time.sleep(0.04)

    def speak(self, text: str, lang: str, rate: float, on_done: Callable[[], None] | None = None,
              voice_name: str | None = None):
        self._pause.clear()
        if self._thread is None or not self._thread.is_alive():
            self._thread = threading.Thread(target=self._run, daemon=True)
            self._thread.start()
        self._q.put((text, lang, rate, on_done, voice_name, self._gen))

    def pause(self):
        self._pause.set()

    def resume(self):
        self._pause.clear()

    def stop(self):
        self._gen += 1
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
    out = cloud_voices() + [{"name": v["name"], "label": v["label"], "lang": v["lang"], "gender": v["gender"]}
                            for v in piper_installed()]
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


def has_voice(lang: str) -> bool | None:
    """Je pro jazyk hlas (Windows nebo stažený Piper)? None = nelze zjistit."""
    return Speaker.has_voice(None, lang)  # metoda nepoužívá stav mluvčího
