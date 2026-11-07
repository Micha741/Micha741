# Překladač knih a dokumentů

Program pro Windows, který přeloží e-knihy a dokumenty do češtiny (nebo jiného jazyka) a zachová formátování.
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
| **Claude API** | placený podle spotřeby | nejlepší | klíč z platform.claude.com |

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
| AZW3, KFX, MOBI, AZW | Calibre převede knihu na EPUB, program ji přeloží a Calibre převede výsledek zpět | AZW3 (MOBI → MOBI) |
| DOCX | přeloží odstavce, tabulky a záhlaví a zachová obrázky, styly, tučné písmo a kurzívu | DOCX |
| TXT | přeloží text po odstavcích | TXT |
| RTF, FB2, ODT | stejně jako e-knihy (přes EPUB) | stejný formát |
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
   - Instalátor **obsahuje Calibre** (`Calibre2\ebook-convert.exe`) i **Tesseract** (`Tesseract-OCR\tesseract.exe`)
     s jazyky OCR (angličtina, čeština, slovenština, němčina, polština, francouzština, španělština, italština,
     ruština, ukrajinština, maďarština). Nic dalšího se instalovat nemusí.
   - **Plugin KFX Input** program stáhne a nainstaluje do Calibre sám při prvním souboru KFX
     (nebo tlačítkem v *⚙ Nastavení → Součásti*). Pokud už máte Calibre s pluginem, použije se váš.
3. Windows SmartScreen může u nového nepodepsaného programu ukázat „Systém Windows ochránil váš počítač“ →
   *Další informace → Přesto spustit*. Pokud antivirus (např. Avast) program zablokuje jako `IDP.Generic`,
   jde o falešný poplach u neznámého programu – viz *Antivirus* níže.
4. V **⚙ Nastavení → Služby a klíče** vyplňte klíče služeb, které chcete používat (u každé služby je tlačítko
   **Návod** s postupem krok za krokem), a ověřte je tlačítkem **Otestovat**.
   Číslo verze je v záhlaví okna a v *⚙ Nastavení → Obecné*.
   Klíče se ukládají **zašifrovaně** (Windows DPAPI) jen pro váš účet ve Windows.

## Použití

1. Přidejte soubory tlačítkem nebo je přetáhněte myší do seznamu.
2. Zvolte cílový jazyk, výstupní formát, překladač a OCR. Pod překladačem je vidět, jestli je služba připravená.
3. Klikněte na **Spustit**. V okně uvidíte průběh a na konci spotřebu (u Claude cenu, u DeepL zbývající měsíční limit).

Do pole **Pokyny pro překlad** (platí pro Claude, Gemini a Ollama) můžete napsat například:
`Jména postav nepřekládej. „Ranger“ překládej jako „hraničář“. Tykání mezi postavami zachovej.`

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
Instalátor (`installer.iss`, Inno Setup) i s přibaleným Calibre a Tesseractem sestavuje na GitHubu workflow
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
