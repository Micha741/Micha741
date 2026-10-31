#!/usr/bin/env python3
"""Plošný spoj modulu náhrady ULA (XC95144XL) – KiCad 7+, pcbnew API.

Deska 70 x 50 mm, 2 vrstvy, zem rozlitá z obou stran. J1 = 40 kolíků v rozteči DIP-40 (600 mil)
zespodu do patice ULA; CPLD TQFP-100 nad řadou kolíků, stabilizátor, oscilátor a odpory mezi řadami.
Spuštění:  python3 gen_pcb_modul.py
"""
import os
import sys

import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from netlist_modul import parts  # noqa: E402

FP = "/usr/share/kicad/footprints"
W, H = 70.0, 50.0
OX, OY = 110.0, 90.0          # poloha na listu A4
mm = pcbnew.FromMM
OUT = os.path.join(HERE, "ula_cpld_modul.kicad_pcb")


def V(x, y):
    return pcbnew.VECTOR2I(mm(x + OX), mm(y + OY))


board = pcbnew.NewBoard(OUT)
board.SetCopperLayerCount(2)
nc = board.GetDesignSettings().m_NetSettings.m_DefaultNetClass
nc.SetTrackWidth(mm(0.2))
nc.SetClearance(mm(0.15))
nc.SetViaDiameter(mm(0.6))
nc.SetViaDrill(mm(0.3))

nets = {}


def net(name):
    if name not in nets:
        ni = pcbnew.NETINFO_ITEM(board, name)
        board.Add(ni)
        nets[name] = ni
    return nets[name]


fps = {}
for ref, p in parts.items():
    lib, name = p["fp"].split(":", 1)
    fp = pcbnew.FootprintLoad(os.path.join(FP, lib + ".pretty"), name)
    fp.SetReference(ref)
    fp.SetValue(p["value"][:40])
    pins = {str(k): v for k, v in p["pins"].items()}
    for pad in fp.Pads():
        n = pins.get(pad.GetNumber())
        if n:
            pad.SetNet(net(n))
    board.Add(fp)
    fps[ref] = fp


def place(ref, x, y, rot=0):
    """střed obrysu pouzdra na (x, y)"""
    fp = fps[ref]
    fp.SetOrientationDegrees(rot)
    fp.SetPosition(pcbnew.VECTOR2I(0, 0))
    c = fp.GetBoundingBox(False, False).GetCenter()
    fp.SetPosition(pcbnew.VECTOR2I(mm(x + OX) - c.x, mm(y + OY) - c.y))


# J1 jsou jen kolíky do patice – vymezení (courtyard) a tělo čipu nahradit pásy kolem řad kolíků,
# aby mezi řadami šly osadit SMD součástky
j1 = fps["J1"]
for gi in list(j1.GraphicalItems()):
    if gi.GetLayer() in (pcbnew.F_CrtYd, pcbnew.F_Fab, pcbnew.F_SilkS) and isinstance(gi, pcbnew.FP_SHAPE):
        j1.Remove(gi)
for x0, x1 in ((-1.5, 1.5), (13.74, 16.74)):  # řady kolíků DIP-40 v souřadnicích pouzdra (x = 0 a 15,24)
    r = pcbnew.FP_SHAPE(j1)
    r.SetShape(pcbnew.SHAPE_T_RECT)
    r.SetLayer(pcbnew.F_CrtYd)
    r.SetWidth(mm(0.05))
    r.SetStart0(pcbnew.VECTOR2I(mm(x0), mm(-1.5)))
    r.SetEnd0(pcbnew.VECTOR2I(mm(x1), mm(49.76)))
    j1.Add(r)
    sk = pcbnew.FP_SHAPE(j1)
    sk.SetShape(pcbnew.SHAPE_T_RECT)
    sk.SetLayer(pcbnew.F_SilkS)
    sk.SetWidth(mm(0.12))
    sk.SetStart0(r.GetStart0())
    sk.SetEnd0(r.GetEnd0())
    j1.Add(sk)
# J1: DIP-40 otočené o 90° -> řady kolíků vodorovně (y = 30,0 a 45,24), pin 1 vlevo dole
place("J1", 35.0, 37.62, 90)
# CPLD nad horní řadou kolíků
place("U1", 35.0, 14.0, 0)
# blokovací kondenzátory kolem CPLD (VCCINT 5, 57, 98; VCCIO 26, 38, 51, 88)
for ref, (x, y, r) in {"C4": (24.5, 4.0, 90), "C5": (45.5, 24.5, 0), "C6": (24.5, 24.5, 0),
                       "C7": (45.5, 4.0, 90), "C8": (45.5, 9.0, 90), "C9": (35.0, 24.5, 0),
                       "C10": (24.5, 9.0, 90)}.items():
    place(ref, x, y, r)
# mezi řadami kolíků: napájení 3,3 V, oscilátor, odpory
place("U2", 17.0, 37.6, 0)
place("C2", 9.5, 37.6, 90)
place("C3", 24.5, 37.6, 90)
place("X1", 31.0, 35.0, 0)
place("C1", 31.0, 40.5, 0)
place("R1", 38.0, 35.0, 0)
place("R2", 38.0, 40.5, 0)
place("R3", 44.0, 35.0, 0)
place("R4", 44.0, 40.5, 0)
place("R5", 50.0, 35.0, 0)
# konektory: J2 (RGB + zvuk + napájení) vlevo, JTAG vpravo
place("J2", 4.0, 16.0, 0)
place("J3", 66.0, 12.0, 0)


def edge(x0, y0, x1, y1):
    s = pcbnew.PCB_SHAPE(board)
    s.SetShape(pcbnew.SHAPE_T_SEGMENT)
    s.SetStart(V(x0, y0))
    s.SetEnd(V(x1, y1))
    s.SetLayer(pcbnew.Edge_Cuts)
    s.SetWidth(mm(0.1))
    board.Add(s)


edge(0, 0, W, 0)
edge(W, 0, W, H)
edge(W, H, 0, H)
edge(0, H, 0, 0)

for layer, txt, y in ((pcbnew.F_SilkS, "GAMA ULA CPLD  rev 1", 48.3), (pcbnew.B_SilkS, "J2 -> J8 hlavní desky", 48.3)):
    t = pcbnew.PCB_TEXT(board)
    t.SetText(txt)
    t.SetPosition(V(W / 2, y))
    t.SetLayer(layer)
    t.SetTextSize(pcbnew.VECTOR2I(mm(1.0), mm(1.0)))
    if layer == pcbnew.B_SilkS:
        t.SetMirrored(True)
    board.Add(t)


def zone(layer):
    z = pcbnew.ZONE(board)
    z.SetLayer(layer)
    z.SetNet(net("GND"))
    z.SetLocalClearance(mm(0.25))
    z.SetMinThickness(mm(0.2))
    z.SetPadConnection(pcbnew.ZONE_CONNECTION_THERMAL)
    o = z.Outline()
    o.NewOutline()
    for x, y in ((0.3, 0.3), (W - 0.3, 0.3), (W - 0.3, H - 0.3), (0.3, H - 0.3)):
        o.Append(mm(x + OX), mm(y + OY))
    board.Add(z)


zone(pcbnew.F_Cu)
zone(pcbnew.B_Cu)
pcbnew.ZONE_FILLER(board).Fill(board.Zones())
pcbnew.SaveBoard(OUT, board)
print(f"uloženo {OUT}: {len(fps)} pouzder, {len(nets)} netů")
