# Didaktik Gama – schéma zapojení v KiCadu

Překresleno z tištěné předlohy „DIDAKTIK GAMA – SCHÉMA ZAPOJENIA“.

| Soubor | Obsah |
|---|---|
| `didaktik_gama.kicad_pcb` | plošný spoj hlavní desky 300 × 225 mm, 4 vrstvy – rozmístěno, nety přiřazeny, **cesty signálů zatím nevedené** |
| `didaktik_gama_pcb_nahled.pdf` | náhled rozmístění desky |
| `gen_pcb.py` | generátor desky z `netlist.py` (`python3 gen_pcb.py`, potřebuje KiCad s modulem pcbnew) |
| `ula_cpld_modul.kicad_pcb` / `_pcb_nahled.pdf` | plošný spoj modulu ULA 70 × 50 mm, 2 vrstvy – rozmístěno, nety přiřazeny, cesty nevedené |
| `gen_pcb_modul.py` | generátor desky modulu (`python3 gen_pcb_modul.py`) |
| `make_fab.py` | výrobní podklady: gerbery, vrtání, soupis součástek, souřadnice osazení, ZIP (do `vyroba/`) |
| `gama.pretty/`, `fp-lib-table` | vlastní pouzdro Raspberry Pi Pico (THT 2×20) |
| `didaktik_gama.kicad_sch` / `.kicad_pro` | schéma pro KiCad 8 a novější (A0, jedna strana, vlastní knihovna symbolů je v souboru) |
| `didaktik_gama_nahled.pdf` / `.svg` | náhled bez KiCadu |
| `netlist.csv` | všechny nety a piny (`U1.30` = U1 pin 30) |
| `bom.csv` | soupis součástek |
| `k_overeni.csv` | místa, která jsou na předloze nečitelná nebo odhadnutá |
| `netlist.py` | **zdroj pravdy** – netlist ručně přepsaný z předlohy |
| `gen.py` | generátor: `python3 gen.py` vše znovu vytvoří, `python3 gen.py modul` vytvoří modul ULA |
| `ula_cpld_modul.kicad_sch` / `.kicad_pro` / `_nahled.pdf` | modul náhrady ULA s CPLD XC95144XL (TQ100) do patice U4 |
| `ula_cpld_modul.ucf` | přiřazení pinů CPLD pro firmware (Xilinx ISE) |
| `netlist_modul.py`, `*_modul.csv` | netlist, soupis a body k ověření modulu |

Spoje jsou vedeny návěštími (labels): stejné jméno = stejný net. `/X` v netlistu
(v KiCadu `~{X}`) znamená signál aktivní v nule. Oprava spoje = změna jména netu
v `netlist.py` a nové spuštění `gen.py`, nebo přejmenování návěští přímo v KiCadu.

Napájení (konektor J5, pojistka F1, ochranná dioda D12, MA7805 U32, filtrace a blokovací
kondenzátory 100n u každého IC) na předloze není – je doplněno a vedeno v `k_overeni.csv`.

Pinouty UA880D, 27128, 8255, 4164, 2118 a 74LS157 odpovídají katalogovým listům
a souhlasí s čísly na předloze. ULA je očíslovaná podle předlohy (shodné se ZX ULA).

## Plošný spoj hlavní desky
- **Rozměr 300 × 225 mm, 4 vrstvy:** F.Cu a B.Cu pro signály, In1.Cu = celoplošná **GND**, In2.Cu =
  celoplošná **+5V**. Napájení všech vývodových součástek je tím propojené bez cest.
- **Rozmístění po blocích:** konektory na horním okraji (napájení, MG, jack, reproduktor, VGA,
  klávesnice, porty 8255) → CPU / ROM / 8255 / patice ULA → multiplexery a logika → 8× 4164 →
  8× 2118 → zvuk (YM2149, LM386), USB klávesnice (Pico), napájení. Blokovací kondenzátory u každého IC.
- **Kontrola DRC:** žádné překryvy pouzder ani chyby obrysu; zbývá **499 nepropojených spojů** (cesty
  signálů + napájení SMD obvodů U40/U41, které potřebují prokovy do vnitřních vrstev).

### Dokončení (vedení cest)
1. Otevřít `didaktik_gama.kicad_pro` v KiCadu 8/9 (soubor desky je ve formátu KiCadu 7, otevře se).
2. Automaticky: **Freerouting** (plugin v KiCadu nebo File → Export → Specctra DSN, výsledek
   File → Import → Specctra Session). Pravidla: cesta 0,25 mm, mezera 0,2 mm, prokov 0,6/0,3 mm;
   napájecí cesty (VIN, SPK_OUT) ručně 0,6–1 mm.
3. Zkontrolovat orientaci konektorů na hraně (VGA, jack, napájecí konektor) ve 3D náhledu.
4. Po začátku vedení cest už **nespouštět `gen_pcb.py`** (přepíše desku) – změny ze schématu přenášet
   v KiCadu přes *Update PCB from Schematic*.

## Plošný spoj modulu ULA
- **70 × 50 mm, 2 vrstvy**, zem rozlitá z obou stran (F.Cu i B.Cu).
- **J1** = 40 kolíků v rozteči DIP-40 (600 mil), zespodu do patice U4; pin 1 vlevo dole (čtvercová ploška).
  Mezi řadami kolíků jsou SMD součástky (stabilizátor U2, oscilátor X1, odpory) – J1 má proto vymezení
  jen kolem řad kolíků. Použít precizní (soustružené) kolíky.
- **U1** XC95144XL (TQFP-100) nad horní řadou kolíků, blokovací kondenzátory u napájecích vývodů.
- **J2** vlevo (RGB + zvuk + napájení, kabel 1:1 na J8 hlavní desky), **J3** JTAG vpravo.
- Modul přesahuje patici: na hlavní desce zabírá plochu 70 × 50 mm nad U4. J8 je proto u pravé hrany;
  pod modulem smí být jen nízké součástky (odpory, keramické kondenzátory).
- DRC: bez překryvů; zbývá 76 nepropojených spojů (cesty) a 2 zemní plošky CPLD s jedním
  tepelným můstkem – vyřeší se při vedení cest (prokov k zemi u vývodu).

## Výrobní podklady (gerbery)
Až budou obě desky natrasované a DRC v KiCadu čisté:
```bash
python3 make_fab.py            # obě desky
python3 make_fab.py modul      # jen modul ULA
```
Vznikne `vyroba/<deska>/`: `<deska>_gerber.zip` (gerbery + vrtání, nahrát výrobci), `gerber/` (jednotlivé
vrstvy, mapy vrtání PDF, job soubor), `<deska>_bom.csv` (soupis ve formátu Comment/Designator/Footprint),
`<deska>_pozice.csv` (souřadnice pro strojní osazení) a `PARAMETRY.txt` (parametry objednávky).

**Pojistka:** skript nejdřív spustí DRC; pokud deska má nevedené cesty nebo chyby, export odmítne
(gerbery by daly nefunkční desku). `--force -o DIR` vytvoří zkušební export s varováním NEVYRÁBĚT.

| Deska | Parametry objednávky |
|---|---|
| hlavní | 300 × 225 mm, 4 vrstvy (In1 GND, In2 +5V), FR-4 1,6 mm, Cu 35 µm, HASL bezolovnatý / ENIG |
| modul ULA | 70 × 50 mm, 2 vrstvy, FR-4 1,6 mm, ENIG doporučeno (TQFP s roztečí 0,5 mm) |

## Návod pro Windows

### 1. Programy
| Program | K čemu | Odkud |
|---|---|---|
| **KiCad 10** (stabilní; případně 9) | schéma, desky, trasování, gerbery; obsahuje i Python s modulem `pcbnew`. **Ne vývojovou verzi 10.99** – ta Python/`pcbnew` nemá | https://www.kicad.org/download/windows/ |
| Git for Windows (volitelně) | stažení repozitáře, Git Bash pro skripty `.sh` | https://git-scm.com/download/win |
| Freerouting (volitelně) | automatické vedení cest – v KiCadu *Plugin and Content Manager* → „Freerouting“ | správce doplňků KiCadu |

Repozitář stáhněte přes *Code → Download ZIP* na GitHubu (nebo `git clone`) a rozbalte například do
`C:\gama`. Dále se pracuje ve složce `C:\gama\hardware\didaktik-gama`.

### 2. Dávkové soubory (dvojklik)
Soubory `.bat` samy najdou Python, který dodává KiCad (`C:\Program Files\KiCad\10.0`, `9.0` nebo `8.0`).

| Soubor | Co udělá |
|---|---|
| `vyroba.bat` | výrobní podklady do `vyroba\` (stejně jako `make_fab.py`; lze `vyroba.bat modul`, `vyroba.bat --force -o C:\test`) |
| `schema.bat` | znovu vytvoří schémata, netlisty, BOM a seznam k ověření z `netlist.py` / `netlist_modul.py` |
| `deska.bat` | znovu vytvoří obě desky z netlistu – **přepíše natrasované cesty**, proto se ptá |

Ručně lze totéž spustit z nabídky Start → **KiCad Command Prompt** (má v cestě `python` i `kicad-cli`):
```bat
cd /d C:\gama\hardware\didaktik-gama
python make_fab.py
```

### 3. Postup od desky k objednávce
1. Dvojklik na `didaktik_gama.kicad_pro` → otevře se KiCad; otevřít editor desky.
2. Trasování: *Tools → External Plugins → Freerouting* (nebo *File → Export → Specctra DSN*, ve Freeroutingu
   *Autorouter*, pak *File → Import → Specctra Session*). Totéž pro `ula_cpld_modul.kicad_pcb`.
3. *Inspect → Design Rules Checker* → opravit chyby, nepropojené spoje musí být 0.
4. Dvojklik `vyroba.bat` → ve `vyroba\hlavni\` a `vyroba\modul\` jsou ZIPy pro výrobce a `PARAMETRY.txt`.

### 4. Firmware na Windows
- **Pico (USB klávesnice a kazety):** instalátor *Raspberry Pi Pico* pro Windows nebo rozšíření
  *Raspberry Pi Pico* ve VS Code (obsahuje Pico SDK, CMake a překladač). Otevřít složku
  `firmware\pico-usb-kbd`, přeložit, `gama_usb_kbd.uf2` zkopírovat na disk RPI-RP2 (Pico s BOOTSEL).
  Testy na PC (`test\run_tests.sh`) jdou v Git Bash s překladačem `gcc` (např. z MSYS2) nebo ve WSL.
- **CPLD (náhrada ULA):** Xilinx ISE 14.7 – pro Windows 10/11 je od AMD/Xilinx edice „ISE 14.7 Windows 10“
  (běží ve virtuálním stroji). Projekt podle `firmware\cpld-ula\README.md`, nahrání přes JTAG (iMPACT).
  Simulace: Icarus Verilog pro Windows (https://bleyer.org/icarus/), v Git Bash `sim/run_sim.sh`.

### 5. Časté problémy
- „Pouzdro nenalezeno“: KiCad je jinde než v `C:\Program Files\KiCad` – nastavte proměnnou
  `KICAD10_FOOTPRINT_DIR` (u KiCadu 9 `KICAD9_FOOTPRINT_DIR`) na složku `...\share\kicad\footprints`.
- „kicad-cli nenalezen“: spouštějte přes `vyroba.bat` nebo z *KiCad Command Prompt*.
- KiCad se při otevření desky zeptá na převod formátu (deska je uložená KiCadem 7) – potvrďte a uložte.
