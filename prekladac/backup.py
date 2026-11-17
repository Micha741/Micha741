"""Záloha a obnova nastavení (Nastavení → Obecné → Záloha): jeden soubor .zip pro nový počítač.

V záloze: nastavení programu (bez klíčů a hesel – ty zůstávají šifrované jen v tomto počítači a po obnově se
nezmění), místa čtení, záložky a označené ve čtečce, slovníček, vlastní slova pro kontrolu pravopisu, skiny,
doinstalované jazyky programu a glosáře knih. Velké stahované součásti (hlasy, offline překlad, OCR, slovník)
se nezálohují – program je stáhne znovu.
"""
from __future__ import annotations

import json
import time
import zipfile
from pathlib import Path, PurePosixPath

import app as core
import components

VERSION_TAG = "prekladac-zaloha-1"
INCLUDE_DIRS = ("reader", "skins", "lang", "glosare")
INCLUDE_FILES = ("slovnicek.json", "slovnik_uzivatele.txt")
# klíče programu, které patří jen tomuto počítači
LOCAL_KEYS = ("window_geometry", "skip_version")


class BackupError(Exception):
    pass


def _without_secrets(cfg: dict) -> dict:
    data = json.loads(json.dumps(cfg))
    for name, (_t, fields) in core.SERVICES.items():
        sect = data.get("engines", {}).get(name)
        if not isinstance(sect, dict):
            continue
        for key, _l, secret, _d, _c in fields:
            if secret:
                sect.pop(key, None)
        for key in core.HIDDEN_SECRETS.get(name, ()):
            sect.pop(key, None)
    for k in LOCAL_KEYS + ("remember_keys",):
        data.pop(k, None)
    return data


def create_backup(cfg: dict, target: str | Path, base: Path | None = None) -> dict:
    """Uloží zálohu do souboru .zip. Vrátí přehled, co v ní je."""
    base = base or components.app_dir()
    target = Path(target)
    counts = {"soubory": 0}
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("nastaveni.json", json.dumps(_without_secrets(cfg), ensure_ascii=False, indent=1))
        for f in INCLUDE_FILES:
            p = base / f
            if p.is_file():
                z.write(p, f"data/{f}")
                counts["soubory"] += 1
        for d in INCLUDE_DIRS:
            for p in sorted((base / d).rglob("*")) if (base / d).is_dir() else []:
                if p.is_file():
                    z.write(p, "data/" + p.relative_to(base).as_posix())
                    counts["soubory"] += 1
        manifest = {"format": VERSION_TAG, "created": time.strftime("%Y-%m-%d %H:%M"), "program": core.VERSION,
                    "files": counts["soubory"]}
        z.writestr("zaloha.json", json.dumps(manifest, ensure_ascii=False, indent=1))
    return manifest


def read_manifest(path: str | Path) -> dict:
    try:
        with zipfile.ZipFile(path) as z:
            m = json.loads(z.read("zaloha.json").decode("utf-8"))
    except (KeyError, zipfile.BadZipFile, ValueError, OSError) as e:
        raise BackupError("Soubor není záloha Překladače.") from e
    if m.get("format") != VERSION_TAG:
        raise BackupError("Záloha je z jiné verze programu a nejde obnovit.")
    return m


def _safe_target(base: Path, name: str) -> Path | None:
    """Jen soubory ze složky data/ a jen do povolených míst (žádné ../ ani absolutní cesty)."""
    p = PurePosixPath(name)
    if p.parts[:1] != ("data",) or ".." in p.parts or p.is_absolute() or len(p.parts) < 2:
        return None
    rel = PurePosixPath(*p.parts[1:])
    if not (str(rel) in INCLUDE_FILES or rel.parts[0] in INCLUDE_DIRS):
        return None
    return base.joinpath(*rel.parts)


def restore_backup(path: str | Path, cfg: dict, base: Path | None = None) -> dict:
    """Obnoví zálohu do tohoto počítače. Klíče a hesla zůstanou ze současného nastavení; před obnovou se
    současný stav uloží do „zaloha-pred-obnovou-….zip“. Vrátí nové nastavení (je potřeba ho uložit)."""
    base = base or components.app_dir()
    manifest = read_manifest(path)
    before = base / f"zaloha-pred-obnovou-{time.strftime('%Y%m%d-%H%M%S')}.zip"
    create_backup(cfg, before, base)
    with zipfile.ZipFile(path) as z:
        new_cfg = json.loads(z.read("nastaveni.json").decode("utf-8"))
        for info in z.infolist():
            if info.is_dir():
                continue
            t = _safe_target(base, info.filename)
            if t is None:
                continue
            t.parent.mkdir(parents=True, exist_ok=True)
            t.write_bytes(z.read(info))
    # klíče a hesla z tohoto počítače, ostatní z obnovené zálohy
    for name, (_t, fields) in core.SERVICES.items():
        cur = cfg.get("engines", {}).get(name, {})
        sect = new_cfg.setdefault("engines", {}).setdefault(name, {})
        for key, _l, secret, _d, _c in fields:
            if secret and cur.get(key):
                sect[key] = cur[key]
        for key in core.HIDDEN_SECRETS.get(name, ()):
            if cur.get(key):
                sect[key] = cur[key]
    for k in LOCAL_KEYS:
        if k in cfg:
            new_cfg[k] = cfg[k]
    return new_cfg
