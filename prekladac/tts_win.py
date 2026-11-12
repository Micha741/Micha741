"""Čtení nahlas ve Windows hlasy systému (SAPI 5) – bez internetu, bez dalších programů.

Hlas běží ve vlastním vlákně (COM objekt SAPI musí žít ve vlákně, které ho vytvořilo).
Mimo Windows (testy v Linuxu) je čtení nahlas nedostupné – available() vrátí False.
"""
from __future__ import annotations

import queue
import sys
import threading
from typing import Callable

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


class Speaker:
    """speak(text, lang, rate, on_done) – asynchronně; stop() přeruší. on_done se volá z vlákna hlasu."""

    def __init__(self):
        self._q: queue.Queue = queue.Queue()
        self._stop = threading.Event()
        self._pause = threading.Event()
        self._thread: threading.Thread | None = None
        self.error = ""

    def _run(self):
        try:
            import comtypes
            import comtypes.client

            comtypes.CoInitialize()
            voice = comtypes.client.CreateObject("SAPI.SpVoice", dynamic=True)
        except Exception as e:  # noqa: BLE001
            self.error = f"Hlas Windows není k dispozici: {e}"
            return
        voices, by_name = {}, {}
        try:
            tokens = voice.GetVoices()
            for i in range(tokens.Count):
                t = tokens.Item(i)
                lang = str(t.GetAttribute("Language") or "").lower().split(";")[0]
                voices.setdefault(lang, t)
                by_name[str(t.GetAttribute("Name") or "")] = t
        except Exception:  # noqa: BLE001
            pass
        while True:
            cmd = self._q.get()
            if cmd is None:
                return
            text, lang, rate, on_done, name = cmd
            try:
                tok = by_name.get(name or "") or voices.get(LCID.get(lang, ""))
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
            except Exception as e:  # noqa: BLE001
                self.error = str(e)
            if not self._stop.is_set() and on_done:
                on_done()

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
        """Je ve Windows hlas pro jazyk? None = nelze zjistit."""
        if not available():
            return None
        try:
            import comtypes.client

            v = comtypes.client.CreateObject("SAPI.SpVoice", dynamic=True)
            tokens = v.GetVoices()
            want = LCID.get(lang, "")
            return any(str(tokens.Item(i).GetAttribute("Language") or "").lower().split(";")[0] == want
                       for i in range(tokens.Count))
        except Exception:  # noqa: BLE001
            return None


def list_voices() -> list[dict]:
    """Hlasy Windows: jméno, jazyk (cs, en…), pohlaví (žena/muž). Prázdné mimo Windows."""
    if not available():
        return []
    out = []
    try:
        import comtypes.client

        v = comtypes.client.CreateObject("SAPI.SpVoice", dynamic=True)
        tokens = v.GetVoices()
        code_of = {lcid: code for code, lcid in LCID.items()}
        for i in range(tokens.Count):
            t = tokens.Item(i)
            lcid = str(t.GetAttribute("Language") or "").lower().split(";")[0]
            g = str(t.GetAttribute("Gender") or "").lower()
            out.append({"name": str(t.GetAttribute("Name") or f"Hlas {i + 1}"), "lang": code_of.get(lcid, lcid),
                        "gender": "žena" if g == "female" else "muž" if g == "male" else ""})
    except Exception:  # noqa: BLE001
        return []
    return out
