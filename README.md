- 👋 Hi, I’m @Micha
- 👀 I’m interested in ...
- 🌱 I’m currently learning ...
- 💞️ I’m looking to collaborate on ...
- 📫 How to reach me ...

<!---
Micha741/Micha741 is a ✨ special ✨ repository because its `README.md` (this file) appears on your GitHub profile.
You can click the Preview link to take a look at your changes.
--->

## Skener — Android app pro skenování dokumentů

Nativní Android aplikace (Kotlin + Jetpack Compose), která pomocí kamery
naskenuje dokument, automaticky ho ořízne/vylepší a uloží jako PDF.
Skenování dokumentu je postavené na [ML Kit Document Scanner API](https://developers.google.com/ml-kit/vision/doc-scanner)
(detekce hran, korekce perspektivy, filtry, vícestránkové skeny). Počítání
kusů má vlastní obrazovou analýzu přes OpenCV, stejnou pro statickou fotku
i živý náhled kamery — viz sekce Funkce níže.

### Funkce

- Skenování dokumentu kamerou (nebo import z galerie) s automatickou detekcí
  hran a oříznutím
- Víc stránek v jednom skenu, export do PDF
- **Dva režimy skenu**: klasický obrázkový PDF (naskenovaná stránka jako
  fotka), nebo čistě textový PDF — appka přes stránky spustí OCR (ML Kit
  Text Recognition) a vygeneruje PDF jen s rozpoznaným textem, bez fotky.
  Textový PDF si drží i přibližné formátování z fotky: každý řádek se
  vykreslí zpátky na svou původní pozici a velikost (podle bounding boxu
  z OCR — zachová i řádkování), tučné písmo se odhaduje podle hustoty
  tmavých pixelů v řádku vůči mediánu stránky, kurzíva podle zkosení
  rohových bodů řádku (ML Kit vrací i mírně nakloněný čtyřúhelník, ne jen
  rovný obdélník) a barva textu se vzorkuje z nejtmavších pixelů uvnitř
  řádku na originální fotce. Tučné/kurzíva/barva jsou heuristiky (ML Kit
  žádné takové metadata sám nedává) — u čistě strojového textu na
  jednoduchém pozadí fungují dobře, u composite/ručně psaného textu méně
  spolehlivě. Velikost písma každého řádku je navíc omezená skutečnou
  mezerou k nejbližšímu řádku pod ním (ne jen výškou vlastního bounding
  boxu OCR), aby si u hustého textu s malými řádky velká/tučná písmena
  „nekousala“ s textem pod nimi
- Seznam uložených skenů (počet stránek, datum)
- Sdílení PDF přes systémový share sheet
- **Uložení do zařízení** — systémový výběr umístění (Storage Access
  Framework), takže PDF jde uložit třeba do Stažených souborů, na Disk
  nebo SD kartu, mimo interní úložiště appky
- Smazání skenu
- **Počítání kusů** — statická fotka/výběr z galerie i živý náhled z kamery
  (CameraX) běží přes **stejný OpenCV pipeline** (`org.opencv:opencv`,
  `data/cv/CvBlobAnalyzer.kt`):
  - Segmentace kombinuje dvě masky: adaptivní prahování podle klouzavého
    průměru jasu (`Imgproc.adaptiveThreshold`, funguje i při nerovnoměrném
    osvětlení/stínech, na rozdíl od jednoho globálního prahu — polarita
    světlý/tmavý kus na opačném pozadí se navíc detekuje pro každý snímek
    zvlášť, takže to funguje stejně dobře na světlém i tmavém pozadí) **a**
    barevnou masku (převod do HSV; barva pozadí se odhaduje jako medián
    přes celý snímek, ne jen z okraje fotky — mnohem odolnější, když kus
    zabírá větší část záběru, např. při přiblížení zoomem; práh na
    odchylku odstínu/sytosti/jasu od tohoto pozadí) — obě masky se spojí
    přes OR, takže appka pozná kus i tehdy, kdy má podobný jas jako
    pozadí, ale liší se barvou. Dál morfologické operace a `findContours`.
    Každý nalezený obrys navíc musí mít dostatečnou **plnost** (poměr
    plochy k ploše jeho konvexního obalu) — tenké klikaté čáry jako žíly
    ve dřevě stolu jsou lokálně tmavší než okolí, a bez tohoto filtru je
    appka omylem počítala jako kusy. Nakonec statistický odhad počtu u
    slepených kusů podle plochy
  - **Rozpoznávání tvarů**: každý nalezený kus se přes `Imgproc.approxPolyDP`
    (zjednodušení obrysu na polygon) a kruhovitost (`4π·plocha/obvod²`)
    zařadí jako trojúhelník, obdélník, lichoběžník nebo kruh. Skutečný
    obrys (ne jen ohraničující obdélník) se vykreslí přímo na fotku/náhled,
    a bez nutnosti cokoliv označit appka rovnou ukáže, kolik je kterého
    tvaru ("Trojúhelník: 2 · Obdélník: 5 · Kruh: 3" — u statické fotky) —
    to je ono "hledání stejných kusů" bez ručního zásahu
  - **Referenční kus**: klepnutím (na fotce i přímo v živém náhledu) lze
    označit jeden konkrétní kus a appka pak přes `Imgproc.matchShapes` (Hu
    momenty — porovnání tvaru nezávislé na velikosti/natočení) plus shodu
    kategorie tvaru počítá jen kusy podobné tomu označenému
  - Živý náhled navíc: zoom (posuvník napojený na kameru) a tlačítko zpět.
    Kamerový snímek (YUV_420_888) se převádí na malou barevnou bitmapu
    přímo z Y/U/V rovin (bez zacházky přes JPEG) a zmenšuje, aby OpenCV
    pipeline stíhal běžet průběžně v hledáčku
- **Čtečka čárových a QR kódů**: kamera přes celou obrazovku (ML Kit
  Barcode Scanning) s ohraničujícím rámečkem uprostřed jako vizuální
  vodítko, zoom (posuvník napojený na `CameraControl.setLinearZoom`),
  přisvícení (baterka, jen když ji zařízení/objektiv má), možnost načíst
  kód i ze statické fotky z galerie místo živé kamery, historie
  naskenovaných kódů v bottom sheetu (odznak s počtem) s možností
  kopírovat, otevřít odkaz, sdílet nebo **uložit jako obrázek** — hodnota
  se přes [ZXing](https://github.com/zxing/zxing) (`com.google.zxing:core`)
  zpětně zakóduje do obrázku (QR i podporované 1D formáty) a uloží se
  přes systémový výběr umístění, ne jen jako sdílený text

Mezi „Skenovat“, „Počítat kusy“ a „Kódy“ se přepíná spodní navigační lištou.

### Struktura projektu

```
app/src/main/java/com/micha741/skener/
├── SkenerApplication.kt     # Application - inicializuje OpenCV (OpenCVLoader.initLocal())
├── MainActivity.kt          # navigace + spuštění ML Kit skeneru/galerie
├── ScanScreen (v MainActivity.kt)
├── ScanViewModel.kt         # stav obrazovky skenování
├── ScanViewModelFactory.kt
├── CountingScreen.kt        # UI obrazovky počítání kusů (obrysy, tvary, tap na referenční kus, tlačítko zpět)
├── CountingViewModel.kt     # stav obrazovky počítání kusů
├── CountingViewModelFactory.kt
├── LiveCameraScreen.kt      # živý náhled kamery: počítání, zoom, tap na referenční kus, tlačítko zpět
├── BarcodeScreen.kt         # fullscreen kamera + zoom/baterka/rámeček + historie v bottom sheetu
├── BarcodeViewModel.kt      # stav obrazovky čtečky kódů
├── CameraPermission.kt      # sdílená logika oprávnění kamery pro obě kamerové obrazovky
├── data/
│   ├── ScanDocument.kt      # model naskenovaného PDF
│   ├── ScanRepository.kt    # ukládání/čtení PDF v app storage
│   ├── DetectedBlob.kt      # sdílený model kusu (box, tvar, obrys) pro fotku i živý náhled
│   ├── ObjectCounter.kt     # počítání kusů ze statické fotky (Uri -> CvBlobAnalyzer, tvary, referenční kus)
│   ├── LiveFrameAnalyzer.kt # CameraX analyzer: YUV -> barevná bitmapa -> CvBlobAnalyzer, nastavitelná reference
│   ├── BarcodeAnalyzer.kt   # CameraX analyzer: živé snímky -> ML Kit Barcode Scanning
│   ├── DocumentTextExtractor.kt # OCR jedné stránky + odhad formátování (velikost/tučné/kurzíva/barva) na řádek
│   ├── TextPdfWriter.kt     # vykreslí rozpoznaný text pozičně/formátovaně do PDF (bez fotky)
│   ├── BarcodeImageEncoder.kt # zpětně zakóduje hodnotu kódu do bitmapy (ZXing) pro uložení jako obrázek
│   └── cv/
│       └── CvBlobAnalyzer.kt # sdílený OpenCV pipeline (fotka i živý náhled): adaptivní práh + barevná
│                              # segmentace, kontury, klasifikace tvaru, matchShapes
└── ui/theme/Theme.kt        # Material 3 theme (light/dark, dynamic color)
```

### Sestavení

1. Otevři kořenovou složku repozitáře v Android Studiu (Koala+).
2. Nech Gradle synchronizovat závislosti (potřebuje internet — Google Maven).
3. Spusť na zařízení/emulátoru s Google Play Services (skener vyžaduje
   Google Play Services App).

Nebo z příkazové řádky:

```
./gradlew assembleDebug
```

Minimální Android verze: **8.0 (API 26)**.
