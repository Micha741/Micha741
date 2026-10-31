"""
Modul náhrady ULA s CPLD Xilinx XC95144XL (TQ100) pro Didaktik Gama.

Zasouvá se do 40pinové patice ULA (U4 na hlavní desce). Místo analogových U/V/Y dává
digitální R, G, B, BRIGHT a synchronizaci na konektor J2 (kabel na J8 hlavní desky).
Napájení a zem bere z J2 (+5 V, GND) – číslo pinu GND ULA není na předloze čitelné.

Vývody XC95144XL podle katalogového listu Xilinx DS056 v2.0 (tabulky I/O a Global/JTAG/Power, TQ100).
Přiřazení signálů k I/O pinům je zvolené zde; firmware musí použít vygenerovaný ula_cpld_modul.ucf.
"""

parts = {}
verify = []
TITLE = "Didaktik Gama – modul náhrady ULA (XC95144XL)"
PROJ = "ula_cpld_modul"
PAPER = ("A2", 594, 420)


def add(ref, sym, value, fp, pins):
    parts[ref] = dict(sym=sym, value=value, fp=fp, pins=pins)


def R(ref, val, a, b, fp="Resistor_SMD:R_0805_2012Metric"):
    add(ref, "R", val, fp, {1: a, 2: b})


def C(ref, val, a, b, fp="Capacitor_SMD:C_0805_2012Metric"):
    add(ref, "C", val, fp, {1: a, 2: b})


# ---------------------------------------------------------------- XC95144XL TQ100 (DS056)
# uživatelské I/O piny po funkčních blocích (FB), TQ100
IO = {
    1: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22],
    2: [99, 1, 2, 3, 4, 6, 7, 8, 9, 10],
    3: [23, 24, 25, 27, 28, 29, 30, 32, 33, 34],
    4: [87, 89, 90, 91, 92, 93, 94, 95, 96, 97],
    5: [35, 36, 37, 39, 40, 41, 42, 43, 46, 49],
    6: [74, 76, 77, 78, 79, 80, 81, 82, 85, 86],
    7: [50, 52, 53, 54, 55, 56, 58, 59, 60, 61],
    8: [63, 64, 65, 66, 67, 68, 70, 71, 72, 73],
}
SPECIAL = {22: "GCK1", 23: "GCK2", 27: "GCK3", 3: "GTS1", 4: "GTS2", 1: "GTS3", 2: "GTS4", 99: "GSR"}
VCCINT = [5, 57, 98]
VCCIO = [26, 38, 51, 88]
GND_PINS = [21, 31, 44, 62, 69, 75, 84, 100]
JTAG = {48: "TCK", 45: "TDI", 83: "TDO", 47: "TMS"}

# přiřazení signálů (CPLD pin -> net); název netu = název portu v UCF
ASSIGN = {
    22: "CLK14",                                            # GCK1 – hodiny 14 MHz
    # FB1: řízení CPU
    11: "RD_n", 12: "WR_n", 13: "MREQ_n", 14: "IORQGE_n", 15: "A14", 16: "A15",
    17: "INT_n", 18: "ROMCS_n", 19: "PHI_CPU",
    # FB2: klávesnice a MG
    6: "KB1", 7: "KB2", 8: "KB3", 9: "KB4", 10: "KB5", 2: "EAR_IN", 1: "MIC_OUT",
    # FB3: řízení DRAM
    24: "RAS_n", 25: "CAS_n", 28: "WE_n",
    # FB4: adresa DRAM (ULA piny 7,6,5,8,9,10,11)
    89: "DRAM_P7", 90: "DRAM_P6", 91: "DRAM_P5", 92: "DRAM_P8", 93: "DRAM_P9", 94: "DRAM_P10",
    95: "DRAM_P11",
    # FB6: datová sběrnice videa
    74: "D0", 76: "D1", 77: "D2", 78: "D3", 79: "D4", 80: "D5", 81: "D6", 82: "D7",
    # FB8: digitální video výstup
    63: "VID_R", 64: "VID_G", 65: "VID_B", 66: "VID_I", 67: "CSYNC_n", 68: "VSYNC_n",
}
cpld = {}
for fb, pins in IO.items():
    for p in pins:
        cpld[p] = ASSIGN.get(p)
for p in VCCINT + VCCIO:
    cpld[p] = "+3V3"
for p in GND_PINS:
    cpld[p] = "GND"
cpld.update({48: "TCK", 45: "TDI", 83: "TDO", 47: "TMS"})
add("U1", "XC95144XL", "XC95144XL-10TQG100C", "Package_QFP:TQFP-100_14x14mm_P0.5mm", cpld)

# ---------------------------------------------------------------- konektor do patice ULA (40 vývodů)
# číslování = piny ULA na hlavní desce Gamy
ula = {
    1: "CAS_n", 2: "WR_n", 3: "RD_n", 4: "WE_n", 5: "DRAM_P5", 6: "DRAM_P6", 7: "DRAM_P7",
    8: "DRAM_P8", 9: "DRAM_P9", 10: "DRAM_P10", 11: "DRAM_P11", 12: "INT_n", 13: None,
    14: "+5V", 15: None, 16: None, 17: None, 18: "D0", 19: "KB5", 20: "KB4", 21: "D1",
    22: "D2", 23: "KB3", 24: "KB2", 25: "D3", 26: "KB1", 27: "D4", 28: "MG", 29: "D5",
    30: "D6", 31: "D7", 32: "PHI_CPU", 33: "IORQGE_n", 34: "ROMCS_n", 35: "RAS_n",
    36: "A14", 37: "A15", 38: "MREQ_n", 39: None, 40: None}
add("J1", "ULA40", "do patice ULA (precizní kolíky)", "Package_DIP:DIP-40_W15.24mm", ula)

# výstup RGB – stejné pořadí jako J8 na hlavní desce
add("J2", "CONN", "RGB + napájení (na J8 hlavní desky)",
    "Connector_PinHeader_2.54mm:PinHeader_1x08_P2.54mm_Vertical",
    {1: "VID_R", 2: "VID_G", 3: "VID_B", 4: "VID_I", 5: "CSYNC_n", 6: "VSYNC_n", 7: "+5V", 8: "GND"})

# MG (pin 28): výstup přes 1k, vstup přes 10k (vstupy XC9500XL snesou 5 V)
R("R1", "1k", "MIC_OUT", "MG")
R("R2", "10k", "MG", "EAR_IN")

# hodiny 14 MHz – oscilátor 3,3 V (krystal na pinech 39/40 hlavní desky se nepoužije)
add("X1", "OSC4", "14.000 MHz 3,3V", "Oscillator:Oscillator_SMD_Abracon_ASE-4Pin_3.2x2.5mm",
    {1: "+3V3", 2: "GND", 3: "CLK14", 4: "+3V3"})
C("C1", "100n", "+3V3", "GND")

# napájení 3,3 V
add("U2", "LDO", "AMS1117-3.3", "Package_TO_SOT_SMD:SOT-223-3_TabPin2", {1: "GND", 2: "+3V3", 3: "+5V"})
C("C2", "10u", "+5V", "GND", "Capacitor_SMD:C_1206_3216Metric")
C("C3", "22u", "+3V3", "GND", "Capacitor_SMD:C_1206_3216Metric")
for i in range(7):                                       # 3x VCCINT + 4x VCCIO
    C(f"C{4 + i}", "100n", "+3V3", "GND")

# JTAG (pořadí jako létající vodiče Xilinx Platform Cable: VREF, GND, TCK, TDO, TDI, TMS)
add("J3", "CONN", "JTAG", "Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical",
    {1: "+3V3", 2: "GND", 3: "TCK", 4: "TDO", 5: "TDI", 6: "TMS"})
R("R3", "10k", "+3V3", "TMS")
R("R4", "10k", "+3V3", "TDI")
R("R5", "10k", "TCK", "GND")

LAYOUT_M = {"U1": (180, 215), "J1": (330, 180), "J2": (430, 120), "U2": (430, 230), "X1": (430, 300),
            "J3": (500, 120)}

verify.append(("GND modulu", "zem a +5 V přicházejí kabelem přes J2 z J8 hlavní desky",
               "Pin GND ULA není na předloze Gamy ani ve schématu Spectra čitelný – na J1 není GND zapojen"))
verify.append(("DRAM_P5..P11", "adresové výstupy podle pinů ULA (Gama: pin 7 = A0, 6 = A1, 5 = A2)",
               "Ve schématu Spectra je pořadí jiné (pin 5 = A0) – firmware musí vydávat bity podle zapojení multiplexeru v Gamě"))
verify.append(("U1 firmware", "zx_ula (OpenCores, GPL) s přiřazením pinů z ula_cpld_modul.ucf",
               "Názvy portů v HDL namapovat na názvy netů v UCF; hodiny 14 MHz na GCK1 (pin 22)"))
verify.append(("MG pin 28", "výstup MIC přes 1k, vstup EAR přes 10k",
               "Prahy vstupu CPLD (LVTTL) se liší od ULA – při potížích s nahráváním doplnit Schmittův klopný obvod"))
verify.append(("J1", "kolíky do patice ULA", "Použít precizní (soustružené) kolíky; modul nesmí narazit na okolní součástky"))
