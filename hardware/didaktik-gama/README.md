# Didaktik Gama – schéma zapojení v KiCadu

Překresleno z tištěné předlohy „DIDAKTIK GAMA – SCHÉMA ZAPOJENIA“.

| Soubor | Obsah |
|---|---|
| `didaktik_gama.kicad_pcb` | plošný spoj hlavní desky 300 × 225 mm, 4 vrstvy – rozmístěno, nety přiřazeny, **cesty signálů zatím nevedené** |
| `didaktik_gama_pcb_nahled.pdf` | náhled rozmístění desky |
| `gen_pcb.py` | generátor desky z `netlist.py` (`python3 gen_pcb.py`, potřebuje KiCad s modulem pcbnew) |
| `ula_cpld_modul.kicad_pcb` / `_pcb_nahled.pdf` | plošný spoj modulu ULA 70 × 50 mm, 2 vrstvy – rozmístěno, nety přiřazeny, cesty nevedené |
| `gen_pcb_modul.py` | generátor desky modulu (`python3 gen_pcb_modul.py`) |
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
