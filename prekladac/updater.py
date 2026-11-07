"""Kontrola nové verze na GitHubu.

Program jen zjistí, zda je venku novější verze, a nabídne odkaz ke stažení.
Instalátor sám nestahuje ani nespouští – to antivirové programy (Avast) považují
za podezřelé chování; stažení proběhne v prohlížeči a instalaci spustí uživatel.
"""
from __future__ import annotations

import json
import re

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
    setup = next((a.get("browser_download_url") for a in rel.get("assets") or []
                  if a.get("name") == "Prekladac-Setup.exe"), SETUP_URL)
    return {
        "version": ".".join(map(str, ver)) if ver else "",
        "notes": (rel.get("body") or "").strip(),
        "url": rel.get("html_url") or RELEASE_URL,
        "setup_url": setup,
    }


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
