"""Hledání knih pro čtečku (stejné zdroje jako v aplikaci pro Android).

- Project Gutenberg (rozhraní Gutendex) a katalog Google Books přímo v programu: volná díla se rovnou stáhnou
  a otevřou ve čtečce, u ostatních je ukázka (čtení na webu Google Books) a odkaz na koupi.
- Obchody a knihovny (Amazon, Alza, Kosmas, Martinus, Palmknihy, Google Play, městské knihovny…) se otevřou
  v prohlížeči s vyhledaným názvem.
- Kniha nebo ukázka z odkazu (EPUB, PDF…) se stáhne a otevře; koupené knihy bez šifrování se otevřou
  ze složky Stažené soubory.
"""
from __future__ import annotations

import json
import os
import re
import time
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

BOOK_EXT = (".epub", ".pdf", ".mobi", ".azw3", ".azw", ".fb2", ".docx", ".odt", ".rtf", ".txt", ".pdb", ".htm",
            ".html", ".kfx")


def _site(domain: str, extra: str = ""):
    """Hledání na webu bez stabilní adresy vyhledávání – přes Google omezené na ten web."""
    return lambda q: "https://www.google.com/search?q=" + quote(" ".join(f"{q} {extra} site:{domain}".split()))


KIND_LABEL = {
    "free": "zdarma – stáhne se a otevře ve čtečce",
    "social": "koupě, většinou bez šifrování – po stažení se otevře ve čtečce",
    "drm": "zašifrované (DRM) – jen v jejich aplikaci",
    "library": "knihovna – katalog a výpůjčky",
}


@dataclass
class Source:
    id: str
    name: str
    kind: str
    note: str
    url: object  # funkce dotaz → adresa


SOURCES: list[Source] = [
    Source("mkp", "Městská knihovna v Praze – e-knihy zdarma", "free",
           "Česká klasika volně ke stažení (EPUB, MOBI, PDF).", _site("mlp.cz", "e-kniha")),
    Source("wikisource", "Wikizdroje", "free", "Volná díla v češtině.",
           lambda q: f"https://cs.wikisource.org/w/index.php?search={quote(q)}"),
    Source("standard", "Standard Ebooks", "free", "Pečlivě upravená volná díla v angličtině.",
           lambda q: f"https://standardebooks.org/ebooks?query={quote(q)}"),
    Source("gutenberg-web", "Project Gutenberg (web)", "free", "Volná díla; výsledky jsou i přímo v programu.",
           lambda q: f"https://www.gutenberg.org/ebooks/search/?query={quote(q)}"),
    Source("archive", "Internet Archive", "free", "Volná díla ke stažení; některé knihy jen k zapůjčení.",
           lambda q: f"https://archive.org/search?query={quote(q)}"),
    Source("openlibrary", "Open Library", "free", "Katalog a volná díla; výpůjčky jsou šifrované.",
           lambda q: f"https://openlibrary.org/search?q={quote(q)}"),
    Source("palmknihy", "Palmknihy", "social", "Ukázky zdarma. U knihy hledejte „sociální DRM“.", _site("palmknihy.cz")),
    Source("kosmas", "Kosmas", "social", "Ukázky zdarma. Pozor na knihy s Adobe DRM (.acsm).",
           _site("kosmas.cz", "e-kniha")),
    Source("martinus", "Martinus", "social", "E-knihy většinou se sociálním DRM.",
           lambda q: f"https://www.martinus.cz/search?q={quote(q)}"),
    Source("alza", "Alza", "social", "E-knihy většinou se sociálním DRM (vodoznak).",
           lambda q: f"https://www.alza.cz/search.htm?exps={quote(q + ' e-kniha')}"),
    Source("smashwords", "Smashwords", "social", "Nezávislí autoři, knihy bez šifrování, část zdarma.",
           lambda q: f"https://www.smashwords.com/books/search?query={quote(q)}"),
    Source("amazon", "Amazon Kindle", "drm", "Jen v aplikaci Kindle; ukázku si pošlete do Kindle.",
           lambda q: f"https://www.amazon.com/s?k={quote(q)}&i=digital-text"),
    Source("gplay", "Google Play Knihy", "drm", "Většinou jen v aplikaci Google Play Knihy; ukázky zdarma.",
           lambda q: f"https://play.google.com/store/search?q={quote(q)}&c=books"),
    Source("mkp-katalog", "Městská knihovna v Praze", "library", "Katalog, e-výpůjčky v jejich aplikaci.",
           _site("mlp.cz")),
    Source("kjm", "Knihovna Jiřího Mahena v Brně", "library", "Katalog a e-výpůjčky.", _site("kjm.cz")),
    Source("mzk", "Moravská zemská knihovna (Brno)", "library", "Katalog; digitalizované staré knihy.", _site("mzk.cz")),
    Source("plzen", "Knihovna města Plzně", "library", "Katalog a e-výpůjčky.", _site("knihovna.plzen.eu")),
    Source("cbvk", "Jihočeská vědecká knihovna (České Budějovice)", "library", "Katalog a e-výpůjčky.",
           _site("cbvk.cz")),
]

# „Moje knihy“ v obchodech – koupené knihy se stahují v prohlížeči po přihlášení (program hesla nezná)
ACCOUNTS = [
    ("Palmknihy – moje knihy", "https://www.palmknihy.cz/uzivatel/moje-knihy"),
    ("Kosmas – moje e-knihy", "https://www.kosmas.cz/uzivatel/eknihy/"),
    ("Martinus – moje e-knihy", "https://www.martinus.cz/muj-ucet/e-knihy"),
    ("Alza – moje e-knihy", "https://www.alza.cz/my-account/ebooks.htm"),
    ("Google Play Knihy – knihovna", "https://play.google.com/books"),
    ("Amazon Kindle – čtení na webu", "https://read.amazon.com/"),
]


@dataclass
class FoundBook:
    """Kniha z katalogu (Gutenberg nebo Google Books)."""
    id: str
    title: str
    authors: str
    source: str               # „Project Gutenberg“, „Google Books“
    language: str = ""
    description: str = ""
    cover: str | None = None
    price: str | None = None   # „zdarma“, „249 Kč“…
    download: str | None = None  # stažení celé knihy (volná díla)
    preview: str | None = None   # ukázka / čtení na webu
    buy: str | None = None
    downloads: int = 0
    extra: dict = field(default_factory=dict)
    drm: str = "unknown"        # "free" = bez šifrování, "drm" = zašifrované, "none" = jen katalog, "unknown"
    opens: bool | None = None   # otevře ji Překladač? (True / False / None = nevíme)
    store: str = ""             # zobrazený název obchodu nebo knihovny


def _https(u: str | None) -> str | None:
    return re.sub(r"^http://", "https://", u) if u else None


def gutendex_url(q: str, lang: str | None = None) -> str:
    return f"https://gutendex.com/books/?search={quote(q)}" + (f"&languages={quote(lang)}" if lang else "")


def parse_gutendex(j: dict) -> list[FoundBook]:
    out = []
    for r in (j or {}).get("results") or []:
        f = r.get("formats") or {}
        epub = f.get("application/epub+zip")
        if not epub:
            continue
        authors = ", ".join(" ".join(reversed(str(a.get("name", "")).split(", "))) for a in r.get("authors") or [])
        out.append(FoundBook(id=f"pg{r.get('id')}", title=str(r.get("title") or ""), authors=authors,
                             source="Project Gutenberg", language=",".join(r.get("languages") or []),
                             cover=_https(f.get("image/jpeg")), price="zdarma", download=_https(epub),
                             preview=f"https://www.gutenberg.org/ebooks/{r.get('id')}",
                             downloads=int(r.get("download_count") or 0), drm="free", opens=True,
                             store="Project Gutenberg"))
    return out


def gutenberg_opds_url(q: str) -> str:
    """Záloha, když Gutendex nejde: vyhledávání přímo v katalogu gutenberg.org (formát OPDS)."""
    return f"https://www.gutenberg.org/ebooks/search.opds/?query={quote(q)}"


def parse_gutenberg_opds(xml: str) -> list[FoundBook]:
    import html as _html

    out, seen = [], set()
    for entry in re.findall(r"<entry>(.*?)</entry>", xml, re.S):
        m = re.search(r"/ebooks/(\d+)(?:\.opds)?[\"<]", entry)
        if not m or m.group(1) in seen:
            continue
        n = m.group(1)
        seen.add(n)
        title = _html.unescape(re.sub(r"<[^>]+>", "", (re.search(r"<title[^>]*>(.*?)</title>", entry, re.S) or [None, ""])[1])).strip()
        author = _html.unescape(re.sub(r"<[^>]+>", "", (re.search(r"<content[^>]*>(.*?)</content>", entry, re.S) or [None, ""])[1])).strip()
        if not title:
            continue
        out.append(FoundBook(id=f"pg{n}", title=title, authors=author if len(author) < 120 else "",
                             source="Project Gutenberg", price="zdarma",
                             download=f"https://www.gutenberg.org/ebooks/{n}.epub3.images",
                             cover=f"https://www.gutenberg.org/cache/epub/{n}/pg{n}.cover.medium.jpg",
                             preview=f"https://www.gutenberg.org/ebooks/{n}", drm="free", opens=True,
                             store="Project Gutenberg"))
    return out


def gutenberg_search(q: str, lang: str | None = None) -> list[FoundBook]:
    """Gutendex (umí filtr jazyka); když nejde (ochrana proti robotům, výpadek), přímo katalog gutenberg.org."""
    from free_engines import http_request

    try:
        return parse_gutendex(_get_json(gutendex_url(q, lang), "Project Gutenberg"))
    except Exception:  # noqa: BLE001
        xml = http_request(gutenberg_opds_url(q), timeout=30, retries=1, service="Project Gutenberg")
        return parse_gutenberg_opds(xml.decode("utf-8", "replace"))


GB_FIELDS = ("items(id,volumeInfo(title,subtitle,authors,description,language,imageLinks/thumbnail,previewLink,"
             "infoLink),saleInfo(saleability,listPrice,retailPrice,buyLink),accessInfo(publicDomain,webReaderLink,"
             "viewability,epub(isAvailable,downloadLink),pdf(isAvailable,downloadLink)))")


def google_books_url(q: str, lang: str | None = None, key: str | None = None) -> str:
    return (f"https://www.googleapis.com/books/v1/volumes?q={quote(q)}&maxResults=20&printType=books"
            f"&fields={quote(GB_FIELDS)}" + (f"&langRestrict={quote(lang)}" if lang else "")
            + (f"&key={quote(key)}" if key else ""))


def parse_google_books(j: dict) -> list[FoundBook]:
    out = []
    for it in (j or {}).get("items") or []:
        v, sale, acc = it.get("volumeInfo") or {}, it.get("saleInfo") or {}, it.get("accessInfo") or {}
        p = sale.get("retailPrice") or sale.get("listPrice") or {}
        free = bool(acc.get("publicDomain")) or sale.get("saleability") == "FREE"
        price = "zdarma" if free else (
            f"{round(float(p['amount']), 2):g} {'Kč' if p.get('currencyCode') == 'CZK' else p.get('currencyCode', '')}".strip()
            if p.get("amount") is not None else None)
        download = None
        if acc.get("publicDomain"):
            download = _https((acc.get("epub") or {}).get("downloadLink")) or _https((acc.get("pdf") or {}).get("downloadLink"))
        acs = (acc.get("epub") or {}).get("acsTokenLink") or (acc.get("pdf") or {}).get("acsTokenLink")
        if download:
            drm, opens = "free", True
        elif acs or sale.get("saleability") in ("FOR_SALE", "FOR_SALE_AND_RENTAL", "FOR_RENTAL_ONLY"):
            drm, opens = "drm", False  # Google Play Knihy: šifrované (Adobe DRM), jen v aplikaci Google
        elif sale.get("saleability") == "NOT_FOR_SALE":
            drm, opens = "none", None
        else:
            drm, opens = "unknown", None
        view = acc.get("viewability")
        title = ": ".join(x for x in (v.get("title"), v.get("subtitle")) if x)
        if not title:
            continue
        out.append(FoundBook(
            id=f"gb{it.get('id', '')}", title=title, authors=", ".join(v.get("authors") or []), source="Google Books",
            language=v.get("language") or "", description=re.sub(r"<[^>]+>", "", str(v.get("description") or ""))[:600],
            cover=_https((v.get("imageLinks") or {}).get("thumbnail")), price=price, download=download,
            preview=_https(acc.get("webReaderLink") or v.get("previewLink")) if view and view != "NO_PAGES" else None,
            buy=_https(sale.get("buyLink")) or _https(v.get("infoLink")), drm=drm, opens=opens,
            store="Google Play Knihy" if sale.get("buyLink") else "Google Books"))
    return out


# ------------------------------------------------------------------ Open Library / Internet Archive
def openlibrary_url(title: str = "", author: str = "", q: str = "") -> str:
    parts = []
    if title:
        parts.append(f"title={quote(title)}")
    if author:
        parts.append(f"author={quote(author)}")
    if q:
        parts.append(f"q={quote(q)}")
    return ("https://openlibrary.org/search.json?" + "&".join(parts) +
            "&limit=20&fields=key,title,author_name,language,cover_i,ebook_access,ia,first_publish_year")


def parse_openlibrary(j: dict) -> list[FoundBook]:
    out = []
    for d in (j or {}).get("docs") or []:
        title = str(d.get("title") or "")
        if not title:
            continue
        access = d.get("ebook_access") or "no_ebook"
        ia = (d.get("ia") or [None])[0]
        b = FoundBook(id="ol" + str(d.get("key", "")), title=title, authors=", ".join((d.get("author_name") or [])[:3]),
                      source="Open Library", language=",".join((d.get("language") or [])[:3]),
                      cover=f"https://covers.openlibrary.org/b/id/{d['cover_i']}-M.jpg" if d.get("cover_i") else None,
                      preview=f"https://openlibrary.org{d.get('key', '')}", buy=f"https://openlibrary.org{d.get('key', '')}",
                      store="Internet Archive" if ia else "Open Library")
        if access == "public" and ia:
            b.download, b.drm, b.opens, b.price = f"https://archive.org/download/{ia}/{ia}.epub", "free", True, "zdarma"
        elif access in ("borrowable", "printdisabled"):
            b.drm, b.opens, b.price = "drm", False, "výpůjčka"
        else:
            b.drm, b.opens = "none", None
        out.append(b)
    return out


# ------------------------------------------------------------------ Wikizdroje (volná díla v češtině)
def wikisource_url(q: str, lang: str = "cs") -> str:
    return (f"https://{lang}.wikisource.org/w/api.php?action=query&list=search&format=json&srlimit=20"
            f"&srnamespace=0&srsearch={quote(q)}")


def parse_wikisource(j: dict, lang: str = "cs") -> list[FoundBook]:
    out = []
    for r in ((j or {}).get("query") or {}).get("search") or []:
        title = str(r.get("title") or "")
        if not title or "/" in title:  # podstránky (kapitoly) vynechat
            continue
        page = quote(title.replace(" ", "_"))
        out.append(FoundBook(id=f"ws{lang}{r.get('pageid', title)}", title=title, authors="", source="Wikizdroje",
                             language=lang, price="zdarma", drm="free", opens=True, store="Wikizdroje",
                             download=f"https://ws-export.wmcloud.org/?format=epub&lang={lang}&page={page}",
                             preview=f"https://{lang}.wikisource.org/wiki/{page}"))
    return out


# zdroje hledané přímo v programu: id → (název, popis)
CATALOGS = {
    "gutenberg": ("Project Gutenberg", "volná díla, hlavně v angličtině – stáhne se a otevře"),
    "wikisource": ("Wikizdroje", "volná díla v češtině – stáhne se jako EPUB a otevře"),
    "openlibrary": ("Open Library / Internet Archive", "volná díla ke stažení, ostatní jen k zapůjčení"),
    "google": ("Google Books / Google Play", "katalog, ukázky a ceny; koupené knihy jsou šifrované"),
}


def _get_json(url: str, service: str) -> dict:
    from free_engines import http_request

    return json.loads(http_request(url, timeout=30, retries=1, service=service).decode("utf-8"))


def google_query(title: str = "", author: str = "", keyword: str = "") -> str:
    parts = [keyword.strip()] if keyword.strip() else []
    if title.strip():
        parts.append(f"intitle:{title.strip()}")
    if author.strip():
        parts.append(f"inauthor:{author.strip()}")
    return " ".join(parts)


def search_sources(title: str = "", author: str = "", keyword: str = "", sources=None, lang: str | None = None,
                   key: str | None = None) -> tuple[list[FoundBook], dict[str, str]]:
    """Hledá ve zvolených katalozích (CATALOGS) podle názvu, autora a klíčového slova.
    Vrátí (knihy, stav každého zdroje: „12 knih“ nebo text chyby)."""
    from concurrent.futures import ThreadPoolExecutor

    sources = list(sources or CATALOGS)
    plain = " ".join(x.strip() for x in (title, author, keyword) if x.strip())
    if not plain:
        return [], {}
    wlang = lang if lang in ("cs", "sk", "en", "de", "fr", "pl") else "cs"

    def wikisource():
        return parse_wikisource(_get_json(wikisource_url(plain, wlang), "Wikizdroje"), wlang)

    jobs = {
        "gutenberg": lambda: gutenberg_search(plain, lang),
        "wikisource": wikisource,
        "openlibrary": lambda: parse_openlibrary(_get_json(openlibrary_url(title, author, keyword), "Open Library")),
        "google": lambda: parse_google_books(_get_json(google_books_url(google_query(title, author, keyword), lang, key),
                                                       "Google Books")),
    }
    books, status = [], {}
    with ThreadPoolExecutor(4) as ex:
        futs = {s: ex.submit(jobs[s]) for s in sources if s in jobs}
        for s, f in futs.items():
            try:
                found = f.result()
                books.extend(found)
                status[s] = f"{len(found)}"
            except Exception as e:  # noqa: BLE001 – jeden katalog nedostupný, ostatní mohou fungovat
                status[s] = "chyba: " + str(e).split(". ")[0][:160]
    # nejdřív knihy, které Překladač otevře, pak s ukázkou, pak ostatní
    books.sort(key=lambda b: (b.opens is not True, not b.preview, -b.downloads))
    return books, status


def search(q: str, lang: str | None = None, key: str | None = None) -> tuple[list[FoundBook], list[str]]:
    """Jednoduché hledání jedním textem (Project Gutenberg a Google Books). Vrátí (knihy, chyby)."""
    books, status = search_sources(keyword=q, sources=["gutenberg", "google"], lang=lang, key=key)
    names = {"gutenberg": "Project Gutenberg", "google": "Google Books"}
    return books, [f"{names[s]}: {v[7:]}" for s, v in status.items() if v.startswith("chyba")]


# ------------------------------------------------------------------ našeptávač
def fold(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if not unicodedata.combining(c))


def _key(t: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", fold(t)).strip()


def suggest_url(q: str, lang: str | None = None) -> str:
    return (f"https://www.googleapis.com/books/v1/volumes?q={quote(q)}&maxResults=10&printType=books"
            f"&fields=items(volumeInfo(title,authors))" + (f"&langRestrict={quote(lang)}" if lang else ""))


def parse_suggest(j: dict) -> list[tuple[str, str]]:
    return [(str((it.get("volumeInfo") or {}).get("title") or ""), ", ".join((it.get("volumeInfo") or {}).get("authors") or []))
            for it in (j or {}).get("items") or [] if (it.get("volumeInfo") or {}).get("title")]


def merge_suggestions(q: str, history: list[str], web: list[tuple[str, str]], max_n: int = 8) -> list[str]:
    """Návrhy pro našeptávač: nejdřív dřívější hledání odpovídající psanému textu, pak katalog; bez duplicit."""
    words = fold(q.strip()).split()
    out, seen = [], set()
    local = [h for h in history if all(w in fold(h) for w in words)]
    web_q = []
    for title, author in web:
        surname = author.split(",")[0].strip().split()[-1] if author.strip() else ""
        web_q.append(f"{title.strip()} {surname}".strip())
    for s in local + web_q:
        k = _key(s)
        if s.strip() and k not in seen:
            seen.add(k)
            out.append(s.strip())
        if len(out) >= max_n:
            break
    return out


def suggest(q: str, history: list[str], lang: str | None = None) -> list[str]:
    try:
        web = parse_suggest(_get_json(suggest_url(q, lang), "Našeptávač"))
    except Exception:  # noqa: BLE001 – bez internetu jen historie
        web = []
    return merge_suggestions(q, history, web)


def add_history(history: list[str] | None, q: str) -> list[str]:
    t = q.strip()
    if not t:
        return list(history or [])
    return [t] + [h for h in history or [] if fold(h) != fold(t)][:14]


# ------------------------------------------------------------------ stažení knihy nebo ukázky
def sniff_ext(data: bytes) -> str | None:
    """Přípona podle obsahu souboru (odkazy často nemají příponu)."""
    head = data[:4096]
    if head.startswith(b"%PDF"):
        return ".pdf"
    if head.startswith(b"PK"):
        if b"application/epub+zip" in head[:200]:
            return ".epub"
        if b"word/" in data[:65536]:
            return ".docx"
        if b"opendocument.text" in head:
            return ".odt"
        return ".epub"
    if data[60:68] == b"BOOKMOBI":
        return ".mobi"
    if data[60:68] in (b"TEXtREAd",):
        return ".pdb"
    if head.lstrip().startswith(b"{\\rtf"):
        return ".rtf"
    if b"<FictionBook" in head:
        return ".fb2"
    low = head.lower()
    if b"<html" in low or b"<!doctype html" in low:
        return ".html"
    return None


def file_name_from_url(url: str, title: str | None = None) -> str:
    name = unquote(Path(urlparse(url).path).name)
    if title:
        name = title
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]+', " ", name).strip(" .") or "kniha"
    return name[:90]


def books_dir() -> Path:
    """Složka pro stažené knihy: Dokumenty\\Knihy z Překladače."""
    base = Path(os.environ.get("USERPROFILE") or Path.home())
    docs = base / "Documents"
    p = (docs if docs.is_dir() else base) / "Knihy z Překladače"
    p.mkdir(parents=True, exist_ok=True)
    return p


def download_book(url: str, title: str | None = None, dest: Path | None = None) -> Path:
    """Stáhne knihu nebo ukázku z odkazu a uloží ji se správnou příponou. Vrátí cestu k souboru."""
    from free_engines import EngineError, http_request

    if not re.match(r"^https?://", url.strip(), re.I):
        raise EngineError("Odkaz musí začínat http:// nebo https://")
    data = http_request(url.strip(), timeout=300, retries=2, service="Stažení knihy")
    ext = sniff_ext(data)
    url_ext = Path(urlparse(url).path).suffix.lower()
    if ext == ".html":
        raise EngineError("Odkaz vede na webovou stránku, ne na soubor knihy. Otevřete ho v prohlížeči a použijte "
                          "tam tlačítko pro stažení (např. „Stáhnout ukázku“); pak knihu otevřete ze složky "
                          "Stažené soubory.")
    if ext is None:
        ext = url_ext if url_ext in BOOK_EXT else ".txt"
    if ext == ".epub" and url_ext in (".kfx", ".azw3", ".azw"):
        ext = url_ext
    dest = dest or books_dir()
    base = file_name_from_url(url, title)
    if base.lower().endswith(ext):
        base = base[: -len(ext)]
    path = dest / f"{base}{ext}"
    n = 2
    while path.exists() and path.read_bytes() != data:
        path = dest / f"{base} ({n}){ext}"
        n += 1
    path.write_bytes(data)
    return path


def downloads_dir() -> Path:
    base = Path(os.environ.get("USERPROFILE") or Path.home())
    for name in ("Downloads", "Stažené soubory"):
        if (base / name).is_dir():
            return base / name
    return base / "Downloads"


def recent_downloads(folder: Path | None = None, days: int = 60, limit: int = 30) -> list[Path]:
    """Knihy ve složce Stažené soubory (nejnovější první) – co jste si stáhli z obchodu nebo ukázky."""
    folder = folder or downloads_dir()
    if not folder.is_dir():
        return []
    cutoff = time.time() - days * 86400
    files = []
    for p in folder.iterdir():
        try:
            if p.is_file() and p.suffix.lower() in BOOK_EXT and p.stat().st_mtime >= cutoff:
                files.append(p)
        except OSError:
            continue
    files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return files[:limit]
