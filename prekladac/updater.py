"""Kontrola a instalace nové verze z GitHubu.

Aktualizace jedním klikem: program stáhne Prekladac-Setup.exe z vydání na GitHubu, ověří jeho otisk SHA-256
(GitHub ho u souboru zveřejňuje), spustí instalaci (Windows se zeptá na povolení) a sám se zavře; po instalaci
se znovu spustí. Kdyby antivirus stahování blokoval, zůstává možnost „Stáhnout v prohlížeči“.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import tempfile
import urllib.request
from pathlib import Path

from free_engines import http_request
from version import VERSION

REPO = "Micha741/Micha741"
TAG = "prekladac-latest"
API_URL = f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}"
RELEASE_URL = f"https://github.com/{REPO}/releases/tag/{TAG}"
SETUP_URL = f"https://github.com/{REPO}/releases/download/{TAG}/Prekladac-Setup.exe"

_VER_RE = re.compile(r"\b(\d+)\.(\d+)\.(\d+)\b")


def parse_version(text: str | None) -> tuple[int, ...] | None:
    m = _VER_RE.search(text or "")
    return tuple(int(x) for x in m.groups()) if m else None


def is_newer(remote: str, local: str = VERSION) -> bool:
    r, loc = parse_version(remote), parse_version(local)
    return bool(r and loc and r > loc)


def fetch_latest(timeout: float = 15) -> dict:
    """Vrátí {"version", "notes", "url", "setup_url"} nejnovějšího vydání."""
    raw = http_request(API_URL, headers={"Accept": "application/vnd.github+json"},
                       timeout=timeout, retries=1, backoff=(2,), service="GitHub")
    rel = json.loads(raw.decode("utf-8"))
    ver = parse_version(rel.get("name")) or parse_version(rel.get("body"))
    asset = next((a for a in rel.get("assets") or [] if a.get("name") == "Prekladac-Setup.exe"), {})
    digest = str(asset.get("digest") or "")
    return {
        "version": ".".join(map(str, ver)) if ver else "",
        "notes": (rel.get("body") or "").strip(),
        "url": rel.get("html_url") or RELEASE_URL,
        "setup_url": asset.get("browser_download_url") or SETUP_URL,
        "sha256": digest.split(":", 1)[1].lower() if digest.lower().startswith("sha256:") else "",
        "size": int(asset.get("size") or 0),
    }


class UpdateError(Exception):
    pass


def download_setup(info: dict, progress=lambda done, total: None, cancel=None, opener=None) -> Path:
    """Stáhne instalátor nové verze do dočasné složky a ověří otisk SHA-256. Vrátí cestu k souboru."""
    if not info.get("sha256"):
        raise UpdateError("GitHub u instalátoru neuvádí otisk SHA-256 – stáhněte novou verzi v prohlížeči.")
    folder = Path(tempfile.gettempdir()) / "Prekladac-aktualizace"
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / f"Prekladac-Setup-{info.get('version') or 'nova'}.exe"
    if target.exists() and _sha256(target) == info["sha256"]:
        return target  # už staženo dřív
    part = target.with_suffix(".part")
    req = urllib.request.Request(info["setup_url"], headers={"User-Agent": "Prekladac-updater"})
    h = hashlib.sha256()
    done = 0
    try:
        with (opener or urllib.request.urlopen)(req, timeout=60) as r, open(part, "wb") as f:
            total = int(r.headers.get("Content-Length") or info.get("size") or 0)
            while True:
                if cancel is not None and cancel.is_set():
                    raise UpdateError("Stahování zrušeno.")
                chunk = r.read(256 * 1024)
                if not chunk:
                    break
                f.write(chunk)
                h.update(chunk)
                done += len(chunk)
                progress(done, total)
    except UpdateError:
        part.unlink(missing_ok=True)
        raise
    except OSError as e:
        part.unlink(missing_ok=True)
        raise UpdateError(f"Novou verzi se nepodařilo stáhnout ({e}). Zkuste „Stáhnout v prohlížeči“.") from None
    if h.hexdigest() != info["sha256"]:
        part.unlink(missing_ok=True)
        raise UpdateError("Stažený instalátor nesouhlasí s otiskem na GitHubu (poškozené stažení) – zkuste to znovu.")
    os.replace(part, target)
    return target


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def install_args(path: Path, relaunch: bool = True) -> list[str]:
    """Tichá instalace přes stávající verzi (jen okno s průběhem); /relaunch=1 = po instalaci program spustit."""
    return [str(path), "/SILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/CLOSEAPPLICATIONS",
            f"/relaunch={1 if relaunch else 0}"]


def start_install(path: Path, relaunch: bool = True) -> None:
    """Spustí instalátor (Windows se zeptá na povolení správce). Program se pak musí sám zavřít."""
    subprocess.Popen(install_args(path, relaunch), close_fds=True)


def check(local: str = VERSION, skip: str = "") -> dict | None:
    """Nová verze (slovník z fetch_latest), nebo None, když je program aktuální.

    Vývojová verze (spuštěná z Pythonu) se nekontroluje; verze `skip` se přeskočí.
    """
    if not parse_version(local):
        return None
    info = fetch_latest()
    if not info["version"] or not is_newer(info["version"], local) or info["version"] == skip:
        return None
    return info
