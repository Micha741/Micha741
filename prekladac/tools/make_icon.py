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
    big = draw()
    big.resize((256, 256), Image.LANCZOS).save(OUT / "icon.png")
    big.save(OUT / "icon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("hotovo:", OUT)


if __name__ == "__main__":
    main()
