"""Obrázky v knize: ukládají se přímo do souboru knihy (*.kniha.json) jako base64.

project["images"] = {"obr_<hash>.jpg": "<base64>"}, v HTML kapitoly <img src="obr_<hash>.jpg" width="…">.
project["cover"]  = název obrázku obálky (nebo chybí).
Šířka obrázku v editoru je v pixelech vůči „stránce“ PAGE_PX px; v DOCX se přepočte na palce.
"""
from __future__ import annotations

import base64
import hashlib
import io
import re

PAGE_PX = 800          # šířka textu stránky v editoru, ke které se vztahuje šířka obrázku
PAGE_WIDTH_IN = 6.3    # šířka textu stránky A4 v DOCX (palce)
PAGE_HEIGHT_IN = 9.2
MAX_SIDE = 1600        # větší obrázky se zmenší
IMG_RE = re.compile(r"""<img\b[^>]*\bsrc=["']([^"']+)["']""", re.I)


def add_image(project: dict, data: bytes, ext: str) -> str:
    ext = (ext or "png").lower().lstrip(".").replace("jpeg", "jpg")
    name = f"obr_{hashlib.sha1(data).hexdigest()[:12]}.{ext}"
    project.setdefault("images", {})[name] = base64.b64encode(data).decode("ascii")
    return name


def get_image(project: dict, name: str) -> bytes | None:
    b64 = (project.get("images") or {}).get(name)
    return base64.b64decode(b64) if b64 else None


def used_names(project: dict) -> set[str]:
    names = set()
    for ch in project.get("chapters", []):
        names.update(IMG_RE.findall(ch.get("html") or ""))
    if project.get("cover"):
        names.add(project["cover"])
    return names


def prune(project: dict) -> None:
    """Smaže z knihy obrázky, které už nikde nejsou (po smazání v editoru)."""
    imgs = project.get("images")
    if imgs:
        keep = used_names(project)
        for n in [n for n in imgs if n not in keep]:
            del imgs[n]


def shrink(data: bytes) -> tuple[bytes, str]:
    """Zmenší velkou fotku (delší strana MAX_SIDE) a uloží jako JPEG, s průhledností PNG."""
    from PIL import Image, ImageOps

    with Image.open(io.BytesIO(data)) as im:
        im = ImageOps.exif_transpose(im)
        im.thumbnail((MAX_SIDE, MAX_SIDE))
        out = io.BytesIO()
        if im.mode in ("RGBA", "LA", "P") and ("transparency" in im.info or im.mode != "P"):
            im.convert("RGBA").save(out, "PNG", optimize=True)
            return out.getvalue(), "png"
        im.convert("RGB").save(out, "JPEG", quality=85, optimize=True)
        return out.getvalue(), "jpg"


def size_px(data: bytes) -> tuple[int, int]:
    from PIL import Image

    with Image.open(io.BytesIO(data)) as im:
        return im.size


def docx_width_inches(width_px: float | None, data: bytes) -> float:
    """Šířka obrázku v DOCX: podle šířky z editoru, jinak přirozená; nejvýš šířka stránky."""
    if not width_px:
        width_px = size_px(data)[0]
    return max(0.3, min(PAGE_WIDTH_IN, float(width_px) / PAGE_PX * PAGE_WIDTH_IN))
