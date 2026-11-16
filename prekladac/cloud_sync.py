"""Synchronizace knih a čtení mezi Windows a Androidem přes Google Disk.

Na Disku je složka „Překladač“ (aplikace vidí jen soubory, které sama vytvořila – oprávnění drive.file):
- sync.json – pro každou knihu místo čtení, záložky, označené odstavce s poznámkami a odkaz na soubor knihy,
- knihy jako EPUB (nahrané z počítače nebo z telefonu).

Formát a slučování jsou stejné jako v aplikaci pro Android (prekladac-android/src/core/sync.ts) –
hlídají to společné testovací případy tests/fixtures/sync_cases.json.
Přihlášení je kódem (google.com/device) – stejný způsob funguje v počítači i v telefonu, bez hesla v programu.
"""
from __future__ import annotations

import json
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

SCOPE = "https://www.googleapis.com/auth/drive.file"
FOLDER = "Překladač"
STATE_FILE = "sync.json"


# ------------------------------------------------------------------ společný formát (stejně jako v Androidu)
def _fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def book_key(title: str, author: str) -> str:
    """Stejná kniha v počítači i v telefonu: název a autor bez diakritiky, velikosti písmen a interpunkce."""
    return f"{_fold(title)}|{_fold(author)}"


def _norm_text(t: str) -> str:
    return re.sub(r"\s+", " ", t or "").strip()


def mark_id(kind: str, m: dict) -> str:
    if kind == "b":
        return f"b:{int(m.get('chapter', 0))}:{round(float(m.get('fraction', 0)) * 1000)}"
    return f"h:{int(m.get('chapter', 0))}:{_norm_text(m.get('text', ''))[:40]}"


def _merge_marks(kind: str, a: list, b: list, gone: dict) -> list:
    out: dict[str, dict] = {}
    for m in list(a or []) + list(b or []):
        m = dict(m)
        if kind == "h":
            m["text"] = _norm_text(m.get("text", ""))
        i = mark_id(kind, m)
        if gone.get(i, -1) >= m.get("at", 0):
            continue
        if i not in out or m.get("at", 0) > out[i].get("at", 0):
            out[i] = m
    key = (lambda m: (m.get("chapter", 0), m.get("fraction", 0))) if kind == "b" else \
        (lambda m: (m.get("chapter", 0), m.get("at", 0)))
    return sorted(out.values(), key=key)


def merge_entry(a: dict | None, b: dict | None) -> dict:
    """Sloučí záznam knihy ze dvou zařízení: novější místo čtení vyhraje, záložky a označené se spojí,
    smazané (gone: id → čas smazání) zmizí, pokud nebyly potom znovu přidané."""
    a, b = a or {}, b or {}
    gone: dict = {}
    for g in (a.get("gone") or {}, b.get("gone") or {}):
        for k, v in g.items():
            gone[k] = max(gone.get(k, v), v)
    pa, pb = a.get("pos"), b.get("pos")
    pos = pb if pb and (not pa or pb.get("at", 0) > pa.get("at", 0)) else pa
    fa, fb = a.get("file"), b.get("file")
    file = fb if fb and (not fa or fb.get("at", 0) > fa.get("at", 0)) else fa
    return {"title": a.get("title") or b.get("title") or "", "author": a.get("author") or b.get("author") or "",
            "pos": pos, "bookmarks": _merge_marks("b", a.get("bookmarks"), b.get("bookmarks"), gone),
            "highlights": _merge_marks("h", a.get("highlights"), b.get("highlights"), gone),
            "gone": gone, "file": file}


def merge_state(local: dict, remote: dict) -> dict:
    """Celý sync.json: knihy z obou stran sloučené po jedné."""
    books = {}
    lb, rb = (local or {}).get("books") or {}, (remote or {}).get("books") or {}
    for k in set(lb) | set(rb):
        books[k] = merge_entry(lb.get(k), rb.get(k))
    return {"v": 1, "books": books}


def now_ms() -> int:
    return int(time.time() * 1000)


# ------------------------------------------------------------------ Google: přihlášení kódem a Disk
class CloudError(Exception):
    pass


class GoogleDrive:
    """Přístup ke Google Disku. client_id a client_secret si uživatel vytvoří v Google Cloud (návod v programu),
    refresh_token vznikne po přihlášení kódem a ukládá se šifrovaně."""

    TOKEN_URL = "https://oauth2.googleapis.com/token"
    DEVICE_URL = "https://oauth2.googleapis.com/device/code"
    API = "https://www.googleapis.com/drive/v3/files"
    UPLOAD = "https://www.googleapis.com/upload/drive/v3/files"

    def __init__(self, client_id: str, client_secret: str, refresh_token: str = "", opener=None):
        self.client_id, self.client_secret, self.refresh_token = client_id.strip(), client_secret.strip(), refresh_token
        self._open = opener or urllib.request.urlopen
        self._access, self._expires, self._folder = "", 0.0, ""

    # ---- HTTP
    def _req(self, method: str, url: str, data: bytes | None = None, headers: dict | None = None, auth=True):
        h = dict(headers or {})
        if auth:
            h["Authorization"] = f"Bearer {self.access_token()}"
        req = urllib.request.Request(url, data=data, method=method, headers=h)
        try:
            with self._open(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            try:
                j = json.loads(body)
            except ValueError:
                j = {}
            err = j.get("error")
            if isinstance(err, dict):
                err = err.get("message") or err.get("status")
            raise CloudError(_explain(e.code, str(err or body[:200]), j)) from None
        except urllib.error.URLError as e:
            raise CloudError(f"Google Disk není dostupný ({e.reason}). Zkontrolujte připojení k internetu.") from None

    def _form(self, url: str, fields: dict) -> dict:
        return json.loads(self._req("POST", url, urllib.parse.urlencode(fields).encode(),
                                    {"Content-Type": "application/x-www-form-urlencoded"}, auth=False))

    # ---- přihlášení kódem
    def device_start(self) -> dict:
        """Začne přihlášení: vrátí user_code, verification_url, device_code, interval (s)."""
        if not self.client_id:
            raise CloudError("Nejdřív vyplňte ID klienta a tajný klíč klienta z Google Cloud (Návod).")
        j = self._form(self.DEVICE_URL, {"client_id": self.client_id, "scope": SCOPE})
        j.setdefault("verification_url", j.get("verification_uri", "https://www.google.com/device"))
        return j

    def device_poll(self, device_code: str) -> bool:
        """Jednou se zeptá, jestli už uživatel přihlášení potvrdil. True = hotovo (refresh_token uložen)."""
        try:
            j = self._form(self.TOKEN_URL, {"client_id": self.client_id, "client_secret": self.client_secret,
                                            "device_code": device_code,
                                            "grant_type": "urn:ietf:params:oauth:grant-type:device_code"})
        except CloudError as e:
            if "authorization_pending" in str(e) or "slow_down" in str(e):
                return False
            raise
        self.refresh_token = j.get("refresh_token", "")
        self._access, self._expires = j.get("access_token", ""), time.time() + int(j.get("expires_in", 3000)) - 60
        return True

    def access_token(self) -> str:
        if self._access and time.time() < self._expires:
            return self._access
        if not self.refresh_token:
            raise CloudError("Nejste přihlášeni ke Google Disku – v Nastavení klikněte na Přihlásit.")
        j = self._form(self.TOKEN_URL, {"client_id": self.client_id, "client_secret": self.client_secret,
                                        "refresh_token": self.refresh_token, "grant_type": "refresh_token"})
        self._access, self._expires = j["access_token"], time.time() + int(j.get("expires_in", 3000)) - 60
        return self._access

    # ---- soubory
    def _find(self, name: str, parent: str = "", folder=False) -> dict | None:
        q = [f"name = '{name.replace(chr(39), chr(92) + chr(39))}'", "trashed = false"]
        q.append("mimeType = 'application/vnd.google-apps.folder'" if folder else
                 "mimeType != 'application/vnd.google-apps.folder'")
        if parent:
            q.append(f"'{parent}' in parents")
        url = f"{self.API}?q={urllib.parse.quote(' and '.join(q))}&fields=files(id,name,modifiedTime)&spaces=drive"
        files = json.loads(self._req("GET", url)).get("files") or []
        return files[0] if files else None

    def folder(self) -> str:
        if not self._folder:
            f = self._find(FOLDER, folder=True)
            if not f:
                f = json.loads(self._req("POST", self.API, json.dumps(
                    {"name": FOLDER, "mimeType": "application/vnd.google-apps.folder"}).encode(),
                    {"Content-Type": "application/json"}))
            self._folder = f["id"]
        return self._folder

    def list_files(self) -> list[dict]:
        q = urllib.parse.quote(f"'{self.folder()}' in parents and trashed = false")
        return json.loads(self._req("GET", f"{self.API}?q={q}&fields=files(id,name,size,modifiedTime)&pageSize=500"
                                    )).get("files") or []

    def download(self, file_id: str) -> bytes:
        return self._req("GET", f"{self.API}/{file_id}?alt=media")

    def upload(self, name: str, data: bytes, mime: str, file_id: str = "") -> str:
        """Nahraje soubor do složky Překladač (file_id = přepsat existující). Vrátí id souboru."""
        if file_id:
            j = self._req("PATCH", f"{self.UPLOAD}/{file_id}?uploadType=media&fields=id", data, {"Content-Type": mime})
            return json.loads(j)["id"]
        boundary = "prekladac" + str(now_ms())
        meta = json.dumps({"name": name, "parents": [self.folder()]}).encode()
        body = (f"--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n".encode() + meta +
                f"\r\n--{boundary}\r\nContent-Type: {mime}\r\n\r\n".encode() + data + f"\r\n--{boundary}--".encode())
        j = self._req("POST", f"{self.UPLOAD}?uploadType=multipart&fields=id", body,
                      {"Content-Type": f"multipart/related; boundary={boundary}"})
        return json.loads(j)["id"]

    # ---- sync.json
    def get_state(self) -> tuple[dict, str]:
        f = self._find(STATE_FILE, self.folder())
        if not f:
            return {"v": 1, "books": {}}, ""
        try:
            return json.loads(self.download(f["id"]).decode("utf-8")), f["id"]
        except ValueError:
            return {"v": 1, "books": {}}, f["id"]

    def put_state(self, state: dict, file_id: str = "") -> str:
        return self.upload(STATE_FILE, json.dumps(state, ensure_ascii=False).encode("utf-8"), "application/json", file_id)

    def sync(self, local: dict) -> dict:
        """Stáhne sync.json, sloučí s místním stavem a nahraje výsledek. Vrátí sloučený stav."""
        remote, fid = self.get_state()
        merged = merge_state(local, remote)
        if merged != remote:
            self.put_state(merged, fid)
        return merged


def _explain(code: int, err: str, j: dict) -> str:
    if "authorization_pending" in err or j.get("error") == "authorization_pending":
        return "authorization_pending"
    if j.get("error") == "slow_down":
        return "slow_down"
    if j.get("error") == "access_denied":
        return "Přihlášení bylo zamítnuto. Zkuste to znovu a v prohlížeči povolte přístup."
    if j.get("error") == "expired_token":
        return "Kód pro přihlášení vypršel. Klikněte znovu na Přihlásit."
    if j.get("error") in ("invalid_client", "unauthorized_client"):
        return ("Google nezná ID klienta nebo tajný klíč. Zkontrolujte je v Nastavení – klient musí být typu "
                "„TV a zařízení s omezeným vstupem“ (Návod).")
    if j.get("error") == "invalid_grant":
        return "Přihlášení ke Google Disku vypršelo nebo bylo zrušeno – přihlaste se znovu."
    if j.get("error") == "invalid_scope":
        return "Google odmítl oprávnění k Disku. V projektu Google Cloud zapněte Google Drive API (Návod)."
    if code == 403 and ("has not been used" in err or "disabled" in err):
        return "V projektu Google Cloud není zapnuté Google Drive API – zapněte ho (Návod) a zkuste to za pár minut."
    if code == 401:
        return "Přihlášení ke Google Disku vypršelo – přihlaste se znovu."
    return f"Google Disk: {err} (HTTP {code})"
