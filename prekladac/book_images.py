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


def crop(data: bytes, box: tuple[float, float, float, float]) -> tuple[bytes, str]:
    """Vyjme část obrázku; box = (vlevo, nahoře, vpravo, dole) jako podíl 0–1 šířky a výšky."""
    from PIL import Image, ImageOps

    with Image.open(io.BytesIO(data)) as im:
        im = ImageOps.exif_transpose(im)
        w, h = im.size
        l, t, r, b = box
        px = (round(max(0, min(l, r)) * w), round(max(0, min(t, b)) * h),
              round(min(1, max(l, r)) * w), round(min(1, max(t, b)) * h))
        if px[2] - px[0] < 2 or px[3] - px[1] < 2:
            raise ValueError("Výřez je příliš malý.")
        out = io.BytesIO()
        im.crop(px).save(out, "PNG")
    return shrink(out.getvalue())


def rotate(data: bytes, clockwise: bool = True) -> tuple[bytes, str]:
    """Otočí obrázek o 90°."""
    from PIL import Image, ImageOps

    with Image.open(io.BytesIO(data)) as im:
        im = ImageOps.exif_transpose(im)
        out = io.BytesIO()
        im.rotate(-90 if clockwise else 90, expand=True).save(out, "PNG")
    return shrink(out.getvalue())


def aspect_box(data: bytes, ratio: float | None, margin: float = 0.0) -> tuple[float, float, float, float]:
    """Výřez na střed obrázku: s poměrem stran ratio (šířka/výška), nebo jen ořez okrajů o margin."""
    w, h = size_px(data)
    if not ratio:
        return (margin, margin, 1 - margin, 1 - margin)
    if w / h > ratio:  # obrázek je širší – ubrat po stranách
        k = (h * ratio) / w
        return ((1 - k) / 2, 0.0, (1 + k) / 2, 1.0)
    k = (w / ratio) / h
    return (0.0, (1 - k) / 2, 1.0, (1 + k) / 2)


def _font(size: int, bold: bool = True):
    from PIL import ImageFont

    names = (["georgiab.ttf", "timesbd.ttf", "DejaVuSerif-Bold.ttf"] if bold
             else ["georgia.ttf", "times.ttf", "DejaVuSerif.ttf"])
    for n in names:
        for p in (n, f"C:/Windows/Fonts/{n}", f"/usr/share/fonts/truetype/dejavu/{n}"):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    return ImageFont.load_default(size=size)


def text_cover(title: str, author: str = "", size: tuple[int, int] = (1200, 1800)) -> bytes:
    """Obálka bez obrázku: jen název a autor na barevném pozadí (JPEG). Kreslí se ve velikosti 1200×1800
    a pak se zmenší – vypadá stejně v náhledu i v e-knize."""
    from PIL import Image, ImageDraw

    W, H = 1200, 1800
    im = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(im)
    top, bottom = (43, 58, 85), (20, 32, 58)
    for y in range(H):  # přechod barvy shora dolů
        k = y / H
        d.line([(0, y), (W, y)], fill=tuple(round(a + (b - a) * k) for a, b in zip(top, bottom)))
    gold = (201, 169, 110)
    d.rectangle([70, 70, W - 70, H - 70], outline=gold, width=6)
    title = (title or "Kniha").strip()
    fs = 120
    while True:  # zalomit název do řádků, které se vejdou
        f = _font(fs)
        lines, cur = [], ""
        for word in title.split():
            test = f"{cur} {word}".strip()
            if cur and d.textlength(test, font=f) > W - 260:
                lines.append(cur)
                cur = word
            else:
                cur = test
        lines.append(cur)
        if (len(lines) <= 6 and all(d.textlength(x, font=f) <= W - 260 for x in lines)) or fs <= 40:
            break
        fs -= 10
    lh = round(fs * 1.25)
    y = round(H * 0.42 - len(lines) * lh / 2)
    for line in lines:
        d.text((W / 2, y), line, font=f, fill=(245, 236, 217), anchor="ma")
        y += lh
    d.line([(W / 2 - 160, y + 30), (W / 2 + 160, y + 30)], fill=gold, width=4)
    if author:
        d.text((W / 2, H - 300), author.strip(), font=_font(60, bold=False), fill=(230, 215, 184), anchor="ma")
    if size != (W, H):
        im = im.resize(size, Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, "JPEG", quality=90)
    return out.getvalue()
