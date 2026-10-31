#!/usr/bin/env python3
"""Testovací obrazovka pro simulaci: barevné pruhy, šachovnice, nápis z vlastního fontu 5x7, BRIGHT a FLASH.
Výstup screen.hex = 16K obsah video RAM (offset od 4000h)."""
mem = [0] * 16384

def bm_addr(x, y):  # x = sloupec znaku 0..31, y = řádek pixelu 0..191
    return ((y & 0xC0) << 5) | ((y & 7) << 8) | ((y & 0x38) << 2) | x

# vlastní jednoduchý font 5x7 pro "GAMA OK"
FONT = {
    "G": ["01110", "10000", "10000", "10111", "10001", "10001", "01110"],
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    " ": ["00000"] * 7,
}
for cy in range(24):
    for cx in range(32):
        a = 0x1800 + cy * 32 + cx
        if cy < 8:          # pruhy: paper = sloupec mod 8, ink bílý/černý, horní polovina BRIGHT
            paper = cx // 4
            mem[a] = (0x40 if cy < 4 else 0) | (paper << 3) | (7 if paper < 4 else 0)
        elif cy < 16:       # šachovnice, modrý ink na žlutém paper
            mem[a] = (6 << 3) | 1
        else:               # nápis: bílý ink na modrém paper, poslední řádek FLASH
            mem[a] = (1 << 3) | 7 | (0x40 if cy == 17 else 0) | (0x80 if cy == 23 else 0)
        for py in range(8):
            y = cy * 8 + py
            if cy < 8:
                v = 0xF0 if (py < 4) else 0x0F
            elif cy < 16:
                v = 0xAA if (y & 1) else 0x55
            else:
                v = 0
            mem[bm_addr(cx, y)] = v
text = "GAMA OK"
for i, ch in enumerate(text):
    for r, bits in enumerate(FONT[ch]):
        y = 17 * 8 + r
        mem[bm_addr(4 + i * 3, y)] = int(bits, 2) << 3
        # zvětšený řádek pro čitelnost
open("screen.hex", "w").write("\n".join(f"{b:02x}" for b in mem) + "\n")
