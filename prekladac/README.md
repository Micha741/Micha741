# Překladač knih a dokumentů

Program pro Windows, který přeloží e-knihy a dokumenty do češtiny (nebo jiného jazyka) pomocí **Claude API**.
Formátování zůstane zachované. Umí také jen převádět formáty a přepisovat text z fotek a skenů do DOCX.

| Vstup | Co program udělá | Výchozí výstup |
|---|---|---|
| EPUB | přeloží text a zachová kapitoly, obrázky, styly i obsah | EPUB |
| AZW3, KFX, MOBI, AZW | Calibre převede knihu na EPUB, program ji přeloží a Calibre převede výsledek zpět | AZW3 (MOBI → MOBI) |
| DOCX | přeloží odstavce, tabulky a záhlaví a zachová obrázky, styly, tučné písmo a kurzívu | DOCX |
| TXT | přeloží text po odstavcích | TXT |
| RTF, FB2, ODT | stejně jako e-knihy (přes EPUB) | stejný formát |
| PDF | Claude přečte stránky (i naskenované) a přeloží je | DOCX |
| JPG, PNG, WEBP, BMP, TIFF | Claude přečte text z obrázku (OCR) a přeloží ho | DOCX |

Výstupní formát jde změnit, například KFX → EPUB, PDF → EPUB nebo DOCX → PDF.
Výsledek se uloží vedle originálu jako `název (čeština).přípona`.

## Instalace

1. **Python 3.10 nebo novější** stáhněte z <https://www.python.org/downloads/>. Při instalaci zaškrtněte *Add python.exe to PATH*.
2. **Calibre** stáhněte z <https://calibre-ebook.com/download_windows>. Je potřeba na AZW3, KFX, MOBI, RTF a na převody mezi formáty.
   Pro **KFX** přidejte do Calibre plugin **KFX Input**: *Předvolby → Moduly → Získat nové moduly → KFX Input*.
3. Ve složce `prekladac` spusťte v příkazovém řádku:
   ```bat
   python -m pip install -r requirements.txt
   ```
4. **API klíč** získáte na <https://platform.claude.com> (*API Keys*). Vložte ho do okna programu, nebo ho nastavte jako proměnnou prostředí `ANTHROPIC_API_KEY`.

## Spuštění

Dvakrát klikněte na `spustit.bat`. Případně spusťte `python app.py`.

1. Přidejte soubory tlačítkem nebo je přetáhněte myší do seznamu.
2. Zvolte cílový jazyk, výstupní formát a model.
3. Klikněte na **Spustit**. V okně uvidíte průběh, odhad ceny a na konci skutečnou spotřebu.

Do pole **Pokyny pro překlad** můžete napsat například:
`Jména postav nepřekládej. „Ranger“ překládej jako „hraničář“. Tykání mezi postavami zachovej.`

### Samostatný .exe

Spusťte `build_exe.bat`. Vznikne `dist\Prekladac.exe`, který jde spustit bez instalace Pythonu.
Calibre ale musí být nainstalované i tak.

### Příkazová řádka

```bat
python app.py kniha.kfx --to epub
python app.py dokument.docx --lang slovenština
python app.py strana1.jpg strana2.jpg --merge-images
python app.py kniha.azw3 --to epub --convert-only
```

## Modely a cena

| Model | Kvalita | Orientační cena za knihu ~300 stran (cca 600 000 znaků) |
|---|---|---|
| Claude Opus 5.5 (výchozí) | nejlepší čeština a styl | cca 5–10 USD |
| Claude Sonnet 5.5 | velmi dobrá | cca 2–5 USD |
| Claude Haiku 5.5 | základní | pod 0,50 USD |

Ceny jsou jen orientační. Program před každým souborem vypíše odhad a na konci skutečnou spotřebu tokenů.

## Jak to funguje

- Text se posílá po dávkách (~8 000 znaků) a 4 dávky se překládají najednou.
- Model vrací strukturovaný JSON, takže se úseky nepomíchají. Když dávka selže, program ji rozdělí na menší a zkusí to znovu.
  Úsek, který nejde přeložit, zůstane v originále a program to vypíše do protokolu.
- EPUB se upravuje přímo: přeloží se text uvnitř odstavců, nadpisů, seznamů a tabulek, značky jako `<i>` nebo `<a>` zůstanou.
  Přeloží se i obsah (nav/NCX) a jazyk knihy se nastaví na `cs`.
- PDF se posílá po 5 stranách. Claude čte text i obrázky stran, takže zvládne i skeny.

## Omezení

- Knihy s **DRM** (z Kindle Store apod.) převést nejdou. Program pracuje jen se soubory bez DRM.
- **Zápis do KFX** se nepodporuje. Pro Kindle použijte AZW3 nebo EPUB (Send to Kindle umí EPUB).
- U **PDF** se zachová obsah, nadpisy, seznamy a tabulky, ale ne přesné rozvržení stránky.
- V **DOCX** se zachovají styly odstavců, tučné písmo, kurzíva a podtržení. Jiné formátování uvnitř odstavce (barva nebo velikost jednotlivých slov) se sjednotí podle začátku odstavce. Text odkazů se přesune do běžného textu. Poznámky pod čarou se nepřekládají.
- Zapamatovaný API klíč se ukládá jako prostý text do `%APPDATA%\Prekladac\config.json`. Pokud to nechcete, nechte políčko *Zapamatovat klíč* nezaškrtnuté a použijte proměnnou `ANTHROPIC_API_KEY`.

## Testy

```bat
python -m pip install pytest
python -m pytest tests
```

Testy nevolají API, překladač v nich nahrazuje falešná verze.
