"""Trénink vlastního hlasu v tomto počítači: Windows → WSL (Ubuntu) s grafikou NVIDIA.

Program připraví složku (ZIP ze studia + skript assets/trenink/trenovat_hlas.sh + spouštěcí .bat) a otevře okno
příkazového řádku, ve kterém trénink běží. Průběh se ukládá v Linuxu (WSL), po přerušení se pokračuje.
Hotový hlas (nebo ukázka z průběhu) se uloží do složky „hotovo“ a odtud se načte mezi vlastní hlasy.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import components
import voice_studio as vs

SCRIPT = "trenovat_hlas.sh"


def script_source() -> Path:
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    return base / "assets" / "trenink" / SCRIPT


def wsl_available() -> bool:
    return os.name == "nt" and shutil.which("wsl.exe") is not None


def win_to_wsl(path: str | Path) -> str:
    """C:\\Users\\Jan\\x → /mnt/c/Users/Jan/x (cesta Windows viditelná z WSL)."""
    p = str(path).replace("\\", "/")
    m = re.match(r"^([A-Za-z]):/?(.*)$", p)
    return f"/mnt/{m.group(1).lower()}/{m.group(2)}".rstrip("/") if m else p


def train_dir(name: str) -> Path:
    d = components.app_dir() / "trenink_hlasu" / vs.safe(name)
    d.mkdir(parents=True, exist_ok=True)
    return d


def prepare(ds: "vs.Dataset") -> Path:
    """ZIP ze studia (jen tento hlas – starší ZIPy ve složce pryč), skript a spouštěcí soubory .bat."""
    d = train_dir(ds.name)
    for z in d.glob("*.zip"):
        z.unlink()
    ds.export_zip(d / f"{vs.safe(ds.name)}-hlas.zip")
    shutil.copyfile(script_source(), d / SCRIPT)  # bajty beze změny (konce řádků LF)
    write_bats(d, ds.name)
    return d


def _bat(d: Path, name: str, args: str) -> str:
    script, folder = win_to_wsl(d / SCRIPT), win_to_wsl(d)
    return ("@echo off\r\nchcp 65001 >nul\r\n"
            f"title Překladač – trénink hlasu {name}\r\n"
            f'wsl.exe -u root -e bash "{script}" --system\r\n'
            "if errorlevel 1 goto konec\r\n"
            f'wsl.exe -e bash "{script}" "{folder}" {args}\r\n'
            ":konec\r\necho.\r\npause\r\n")


BATS = {"trenovat.bat": "", "ukazka.bat": "--export", "znovu_od_jirky.bat": "--znovu"}


def write_bats(d: Path, name: str) -> None:
    for f, args in BATS.items():
        (d / f).write_text(_bat(d, name, args), encoding="utf-8")


def launch(d: Path, which: str = "trenovat.bat") -> None:
    """Otevře nové okno příkazového řádku s tréninkem (běží i po zavření Překladače)."""
    flags = getattr(subprocess, "CREATE_NEW_CONSOLE", 0)
    subprocess.Popen(["cmd.exe", "/c", str(d / which)], cwd=str(d), creationflags=flags)


def status(d: Path) -> dict:
    """Poslední epocha z trenink.log a hotový hlas ve složce hotovo."""
    out = {"epoch": None, "epochs": None, "voice": None}
    log = d / "trenink.log"
    if log.is_file():
        try:
            tail = log.read_bytes()[-200000:].decode("utf-8", "replace")
        except OSError:
            tail = ""
        hits = re.findall(r"Epoch (\d+)/(\d+)", tail)
        if hits:
            out["epoch"], out["epochs"] = int(hits[-1][0]) + 1, int(hits[-1][1]) + 1
    done = sorted((d / "hotovo").glob("*.onnx"), key=lambda p: p.stat().st_mtime) if (d / "hotovo").is_dir() else []
    out["voice"] = done[-1] if done else None
    return out


def load_voice(d: Path) -> Path:
    st = status(d)
    if st["voice"] is None:
        raise vs.StudioError("Hotový hlas zatím ve složce není – nechte trénink doběhnout, nebo nejdřív "
                             "udělejte „🔊 Ukázka z průběhu“.")
    return vs.import_voice(st["voice"], st["voice"].stem)
