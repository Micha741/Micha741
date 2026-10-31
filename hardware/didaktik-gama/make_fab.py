#!/usr/bin/env python3
"""Výrobní podklady (gerbery, vrtání, soupis součástek, souřadnice osazení) pro desky Didaktiku Gama.

Použití:
    python3 make_fab.py                 # obě desky do vyroba/
    python3 make_fab.py modul           # jen modul ULA
    python3 make_fab.py --force -o DIR  # export i z nedokončené desky (jen pro kontrolu, NEVYRÁBĚT)

Pojistka: před exportem se spustí DRC. Má-li deska nepropojené spoje (nevedené cesty) nebo chyby,
export se zastaví – gerbery z nedokončené desky by daly nefunkční plošný spoj.
Vyžaduje KiCad (kicad-cli + Python modul pcbnew).
"""
import argparse
import csv
import os
import re
import subprocess
import sys
import zipfile
from collections import defaultdict

import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

BOARDS = {
    "hlavni": dict(pcb="didaktik_gama.kicad_pcb", netlist="netlist", layers=4,
                   spec="300 x 225 mm, 4 vrstvy (In1 = GND, In2 = +5V), FR-4 1,6 mm, Cu 35 um, "
                        "HASL bezolovnatý nebo ENIG, nepájivá maska zelená, potisk bílý"),
    "modul": dict(pcb="ula_cpld_modul.kicad_pcb", netlist="netlist_modul", layers=2,
                  spec="70 x 50 mm, 2 vrstvy, FR-4 1,6 mm, Cu 35 um, ENIG doporučeno (TQFP 0,5 mm), "
                       "nepájivá maska zelená, potisk bílý"),
}


def drc(pcb_path):
    """vrací (počet nepropojených, počet chyb) podle DRC KiCadu"""
    board = pcbnew.LoadBoard(pcb_path)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    rpt = pcb_path + ".drc.rpt"
    pcbnew.WriteDRCReport(board, rpt, pcbnew.EDA_UNITS_MILLIMETRES, True)
    txt = open(rpt, encoding="utf-8").read()
    os.remove(rpt)
    unconnected = int(re.search(r"Found (\d+) unconnected", txt).group(1))
    errors = 0
    for block in re.split(r"\n(?=\[)", txt):
        m = re.match(r"\[(\w+)\]", block)
        if m and m.group(1) not in ("unconnected_items", "lib_footprint_issues") and "Severity: error" in block:
            errors += 1
    return unconnected, errors


def run(*args):
    r = subprocess.run(["kicad-cli", *args], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"kicad-cli selhal: {' '.join(args)}\n{r.stdout}\n{r.stderr}")


def bom_and_pos(name, cfg, outdir, pcb_path):
    mod = __import__(cfg["netlist"])
    groups = defaultdict(list)
    for ref, p in mod.parts.items():
        groups[(p["value"], p["fp"])].append(ref)
    with open(os.path.join(outdir, f"{name}_bom.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Comment", "Designator", "Footprint", "Quantity"])
        for (val, fp), refs in sorted(groups.items(), key=lambda kv: kv[1][0]):
            refs.sort(key=lambda r: (re.sub(r"\d", "", r), int(re.sub(r"\D", "", r) or 0)))
            w.writerow([val, ",".join(refs), fp.split(":")[-1], len(refs)])
    pos = os.path.join(outdir, f"{name}_pozice.csv")
    run("pcb", "export", "pos", "--format", "csv", "--units", "mm", "--side", "both", "-o", pos, pcb_path)


def export(name, cfg, outroot, force):
    pcb_path = os.path.join(HERE, cfg["pcb"])
    unconnected, errors = drc(pcb_path)
    print(f"[{name}] DRC: nepropojeno {unconnected}, chyby {errors}")
    if (unconnected or errors) and not force:
        print(f"[{name}] ZASTAVENO: deska není dokončená (vést cesty v KiCadu, pak znovu). "
              f"Pro zkušební export použijte --force.")
        return False
    outdir = os.path.join(outroot, name)
    gdir = os.path.join(outdir, "gerber")
    os.makedirs(gdir, exist_ok=True)
    cu = ["F.Cu", "B.Cu"] if cfg["layers"] == 2 else ["F.Cu", "In1.Cu", "In2.Cu", "B.Cu"]
    layers = cu + ["F.Paste", "B.Paste", "F.Silkscreen", "B.Silkscreen", "F.Mask", "B.Mask", "Edge.Cuts"]
    run("pcb", "export", "gerbers", "--layers", ",".join(layers), "--subtract-soldermask", "-o", gdir + "/",
        pcb_path)
    run("pcb", "export", "drill", "--format", "excellon", "--excellon-separate-th", "--generate-map",
        "--map-format", "pdf", "-o", gdir + "/", pcb_path)
    bom_and_pos(name, cfg, outdir, pcb_path)
    zpath = os.path.join(outdir, f"{name}_gerber.zip")
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for fn in sorted(os.listdir(gdir)):
            if not fn.endswith(".pdf"):
                z.write(os.path.join(gdir, fn), fn)
    with open(os.path.join(outdir, "PARAMETRY.txt"), "w", encoding="utf-8") as f:
        f.write(f"Deska: {name}\nParametry výroby: {cfg['spec']}\n"
                f"Gerbery: {zpath.split(os.sep)[-1]} (soubory .g*, vrtání .drl)\n"
                f"DRC při exportu: nepropojeno {unconnected}, chyby {errors}\n")
        if unconnected or errors:
            f.write("\n!!! ZKUŠEBNÍ EXPORT Z NEDOKONČENÉ DESKY – NEVYRÁBĚT !!!\n")
    print(f"[{name}] hotovo: {outdir}")
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("deska", nargs="*", help="hlavni a/nebo modul (výchozí obě)")
    ap.add_argument("--force", action="store_true", help="export i z nedokončené desky (NEVYRÁBĚT)")
    ap.add_argument("-o", "--out", default=os.path.join(HERE, "vyroba"))
    a = ap.parse_args()
    names = a.deska or list(BOARDS)
    for n in names:
        if n not in BOARDS:
            ap.error(f"neznámá deska {n} (možnosti: {', '.join(BOARDS)})")
    ok = all([export(n, BOARDS[n], a.out, a.force) for n in names])
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
