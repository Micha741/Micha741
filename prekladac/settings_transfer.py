"""Přenos nastavení synchronizace do telefonu QR kódem (Google Disk s přihlášením, Synology / WebDAV).

Odkaz „prekladac://nastaveni?d=…“: JSON zkomprimovaný (deflate) a zakódovaný base64url – vejde se do QR kódu.
Telefon ho načte buď fotoaparátem (otevře aplikaci Překladač), nebo v aplikaci tlačítkem „📷 Načíst z počítače“.
Stejný formát čte Android (prekladac-android/src/core/transfer.ts).
Obsahuje přístup k úložišti – QR kód ukazujte jen svému telefonu.
"""
from __future__ import annotations

import base64
import json
import zlib

PREFIX = "prekladac://nastaveni?d="


class TransferError(Exception):
    pass


def payload(engines: dict, provider: str = "", device: str = "") -> dict:
    g, w = engines.get("gdrive", {}), engines.get("webdav", {})
    out: dict = {"v": 1}
    if provider:
        out["p"] = provider
    if g.get("client_id"):
        out["g"] = {k2: g.get(k) for k, k2 in (("client_id", "i"), ("client_secret", "s"), ("refresh_token", "t"))
                    if g.get(k)}
    if w.get("url"):
        out["w"] = {k2: w.get(k) for k, k2 in (("url", "u"), ("user", "n"), ("password", "h")) if w.get(k)}
    if device:
        out["d"] = device
    if "g" not in out and "w" not in out:
        raise TransferError("Nejdřív nastavte Google Disk nebo Synology / WebDAV.")
    return out


def encode(data: dict) -> str:
    raw = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    c = zlib.compressobj(9, zlib.DEFLATED, -15)  # deflate bez hlavičky (v telefonu pako.inflateRaw)
    packed = c.compress(raw) + c.flush()
    return PREFIX + base64.urlsafe_b64encode(packed).decode("ascii").rstrip("=")


def decode(link: str) -> dict:
    s = (link or "").strip()
    if not s.startswith(PREFIX):
        raise TransferError("Toto není kód nastavení z Překladače.")
    b = s[len(PREFIX):]
    try:
        raw = zlib.decompress(base64.urlsafe_b64decode(b + "=" * (-len(b) % 4)), -15)
        data = json.loads(raw.decode("utf-8"))
    except (ValueError, zlib.error) as e:
        raise TransferError("Kód nastavení je poškozený – naskenujte ho znovu.") from e
    if not isinstance(data, dict) or data.get("v") != 1:
        raise TransferError("Kód nastavení je z novější verze – aktualizujte aplikaci.")
    return data


def qr_matrix(text: str) -> list[list[bool]]:
    """QR kód jako mřížka (True = černý modul), včetně tichého okraje."""
    import segno

    q = segno.make(text, error="m", micro=False)
    return [[bool(c) for c in row] for row in q.matrix_iter(scale=1, border=4)]
