import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import updater  # noqa: E402


def fake_release(name, body="", assets=None):
    data = {"name": name, "body": body, "html_url": "https://example/rel",
            "assets": assets if assets is not None else
            [{"name": "Prekladac-Setup.exe", "browser_download_url": "https://example/setup.exe"}]}
    return lambda *a, **k: json.dumps(data).encode()


def test_parse_and_compare():
    assert updater.parse_version("Překladač 1.0.25") == (1, 0, 25)
    assert updater.parse_version("vývojová verze") is None
    assert updater.is_newer("1.0.25", "1.0.9")
    assert not updater.is_newer("1.0.9", "1.0.25")
    assert not updater.is_newer("1.0.9", "1.0.9")
    assert not updater.is_newer("1.0.30", "vývojová verze")


def test_check_newer(monkeypatch):
    monkeypatch.setattr(updater, "http_request", fake_release("Překladač 1.0.30"))
    info = updater.check("1.0.18")
    assert info["version"] == "1.0.30"
    assert info["setup_url"] == "https://example/setup.exe"


def test_check_up_to_date_skip_and_dev(monkeypatch):
    monkeypatch.setattr(updater, "http_request", fake_release("Překladač 1.0.18"))
    assert updater.check("1.0.18") is None
    monkeypatch.setattr(updater, "http_request", fake_release("Překladač 1.0.30"))
    assert updater.check("1.0.18", skip="1.0.30") is None

    def boom(*a, **k):
        raise AssertionError("dev version must not hit the network")
    monkeypatch.setattr(updater, "http_request", boom)
    assert updater.check("vývojová verze") is None


def test_old_release_without_version_and_fallback_url(monkeypatch):
    monkeypatch.setattr(updater, "http_request", fake_release("Překladač – nejnovější verze"))
    assert updater.check("1.0.18") is None
    monkeypatch.setattr(updater, "http_request", fake_release("x", body="Verze 1.0.40.", assets=[]))
    assert updater.check("1.0.18")["setup_url"] == updater.SETUP_URL
