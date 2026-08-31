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
kusů — statická fotka i živý náhled kamery — běží přes vlastní na zařízení
natrénovaný **FastSAM** model (TFLite, AGPL-3.0 — viz sekce Funkce níže).

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
  (CameraX) běží přes vlastní natrénovaný **FastSAM-s** model
  (`assets/fastsam_s.tflite`, `data/fastsam/FastSamDetector.kt`,
  volaný z `data/ObjectCounter.kt` pro fotku a `data/LiveFrameAnalyzer.kt`
  pro živý náhled):
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
    v modelu je, jen se zatím nezpracovává). `FastSamDetector.nonMaxSuppression()`
    porovnává překryv boxů vůči *menšímu* z dvojice, ne klasickým IoU vůči
    jejich sjednocení — u prohnutého/protáhlého shluku (trs banánů) totiž
    klasické IoU mezi boxem kolem jednoho banánu a boxem kolem několika
    banánů vyjde nízké (dominuje ho plocha toho většího), i když jde o
    stejnou věc — to se na zařízení projevilo jako víc překrývajících se
    boxů na jednom shluku ovoce
  - **Více průchodů modelu na jednu fotku (dlaždice)**: `FastSamDetector.detect()`
    nespouští interpreter jen jednou na celou fotku, ale na pěti
    překrývajících se výřezech — celá fotka plus čtyři výřezy po 75 %
    šířky/výšky pokrývající její rohy (`tileRegions()`). Důvod: model má
    pořád stejný pevný vstup 320×320 bez ohledu na to, jak velkou fotku mu
    appka dá, takže na fotce s hodně malými/hustě natěsnanými kusy (listí
    na větvi, hromádka šroubků) se spousta z nich do jednoho zmenšeného
    záběru vejde jen jako pár pixelů a nepřekročí práh jistoty. Detekce po
    výřezech dá každé oblasti víc efektivního rozlišení. Duplicitní boxy,
    které tím vzniknou na švech mezi výřezy (nebo mezi výřezem a
    celofotkovým průchodem, když najdou stejný větší objekt), se
    odstraní druhým, křížovým NMS průchodem (`mergeOverlapping()`) přes
    boxy už přepočítané do sdílených souřadnic celé fotky — stejný
    containment test jako `nonMaxSuppression()` výše. Ověřeno na
    syntetických testovacích scénách přes reálný `.tflite` model (ne jen
    předpoklad): dlaždice najdou o pár menších kusů víc, beze změny na
    už správně odděleném ovoci
  - **Bug (opraveno)**: `detect()` po zavedení dlaždic vůbec nic nenašlo -
    appka na fotce ukázala jen krátce probliknutou chybovou hlášku a žádné
    boxy ani počet. Příčina byl `Bitmap.createBitmap(zdroj, x, y, š, v)`:
    když se požadovaný výřez rozměrově přesně kryje se zdrojovou bitmapou
    (což první, celofotkový "výřez" v `tileRegions()` vždycky splňuje),
    Android vrátí *tu samou instanci* zdrojové bitmapy, ne kopii. Kód pak
    po zpracování tohohle "výřezu" zavolal `tile.recycle()` a tím omylem
    recykloval originální bitmapu volajícího - každý další výřez pak
    padal na `Bitmap.createBitmap()` ze už recyklované bitmapy. Oprava:
    recyklovat výřez, jen když `tile !== bitmap`, tedy jen když
    `createBitmap()` opravdu vytvořil kopii
  - **Bug (opraveno)**: protáhlý kus (šroub) položený tak, že jeho délka
    přesahovala přes hranici mezi dvěma výřezy, se počítal dvakrát —
    reálně reprodukováno a potvrzeno přímo na fotkách (přesné souřadnice
    boxů rozebrané pixel po pixelu): žádný jednotlivý výřez neviděl celý
    kus, každý jen jeho útržek (hlavu, nebo kus závitu), a protože se
    tyhle útržky mezi sebou vůbec nepřekrývaly, `mergeOverlapping()` je
    neměl jak poznat jako jeden kus — ten test totiž funguje jen na
    překryv, ne na "leží v prodloužení". Otočení stejného kusu do jiné
    osy problém nezmizelo, jen přesunulo, na kterou hranici výřezu
    narazí. Zkoušel jsem i heuristiku slučující blízké útržky podle
    barvy/jasu spáry mezi nimi, ale na reálných datech nespolehlivě
    rozeznávala "jeden protažený kus" od "dva různé kusy položené blízko
    sebe" (falešně by slila i washer s vedlejším šroubem, `boxNumbers`
    pomohly přesně identifikovat, který pár byl který) — bezpečnější
    oprava je nedopustit, aby se kus takhle přeřízl vůbec: `TILE_FRACTION`
    zvednuté z 60 % na 75 % zvětší překryv mezi výřezy natolik, že by se
    takhle musel přeříznout kus širší než zhruba polovina šířky/výšky
    celé fotky, což žádný počítaný kus reálně není
  - **Univerzální = počítá skutečně cokoliv, ne jen to, co má na fotce
    fotograf na mysli**: FastSAM nerozlišuje kategorie, takže v
    automatickém režimu (bez klepnutí na referenční kus) spočítá úplně
    všechno opticky oddělené v záběru — i roh linky, sušák nádobí nebo
    láhev v pozadí, ne jen ovoce v míse. To není chyba k opravě, je to
    přesně to, co "univerzální" počítání znamená; pro počítání jen
    konkrétní věci (jen ovoce, ne pozadí) slouží **referenční kus** —
    klepnutím na jeden kus appka omezí počítání na podobně velké kusy
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
    a appka pak počítá jen podobné kusy — podobné velikostí (v rámci poměru
    ploch max. 3×) *a* podobné barvou. FastSAM na rozdíl od ML Kitu nedává
    žádnou kategorii/štítek (je "class-agnostic"), takže samotná velikost
    nestačí rozeznat např. švestku od podobně velkého listu na stejném
    stromě — appka proto porovnává i **odstín (hue)**, ne přímou RGB
    vzdálenost — švestka a list
    mají hodně rozdílný odstín (fialová vs. zelená), ale RGB vzdálenost mezi
    nimi kolísá podle osvětlení/stínu natolik, že by je přímé srovnání barev
    často zaměnilo (ověřeno na syntetické scéně přes reálný model: RGB
    vzdálenost propustila spoustu listů, odstín správně nechal jen švestky).
    Barva se použije jen když má smysl — u nízko sytých/šedivých kusů
    (`matchesHue()`) se přeskočí, stejně jako se štítek přeskočí, když ho
    aspoň jedna strana nemá. I barva ale narazí na svůj limit, když má kus
    skoro stejný odstín jako to, na čem leží (krémový česnek na světlém
    dřevěném parketu — obojí vyjde jako nízko sytá téměř stejná béžová) —
    pro přesně tenhle případ slouží oblast zájmu níž
  - **Barva se vzorkuje podle masky, ne podle celého boxu**: FastSAM kromě
    boxu a jistoty vrací i 32 koeficientů masky a společnou prototypovou
    mřížku 80×80 (`[1,32,80,80]`) — appka je dřív zahazovala a barvu brala
    jako průměr přes celý obdélník. U kulatého nebo šikmo položeného kusu
    ale roh čtvercového/obdélníkového boxu skoro vždycky patří pozadí, ne
    kusu, takže to zbytečně kazilo přesnost barevného porovnání.
    `FastSamDetector.maskAverageColor()` teď pro každou nalezenou věc
    spočítá její vlastní masku (`sigmoid(koeficienty · prototyp)`, stejný
    přepočet zpět přes letterbox jako u boxu) a zprůměruje jen pixely pod
    ní — méně "kontaminace" pozadím, přesnější odstín pro porovnání
    referenčního kusu. Ověřeno přímo na reálném modelu (vykreslení masky
    přes syntetickou scénu sedělo na tvar objektů, ne na jejich boxy)
  - **Varování na podezřele velký kus** (jen automatický režim bez
    referenčního kusu): `hasSuspiciouslyLargeBlob()` po odečtení
    velikostních odlehlých hodnot zkontroluje, jestli není některý
    nalezený box přes trojnásobek mediánové velikosti ostatních — u
    počítání "více kusů stejné věci" by měly být si podobné velikostí, a
    výrazně větší box bývá ve skutečnosti víc dotýkajících se kusů, které
    FastSAM slil do jednoho (přesně tenhle problém appku na začátku
    přivedl k oblasti zájmu). Appka to nijak sama neopravuje — nedá se
    spolehlivě poznat, kolik kusů se v tom velkém boxu vlastně skrývá —
    jen zobrazí hlášku, ať kusy uživatel rozestrčí a vyfotí znovu (na
    fotce pod počtem, v živém náhledu jako další odznak)
  - **Oblast zájmu**: tlačítkem "Vybrat oblast" appka přepne fotku do režimu
    přetažení obdélníku (`detectDragGestures` místo klepání/podržení) — vše
    mimo vybraný obdélník se zahodí ještě před referenčním/velikostním
    filtrováním, ne až po něm. To řeší přesně to, co barva ani velikost
    samy nezvládnou: falešné detekce na pozadí (kresba dřeva, textura
    koberce) stejné velikosti *a* barvy jako počítané kusy, jen jinde na
    fotce — oblast zájmu je stáhne pryč čistě podle polohy, bez ohledu na
    to, jak moc se pozadí kusům podobá. Jde kombinovat s referenčním kusem
    (klepnutí na kus uvnitř vybrané oblasti) i použít samostatně; výběr
    nové oblasti zruší dosavadní referenční kus (může být mimo nový výřez).
    Souřadnice oblasti jsou zlomkové (0f..1f na každé hraně, ne pixely) -
    díky tomu appka umí přenést oblast vybranou v živém náhledu (malý
    zmenšený snímek) na plnou vyfocenou fotku (úplně jiné rozlišení): oběma
    stačí rozumět si v "kolik procent šířky/výšky", ne v přesných pixelech.
    Tlačítko spouště v `LiveCameraScreen` proto při focení pošle aktuálně
    vybranou oblast dál (`onPhotoCaptured(uri, roi)` →
    `CountingViewModel.onPhotoSelected(uri, roi)`), takže oblast vybraná a
    už fungující v živém náhledu nemusí jít vybírat znovu na výsledné fotce
  - **Ruční oprava** (jen u statické fotky): i natrénovaný detektor může
    dva těsně se dotýkající kusy spojit do jednoho, nebo nějaký přehlédnout
    — proto jde výsledek ručně doladit podržením prstu. Podržení na
    nalezeném kusu ho vyřadí ze součtu (zůstane vykreslený šedě, lze ho
    stejným gestem vrátit zpět), podržení na prázdném místě přidá kus
    ručně (zelený kroužek), podržení blízko takto přidaného kroužku ho
    zase odebere. Zobrazený počet (`adjustedCount` v `CountingViewModel`)
    započítává i tyto ruční úpravy; při nové fotce nebo přepnutí reference
    se úpravy vždy vynulují
  - **Číslování napočítaných kusů**: každý box (statická fotka i uložený
    obrázek) má uprostřed horního okraje bílé číslo — pořadí odpovídá přesně
    tomu, co appka počítá do zobrazeného počtu (`adjustedCount`): vyřazené
    kusy číslo nemají, ručně přidané zelené kroužky pokračují v číslování
    hned za detekovanými kusy. Usnadňuje to ověřit si výsledek pohledem
    (spočítat si čísla na fotce) a přesně vidět, kde appka rozdělila jeden
    kus na víc boxů nebo naopak
  - **Uložení výsledku jako obrázek**: ikona uložení v horní liště (viditelná,
    jen když appka má nějaký výsledek) vezme aktuální fotku, do kopie
    (`CountingResultEncoder.encode()`, `android.graphics.Canvas`/`Paint`, ne
    zachycení Compose obrazovky) dokreslí přesně to, co appka ukazuje na
    displeji — barevné boxy (včetně vyřazených šedě a referenčního žlutě),
    zelené kroužky ručně přidaných kusů a pruh s počtem dole — a přes
    systémový výběr umístění (`ActivityResultContracts.CreateDocument`,
    stejný vzor jako uložení PDF/kódu) ho uloží jako PNG. Tloušťky čar a
    velikost kroužků/textu se počítají relativně k rozlišení *fotky* (ne
    pevné konstanty z náhledu na displeji), aby na uloženém víc-megapixelovém
    obrázku nebyly vlásečnicové
  - **Nahlásit problém / Podezření**: appka nemá žádné učení ani zpětnou
    vazbu do detekce — je to pevně daný model, takže "appka si zapamatuje
    tenhle konkrétní zámek" reálně neznamená, že si zapamatuje *ten
    zámek* (žádné rozpoznávání konkrétních objektů), jen že si uživatel
    poznamená, co bylo špatně. Ikonka vlaječky v horní liště (vedle
    uložení, viditelná jen s výsledkem) otevře dialog na krátkou
    poznámku ("tohle nejsou 2 kusy") a uloží stejně vykreslený obrázek
    jako `count_save` (`CountingResultEncoder.encode()`, sdílené přes
    novou `encodeResult()` v `CountingViewModel`) do
    `SuspicionRepository` — dvojice `.png` + `.txt` se stejným
    časovým razítkem ve `files/suspicions/`, stejný souborový vzor jako
    `ScanRepository` u PDF (žádná databáze navíc). Ikonka historie vedle
    ní vede na novou obrazovku **Podezření** (`SuspicionsScreen.kt`,
    vlastní `SuspicionsViewModel`) se seznamem uložených nahlášení
    (náhled, poznámka, datum, smazání) — čistě osobní deník k
    dohledání, appka ho sama nijak nepoužívá při dalším počítání
  - **Fotka přes celou šířku obrazovky**: `CountingScreen.kt` dřív měl kolem
    fotky pevných 16dp okrajů a pod ní samostatné řádky nápovědy (klepni na
    kus / podrž prst) a až pod nimi výsledek — na menší obrazovce to fotce
    ubíralo dost místa. Okraje jsou pryč, fotka jde teď přes celou šířku a
    počet ("Napočítáno: X ks") se vykresluje jako poloprůhledný pruh přes
    spodní okraj fotky samotné, ne jako text pod ní - nápovědové řádky byly
    odstraněné úplně. Sloupec s tlačítky pod fotkou (výběr oblasti,
    referenční kus, nová fotka) je navíc přes `verticalScroll` posuvný - s
    přibývajícím počtem tlačítek by se poslední z nich na menších
    obrazovkách jinak schoval pod spodní navigační lištu, nedosažitelný
  - **Spodní navigační lišta (Skenovat/Počítat kusy/Kódy) zmizí, jakmile má
    obrazovka počítání načtenou fotku** (`AppScaffold` v `MainActivity.kt`
    sleduje `CountingViewModel.uiState.photoUri`, stejně jako už dřív mizela
    na `live_count`/`suspicions`) — přetažení obdélníku výběru oblasti na
    velké fotce z galerie potřebuje co nejvíc svislého prostoru, a těch
    ~80dp lišty navíc dělalo přesné trefení rohů obdélníku zbytečně těžké.
    Návrat zpět (šipka v horní liště, `viewModel.reset()`) lištu vrátí
  - **Živý náhled na FastSAM taky (dřív na ML Kitu)**: appka dřív pro živý
    náhled kamery používala ML Kit Object Detection & Tracking (levnější,
    ale natrénovaný jen na pár širokých kategorií). Reálné testování na
    zařízení ukázalo přesně tu slabinu, kvůli které FastSAM nahradil ML
    Kit i u statické fotky: stejná fotka pěti k sobě přitisknutých
    stroužků česneku appka spočítala správně přes FastSAM (fotka), ale v
    živém náhledu (tehdy ML Kit) z nich pořád dělal jeden slitý box.
    `LiveFrameAnalyzer` teď volá stejný `FastSamDetector` jako
    `ObjectCounter`, se stejnými filtry (`looksLikeStraightEdge()`,
    `rejectSizeOutliers()`, barevné porovnání odstínu u referenčního kusu
    — sdílené v `DetectedBlobFilters.kt`/`DetectedBlobMatching.kt`). Živý
    snímek se zmenšuje na 300 px (`MAX_DIMENSION`) — blízko modelovému
    pevnému vstupu 320×320 a pod prahem pro dlaždice (`MIN_DIMENSION_FOR_TILING`
    = 400), takže na snímek běží jen jeden průchod modelu, ne pět jako u
    velké vyfocené fotky. Interpreter se navíc (na rozdíl od ML Kitova
    klienta, který se ukázal nestabilní při opakovaném použití — nativní
    pád uvnitř `libmlkitcommonpipeline.so`) bezpečně volá opakovaně z
    jednoho vlákna (`analysisExecutor`, jak CameraX `Analyzer` volá
    `analyze()` sériově) — appka ho tedy postaví líně jednou a drží po
    celou dobu náhledu, zavře až v `release()`. Aby se `release()` (zavře
    TFLite interpreter) nespustil, zatímco `analyze()` na tom samém
    interpreteru zrovna běží, `LiveCameraScreen` před ním počká na
    doběhnutí fronty (`analysisExecutor.awaitTermination()`)
  - **Oblast zájmu i v živém náhledu**: stejné gesto přetažení jako u
    fotky (`LiveFrameAnalyzer.setRoi()`) — zahodí detekce mimo vybraný
    obdélník ještě před referenčním filtrováním. Jde vybrat v libovolném
    pořadí s referenčním kusem: nejdřív oblast a pak klepnutím referenci
    uvnitř ní, nebo naopak — referenční klepnutí se vždy vyhodnocuje už
    proti snímkům omezeným na aktuální oblast zájmu, takže obě pořadí
    fungují stejně. Oblast je zlomková (0f..1f), přepočítaná na aktuální
    snímek čerstvě při každém `analyze()` volání, ne jednou dopředu -
    stejný důvod jako u fotky výše
  - **Oblast zájmu přenesená z náhledu do vyfocené fotky**: appka dřív po
    vyfocení z živého náhledu vždycky spustila počítání nanovo na celé
    fotce, i když byla v náhledu vybraná oblast — na fotce se tak objevily
    i falešné detekce z pozadí, které oblast v náhledu už úspěšně
    odstínila (např. 6 stroužků česneku správně v náhledu, ale 13 kusů po
    vyfocení, dokud se oblast nevybrala znovu). Tlačítko spouště teď
    aktuálně vybranou (zlomkovou) oblast pošle spolu s fotkou
    (`onPhotoCaptured(uri, roi)` → `CountingViewModel.onPhotoSelected(uri, roi)`),
    takže se převezme rovnou a není potřeba ji na výsledné fotce
    vybírat znovu
  - **Rozpoznání mřížky, dočasně vypnuté** (`GridDetector.kt`,
    `subdivideGrids()`): záměr byl, že appka na každý nalezený box (fotka i
    živý snímek) zkusí `GridDetector.subdivide()` — sečte "tmavost" pixelů po
    sloupcích a po řádcích do dvou 1D profilů, najde dominantní periodu
    normalizovanou autokorelací (potvrzenou i na dvoj- a trojnásobku periody,
    aby se to nespletlo s obyčejnou texturou) a podél ní box rozseká na
    mřížku, když v ní najde pravidelně se opakující tmavé špičky (spáry mezi
    dlaždicemi, mezery mezi klávesami). Fungovalo to na syntetických testech
    (klávesnice, textury dřeva) i na reálné klávesnici, ale na reálném testu
    s česnekem se ukázalo, že papírová slupka stroužku má dost pravidelné
    proužkování na to, aby přes stejnou kontrolu prošla taky — appka pak
    jeden stroužek rozsekala na desítky tenkých pásků a napočítala jich
    desetinásobek skutečného počtu. Kód (`ObjectCounter`/`LiveFrameAnalyzer`
    ho volaly stejně jako oblast zájmu) zůstává v projektu, ale žádné volání
    ho teď nepoužívá — bezpečnější pro běžné počítání kusů, dokud nebude buď
    přísnější, nebo zapínatelné jen když si o něj uživatel řekne
  - **Automatický výběr oblasti zájmu** (`RoiSuggester.kt`): tlačítko "Najít
    oblast automaticky" vedle ručního výběru (fotka i živý náhled) spustí
    detekci na celé fotce/snímku a shluky k sobě blízkých kusů spojí přes
    union-find — dva kusy patří do stejného shluku, když vzdálenost jejich
    středů nepřekročí 1,5násobek jejich průměrné úhlopříčky. Ohraničující box
    největšího shluku (s 8% okrajem) se nastaví jako oblast zájmu stejně,
    jako by ji appka dostala z ručního přetažení — řeší stejný případ jako
    ruční oblast (kusy stejné velikosti/barvy jako pozadí, jen jinde na
    fotce), bez nutnosti je sám obtahovat. Když appka nenajde dost velký
    shluk (méně než 3 kusy), ukáže hlášku a nechá výběr na ručním tlačítku.
    V živém náhledu tlačítko běží nad posledním analyzovaným snímkem
    (`LiveFrameAnalyzer.suggestRoiFromLastFrame()`) ještě před filtrováním
    podle aktuální oblasti/reference, stejně jako u fotky
    (`ObjectCounter.suggestRoi()`)
  - **Oblast zájmu podle plochy kusu, ne jen jeho středu**: filtrování podle
    oblasti dřív kontrolovalo jen to, jestli **střed** nalezeného boxu leží
    uvnitř vybraného obdélníku (`Rect.contains(centerX, centerY)`) — box
    samotný ale mohl sahat daleko mimo ni a pořád se započítal celý. V husté
    hromadě dotýkajících se kusů (šrouby v krabičce) FastSAM občas spojí
    několik z nich do jednoho velkého blobu; když se jeho střed trefil do
    vybrané oblasti, appka ho vzala celý, i když z většiny ležel mimo ni —
    hlášeno přímo jako "kus větší než výběr". `overlapsRoiEnough()`
    (`DetectedBlobFilters.kt`, sdílené fotkou i živým náhledem) místo toho
    počítá, kolik procent plochy boxu leží uvnitř oblasti, a box zahodí, když
    je to méně než polovina
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
├── SuspicionsScreen.kt      # seznam nahlášených "podezřelých" výsledků počítání (náhled, poznámka, smazání)
├── SuspicionsViewModel.kt   # stav obrazovky Podezření
├── SuspicionsViewModelFactory.kt
├── LiveCameraScreen.kt      # živý náhled kamery: počítání, zoom, tap na referenční kus, tlačítko zpět
├── BarcodeScreen.kt         # fullscreen kamera + zoom/baterka/rámeček + historie v bottom sheetu
├── BarcodeViewModel.kt      # stav obrazovky čtečky kódů
├── CameraPermission.kt      # sdílená logika oprávnění kamery pro obě kamerové obrazovky
├── data/
│   ├── ScanDocument.kt      # model naskenovaného PDF
│   ├── ScanRepository.kt    # ukládání/čtení PDF v app storage
│   ├── SuspicionRecord.kt   # model jednoho nahlášeného "podezřelého" výsledku (obrázek + poznámka + čas)
│   ├── SuspicionRepository.kt # ukládání/čtení nahlášení v app storage, stejný souborový vzor jako ScanRepository
│   ├── DetectedBlob.kt      # sdílený model kusu (box, průměrná barva) pro fotku i živý náhled
│   ├── DetectedBlobMatching.kt # sdílené mapování/porovnávání: hledání pod tapem, referenční shoda podle velikosti/odstínu
│   ├── DetectedBlobFilters.kt # sdílené filtry (rovná hrana, velikostní odlehlé hodnoty, průměrná barva) pro fotku i živý náhled
│   ├── GridDetector.kt      # rozseká box na mřížku dlaždic/kláves, když v něm najde pravidelný opakující se vzor
│   ├── RoiSuggester.kt      # automatický výběr oblasti zájmu: shlukování kusů podle blízkosti (union-find), box největšího shluku
│   ├── ObjectCounter.kt     # počítání kusů ze statické fotky přes FastSamDetector, referenční kus, oblast zájmu
│   ├── fastsam/
│   │   └── FastSamDetector.kt # TFLite inference nad fastsam_s.tflite: letterbox, dlaždice, dekódování boxů, NMS
│   ├── LiveFrameAnalyzer.kt # CameraX analyzer: YUV -> upright bitmapa -> FastSamDetector, referenční kus, oblast zájmu
│   ├── BarcodeAnalyzer.kt   # CameraX analyzer: živé snímky -> ML Kit Barcode Scanning
│   ├── DocumentTextExtractor.kt # OCR jedné stránky + odhad formátování (velikost/tučné/kurzíva/barva) na řádek
│   ├── TextPdfWriter.kt     # vykreslí rozpoznaný text pozičně/formátovaně do PDF (bez fotky)
│   ├── BarcodeImageEncoder.kt # zpětně zakóduje hodnotu kódu do bitmapy (ZXing) pro uložení jako obrázek
│   └── CountingResultEncoder.kt # dokreslí boxy/kroužky/počet do kopie fotky pro uložení výsledku počítání
├── assets/
│   └── fastsam_s.tflite     # FastSAM-s model (~45 MB, AGPL-3.0) pro počítání kusů - fotka i živý náhled
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
