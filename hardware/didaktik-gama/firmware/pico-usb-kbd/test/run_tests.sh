#!/bin/sh
# Spuštění všech testů na počítači (bez Pica)
set -e
cd "$(dirname "$0")"
T=${TMPDIR:-/tmp}/gama_kbd_test
mkdir -p "$T"
cc -Wall -Wextra -I../src test_keymap.c ../src/keymap.c -o "$T/test_keymap" && "$T/test_keymap"
# testovací .TAP: hlavička + datový blok přes několik clusterů
python3 - "$T/a.tap" "$T/z.tap" <<'PY'
import sys, struct
def blk(flag, data):
    body = bytes([flag]) + data
    x = 0
    for c in body: x ^= c
    body += bytes([x])
    return struct.pack("<H", len(body)) + body
hdr = bytes([3]) + b"TEST      " + struct.pack("<HHH", 3000, 32768, 0)
data = bytes((i * 7) & 0xFF for i in range(3000))
open(sys.argv[1], "wb").write(blk(0, hdr) + blk(0xFF, data))
open(sys.argv[2], "wb").write(blk(0, hdr))
PY
for t in 12 16 32; do
  python3 mkfat.py $t $((t != 12)) "$T/fat$t.img" AHRA.TAP="$T/a.tap" ZDEMO.TAP="$T/z.tap"
done
cc -Wall -Wextra -I../src test_tzx.c ../src/tzx.c ../src/tap.c -o "$T/test_tzx" && "$T/test_tzx"
cc -Wall -Wextra -I../src test_fat_tap.c ../src/fat.c ../src/tap.c -o "$T/test_fat_tap"
"$T/test_fat_tap" "$T/fat12.img" "$T/a.tap" "$T/fat16.img" "$T/a.tap" "$T/fat32.img" "$T/a.tap"
rm -rf "$T"
