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
| `gen.py` | generátor: `python3 gen.py` vše znovu vytvoří |

Spoje jsou vedeny návěštími (labels): stejné jméno = stejný net. `/X` v netlistu
(v KiCadu `~{X}`) znamená signál aktivní v nule. Oprava spoje = změna jména netu
v `netlist.py` a nové spuštění `gen.py`, nebo přejmenování návěští přímo v KiCadu.

Pinouty UA880D, 27128, 8255, 4164, 2118 a 74LS157 odpovídají katalogovým listům
a souhlasí s čísly na předloze. ULA je očíslovaná podle předlohy (shodné se ZX ULA).
