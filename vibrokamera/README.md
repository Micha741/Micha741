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
