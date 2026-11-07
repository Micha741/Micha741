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

TESSDATA_URL = "https://github.com/tesseract-ocr/tessdata/raw/main/{lang}.traineddata"
WINGET_IDS = {"tesseract": "UB-Mannheim.TesseractOCR", "calibre": "calibre.calibre"}

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


# ----------------------------------------------------------------- winget
def winget_available() -> bool:
    return sys.platform == "win32" and shutil.which("winget") is not None


def winget_install(name: str, log: Callable[[str], None]) -> bool:
    """Nainstaluje Tesseract nebo Calibre přes winget (Windows 10/11). Vrátí True při úspěchu."""
    if not winget_available():
        log("winget není k dispozici. Nainstalujte „Instalační služba aplikace“ z Microsoft Store, "
            "nebo součást stáhněte ručně (odkaz je v Nastavení).")
        return False
    pkg = WINGET_IDS[name]
    log(f"Instaluji {pkg} přes winget… (Windows se může zeptat na oprávnění)")
    proc = subprocess.run(
        ["winget", "install", "-e", "--id", pkg, "--accept-package-agreements", "--accept-source-agreements"],
        capture_output=True, text=True, errors="replace", creationflags=_NO_WINDOW,
    )
    out = (proc.stdout or "") + (proc.stderr or "")
    tail = "\n".join(line for line in out.splitlines() if line.strip() and not re.match(r"^[\s\-\\|/█▒]+$", line))
    log(tail[-1200:])
    already = "already installed" in out.lower() or "již nainstal" in out.lower()
    return proc.returncode == 0 or already


# ---------------------------------------------------------------- Calibre
def calibre_kfx_plugin(ebook_convert: str | None) -> bool | None:
    """True/False = je/není nainstalovaný plugin KFX Input; None = nelze zjistit."""
    if not ebook_convert:
        return None
    folder = Path(ebook_convert).parent
    exe = folder / ("calibre-customize.exe" if sys.platform == "win32" else "calibre-customize")
    if not exe.exists():
        exe = shutil.which("calibre-customize")
        if not exe:
            return None
    try:
        proc = subprocess.run([str(exe), "-l"], capture_output=True, text=True, errors="replace", timeout=60,
                              creationflags=_NO_WINDOW)
    except Exception:
        return None
    return "kfx input" in proc.stdout.lower()


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
    data = http_request(TESSDATA_URL.format(lang=lang), timeout=300, service="Stažení jazyka OCR", retries=2)
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
