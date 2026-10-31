#!/usr/bin/env python3
"""Plošný spoj hlavní desky Didaktik Gama (KiCad 7+, pcbnew API).

Z netlist.py sestaví didaktik_gama.kicad_pcb: obrys, montážní otvory, rozmístění pouzder po blocích,
přiřazení netů všem padům a 4 vrstvy (In1 = GND, In2 = +5V jako celoplošné zóny).
Cesty signálů se netahají – dokončí se v KiCadu (ručně nebo Freerouting).
Spuštění:  python3 gen_pcb.py   (vyžaduje KiCad s modulem pcbnew)
"""
import os
import sys

import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from netlist import parts  # noqa: E402

BOARD_W, BOARD_H = 300.0, 225.0
mm = pcbnew.FromMM


def footprint_dirs():
    """adresáře knihoven pouzder: proměnné KiCadu, instalace vedle Pythonu KiCadu (Windows), Linux/macOS"""
    dirs = [os.environ.get(f"KICAD{v}_FOOTPRINT_DIR", "") for v in (10, 9, 8, 7)]
    exe_dir = os.path.dirname(sys.executable)                       # ...\KiCad\8.0\bin
    dirs += [os.path.normpath(os.path.join(exe_dir, "..", "share", "kicad", "footprints")),
             "/usr/share/kicad/footprints", "/usr/local/share/kicad/footprints",
             "/Applications/KiCad/KiCad.app/Contents/SharedSupport/footprints"]
    for v in ("10.0", "9.0", "8.0", "7.0"):
        dirs.append(rf"C:\Program Files\KiCad\{v}\share\kicad\footprints")
    return [d for d in dirs if d and os.path.isdir(d)]


def set_default_netclass(board, track, clearance, via, drill):
    """výchozí pravidla – API se mezi KiCadem 7 a 8/9 liší, proto více cest"""
    ns = board.GetDesignSettings().m_NetSettings
    for get in (lambda: ns.m_DefaultNetClass, lambda: ns.GetDefaultNetclass(), lambda: ns.m_DefaultNetClass.get()):
        try:
            nc = get()
            nc.SetTrackWidth(track)
            nc.SetClearance(clearance)
            nc.SetViaDiameter(via)
            nc.SetViaDrill(drill)
            return True
        except Exception:
            continue
    print("Pozor: výchozí pravidla netclass nenastavena – nastavte v KiCadu (Board Setup)")
    return False


FP_DIRS = footprint_dirs()


OX, OY = 60.0, 36.0   # posun desky na listu A3


def V(x, y):
    return pcbnew.VECTOR2I(mm(x + OX), mm(y + OY))


def load_fp(fpid):
    lib, name = fpid.split(":", 1)
    if lib == "gama":
        return pcbnew.FootprintLoad(os.path.join(HERE, "gama.pretty"), name)
    for d in FP_DIRS:
        p = os.path.join(d, lib + ".pretty")
        if d and os.path.isdir(p):
            fp = pcbnew.FootprintLoad(p, name)
            if fp:
                return fp
    raise SystemExit(f"Pouzdro nenalezeno: {fpid} (hledáno v {FP_DIRS}); nastavte KICAD10_FOOTPRINT_DIR (nebo KICAD9_…)")


OUT = os.path.join(HERE, "didaktik_gama.kicad_pcb")
board = pcbnew.NewBoard(OUT)            # deska s projektem (nastavení netclass apod.)
board.SetCopperLayerCount(4)
ds = board.GetDesignSettings()
ds.SetBoardThickness(mm(1.6))
set_default_netclass(board, mm(0.25), mm(0.2), mm(0.6), mm(0.3))
print("deska vytvořena", flush=True)

# ------------------------------------------------------------------ nety
nets = {}


def net(name):
    if name not in nets:
        ni = pcbnew.NETINFO_ITEM(board, name)
        board.Add(ni)
        nets[name] = ni
    return nets[name]


# ------------------------------------------------------------------ pouzdra
fps = {}
for ref, p in parts.items():
    fp = load_fp(p["fp"])
    for gi in list(fp.GraphicalItems()):     # některá pouzdra (jack) nesou kus obrysu desky
        if gi.GetLayer() == pcbnew.Edge_Cuts:
            fp.Remove(gi)
    fp.SetReference(ref)
    fp.SetValue(p["value"][:40])
    pins = {str(k): v for k, v in p["pins"].items()}
    for pad in fp.Pads():
        n = pins.get(pad.GetNumber())
        if n:
            pad.SetNet(net(n))
    board.Add(fp)
    fps[ref] = fp


def bbox(fp):
    return fp.GetBoundingBox(False, False)


def place_center(ref, x, y, rot=0):
    fp = fps[ref]
    fp.SetOrientationDegrees(rot)
    fp.SetPosition(pcbnew.VECTOR2I(0, 0))
    b = bbox(fp)
    cx, cy = b.GetCenter().x, b.GetCenter().y
    fp.SetPosition(pcbnew.VECTOR2I(mm(x + OX) - cx, mm(y + OY) - cy))


def place_left_of(ref, target, gap=1.0):
    """blokovací kondenzátor vlevo od obvodu, svisle na střed"""
    t = bbox(fps[target])
    fp = fps[ref]
    fp.SetOrientationDegrees(90)
    fp.SetPosition(pcbnew.VECTOR2I(0, 0))
    b = bbox(fp)
    x = t.GetLeft() - mm(gap) - b.GetWidth() // 2
    y = t.GetCenter().y
    fp.SetPosition(pcbnew.VECTOR2I(x - b.GetCenter().x, y - b.GetCenter().y))


def pack(refs, x0, y0, x1, gap=1.5):
    """skládání do řádků zleva doprava v pásu od (x0, y0) do šířky x1"""
    x, y, row_h = mm(x0 + OX), mm(y0 + OY), 0
    for ref in refs:
        fp = fps[ref]
        fp.SetOrientationDegrees(0)
        fp.SetPosition(pcbnew.VECTOR2I(0, 0))
        b = bbox(fp)
        w, h = b.GetWidth(), b.GetHeight()
        if x + w > mm(x1 + OX):
            x, y, row_h = mm(x0 + OX), y + row_h + mm(gap), 0
        fp.SetPosition(pcbnew.VECTOR2I(x - b.GetLeft(), y - b.GetTop()))
        x += w + mm(gap)
        row_h = max(row_h, h)
    return pcbnew.ToMM(y + row_h)


def rr(prefix, a, b):
    return [f"{prefix}{i}" for i in range(a, b + 1) if f"{prefix}{i}" in fps]


# ---- konektory na horním okraji
place_center("J5", 14, 10, 90)        # napájení
place_center("J2", 38, 8, 90)         # magnetofon
place_center("J10", 58, 10, 0)        # linkový výstup
place_center("J9", 76, 8, 90)         # reproduktor
place_center("J7", 108, 12, 180)      # VGA
place_center("J1", 165, 8, 90)        # klávesnice
place_center("J4", 245, 9, 90)        # porty 8255

# ---- řada A: CPU, ROM, 8255, patice ULA (+ RGB konektor modulu)
place_center("U1", 45, 42, 90)
place_center("U2", 108, 42, 90)
place_center("U3", 172, 42, 90)
place_center("U4", 240, 42, 90)
place_center("J8", 293, 52, 0)       # mimo plochu modulu ULA (70 x 50 mm nad paticí)

# ---- řada B: multiplexery, logika, video budiče
def place_row(refs, x0, y, gap):
    """obvody vedle sebe podle skutečné šířky, s místem pro blokovací kondenzátor vlevo"""
    x = x0
    for r in refs:
        fp = fps[r]
        fp.SetOrientationDegrees(90)
        fp.SetPosition(pcbnew.VECTOR2I(0, 0))
        w = pcbnew.ToMM(bbox(fp).GetWidth())
        place_center(r, x + gap + w / 2, y, 90)
        x += gap + w


place_row(["U5", "U6", "U7", "U8", "U25", "U26", "U27", "U28", "U29", "U37", "U38"], 3, 82, 5.6)

# ---- řada C: 4164, řada D: 2118
for i in range(8):
    place_center(f"U{9 + i}", 24 + i * 33, 112, 90)
    place_center(f"U{17 + i}", 24 + i * 33, 144, 90)

# ---- řada E: zvuk, USB klávesnice, napájení
place_center("U42", 42, 182, 90)
place_center("U43", 92, 175, 90)
place_center("U44", 92, 192, 90)
place_center("U45", 118, 175, 90)
place_center("RV1", 120, 196, 0)
place_center("U39", 172, 182, 90)
place_center("U40", 214, 175, 90)
place_center("U41", 214, 192, 90)
place_center("U32", 262, 178, 0)

# ---- blokovací kondenzátory u obvodů (C20.. podle pořadí obvodů v netlistu)
ics = sorted([r for r in parts if parts[r]["sym"] in
              ("UA880D", "27128", "8255", "ULA", "4164", "2118", "74LS157", "7400", "7404", "7410", "7432")],
             key=lambda r: int(r[1:]))
for i, r in enumerate(ics):
    place_left_of(f"C{20 + i}", r)
for c, u in (("C93", "U42"), ("C94", "U43"), ("C95", "U44"), ("C81", "U37"), ("C82", "U38"),
             ("C83", "U40"), ("C84", "U41"), ("C91", "U45")):
    place_left_of(c, u)

# ---- pasivní součástky po skupinách v pásech mezi řadami
pack(rr("R", 1, 14) + ["C1", "C2", "C3", "SW1", "T1", "T2", "Y1"] + rr("D", 1, 8), 6, 54, 284)
pack(rr("R", 27, 34) + ["R43", "R44", "C8", "C9", "C10"] + rr("R", 76, 89), 6, 93, 296)
pack(rr("R", 35, 42) + ["C60"], 6, 123, 296)
pack(rr("R", 19, 26) + ["C61", "D9", "D10", "D11", "LS1", "T3"] + rr("C", 4, 7) + rr("R", 15, 18), 6, 155, 296)
pack(rr("R", 98, 109) + ["C86", "C87", "C88", "C89", "C90", "C92"], 6, 203, 150)
pack(rr("R", 90, 97) + ["C85"], 152, 203, 240)
pack(["F1", "D12", "C11", "C12", "C13", "C14", "C15", "D13", "R45"], 236, 190, 296)

print("rozmístěno", flush=True)
# ------------------------------------------------------------------ obrys, otvory, popis
def edge(x0, y0, x1, y1):
    s = pcbnew.PCB_SHAPE(board)
    s.SetShape(pcbnew.SHAPE_T_SEGMENT)
    s.SetStart(V(x0, y0))
    s.SetEnd(V(x1, y1))
    s.SetLayer(pcbnew.Edge_Cuts)
    s.SetWidth(mm(0.1))
    board.Add(s)


edge(0, 0, BOARD_W, 0)
edge(BOARD_W, 0, BOARD_W, BOARD_H)
edge(BOARD_W, BOARD_H, 0, BOARD_H)
edge(0, BOARD_H, 0, 0)
for i, (x, y) in enumerate(((4, 4 + 18), (BOARD_W - 4, 4 + 18), (4, BOARD_H - 4), (BOARD_W - 4, BOARD_H - 4))):
    h = load_fp("MountingHole:MountingHole_3.2mm_M3_Pad")
    h.SetReference(f"H{i + 1}")
    h.SetPosition(V(x, y))
    for pad in h.Pads():
        pad.SetNet(net("GND"))
    board.Add(h)

t = pcbnew.PCB_TEXT(board)
t.SetText("DIDAKTIK GAMA – hlavní deska (rekonstrukce)  rev 1")
t.SetPosition(V(BOARD_W / 2, BOARD_H - 2.5))
t.SetLayer(pcbnew.F_SilkS)
t.SetTextSize(V(1.5, 1.5))
board.Add(t)

# ------------------------------------------------------------------ zóny GND (In1) a +5V (In2)
def zone(layer, netname, prio=0):
    z = pcbnew.ZONE(board)
    z.SetLayer(layer)
    z.SetNet(net(netname))
    z.SetAssignedPriority(prio)
    z.SetLocalClearance(mm(0.3))
    z.SetMinThickness(mm(0.25))
    z.SetPadConnection(pcbnew.ZONE_CONNECTION_THERMAL)
    o = z.Outline()
    o.NewOutline()
    for x, y in ((0.5, 0.5), (BOARD_W - 0.5, 0.5), (BOARD_W - 0.5, BOARD_H - 0.5), (0.5, BOARD_H - 0.5)):
        o.Append(mm(x + OX), mm(y + OY))
    board.Add(z)


zone(pcbnew.In1_Cu, "GND")
zone(pcbnew.In2_Cu, "+5V")
print("zóny", flush=True)
pcbnew.ZONE_FILLER(board).Fill(board.Zones())

pcbnew.SaveBoard(OUT, board)
with open(OUT) as f:                     # list A3 (PAGE_INFO není v Python API KiCadu 7)
    txt = f.read().replace('(paper "A4")', '(paper "A3")', 1)
with open(OUT, "w") as f:
    f.write(txt)
print(f"uloženo {OUT}: {len(fps)} pouzder, {len(nets)} netů")
