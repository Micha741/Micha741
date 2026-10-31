# Didaktik Gama – USB klávesnice (Raspberry Pi Pico)

Firmware pro blok „USB KLÁVESNICE“ na hlavní desce (U39 Pico, U40 74LVC245, U41 74LVC07).
Pico pracuje jako USB host: přečte běžnou USB klávesnici a emuluje matici klávesnice Spectra.

## Jak to funguje
- **Jádro 1** v nekonečné smyčce čte adresové linky A8–A15 (GP0–GP7) a podle předpočítané tabulky
  okamžitě nastaví KB1–KB5 (GP8–GP12, přes 74LVC07: 0 = klávesa stisknuta).
- **Jádro 0** obsluhuje USB (TinyUSB) a při každé změně kláves tabulku přepočítá (dvojitý buffer).
- Původní klávesnice Gamy funguje současně (výstupy s otevřeným kolektorem).
- Svítící LED na Picu = je stisknutá nějaká klávesa.

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

## Test převodu kláves (bez Pica)
```bash
cd test
cc -I../src test_keymap.c ../src/keymap.c -o test_keymap
./test_keymap
```

## Oživení
- Pokud stisk např. `Q` vypíše jinou klávesu ze stejné řady (W, E, R, T), liší se pořadí linek
  KB1–KB5 – upravte pole `kb_to_bit` v `src/main.c`.
- Klávesnice se připojuje do micro-USB Pica redukcí OTG; Pico je napájeno z +5V přes VBUS.
