# Didaktik Gama – schéma zapojení v KiCadu

Překresleno z tištěné předlohy „DIDAKTIK GAMA – SCHÉMA ZAPOJENIA“.

| Soubor | Obsah |
|---|---|
| `didaktik_gama.kicad_sch` / `.kicad_pro` | schéma pro KiCad 8 a novější (A1, jedna strana, vlastní knihovna symbolů je v souboru) |
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
