"""Mezipaměť překladů: jednou přeložený úsek textu se podruhé neposílá překladači.

Hodí se při opakovaném překladu stejné knihy (nové nastavení výstupu, jiný formát), při pokračování po
přerušení (už přeložené kapitoly se vezmou z mezipaměti) a u opakovaných vět (každá se přeloží jen jednou).
Šetří čas i placené znaky u DeepL, Google Cloud, Claude a dalších.

Klíč úseku = překladač + model + cílový jazyk + pokyny + glosář + druh textu (se značkami / bez) + text.
Změna kterékoli části znamená nový překlad. Uloženo v SQLite vedle nastavení programu (jen text, žádné klíče).
"""
from __future__ import annotations

import hashlib
import sqlite3
import threading
import time
from pathlib import Path

CHUNK_CHARS = 20000  # po tolika znacích se přeložené úseky průběžně ukládají (pokračování po přerušení)


def default_path() -> Path:
    import components

    return components.app_dir() / "mezipamet" / "preklady.sqlite"


class TranslationCache:
    def __init__(self, path: str | Path | None = None):
        self.path = Path(path) if path else default_path()
        self._lock = threading.Lock()

    def _db(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(self.path, timeout=10)
        db.execute("CREATE TABLE IF NOT EXISTS tr (k TEXT PRIMARY KEY, v TEXT NOT NULL, t INTEGER NOT NULL)")
        return db

    @staticmethod
    def key(cache_id: str, markup: bool, text: str) -> str:
        return hashlib.sha256(f"{cache_id}\x00{int(bool(markup))}\x00{text}".encode("utf-8")).hexdigest()

    def get_many(self, keys: list[str]) -> dict[str, str]:
        out: dict[str, str] = {}
        if not keys:
            return out
        with self._lock:
            db = self._db()
            try:
                uniq = list(dict.fromkeys(keys))
                for i in range(0, len(uniq), 500):
                    part = uniq[i:i + 500]
                    rows = db.execute(f"SELECT k, v FROM tr WHERE k IN ({','.join('?' * len(part))})", part)
                    out.update(rows.fetchall())
            finally:
                db.close()
        return out

    def put_many(self, items: dict[str, str]) -> None:
        if not items:
            return
        now = int(time.time())
        with self._lock:
            db = self._db()
            try:
                with db:
                    db.executemany("INSERT OR REPLACE INTO tr (k, v, t) VALUES (?, ?, ?)",
                                   [(k, v, now) for k, v in items.items()])
            finally:
                db.close()

    def stats(self) -> tuple[int, int]:
        """(počet uložených úseků, velikost souboru v bajtech)."""
        if not self.path.is_file():
            return 0, 0
        with self._lock:
            db = self._db()
            try:
                n = db.execute("SELECT COUNT(*) FROM tr").fetchone()[0]
            finally:
                db.close()
        return n, self.path.stat().st_size

    def clear(self) -> None:
        with self._lock:
            if self.path.is_file():
                db = self._db()
                try:
                    with db:
                        db.execute("DELETE FROM tr")
                    db.execute("VACUUM")
                finally:
                    db.close()


def describe(cache: TranslationCache) -> str:
    n, size = cache.stats()
    if not n:
        return "Mezipaměť je prázdná."
    return f"Uloženo {n:,} přeložených úseků ({size / 1e6:.1f} MB).".replace(",", " ")


class CachedTranslator:
    """Obal překladače: úseky z mezipaměti se nepřekládají, nové se po částech přeloží a uloží."""

    def __init__(self, tr, cache: TranslationCache, cache_id: str, log=print, chunk_chars: int = CHUNK_CHARS):
        self._tr, self.cache, self.cache_id, self._log, self.chunk_chars = tr, cache, cache_id, log, chunk_chars
        self.hits = 0

    def __getattr__(self, name):
        return getattr(self._tr, name)

    def translate_segments(self, segments, markup, progress=None, context=""):
        result = list(segments)
        todo = [i for i, s in enumerate(segments) if s.strip()]
        if not todo:
            return result
        keys = {i: self.cache.key(self.cache_id, markup, segments[i]) for i in todo}
        try:
            known = self.cache.get_many(list(keys.values()))
        except sqlite3.Error as e:
            self._log(f"  ! Mezipaměť překladů nejde číst ({e}) – překládám bez ní.")
            return self._tr.translate_segments(segments, markup, progress=progress, context=context)
        missing: dict[str, str] = {}  # klíč → text (stejné věty se přeloží jen jednou)
        for i in todo:
            if keys[i] in known:
                result[i] = known[keys[i]]
            else:
                missing.setdefault(keys[i], segments[i])
        hits = sum(1 for i in todo if keys[i] in known)
        self.hits += hits
        if hits:
            self._log(f"  ♻ Z mezipaměti: {hits} z {len(todo)} úseků (nepřekládají se znovu)")
        if missing:
            items = list(missing.items())
            chunks, cur, size = [], [], 0
            for kv in items:
                if cur and size + len(kv[1]) > self.chunk_chars:
                    chunks.append(cur)
                    cur, size = [], 0
                cur.append(kv)
                size += len(kv[1])
            if cur:
                chunks.append(cur)
            total = sum(len(t) for _, t in items) or 1
            done = 0
            for chunk in chunks:
                share = sum(len(t) for _, t in chunk) / total
                base = done / total
                sub = (lambda f, b=base, s=share: progress(b + f * s)) if progress else None
                out = self._tr.translate_segments([t for _, t in chunk], markup, progress=sub, context=context)
                fresh = {k: o for (k, src), o in zip(chunk, out) if o and o.strip() and o != src}
                known.update({k: o for (k, _), o in zip(chunk, out)})
                try:
                    self.cache.put_many(fresh)
                except sqlite3.Error as e:
                    self._log(f"  ! Do mezipaměti překladů nejde zapisovat ({e}).")
                done += sum(len(t) for _, t in chunk)
            for i in todo:
                result[i] = known.get(keys[i], segments[i])
        if progress:
            progress(1.0)
        return result


def wrap(tr, cache_id: str, extra: str = "", log=print, cache: TranslationCache | None = None):
    """Překladač s mezipamětí (extra = např. glosář knihy, aby jeho změna znamenala nový překlad)."""
    if tr is None or not cache_id:
        return tr
    return CachedTranslator(tr, cache or TranslationCache(), cache_id + ("\x00" + extra if extra else ""), log)
