#!/usr/bin/env python3
"""Vyrobí testovací obraz disku FAT12/16/32 se soubory, clustery souborů záměrně neprokládané souvisle.
Použití: mkfat.py <typ 12|16|32> <mbr 0|1> <obraz> <jméno=soubor>..."""
import struct, sys

typ, mbr, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
files = [(a.split("=", 1)[0], open(a.split("=", 1)[1], "rb").read()) for a in sys.argv[4:]]
spc = 1
nclus = {12: 3000, 16: 5000, 32: 70000}[typ]
rsvd = 32 if typ == 32 else 1
root_ent = 0 if typ == 32 else 512
root_sec = root_ent * 32 // 512
ent_bits = {12: 1.5, 16: 2, 32: 4}[typ]
fatsz = int(((nclus + 2) * ent_bits + 511) // 512)
nfats = 2
tot = rsvd + nfats * fatsz + root_sec + nclus * spc
part = 2048 if mbr else 0
img = bytearray((part + tot) * 512)

fat = {}
def setfat(c, v): fat[c] = v
eoc = {12: 0xFFF, 16: 0xFFFF, 32: 0x0FFFFFFF}[typ]
setfat(0, eoc & 0xFF8 | 0xF8); setfat(1, eoc)
nxt = [3]
def alloc(n):  # každý druhý cluster -> otestuje řetězení
    cl = []
    for _ in range(n):
        cl.append(nxt[0]); nxt[0] += 2
    for a, b in zip(cl, cl[1:]): setfat(a, b)
    setfat(cl[-1], eoc)
    return cl
data_lba = part + rsvd + nfats * fatsz + root_sec
def clba(c): return data_lba + (c - 2) * spc

dirents = []
for name, data in files:
    base, ext = name.split(".")
    n = max(1, (len(data) + 511) // 512)
    cl = alloc(n)
    for i, c in enumerate(cl):
        chunk = data[i * 512:(i + 1) * 512]
        img[clba(c) * 512: clba(c) * 512 + len(chunk)] = chunk
    ent = base.ljust(8).encode() + ext.ljust(3).encode() + bytes([0x20]) + bytes(8)
    ent += struct.pack("<H", cl[0] >> 16) + bytes(4) + struct.pack("<HI", cl[0] & 0xFFFF, len(data))
    dirents.append(ent)
# smazaná položka a LFN položka navíc (mají se přeskočit)
dirents.insert(0, b"\xe5ELETED TAP" + bytes(21))
dirents.insert(0, b"\x41a\x00b\x00c\x00d\x00e\x00\x0f" + bytes(20))
dirent_bytes = b"".join(dirents)
if typ == 32:
    rc = 2; setfat(2, eoc)
    off = clba(rc) * 512
else:
    off = (part + rsvd + nfats * fatsz) * 512
img[off:off + len(dirent_bytes)] = dirent_bytes

fatb = bytearray(fatsz * 512)
for c, v in fat.items():
    if typ == 16: struct.pack_into("<H", fatb, c * 2, v)
    elif typ == 32: struct.pack_into("<I", fatb, c * 4, v)
    else:
        o = c + c // 2
        cur = fatb[o] | (fatb[o + 1] << 8)
        cur = (cur & 0x000F) | (v << 4) if c & 1 else (cur & 0xF000) | v
        struct.pack_into("<H", fatb, o, cur)
for i in range(nfats):
    s = (part + rsvd + i * fatsz) * 512
    img[s:s + len(fatb)] = fatb

bs = bytearray(512)
bs[0:3] = b"\xEB\x3C\x90"; bs[3:11] = b"TESTFAT "
struct.pack_into("<HBHBHHBHHHII", bs, 11, 512, spc, rsvd, nfats, root_ent, tot if tot < 65536 else 0,
                 0xF8, 0 if typ == 32 else fatsz, 32, 2, part, tot if tot >= 65536 else 0)
if typ == 32:
    struct.pack_into("<IHHI", bs, 36, fatsz, 0, 0, 2)
bs[510:512] = b"\x55\xAA"
img[part * 512: part * 512 + 512] = bs
if mbr:
    struct.pack_into("<BBBBBBBBII", img, 0x1BE, 0, 0, 0, 0, 0x0C if typ == 32 else 0x06, 0, 0, 0, part, tot)
    img[510:512] = b"\x55\xAA"
open(out, "wb").write(img)
