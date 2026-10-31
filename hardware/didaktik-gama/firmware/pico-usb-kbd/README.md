# Didaktik Gama – USB klávesnice a přehrávač kazet (Raspberry Pi Pico)

Firmware pro blok „USB KLÁVESNICE“ na hlavní desce (U39 Pico, U40 74LVC245, U41 74LVC07).
Pico pracuje jako USB host: přečte běžnou USB klávesnici a emuluje matici klávesnice Spectra.

## Jak to funguje
- **Jádro 1** v nekonečné smyčce čte adresové linky A8–A15 (GP0–GP7) a podle předpočítané tabulky
  okamžitě nastaví KB1–KB5 (GP8–GP12, přes 74LVC07: 0 = klávesa stisknuta).
- **Jádro 0** obsluhuje USB (TinyUSB) a při každé změně kláves tabulku přepočítá (dvojitý buffer).
- Původní klávesnice Gamy funguje současně (výstupy s otevřeným kolektorem).
- Svítící LED na Picu = je stisknutá nějaká klávesa.

## Přehrávač kazet (.TAP z USB flash disku)
Klávesnici a flash disk připojte přes **USB rozbočovač** (do micro-USB Pica přes redukci OTG).
Pico přečte z kořenového adresáře disku soubory `*.TAP` (FAT12/16/32, krátká jména 8.3, seřazené
abecedně) a na GP14 vysílá signál kazety se standardním časováním ROM; přes dělič R96/R97 a C85
jde do vstupu magnetofonu MG_IN – Gama nahrává normálně přes `LOAD ""`.

| Klávesa | Funkce |
|---|---|
| F1 | další soubor |
| F3 | předchozí soubor |
| F2 | přehrát / zastavit |

LED na Picu po vložení disku blikne 1× (10× = disk nečitelný nebo bez souborů .TAP), po výběru
souboru blikne tolikrát, kolikátý soubor je vybrán; během přehrávání svítí.
Postup: na Gamě napište `LOAD ""` + Enter, pak F2. Při přehrávání nemějte připojený magnetofon.
Formát `.TZX` (turbo a chráněné nahrávače) zatím podporován není.

## Klávesy (US rozložení PC klávesnice)
| PC | Gama |
|---|---|
| písmena, číslice, Enter, mezera | stejná klávesa |
| Shift + písmeno | CAPS SHIFT + písmeno |
| Shift + číslice, interpunkce `, . / ; : ' " - _ = + < > ?` | znak natištěný na PC klávese (přes SYMBOL SHIFT) |
| Ctrl nebo Alt | SYMBOL SHIFT |
| Backspace, Delete | DELETE (CS+0) |
| šipky | CS+5 / 6 / 7 / 8 |
| Esc | BREAK (CS+SPACE) |
| Caps Lock | CS+2 |
| Tab | rozšířený režim (CS+SS) |
| Ctrl+Alt+Del | reset počítače (GP13, 200 ms) |

Klávesy `[ ] { } \ | ` ~` a F-klávesy nemají na Gamě obdobu a ignorují se.

## Překlad
Potřeba: [Pico SDK](https://github.com/raspberrypi/pico-sdk) (s podmodulem `lib/tinyusb`), CMake,
`arm-none-eabi-gcc`.
```bash
export PICO_SDK_PATH=/cesta/k/pico-sdk
cmake -B build
cmake --build build
```
Výsledný `build/gama_usb_kbd.uf2` nahrajte do Pica: držte tlačítko BOOTSEL, připojte Pico k PC
a soubor zkopírujte na disk RPI-RP2.

## Testy na počítači (bez Pica)
```bash
test/run_tests.sh
```
Otestuje převod kláves, čtení FAT12/16/32 (s MBR i bez, soubory přes více clusterů) a generátor
signálu kazety (pulzy se dekódují zpět na bajty a porovnají se souborem).

## Oživení
- Pokud stisk např. `Q` vypíše jinou klávesu ze stejné řady (W, E, R, T), liší se pořadí linek
  KB1–KB5 – upravte pole `kb_to_bit` v `src/main.c`.
- Klávesnice se připojuje do micro-USB Pica redukcí OTG; Pico je napájeno z +5V přes VBUS.
