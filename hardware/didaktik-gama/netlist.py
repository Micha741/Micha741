"""
Didaktik Gama – netlist přepsaný z tištěného schématu "DIDAKTIK GAMA – SCHÉMA ZAPOJENIA".

Každá součástka: ref -> (typ symbolu, hodnota, pouzdro, {pin: net}).
Názvy netů: "/X" = aktivní v nule (v KiCadu se kreslí s pruhem).
Nety s předponou "?" nebo uvedené ve VERIFY jsou z fotky nečitelné / odhadnuté.
"""

# ---------------------------------------------------------------- pomocné
def bus(prefix, n):
    return [f"{prefix}{i}" for i in range(n)]

A = bus("A", 16)
D = bus("D", 8)
VD = bus("VD", 8)          # datová sběrnice videa (ULA + 2118), za 8x470R
VA = bus("VA", 7)          # adresa video DRAM (ULA "DRAM A0..A6")
RA = bus("RA", 8)          # multiplexovaná adresa 4164

parts = {}
verify = []                # (ref/net, co, proč)


def add(ref, sym, value, fp, pins):
    parts[ref] = dict(sym=sym, value=value, fp=fp, pins=pins)


# ---------------------------------------------------------------- CPU
add("U1", "UA880D", "UA880D (Z80)", "Package_DIP:DIP-40_W15.24mm", {
    1: "A11", 2: "A12", 3: "A13", 4: "A14", 5: "A15", 6: "CLK",
    7: "D4", 8: "D3", 9: "D5", 10: "D6", 11: "+5V", 12: "D2", 13: "D7",
    14: "D0", 15: "D1", 16: "/INT", 17: "/NMI", 18: None, 19: "/MREQ",
    20: "/IORQ", 21: "/RD", 22: "/WR", 23: None, 24: "/WAIT", 25: "/BUSRQ",
    26: "/RESET", 27: "/M1", 28: None, 29: "GND",
    30: "A0", 31: "A1", 32: "A2", 33: "A3", 34: "A4", 35: "A5", 36: "A6",
    37: "A7", 38: "A8", 39: "A9", 40: "A10"})

R = lambda ref, val, a, b, fp="Resistor_THT:R_Axial_DIN0207_L6.3mm_D2.5mm_P10.16mm_Horizontal": \
    add(ref, "R", val, fp, {1: a, 2: b})
C = lambda ref, val, a, b, fp="Capacitor_THT:C_Disc_D5.0mm_W2.5mm_P5.00mm": \
    add(ref, "C", val, fp, {1: a, 2: b})

R("R1", "10k", "+5V", "/NMI")
R("R2", "10k", "+5V", "/WAIT")
R("R3", "10k", "+5V", "/BUSRQ")
R("R4", "220k", "+5V", "/RESET")                      # M22
add("C1", "CP", "2u", "Capacitor_THT:CP_Radial_D5.0mm_P2.50mm", {1: "/RESET", 2: "GND"})
add("SW1", "SW", "RESET", "Button_Switch_THT:SW_PUSH_6mm", {1: "/RESET", 2: "GND"})

# IORQ pro ULA: 470R + KSY72 (báze A0) -> ULA vidí jen sudé porty
R("R5", "470", "/IORQ", "/IORQGE")
add("T1", "NPN", "KSY72", "Package_TO_SOT_THT:TO-18-3", {1: "/IORQGE", 2: "A0", 3: "+5V"})
R("R6", "470", "/INT", "/INT_ULA")

# Hodiny CPU: ULA phi -> 1k -> KSY72, kolektor 180R na +5V
R("R7", "1k", "PHI", "T2_B")
R("R8", "180", "+5V", "CLK")
add("T2", "NPN", "KSY72", "Package_TO_SOT_THT:TO-18-3", {1: "GND", 2: "T2_B", 3: "CLK"})

# ---------------------------------------------------------------- ROM
add("U2", "27128", "27128 (16K EPROM)", "Package_DIP:DIP-28_W15.24mm", {
    1: "+5V", 2: "A12", 3: "A7", 4: "A6", 5: "A5", 6: "A4", 7: "A3", 8: "A2",
    9: "A1", 10: "A0", 11: "D0", 12: "D1", 13: "D2", 14: "GND", 15: "D3",
    16: "D4", 17: "D5", 18: "D6", 19: "D7", 20: "/ROMCS", 21: "A10",
    22: "/RD", 23: "A11", 24: "A9", 25: "A8", 26: "A13", 27: "+5V", 28: "+5V"})
C("C2", "100p", "/ROMCS", "GND")
verify.append(("U2 pin 20 (/CE)", "/ROMCS = ULA pin 34",
               "U pinu 20 je jen kondenzátor 100p; připojení na ULA ROMCS je odhad"))

# ---------------------------------------------------------------- 8255
pa = {0: 4, 1: 3, 2: 2, 3: 1, 4: 40, 5: 39, 6: 38, 7: 37}
pb = {i: 18 + i for i in range(8)}
pc = {0: 14, 1: 15, 2: 16, 3: 17, 4: 13, 5: 12, 6: 11, 7: 10}
p8255 = {34: "D0", 33: "D1", 32: "D2", 31: "D3", 30: "D4", 29: "D5", 28: "D6", 27: "D7",
         5: "/RD", 36: "/WR", 9: "A5", 8: "A6", 6: "/CS8255", 35: "RESET",
         7: "GND", 26: "+5V"}
for i in range(8):
    p8255[pa[i]] = f"PA{i}"
    p8255[pb[i]] = f"PB{i}"
    p8255[pc[i]] = f"PC{i}"
add("U3", "8255", "8255 (MHB8255)", "Package_DIP:DIP-40_W15.24mm", p8255)

# ---------------------------------------------------------------- ULA
add("U4", "ULA", "ULA", "Package_DIP:DIP-40_W15.24mm", {
    1: "/VCAS", 2: "/WR", 3: "/RD", 4: "/VWE", 5: "VA2", 6: "VA1", 7: "VA0",
    8: "VA3", 9: "VA4", 10: "VA5", 11: "VA6", 12: "/INT_ULA", 13: "ULA_UPE",
    14: "+5V", 15: None, 16: None, 17: None, 18: "VD0", 19: "KB5", 20: "KB4",
    21: "VD1", 22: "VD2", 23: "KB3", 24: "KB2", 25: "VD3", 26: "KB1",
    27: "VD4", 28: "MG", 29: "VD5", 30: "VD6", 31: "VD7", 32: "PHI",
    33: "/IORQGE", 34: "/ROMCS", 35: "/VRAS", 36: "A14", 37: "A15",
    38: "/MREQ", 39: "XTAL1", 40: "XTAL2"})
verify.append(("U4 (ULA)", "pin GND není ve schématu nakreslen",
               "Čísla pinů 36/37 (A14/A15) a 2 (/WR) jsou na předloze rozmazaná – převzato dle zapojení ZX ULA"))
R("R9", "15", "+5V", "ULA_UPE")
add("Y1", "XTAL", "14MHz", "Crystal:Crystal_HC49-4H_Vertical", {1: "XTAL1", 2: "XTAL_C"})
C("C3", "47p", "XTAL_C", "XTAL2")

# Klávesnice: KB1..KB5 s 5x10k na +5V, adresy A8..A15 přes 8x KA136
for i in range(5):
    R(f"R{10+i}", "10k", "+5V", f"KB{i+1}")
for i in range(8):
    add(f"D{1+i}", "D", "KA136", "Diode_THT:D_DO-35_SOD27_P7.62mm_Horizontal",
        {1: f"A{8+i}", 2: f"KA{8+i}"})                 # 1=K (na adresu), 2=A (na klávesnici)

add("J1", "CONN", "Klávesnice", "Connector_PinHeader_2.54mm:PinHeader_1x14_P2.54mm_Vertical",
    {1: "KB1", 2: "KB2", 3: "KB3", 4: "KB4", 5: "KB5",
     6: "KA8", 7: "KA9", 8: "KA10", 9: "KA11", 10: "KA12", 11: "KA13",
     12: "KA14", 13: "KA15", 14: "/BANKSEL"})

# MG (magnetofon) + zvuk – pin 28 ULA
add("D9", "D", "KA136", "Diode_THT:D_DO-35_SOD27_P7.62mm_Horizontal", {1: "SPK_D", 2: "MG"})
add("D10", "D", "KA136", "Diode_THT:D_DO-35_SOD27_P7.62mm_Horizontal", {1: "SPK_K", 2: "SPK_D"})
add("D11", "D", "KA136", "Diode_THT:D_DO-35_SOD27_P7.62mm_Horizontal", {1: "MG", 2: "GND"})
add("LS1", "SPK", "Reproduktor", "Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical",
    {1: "SPK_K", 2: "GND"})
C("C4", "10n", "MG", "GND")
R("R15", "10k", "MG", "MG_O1")
C("C5", "100n", "MG_O1", "MG_OUT")
C("C6", "100n", "MG", "MG_I1")
R("R16", "680", "MG_I1", "T3_B")
add("T3", "NPN", "KC507", "Package_TO_SOT_THT:TO-18-3", {1: "GND", 2: "T3_B", 3: "T3_C"})
R("R17", "1k", "+5V", "T3_C")
R("R18", "330k", "T3_C", "MG_I2")
C("C7", "100n", "MG_I2", "MG_IN")
add("J2", "CONN", "MG", "Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical",
    {1: "MG_OUT", 2: "MG_IN", 3: "GND"})
verify.append(("MG / zvuk (D9–D11, LS1, T3)", "horní konce reproduktoru, diod a 10n",
               "Na předloze končí bez označení – připojeno na GND; zapojení KC507 přepsáno doslova, ověřit"))

# Video výstup
# ---------------------------------------------------------------- VGA z digitální náhrady ULA
# Do patice ULA (U4) se osadí modul s CPLD (XC95144XL, firmware zx_ula / OpenCores), který místo
# analogových Y/U/V dává digitální R, G, B, BRIGHT a synchronizaci na konektor J8.
# 74HCT244 budí barvy a synchro, 74HCT08 přidává jas jen rozsvíceným barvám (černá zůstane černá).
# Převodník: barva 680R + (barva AND jas) 1k5 do 75R zátěže monitoru -> 0,50 V / 0,69 V.
VIDEO_BLOCK, CONV_BLOCK = [], []
VGA_BLOCK = []
def vR(ref, val, a_, b_):
    R(ref, val, a_, b_); VGA_BLOCK.append(ref)
def vC(ref, val, a_, b_):
    C(ref, val, a_, b_); VGA_BLOCK.append(ref)
add("J8", "CONN", "RGB z modulu ULA", "Connector_PinHeader_2.54mm:PinHeader_1x08_P2.54mm_Vertical",
    {1: "RGB_R", 2: "RGB_G", 3: "RGB_B", 4: "RGB_I", 5: "/RGB_CSYNC", 6: "/RGB_VSYNC", 7: "+5V", 8: "GND"})
add("U37", "74HCT244", "74HCT244", "Package_DIP:DIP-20_W7.62mm", {
    1: "GND", 19: "GND",
    2: "RGB_R", 18: "DAC_R", 4: "RGB_G", 16: "DAC_G", 6: "RGB_B", 14: "DAC_B",
    8: "/RGB_CSYNC", 12: "VGA_HS_D", 11: "/RGB_VSYNC", 9: "VGA_VS_D",
    13: "GND", 7: None, 15: "GND", 5: None, 17: "GND", 3: None,
    10: "GND", 20: "+5V"})
add("U38", "74HCT08", "74HCT08", "Package_DIP:DIP-14_W7.62mm", {
    1: "RGB_R", 2: "RGB_I", 3: "DACB_R",
    4: "RGB_G", 5: "RGB_I", 6: "DACB_G",
    9: "RGB_B", 10: "RGB_I", 8: "DACB_B",
    12: "GND", 13: "GND", 11: None, 7: "GND", 14: "+5V"})
for c in "RGB":
    vR(f"R{76 + 'RGB'.index(c) * 2}", "680", f"DAC_{c}", f"VGA_{c}")
    vR(f"R{77 + 'RGB'.index(c) * 2}", "1k5", f"DACB_{c}", f"VGA_{c}")
vR("R82", "75", "VGA_HS_D", "VGA_HS")
vR("R83", "75", "VGA_VS_D", "VGA_VS")
vR("R84", "10k", "RGB_R", "GND"); vR("R85", "10k", "RGB_G", "GND"); vR("R86", "10k", "RGB_B", "GND")
vR("R87", "10k", "RGB_I", "GND")
vR("R88", "10k", "+5V", "/RGB_CSYNC"); vR("R89", "10k", "+5V", "/RGB_VSYNC")
vC("C81", "100n", "+5V", "GND"); vC("C82", "100n", "+5V", "GND")
add("J7", "VGA", "VGA DE-15 (RGB 15 kHz)", "Connector_Dsub:DSUB-15-HD_Female_Horizontal_P2.29x1.98mm_EdgePinOffset3.03mm_Housed_MountingHolesOffset4.94mm",
    {1: "VGA_R", 2: "VGA_G", 3: "VGA_B", 4: None, 5: "GND", 6: "GND", 7: "GND", 8: "GND", 9: None,
     10: "GND", 11: None, 12: None, 13: "VGA_HS", 14: "VGA_VS", 15: None})
verify.append(("U4 patice ULA", "osadit modul s CPLD (XC95144XL + firmware zx_ula, GPL) místo originální ULA",
               "Modul je samostatná deska (40 vývodů do patice + výstup RGB na J8) – zatím nenakreslen; piny 15–17 (U, V, Y) nezapojeny"))
verify.append(("J8 / VGA výstup", "digitální RGB + BRIGHT + CSYNC/VSYNC z modulu, 15,6 kHz",
               "Běžný VGA monitor chce 31 kHz – potřeba monitor s 15 kHz nebo převodník (GBS-8200, OSSC, RetroTINK)"))
verify.append(("R76–R81 (převodník)", "680R + 1k5 do 75R monitoru: 0,50 V normální, 0,69 V jas",
               "Vypočteno pro výstup 74HCT244 při 5 V; přesnost závisí na výstupním odporu hradla"))

# ---------------------------------------------------------------- video RAM 8x2118 (16K)
# piny 2118 podle čísel u vodičů na předloze
p2118_addr = {"VA3": 13, "VA4": 12, "VA5": 10, "VA6": 6, "VA0": 5, "VA1": 11, "VA2": 7}
for i in range(8):
    pins = {1: None, 2: VD[i], 14: VD[i], 3: "/VWE", 4: "/VRAS", 15: "/VCAS",
            8: "+5V", 9: "+5V", 16: "GND"}
    for net, p in p2118_addr.items():
        pins[p] = net
    add(f"U{17+i}", "2118", "2118", "Package_DIP:DIP-16_W7.62mm", pins)

for i in range(8):
    R(f"R{19+i}", "470", D[i], VD[i])                  # 8x470 oddělení sběrnic

# MUX1: 2x LS157 CPU adresa -> 330R -> VA (řádek A0..A6, sloupec A7..A13)
def mux157(ref, sel, chans):
    """chans: {výstupní pin: (vstup A = sel 0, vstup B = sel 1, výstupní net)}"""
    inmap = {4: (2, 3), 7: (5, 6), 9: (11, 10), 12: (14, 13)}
    pins = {1: sel, 15: "GND", 8: "GND", 16: "+5V"}
    for yp, (a, b, y) in chans.items():
        pa_, pb_ = inmap[yp]
        pins[pa_], pins[pb_], pins[yp] = a, b, y
    for p in range(1, 17):
        pins.setdefault(p, None)
    add(ref, "74LS157", "74LS157", "Package_DIP:DIP-16_W7.62mm", pins)

mux157("U7", "MUX1", {9: ("A3", "A10", "VM3"), 7: ("A4", "A11", "VM4"),
                      4: ("A5", "A12", "VM5"), 12: ("A6", "A13", "VM6")})
mux157("U8", "MUX1", {12: ("A0", "A7", "VM0"), 4: ("A1", "A8", "VM1"),
                      7: ("A2", "A9", "VM2")})
for i in range(7):
    R(f"R{27+i}", "330", f"VM{i}", VA[i])
R("R34", "100", "/VRAS", "MUX1")
verify.append(("U7/U8 vstupy", "přiřazení A/B vstupů LS157",
               "Na předloze jsou vidět jen odbočky z adresové sběrnice – řádek An / sloupec An+7 je odvozeno funkčně"))

# MUX2: 2x LS157 pro 4164 (řádek A0..A7, sloupec A8..A14 + BANK)
mux157("U5", "MUX2", {9: ("A7", "BANK", "RA7"), 4: ("A2", "A10", "RA2"),
                      12: ("A1", "A9", "RA1"), 7: ("A0", "A8", "RA0")})
mux157("U6", "MUX2", {12: ("A6", "A14", "RA6"), 4: ("A5", "A13", "RA5"),
                      7: ("A4", "A12", "RA4"), 9: ("A3", "A11", "RA3")})
verify.append(("U5 pin 10", "sloupcový bit RA7 = BANK (PC0 8255)",
               "Funkční odhad: horních 32K je 2x32K banka přepínaná PC0"))

# 8x4164 (2x32K banka 8000h-FFFFh)
p4164_addr = {0: 5, 1: 7, 2: 6, 3: 12, 4: 11, 5: 10, 6: 13, 7: 9}
for i in range(8):
    pins = {1: None, 2: D[i], 14: D[i], 3: "/WE64", 4: "/RAS64", 15: "/CAS64",
            8: "+5V", 16: "GND"}
    for b, p in p4164_addr.items():
        pins[p] = RA[b]
    add(f"U{9+i}", "4164", "4164", "Package_DIP:DIP-16_W7.62mm", pins)
for i in range(8):
    R(f"R{35+i}", "8k2", "+5V", D[i])

# ---------------------------------------------------------------- pomocná logika
add("U25", "7404", "74LS04", "Package_DIP:DIP-14_W7.62mm", {
    1: "/WR", 2: "WR_I", 3: "WR_I", 4: "WR_D",          # zpožďovací řetězec /WR
    5: "A7", 6: "A7_N", 9: "/IORQ", 8: "IORQ_H",         # dekódování 8255
    13: "/RESET", 12: "RESET",                           # RESET pro 8255
    11: None, 10: None, 7: "GND", 14: "+5V"})
add("U26", "7404", "74LS04", "Package_DIP:DIP-14_W7.62mm", {
    1: "PC0", 2: "BANK", 11: "BANK", 10: "/BANKSEL",
    3: None, 4: None, 5: None, 6: None, 9: None, 8: None, 13: None, 12: None,
    7: "GND", 14: "+5V"})
add("U27", "7400", "74LS00", "Package_DIP:DIP-14_W7.62mm", {
    5: "WR_D", 4: "/RD", 6: "RW",
    9: "RW", 10: "A15", 8: "/SEL64",
    1: None, 2: None, 3: None, 12: None, 13: None, 11: None, 7: "GND", 14: "+5V"})
verify.append(("U27 pin 10", "= A15", "Vstup přichází z adresové sběrnice, konkrétní linka nečitelná"))
add("U28", "7410", "74LS10", "Package_DIP:DIP-14_W7.62mm", {
    3: "A7_N", 4: "IORQ_H", 5: "/M1", 6: "/CS8255",
    1: None, 2: None, 13: None, 12: None, 9: None, 10: None, 11: None, 8: None,
    7: "GND", 14: "+5V"})
verify.append(("U28 (CS 8255)", "3vstupé NAND: ~A7, IORQ, /M1",
               "Typ hradla a třetí vstup (/M1) odhadnuty; port 8255 = A7=0 (1Fh/3Fh/5Fh/7Fh)"))
add("U29", "7432", "74LS32", "Package_DIP:DIP-14_W7.62mm", {
    1: "/MREQ", 2: "/MREQ", 3: "/RAS64",
    9: "RAS_D", 10: "/SEL64", 8: "MUX2",
    4: "/RAS64", 5: "MUX2_D", 6: "/CAS64",
    12: "/WR", 13: "/MREQ", 11: "/WE64",
    7: "GND", 14: "+5V"})
R("R43", "220", "/RAS64", "RAS_D")
C("C8", "47p", "RAS_D", "GND")
R("R44", "220", "MUX2", "MUX2_D")
C("C9", "100p", "MUX2_D", "GND")
C("C10", "100p", "/MREQ", "GND")
verify.append(("U29D (/WE64)", "vstupy 12 = /WR, 13 = /MREQ",
               "Výstup 11 jde na /WE 4164 – vstupy na předloze nejasné"))
verify.append(("C9", "100p z MUX2_D na GND", "Druhý konec kondenzátoru na předloze nejasný"))

# 8255 porty ven
pins = {i + 1: f"PA{i}" for i in range(8)}
pins.update({9 + i: f"PB{i}" for i in range(8)})
pins.update({17 + i: f"PC{i}" for i in range(8)})
pins.update({25: "+5V", 26: "GND"})
add("J4", "CONN", "Porty 8255", "Connector_PinHeader_2.54mm:PinHeader_2x13_P2.54mm_Vertical", pins)

# ---------------------------------------------------------------- napájení (doplněno)
# Předloha ukazuje jen "+5V". Doplněn běžný lineární zdroj s MA7805 (Tesla ekvivalent 7805)
# a blokovací kondenzátory u každého IC.
POWER_BLOCK = ["J5", "F1", "D12", "C11", "C12", "U32", "C13", "C14", "C15", "D13", "R45"]
add("J5", "CONN", "Napájení 9–12V DC", "Connector_BarrelJack:BarrelJack_Horizontal",
    {1: "VIN_RAW", 2: "GND"})
add("F1", "F", "1A T", "Fuse:Fuseholder_Cylinder-5x20mm_Stelvio-Kontek_PTF78_Horizontal_Open",
    {1: "VIN_RAW", 2: "VIN_F"})
add("D12", "D", "1N5822 (Schottky 3A)", "Diode_THT:D_DO-201AD_P15.24mm_Horizontal",
    {1: "VIN", 2: "VIN_F"})                              # ochrana proti přepólování
add("C11", "CP", "1000u/25V", "Capacitor_THT:CP_Radial_D10.0mm_P5.00mm", {1: "VIN", 2: "GND"})
C("C12", "100n", "VIN", "GND")
add("U32", "7805", "R-78E5.0-1.0 (spínaný, náhrada 7805)", "Converter_DCDC:Converter_DCDC_RECOM_R-78E-0.5_THT",
    {1: "VIN", 2: "GND", 3: "+5V"})
C("C13", "100n", "+5V", "GND")
add("C14", "CP", "220u/10V", "Capacitor_THT:CP_Radial_D6.3mm_P2.50mm", {1: "+5V", 2: "GND"})
add("C15", "CP", "10u/16V", "Capacitor_THT:CP_Radial_D5.0mm_P2.00mm", {1: "+5V", 2: "GND"})
add("D13", "LED", "LED zelená", "LED_THT:LED_D5.0mm", {1: "LED_K", 2: "+5V"})
R("R45", "470", "LED_K", "GND")
verify.append(("U32 spínaný stabilizátor", "R-78E5.0-1.0 místo MA7805 (stejné vývody IN-GND-OUT)",
               "Méně tepla (účinnost ~90 %); při rušení obrazu lze vrátit MA7805 na chladiči"))
verify.append(("Napájení (J5, F1, D12, U32)", "celý blok doplněn",
               "Na předloze není – 9 V nestabilizovaných + 7805 odpovídá servisnímu manuálu ZX Spectrum 128 (zdroj ZX power pack); u Gamy ověřit na adaptéru"))

# blokovací kondenzátory 100n u každého IC
_ics = [r for r in parts if parts[r]["sym"] in
        ("UA880D", "27128", "8255", "ULA", "4164", "2118", "74LS157", "7400", "7404", "7410", "7432")]
_ics.sort(key=lambda r: int(r[1:]))
for i, r in enumerate(_ics):
    C(f"C{20 + i}", "100n", "+5V", "GND")
# objemové kondenzátory u bank DRAM
add("C60", "CP", "47u/10V", "Capacitor_THT:CP_Radial_D5.0mm_P2.00mm", {1: "+5V", 2: "GND"})
add("C61", "CP", "47u/10V", "Capacitor_THT:CP_Radial_D5.0mm_P2.00mm", {1: "+5V", 2: "GND"})
verify.append(("C20–C61", "blokování napájení",
               "Doplněno: 100n u každého IC (u napájecích pinů), 47u u bank 4164 a 2118"))
