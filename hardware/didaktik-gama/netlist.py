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
    14: "+5V", 15: "U", 16: "V", 17: "Y", 18: "VD0", 19: "KB5", 20: "KB4",
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
# Kodér PAL – LM1889 (jako ZX Spectrum 48K, IC14). Funkce pinů ze servisního manuálu
# ZX Spectrum 48K (kap. 7.1): 1 chroma lead, 2 R-Y, 3 chroma bias, 4 B-Y, 5 GND,
# 6–11 nezapojeny, 12 video vstup, 13 chroma výstup, 14 RF napájení, 15 zvukový obvod,
# 16 napájení chroma, 17 výstup oscilátoru, 18 chroma lag.
add("U30", "LM1889", "LM1889N", "Package_DIP:DIP-18_W7.62mm", {
    1: "CH_LEAD", 2: "RY", 3: "CBIAS", 4: "BY", 5: "GND",
    6: None, 7: None, 8: None, 9: None, 10: None, 11: None,
    12: "LM_VIN", 13: "CHROMA", 14: "+12VA", 15: "+12VA", 16: "+12VA",
    17: "CH_OSC", 18: "CH_LAG"})
# Okolí LM1889 překresleno ze schématu ZX Spectrum Issue 1/2 (Sinclair, VII/1983),
# hodnoty z jeho soupisu součástek (Appendix C). V závorce označení ve Spectru.
# posun úrovně U/V -> B-Y/R-Y
R("R48", "3K3 (Sp R38)", "+12V", "BY")
R("R49", "2K2 trimr (Sp VR1)", "BY", "U")
R("R50", "220R (Sp R56)", "U", "GND")
R("R51", "3K3 (Sp R39)", "+12V", "RY")
R("R52", "2K2 trimr (Sp VR2)", "RY", "V")
R("R53", "330R (Sp R57)", "V", "GND")
C("C64", "47n (Sp C33)", "+12V", "RY")
# předpětí chroma (pin 3 = 4,8 V) a napájení video vstupu (pin 12)
R("R54", "1K (Sp R40)", "CBIAS", "GND")
R("R55", "1K5 (Sp R41)", "+12VA", "CBIAS")
add("C65", "CP", "22u/16V (Sp C34)", "Capacitor_THT:CP_Radial_D5.0mm_P2.00mm", {1: "CBIAS", 2: "GND"})
R("R56", "1K (Sp R42)", "+12VA", "LM_VIN")
C("C66", "47n (Sp C40)", "+12VA", "GND")
# oscilátor 4,433619 MHz a fázovací článek (piny 17, 18, 1)
R("R58", "3K (Sp R43)", "CH_OSC", "GND")
R("R59", "5K1 (Sp R44)", "CH_OSC", "CH_N2")
C("C67", "trimr (Sp VC2)", "CH_N2", "GND")
add("Y2", "XTAL", "4.433619MHz (Sp X2)", "Crystal:Crystal_HC49-4H_Vertical", {1: "CH_N2", 2: "CH_N3"})
R("R60", "1K (Sp R45)", "CH_N3", "CH_LAG")
C("C68", "33p (Sp C37)", "CH_LAG", "GND")
C("C71", "33p (Sp C38)", "CH_N3", "CH_N4")
R("R61", "1K (Sp R46)", "CH_N4", "GND")
C("C72", "10n (Sp C39)", "CH_N4", "CH_LEAD")
# chroma výstup, sčítání s jasem (TR1 invertuje Y, TR2 emitorový sledovač -> CVBS)
R("R62", "10K (Sp R72)", "+5V", "CHROMA")
add("C73", "CP", "22u/16V (Sp C65)", "Capacitor_THT:CP_Radial_D5.0mm_P2.00mm", {1: "CHROMA", 2: "T6_B"})
R("R63", "220R (Sp R47)", "Y", "GND")
R("R64", "4K7 (Sp R48)", "Y", "T5_B")
R("R65", "4K7 (Sp R50)", "T5_B", "GND")
R("R66", "18K (Sp R49)", "+5V_MOD", "T5_B")
add("T5", "NPN", "KC507 (Sp TR1 ZTX313)", "Package_TO_SOT_THT:TO-18-3", {1: "T5_E", 2: "T5_B", 3: "T6_B"})
R("R67", "2K2 (Sp R52)", "T5_E", "GND")
R("R68", "2K2 (Sp R51)", "+5V_MOD", "T6_B")
add("T6", "NPN", "KC507 (Sp TR2 ZTX313)", "Package_TO_SOT_THT:TO-18-3", {1: "CVBS", 2: "T6_B", 3: "+5V_MOD"})
R("R69", "390R (Sp R53)", "CVBS", "GND")
# napájení modulátoru a video stupně přes 15R
R("R70", "15R (Sp R64)", "+5V", "+5V_MOD")
C("C74", "47n (Sp C61)", "+5V_MOD", "GND")
add("C75", "CP", "22u/16V (Sp C25)", "Capacitor_THT:CP_Radial_D5.0mm_P2.00mm", {1: "+5V_MOD", 2: "GND"})
# +12V měnič – moderní náhrada Spectrova měniče s cívkou 1703: MC34063A jako boost 9 V -> 12 V.
# Vout = 1,25 V * (1 + R73/R74) = 1,25 * (1 + 13k/1k5) = 12,1 V
CONV_BLOCK = ["C80", "U33", "R71", "R72", "L1", "D14", "C76", "R73", "R74", "C77", "C78", "R75", "C79"]
add("C80", "CP", "100u/25V", "Capacitor_THT:CP_Radial_D6.3mm_P2.50mm", {1: "VIN", 2: "GND"})
add("U33", "MC34063", "MC34063A", "Package_DIP:DIP-8_W7.62mm", {
    1: "BST_SW", 2: "GND", 3: "BST_CT", 4: "GND", 5: "BST_FB", 6: "VIN", 7: "BST_IPK", 8: "BST_DRV"})
R("R71", "0R33 / 0,5 W (Rsc)", "VIN", "BST_IPK")
R("R72", "180R", "BST_DRV", "BST_IPK")
add("L1", "L", "100u / 1 A", "Inductor_THT:L_Radial_D8.7mm_P5.00mm_Fastron_07HCP", {1: "BST_IPK", 2: "BST_SW"})
add("D14", "D", "1N5819 (Schottky)", "Diode_THT:D_DO-41_SOD81_P10.16mm_Horizontal", {1: "+12V", 2: "BST_SW"})
C("C76", "1n5", "BST_CT", "GND")
R("R73", "13k 1%", "+12V", "BST_FB")
R("R74", "1k5 1%", "BST_FB", "GND")
C("C77", "100n", "+12V", "GND")
add("C78", "CP", "330u/25V low ESR", "Capacitor_THT:CP_Radial_D8.0mm_P3.50mm", {1: "+12V", 2: "GND"})
R("R75", "15R (Sp R61)", "+12V", "+12VA")
add("C79", "CP", "100u/16V (Sp C45)", "Capacitor_THT:CP_Radial_D6.3mm_P2.50mm", {1: "+12VA", 2: "GND"})
verify.append(("U33 MC34063A (měnič +12 V)", "náhrada měniče Spectra (TR4/TR5 + cívka 1703)",
               "Zapojení boost podle aplikační poznámky MC34063; Rsc 0R33 = proudové omezení ~0,9 A, Ct 1n5 ~ 30 kHz – ověřit s datasheetem"))

verify.append(("U30 LM1889 + okolí", "překresleno ze schématu ZX Spectrum Issue 1/2",
               "Předloha Gamy má jen blok KÓDER – ověřit, že Gama používá stejné zapojení (typ obvodu na desce)"))
verify.append(("U30 pin 16", "chroma supply na +12VA",
               "Ve schématu Spectra není spoj pinu 16 jasně vidět; podle manuálu je to napájení chroma"))

# ---------------------------------------------------------------- VGA (RGB 15 kHz) místo modulátoru
# Y/U/V z ULA -> analogová matice (AD8032, napájení +5 V) -> R, G, B 0,7 V na 75 ohm.
# R = Y + V, B = Y + U, G = Y - (U + V); černá úroveň trimrem (synchro pod černou ořízne napájecí kolej 0 V).
# Synchronizace: LM1881 (piny z katalogového listu) -> CSYNC / VSYNC -> 2x 7404 -> 75 ohm.
VGA_BLOCK = []
def vR(ref, val, a_, b_):
    R(ref, val, a_, b_); VGA_BLOCK.append(ref)
def vC(ref, val, a_, b_):
    C(ref, val, a_, b_); VGA_BLOCK.append(ref)
add("U34", "AD8032", "AD8032AN", "Package_DIP:DIP-8_W7.62mm", {
    3: "R_SUM", 2: "R_FB", 1: "R_OUT", 5: "B_SUM", 6: "B_FB", 7: "B_OUT", 8: "+5V", 4: "GND"})
add("U35", "AD8032", "AD8032AN", "Package_DIP:DIP-8_W7.62mm", {
    3: "G_Y", 2: "G_FB", 1: "G_OUT", 5: "GND", 6: "U35B_OUT", 7: "U35B_OUT", 8: "+5V", 4: "GND"})
# R kanál: (Y + V)/2 na +IN, zesílení 1 + Rf/Rg, Rg na nastavitelnou černou
vR("R76", "1k", "Y", "R_SUM"); vR("R77", "1k", "V", "R_SUM")
vR("R78", "2k2 trimr (kontrast R)", "R_OUT", "R_FB"); vR("R79", "1k", "R_FB", "R_BLK")
vR("R80", "10k", "+5V", "R_BLK"); vR("R81", "10k trimr (černá R)", "R_BLK", "GND"); vC("C81", "100n", "R_BLK", "GND")
vR("R82", "75", "R_OUT", "VGA_R")
# B kanál: (Y + U)/2
vR("R83", "1k", "Y", "B_SUM"); vR("R84", "1k", "U", "B_SUM")
vR("R85", "2k2 trimr (kontrast B)", "B_OUT", "B_FB"); vR("R86", "1k", "B_FB", "B_BLK")
vR("R87", "10k", "+5V", "B_BLK"); vR("R88", "10k trimr (černá B)", "B_BLK", "GND"); vC("C82", "100n", "B_BLK", "GND")
vR("R89", "75", "B_OUT", "VGA_B")
# G kanál: Y na +IN, U a V odečteny na -IN
vR("R90", "1k", "Y", "G_Y")
vR("R91", "2k2", "U", "G_FB"); vR("R92", "2k2", "V", "G_FB")
vR("R93", "2k2 trimr (kontrast G)", "G_OUT", "G_FB"); vR("R94", "1k", "G_FB", "G_BLK")
vR("R95", "10k", "+5V", "G_BLK"); vR("R96", "10k trimr (černá G)", "G_BLK", "GND"); vC("C83", "100n", "G_BLK", "GND")
vR("R97", "75", "G_OUT", "VGA_G")
vC("C84", "100n", "+5V", "GND"); vC("C85", "100n", "+5V", "GND")
# synchronizace
add("U36", "LM1881", "LM1881N", "Package_DIP:DIP-8_W7.62mm", {
    1: "/CSYNC", 2: "SYNC_IN", 3: "/VSYNC", 4: "GND", 5: None, 6: "SYNC_RSET", 7: None, 8: "+5V"})
vC("C86", "100n", "Y", "SYNC_IN")
vR("R98", "680k", "SYNC_RSET", "GND"); vC("C87", "100n", "SYNC_RSET", "GND")
vC("C88", "100n", "+5V", "GND")
vR("R99", "75", "/CSYNC_B", "VGA_HS"); vR("R100", "75", "/VSYNC_B", "VGA_VS")
add("J7", "VGA", "VGA DE-15 (RGB 15 kHz)", "Connector_Dsub:DSUB-15-HD_Female_Horizontal_P2.29x1.98mm_EdgePinOffset3.03mm_Housed_MountingHolesOffset4.94mm",
    {1: "VGA_R", 2: "VGA_G", 3: "VGA_B", 4: None, 5: "GND", 6: "GND", 7: "GND", 8: "GND", 9: None,
     10: "GND", 11: None, 12: None, 13: "VGA_HS", 14: "VGA_VS", 15: None})
verify.append(("VGA výstup (U34–U36, J7)", "RGB 15,6 kHz + CSYNC na pinu 13, VSYNC na pinu 14",
               "Běžný VGA monitor chce 31 kHz – potřeba monitor s 15 kHz nebo převodník (GBS-8200, OSSC, RetroTINK)"))
verify.append(("R76–R97 (matice YUV->RGB)", "poměry R = Y+V, B = Y+U, G = Y-(U+V)",
               "Úrovně U/V z ULA nejsou dokumentované – trimry nastavit podle bílé/černé a barevných pruhů; G kanál nejcitlivější"))
verify.append(("U36 LM1881", "vstup z Y přes 100n, Rset 680k || 100n",
               "Podle katalogového listu LM1881; ověřit, že Y z ULA má 0,5–2 Vpp"))
verify.append(("U31/J3 modulátor", "odstraněn", "Nahrazen výstupem VGA; zůstává kompozitní cinch J6"))

# kompozitní výstup (doplněno): emitorový sledovač + 75R na cinch
VIDEO_BLOCK = ["R48", "R49", "R50", "R51", "R52", "R53", "C64", "R54", "R55", "C65", "R56", "C66",
               "R58", "R59", "C67", "Y2", "R60", "C68", "C71", "R61", "C72", "R62", "C73",
               "R63", "R64", "R65", "R66", "T5", "R67", "R68", "T6", "R69", "R70", "C74", "C75",
               "T4", "R46", "C62", "R47", "J6"]
add("T4", "NPN", "KC507 (BC547)", "Package_TO_SOT_THT:TO-18-3", {1: "CVBS_E", 2: "CVBS", 3: "+5V"})
R("R46", "470", "CVBS_E", "GND")
add("C62", "CP", "220u/10V", "Capacitor_THT:CP_Radial_D6.3mm_P2.50mm", {1: "CVBS_E", 2: "CVBS_C"})
R("R47", "75", "CVBS_C", "VIDEO_OUT")
add("J6", "CONN", "Video (cinch)", "Connector_Coaxial:CONN_RCA_Horizontal", {1: "VIDEO_OUT", 2: "GND"})
verify.append(("T4, R46, C62, R47, J6", "kompozitní video výstup",
               "Doplněno (na předloze není) – přímý výstup CVBS pro monitor/TV se vstupem AV, obchází modulátor"))

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
    3: "/CSYNC", 4: "CSYNC_I", 5: "CSYNC_I", 6: "/CSYNC_B",       # budiče synchronizace VGA
    9: "/VSYNC", 8: "VSYNC_I", 13: "VSYNC_I", 12: "/VSYNC_B",
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
