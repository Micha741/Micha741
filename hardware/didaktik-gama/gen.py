#!/usr/bin/env python3
"""Generuje KiCad schéma (.kicad_sch), náhled (SVG), netlist, BOM a seznam k ověření
z netlist.py. Spuštění: python3 gen.py"""
import csv, os, sys, uuid
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from netlist import parts, verify, POWER_BLOCK, VIDEO_BLOCK, CONV_BLOCK, VGA_BLOCK  # noqa: E402

OUT = os.path.dirname(os.path.abspath(__file__))
G = 2.54
NS = uuid.UUID("6a1d0c2e-0000-4000-8000-0000000d1d47")
_cnt = [0]


def uid():
    _cnt[0] += 1
    return str(uuid.uuid5(NS, str(_cnt[0])))


ROOT = uid()


def ov(n):
    """'/RD' -> '~{RD}' (pruh nad textem v KiCadu)."""
    return "~{" + n[1:] + "}" if n and n.startswith("/") else n


# ----------------------------------------------------------- definice symbolů
# Pin = (číslo, jméno, typ). None = mezera.
def P(n, name, t="passive"):
    return (n, name, t)


PW = "power_in"
SYM = {}


def ic(name, left, right, w=15.24, title=None):
    SYM[name] = dict(kind="ic", left=left, right=right, w=w, title=title or name)


ic("UA880D",
   [P(30 + i, f"A{i}") for i in range(11)] + [P(1, "A11"), P(2, "A12"), P(3, "A13"), P(4, "A14"), P(5, "A15")]
   + [None, P(6, "CLK"), P(26, "~{RESET}"), None, P(11, "VCC", PW), P(29, "GND", PW)],
   [P(14, "D0"), P(15, "D1"), P(12, "D2"), P(8, "D3"), P(7, "D4"), P(9, "D5"), P(10, "D6"), P(13, "D7"), None,
    P(21, "~{RD}"), P(22, "~{WR}"), P(19, "~{MREQ}"), P(20, "~{IORQ}"), P(27, "~{M1}"), P(28, "~{RFSH}"), None,
    P(16, "~{INT}"), P(17, "~{NMI}"), P(24, "~{WAIT}"), P(25, "~{BUSRQ}"), P(23, "~{BUSAK}"), P(18, "~{HALT}")],
   w=20.32)
ic("27128",
   [P(10, "A0"), P(9, "A1"), P(8, "A2"), P(7, "A3"), P(6, "A4"), P(5, "A5"), P(4, "A6"), P(3, "A7"),
    P(25, "A8"), P(24, "A9"), P(21, "A10"), P(23, "A11"), P(2, "A12"), P(26, "A13"), None,
    P(20, "~{CE}"), P(22, "~{OE}"), P(27, "~{PGM}"), P(1, "VPP")],
   [P(11, "D0"), P(12, "D1"), P(13, "D2"), P(15, "D3"), P(16, "D4"), P(17, "D5"), P(18, "D6"), P(19, "D7"),
    None, P(28, "VCC", PW), P(14, "GND", PW)])
ic("8255",
   [P(34, "D0"), P(33, "D1"), P(32, "D2"), P(31, "D3"), P(30, "D4"), P(29, "D5"), P(28, "D6"), P(27, "D7"), None,
    P(5, "~{RD}"), P(36, "~{WR}"), P(9, "A0"), P(8, "A1"), P(6, "~{CS}"), P(35, "RESET"), None,
    P(26, "VCC", PW), P(7, "GND", PW)],
   [P(4, "PA0"), P(3, "PA1"), P(2, "PA2"), P(1, "PA3"), P(40, "PA4"), P(39, "PA5"), P(38, "PA6"), P(37, "PA7"),
    None] + [P(18 + i, f"PB{i}") for i in range(8)] + [None] +
   [P(14, "PC0"), P(15, "PC1"), P(16, "PC2"), P(17, "PC3"), P(13, "PC4"), P(12, "PC5"), P(11, "PC6"), P(10, "PC7")])
ic("ULA",
   [P(3, "~{RD}"), P(2, "~{WR}"), P(38, "~{MREQ}"), P(33, "~{IORQGE}"), P(12, "~{INT}"), P(34, "~{ROMCS}"),
    P(36, "A14"), P(37, "A15"), P(32, "Φ"), None,
    P(18, "D0"), P(21, "D1"), P(22, "D2"), P(25, "D3"), P(27, "D4"), P(29, "D5"), P(30, "D6"), P(31, "D7"), None,
    P(39, "XTAL1"), P(40, "XTAL2"), P(14, "VCC", PW), P(13, "UPE", PW)],
   [P(7, "DRAM_A0"), P(6, "DRAM_A1"), P(5, "DRAM_A2"), P(8, "DRAM_A3"), P(9, "DRAM_A4"), P(10, "DRAM_A5"),
    P(11, "DRAM_A6"), P(35, "~{RAS}"), P(1, "~{CAS}"), P(4, "~{WE}"), None,
    P(26, "KB1"), P(24, "KB2"), P(23, "KB3"), P(20, "KB4"), P(19, "KB5"), None,
    P(15, "U"), P(16, "V"), P(17, "Y"), None, P(28, "MG")],
   w=20.32)
ic("74LS157",
   [P(2, "1A"), P(3, "1B"), P(5, "2A"), P(6, "2B"), P(11, "3A"), P(10, "3B"), P(14, "4A"), P(13, "4B"), None,
    P(1, "S"), P(15, "~{G}")],
   [P(4, "1Y"), None, P(7, "2Y"), None, P(9, "3Y"), None, P(12, "4Y"), None, None, P(16, "VCC", PW),
    P(8, "GND", PW)], w=12.7)
ic("4164",
   [P(5, "A0"), P(7, "A1"), P(6, "A2"), P(12, "A3"), P(11, "A4"), P(10, "A5"), P(13, "A6"), P(9, "A7"), None,
    P(2, "D")],
   [P(4, "~{RAS}"), P(15, "~{CAS}"), P(3, "~{WE}"), P(14, "Q"), None, P(8, "VCC", PW), P(16, "GND", PW),
    P(1, "NC", "no_connect")], w=12.7)
ic("2118",
   [P(5, "A0"), P(7, "A1"), P(6, "A2"), P(12, "A3"), P(11, "A4"), P(10, "A5"), P(13, "A6"), None, P(2, "D")],
   [P(4, "~{RAS}"), P(15, "~{CAS}"), P(3, "~{WE}"), P(14, "Q"), None, P(8, "VCC", PW), P(9, "VCC", PW),
    P(16, "GND", PW), P(1, "NC", "no_connect")], w=12.7)
ic("7805", [P(1, "IN")], [P(3, "OUT"), P(2, "GND", PW)], w=10.16, title="7805")
ic("LM1889",
   [P(2, "R-Y"), P(4, "B-Y"), P(3, "BIAS"), None, P(17, "OSC"), P(1, "LEAD"), P(18, "LAG"), None, P(12, "VIDEO")],
   [P(13, "CHROMA"), None, P(15, "SND"), P(14, "RF_VCC", PW), P(16, "VCC", PW), P(5, "GND", PW), None]
   + [P(n, "NC", "no_connect") for n in range(6, 12)], w=15.24)
ic("74HCT244", [P(2, "1A1"), P(4, "1A2"), P(6, "1A3"), P(8, "1A4"), P(11, "2A1"), P(13, "2A2"), P(15, "2A3"),
                P(17, "2A4"), None, P(1, "~{1OE}"), P(19, "~{2OE}")],
   [P(18, "1Y1"), P(16, "1Y2"), P(14, "1Y3"), P(12, "1Y4"), P(9, "2Y1"), P(7, "2Y2"), P(5, "2Y3"), P(3, "2Y4"),
    None, P(20, "VCC", PW), P(10, "GND", PW)], w=12.7)
ic("74HCT08", [P(1, "1A"), P(2, "1B"), None, P(4, "2A"), P(5, "2B"), None, P(9, "3A"), P(10, "3B"), None,
               P(12, "4A"), P(13, "4B")],
   [P(3, "1Y"), None, None, P(6, "2Y"), None, None, P(8, "3Y"), None, None, P(11, "4Y"), None, P(14, "VCC", PW),
    P(7, "GND", PW)], w=12.7)
ic("AD8032", [P(3, "+INA"), P(2, "-INA"), None, P(5, "+INB"), P(6, "-INB")],
   [P(1, "OUTA"), None, P(7, "OUTB"), None, P(8, "V+", PW), P(4, "V-", PW)], w=10.16, title="AD8032")
ic("LM1881", [P(2, "VIDEO_IN"), P(6, "RSET"), P(8, "VCC", PW), P(4, "GND", PW)],
   [P(1, "CSYNC"), P(3, "VSYNC"), P(5, "BURST"), P(7, "ODD/EVEN")], w=12.7, title="LM1881")
ic("VGA", [P(1, "RED"), P(2, "GREEN"), P(3, "BLUE"), P(13, "HSYNC"), P(14, "VSYNC"), None,
           P(5, "GND"), P(6, "R_GND"), P(7, "G_GND"), P(8, "B_GND"), P(10, "SYNC_GND")],
   [P(4, "ID2"), P(9, "KEY/5V"), P(11, "ID0"), P(12, "SDA"), P(15, "SCL")], w=12.7, title="VGA")
ic("MC34063", [P(6, "VCC"), P(7, "IPK"), P(8, "DRV"), P(3, "CT")], [P(1, "SWC"), P(2, "SWE"), P(5, "FB"), P(4, "GND", PW)], w=12.7, title="MC34063")
ic("COIL1703", [P(1, "PRIM"), P(2, "PRIM_SW")], [P(3, "FB_A"), P(4, "FB_B")], w=10.16, title="L 1703")
ic("KODER", [P(1, "U"), P(2, "V"), P(3, "Y")], [P(4, "CVBS")], w=12.7, title="KODER")
ic("MODULATOR", [P(1, "VIDEO"), None, P(2, "+5V", PW)], [P(3, "RF"), None, P(4, "GND", PW)], w=12.7, title="MODULÁTOR")

# hradla: (typ, [(vstupy, výstup)], power (vcc,gnd), symbol funkce, negace)
GATES = {
    "7404": ([((1,), 2), ((3,), 4), ((5,), 6), ((9,), 8), ((11,), 10), ((13,), 12)], "1", True),
    "7400": ([((1, 2), 3), ((4, 5), 6), ((9, 10), 8), ((12, 13), 11)], "&", True),
    "7410": ([((1, 2, 13), 12), ((3, 4, 5), 6), ((9, 10, 11), 8)], "&", True),
    "7432": ([((1, 2), 3), ((4, 5), 6), ((9, 10), 8), ((12, 13), 11)], "≥1", False),
}
for g, (units, fn, neg) in GATES.items():
    SYM[g] = dict(kind="gate", units=units, fn=fn, neg=neg)

for t in ("R", "C", "CP", "D", "SW", "XTAL", "SPK", "F", "LED", "L"):
    SYM[t] = dict(kind="two", t=t)
SYM["NPN"] = dict(kind="npn")
SYM["PNP"] = dict(kind="npn", pnp=True)
SYM["NPN_ECB"] = dict(kind="npn", map={"E": 1, "C": 2, "B": 3})  # TO-126: E-C-B


def conn_sym(n):
    name = f"CONN_{n}"
    if name not in SYM:
        SYM[name] = dict(kind="ic", left=[P(i, str(i)) for i in range(1, n + 1)], right=[], w=5.08,
                         title="CONN", conn=True)
    return name


# ----------------------------------------------------------- geometrie pinů
def ic_geom(s):
    """Vrátí seznam (číslo, jméno, typ, lib_x, lib_y, úhel) a výšku těla."""
    rows = max(len(s["left"]), len(s["right"]))
    top = ((rows + 1) // 2) * G
    hw = s["w"] / 2
    pins = []
    for side, lst in (("L", s["left"]), ("R", s["right"])):
        for i, p in enumerate(lst):
            if p is None:
                continue
            y = top - (i + 1) * G
            if side == "L":
                pins.append((*p, -hw - G, y, 0))
            else:
                pins.append((*p, hw + G, y, 180))
    y1 = top
    y2 = top - (rows + 1) * G
    return pins, (-hw, y1, hw, y2)


def gate_geom(nin):
    h = G * (nin + 1) if nin > 1 else 2 * G
    top = (nin // 2 + 1) * G if nin > 1 else G
    ins = []
    if nin == 1:
        ins = [0.0]
    elif nin == 2:
        ins = [G, -G]
    else:
        ins = [G, 0.0, -G]
    return ins, (-3.81, top, 3.81, top - 2 * top)


def two_geom(t):
    return [(1, "1", 0, G * 2, 270), (2, "2", 0, -G * 2, 90)]


# ----------------------------------------------------------- zápis lib_symbols
def eff(size=1.27, hide=False, justify=None):
    s = f"(effects (font (size {size} {size}))"
    if justify:
        s += f" (justify {justify})"
    if hide:
        s += " hide"
    return s + ")"


def q(s):
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'


def pin_s(t, shape, x, y, ang, length, name, num, hide_name=False):
    return (f"(pin {t} {shape} (at {x:.2f} {y:.2f} {ang}) (length {length})"
            f" (name {q(name)} {eff(hide=False) if not hide_name else eff(hide=True)})"
            f" (number {q(num)} {eff()}))")


def rect(x1, y1, x2, y2, fill="background"):
    return (f"(rectangle (start {x1:.2f} {y1:.2f}) (end {x2:.2f} {y2:.2f})"
            f" (stroke (width 0.254) (type default)) (fill (type {fill})))")


def poly(pts, fill="none", w=0.254):
    p = " ".join(f"(xy {x:.2f} {y:.2f})" for x, y in pts)
    return f"(polyline (pts {p}) (stroke (width {w}) (type default)) (fill (type {fill})))"


def txt(s, x, y, size=1.27):
    return f"(text {q(s)} (at {x:.2f} {y:.2f} 0) {eff(size)})"


def props(ref, val, ry, vy, hide_ref=False):
    return (f"(property \"Reference\" {q(ref)} (at 0 {ry:.2f} 0) {eff(hide=hide_ref)})"
            f"(property \"Value\" {q(val)} (at 0 {vy:.2f} 0) {eff()})"
            f"(property \"Footprint\" \"\" (at 0 0 0) {eff(hide=True)})"
            f"(property \"Datasheet\" \"\" (at 0 0 0) {eff(hide=True)})")


def lib_symbol(name):
    s = SYM[name]
    head = f"(symbol {q('gama:' + name)}"
    if s["kind"] == "ic":
        pins, (x1, y1, x2, y2) = ic_geom(s)
        out = [head + " (pin_names (offset 1.016)) (exclude_from_sim no) (in_bom yes) (on_board yes)",
               props("J" if s.get("conn") else "U", s["title"], y1 + 1.27, y2 - 1.27)]
        out.append(f"(symbol {q(name + '_0_1')} {rect(x1, y1, x2, y2)})")
        pl = [pin_s(t if t != "no_connect" else "no_connect", "line", x, y, a, G, nm, n,
                    hide_name=s.get("conn", False)) for n, nm, t, x, y, a in pins]
        out.append(f"(symbol {q(name + '_1_1')} {' '.join(pl)})")
        return " ".join(out) + ")"
    if s["kind"] == "gate":
        units = s["units"]
        out = [head + " (pin_names (offset 1.016)) (exclude_from_sim no) (in_bom yes) (on_board yes)",
               props("U", name, 5.08, -5.08)]
        for k, (ins, o) in enumerate(units, start=1):
            yy, (x1, y1, x2, y2) = gate_geom(len(ins))
            g = [rect(x1, y1, x2, y2), txt(s["fn"], 0, 0, 1.8)]
            for pn, py in zip(ins, yy):
                g.append(pin_s("input", "line", -3.81 - G * 2, py, 0, G * 2, "", pn, hide_name=True))
            g.append(pin_s("output", "inverted" if s["neg"] else "line", 3.81 + G * 2, 0, 180, G * 2, "", o,
                           hide_name=True))
            out.append(f"(symbol {q(f'{name}_{k}_1')} {' '.join(g)})")
        k = len(units) + 1
        g = [rect(-3.81, 3.81, 3.81, -3.81), txt("PWR", 0, 0),
             pin_s("power_in", "line", 0, 3.81 + G, 270, G, "VCC", 14),
             pin_s("power_in", "line", 0, -3.81 - G, 90, G, "GND", 7)]
        out.append(f"(symbol {q(f'{name}_{k}_1')} {' '.join(g)})")
        return " ".join(out) + ")"
    if s["kind"] == "two":
        t = s["t"]
        refc = {"R": "R", "C": "C", "CP": "C", "D": "D", "SW": "SW", "XTAL": "Y", "SPK": "LS", "F": "F", "LED": "D", "L": "L"}[t]
        out = [head + " (pin_names (offset 0) hide) (exclude_from_sim no) (in_bom yes) (on_board yes)",
               f"(property \"Reference\" {q(refc)} (at 2.54 0.8 0) {eff(justify='left')})"
               f"(property \"Value\" {q(t)} (at 2.54 -1.2 0) {eff(justify='left')})"
               f"(property \"Footprint\" \"\" (at 0 0 0) {eff(hide=True)})"
               f"(property \"Datasheet\" \"\" (at 0 0 0) {eff(hide=True)})"]
        g = []
        if t == "R":
            g.append(rect(-1.016, 2.54, 1.016, -2.54, "none"))
        elif t in ("C", "CP"):
            g += [poly([(-2.032, 0.635), (2.032, 0.635)], w=0.4), poly([(-2.032, -0.635), (2.032, -0.635)], w=0.4),
                  poly([(0, 2.54), (0, 0.635)]), poly([(0, -0.635), (0, -2.54)])]
            if t == "CP":
                g.append(txt("+", -1.5, 1.6))
        elif t == "L":
            g += [poly([(0, 2.54), (0, 2.0), (0.8, 1.6), (0.8, 0.8), (0, 0.4), (0.8, 0.0), (0.8, -0.8), (0, -1.2),
                        (0.8, -1.6), (0.8, -2.2), (0, -2.54)])]
        elif t == "F":
            g += [rect(-1.016, 2.54, 1.016, -2.54, "none"), poly([(0, 2.54), (0, -2.54)])]
        elif t == "LED":
            g += [poly([(-1.27, -0.762), (1.27, -0.762), (0, 0.762), (-1.27, -0.762)], "outline"),
                  poly([(-1.27, 0.762), (1.27, 0.762)]), poly([(0, 2.54), (0, -2.54)]),
                  poly([(1.5, 0), (2.5, 1)]), poly([(1.5, -1), (2.5, 0)])]
        elif t == "D":   # pin1 = katoda nahoře
            g += [poly([(-1.27, -0.762), (1.27, -0.762), (0, 0.762), (-1.27, -0.762)], "outline"),
                  poly([(-1.27, 0.762), (1.27, 0.762)]), poly([(0, 2.54), (0, -2.54)])]
        elif t == "SW":
            g += [poly([(0, 2.54), (0, 1.27)]), poly([(0, -2.54), (0, -1.27)]), poly([(0, -1.27), (-1.5, 1.0)]),
                  poly([(-1.2, 0), (-2.5, 0)])]
        elif t == "XTAL":
            g += [rect(-1.27, 0.762, 1.27, -0.762, "none"), poly([(-1.778, 1.27), (1.778, 1.27)]),
                  poly([(-1.778, -1.27), (1.778, -1.27)]), poly([(0, 2.54), (0, 1.27)]), poly([(0, -2.54), (0, -1.27)])]
        elif t == "SPK":
            g += [rect(-1.016, 1.524, 1.016, -1.524, "none"),
                  poly([(1.016, 1.524), (2.8, 2.8), (2.8, -2.8), (1.016, -1.524)])]
        out.append(f"(symbol {q(name + '_0_1')} {' '.join(g)})")
        pl = [pin_s("passive", "line", x, y, a, G, nm, n, True) for n, nm, x, y, a in two_geom(t)]
        out.append(f"(symbol {q(name + '_1_1')} {' '.join(pl)})")
        return " ".join(out) + ")"
    if s["kind"] == "npn":
        out = [head + " (pin_names (offset 0) hide) (exclude_from_sim no) (in_bom yes) (on_board yes)",
               f"(property \"Reference\" \"T\" (at 3.81 1.27 0) {eff(justify='left')})"
               f"(property \"Value\" \"NPN\" (at 3.81 -1.27 0) {eff(justify='left')})"
               f"(property \"Footprint\" \"\" (at 0 0 0) {eff(hide=True)})"
               f"(property \"Datasheet\" \"\" (at 0 0 0) {eff(hide=True)})"]
        g = [poly([(-0.508, 1.905), (-0.508, -1.905)], w=0.5), poly([(-0.508, 0.635), (1.27, 2.54)]),
             poly([(-0.508, -0.635), (1.27, -2.54)]),
             (poly([(0.2, -1.2), (-0.508, -0.635), (0.4, -0.5)]) if s.get("pnp") else
              poly([(0.6, -1.95), (1.27, -2.54), (0.5, -2.6)]))]
        out.append(f"(symbol {q(name + '_0_1')} {' '.join(g)})")
        m = s.get("map", {"E": 1, "B": 2, "C": 3})
        pl = [pin_s("passive", "line", 1.27, -5.08, 90, G, "E", m["E"], True),
              pin_s("passive", "line", -3.81, 0, 0, 3.302, "B", m["B"], True),
              pin_s("passive", "line", 1.27, 5.08, 270, G, "C", m["C"], True)]
        out.append(f"(symbol {q(name + '_1_1')} {' '.join(pl)})")
        return " ".join(out) + ")"


POWER_LIB = {
    "+5V": ("(symbol \"power:+5V\" (power) (pin_names (offset 0)) (exclude_from_sim no) (in_bom yes) (on_board yes)"
            f"(property \"Reference\" \"#PWR\" (at 0 -3.81 0) {eff(hide=True)})"
            f"(property \"Value\" \"+5V\" (at 0 3.556 0) {eff()})"
            f"(property \"Footprint\" \"\" (at 0 0 0) {eff(hide=True)})"
            f"(property \"Datasheet\" \"\" (at 0 0 0) {eff(hide=True)})"
            f"(symbol \"+5V_0_1\" {poly([(-0.762, 1.27), (0, 2.54), (0.762, 1.27)])} {poly([(0, 0), (0, 2.54)])})"
            "(symbol \"+5V_1_1\" (pin power_in line (at 0 0 90) (length 0) hide (name \"+5V\" "
            f"{eff()}) (number \"1\" {eff()}))))"),
    "GND": ("(symbol \"power:GND\" (power) (pin_names (offset 0)) (exclude_from_sim no) (in_bom yes) (on_board yes)"
            f"(property \"Reference\" \"#PWR\" (at 0 -6.35 0) {eff(hide=True)})"
            f"(property \"Value\" \"GND\" (at 0 -3.81 0) {eff()})"
            f"(property \"Footprint\" \"\" (at 0 0 0) {eff(hide=True)})"
            f"(property \"Datasheet\" \"\" (at 0 0 0) {eff(hide=True)})"
            f"(symbol \"GND_0_1\" {poly([(0, 0), (0, -1.27), (1.27, -1.27), (0, -2.54), (-1.27, -1.27), (0, -1.27)])})"
            "(symbol \"GND_1_1\" (pin power_in line (at 0 0 270) (length 0) hide (name \"GND\" "
            f"{eff()}) (number \"1\" {eff()}))))"),
    "PWR_FLAG": ("(symbol \"power:PWR_FLAG\" (power) (pin_numbers hide) (pin_names (offset 0) hide)"
                 " (exclude_from_sim no) (in_bom yes) (on_board yes)"
                 f"(property \"Reference\" \"#FLG\" (at 0 1.905 0) {eff(hide=True)})"
                 f"(property \"Value\" \"PWR_FLAG\" (at 0 3.81 0) {eff()})"
                 f"(property \"Footprint\" \"\" (at 0 0 0) {eff(hide=True)})"
                 f"(property \"Datasheet\" \"\" (at 0 0 0) {eff(hide=True)})"
                 f"(symbol \"PWR_FLAG_0_0\" (pin power_out line (at 0 0 90) (length 0) (name \"pwr\" {eff()})"
                 f" (number \"1\" {eff()})))"
                 f"(symbol \"PWR_FLAG_0_1\" {poly([(0, 0), (0, 1.27), (-1.016, 1.905), (0, 2.54), (1.016, 1.905), (0, 1.27)])}))"),
}

# ----------------------------------------------------------- rozmístění
LAYOUT = {}


def at(ref, x, y):
    LAYOUT[ref] = (x, y)


def grid(v):
    return round(v / G) * G


# řada 1: CPU, ROM, 8255, ULA, multiplexery
for ref, x in (("U1", 55), ("U2", 135), ("U3", 215), ("U4", 300)):
    at(ref, grid(x), grid(95))
for ref, x, y in (("U7", 385, 70), ("U8", 385, 125), ("U5", 445, 70), ("U6", 445, 125)):
    at(ref, grid(x), grid(y))
# řada 2: 4164, řada 3: 2118
for i in range(8):
    at(f"U{9 + i}", grid(45 + i * 52), grid(195))
    at(f"U{17 + i}", grid(45 + i * 52), grid(265))
# kodér/modulátor, konektory
at("U30", grid(515), grid(70))
at("J8", grid(505), grid(70))
at("U37", grid(543), grid(70))
at("U38", grid(582), grid(70))
at("J1", grid(625), grid(80))
at("J2", grid(670), grid(60))
at("J4", grid(805), grid(100))

GATE_UNITS = {}   # ref -> seznam (unit, x, y)

# blok napájení
for i, r in enumerate(POWER_BLOCK):
    at(r, grid(505 + i * 17 + (8 if r == "U32" else 0) + (16 if i > POWER_BLOCK.index("U32") else 0)), grid(285))
for i, r in enumerate(VIDEO_BLOCK):
    at(r, grid(497 + (i % 15) * 16), grid(114 + (i // 15) * 28))
for i, r in enumerate(CONV_BLOCK):
    at(r, grid(560 + i * 17 + (12 if i >= CONV_BLOCK.index("U33") else 0) + (12 if i > CONV_BLOCK.index("U33") else 0)), grid(414))
for i, r in enumerate(VGA_BLOCK):
    at(r, grid(500 + (i % 14) * 16), grid(130 + (i // 14) * 28))
at("J7", grid(740), grid(130))
PASSIVES = [r for r in parts if parts[r]["sym"] in ("R", "C", "CP", "D", "SW", "XTAL", "SPK", "NPN", "PNP", "NPN_ECB", "F", "LED", "L")
            and r not in POWER_BLOCK and r not in VIDEO_BLOCK and r not in CONV_BLOCK and r not in VGA_BLOCK]
PASSIVES.sort(key=lambda r: (r.rstrip("0123456789"), int("".join(c for c in r if c.isdigit()) or 0)))
col, row = 0, 0
for r in PASSIVES:
    at(r, grid(40 + col * 21), grid(318 + row * 34))
    col += 1
    if col >= 22:
        col, row = 0, row + 1

gx, gy = 0, 0
for ref in ("U25", "U26", "U27", "U28", "U29"):
    sym = parts[ref]["sym"]
    units, _, _ = GATES[sym]
    pins = parts[ref]["pins"]
    used = [k for k, (ins, o) in enumerate(units, 1) if any(pins.get(p) for p in (*ins, o))]
    lst = []
    for k in used + [len(units) + 1]:
        lst.append((k, grid(500 + gx * 36), grid(200 + gy * 24)))
        gx += 1
        if gx >= 9:
            gx, gy = 0, gy + 1
    GATE_UNITS[ref] = lst

# ----------------------------------------------------------- generování
out_syms, wires, labels, ncs, pwr_syms = [], [], [], [], []
svg = []
pwr_n = [0]
pin_net = []  # (net, ref, pin, pinname)


def place_label(net, x, y, dx, dy):
    """Pahýl z bodu pinu a za ním návěští nebo napájecí symbol."""
    ex, ey = x + dx * G, y + dy * G
    wires.append(f"(wire (pts (xy {x:.2f} {y:.2f}) (xy {ex:.2f} {ey:.2f})) (stroke (width 0) (type default)) (uuid {q(uid())}))")
    svg.append(("line", x, y, ex, ey))
    if net in ("+5V", "GND"):
        pwr_n[0] += 1
        ref = f"#PWR{pwr_n[0]:03d}"
        pwr_syms.append(
            f"(symbol (lib_id \"power:{net}\") (at {ex:.2f} {ey:.2f} 0) (unit 1) (exclude_from_sim no) (in_bom yes)"
            f" (on_board yes) (dnp no) (uuid {q(uid())})"
            f"(property \"Reference\" {q(ref)} (at {ex:.2f} {ey:.2f} 0) {eff(hide=True)})"
            f"(property \"Value\" {q(net)} (at {ex:.2f} {ey + (-3.2 if net == '+5V' else 4.2):.2f} 0) {eff(1.0)})"
            f"(property \"Footprint\" \"\" (at {ex:.2f} {ey:.2f} 0) {eff(hide=True)})"
            f"(property \"Datasheet\" \"\" (at {ex:.2f} {ey:.2f} 0) {eff(hide=True)})"
            f"(pin \"1\" (uuid {q(uid())}))"
            f"(instances (project \"didaktik_gama\" (path {q('/' + ROOT)} (reference {q(ref)}) (unit 1)))))")
        svg.append(("pwr", ex, ey, net))
        return
    ang, just = {(1, 0): (0, "left bottom"), (-1, 0): (180, "right bottom"),
                 (0, -1): (90, "left bottom"), (0, 1): (270, "right bottom")}[(dx, dy)]
    labels.append(f"(label {q(ov(net))} (at {ex:.2f} {ey:.2f} {ang}) (fields_autoplaced yes)"
                  f" {eff(justify=just)} (uuid {q(uid())}))")
    svg.append(("label", ex, ey, net, dx, dy))


def emit_symbol(ref, libname, X, Y, unit, value, fp, pinlist, ref_xy, val_xy, hide_val=False):
    pl = " ".join(f"(pin {q(n)} (uuid {q(uid())}))" for n in pinlist)
    out_syms.append(
        f"(symbol (lib_id {q('gama:' + libname)}) (at {X:.2f} {Y:.2f} 0) (unit {unit}) (exclude_from_sim no)"
        f" (in_bom yes) (on_board yes) (dnp no) (uuid {q(uid())})"
        f"(property \"Reference\" {q(ref)} (at {ref_xy[0]:.2f} {ref_xy[1]:.2f} 0) {eff(1.5)})"
        f"(property \"Value\" {q(value)} (at {val_xy[0]:.2f} {val_xy[1]:.2f} 0) {eff(1.27, hide_val)})"
        f"(property \"Footprint\" {q(fp)} (at {X:.2f} {Y:.2f} 0) {eff(hide=True)})"
        f"(property \"Datasheet\" \"\" (at {X:.2f} {Y:.2f} 0) {eff(hide=True)})"
        f" {pl} (instances (project \"didaktik_gama\" (path {q('/' + ROOT)} (reference {q(ref)}) (unit {unit})))))")


def connect_pin(ref, num, name, X, Y, lx, ly, ang):
    """lx,ly souřadnice konce pinu v knihovně; ang směr pinu (0 = pin vlevo od těla)."""
    net = parts[ref]["pins"].get(num)
    x, y = X + lx, Y - ly
    if net is None:
        ncs.append(f"(no_connect (at {x:.2f} {y:.2f}) (uuid {q(uid())}))")
        svg.append(("nc", x, y))
        return
    pin_net.append((net, ref, num, name))
    d = {0: (-1, 0), 180: (1, 0), 90: (0, 1), 270: (0, -1)}[ang]
    place_label(net, x, y, *d)


used_lib = set()
for ref, p in parts.items():
    sym = p["sym"]
    if sym == "CONN":
        sym = conn_sym(len(p["pins"]))
    used_lib.add(sym)
    s = SYM[sym]
    if s["kind"] == "ic":
        X, Y = LAYOUT[ref]
        pins, (x1, y1, x2, y2) = ic_geom(s)
        emit_symbol(ref, sym, X, Y, 1, p["value"], p["fp"], [str(n) for n, *_ in pins],
                    (X, Y - y1 - 2.5), (X, Y - y2 + 2.5))
        svg.append(("box", X + x1, Y - y1, X + x2, Y - y2, ref, p["value"]))
        for n, nm, t, lx, ly, a in pins:
            svg.append(("pin", X + lx, Y - ly, a, n, nm, s.get("conn", False)))
            if t == "no_connect" and parts[ref]["pins"].get(n) is None:
                svg.append(("nc", X + lx, Y - ly))
                continue
            connect_pin(ref, n, nm, X, Y, lx, ly, a)
    elif s["kind"] == "gate":
        units, fn, neg = GATES[sym]
        for k, X, Y in GATE_UNITS[ref]:
            if k <= len(units):
                ins, o = units[k - 1]
                yy, (x1, y1, x2, y2) = gate_geom(len(ins))
                emit_symbol(ref, sym, X, Y, k, p["value"], p["fp"], [str(n) for n in (*ins, o)],
                            (X, Y - y1 - 1.8), (X, Y - y2 + 1.8), hide_val=True)
                svg.append(("gate", X + x1, Y - y1, X + x2, Y - y2, f"{ref}{'ABCDEF'[k - 1]}", fn, neg))
                for pn, py in zip(ins, yy):
                    lx = -3.81 - 2 * G
                    svg.append(("gpin", X + lx, Y - py, X - 3.81, Y - py, pn))
                    connect_pin(ref, pn, "", X, Y, lx, py, 0)
                lx = 3.81 + 2 * G
                svg.append(("gpin", X + 3.81, Y, X + lx, Y, o))
                connect_pin(ref, o, "", X, Y, lx, 0, 180)
            else:
                emit_symbol(ref, sym, X, Y, k, p["value"], p["fp"], ["14", "7"],
                            (X + 5, Y - 1), (X + 5, Y + 1))
                svg.append(("box", X - 3.81, Y - 3.81, X + 3.81, Y + 3.81, ref, "PWR"))
                svg.append(("gpin", X, Y - 3.81 - G, X, Y - 3.81, 14))
                svg.append(("gpin", X, Y + 3.81, X, Y + 3.81 + G, 7))
                connect_pin(ref, 14, "VCC", X, Y, 0, 3.81 + G, 270)
                connect_pin(ref, 7, "GND", X, Y, 0, -3.81 - G, 90)
    elif s["kind"] == "two":
        X, Y = LAYOUT[ref]
        emit_symbol(ref, sym, X, Y, 1, p["value"], p["fp"], ["1", "2"], (X + 2.0, Y - 0.8), (X + 2.0, Y + 1.4))
        svg.append(("two", X, Y, s["t"], ref, p["value"]))
        for n, nm, lx, ly, a in two_geom(s["t"]):
            connect_pin(ref, n, nm, X, Y, lx, ly, a)
    elif s["kind"] == "npn":
        X, Y = LAYOUT[ref]
        emit_symbol(ref, sym, X, Y, 1, p["value"], p["fp"], ["1", "2", "3"], (X + 3.0, Y - 1), (X + 3.0, Y + 1.5))
        svg.append(("npn", X, Y, ref, p["value"]))
        m = s.get("map", {"E": 1, "B": 2, "C": 3})
        for n, nm, lx, ly, a in ((m["E"], "E", 1.27, -5.08, 90), (m["B"], "B", -3.81, 0, 0), (m["C"], "C", 1.27, 5.08, 270)):
            connect_pin(ref, n, nm, X, Y, lx, ly, a)

# PWR_FLAG na +5V a GND
flags = []
for i, net in enumerate(("+5V", "GND")):
    X, Y = grid(780), grid(30 + i * 15)
    flags.append(
        f"(symbol (lib_id \"power:PWR_FLAG\") (at {X:.2f} {Y:.2f} 0) (unit 1) (exclude_from_sim no) (in_bom yes)"
        f" (on_board yes) (dnp no) (uuid {q(uid())})"
        f"(property \"Reference\" \"#FLG0{i + 1}\" (at {X:.2f} {Y - 2:.2f} 0) {eff(hide=True)})"
        f"(property \"Value\" \"PWR_FLAG\" (at {X:.2f} {Y - 4:.2f} 0) {eff()})"
        f"(property \"Footprint\" \"\" (at {X:.2f} {Y:.2f} 0) {eff(hide=True)})"
        f"(property \"Datasheet\" \"\" (at {X:.2f} {Y:.2f} 0) {eff(hide=True)})"
        f"(pin \"1\" (uuid {q(uid())}))"
        f"(instances (project \"didaktik_gama\" (path {q('/' + ROOT)} (reference \"#FLG0{i + 1}\") (unit 1)))))")
    wires.append(f"(wire (pts (xy {X:.2f} {Y:.2f}) (xy {X:.2f} {Y + G:.2f})) (stroke (width 0) (type default)) (uuid {q(uid())}))")
    if net == "+5V":
        labels.append(f"(label \"+5V_FLAG\" (at {X:.2f} {Y + G:.2f} 0) {eff(hide=True)} (uuid {q(uid())}))")
    pwr_n[0] += 1
    pwr_syms.append(
        f"(symbol (lib_id \"power:{net}\") (at {X:.2f} {Y + G:.2f} 0) (unit 1) (exclude_from_sim no) (in_bom yes)"
        f" (on_board yes) (dnp no) (uuid {q(uid())})"
        f"(property \"Reference\" \"#PWR{pwr_n[0]:03d}\" (at {X:.2f} {Y:.2f} 0) {eff(hide=True)})"
        f"(property \"Value\" {q(net)} (at {X + 3:.2f} {Y + G:.2f} 0) {eff(hide=True)})"
        f"(property \"Footprint\" \"\" (at {X:.2f} {Y:.2f} 0) {eff(hide=True)})"
        f"(property \"Datasheet\" \"\" (at {X:.2f} {Y:.2f} 0) {eff(hide=True)})"
        f"(pin \"1\" (uuid {q(uid())}))"
        f"(instances (project \"didaktik_gama\" (path {q('/' + ROOT)} (reference \"#PWR{pwr_n[0]:03d}\") (unit 1)))))")
labels = [l for l in labels if "+5V_FLAG" not in l]

# poznámky na výkresu
notes = [
    txt("DIDAKTIK GAMA – SCHÉMA ZAPOJENIA (překresleno z tištěné předlohy)", 30, 20, 3),
    txt("Spoje jsou vedeny návěštími (labels) – stejné jméno = stejný net. ~{X} = aktivní v nule.", 30, 26, 1.8),
    txt("VGA VÝSTUP (digitální RGB z modulu ULA s CPLD, 15 kHz)", 500, 112, 2),
    txt("NAPÁJENÍ (doplněno – na předloze jen +5V)", 500, 270, 2),
    txt("K OVĚŘENÍ (na předloze nečitelné / odhadnuté):", 560, 312, 2),
]
for i, (where, what, why) in enumerate(verify):
    notes.append(txt(f"• {where}: {what} – {why}", 560, 318 + i * 3.4, 1.15))
notes_s = [n.replace("(text ", "(text ", 1)[:-1] + f" (uuid {q(uid())}))" for n in notes]

lib = [lib_symbol(s) for s in sorted(used_lib)] + list(POWER_LIB.values())
sch = (f"(kicad_sch (version 20231120) (generator \"eeschema\") (generator_version \"8.0\") (uuid {q(ROOT)})"
       f" (paper \"A1\")"
       f" (title_block (title \"Didaktik Gama – schéma zapojení\") (date \"2026-10-31\") (rev \"1\")"
       f" (company \"Překresleno z originální předlohy (Didaktik Skalica)\")"
       f" (comment 1 \"Zmeny zapojenia vyhradené\") (comment 2 \"Nety v seznamu K OVĚŘENÍ zkontrolovat na desce\"))"
       f" (lib_symbols {' '.join(lib)})\n"
       + "\n".join(wires + labels + ncs + notes_s + out_syms + pwr_syms + flags)
       + "\n (sheet_instances (path \"/\" (page \"1\"))))\n")


# hezké odsazení s-výrazů
def pretty(s):
    out, depth, i, instr = [], 0, 0, False
    buf = []
    while i < len(s):
        c = s[i]
        if instr:
            buf.append(c)
            if c == "\\":
                buf.append(s[i + 1]); i += 1
            elif c == '"':
                instr = False
        elif c == '"':
            instr = True; buf.append(c)
        elif c == "(":
            if depth > 0 and depth <= 4:
                out.append("".join(buf).rstrip()); buf = ["  " * depth]
            buf.append(c); depth += 1
        elif c == ")":
            depth -= 1; buf.append(c)
        elif c == "\n":
            pass
        else:
            buf.append(c)
        i += 1
    out.append("".join(buf))
    return "\n".join(l for l in out if l.strip()) + "\n"


with open(os.path.join(OUT, "didaktik_gama.kicad_sch"), "w") as f:
    f.write(pretty(sch))
with open(os.path.join(OUT, "didaktik_gama.kicad_pro"), "w") as f:
    f.write('{\n  "meta": {"filename": "didaktik_gama.kicad_pro", "version": 1},\n  "sheets": [["' + ROOT + '", ""]]\n}\n')

# ----------------------------------------------------------- CSV výstupy
nets = defaultdict(list)
for net, ref, num, nm in pin_net:
    nets[net].append(f"{ref}.{num}")
with open(os.path.join(OUT, "netlist.csv"), "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["net", "pocet_pinu", "piny"])
    for net in sorted(nets, key=lambda n: (n.lstrip("/~?").rstrip("0123456789"), len(n), n)):
        w.writerow([net, len(nets[net]), " ".join(nets[net])])

GROUP = {"UA880D": "CPU", "27128": "ROM", "8255": "I/O", "ULA": "ULA", "4164": "RAM 4164", "2118": "Video RAM 2118",
         "74LS157": "Multiplexer", "7400": "Logika", "7404": "Logika", "7410": "Logika", "7432": "Logika",
         "R": "Rezistor", "C": "Kondenzátor", "CP": "Kondenzátor", "D": "Dioda", "NPN": "Tranzistor",
         "SW": "Ostatní", "XTAL": "Ostatní", "SPK": "Ostatní", "CONN": "Konektor", "KODER": "Video",
         "MODULATOR": "Video", "COIL1703": "Napájení", "MC34063": "Napájení", "AD8032": "Video", "LM1881": "Video", "VGA": "Konektor", "74HCT244": "Video", "74HCT08": "Video", "L": "Napájení", "PNP": "Tranzistor", "NPN_ECB": "Tranzistor", "7805": "Napájení", "LM1889": "Video", "F": "Napájení", "LED": "Napájení"}
bom = defaultdict(list)
for ref, p in parts.items():
    bom[(GROUP[p["sym"]], p["value"], p["fp"])].append(ref)


def refkey(r):
    return (r.rstrip("0123456789"), int("".join(c for c in r if c.isdigit()) or 0))


with open(os.path.join(OUT, "bom.csv"), "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["skupina", "hodnota", "pocet", "reference", "pouzdro"])
    for (g, v, fp), refs in sorted(bom.items()):
        refs.sort(key=refkey)
        w.writerow([g, v, len(refs), " ".join(refs), fp])
with open(os.path.join(OUT, "k_overeni.csv"), "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["misto", "co", "proc"])
    w.writerows(verify)

# ----------------------------------------------------------- SVG náhled
W_, H_ = 841, 594
o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W_} {H_}" width="{W_ * 4}" height="{H_ * 4}"'
     ' font-family="DejaVu Sans, Arial, sans-serif">',
     f'<rect width="{W_}" height="{H_}" fill="#fff"/>',
     f'<rect x="10" y="10" width="{W_ - 20}" height="{H_ - 20}" fill="none" stroke="#800" stroke-width="0.3"/>']


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def nm_svg(n):
    """~{X} -> X s pruhem (SVG text-decoration overline)."""
    n = str(n)
    if n.startswith("~{"):
        return f'<tspan text-decoration="overline">{esc(n[2:-1])}</tspan>'
    if n.startswith("/"):
        return f'<tspan text-decoration="overline">{esc(n[1:])}</tspan>'
    return esc(n)


for n in notes:
    import re
    m = re.match(r'\(text "(.*)" \(at ([\d.]+) ([\d.]+) 0\) \(effects \(font \(size ([\d.]+)', n)
    t = m.group(1).replace("~{", "").replace("}", "")
    o.append(f'<text x="{m.group(2)}" y="{m.group(3)}" font-size="{float(m.group(4)) * 1.2}" fill="#008">{esc(t)}</text>')
for e in svg:
    k = e[0]
    if k == "line":
        o.append(f'<line x1="{e[1]:.2f}" y1="{e[2]:.2f}" x2="{e[3]:.2f}" y2="{e[4]:.2f}" stroke="#080" stroke-width="0.15"/>')
    elif k == "box":
        _, x1, y1, x2, y2, ref, val = e
        o.append(f'<rect x="{x1:.2f}" y="{y1:.2f}" width="{x2 - x1:.2f}" height="{y2 - y1:.2f}" fill="#ffffc8" stroke="#800" stroke-width="0.25"/>')
        o.append(f'<text x="{(x1 + x2) / 2:.2f}" y="{y1 - 1:.2f}" font-size="1.8" text-anchor="middle" fill="#066">{esc(ref)}</text>')
        o.append(f'<text x="{(x1 + x2) / 2:.2f}" y="{y2 + 2.3:.2f}" font-size="1.5" text-anchor="middle" fill="#066">{esc(val)}</text>')
    elif k == "pin":
        _, x, y, a, n, nm, conn = e
        dx = G if a == 0 else -G
        o.append(f'<line x1="{x:.2f}" y1="{y:.2f}" x2="{x + dx:.2f}" y2="{y:.2f}" stroke="#800" stroke-width="0.2"/>')
        o.append(f'<text x="{x + dx / 2:.2f}" y="{y - 0.4:.2f}" font-size="0.9" text-anchor="middle" fill="#800">{n}</text>')
        if not conn:
            anc = "start" if a == 0 else "end"
            o.append(f'<text x="{x + dx + (0.6 if a == 0 else -0.6):.2f}" y="{y + 0.45:.2f}" font-size="1.15" '
                     f'text-anchor="{anc}" fill="#066">{nm_svg(nm)}</text>')
    elif k == "gate":
        _, x1, y1, x2, y2, ref, fn, neg = e
        o.append(f'<rect x="{x1:.2f}" y="{y1:.2f}" width="{x2 - x1:.2f}" height="{y2 - y1:.2f}" fill="#ffffc8" stroke="#800" stroke-width="0.25"/>')
        o.append(f'<text x="{(x1 + x2) / 2:.2f}" y="{(y1 + y2) / 2 + 0.7:.2f}" font-size="2" text-anchor="middle" fill="#800">{esc(fn)}</text>')
        o.append(f'<text x="{(x1 + x2) / 2:.2f}" y="{y1 - 0.8:.2f}" font-size="1.5" text-anchor="middle" fill="#066">{esc(ref)}</text>')
        if neg:
            o.append(f'<circle cx="{x2 + 0.6:.2f}" cy="{(y1 + y2) / 2:.2f}" r="0.6" fill="#fff" stroke="#800" stroke-width="0.2"/>')
    elif k == "gpin":
        _, x1, y1, x2, y2, n = e
        o.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="#800" stroke-width="0.2"/>')
        o.append(f'<text x="{(x1 + x2) / 2:.2f}" y="{min(y1, y2) - 0.4 if y1 == y2 else (y1 + y2) / 2:.2f}" '
                 f'font-size="0.9" text-anchor="middle" fill="#800">{n}</text>')
    elif k == "label":
        _, x, y, net, dx, dy = e
        if dx:
            anc = "start" if dx > 0 else "end"
            o.append(f'<text x="{x + dx * 0.4:.2f}" y="{y - 0.3:.2f}" font-size="1.2" text-anchor="{anc}" fill="#000">{nm_svg(net)}</text>')
        else:
            anc = "start" if dy < 0 else "end"
            o.append(f'<text transform="translate({x - 0.3:.2f},{y + dy * 0.4:.2f}) rotate(-90)" font-size="1.2" '
                     f'text-anchor="{anc}" fill="#000">{nm_svg(net)}</text>')
    elif k == "pwr":
        _, x, y, net = e
        if net == "+5V":
            o.append(f'<path d="M{x - 0.76},{y - 1.27} L{x},{y - 2.54} L{x + 0.76},{y - 1.27} M{x},{y} L{x},{y - 2.54}" stroke="#800" stroke-width="0.2" fill="none"/>')
            o.append(f'<text x="{x:.2f}" y="{y - 3.0:.2f}" font-size="1" text-anchor="middle">+5V</text>')
        else:
            o.append(f'<path d="M{x},{y} L{x},{y + 1.27} L{x - 1.27},{y + 1.27} L{x},{y + 2.54} L{x + 1.27},{y + 1.27} L{x},{y + 1.27}" stroke="#800" stroke-width="0.2" fill="none"/>')
    elif k == "nc":
        _, x, y = e
        o.append(f'<path d="M{x - 0.6},{y - 0.6} L{x + 0.6},{y + 0.6} M{x - 0.6},{y + 0.6} L{x + 0.6},{y - 0.6}" stroke="#00f" stroke-width="0.2"/>')
    elif k == "two":
        _, x, y, t, ref, val = e
        o.append(f'<line x1="{x}" y1="{y - 2 * G}" x2="{x}" y2="{y + 2 * G}" stroke="#800" stroke-width="0.2"/>')
        if t == "R":
            o.append(f'<rect x="{x - 1.0}" y="{y - 2.54}" width="2.03" height="5.08" fill="#fff" stroke="#800" stroke-width="0.25"/>')
        elif t in ("C", "CP"):
            o.append(f'<rect x="{x - 2}" y="{y - 0.63}" width="4" height="1.27" fill="#fff" stroke="none"/>'
                     f'<path d="M{x - 2},{y - 0.63} h4 M{x - 2},{y + 0.63} h4" stroke="#800" stroke-width="0.4"/>')
        elif t in ("D", "LED"):
            o.append(f'<path d="M{x - 1.27},{y + 0.76} h2.54 L{x},{y - 0.76} Z M{x - 1.27},{y - 0.76} h2.54" fill="#800" stroke="#800" stroke-width="0.2"/>')
        elif t == "L":
            o.append(f'<path d="M{x},{y - 2.54} q1.4,0.85 0,1.7 q1.4,0.85 0,1.7 q1.4,0.85 0,1.7" fill="none" stroke="#800" stroke-width="0.25"/>')
        elif t == "F":
            o.append(f'<rect x="{x - 1.0}" y="{y - 2.54}" width="2.03" height="5.08" fill="#fff" stroke="#800" stroke-width="0.25"/>'
                     f'<line x1="{x}" y1="{y - 2.54}" x2="{x}" y2="{y + 2.54}" stroke="#800" stroke-width="0.2"/>')
        elif t == "XTAL":
            o.append(f'<rect x="{x - 1.27}" y="{y - 0.76}" width="2.54" height="1.52" fill="#fff" stroke="#800" stroke-width="0.25"/>')
        else:
            o.append(f'<rect x="{x - 1.5}" y="{y - 1.5}" width="3" height="3" fill="#fff" stroke="#800" stroke-width="0.25"/>')
        o.append(f'<text x="{x + 2.2}" y="{y - 0.3}" font-size="1.3" fill="#066">{esc(ref)}</text>')
        o.append(f'<text x="{x + 2.2}" y="{y + 1.4}" font-size="1.1" fill="#066">{esc(val)}</text>')
    elif k == "npn":
        _, x, y, ref, val = e
        o.append(f'<path d="M{x - 3.81},{y} H{x - 0.5} M{x - 0.5},{y - 1.9} V{y + 1.9} M{x - 0.5},{y - 0.63} L{x + 1.27},{y - 2.54} V{y - 5.08}'
                 f' M{x - 0.5},{y + 0.63} L{x + 1.27},{y + 2.54} V{y + 5.08}" stroke="#800" stroke-width="0.25" fill="none"/>')
        o.append(f'<circle cx="{x + 0.3}" cy="{y}" r="3" fill="none" stroke="#800" stroke-width="0.2"/>')
        o.append(f'<text x="{x + 3.6}" y="{y - 0.3}" font-size="1.3" fill="#066">{esc(ref)}</text>')
        o.append(f'<text x="{x + 3.6}" y="{y + 1.4}" font-size="1.1" fill="#066">{esc(val)}</text>')
o.append("</svg>")
with open(os.path.join(OUT, "didaktik_gama_nahled.svg"), "w") as f:
    f.write("\n".join(o))

print(f"součástek: {len(parts)}, netů: {len(nets)}, spojů pinů: {len(pin_net)}, k ověření: {len(verify)}")
