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
- Seznam uložených skenů (počet stránek, datum)
- Sdílení PDF přes systémový share sheet
- Smazání skenu

### Struktura projektu

```
app/src/main/java/com/micha741/skener/
├── MainActivity.kt          # Compose UI + spuštění ML Kit skeneru
├── ScanViewModel.kt         # stav obrazovky
├── ScanViewModelFactory.kt
├── data/
│   ├── ScanDocument.kt      # model naskenovaného PDF
│   └── ScanRepository.kt    # ukládání/čtení PDF v app storage
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
