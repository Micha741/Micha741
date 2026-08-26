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
kusů ze statické fotky běží přes vlastní na zařízení natrénovaný **FastSAM**
model (TFLite, AGPL-3.0 — viz sekce Funkce níže), živý náhled kamery přes
[ML Kit Object Detection & Tracking](https://developers.google.com/ml-kit/vision/object-detection).

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
- **Počítání kusů** — statická fotka/výběr z galerie běží přes vlastní
  natrénovaný **FastSAM-s** model (`assets/fastsam_s.tflite`,
  `data/fastsam/FastSamDetector.kt`), živý náhled z kamery (CameraX) pořád
  přes **ML Kit Object Detection & Tracking** (`data/LiveFrameAnalyzer.kt`):
  - Appka postupně prošla třemi generacemi segmentace: vlastní OpenCV
    pipeline (adaptivní práh/barva/watershed) na opakovaných reálných
    fotkách (dřevěný stůl se žílami, potištěná látka) pořád znovu
    ukazovala, že čistě kontrastní heuristika nedokáže odlišit "kus" od
    textury pozadí; ML Kit Object Detection to o dost zlepšil, ale jako
    natrénovaný jen na pár širokých kategorií (jídlo/oblečení/rostlina...)
    měl problém s neznámými/drobnými/těsně u sebe naskládanými kusy.
    **FastSAM** je jiný typ modelu — *class-agnostic* "segment everything":
    neptá se "co to je", jen hledá každou opticky oddělenou oblast ve
    scéně, což je přesně to, co potřebuje appka na počítání "čehokoliv"
  - Model je exportovaná varianta FastSAM-s (postavená na architektuře
    YOLOv8-seg, checkpoint CASIA-IVA-Lab/Ultralytics) do TFLite, běží
    přímo na zařízení (`org.tensorflow:tensorflow-lite`), offline, zdarma.
    Vstup má pevných 320×320 px — fotka se před vložením do modelu
    "letterboxuje" (zmenší se zachováním poměru stran a dorovná šedou
    barvou na čtverec), aby se nezdeformovala. Appka zatím čte jen
    hlavu s obdélníky a skóre (37 kanálů na kotvu × 2100 kotev = 4 souřadnice
    + 1 skóre + 32 koeficientů masky, z nichž se koeficienty zatím
    nevyužívají) a spustí přes ně vlastní NMS (potlačení překrývajících
    se duplicit podle skóre) — appka tedy zatím kreslí obdélníky, ne
    přesné obrysy, i když by je model uměl dát (výstup masek [1,32,80,80]
    v modelu je, jen se zatím nezpracovává)
  - **Licence**: FastSAM i nástroje použité k exportu jsou pod AGPL-3.0
    (text v `/third_party_licenses/FastSAM_AGPL-3.0_LICENSE.txt`) — tahle
    licence je "nakažlivá": pokud appku někomu distribuuješ (i zdarma),
    zavazuje tě to zveřejnit celý zdrojový kód appky pod stejnou licencí.
    Repozitář je už veřejný, takže to prakticky nic nemění, ale je dobré
    o tom vědět
  - **Filtr na rovné hrany**: dřívější testování (ještě s ML Kitem)
    ukázalo, že detektor dokáže splést výraznou rovnou čáru v pozadí
    (zárubeň dveří, spára mezi dlaždicemi) se "zajímavým objektem".
    `looksLikeStraightEdge()` proto vyhodí box, který je zároveň hodně
    protáhlý *a* zabírá většinu celé fotky — skutečný kus, byť protáhlý
    (šroub, tužka), takhle velkou část záběru málokdy zabírá
  - **Odmítnutí velikostních odlehlých hodnot** (jen automatický režim bez
    referenčního kusu): dotýkající se kusy občas nechají mezi sebou
    "ducha" — malý falešný box v mezeře mezi nimi (odraz světla, kousek
    pozadí), který model vlastní NMS nezachytí, protože se dost
    nepřekrývá ani s jedním ze skutečných kusů. `rejectSizeOutliers()`
    proto (při alespoň 3 nalezených kusech) spočítá medián velikosti
    všech nalezených boxů a vyhodí ty, co jsou výrazně menší (pod
    čtvrtinu mediánu) — když appka počítá víc kusů stejné věci, měly by
    mít podobnou velikost
  - **Referenční kus**: klepnutím na fotce lze označit jeden konkrétní kus
    a appka pak počítá jen kusy podobné velikosti (v rámci poměru ploch
    max. 3×) — FastSAM na rozdíl od ML Kitu nedává žádnou kategorii/štítek
    (je "class-agnostic"), takže tady rozhoduje čistě velikost
  - **Ruční oprava** (jen u statické fotky): i natrénovaný detektor může
    dva těsně se dotýkající kusy spojit do jednoho, nebo nějaký přehlédnout
    — proto jde výsledek ručně doladit podržením prstu. Podržení na
    nalezeném kusu ho vyřadí ze součtu (zůstane vykreslený šedě, lze ho
    stejným gestem vrátit zpět), podržení na prázdném místě přidá kus
    ručně (zelený kroužek), podržení blízko takto přidaného kroužku ho
    zase odebere. Zobrazený počet (`adjustedCount` v `CountingViewModel`)
    započítává i tyto ruční úpravy; při nové fotce nebo přepnutí reference
    se úpravy vždy vynulují
  - **Živý náhled zůstává na ML Kitu** (`enableMultipleObjects()`,
    `enableClassification()`, `STREAM_MODE`), s referenčním kusem
    (klepnutím na kus v hledáčku), zoomem a stejným zpracováním kamerového
    snímku (YUV_420_888 → malá barevná bitmapa přímo z Y/U/V rovin) jako
    dřív. FastSAM tam zatím neběží — jeden běh modelu na fotku je v
    pořádku, ale běžet znovu a znovu na každý snímek hledáčku (řádově
    4× za sekundu) by na běžném telefonu bez zrychlení přes GPU/NPU
    delegáta bylo příliš pomalé pro plynulý náhled
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
├── SkenerApplication.kt     # zachytává neošetřené pády do souboru v cache (last_crash.txt) - appka se instaluje ze staženého APK, ne přes USB/Logcat
├── MainActivity.kt          # navigace + spuštění ML Kit skeneru/galerie; při startu nabídne sdílení pádu z minula, pokud existuje
├── ScanScreen (v MainActivity.kt)
├── ScanViewModel.kt         # stav obrazovky skenování
├── ScanViewModelFactory.kt
├── CountingScreen.kt        # UI obrazovky počítání kusů (obdélníky, tap na referenční kus, ruční oprava, tlačítko zpět)
├── CountingViewModel.kt     # stav obrazovky počítání kusů
├── CountingViewModelFactory.kt
├── LiveCameraScreen.kt      # živý náhled kamery: počítání, zoom, tap na referenční kus, tlačítko zpět
├── BarcodeScreen.kt         # fullscreen kamera + zoom/baterka/rámeček + historie v bottom sheetu
├── BarcodeViewModel.kt      # stav obrazovky čtečky kódů
├── CameraPermission.kt      # sdílená logika oprávnění kamery pro obě kamerové obrazovky
├── data/
│   ├── ScanDocument.kt      # model naskenovaného PDF
│   ├── ScanRepository.kt    # ukládání/čtení PDF v app storage
│   ├── DetectedBlob.kt      # sdílený model kusu (box, kategorie) pro fotku i živý náhled
│   ├── DetectedBlobMatching.kt # sdílené mapování/porovnávání: hledání pod tapem, referenční shoda podle velikosti/kategorie
│   ├── ObjectCounter.kt     # počítání kusů ze statické fotky přes FastSamDetector, filtry, referenční kus
│   ├── fastsam/
│   │   └── FastSamDetector.kt # TFLite inference nad fastsam_s.tflite: letterbox, dekódování boxů, NMS
│   ├── LiveFrameAnalyzer.kt # CameraX analyzer: YUV -> upright bitmapa -> ML Kit Object Detection (STREAM_MODE), nastavitelná reference
│   ├── BarcodeAnalyzer.kt   # CameraX analyzer: živé snímky -> ML Kit Barcode Scanning
│   ├── DocumentTextExtractor.kt # OCR jedné stránky + odhad formátování (velikost/tučné/kurzíva/barva) na řádek
│   ├── TextPdfWriter.kt     # vykreslí rozpoznaný text pozičně/formátovaně do PDF (bez fotky)
│   └── BarcodeImageEncoder.kt # zpětně zakóduje hodnotu kódu do bitmapy (ZXing) pro uložení jako obrázek
├── assets/
│   └── fastsam_s.tflite     # FastSAM-s model (~45 MB, AGPL-3.0) pro počítání kusů ze statické fotky
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
