# Překladač knih a dokumentů

Program pro Windows, který přeloží e-knihy a dokumenty do češtiny (nebo jiného jazyka) a zachová formátování.
Má moderní okno (Qt) s postranní nabídkou **Překlad · Napsat knihu · Nastavení**.
Překládat umí **zdarma** (Google Překladač, DeepL Free, Microsoft, Gemini, Ollama, LibreTranslate) i placeně
přes **Claude API** (nejlepší kvalita). Umí také jen převádět formáty a přepisovat text z fotek a skenů do DOCX.

## Překladače

| Překladač | Cena | Kvalita češtiny | Co je potřeba |
|---|---|---|---|
| **Google Překladač** (výchozí) | zdarma | dobrá | nic, bez registrace (při velkém množství textu může Google dočasně omezit přístup) |
| **DeepL API Free** | zdarma 500 000 znaků/měsíc (≈ 1 kniha) | velmi dobrá | klíč z deepl.com → API → DeepL API Free (ověřují kartu, nic se nestrhává) |
| **Microsoft Translator** | zdarma 2 mil. znaků/měsíc | dobrá | klíč z portal.azure.com → Translator, cenová úroveň F0 |
| **Microsoft – celé dokumenty** | podle cenové úrovně Azure | dobrá, **zachová vzhled** DOCX/PDF/PPTX | stejný klíč + adresa „Překlad dokumentu“ (viz níže) |
| **Google Gemini** | bezplatná úroveň s limity | velmi dobrá | klíč z aistudio.google.com → Get API key |
| **Ollama** | zdarma, offline | podle modelu (menší modely slabší) | ollama.com + `ollama pull gemma3:12b`, výkonnější počítač |
| **LibreTranslate** | zdarma | slabší | vlastní server nebo instance s klíčem |
| **OpenAI-kompatibilní** (DeepSeek, OpenAI, Mistral, OpenRouter, Groq) | podle služby; DeepSeek velmi levný, OpenRouter má modely zdarma | podle modelu | adresa API, klíč a název modelu (viz Návod v Nastavení) |
| **Claude API** | placený podle spotřeby | nejlepší | klíč z platform.claude.com |

API služby (Claude, DeepSeek, OpenAI…) **nemají měsíční paušál** – dobíjí se kredit předem a platí se podle
spotřebovaných tokenů (1 token ≈ 0,4 českého slova). Předplatné Claude Pro/Max na claude.ai se na API nevztahuje.

### Offline překlad (bez internetu)

Překladač **Offline v počítači (Argos)** překládá přímo v počítači – zdarma, bez klíče a bez odesílání textu
(stejné modely jako LibreTranslate, ale bez serveru). Jazykové balíčky (každý asi 100 MB) se stáhnou v
*⚙ Nastavení → Součásti → Offline překlad*, nebo zaškrtnutím volby při instalaci. Jazyk originálu program pozná
sám; když přímý balíček chybí, překládá přes angličtinu (např. němčina → angličtina → čeština – stačí balíčky
*němčina → angličtina* a *angličtina → čeština*). Kvalita je nižší než u DeepL či Google, běží i na slabším
počítači (bez grafické karty). Vnitřní formátování odstavců (tučné uvnitř věty) se při offline překladu nezachová.

## Text z obrázků a skenů (OCR)

| OCR | Cena | Poznámka |
|---|---|---|
| **Tesseract** (výchozí) | zdarma, offline | Je součástí instalátoru. V hlavním okně zadejte jazyk originálu (`eng`, `ces`, `deu`, `eng+deu`). |
| **Google Gemini** | bezplatná úroveň | Lépe zvládne fotky, sloupce a tabulky. Použije klíč Gemini. |
| **Claude** | placený | Nejlepší; s překladačem Claude přečte a přeloží v jednom kroku. |

U PDF s textovou vrstvou (ne sken) Tesseract není potřeba, text se vezme přímo z PDF.

## Formáty

| Vstup | Co program udělá | Výchozí výstup |
|---|---|---|
| EPUB | přeloží text a zachová kapitoly, obrázky, styly i obsah | EPUB |
| MOBI, PDB, AZW3 | program převede knihu na EPUB, přeloží ji a uloží zpět (bez Calibre; AZW3 se uloží jako MOBI nebo EPUB, zápis AZW3 umí jen Calibre) | stejný formát |
| KFX, LIT | Calibre (volitelné) převede knihu na EPUB, program ji přeloží a Calibre převede výsledek zpět | AZW3 |
| DOCX | přeloží odstavce, tabulky a záhlaví a zachová obrázky, styly, tučné písmo a kurzívu | DOCX |
| TXT | přeloží text po odstavcích | TXT |
| RTF, FB2, ODT, HTMLZ | stejně jako e-knihy (přes EPUB, bez Calibre) | stejný formát |
| PDF | vezme text ze stránek (u skenů přes OCR) a přeloží ho | DOCX |
| JPG, PNG, WEBP, BMP, TIFF | přečte text z obrázku (OCR) a přeloží ho | DOCX |

Výstupní formát jde změnit, například KFX → EPUB, PDF → EPUB nebo DOCX → PDF.
Výsledek se uloží vedle originálu jako `název (čeština).přípona`.

## Stažení a instalace

1. Stáhněte instalátor **Prekladac-Setup.exe**:
   **https://github.com/Micha741/Micha741/releases/download/prekladac-latest/Prekladac-Setup.exe**
   (vždy nejnovější verze, sestavuje ho GitHub automaticky; Python není potřeba).
2. Spusťte ho a projděte instalací. Standardně se instaluje do `C:\Program Files\Prekladac` a Windows se zeptá
   na práva správce. V úvodu instalátoru můžete zvolit instalaci jen pro sebe (bez práv správce, do
   `%LOCALAPPDATA%\Programs\Prekladac`). Odinstalace: *Nastavení Windows → Aplikace*.
   - Instalátor obsahuje **Tesseract** (`Tesseract-OCR\tesseract.exe`) s jazyky OCR (angličtina, čeština,
     slovenština, němčina, polština, francouzština, španělština, italština, ruština, ukrajinština, maďarština).
   - **EPUB, MOBI, PDB, DOCX, RTF, ODT, FB2, HTMLZ, TXT a PDF** (čtení i zápis) a čtení **AZW3** zvládne program
     sám, bez dalších programů.
   - **Calibre je volitelné** – jen pro zápis AZW3, pro KFX a LIT. Nainstalujte ho zdarma z
     https://calibre-ebook.com (*⚙ Nastavení → Součásti → ⬇ Stáhnout Calibre*), program ho pak najde sám.
     **Plugin KFX Input** program stáhne a nainstaluje do Calibre sám při prvním souboru KFX.
3. Windows SmartScreen může u nového nepodepsaného programu ukázat „Systém Windows ochránil váš počítač“ →
   *Další informace → Přesto spustit*. Pokud antivirus (např. Avast) program zablokuje jako `IDP.Generic`,
   jde o falešný poplach u neznámého programu – viz *Antivirus* níže.
4. V **⚙ Nastavení → Služby a klíče** vyplňte klíče služeb, které chcete používat (u každé služby je tlačítko
   **Návod** s postupem krok za krokem), a ověřte je tlačítkem **Otestovat**.
   Číslo verze je v záhlaví okna a v *⚙ Nastavení → Obecné*.
   Klíče se ukládají **zašifrovaně** (Windows DPAPI) jen pro váš účet ve Windows.

### Info o programu

*⚙ Nastavení → Info* ukazuje verzi, co program umí, **historii verzí** (co přibylo kdy) a **plánované nápady**
(soubor `assets/changelog.md`). Pod tím je pole **Moje poznámky a nápady**, kam si můžete psát vlastní seznam –
uloží se tlačítkem Uložit nastavení. Instalátor i `Prekladac.exe` mají ve Vlastnostech → Podrobnosti verzi souboru,
autorská práva a popis.

### Jazyk programu

Program je česky, anglicky, slovensky a německy: *⚙ Nastavení → Obecné → Jazyk programu*, uložit a restartovat
(nabídne se samo). Angličtina, slovenština a němčina jsou součástí instalátoru; tlačítkem **⬇ Stáhnout další
jazyky…** se doinstalují další, jakmile přibudou (stahují se z GitHubu do `%APPDATA%\Prekladac\lang`).
Při prvním spuštění se jazyk zvolí podle Windows. Přeloženy jsou texty programu; návody ke službám a podrobné
chybové hlášky zůstávají česky. Překlady jsou v `tools/lang_source.py` (`python tools/lang_source.py`
vygeneruje `assets/lang/*.json`).

### Aktualizace na novou verzi

Při spuštění se program (nejvýš jednou, na pozadí) podívá na GitHub. Pokud je venku novější verze, zobrazí okno
**Je k dispozici nová verze** s tlačítky *Stáhnout novou verzi*, *Později* a *Tuto verzi přeskočit*.
Instalátor se stáhne v prohlížeči. Program ho záměrně sám nespouští, protože antivirus by to vyhodnotil
jako podezřelé chování. Zavřete Překladač a stažený `Prekladac-Setup.exe` spusťte: nainstaluje se přes
stávající verzi a nastavení, klíče i rozepsané knihy zůstanou zachované. Odinstalovávat není potřeba.
Ručně lze kontrolu spustit v *⚙ Nastavení → Obecné → Zkontrolovat novou verzi*, kde ji jde i vypnout.

## Použití

Stránka **Překlad** vypadá jako Word: nahoře pás karet **Soubory** (přidat soubory či složku, vybrat, odebrat),
**Překlad** (přeložit / jen převést, cílový jazyk, výstupní formát, překladač a jeho stav) a **Obrázky a OCR**;
vpravo velká tlačítka **▶ Spustit**, **Zastavit** a **Výstupní složka**; uprostřed stránka se seznamem souborů
a pokyny pro překlad, dole průběh.

1. Přidejte soubory tlačítkem **Přidat soubory** (v okně jde vybrat víc souborů najednou – Ctrl+klik,
   Shift+klik, Ctrl+A), **Přidat složku** (všechny podporované soubory včetně podsložek), nebo je přetáhněte
   myší do seznamu. V seznamu se vybírá stejně (Ctrl, Shift, Ctrl+A / **Vybrat vše**); **Odebrat vybrané**
   ukazuje počet a při výběru všech se změní na **Odebrat vše**. Odebírat jde i klávesou Delete.
2. Zvolte cílový jazyk, výstupní formát, překladač a OCR. Pod překladačem je vidět, jestli je služba připravená.
3. Klikněte na **Spustit**. V okně uvidíte průběh a na konci spotřebu (u Claude cenu, u DeepL zbývající měsíční limit).

**PDF o více stranách:** PDF jde přeložit nebo převést celé – program zpracuje všechny strany (po částech,
s průběhem „hotovo 40/120 stran“). Výsledek může být DOCX, PDF, EPUB… **Více obrázků do jednoho PDF:**
přidejte fotky / skeny stránek, zvolte výstupní formát **PDF** a nechte zaškrtnuté *Více obrázků spojit do
jednoho dokumentu*. V režimu *Jen převést* vznikne PDF, kde je každý obrázek jednou stránkou (bez rozpoznávání
textu, okamžitě); při překladu se text rozpozná, přeloží a uloží jako vícestránkové PDF.

Do pole **Pokyny pro překlad** (platí pro Claude, Gemini a Ollama) můžete napsat například:
`Jména postav nepřekládej. „Ranger“ překládej jako „hraničář“. Tykání mezi postavami zachovej.`

### ✍ Napsat knihu (Claude API)

Tlačítko **✍ Napsat knihu** v hlavním okně napíše celou knihu podle vašeho popisu. Psát může **Claude**
(nejlepší kvalita), **Google Gemini** (bezplatná úroveň s limity), **OpenAI-kompatibilní služba** (např. levný
DeepSeek nebo bezplatné modely na OpenRouteru) nebo **Ollama** (zdarma ve vašem počítači, pomalé):

1. Vyberte **žánr a styl** a napište **popis** (o čem kniha je, postavy, prostředí, pro koho je, jak má
   skončit – stačí kolem 20 vět), případně jazyk, počet kapitol a délku kapitoly. Program ukáže orientační cenu.
2. **1. Navrhnout osnovu** – Claude navrhne název, shrnutí, postavy a obsah kapitol. Osnovu můžete upravit
   (kapitoly ve tvaru `1. Název — obsah`), přidat nebo ubrat kapitoly.
3. **2. Napsat knihu** – Claude píše kapitolu po kapitole; každá dostane osnovu, shrnutí předchozích kapitol
   a konec předchozí kapitoly, aby děj i postavy navazovaly. Hotová kniha se uloží jako EPUB, DOCX, PDF nebo AZW3.

**Délka kapitol:** „Slov na kapitolu“ je výchozí délka. Jednotlivá kapitola může být delší či kratší – v osnově
klikněte pravým tlačítkem na její řádek → **📏 Délka kapitoly…** (v osnově se objeví např.
`3. Bitva u řeky [4000 slov] — …`, jde to napsat i ručně). **Během psaní** můžete kdykoli kliknout na
*Zastavit*, upravit délky nebo dosud nenapsané kapitoly (i přidat nové na konec) a znovu *Napsat knihu* –
napsané kapitoly zůstanou a pokračuje se další. Pokud změníte už napsanou kapitolu, program se zeptá, zda ji
ponechat, nebo začít znovu (jako nový soubor, původní zůstane).

Žánr a styl se vybírá ze seznamů (přes 40 žánrů včetně erotiky, pro koho, vypravěč, tón, tempo, prostředí,
jazyk) a lze dopsat vlastní přání. Okno jde maximalizovat nebo přepnout na celou obrazovku.

**Ukládání:** osnova se uloží hned po vytvoření a rozepsaná kniha po každé kapitole (`Název.kniha.json`).
Když program zavřete, přijdete nanejvýš o právě psanou kapitolu – po spuštění klikněte na
**Pokračovat v rozepsané…** a psaní pokračuje od další kapitoly (nezačíná znovu).

**📖 Upravit knihu** otevře editor ve stylu Wordu s pásem karet:
- **Domů** – schránka (vložit, vyjmout, kopírovat, kopírovat formát), **písmo** (druh, velikost, tučné, kurzíva,
  podtržení, přeškrtnutí, horní/dolní index, barva písma, zvýraznění, zvětšit/zmenšit, vymazat formátování),
  **odstavec** (odrážky, číslování, odsazení, řádkování, zarovnání vlevo/na střed/vpravo/do bloku, zalomení
  stránky), **styly** (Normální, Nadpis, Podnadpis, Citace), **úpravy** (najít a nahradit v celé knize, zpět/znovu,
  lupa), uložit a exportovat.
- **Kniha** – název a autor, výchozí písmo knihy, obsah s odkazy, formáty exportu, přidání/mazání/přesun kapitol.
- **🖨 Tisk** (Domů → Soubor, nebo Ctrl+P) – vytiskne celou knihu (titulní strana, každá kapitola od nové
  stránky, čísla stran, zalomení stránek z editoru) nebo jen otevřenou kapitolu; je i **náhled tisku**.
  V okně tisku jde zvolit tiskárnu, počet kopií a stránky; „Microsoft Print to PDF“ uloží tisk jako PDF.
- **Soubor** – Uložit, **Uložit jako…** (jeden soubor ve formátu **DOCX, PDF, EPUB, MOBI, PDB, AZW3, ODT, RTF, FB2, HTMLZ, TXT**,
  nebo kopie projektu `*.kniha.json`, Ctrl+Shift+S), Exportovat (víc formátů najednou), Tisk, Náhled tisku, Zavřít.
  Všechny formáty zapisuje program sám, jen AZW3 potřebuje nainstalované Calibre.
- **Obrázky** – Domů → Vložení → **🖼 Obrázek** (JPG, PNG, GIF, BMP, WEBP, TIFF), nebo Ctrl+V ze schránky či
  přetažení souboru myší. Pravým tlačítkem na obrázku: šířka (25–100 % stránky), zarovnání, nahradit, smazat.
  Obrázky se ukládají přímo do souboru knihy (velké fotky se zmenší) a zůstanou v DOCX, EPUB, PDF, MOBI, AZW3,
  RTF, ODT i v tisku (v TXT jako „[obrázek]“).
- **Obálka** – Kniha → **🖼 Obálka…**: v EPUB, MOBI a AZW3 se zobrazí jako obálka e-knihy ve čtečce
  (Kindle, Calibre…), v DOCX, PDF, ODT a tisku jako první strana.
- **Zobrazení** – **📑 Panel kapitol** skryje/zobrazí seznam kapitol vlevo (F9, pamatuje se), **📏 Pravítko** (zapnout/vypnout, program si volbu pamatuje): vodorovné pravítko nad stránkou
  v centimetrech a svislé vlevo. Na vodorovném jde myší táhnout odsazení odstavce jako ve Wordu – ▽ nahoře
  první řádek, △ dole levé odsazení, △ vpravo pravé odsazení (po čtvrt centimetru); dvojklik odsazení zruší.
  Odsazení se zachová i v exportu.
- Vlevo seznam kapitol, dole počet slov a odstavců kapitoly i celé knihy.

**Automatické ukládání v editoru** (⚙ Nastavení → Obecné): po každé větě (výchozí), po každém slově, po zadaném
počtu znaků, každých N sekund, nebo vypnuto. Na disk se zapisuje nejvýš jednou za 2 s a předchozí verze zůstává
jako záloha `Název.kniha.json.bak`. Dokud je kniha otevřená v editoru, AI do ní nepíše (nepřepíšou se navzájem).

**Psaní textu** (editor knihy, popis i osnova):
- **Pravé tlačítko myši** – zpět/znovu, vyjmout, kopírovat, vložit (i bez formátu), vybrat vše; v editoru navíc
  formát písma, zarovnání, zalomení řádku a stránky, najít a nahradit.
- **Kontrola pravopisu** – chybná slova jsou červeně podtržená; pravým tlačítkem na ně nabídne opravy,
  „Přidat do slovníku“ si slovo zapamatuje (jména postav) a „Ignorovat všude“ ho přeskočí.
- **Návrhy slov při psaní (T9)** – od třetího písmene nabídne slova z rozepsané knihy a ze slovníku.
  **Tab** vloží první návrh, šipkami vyberete jiný (Enter ho potvrdí), Esc nabídku zavře. Enter bez výběru
  dělá normálně nový řádek.
- Obojí jde vypnout v ⚙ Nastavení → Obecné nebo v menu pravého tlačítka. Používá se český slovník Hunspell
  z LibreOffice (součást instalátoru); kontrola pravopisu se zapíná jen u knih v češtině.

- **Velké písmeno na začátku věty** – po tečce, otazníku či vykřičníku a na začátku odstavce se první písmeno
  napíše velké samo (jako ve Wordu); po zkratkách („např.“, „tzv.“, „atd.“) a pořadových číslech („5. května“)
  ne. Vypnout jde v ⚙ Nastavení → Obecné.

Stránka **Napsat knihu** vypadá jako Word: karta **Soubor** (Nová kniha – Ctrl+N, Otevřít – Ctrl+O, Uložit –
Ctrl+S, Uložit jako – Ctrl+Shift+S, seznam **Naposledy otevřené** a informace o otevřené knize; uložit jde kdykoli,
i rozepsaný popis a neúplnou osnovu), dále pás karet *Žánr a styl* a *Rozsah a služba*, vpravo velká
tlačítka (Navrhnout osnovu, Napsat knihu, Zastavit, Upravit, Otevřít rozepsanou), pod nimi stav služby a odhad
rozsahu a uprostřed bílá stránka s popisem knihy a osnovou. Průběh psaní je dole (oddělovač jde posunout).

**Postranní panel** jde tlačítkem ☰ vedle názvu programu sbalit na úzký proužek s ikonami (a zase rozbalit).

Formátování z editoru (tučné, barvy, zarovnání, odrážky, nadpisy…) se zachová v DOCX, EPUB, PDF i AZW3.
Export vloží na začátek **obsah s odkazy** na kapitoly.

### Microsoft: dvě API

Služba Translator v Azure má v *Klíče a koncový bod* dvě adresy a oba používají stejný **KLÍČ 1**:

| API | Volba v programu | Co umí |
|---|---|---|
| **Překlad textu** (`api.cognitive.microsofttranslator.com`) | *Microsoft Translator* | text po odstavcích, všechny formáty včetně e-knih; potřebuje **oblast** (např. `westeurope`) |
| **Překlad dokumentu** (`https://<název>.cognitiveservices.azure.com/`) | *Microsoft – překlad celých dokumentů* | pošle celý soubor (DOCX, PDF, PPTX, XLSX, TXT, HTML, ODT, RTF, MD; do 10 MB) a vrátí ho přeložený **se zachovaným vzhledem** – PDF zůstane PDF; e-knihy a obrázky se přeloží přes Překlad textu |

Adresu „Překlad dokumentu“ zkopírujte do *⚙ Nastavení → Microsoft Azure Translator*. Pokud Microsoft hlásí, že tato funkce
na vaší cenové úrovni není dostupná, použijte Překlad textu (ten na F0 funguje vždy).

### Příkazová řádka

```bat
Prekladac.exe kniha.kfx --to epub --engine google
Prekladac.exe dokument.docx --engine deepl
Prekladac.exe zprava.pdf --engine microsoft_doc
Prekladac.exe strana1.jpg strana2.jpg --merge-images --ocr tesseract --ocr-lang eng
Prekladac.exe kniha.azw3 --to epub --convert-only
```
Klíče se berou z Nastavení programu (nebo z parametru `--key`, případně z proměnných prostředí
`DEEPL_API_KEY`, `AZURE_TRANSLATOR_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`).

### Pro vývojáře: spuštění ze zdrojového kódu

```bat
python -m pip install -r requirements.txt
python app.py
```
Instalátor (`installer.iss`, Inno Setup) s přibaleným Tesseractem sestavuje na GitHubu workflow
`.github/workflows/prekladac.yml`, který ho po instalaci i vyzkouší. `build_exe.bat` sestaví jen samotný program.

## Antivirus

Program není digitálně podepsaný (podpisový certifikát je placený), proto ho SmartScreen a některé antiviry
zpočátku považují za neznámý. Když ho Avast zablokuje jako `IDP.Generic`:
1. V Avastu přidejte výjimku pro složku programu (`C:\Program Files\Prekladac`) (v nastavení Avastu hledejte
   *Výjimky*), případně soubor obnovte z karantény.
2. Nahlaste falešný poplach na <https://www.avast.com/false-positive-file-form.php>, aby se program přestal blokovat
   i ostatním.

Instalátor program rozbaluje do vlastní složky (ne do Temp) a nic dalšího přes internet neinstaluje, což antiviry
vidí mnohem méně podezřele než samostatné `.exe`. Licence přibalených programů jsou v `THIRD_PARTY.txt`.

## Claude: modely a cena

| Model | Kvalita | Orientační cena za knihu ~300 stran (cca 600 000 znaků) |
|---|---|---|
| Claude Opus 5.5 (výchozí) | nejlepší čeština a styl | cca 5–10 USD |
| Claude Sonnet 5.5 | velmi dobrá | cca 2–5 USD |
| Claude Haiku 5.5 | základní | pod 0,50 USD |

Ceny jsou jen orientační. Program před každým souborem vypíše odhad a na konci skutečnou spotřebu tokenů.

## Jak to funguje

- Text se posílá po dávkách a několik dávek se překládá najednou.
- Když dávka selže (např. vrátí jiný počet úseků), program ji rozdělí na menší a zkusí to znovu.
  Při neplatném klíči nebo vyčerpaném limitu se zpracování souboru zastaví s vysvětlením.
- U Google Překladače se HTML značky nahradí zástupnými symboly `{{0}}` a po překladu se vrátí zpět.
  Úsek, který nejde přeložit, zůstane v originále a program to vypíše do protokolu.
- EPUB se upravuje přímo: přeloží se text uvnitř odstavců, nadpisů, seznamů a tabulek, značky jako `<i>` nebo `<a>` zůstanou.
  Přeloží se i obsah (nav/NCX) a jazyk knihy se nastaví na `cs`.
- PDF se zpracovává po 5 stranách. Tesseract bere text z textové vrstvy, u skenů stránku převede na obrázek a přečte ho.

## Omezení

- Knihy s **DRM** (z Kindle Store apod.) převést nejdou. Program pracuje jen se soubory bez DRM.
- **Zápis do KFX** se nepodporuje. Pro Kindle použijte AZW3 nebo EPUB (Send to Kindle umí EPUB).
- U **PDF** se zachová obsah, nadpisy, seznamy a tabulky, ale ne přesné rozvržení stránky.
- V **DOCX** se zachovají styly odstavců, tučné písmo, kurzíva a podtržení. Jiné formátování uvnitř odstavce (barva nebo velikost jednotlivých slov) se sjednotí podle začátku odstavce. Text odkazů se přesune do běžného textu. Poznámky pod čarou se nepřekládají.
- Klíče jsou v `%APPDATA%\Prekladac\config.json` zašifrované pro váš účet ve Windows. Do samotného `.exe` se nevkládají, kdokoli s programem by je jinak mohl vytáhnout.
- Google Překladač bez klíče je neoficiální přístup; Google ho může kdykoli omezit. Pro celé knihy je spolehlivější DeepL Free nebo Gemini.
- Tesseract nerozpozná nadpisy ani tabulky – vše uloží jako odstavce. Gemini a Claude je rozpoznají.

## Testy

```bat
python -m pip install pytest
python -m pytest tests
```

Testy nevolají API (odpovědi služeb jsou podvržené). Živý test Google Překladače: `set PREKLADAC_LIVE=1` a pak pytest.

## Android

Mobilní verze (převod a překlad knih v telefonu) je ve složce [`../prekladac-android`](../prekladac-android).
Používá stejná pravidla převodů (EPUB, MOBI, PDB, DOCX, TXT, PDF) a podobný vzhled.
