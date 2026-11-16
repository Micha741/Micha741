"""Synchronizace přes Google Disk: společné případy s Androidem a práce se soubory (bez internetu)."""
import io
import json
import sys
from pathlib import Path
import urllib.error

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import cloud_sync as cs  # noqa: E402

CASES = json.loads((Path(__file__).parent / "fixtures" / "sync_cases.json").read_text(encoding="utf-8"))


def test_book_key_same_as_android():
    for c in CASES["keys"]:
        assert cs.book_key(c["title"], c["author"]) == c["key"]


def test_merge_cases_same_as_android():
    for c in CASES["merge"]:
        assert cs.merge_entry(c["a"], c["b"]) == c["expected"], c["name"]
        # slučování je souměrné pro záložky a označené
        back = cs.merge_entry(c["b"], c["a"])
        assert back["bookmarks"] == c["expected"]["bookmarks"] and back["highlights"] == c["expected"]["highlights"]


class FakeGoogle:
    """Napodobí Google OAuth a Drive v paměti."""

    def __init__(self):
        self.files: dict[str, dict] = {}
        self.calls = []
        self.pending = 1

    def __call__(self, req, timeout=0):
        url, method, data = req.full_url, req.get_method(), req.data
        self.calls.append((method, url.split("?")[0]))
        if url == cs.GoogleDrive.DEVICE_URL:
            return self._ok({"device_code": "DEV", "user_code": "ABCD-EFGH", "verification_url": "https://www.google.com/device", "interval": 5})
        if url == cs.GoogleDrive.TOKEN_URL:
            form = dict(p.split("=", 1) for p in data.decode().split("&"))
            if form.get("grant_type", "").endswith("device_code") and self.pending:
                self.pending -= 1
                raise urllib.error.HTTPError(url, 428, "pending", {}, io.BytesIO(b'{"error":"authorization_pending"}'))
            return self._ok({"access_token": "AT", "refresh_token": "RT", "expires_in": 3600})
        assert req.headers.get("Authorization") == "Bearer AT"
        if method == "GET" and "?q=" in url:
            q = urllib.parse.unquote(url.split("q=", 1)[1].split("&", 1)[0])
            res = [f for f in self.files.values() if (f"name = '{f['name']}'" in q or "name =" not in q)
                   and (("folder'" in q and "!=" not in q) == f["folder"]) and (f"'{f['parent']}' in parents" in q or "in parents" not in q)]
            return self._ok({"files": [{"id": f["id"], "name": f["name"]} for f in res]})
        if method == "GET" and url.endswith("alt=media"):
            return self._ok(self.files[url.split("/files/")[1].split("?")[0]]["data"], raw=True)
        if method == "POST" and url == cs.GoogleDrive.API:
            meta = json.loads(data)
            return self._ok(self._add(meta["name"], b"", folder=True))
        if method == "POST" and "uploadType=multipart" in url:
            head, rest = data.split(b"\r\n\r\n", 1)
            meta = json.loads(rest.split(b"\r\n--", 1)[0])
            body = rest.split(b"\r\n\r\n", 1)[1].rsplit(b"\r\n--", 1)[0]
            return self._ok(self._add(meta["name"], body, parent=meta["parents"][0]))
        if method == "PATCH":
            fid = url.split("/files/")[1].split("?")[0]
            self.files[fid]["data"] = data
            return self._ok({"id": fid})
        raise AssertionError(url)

    def _add(self, name, data, folder=False, parent=""):
        fid = f"id{len(self.files) + 1}"
        self.files[fid] = {"id": fid, "name": name, "data": data, "folder": folder, "parent": parent}
        return {"id": fid}

    @staticmethod
    def _ok(obj, raw=False):
        return io.BytesIO(obj if raw else json.dumps(obj).encode())


def test_device_login_and_sync_roundtrip():
    g = FakeGoogle()
    d = cs.GoogleDrive("cid", "secret", opener=g)
    start = d.device_start()
    assert start["user_code"] == "ABCD-EFGH"
    assert d.device_poll(start["device_code"]) is False   # uživatel ještě nepotvrdil
    assert d.device_poll(start["device_code"]) is True
    assert d.refresh_token == "RT"
    key = cs.book_key("Babička", "Němcová")
    local = {"books": {key: {"title": "Babička", "author": "Němcová", "pos": {"chapter": 2, "fraction": 0.5, "at": 10, "device": "Windows"},
                             "bookmarks": [], "highlights": [], "gone": {}}}}
    merged = d.sync(local)
    assert merged["books"][key]["pos"]["chapter"] == 2
    fid = d.upload("babicka.epub", b"EPUB", "application/epub+zip")
    assert d.download(fid) == b"EPUB"
    # druhé zařízení (jiný přístup, stejný Disk) vidí stav a pošle novější místo
    d2 = cs.GoogleDrive("cid", "secret", "RT", opener=g)
    remote, _ = d2.get_state()
    assert remote["books"][key]["pos"]["chapter"] == 2
    phone = {"books": {key: {"title": "Babička", "author": "Němcová", "pos": {"chapter": 5, "fraction": 0.1, "at": 20, "device": "Android"}}}}
    assert d2.sync(phone)["books"][key]["pos"]["chapter"] == 5
    assert d.get_state()[0]["books"][key]["pos"]["device"] == "Android"
    assert sorted(f["name"] for f in d.list_files()) == ["babicka.epub", "sync.json"]
    assert sum(1 for f in g.files.values() if f["folder"]) == 1   # složka Překladač jen jednou


def test_errors_are_understandable():
    def bad(req, timeout=0):
        raise urllib.error.HTTPError(req.full_url, 401, "x", {}, io.BytesIO(b'{"error":"invalid_client"}'))
    d = cs.GoogleDrive("cid", "secret", opener=bad)
    try:
        d.device_start()
    except cs.CloudError as e:
        assert "ID klienta" in str(e)
    else:
        raise AssertionError
    try:
        cs.GoogleDrive("", "").device_start()
    except cs.CloudError as e:
        assert "Návod" in str(e)
