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
kusů má vlastní obrazovou analýzu (OpenCV + lehký Kotlin pipeline pro živý
náhled) — viz sekce Funkce níže.

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
- **Počítání kusů**:
  - Statická fotka/výběr z galerie — segmentace přes **OpenCV**
    (`org.opencv:opencv`): Gaussovo rozostření, adaptivní prahování podle
    klouzavého průměru jasu (`Imgproc.adaptiveThreshold`, funguje i při
    nerovnoměrném osvětlení/stínech na fotce, na rozdíl od jednoho
    globálního prahu), morfologické operace, `findContours`, statistický
    odhad počtu u slepených kusů podle plochy
  - **Rozpoznávání tvarů**: každý nalezený kus se přes `Imgproc.approxPolyDP`
    (zjednodušení obrysu na polygon) a kruhovitost (`4π·plocha/obvod²`)
    zařadí jako trojúhelník, obdélník, lichoběžník nebo kruh. Skutečný
    obrys (ne jen ohraničující obdélník) se vykreslí přímo na fotku, a bez
    nutnosti cokoliv označit appka rovnou ukáže, kolik je na fotce kterého
    tvaru ("Trojúhelník: 2 · Obdélník: 5 · Kruh: 3") — to je ono
    "hledání stejných kusů" bez ručního zásahu
  - **Referenční kus**: u statické fotky lze klepnutím označit jeden
    konkrétní kus a appka pak přes `Imgproc.matchShapes` (Hu momenty —
    porovnání tvaru nezávislé na velikosti/natočení) plus shodu kategorie
    tvaru spočítá jen kusy podobného tvaru tomu označenému — užitečné když
    je na fotce víc druhů věcí najednou
  - **Živý náhled** z kamery (CameraX) s průběžným počítáním přímo v
    hledáčku — kvůli rychlosti (desítky snímků/s) běží dál na vlastním
    lehkém Kotlin pipeline bez OpenCV (Sobelova hranová detekce, Otsuovo
    prahování, spojité komponenty; klasifikace tvarů tam není, jen v
    statické fotce). Nově i tady jde klepnutím na kus přímo v hledáčku
    nastavit referenční tvar (počítají se pak jen podobné kusy podle
    velikosti/tvaru), zoom (posuvník napojený na kameru) a tlačítko zpět
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
│   ├── BlobAnalyzer.kt      # lehký Kotlin algoritmus pro živý náhled (hranová detekce + matematická analýza)
│   ├── ObjectCounter.kt     # počítání kusů ze statické fotky (Uri -> CvBlobAnalyzer, tvary, referenční kus)
│   ├── LiveFrameAnalyzer.kt # CameraX analyzer: živé snímky -> BlobAnalyzer, nastavitelná reference
│   ├── BarcodeAnalyzer.kt   # CameraX analyzer: živé snímky -> ML Kit Barcode Scanning
│   ├── DocumentTextExtractor.kt # OCR jedné stránky + odhad formátování (velikost/tučné/kurzíva/barva) na řádek
│   ├── TextPdfWriter.kt     # vykreslí rozpoznaný text pozičně/formátovaně do PDF (bez fotky)
│   ├── BarcodeImageEncoder.kt # zpětně zakóduje hodnotu kódu do bitmapy (ZXing) pro uložení jako obrázek
│   └── cv/
│       └── CvBlobAnalyzer.kt # OpenCV pipeline pro statickou fotku: adaptivní threshold, kontury, matchShapes
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
