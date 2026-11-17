"""Vlastní hlas (offline, zdarma): nahrávací studio, příprava dat pro trénování a import hotového hlasu Piper.

Postup: 1) nahrajete věty (asi 300–1000, dá se po částech), 2) „Export pro trénování“ vytvoří ZIP (formát LJSpeech:
wavs/*.wav a metadata.csv), 3) v Google Colab (zdarma, v prohlížeči) se z něj dotrénuje hlas z Jirky,
4) stažený hlas (.onnx + .onnx.json) se importuje a objeví se ve čtečce i v audioknize. Vše běží bez internetu.
"""
from __future__ import annotations

import array
import json
import re
import shutil
import wave
import zipfile
from pathlib import Path

import components

SAMPLE_RATE = 22050  # stejně jako hlasy Piper „medium“

# úvodní věty: všechny české hlásky (ř, ě, ů, ch, ď, ť, ň…), otázky, zvolání, delší i kratší
STARTER = [
    "Příliš žluťoučký kůň úpěl ďábelské ódy.",
    "Dobrý den, jmenuji se a tohle je můj vlastní hlas.",
    "Večer jsme seděli u ohně a poslouchali, jak venku tiše prší.",
    "Kde jsi byl celý den? Hledali jsme tě všude!",
    "Na stole ležela stará kniha s ohmatanými rohy.",
    "Řeka se klikatila mezi poli a lesy až k obzoru.",
    "Děti běžely přes louku a smály se na celé kolo.",
    "Třináct tisíc tři sta třicet tři stříbrných stříkaček stříkalo přes třináct tisíc tři sta třicet tři stříbrných střech.",
    "Ťuky ťuky, kdo je za dveřmi?",
    "Ňadra, ďábel, šťastný, čtvrť a smrž jsou slova s obtížnou výslovností.",
    "Chtěl bych si koupit chléb, mléko a trochu sýra.",
    "Vítr hučel v komíně a okenice skřípaly.",
    "To je přece úžasné, nikdy jsem nic podobného neviděl.",
    "Babička vyprávěla pohádky, dokud jsme neusnuli.",
    "Zítra ráno vyrazíme vlakem do hor.",
    "Mlčky se na mě podívala a pak se usmála.",
    "Ve sklepě bylo chladno a vonělo to jablky.",
    "Pes zaštěkal, kočka vyskočila na plot a ptáci se rozletěli.",
    "Proč mi to neřekneš rovnou? Zeptala se tiše.",
    "Kniha má dvanáct kapitol a každá končí napínavě.",
    "Hvězdy nad městem pomalu bledly a začínalo svítat.",
    "Učitel zapsal na tabuli několik vět a požádal nás, abychom je přečetli nahlas.",
    "Ach jo, zase jsem zapomněl deštník doma.",
    "Šli jsme podél potoka, kde rostly vrby a olše.",
    "Ještě jednou ti děkuji za všechno, co jsi pro mě udělal.",
    "Ozvalo se zaklepání a do místnosti vstoupil neznámý muž.",
    "Na náměstí hrála hudba a lidé tančili až do noci.",
    "Pozor, schod! Zavolal na mě a chytil mě za ruku.",
    "Ten příběh se stal dávno, ale dodnes si ho pamatuji.",
    "Měsíc svítil tak jasně, že bylo vidět každý kámen na cestě.",
    "Kdybych to věděl dřív, udělal bych to úplně jinak.",
    "Vlak měl zpoždění, a tak jsme čekali na nádraží.",
    "Uprostřed lesa stála malá dřevěná chaloupka.",
    "Jaký je to pocit, když se splní sen?",
    "Zvony odbíjely poledne a ulice se pomalu vyprazdňovaly.",
    "Opatrně otevřel dopis a začal číst.",
    "Ráno bylo mlhavé a tráva se leskla rosou.",
    "Nikdo nevěděl, kam zmizel klíč od půdy.",
    "Přečti mi prosím ještě jednu kapitolu, než zhasneme.",
    "A tak skončil jeden dlouhý den a začal další.",
]


class StudioError(Exception):
    pass


def voices_root() -> Path:
    d = components.app_dir() / "vlastni-hlas"
    d.mkdir(parents=True, exist_ok=True)
    return d


def safe(name: str) -> str:
    return re.sub(r"[^\w-]+", "_", name.strip(), flags=re.UNICODE).strip("_")[:40] or "muj_hlas"


# ------------------------------------------------------------------ věty k nahrání
def sentences_from_text(text: str, limit: int = 1000, min_words: int = 5, max_words: int = 22) -> list[str]:
    """Věty z knihy vhodné k nahrání: 5–22 slov, bez čísel a zkratek (mluví se přesně to, co je napsané)."""
    out, seen = [], set()
    text = re.sub(r"\s+", " ", text)
    for s in re.split(r"(?<=[.!?…])\s+(?=[„\"(A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ])", text):
        s = s.strip().strip("–— ")
        words = s.split()
        if not (min_words <= len(words) <= max_words):
            continue
        if re.search(r"\d|\b[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]{2,}\b|\b\w{1,3}\.\s*\w|[<>{}\[\]/\\@#$%^&*_=+|~]", s):
            continue
        if not re.search(r"[.!?…]$", s):
            continue
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(s)
        if len(out) >= limit:
            break
    return out


class Dataset:
    """Nahrávky jednoho hlasu: vlastni-hlas/<jméno>/wavs/0001.wav, sentences.json (věty) a done (nahrané)."""

    def __init__(self, name: str, root: Path | None = None):
        self.name = safe(name)
        self.dir = (root or voices_root()) / self.name
        (self.dir / "wavs").mkdir(parents=True, exist_ok=True)
        self._file = self.dir / "projekt.json"
        try:
            d = json.loads(self._file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            d = {}
        self.sentences: list[str] = d.get("sentences") or list(STARTER)
        self.save()

    def save(self):
        self._file.write_text(json.dumps({"name": self.name, "sentences": self.sentences}, ensure_ascii=False, indent=1),
                              encoding="utf-8")

    def add_sentences(self, new: list[str]) -> int:
        have = {s.lower() for s in self.sentences}
        added = [s for s in new if s.lower() not in have]
        self.sentences += added
        self.save()
        return len(added)

    def wav_path(self, i: int) -> Path:
        return self.dir / "wavs" / f"{i + 1:04d}.wav"

    def recorded(self) -> list[int]:
        return [i for i in range(len(self.sentences)) if self.wav_path(i).is_file()]

    def next_missing(self, start: int = 0) -> int:
        for i in list(range(start, len(self.sentences))) + list(range(0, start)):
            if not self.wav_path(i).is_file():
                return i
        return -1

    def minutes(self) -> float:
        total = 0.0
        for i in self.recorded():
            with wave.open(str(self.wav_path(i)), "rb") as w:
                total += w.getnframes() / w.getframerate()
        return total / 60

    def save_take(self, i: int, pcm: bytes, rate: int = SAMPLE_RATE) -> dict:
        """Uloží nahrávku věty (16 bit mono) po oříznutí ticha. Vrátí kontrolu kvality."""
        pcm = trim_silence(pcm, rate)
        q = check_quality(pcm, rate, self.sentences[i])
        with wave.open(str(self.wav_path(i)), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(pcm)
        return q

    def export_zip(self, target: str | Path) -> Path:
        """ZIP pro trénování (LJSpeech): wavs/*.wav a metadata.csv („0001.wav|text“) – jen nahrané věty."""
        rec = self.recorded()
        if len(rec) < 50:
            raise StudioError(f"Nahráno je jen {len(rec)} vět – pro trénování jich nahrajte aspoň 300 (nejméně 50).")
        target = Path(target)
        with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as z:
            lines = []
            for i in rec:
                p = self.wav_path(i)
                z.write(p, f"{self.name}/wavs/{p.name}")
                lines.append(f"{p.name}|{self.sentences[i]}")
            z.writestr(f"{self.name}/metadata.csv", "\n".join(lines) + "\n")
            z.writestr(f"{self.name}/README.txt", "Datová sada pro trénování hlasu Piper (formát LJSpeech, 22050 Hz mono).\n"
                       "Nahrajte tento ZIP do sešitu Google Colab z Překladače (Nastavení → Součásti → Vlastní hlas → Návod).\n")
        return target


# ------------------------------------------------------------------ zvuk
def _samples(pcm: bytes) -> array.array:
    a = array.array("h")
    a.frombytes(pcm[: len(pcm) // 2 * 2])
    return a


def trim_silence(pcm: bytes, rate: int = SAMPLE_RATE, threshold: int = 500, pad: float = 0.15) -> bytes:
    """Ticho na začátku a na konci pryč (necháme 0,15 s), aby se hlas netrénoval na dlouhé pauzy."""
    a = _samples(pcm)
    if not a:
        return pcm
    win = max(1, rate // 50)  # 20 ms
    loud = [k for k in range(0, len(a), win) if max(abs(x) for x in a[k:k + win]) > threshold]
    if not loud:
        return pcm
    start = max(0, loud[0] - int(pad * rate))
    end = min(len(a), loud[-1] + win + int(pad * rate))
    return a[start:end].tobytes()


def check_quality(pcm: bytes, rate: int, text: str) -> dict:
    """Jednoduchá kontrola: přebuzení, tichý záznam, příliš krátký/dlouhý vzhledem k délce věty."""
    a = _samples(pcm)
    seconds = len(a) / rate if rate else 0
    peak = max((abs(x) for x in a), default=0)
    rms = (sum(x * x for x in a) / len(a)) ** 0.5 if a else 0
    problems = []
    if peak >= 32000:
        problems.append("přebuzené (moc nahlas nebo blízko mikrofonu)")
    if rms < 300:
        problems.append("moc potichu – mluvte blíž k mikrofonu")
    expected = max(1.0, len(text) / 14)  # asi 14 znaků za sekundu
    if seconds < expected * 0.45:
        problems.append("krátké – je přečtená celá věta?")
    if seconds > expected * 2.6 + 2:
        problems.append("dlouhé – na konci asi zůstalo ticho nebo hluk")
    return {"seconds": round(seconds, 2), "peak": peak, "rms": int(rms), "ok": not problems, "problems": problems}


class Recorder:
    """Nahrávání z mikrofonu (knihovna sounddevice, 22050 Hz mono 16 bit)."""

    def __init__(self, rate: int = SAMPLE_RATE):
        self.rate = rate
        self._chunks: list[bytes] = []
        self._stream = None
        self.level = 0

    def start(self):
        try:
            import sounddevice as sd
        except (ImportError, OSError) as e:
            raise StudioError(f"Nahrávání z mikrofonu není k dispozici ({e}).") from e

        self._chunks = []

        def cb(indata, frames, time_info, status):
            b = bytes(indata)
            self._chunks.append(b)
            s = _samples(b)
            self.level = max((abs(x) for x in s), default=0)

        try:
            self._stream = sd.RawInputStream(samplerate=self.rate, channels=1, dtype="int16", callback=cb)
            self._stream.start()
        except Exception as e:  # noqa: BLE001 – žádný mikrofon, obsazený
            raise StudioError(f"Mikrofon nejde spustit: {e}. Je připojený a povolený (Nastavení Windows → "
                              "Ochrana osobních údajů → Mikrofon)?") from e

    def stop(self) -> bytes:
        if self._stream is not None:
            self._stream.stop()
            self._stream.close()
            self._stream = None
        return b"".join(self._chunks)


# ------------------------------------------------------------------ import hotového hlasu
def custom_voices_dir() -> Path:
    import tts_win

    d = tts_win.piper_dir() / "voices" / "vlastni"
    d.mkdir(parents=True, exist_ok=True)
    return d


def import_voice(onnx: str | Path, name: str = "") -> Path:
    """Hlas Piper (.onnx a vedle něj .onnx.json) → mezi vlastní hlasy (čtečka a audiokniha)."""
    onnx = Path(onnx)
    cfg = onnx.with_name(onnx.name + ".json")
    if not cfg.is_file():
        alt = onnx.with_suffix(".json")
        cfg = alt if alt.is_file() else cfg
    if onnx.suffix.lower() != ".onnx" or not onnx.is_file():
        raise StudioError("Vyberte soubor hlasu Piper s příponou .onnx.")
    if not cfg.is_file():
        raise StudioError(f"Vedle hlasu chybí nastavení „{onnx.name}.json“ (stáhněte oba soubory).")
    try:
        c = json.loads(cfg.read_text(encoding="utf-8"))
        assert "phoneme_id_map" in c and c.get("audio", {}).get("sample_rate")
    except (ValueError, AssertionError) as e:
        raise StudioError("Soubor .onnx.json není nastavení hlasu Piper.") from e
    if name.strip():
        c["dataset"] = name.strip()
    stem = safe(name or c.get("dataset") or onnx.stem)
    dst = custom_voices_dir() / f"{stem}.onnx"
    shutil.copyfile(onnx, dst)
    Path(str(dst) + ".json").write_text(json.dumps(c, ensure_ascii=False), encoding="utf-8")
    return dst


def remove_voice(onnx: str | Path) -> None:
    p = Path(onnx)
    for f in (p, Path(str(p) + ".json")):
        f.unlink(missing_ok=True)
