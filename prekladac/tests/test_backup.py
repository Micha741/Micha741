"""Záloha a obnova nastavení: bez klíčů, jen povolené soubory, klíče z tohoto počítače zůstanou."""
import json
import sys
import zipfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import backup  # noqa: E402


def make_base(root: Path) -> Path:
    base = root / "Prekladac"
    (base / "reader").mkdir(parents=True)
    (base / "reader" / "abc.json").write_text('{"pos": 5}', encoding="utf-8")
    (base / "skins").mkdir()
    (base / "skins" / "moje.skin").write_text("skin", encoding="utf-8")
    (base / "slovnicek.json").write_text("[]", encoding="utf-8")
    (base / "offline").mkdir()
    (base / "offline" / "velky.bin").write_bytes(b"x" * 100)
    return base


def test_backup_has_no_secrets_and_no_big_downloads(tmp_path):
    base = make_base(tmp_path)
    cfg = {"lang": "angličtina", "window_geometry": "AAA", "engines": {
        "deepl": {"api_key": "TAJNE-1"}, "gdrive": {"client_id": "cid", "client_secret": "TAJNE-2", "refresh_token": "TAJNE-3"},
        "webdav": {"url": "https://nas", "user": "u", "password": "TAJNE-4"}}}
    out = tmp_path / "z.zip"
    m = backup.create_backup(cfg, out, base)
    z = zipfile.ZipFile(out)
    names = set(z.namelist())
    assert {"data/reader/abc.json", "data/skins/moje.skin", "data/slovnicek.json", "nastaveni.json", "zaloha.json"} <= names
    assert not any("offline" in n for n in names)
    raw = z.read("nastaveni.json").decode()
    assert "TAJNE" not in raw and "window_geometry" not in raw
    saved = json.loads(raw)
    assert saved["lang"] == "angličtina" and saved["engines"]["gdrive"]["client_id"] == "cid"
    assert m["files"] == 3


def test_restore_keeps_local_keys_and_ignores_bad_paths(tmp_path):
    src = make_base(tmp_path / "stary")
    out = tmp_path / "z.zip"
    backup.create_backup({"lang": "němčina", "engines": {"deepl": {"api_key": "STARY"}}}, out, src)
    with zipfile.ZipFile(out, "a") as z:   # podvržené cesty se nesmí zapsat mimo složku programu
        z.writestr("data/../../zlo.txt", "x")
        z.writestr("data/config.json", "{}")
        z.writestr("jinde/x.txt", "x")
    new = tmp_path / "novy" / "Prekladac"
    new.mkdir(parents=True)
    cur = {"lang": "čeština", "window_geometry": "TU", "engines": {"deepl": {"api_key": "NOVY-KLIC"}}}
    restored = backup.restore_backup(out, cur, new)
    assert restored["lang"] == "němčina"
    assert restored["engines"]["deepl"]["api_key"] == "NOVY-KLIC"   # klíč z tohoto počítače
    assert restored["window_geometry"] == "TU"
    assert (new / "reader" / "abc.json").read_text(encoding="utf-8") == '{"pos": 5}'
    assert not (tmp_path / "zlo.txt").exists() and not (new / "config.json").exists() and not (new / "jinde").exists()
    assert list(new.glob("zaloha-pred-obnovou-*.zip"))


def test_not_a_backup(tmp_path):
    bad = tmp_path / "x.zip"
    with zipfile.ZipFile(bad, "w") as z:
        z.writestr("a.txt", "a")
    with pytest.raises(backup.BackupError):
        backup.read_manifest(bad)
