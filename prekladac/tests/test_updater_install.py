"""Aktualizace jedním klikem: stažení, ověření otisku SHA-256 a parametry tiché instalace."""
import hashlib
import io
import sys
import threading
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import updater  # noqa: E402


class Resp(io.BytesIO):
    headers = {}

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def info_for(data: bytes, ver="9.9.9"):
    return {"version": ver, "setup_url": "https://example/Prekladac-Setup.exe", "sha256": hashlib.sha256(data).hexdigest(),
            "size": len(data)}


def test_download_verifies_sha256(tmp_path, monkeypatch):
    monkeypatch.setattr(updater.tempfile, "gettempdir", lambda: str(tmp_path))
    data = b"MZ" + b"x" * 700_000
    seen = []
    p = updater.download_setup(info_for(data), lambda d, t: seen.append((d, t)), opener=lambda req, timeout: Resp(data))
    assert p.read_bytes() == data and p.name == "Prekladac-Setup-9.9.9.exe"
    assert seen[-1] == (len(data), len(data))
    # podruhé se nestahuje znovu
    assert updater.download_setup(info_for(data), opener=lambda req, timeout: (_ for _ in ()).throw(AssertionError())) == p
    # poškozené stažení se zahodí
    with pytest.raises(updater.UpdateError, match="otiskem"):
        updater.download_setup(info_for(b"jine", "9.9.8") | {"sha256": "0" * 64}, opener=lambda req, timeout: Resp(b"jine"))
    assert not list(tmp_path.glob("Prekladac-aktualizace/*9.9.8*"))
    # bez otisku se automaticky neinstaluje
    with pytest.raises(updater.UpdateError, match="SHA-256"):
        updater.download_setup({"version": "1", "setup_url": "x", "sha256": ""})
    ev = threading.Event()
    ev.set()
    with pytest.raises(updater.UpdateError, match="zrušeno"):
        updater.download_setup(info_for(b"abc", "9.9.7"), cancel=ev, opener=lambda req, timeout: Resp(b"abc"))


def test_install_args_silent_with_relaunch(tmp_path):
    args = updater.install_args(tmp_path / "s.exe")
    assert args[1:4] == ["/SILENT", "/SUPPRESSMSGBOXES", "/NORESTART"] and "/relaunch=1" in args
    assert "/relaunch=0" in updater.install_args(tmp_path / "s.exe", relaunch=False)
    iss = (Path(updater.__file__).parent / "installer.iss").read_text(encoding="utf-8")
    assert "Check: RelaunchAfterUpdate" in iss and "{param:relaunch|0}" in iss


def test_fetch_latest_reads_digest(monkeypatch):
    import json
    rel = {"name": "Překladač 1.0.200", "body": "", "html_url": "u", "assets": [
        {"name": "Prekladac-Setup.exe", "browser_download_url": "https://x/setup.exe", "size": 5, "digest": "sha256:ABCDEF"}]}
    monkeypatch.setattr(updater, "http_request", lambda *a, **k: json.dumps(rel).encode())
    i = updater.fetch_latest()
    assert (i["version"], i["sha256"], i["size"], i["setup_url"]) == ("1.0.200", "abcdef", 5, "https://x/setup.exe")
