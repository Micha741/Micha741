"""Vykreslí ikonu programu (assets/icon.png a assets/icon.ico). Spuštění: python tools/make_icon.py"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

S = 1024  # kreslí se ve velkém a zmenšuje, aby hrany byly hladké
OUT = Path(__file__).resolve().parents[1] / "assets"


def font(size):
    for name in ("DejaVuSans-Bold.ttf", "arialbd.ttf", "Arial Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_small() -> Image.Image:
    """Zjednodušená ikona pro 16–32 px (záhlaví okna): modrý čtverec, bílá kniha, velké Č."""
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, S - 1, S - 1], radius=200, fill=(37, 99, 235, 255))
    cx, top_y, bot_y, w = S // 2, 170, 860, 400
    d.polygon([(cx, top_y + 50), (cx - w, top_y), (cx - w, bot_y - 50), (cx, bot_y)], fill=(255, 255, 255, 255))
    d.polygon([(cx, top_y + 50), (cx + w, top_y), (cx + w, bot_y - 50), (cx, bot_y)], fill=(255, 255, 255, 255))
    d.line([(cx, top_y + 50), (cx, bot_y)], fill=(37, 99, 235, 255), width=40)
    for i in range(3):
        y = top_y + 210 + i * 170
        d.line([(cx - w + 80, y - 20), (cx - 90, y + 25)], fill=(37, 99, 235, 255), width=70)
    d.text((cx + w // 2 + 10, (top_y + bot_y) // 2 + 30), "Č", font=font(520), fill=(37, 99, 235, 255),
           anchor="mm")
    return img


def draw() -> Image.Image:
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    # pozadí: zaoblený čtverec s přechodem modré
    grad = Image.new("RGBA", (S, S))
    gd = ImageDraw.Draw(grad)
    top, bottom = (59, 130, 246), (30, 64, 175)
    for y in range(S):
        t = y / (S - 1)
        gd.line([(0, y), (S, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=220, fill=255)
    img.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(img)
    # otevřená kniha
    cx, top_y, bot_y, w = S // 2, 300, 790, 360
    left = [(cx, top_y + 40), (cx - w, top_y), (cx - w, bot_y - 40), (cx, bot_y)]
    right = [(cx, top_y + 40), (cx + w, top_y), (cx + w, bot_y - 40), (cx, bot_y)]
    shadow = [(x + 0, y + 26) for x, y in left] , [(x + 0, y + 26) for x, y in right]
    for poly in shadow:
        d.polygon(poly, fill=(15, 23, 42, 90))
    d.polygon(left, fill=(255, 255, 255, 255))
    d.polygon(right, fill=(226, 232, 240, 255))
    d.line([(cx, top_y + 40), (cx, bot_y)], fill=(148, 163, 184, 255), width=10)
    # řádky textu na levé stránce
    for i in range(5):
        y = top_y + 120 + i * 85
        d.line([(cx - w + 60, y - 12), (cx - 60, y + 20)], fill=(148, 163, 184, 255), width=22)
    # písmeno Č na pravé stránce = překlad do češtiny
    f = font(330)
    d.text((cx + w // 2 + 10, (top_y + bot_y) // 2 + 15), "Č", font=f, fill=(37, 99, 235, 255), anchor="mm")
    # oranžový štítek se šipkou překladu
    bx, by, r = 790, 225, 150
    d.ellipse([bx - r, by - r, bx + r, by + r], fill=(249, 115, 22, 255), outline=(255, 255, 255, 255), width=24)
    d.text((bx, by + 8), "⇄", font=font(190), fill=(255, 255, 255, 255), anchor="mm")
    return img


def main():
    OUT.mkdir(exist_ok=True)
    big, small = draw(), draw_small()
    big.resize((256, 256), Image.LANCZOS).save(OUT / "icon.png")
    for n in (16, 24, 32):
        small.resize((n, n), Image.LANCZOS).save(OUT / f"icon-{n}.png")
    # .ico: malé velikosti zjednodušené, velké podrobné
    frames = [small.resize((n, n), Image.LANCZOS) for n in (16, 24, 32)] + \
             [big.resize((n, n), Image.LANCZOS) for n in (48, 64, 128, 256)]
    frames[-1].save(OUT / "icon.ico", format="ICO", sizes=[f.size for f in frames], append_images=frames[:-1])
    print("hotovo:", OUT)


if __name__ == "__main__":
    main()
