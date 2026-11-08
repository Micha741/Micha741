"""Správa součástí (Tesseract, Calibre, jazyky OCR) a bezpečné uložení klíčů."""

from __future__ import annotations

import base64
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Callable

# přímo z raw.githubusercontent.com (přesměrování přes github.com/…/raw občas vrací 504); github.com jako záloha
TESSDATA_URLS = ("https://raw.githubusercontent.com/tesseract-ocr/tessdata/main/{lang}.traineddata",
                 "https://github.com/tesseract-ocr/tessdata/raw/main/{lang}.traineddata")
TESSDATA_URL = TESSDATA_URLS[0]
CALIBRE_PLUGIN_INDEX = "https://code.calibre-ebook.com/plugins/plugins.json.bz2"
CALIBRE_PLUGIN_SERVER = "https://code.calibre-ebook.com/plugins/"
KFX_PLUGIN_NAME = "KFX Input"

# kód Tesseractu -> název jazyka
OCR_LANGUAGES = {
    "eng": "angličtina", "ces": "čeština", "slk": "slovenština", "deu": "němčina", "pol": "polština",
    "fra": "francouzština", "spa": "španělština", "ita": "italština", "rus": "ruština", "ukr": "ukrajinština",
    "hun": "maďarština", "nld": "nizozemština", "por": "portugalština", "jpn": "japonština",
    "chi_sim": "čínština (zjednodušená)",
}

_NO_WINDOW = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0


def app_dir() -> Path:
    base = os.environ.get("APPDATA") or os.path.expanduser("~")
    p = Path(base) / "Prekladac"
    p.mkdir(parents=True, exist_ok=True)
    return p


def tessdata_dir() -> Path:
    p = app_dir() / "tessdata"
    p.mkdir(parents=True, exist_ok=True)
    return p


# ------------------------------------------------- šifrování klíčů (Windows)
def _dpapi(data: bytes, encrypt: bool) -> bytes:
    import ctypes
    from ctypes import wintypes

    class BLOB(ctypes.Structure):
        _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_char))]

    buf = ctypes.create_string_buffer(data, len(data))
    blob_in = BLOB(len(data), ctypes.cast(buf, ctypes.POINTER(ctypes.c_char)))
    blob_out = BLOB()
    crypt32 = ctypes.windll.crypt32
    fn = crypt32.CryptProtectData if encrypt else crypt32.CryptUnprotectData
    ok = fn(ctypes.byref(blob_in), None, None, None, None, 0x1, ctypes.byref(blob_out))  # 0x1 = bez dialogu
    if not ok:
        raise OSError("DPAPI selhalo")
    try:
        return ctypes.string_at(blob_out.pbData, blob_out.cbData)
    finally:
        ctypes.windll.kernel32.LocalFree(blob_out.pbData)


def protect_secret(value: str) -> str:
    """Zašifruje klíč pro aktuálního uživatele Windows (jinde jen zakóduje)."""
    if not value:
        return ""
    if sys.platform == "win32":
        try:
            return "dpapi:" + base64.b64encode(_dpapi(value.encode("utf-8"), True)).decode("ascii")
        except Exception:
            pass
    return "b64:" + base64.b64encode(value.encode("utf-8")).decode("ascii")


def unprotect_secret(value: str) -> str:
    if not value:
        return ""
    try:
        if value.startswith("dpapi:") and sys.platform == "win32":
            return _dpapi(base64.b64decode(value[6:]), False).decode("utf-8")
        if value.startswith("b64:"):
            return base64.b64decode(value[4:]).decode("utf-8")
    except Exception:
        return ""
    return value  # starší verze ukládala prostý text


# ------------------------------------------------- součásti v instalaci
def bundled_dir() -> Path:
    """Složka nainstalovaného programu (u Prekladac.exe) – tam jsou přibalené Calibre2 a Tesseract-OCR."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def bundled_exe(folder: str, name: str) -> str | None:
    exe = name + (".exe" if sys.platform == "win32" else "")
    p = bundled_dir() / folder / exe
    return str(p) if p.is_file() else None


# ---------------------------------------------------------------- Calibre
def calibre_kfx_plugin(ebook_convert: str | None) -> bool | None:
    """True/False = je/není nainstalovaný plugin KFX Input; None = nelze zjistit."""
    if not ebook_convert:
        return None
    exe = _calibre_customize(ebook_convert)
    if not exe:
        return None
    try:
        proc = subprocess.run([str(exe), "-l"], capture_output=True, text=True, errors="replace", timeout=60,
                              creationflags=_NO_WINDOW)
    except Exception:
        return None
    return "kfx input" in proc.stdout.lower()


def _calibre_customize(ebook_convert: str | None) -> str | None:
    if not ebook_convert:
        return None
    exe = Path(ebook_convert).parent / ("calibre-customize.exe" if sys.platform == "win32" else "calibre-customize")
    return str(exe) if exe.exists() else shutil.which("calibre-customize")


def kfx_plugin_urls(index: dict) -> list[str]:
    """Z rejstříku pluginů Calibre vybere adresy ke stažení pluginu KFX Input."""
    entries = index.values() if isinstance(index, dict) else index
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        if str(entry.get("name", "")).strip().lower() != KFX_PLUGIN_NAME.lower():
            continue
        urls = []
        file = entry.get("file")
        if file:
            urls.append(file if str(file).startswith("http") else CALIBRE_PLUGIN_SERVER + str(file).lstrip("/"))
        if entry.get("thread_id"):
            urls.append(f"{CALIBRE_PLUGIN_SERVER}{entry['thread_id']}.zip")
        return urls
    return []


def calibre_ca_file(ebook_convert: str | None) -> str | None:
    """Kořenový certifikát, kterým Calibre podepisuje svůj server s pluginy (je přibalený v instalaci Calibre)."""
    if not ebook_convert:
        return None
    base = Path(ebook_convert).parent
    name = "calibre-ebook-root-CA.crt"
    for cand in (base / "app" / "resources" / name, base / "resources" / name,
                 base.parent / "resources" / name, base.parent / "share" / "calibre" / name):
        if cand.is_file():
            return str(cand)
    try:
        return str(next(base.rglob(name)))
    except (StopIteration, OSError):
        return None


def download_kfx_plugin(log: Callable[[str], None], ebook_convert: str | None = None) -> bytes:
    """Stáhne plugin KFX Input z oficiálního rejstříku pluginů Calibre."""
    import bz2
    import json

    from free_engines import EngineError, http_request

    cafile = calibre_ca_file(ebook_convert)
    log("Stahuji rejstřík pluginů Calibre…")
    raw = http_request(CALIBRE_PLUGIN_INDEX, timeout=120, service="Rejstřík pluginů Calibre", retries=2,
                       cafile=cafile)
    index = json.loads(bz2.decompress(raw))
    urls = kfx_plugin_urls(index)
    if not urls:
        raise EngineError("Plugin KFX Input se v rejstříku pluginů Calibre nenašel.")
    last: Exception | None = None
    for url in urls:
        try:
            data = http_request(url, timeout=300, service="Plugin KFX Input", retries=1, cafile=cafile)
            if data[:2] == b"PK":
                return data
        except EngineError as e:
            last = e
    raise EngineError(f"Plugin KFX Input se nepodařilo stáhnout ({last or 'neplatný soubor'}).")


def install_kfx_plugin(ebook_convert: str | None, log: Callable[[str], None]) -> None:
    """Stáhne a nainstaluje plugin KFX Input do Calibre (bez práv správce)."""
    import tempfile

    from free_engines import EngineError

    customize = _calibre_customize(ebook_convert)
    if not customize:
        raise EngineError("Calibre nebylo nalezeno, plugin KFX Input nelze nainstalovat.")
    data = download_kfx_plugin(log, ebook_convert)
    with tempfile.TemporaryDirectory(prefix="prekladac_kfx_") as tmp:
        zip_path = os.path.join(tmp, "KFX Input.zip")
        Path(zip_path).write_bytes(data)
        log("Instaluji plugin KFX Input do Calibre…")
        proc = subprocess.run([customize, "-a", zip_path], capture_output=True, text=True, errors="replace",
                              timeout=300, creationflags=_NO_WINDOW)
    if proc.returncode != 0:
        raise EngineError(f"Instalace pluginu selhala: {(proc.stderr or proc.stdout)[-800:]}")
    log("  ✓ Plugin KFX Input nainstalován.")


# -------------------------------------------------------------- Tesseract
def tesseract_languages(exe: str | None) -> set[str]:
    """Jazyky dostupné Tesseractu: z jeho instalace i ze složky programu."""
    langs = {p.stem for p in tessdata_dir().glob("*.traineddata")}
    if exe:
        try:
            proc = subprocess.run([exe, "--list-langs"], capture_output=True, text=True, errors="replace",
                                  timeout=30, creationflags=_NO_WINDOW)
            for line in (proc.stdout or "").splitlines()[1:]:
                if re.fullmatch(r"[A-Za-z_]+", line.strip()):
                    langs.add(line.strip())
        except Exception:
            pass
    return langs


def download_tessdata(lang: str, log: Callable[[str], None]) -> Path:
    """Stáhne jazyk pro Tesseract do složky programu (bez práv správce)."""
    from free_engines import EngineError, http_request

    if not re.fullmatch(r"[a-z_]+", lang):
        raise EngineError(f"Neplatný kód jazyka: {lang}")
    dest = tessdata_dir() / f"{lang}.traineddata"
    log(f"Stahuji jazyk OCR „{lang}“…")
    data, err = b"", None
    for url in TESSDATA_URLS:
        try:
            data = http_request(url.format(lang=lang), timeout=300, service="Stažení jazyka OCR", retries=2)
            break
        except EngineError as e:
            err = e
    if not data and err:
        raise err
    if len(data) < 100_000:
        raise EngineError(f"Jazyk „{lang}“ se nepodařilo stáhnout (soubor je příliš malý).")
    tmp = dest.with_suffix(".part")
    tmp.write_bytes(data)
    tmp.replace(dest)
    log(f"  ✓ {lang} ({len(data) // 1024 // 1024} MB)")
    return dest


def installed_tessdata_dir(exe: str | None) -> Path | None:
    """Složka s jazyky instalace Tesseractu (zjištěná z výpisu „--list-langs“)."""
    if not exe:
        return None
    try:
        proc = subprocess.run([exe, "--list-langs"], capture_output=True, text=True, errors="replace",
                              timeout=30, creationflags=_NO_WINDOW)
        m = re.search(r'languages in "([^"]+)"', (proc.stdout or "") + (proc.stderr or ""))
        if m and Path(m.group(1)).is_dir():
            return Path(m.group(1))
    except Exception:
        pass
    p = Path(exe).parent / "tessdata"
    return p if p.is_dir() else None


def ensure_ocr_languages(langs: list[str], exe: str | None, log: Callable[[str], None]) -> Path | None:
    """Zajistí, aby všechny jazyky byly v jedné složce. Vrátí složku pro --tessdata-dir (None = výchozí)."""
    installed = installed_tessdata_dir(exe)
    inst_langs = {p.stem for p in installed.glob("*.traineddata")} if installed else set()
    if all(lang in inst_langs for lang in langs):
        return None  # vše je v instalaci Tesseractu
    own = tessdata_dir()
    for lang in langs:
        target = own / f"{lang}.traineddata"
        if target.exists():
            continue
        if lang in inst_langs and installed:
            shutil.copyfile(installed / f"{lang}.traineddata", target)
        else:
            download_tessdata(lang, log)
    return own
