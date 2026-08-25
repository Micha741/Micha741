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
kusů běží přes [ML Kit Object Detection & Tracking](https://developers.google.com/ml-kit/vision/object-detection),
stejně pro statickou fotku i živý náhled kamery — viz sekce Funkce níže.

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
  (CameraX) běží přes **ML Kit Object Detection & Tracking**
  (`play-services-mlkit-object-detection`, `data/ObjectCounter.kt` a
  `data/LiveFrameAnalyzer.kt`), s vícenásobnou detekcí a hrubou klasifikací
  zapnutou (`enableMultipleObjects()`, `enableClassification()`):
  - Předchozí verze appky měla vlastní OpenCV pipeline (adaptivní práh,
    barevná segmentace, watershed rozdělení slepených kusů, vlastní
    klasifikace tvaru) — na opakovaných reálných fotkách (dřevěný stůl se
    žílami, potištěná látka) se ale pořád znovu ukázalo, že čistě
    kontrastní/barevný heuristický přístup nedokáže spolehlivě odlišit
    "kus" od textury pozadí, ať se ladí sebevíc. ML Kit místo toho používá
    natrénovaný on-device model, který pozná oddělené objekty ve scéně,
    ne jen lokální kontrast — appka tak dostává hotové ohraničující
    obdélníky jednotlivých kusů (ne přesný obrys), ale mnohem
    spolehlivěji oddělené od pozadí i od sebe navzájem
  - **Detekce po dlaždicích** (jen u statické fotky): základní ML Kit model
    je laděný na pár výrazných objektů zabírajících podstatnou část
    záběru — pár drobných kusů rozesetých po velké ploše (semínka na
    podlaze) tak dokázal spojit do jednoho velkého "zajímavého místa"
    místo aby je našel jednotlivě, protože se na žádný kus pořádně
    "nepodíval" zblízka. `ObjectCounter.detectTiled()` proto fotku rozdělí
    na překrývající se mřížku dlaždic (3×3), každou zvětší na stejné
    pracovní rozlišení jako celou fotku předtím (takže drobný kus najednou
    zabírá mnohem větší podíl toho, co detektor vidí) a spustí detekci na
    každé zvlášť. Výsledky z dlaždic se namapují zpět do souřadnic
    původní fotky a přes IoU (překryv boxů) se odstraní duplicity kusů
    zachycených ve více dlaždicích najednou (`deduplicate()`). Živý náhled
    dlaždice nepoužívá — devět detekcí na snímek by pro plynulý hledáček
    bylo příliš pomalé — takže tam funguje jeden průchod na (škrcený)
    snímek jako dřív
  - **Odstranění duplicit mezi dlaždicemi**: kus, co leží na okraji dvou
    dlaždic (nebo je zabraný jednou dlaždicí vcelku a druhou po částech),
    může vyjít z detekce vícekrát. `ObjectCounter.deduplicate()` proto
    porovnává překryv boxů vůči *menšímu* z dvojice (ne vůči jejich
    sjednocení jako klasické IoU) — to pozná i "malý box skoro celý
    uvnitř velkého", což IoU při hodně rozdílné velikosti boxů přehlídne.
    Když se u jednoho velkého boxu najdou dva a víc menších boxů, co se
    vzájemně nepřekrývají (typicky roztroušené drobné kusy jako semínka),
    je velký box vyhozen jako chybné sloučení a zůstanou ty menší,
    samostatné. Když menší boxy uvnitř velkého jsou
    naopak jen navzájem se překrývající duplicity stejného kusu (např.
    "celá bota" a "jen její špička" z různých dlaždic), zůstane jen ten
    největší a zbytek se zahodí
  - **Filtr na rovné hrany**: detektor si občas splete výraznou rovnou
    čáru v pozadí (zárubeň dveří, spára mezi dlaždicemi) se "zajímavým
    objektem". `looksLikeStraightEdge()` proto vyhodí box, který je
    zároveň hodně protáhlý *a* zabírá většinu své vlastní dlaždice (ne
    celé fotky — čára táhnoucí se přes většinu jedné dlaždice by v
    přepočtu na celou fotku byla jen malý zlomek, takže srovnání vůči
    celé fotce by ji nezachytilo). Skutečný kus, byť protáhlý (šroub,
    tužka), takhle velkou část dlaždice málokdy zabírá
  - **Referenční kus**: klepnutím (na fotce i přímo v živém náhledu) lze
    označit jeden konkrétní kus a appka pak počítá jen kusy podobné
    velikosti (v rámci poměru ploch max. 3×) a — pokud má klasifikátor
    jistou hrubou kategorii u obou (např. "Food") — i stejné kategorie.
    Klasifikátor zná jen pár širokých kategorií a u spousty věcí žádnou
    jistou kategorii nevrátí, takže v praxi rozhoduje hlavně velikost
  - **Ruční oprava** (jen u statické fotky): i natrénovaný detektor může
    dva těsně se dotýkající kusy spojit do jednoho, nebo nějaký přehlédnout
    — proto jde výsledek ručně doladit podržením prstu. Podržení na
    nalezeném kusu ho vyřadí ze součtu (zůstane vykreslený šedě, lze ho
    stejným gestem vrátit zpět), podržení na prázdném místě přidá kus
    ručně (zelený kroužek), podržení blízko takto přidaného kroužku ho
    zase odebere. Zobrazený počet (`adjustedCount` v `CountingViewModel`)
    započítává i tyto ruční úpravy; při nové fotce nebo přepnutí reference
    se úpravy vždy vynulují
  - Živý náhled navíc: zoom (posuvník napojený na kameru) a tlačítko zpět.
    Kamerový snímek (YUV_420_888) se převádí na malou barevnou bitmapu
    přímo z Y/U/V rovin (bez zacházky přes JPEG) a zmenšuje, než jde do
    ML Kit detektoru (STREAM_MODE) — stejná logika snímání jako dřív, jen
    jiný krok samotné detekce
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
├── MainActivity.kt          # navigace + spuštění ML Kit skeneru/galerie
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
│   ├── DetectedBlobMatching.kt # sdílené mapování/porovnávání: DetectedObject -> DetectedBlob, hledání pod tapem, referenční shoda podle velikosti/kategorie
│   ├── ObjectCounter.kt     # počítání kusů ze statické fotky přes ML Kit Object Detection (SINGLE_IMAGE_MODE), referenční kus
│   ├── LiveFrameAnalyzer.kt # CameraX analyzer: YUV -> upright bitmapa -> ML Kit Object Detection (STREAM_MODE), nastavitelná reference
│   ├── BarcodeAnalyzer.kt   # CameraX analyzer: živé snímky -> ML Kit Barcode Scanning
│   ├── DocumentTextExtractor.kt # OCR jedné stránky + odhad formátování (velikost/tučné/kurzíva/barva) na řádek
│   ├── TextPdfWriter.kt     # vykreslí rozpoznaný text pozičně/formátovaně do PDF (bez fotky)
│   └── BarcodeImageEncoder.kt # zpětně zakóduje hodnotu kódu do bitmapy (ZXing) pro uložení jako obrázek
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
