# Didaktik Gama – firmware náhrady ULA (CPLD XC95144XL)

Vlastní implementace ULA ve Verilogu pro modul `ula_cpld_modul` (zasouvá se do patice ULA, U4).
Názvy portů odpovídají souboru `../../ula_cpld_modul.ucf` (přiřazení pinů XC95144XL-TQ100).

## Co umí
| Funkce | Popis |
|---|---|
| obraz | 256×192 + border, 448 px × 312 řádků, 50,08 Hz, 69 888 T na snímek; FLASH á 16 snímků |
| video RAM 2118 | stránkové čtení bitmapy + atributu (jeden RAS, dva CAS), 2 znaky za 16 px |
| obnova 2118 | RAS-only během zatemnění na řádcích bez obrazu (128 řádků za 16 řádků obrazu) |
| CPU ↔ video RAM | RAS/CAS/WE z /MREQ, /RD, /WR; zápis „early write“ (DI/DO jsou spojené) |
| contention | pozdržení hodin CPU, když by přístup do 4000h–7FFFh nebo na port ULA kolidoval se čtením obrazu |
| port FE | zápis: border (D0–D2), MIC (D3), BEEP (D4); čtení: KB1–KB5 → D0–D4, EAR → D6, D5 = D7 = 1 |
| /INT | 32 T na začátku zatemnění (64 řádků před obrazem) |
| /ROMCS | 0 pro /MREQ v 0000h–3FFFh (EPROM 27128) |
| výstupy | digitální R, G, B, BRIGHT, /CSYNC, /VSYNC (15,6 kHz) na J2 → J8 hlavní desky; BEEP pro zesilovač |

Adresa DRAM se vydává podle zapojení Gamy: řádek = A0–A6, sloupec = A7–A13 na linkách VA0–VA6,
tj. piny ULA 7, 6, 5, 8, 9, 10, 11 (stejně jako multiplexer 74LS157 na hlavní desce).

## Simulace (ověřeno)
```bash
sim/run_sim.sh
```
Icarus Verilog s modelem 2118, multiplexeru adresy a sběrnice Z80. Ověřuje:
perioda snímku 19 967 840 ns, délka /INT 32 T, 128 zápisů/čtení video RAM během obrazu (s pozdržením
CPU) i v borderu, port FE (zápis i čtení klávesnice, lichý port bez odezvy), /ROMCS, časování RAS/CAS
a obnovu všech 128 řádků DRAM do 2 ms. Snímek testovací obrazovky: `sim/frame.png`.

## Překlad a nahrání
1. Xilinx ISE 14.7 (WebPACK, zdarma): nový projekt, zařízení **XC95144XL-10TQ100**, jazyk Verilog.
2. Přidat `src/gama_ula.v` a `../../ula_cpld_modul.ucf`, top modul `gama_ula`.
3. Implement Design → vznikne `gama_ula.jed`.
4. Nahrát přes JTAG konektor J3 modulu (iMPACT s kabelem Xilinx Platform Cable nebo kompatibilním).

## Omezení / k ověření
- **Obsazení CPLD nebylo ověřeno** (ISE tu není k dispozici). Odhad ~105 ze 144 makrobuněk; pokud se
  návrh nevejde, lze ušetřit zrušením FLASH čítače nebo zjednodušením contention.
- **Contention** je přibližná: CPU smí začít přístup v taktech 18–20 ze 32 (Spectrum: T-stavy 6–7 z 8),
  port ULA se pozdržuje během čtení obrazu. Programy závislé na přesném časování (multicolor, efekty
  v borderu) se mohou chovat jinak. Obnova DRAM přidává malé pozdržení v zatemnění řádků borderu.
- Výstup MIC a vstup EAR sdílejí pin 28 (přes 1k / 10k na modulu).
- Pořadí linek KB1–KB5 (D0–D4) a adresové mapování multiplexeru je převzato ze schématu – ověřit na desce.
