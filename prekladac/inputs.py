"""Pohodlné vyplňování: adresy bez http(s)://, ID klienta Google bez konce „.apps.googleusercontent.com“
a kontrola délky (nechybí znak?). Stejná pravidla jako v Androidu (prekladac-android/src/core/inputs.ts),
společné příklady v tests/fixtures/input_cases.json."""
from __future__ import annotations

import re

GOOGLE_SUFFIX = ".apps.googleusercontent.com"
_LOCAL_PORTS = {"5005", "11434", "5000", "8080", "80"}


def is_local_host(host_port: str) -> bool:
    """Adresa v domácí síti (NAS, Ollama v počítači) – tam bývá http, jinde https."""
    m = re.match(r"^(.*?)(?::(\d+))?$", host_port.lower())
    host, port = m.group(1), m.group(2)
    if port and port in _LOCAL_PORTS:
        return True
    if host == "localhost" or host.endswith((".local", ".lan", ".home")):
        return True
    ip = re.match(r"^(\d+)\.(\d+)\.\d+\.\d+$", host)
    if not ip:
        return bool(host) and "." not in host  # jméno počítače bez domény (NAS, DiskStation)
    a, b = int(ip.group(1)), int(ip.group(2))
    return a in (10, 127) or (a == 192 and b == 168) or (a == 172 and 16 <= b <= 31) or (a == 169 and b == 254)


def normalize_url(v: str) -> str:
    """Doplní http:// nebo https://, když chybí (doma http, jinak https)."""
    s = re.sub(r"\s+", "", v or "")
    if not s:
        return ""
    if re.match(r"^[a-z][a-z0-9+.-]*://", s, re.I):
        return s
    s = re.sub(r"^/+", "", s)
    s = re.sub(r"^(https?):?/*", lambda m: m.group(1).lower() + "://", s, count=1, flags=re.I)
    if re.match(r"^https?://", s, re.I):
        return s
    return ("http://" if is_local_host(s.split("/")[0]) else "https://") + s


def normalize_google_client_id(v: str) -> str:
    """Doplní konec ID klienta Google (stačí část před tečkou, i useknutý konec se dokončí)."""
    s = re.sub(r"\s+", "", v or "")
    if not s:
        return ""
    head, dot, rest = s.partition(".")
    tail = (dot + rest).lower()
    if not re.match(r"^\d+-[A-Za-z0-9]+$", head):
        return s
    if tail in ("", ".") or GOOGLE_SUFFIX.startswith(tail):
        return head + GOOGLE_SUFFIX
    return s


def _cz(n: int) -> str:
    return "znak" if n == 1 else "znaky" if n < 5 else "znaků"


def check_google_client_id(v: str) -> str:
    """Upozornění k ID klienta ('' = v pořádku)."""
    s = (v or "").strip()
    if not s or re.match(r"^\d+-[a-z0-9]{32}\.apps\.googleusercontent\.com$", s):
        return ""
    m = re.match(r"^(\d+)-([A-Za-z0-9]*)(\..*)?$", s)
    if not m:
        return "ID klienta má tvar 123456789012-…(32 znaků)….apps.googleusercontent.com – zkontrolujte ho."
    if (m.group(3) or "") != GOOGLE_SUFFIX:
        return f"Konec ID má být „{GOOGLE_SUFFIX}“."
    n = len(m.group(2))
    if n < 32:
        return f"Za pomlčkou chybí {32 - n} {_cz(32 - n)} (má jich být 32, je {n})."
    if n > 32:
        return f"Za pomlčkou je o {n - 32} {_cz(n - 32)} víc (má jich být 32, je {n})."
    return "V ID klienta jsou jen malá písmena – zkopírujte ho znovu."


def check_google_secret(v: str) -> str:
    """Upozornění k tajnému klíči klienta Google ('' = v pořádku)."""
    s = (v or "").strip()
    if not s or re.match(r"^GOCSPX-[A-Za-z0-9_-]{28}$", s):
        return ""
    if not s.startswith("GOCSPX-"):
        return "Tajný klíč klienta začíná „GOCSPX-“ – zkontrolujte, že jste zkopírovali celý."
    n = len(s) - 7
    if n < 28:
        return f"Tajnému klíči chybí {28 - n} {_cz(28 - n)} (za GOCSPX- má být 28, je {n})."
    if n > 28:
        return f"Tajný klíč je o {n - 28} {_cz(n - 28)} delší (za GOCSPX- má být 28, je {n})."
    return "V tajném klíči je nepovolený znak – zkopírujte ho znovu."


# pole v Nastavení → Služby a klíče: (služba, klíč) → úprava po opuštění pole / kontrola
NORMALIZE = {("gdrive", "client_id"): normalize_google_client_id}
CHECK = {("gdrive", "client_id"): check_google_client_id, ("gdrive", "client_secret"): check_google_secret}
URL_KEYS = {"url", "endpoint"}


def normalizer(service: str, key: str):
    if key in URL_KEYS:
        return normalize_url
    return NORMALIZE.get((service, key))
