# VibroKamera

Android aplikace pro vizuální sledování vibrací točivých strojů. Nahrává video
s **nejvyšší snímkovou frekvencí, kterou telefon zpřístupní aplikacím**
(Camera2 high-speed režim: typicky 120/240 fps, na některých telefonech 480 fps)
a umožňuje ho zpomaleně přehrát, krokovat po snímcích a změřit otáčky/frekvenci.

## Funkce

- **Kamera:** výběr objektivu a režimu (fps × rozlišení, ⚡ = high-speed),
  přisvícení LED, korekce expozice (EV), zámek expozice.
  Zobrazuje nejvyšší zachytitelnou frekvenci kmitání (fps / 2, Nyquist).
- **Přehrávač:** zpomalení 1× až 1/32, krokování ±1 / ±10 snímků, posuvník.
- **Měření:** značka A a B na snímcích, počet otáček mezi nimi →
  ot/min, Hz a přesnost (±1 snímek).
- **Záznamy:** seznam se skutečnou naměřenou fps (z metadat videa),
  uložení do galerie (`Movies/VibroKamera`), mazání.

- **Nastavení motoru:** AC (max. 3 600 ot/min), DC (až ~15 000 ot/min) nebo
  vlastní limit, volitelně jmenovité otáčky ze štítku. Kamera ukáže, kolik
  snímků připadne na otáčku. Nad limitem (stroboskopický efekt) přehrávač
  nabídne možné skutečné otáčky `k·fps ± zdánlivá frekvence`.
- **Výsledky:** uložení měření s poznámkou, přehled všech výsledků, export
  CSV (středníky, desetinná čárka) do `Stažené/VibroKamera`.

- **Analýza vibrací (časový záznam):** v přehrávači vybereš kontrastní bod
  na stroji, aplikace ho sleduje snímek po snímku (MediaCodec + porovnávání
  vzoru se subpixelovou přesností) a z výchylky spočítá **0-P, P-P,
  AVG = Σ|y|/N, RMS = √(Σy²/N)**, crest faktor, tvar signálu (sinus / obdélník /
  rázy podle poměrů 0,64 a 0,71), dominantní frekvenci, periodu a spektrum
  (FFT). Grafy ukazují signál, |signál| (AVG) a signál² (RMS). Volitelná
  kalibrace na mm dvěma body se známou vzdáleností.
- **Vzhled:** světlý / tmavý / podle systému. Nastavení kamery je ve spodní
  zasouvací liště, ostatní v menu ☰ → Nastavení.

- **Vyrovnání kamery:** mřížka a vodováha v náhledu (akcelerometr), ukazatel
  kolmosti (svisle, nebo vůči referenci „telefon přiložený zády na stroj“)
  a hlídání otřesů telefonu; obojí se uloží k záznamu.
- **Směr otáčení:** v přehrávači 3 klepnutí (střed hřídele, značka, značka
  o pár snímků dál) → CW/CCW při pohledu kamery + pohled DE/NDE, ukládá se
  k záznamu i do výsledků.

## Kompatibilita (Samsung, Motorola, Xiaomi…)

- Režim, který telefon nabídne, ale nezvládne (chyba konfigurace kamery
  nebo enkodéru), se zapamatuje a aplikace automaticky přepne na další.
- Datový tok se omezí na maximum H.264 enkodéru telefonu.
- Záznam max. 60 s a podle volného místa (ochrana proti přehřátí / plnému
  úložišti), displej se při natáčení nevypíná.
- Pokud telefon ukládá high-speed video se „zpomalenými“ časovými značkami,
  přehrávač i analýza to rozpoznají a použijí skutečnou snímkovou frekvenci.
- Nastavení → Diagnostika telefonu ukazuje model, kamery, high-speed režimy
  a režimy, které selhaly.

## Úložiště

| Co | Kde | Po odinstalaci |
|---|---|---|
| Videa | `Android/data/com.micha741.vibrokamera/files/Movies/recordings` | smaže se |
| Výsledky, kalibrace a nastavení | interní úložiště aplikace (`files/vibrokamera/*.json`) | smaže se |
| Kopie videa („Do galerie“) | `Filmy/VibroKamera` | zůstane |
| Export výsledků (CSV) | `Stažené/VibroKamera` | zůstane |

Videa se ukládají v reálném čase (240 fps soubor = 240 fps), takže časová osa
odpovídá skutečnosti. Zpomalení dělá přehrávač.

## Tipy pro měření

- Telefon na **stativ**, jinak měříš chvění ruky.
- Hodně světla: v high-speed režimu je čas závěrky max. 1/fps. Rozmazání
  sníží silné přisvícení a záporná EV korekce.
- Na hřídel dej **kontrastní značku** (bílá páska nebo fix).
- Pro přesné otáčky měř přes víc otáček (např. 10): chyba ±1 snímek se
  rozloží.
- Při 240 fps lze spolehlivě sledovat děje do ~120 Hz (7 200 ot/min).
  Rychlejší děje se projeví stroboskopickým efektem (aliasing).

## Sestavení

Aplikace obsahuje vlastní nativní modul (`modules/high-speed-camera`, Kotlin),
proto **nefunguje v Expo Go**, je potřeba vlastní build.

```bash
cd vibrokamera
npm install
npx eas-cli init            # jednou: založí EAS projekt a doplní projectId do app.json
npx eas-cli build -p android --profile preview      # APK k instalaci
```

Pro vývoj s rychlým obnovováním JS kódu:

```bash
npx eas-cli build -p android --profile development   # dev-client APK
npm start
```

## Struktura

- `modules/high-speed-camera/android/…/HighSpeedCameraView.kt`: náhled a záznam
  (Camera2, `createConstrainedHighSpeedCaptureSession`, MediaRecorder
  s perzistentní surface).
- `CameraCapabilities.kt`: zjištění dostupných kamer, high-speed režimů a fps.
- `Recordings.kt`: seznam, metadata, mazání, uložení do galerie.
- `src/screens/`: obrazovky Kamera, Záznamy, Přehrávač.
