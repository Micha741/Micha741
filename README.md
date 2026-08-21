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
Skenování je postavené na [ML Kit Document Scanner API](https://developers.google.com/ml-kit/vision/doc-scanner),
takže detekce hran, korekce perspektivy, filtry a víc­stránkové skeny fungují
bez vlastního OpenCV kódu.

### Funkce

- Skenování dokumentu kamerou (nebo import z galerie) s automatickou detekcí
  hran a oříznutím
- Víc stránek v jednom skenu, export do PDF
- **Dva režimy skenu**: klasický obrázkový PDF (naskenovaná stránka jako
  fotka), nebo čistě textový PDF — appka přes stránky spustí OCR (ML Kit
  Text Recognition) a vygeneruje PDF jen s rozpoznaným textem, bez fotky
- Seznam uložených skenů (počet stránek, datum)
- Sdílení PDF přes systémový share sheet
- **Uložení do zařízení** — systémový výběr umístění (Storage Access
  Framework), takže PDF jde uložit třeba do Stažených souborů, na Disk
  nebo SD kartu, mimo interní úložiště appky
- Smazání skenu
- **Počítání kusů**: živý náhled z kamery (CameraX) s průběžnou detekcí a
  počítáním kusů přímo v hledáčku, nebo statická fotka/výběr z galerie —
  vlastní obrazový pipeline (Sobelova hranová detekce, Otsuovo prahování
  jako matematická analýza histogramu jasu, spojité komponenty a statistický
  odhad počtu u slepených kusů podle plochy), žádná externí ML služba
- **Čtečka čárových a QR kódů**: živý náhled z kamery s průběžným čtením
  (ML Kit Barcode Scanning), historie naskenovaných kódů v rámci relace
  s možností kopírovat, otevřít odkaz nebo sdílet

Mezi „Skenovat“, „Počítat kusy“ a „Kódy“ se přepíná spodní navigační lištou.

### Struktura projektu

```
app/src/main/java/com/micha741/skener/
├── MainActivity.kt          # navigace + spuštění ML Kit skeneru/galerie
├── ScanScreen (v MainActivity.kt)
├── ScanViewModel.kt         # stav obrazovky skenování
├── ScanViewModelFactory.kt
├── CountingScreen.kt        # UI obrazovky počítání kusů (výsledná fotka + rámečky)
├── CountingViewModel.kt     # stav obrazovky počítání kusů
├── CountingViewModelFactory.kt
├── LiveCameraScreen.kt      # živý náhled kamery (CameraX) s průběžným počítáním
├── BarcodeScreen.kt         # živý náhled kamery + historie naskenovaných kódů
├── BarcodeViewModel.kt      # stav obrazovky čtečky kódů
├── CameraPermission.kt      # sdílená logika oprávnění kamery pro obě kamerové obrazovky
├── data/
│   ├── ScanDocument.kt      # model naskenovaného PDF
│   ├── ScanRepository.kt    # ukládání/čtení PDF v app storage
│   ├── BlobAnalyzer.kt      # sdílený algoritmus: hranová detekce + matematická analýza
│   ├── ObjectCounter.kt     # počítání kusů ze statické fotky (Uri -> BlobAnalyzer)
│   ├── LiveFrameAnalyzer.kt # CameraX analyzer: živé snímky -> BlobAnalyzer
│   ├── BarcodeAnalyzer.kt   # CameraX analyzer: živé snímky -> ML Kit Barcode Scanning
│   ├── DocumentTextExtractor.kt # OCR jedné stránky (ML Kit Text Recognition)
│   └── TextPdfWriter.kt     # vykreslí rozpoznaný text do PDF (bez fotky)
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
