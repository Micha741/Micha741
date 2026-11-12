"""Zdroj překladů programu: (čeština, angličtina, slovenština, němčina).

Spuštěním vzniknou assets/lang/en.json, sk.json, de.json a index.json:
    python tools/lang_source.py
Klíč s „{}“ je šablona (čísla, názvy souborů…). Nový jazyk = další sloupec / další soubor .json
v assets/lang (program ho umí doinstalovat z GitHubu).
"""
from __future__ import annotations

E: list[tuple[str, str, str, str]] = [
    # ------------------------------------------------------------ hlavní okno
    ("Překladač", "Translator", "Prekladač", "Übersetzer"),
    ("Překlad", "Translate", "Preklad", "Übersetzen"),
    ("Napsat knihu", "Write a book", "Napísať knihu", "Buch schreiben"),
    ("Nastavení", "Settings", "Nastavenia", "Einstellungen"),
    ("vývojová verze", "development version", "vývojová verzia", "Entwicklungsversion"),
    ("verze {}", "version {}", "verzia {}", "Version {}"),
    ("{} – verze {}", "{} – version {}", "{} – verzia {}", "{} – Version {}"),
    ("Překladač knih a dokumentů", "Book and Document Translator", "Prekladač kníh a dokumentov",
     "Bücher- und Dokumentübersetzer"),
    ("Skrýt panel", "Hide panel", "Skryť panel", "Seitenleiste ausblenden"),
    ("Rozbalit panel", "Expand panel", "Rozbaliť panel", "Seitenleiste einblenden"),
    ("Upozornění: Calibre nebylo nalezeno – bez něj nepůjdou AZW3, KFX, MOBI a RTF. Je součástí instalátoru "
     "Prekladac-Setup.exe.",
     "Warning: Calibre was not found – AZW3, KFX, MOBI and RTF will not work without it. It is included in "
     "Prekladac-Setup.exe.",
     "Upozornenie: Calibre sa nenašlo – bez neho nebudú fungovať AZW3, KFX, MOBI a RTF. Je súčasťou inštalátora "
     "Prekladac-Setup.exe.",
     "Hinweis: Calibre wurde nicht gefunden – ohne Calibre funktionieren AZW3, KFX, MOBI und RTF nicht. Es ist "
     "in Prekladac-Setup.exe enthalten."),
    ("Nastavení se nepodařilo uložit: {}", "Settings could not be saved: {}", "Nastavenia sa nepodarilo uložiť: {}",
     "Einstellungen konnten nicht gespeichert werden: {}"),
    # aktualizace
    ("Nová verze", "New version", "Nová verzia", "Neue Version"),
    ("<b>Je k dispozici nová verze {}</b> (máte {}).", "<b>New version {} is available</b> (you have {}).",
     "<b>Je k dispozícii nová verzia {}</b> (máte {}).", "<b>Neue Version {} verfügbar</b> (Sie haben {})."),
    ("Stáhněte Prekladac-Setup.exe a spusťte ho – nainstaluje se přes stávající verzi. Nastavení, klíče i "
     "rozepsané knihy zůstanou zachované. Před instalací program zavřete.",
     "Download Prekladac-Setup.exe and run it – it installs over the current version. Settings, keys and "
     "unfinished books are kept. Close the program before installing.",
     "Stiahnite Prekladac-Setup.exe a spustite ho – nainštaluje sa cez existujúcu verziu. Nastavenia, kľúče aj "
     "rozpísané knihy zostanú zachované. Pred inštaláciou program zatvorte.",
     "Laden Sie Prekladac-Setup.exe herunter und starten Sie es – es installiert sich über die vorhandene Version. "
     "Einstellungen, Schlüssel und angefangene Bücher bleiben erhalten. Schließen Sie das Programm vorher."),
    ("⬇ Stáhnout novou verzi", "⬇ Download new version", "⬇ Stiahnuť novú verziu", "⬇ Neue Version herunterladen"),
    ("Tuto verzi přeskočit", "Skip this version", "Preskočiť túto verziu", "Diese Version überspringen"),
    ("Později", "Later", "Neskôr", "Später"),
    ("Novou verzi se nepodařilo zjistit:\n{}", "Could not check for a new version:\n{}",
     "Novú verziu sa nepodarilo zistiť:\n{}", "Neue Version konnte nicht geprüft werden:\n{}"),
    ("Máte nejnovější verzi ({}).", "You have the latest version ({}).", "Máte najnovšiu verziu ({}).",
     "Sie haben die neueste Version ({})."),
    ("Vývojová verze (spuštěná z Pythonu) se neaktualizuje.",
     "The development version (run from Python) is not updated.",
     "Vývojová verzia (spustená z Pythonu) sa neaktualizuje.",
     "Die Entwicklungsversion (aus Python gestartet) wird nicht aktualisiert."),
    # ------------------------------------------------------------ stránka Překlad
    ("Překlad a převod souborů", "Translate and convert files", "Preklad a prevod súborov",
     "Dateien übersetzen und umwandeln"),
    ("Soubory", "Files", "Súbory", "Dateien"),
    ("➕ Přidat soubory…", "➕ Add files…", "➕ Pridať súbory…", "➕ Dateien hinzufügen…"),
    ("V okně můžete vybrat víc souborů najednou (Ctrl+klik, Shift+klik, Ctrl+A).",
     "You can select several files at once in the dialog (Ctrl+click, Shift+click, Ctrl+A).",
     "V okne môžete vybrať viac súborov naraz (Ctrl+klik, Shift+klik, Ctrl+A).",
     "Im Dialog können Sie mehrere Dateien auswählen (Strg+Klick, Umschalt+Klick, Strg+A)."),
    ("📁 Přidat složku…", "📁 Add folder…", "📁 Pridať priečinok…", "📁 Ordner hinzufügen…"),
    ("Přidá všechny podporované soubory ze složky včetně podsložek.",
     "Adds all supported files from the folder including subfolders.",
     "Pridá všetky podporované súbory z priečinka vrátane podpriečinkov.",
     "Fügt alle unterstützten Dateien aus dem Ordner samt Unterordnern hinzu."),
    ("☑ Vybrat vše", "☑ Select all", "☑ Vybrať všetko", "☑ Alle auswählen"),
    ("☐ Zrušit výběr", "☐ Clear selection", "☐ Zrušiť výber", "☐ Auswahl aufheben"),
    ("➖ Odebrat vybrané", "➖ Remove selected", "➖ Odobrať vybrané", "➖ Auswahl entfernen"),
    ("➖ Odebrat vybrané ({})", "➖ Remove selected ({})", "➖ Odobrať vybrané ({})", "➖ Auswahl entfernen ({})"),
    ("🗑 Odebrat vše", "🗑 Remove all", "🗑 Odobrať všetko", "🗑 Alle entfernen"),
    ("Klávesa Delete", "Delete key", "Kláves Delete", "Entf-Taste"),
    ("Vybrat vše", "Select all", "Vybrať všetko", "Alle auswählen"),
    ("📂 Otevřít složku souboru", "📂 Open file location", "📂 Otvoriť priečinok súboru", "📂 Dateiordner öffnen"),
    ("{} soubor", "{} file", "{} súbor", "{} Datei"),
    ("{} soubory", "{} files", "{} súbory", "{} Dateien"),
    ("{} souborů", "{} files", "{} súborov", "{} Dateien"),
    ("{} soubor, vybráno {}", "{} file, {} selected", "{} súbor, vybraté {}", "{} Datei, {} ausgewählt"),
    ("{} soubory, vybráno {}", "{} files, {} selected", "{} súbory, vybraté {}", "{} Dateien, {} ausgewählt"),
    ("{} souborů, vybráno {}", "{} files, {} selected", "{} súborov, vybraté {}", "{} Dateien, {} ausgewählt"),
    ("Přetáhněte sem soubory\n(EPUB, AZW3, KFX, MOBI, PDF, DOCX, TXT, RTF, JPG, PNG…)",
     "Drag files here\n(EPUB, AZW3, KFX, MOBI, PDF, DOCX, TXT, RTF, JPG, PNG…)",
     "Pretiahnite sem súbory\n(EPUB, AZW3, KFX, MOBI, PDF, DOCX, TXT, RTF, JPG, PNG…)",
     "Dateien hierher ziehen\n(EPUB, AZW3, KFX, MOBI, PDF, DOCX, TXT, RTF, JPG, PNG…)"),
    ("Vyberte soubory (víc najednou: Ctrl+klik, Shift+klik nebo Ctrl+A)",
     "Select files (several at once: Ctrl+click, Shift+click or Ctrl+A)",
     "Vyberte súbory (viac naraz: Ctrl+klik, Shift+klik alebo Ctrl+A)",
     "Dateien auswählen (mehrere: Strg+Klick, Umschalt+Klick oder Strg+A)"),
    ("Podporované soubory ({});;Vše (*.*)", "Supported files ({});;All (*.*)", "Podporované súbory ({});;Všetko (*.*)",
     "Unterstützte Dateien ({});;Alle (*.*)"),
    ("Vyberte složku se soubory", "Select a folder with files", "Vyberte priečinok so súbormi",
     "Ordner mit Dateien auswählen"),
    ("Ve složce {} nejsou žádné podporované soubory (nebo už jsou v seznamu).",
     "The folder {} contains no supported files (or they are already in the list).",
     "V priečinku {} nie sú žiadne podporované súbory (alebo už sú v zozname).",
     "Der Ordner {} enthält keine unterstützten Dateien (oder sie sind bereits in der Liste)."),
    ("Nepodporovaný formát, přeskočeno: {}", "Unsupported format, skipped: {}", "Nepodporovaný formát, preskočené: {}",
     "Nicht unterstütztes Format, übersprungen: {}"),
    ("Nastavení překladu", "Translation settings", "Nastavenia prekladu", "Übersetzungseinstellungen"),
    ("Přeložit", "Translate", "Preložiť", "Übersetzen"),
    ("Jen převést formát / přepsat text z obrázku", "Only convert format / transcribe text from images",
     "Len previesť formát / prepísať text z obrázka", "Nur Format umwandeln / Text aus Bildern abschreiben"),
    ("Cílový jazyk:", "Target language:", "Cieľový jazyk:", "Zielsprache:"),
    ("Výstupní formát:", "Output format:", "Výstupný formát:", "Ausgabeformat:"),
    ("stejný jako vstup", "same as input", "rovnaký ako vstup", "wie Eingabe"),
    ("Překladač:", "Translator:", "Prekladač:", "Übersetzer:"),
    ("Text z obrázků/skenů:", "Text from images/scans:", "Text z obrázkov/skenov:", "Text aus Bildern/Scans:"),
    ("Jazyk originálu (OCR):", "Source language (OCR):", "Jazyk originálu (OCR):", "Originalsprache (OCR):"),
    ("Pokyny:", "Instructions:", "Pokyny:", "Anweisungen:"),
    ("Pokyny pro překlad – glosář, styl (Claude, Gemini, Ollama, OpenAI…)",
     "Translation instructions – glossary, style (Claude, Gemini, Ollama, OpenAI…)",
     "Pokyny pre preklad – glosár, štýl (Claude, Gemini, Ollama, OpenAI…)",
     "Übersetzungsanweisungen – Glossar, Stil (Claude, Gemini, Ollama, OpenAI…)"),
    ("Více obrázků spojit do jednoho dokumentu (DOCX, nebo vícestránkové PDF)",
     "Combine several images into one document (DOCX or multi-page PDF)",
     "Viac obrázkov spojiť do jedného dokumentu (DOCX alebo viacstranové PDF)",
     "Mehrere Bilder zu einem Dokument zusammenfassen (DOCX oder mehrseitiges PDF)"),
    ("▶  Spustit", "▶  Start", "▶  Spustiť", "▶  Starten"),
    ("■ Zastavit", "■ Stop", "■ Zastaviť", "■ Stopp"),
    ("Nejdřív přidejte soubory.", "Add some files first.", "Najprv pridajte súbory.", "Fügen Sie zuerst Dateien hinzu."),
    ("PPTX, XLSX a MD umí přeložit jen překladač „Microsoft – překlad celých dokumentů“.",
     "PPTX, XLSX and MD can only be translated by „Microsoft – whole document translation“.",
     "PPTX, XLSX a MD vie preložiť len prekladač „Microsoft – preklad celých dokumentov“.",
     "PPTX, XLSX und MD kann nur „Microsoft – Übersetzung ganzer Dokumente“ übersetzen."),
    ("Hotovo. Vytvořeno souborů: {}", "Done. Files created: {}", "Hotovo. Vytvorených súborov: {}",
     "Fertig. Erstellte Dateien: {}"),
    ("Neočekávaná chyba: {}", "Unexpected error: {}", "Neočakávaná chyba: {}", "Unerwarteter Fehler: {}"),
    ("Zastaveno.", "Stopped.", "Zastavené.", "Gestoppt."),
    ("  ✓ Uloženo: {}", "  ✓ Saved: {}", "  ✓ Uložené: {}", "  ✓ Gespeichert: {}"),
    ("✓ Uloženo: {}", "✓ Saved: {}", "✓ Uložené: {}", "✓ Gespeichert: {}"),
    # stavové řádky (části oddělené „·“)
    ("připraveno, klíč není potřeba", "ready, no key needed", "pripravené, kľúč nie je potrebný",
     "bereit, kein Schlüssel nötig"),
    ("klíč nastaven", "key set", "kľúč nastavený", "Schlüssel gesetzt"),
    ("chybí klíč – otevřete ⚙ Nastavení", "key missing – open ⚙ Settings", "chýba kľúč – otvorte ⚙ Nastavenia",
     "Schlüssel fehlt – ⚙ Einstellungen öffnen"),
    ("chybí název modelu – otevřete ⚙ Nastavení", "model name missing – open ⚙ Settings",
     "chýba názov modelu – otvorte ⚙ Nastavenia", "Modellname fehlt – ⚙ Einstellungen öffnen"),
    ("adresa {}", "address {}", "adresa {}", "Adresse {}"),
    ("výchozí", "default", "predvolená", "Standard"),
    ("chybí adresa „Překlad dokumentu“ – otevřete Nastavení",
     "„Document translation“ address missing – open Settings",
     "chýba adresa „Preklad dokumentu“ – otvorte Nastavenia",
     "Adresse „Dokumentübersetzung“ fehlt – Einstellungen öffnen"),
    ("Tesseract nenalezen (Nastavení → Součásti)", "Tesseract not found (Settings → Components)",
     "Tesseract sa nenašiel (Nastavenia → Súčasti)", "Tesseract nicht gefunden (Einstellungen → Komponenten)"),
    ("OCR {}: chybí klíč", "OCR {}: key missing", "OCR {}: chýba kľúč", "OCR {}: Schlüssel fehlt"),
    ("model: {}", "model: {}", "model: {}", "Modell: {}"),
    ("Přidat\nsoubory…", "Add\nfiles…", "Pridať\nsúbory…", "Dateien\nhinzufügen…"),
    ("Přidat\nsložku…", "Add\nfolder…", "Pridať\npriečinok…", "Ordner\nhinzufügen…"),
    ("Přidat", "Add", "Pridať", "Hinzufügen"),
    ("Výběr", "Selection", "Výber", "Auswahl"),
    ("Režim", "Mode", "Režim", "Modus"),
    ("Jazyk a formát", "Language and format", "Jazyk a formát", "Sprache und Format"),
    ("Obrázky a OCR", "Images and OCR", "Obrázky a OCR", "Bilder und OCR"),
    ("Text z obrázků a skenů (OCR)", "Text from images and scans (OCR)", "Text z obrázkov a skenov (OCR)",
     "Text aus Bildern und Scans (OCR)"),
    ("Rozpoznávání:", "Recognition:", "Rozpoznávanie:", "Erkennung:"),
    ("Jazyk originálu:", "Source language:", "Jazyk originálu:", "Originalsprache:"),
    ("Obrázky", "Images", "Obrázky", "Bilder"),
    ("Spustit", "Start", "Spustiť", "Starten"),
    ("Spustí překlad / převod všech souborů v seznamu", "Starts translating / converting all files in the list",
     "Spustí preklad / prevod všetkých súborov v zozname", "Startet Übersetzen / Umwandeln aller Dateien der Liste"),
    ("Zastaví po dokončení rozpracovaného souboru", "Stops after the current file is finished",
     "Zastaví po dokončení rozpracovaného súboru", "Stoppt nach der aktuellen Datei"),
    ("Výstupní\nsložka", "Output\nfolder", "Výstupný\npriečinok", "Ausgabe-\nordner"),
    ("Otevře složku s výsledky", "Opens the folder with results", "Otvorí priečinok s výsledkami",
     "Öffnet den Ordner mit den Ergebnissen"),
    ("Přetáhněte sem soubory, nebo je přidejte na kartě Soubory. Pravé tlačítko a klávesa Delete fungují i "
     "v seznamu.", "Drag files here or add them on the Files tab. Right-click and the Delete key also work in the "
     "list.", "Pretiahnite sem súbory alebo ich pridajte na karte Súbory. Pravé tlačidlo a kláves Delete fungujú aj "
     "v zozname.", "Dateien hierher ziehen oder auf der Registerkarte Dateien hinzufügen. Rechtsklick und Entf "
     "funktionieren auch in der Liste."),
    ("Pokyny pro překlad", "Translation instructions", "Pokyny pre preklad", "Übersetzungsanweisungen"),
    ("Nepovinné – glosář, jména, tykání/vykání, styl. Platí pro Claude, Gemini, Ollama a OpenAI-kompatibilní "
     "služby.", "Optional – glossary, names, formal/informal address, style. Applies to Claude, Gemini, Ollama and "
     "OpenAI-compatible services.", "Nepovinné – glosár, mená, tykanie/vykanie, štýl. Platí pre Claude, Gemini, "
     "Ollama a OpenAI-kompatibilné služby.", "Optional – Glossar, Namen, Du/Sie, Stil. Gilt für Claude, Gemini, "
     "Ollama und OpenAI-kompatible Dienste."),
    ("Výsledky se ukládají vedle originálů. Nejdřív přidejte soubory, nebo nastavte výstupní složku v Nastavení → "
     "Obecné.", "Results are saved next to the originals. Add files first, or set an output folder in Settings → "
     "General.", "Výsledky sa ukladajú vedľa originálov. Najprv pridajte súbory alebo nastavte výstupný priečinok "
     "v Nastaveniach → Všeobecné.", "Ergebnisse werden neben den Originalen gespeichert. Fügen Sie zuerst Dateien "
     "hinzu oder legen Sie unter Einstellungen → Allgemein einen Ausgabeordner fest."),
    # ------------------------------------------------------------ stránka Napsat knihu
    ("Soubor", "File", "Súbor", "Datei"),
    ("Žánr a styl", "Genre and style", "Žáner a štýl", "Genre und Stil"),
    ("Rozsah a služba", "Length and service", "Rozsah a služba", "Umfang und Dienst"),
    ("Kniha", "Book", "Kniha", "Buch"),
    ("1. Navrhnout\nosnovu", "1. Suggest\noutline", "1. Navrhnúť\nosnovu", "1. Gliederung\nvorschlagen"),
    ("2. Napsat\nknihu", "2. Write\nthe book", "2. Napísať\nknihu", "2. Buch\nschreiben"),
    ("Zastavit", "Stop", "Zastaviť", "Stopp"),
    ("Upravit\nknihu", "Edit\nbook", "Upraviť\nknihu", "Buch\nbearbeiten"),
    ("AI navrhne název, postavy a obsah kapitol", "AI suggests the title, characters and chapter contents",
     "AI navrhne názov, postavy a obsah kapitol", "Die KI schlägt Titel, Figuren und Kapitelinhalte vor"),
    ("AI napíše knihu kapitolu po kapitole podle osnovy", "AI writes the book chapter by chapter from the outline",
     "AI napíše knihu kapitolu po kapitole podľa osnovy", "Die KI schreibt das Buch Kapitel für Kapitel nach der "
     "Gliederung"),
    ("Zastaví psaní (rozepsaná kniha zůstane uložená)", "Stops writing (the unfinished book stays saved)",
     "Zastaví písanie (rozpísaná kniha zostane uložená)", "Stoppt das Schreiben (das angefangene Buch bleibt "
     "gespeichert)"),
    ("Otevře editor ve stylu Wordu", "Opens the Word-style editor", "Otvorí editor v štýle Wordu",
     "Öffnet den Editor im Word-Stil"),
    ("Nová\nkniha", "New\nbook", "Nová\nkniha", "Neues\nBuch"),
    ("Začít novou knihu (Ctrl+N)", "Start a new book (Ctrl+N)", "Začať novú knihu (Ctrl+N)",
     "Neues Buch beginnen (Strg+N)"),
    ("Otevřít…", "Open…", "Otvoriť…", "Öffnen…"),
    ("Otevřít uloženou nebo rozepsanou knihu *.kniha.json (Ctrl+O)", "Open a saved or unfinished book *.kniha.json "
     "(Ctrl+O)", "Otvoriť uloženú alebo rozpísanú knihu *.kniha.json (Ctrl+O)",
     "Gespeichertes oder angefangenes Buch *.kniha.json öffnen (Strg+O)"),
    ("Uložit", "Save", "Uložiť", "Speichern"),
    ("Uložit knihu – popis, žánr, rozsah i osnovu (Ctrl+S)", "Save the book – description, genre, length and "
     "outline (Ctrl+S)", "Uložiť knihu – popis, žáner, rozsah aj osnovu (Ctrl+S)",
     "Buch speichern – Beschreibung, Genre, Umfang und Gliederung (Strg+S)"),
    ("Uložit\njako…", "Save\nas…", "Uložiť\nako…", "Speichern\nunter…"),
    ("Uložit knihu pod jiným názvem nebo jinam (Ctrl+Shift+S)", "Save the book under another name or elsewhere "
     "(Ctrl+Shift+S)", "Uložiť knihu pod iným názvom alebo inam (Ctrl+Shift+S)",
     "Buch unter anderem Namen oder Ort speichern (Strg+Umschalt+S)"),
    ("Naposledy otevřené", "Recently opened", "Naposledy otvorené", "Zuletzt geöffnet"),
    ("Otevřená kniha", "Open book", "Otvorená kniha", "Geöffnetes Buch"),
    ("Zatím žádné – uložené a otevřené knihy se objeví tady.", "None yet – saved and opened books appear here.",
     "Zatiaľ žiadne – uložené a otvorené knihy sa zobrazia tu.",
     "Noch keine – gespeicherte und geöffnete Bücher erscheinen hier."),
    ("Nová, zatím neuložená kniha.<br>Uloží se sama po návrhu osnovy, nebo klikněte na Uložit.",
     "New, not yet saved book.<br>It is saved automatically after the outline, or click Save.",
     "Nová, zatiaľ neuložená kniha.<br>Uloží sa sama po návrhu osnovy, alebo kliknite na Uložiť.",
     "Neues, noch nicht gespeichertes Buch.<br>Es wird nach der Gliederung automatisch gespeichert, oder "
     "klicken Sie auf Speichern."),
    ("<b>{}</b><br>{}<br>napsáno {} z {} kapitol", "<b>{}</b><br>{}<br>{} of {} chapters written",
     "<b>{}</b><br>{}<br>napísaných {} z {} kapitol", "<b>{}</b><br>{}<br>{} von {} Kapiteln geschrieben"),
    ("Žánr", "Genre", "Žáner", "Genre"),
    ("Vyprávění", "Narration", "Rozprávanie", "Erzählweise"),
    ("Atmosféra", "Atmosphere", "Atmosféra", "Atmosphäre"),
    ("Jazyk a přání", "Language and wishes", "Jazyk a želania", "Sprache und Wünsche"),
    ("Umělá inteligence", "Artificial intelligence", "Umelá inteligencia", "Künstliche Intelligenz"),
    ("Uložit jako", "Save as", "Uložiť ako", "Speichern als"),
    ("Žánr:", "Genre:", "Žáner:", "Genre:"),
    ("Pro koho:", "Audience:", "Pre koho:", "Zielgruppe:"),
    ("Vypravěč:", "Narrator:", "Rozprávač:", "Erzähler:"),
    ("Tempo:", "Pace:", "Tempo:", "Tempo:"),
    ("Tón:", "Tone:", "Tón:", "Ton:"),
    ("Prostředí:", "Setting:", "Prostredie:", "Schauplatz:"),
    ("Jazyk:", "Language:", "Jazyk:", "Sprache:"),
    ("Další přání:", "Other wishes:", "Ďalšie želania:", "Weitere Wünsche:"),
    ("např. hodně dialogů, krátké kapitoly s napínavým koncem",
     "e.g. lots of dialogue, short chapters with cliffhangers",
     "napr. veľa dialógov, krátke kapitoly s napínavým koncom",
     "z. B. viele Dialoge, kurze Kapitel mit spannendem Ende"),
    ("(nevybráno)", "(not selected)", "(nevybrané)", "(nicht ausgewählt)"),
    ("Jazyk knihy:", "Book language:", "Jazyk knihy:", "Sprache des Buchs:"),
    ("Kapitol:", "Chapters:", "Kapitol:", "Kapitel:"),
    ("Slov na kapitolu:", "Words per chapter:", "Slov na kapitolu:", "Wörter pro Kapitel:"),
    ("Služba:", "Service:", "Služba:", "Dienst:"),
    ("Model Claude:", "Claude model:", "Model Claude:", "Claude-Modell:"),
    ("Složka:", "Folder:", "Priečinok:", "Ordner:"),
    ("📁 Vybrat…", "📁 Browse…", "📁 Vybrať…", "📁 Durchsuchen…"),
    ("Složka knih", "Books folder", "Priečinok kníh", "Bücherordner"),
    ("Claude (placené, nejlepší kvalita)", "Claude (paid, best quality)", "Claude (platené, najlepšia kvalita)",
     "Claude (kostenpflichtig, beste Qualität)"),
    ("Google Gemini (bezplatná úroveň s limity)", "Google Gemini (free tier with limits)",
     "Google Gemini (bezplatná úroveň s limitmi)", "Google Gemini (kostenlose Stufe mit Limits)"),
    ("OpenAI-kompatibilní (DeepSeek, OpenAI, Mistral, OpenRouter…)", "OpenAI-compatible (DeepSeek, OpenAI, Mistral, "
     "OpenRouter…)", "OpenAI-kompatibilné (DeepSeek, OpenAI, Mistral, OpenRouter…)",
     "OpenAI-kompatibel (DeepSeek, OpenAI, Mistral, OpenRouter…)"),
    ("Ollama (zdarma, v počítači)", "Ollama (free, on your computer)", "Ollama (zadarmo, v počítači)",
     "Ollama (kostenlos, auf dem Computer)"),
    ("Popis knihy", "Book description", "Popis knihy", "Buchbeschreibung"),
    ("O čem kniha je – stačí kolem 20 vět. Žánr a styl vyberte nahoře v pásu karet.",
     "What the book is about – about 20 sentences are enough. Choose genre and style in the ribbon above.",
     "O čom je kniha – stačí okolo 20 viet. Žáner a štýl vyberte hore na páse kariet.",
     "Worum es im Buch geht – etwa 20 Sätze genügen. Genre und Stil wählen Sie oben im Menüband."),
    ("O čem kniha je, hlavní postavy, prostředí, pro koho je, jak má skončit… (stačí kolem 20 vět)",
     "What the book is about, main characters, setting, audience, how it should end… (about 20 sentences)",
     "O čom je kniha, hlavné postavy, prostredie, pre koho je, ako má skončiť… (stačí okolo 20 viet)",
     "Worum es geht, Hauptfiguren, Schauplatz, Zielgruppe, wie es enden soll… (etwa 20 Sätze)"),
    ("Osnova", "Outline", "Osnova", "Gliederung"),
    ("Kapitoly ve tvaru „1. Název — obsah“. Vznikne tlačítkem „1. Navrhnout osnovu“ a můžete ji upravit. Délku "
     "jedné kapitoly změníte pravým tlačítkem na jejím řádku (v osnově pak „[4000 slov]“).",
     "Chapters as „1. Title — content“. Created with „1. Suggest outline“ and you can edit it. Right-click a "
     "chapter line to change the length of that chapter (shown as „[4000 slov]“).",
     "Kapitoly v tvare „1. Názov — obsah“. Vznikne tlačidlom „1. Navrhnúť osnovu“ a môžete ju upraviť. Dĺžku "
     "jednej kapitoly zmeníte pravým tlačidlom na jej riadku (v osnove potom „[4000 slov]“).",
     "Kapitel als „1. Titel — Inhalt“. Entsteht über „1. Gliederung vorschlagen“ und lässt sich bearbeiten. Die "
     "Länge eines Kapitels ändern Sie per Rechtsklick auf seine Zeile (dann „[4000 slov]“)."),
    ("Sem se vloží osnova po kliknutí na „1. Navrhnout osnovu“. Můžete ji upravit, přidat nebo ubrat kapitoly.",
     "The outline appears here after „1. Suggest outline“. You can edit it, add or remove chapters.",
     "Sem sa vloží osnova po kliknutí na „1. Navrhnúť osnovu“. Môžete ju upraviť, pridať alebo ubrať kapitoly.",
     "Hier erscheint die Gliederung nach „1. Gliederung vorschlagen“. Sie können sie bearbeiten und Kapitel "
     "hinzufügen oder entfernen."),
    ("📏 Délka kapitoly „{}“…", "📏 Length of chapter „{}“…", "📏 Dĺžka kapitoly „{}“…", "📏 Länge von Kapitel „{}“…"),
    ("Použít výchozí délku (Slov na kapitolu)", "Use default length (Words per chapter)",
     "Použiť predvolenú dĺžku (Slov na kapitolu)", "Standardlänge verwenden (Wörter pro Kapitel)"),
    ("Délka kapitoly", "Chapter length", "Dĺžka kapitoly", "Kapitellänge"),
    ("Kolik slov má mít tato kapitola?\n(ostatní kapitoly mají výchozí délku z „Slov na kapitolu“)",
     "How many words should this chapter have?\n(other chapters use the default „Words per chapter“)",
     "Koľko slov má mať táto kapitola?\n(ostatné kapitoly majú predvolenú dĺžku zo „Slov na kapitolu“)",
     "Wie viele Wörter soll dieses Kapitel haben?\n(andere Kapitel nutzen „Wörter pro Kapitel“)"),
    ("Napište popis knihy (aspoň pár vět).", "Write a description of the book (at least a few sentences).",
     "Napíšte popis knihy (aspoň pár viet).", "Schreiben Sie eine Buchbeschreibung (mindestens ein paar Sätze)."),
    ("Navrhuji osnovu…", "Suggesting the outline…", "Navrhujem osnovu…", "Gliederung wird erstellt…"),
    ("✓ Osnova je hotová. Projděte ji, případně upravte, a klikněte na „2. Napsat knihu“.",
     "✓ The outline is ready. Review it, edit if needed, and click „2. Write the book“.",
     "✓ Osnova je hotová. Prejdite ju, prípadne upravte, a kliknite na „2. Napísať knihu“.",
     "✓ Die Gliederung ist fertig. Prüfen und ggf. bearbeiten, dann „2. Buch schreiben“ klicken."),
    ("Osnova uložena: {}", "Outline saved: {}", "Osnova uložená: {}", "Gliederung gespeichert: {}"),
    ("! Osnovu se nepodařilo uložit: {}", "! The outline could not be saved: {}", "! Osnovu sa nepodarilo uložiť: {}",
     "! Gliederung konnte nicht gespeichert werden: {}"),
    ("Kniha je otevřená v editoru – nejdřív ho zavřete.", "The book is open in the editor – close it first.",
     "Kniha je otvorená v editore – najprv ho zatvorte.", "Das Buch ist im Editor geöffnet – schließen Sie ihn zuerst."),
    ("Kniha je otevřená v editoru. Nejdřív editor uložte a zavřete – jinak by se psaní AI a vaše úpravy navzájem "
     "přepsaly.", "The book is open in the editor. Save and close the editor first – otherwise the AI writing and "
     "your edits would overwrite each other.", "Kniha je otvorená v editore. Najprv editor uložte a zatvorte – inak "
     "by sa písanie AI a vaše úpravy navzájom prepísali.", "Das Buch ist im Editor geöffnet. Speichern und schließen "
     "Sie den Editor zuerst – sonst würden sich KI und Ihre Änderungen gegenseitig überschreiben."),
    ("Osnova má {} kapitol, ale v „Rozsah a služba“ je nastaveno {}.\n\nPočet kapitol určuje osnova. Pokračovat "
     "s osnovou tak, jak je?\n\n(Pro jiný počet klikněte na Ne a nechte znovu „1. Navrhnout osnovu“, nebo "
     "kapitoly v osnově přidejte či smažte.)",
     "The outline has {} chapters, but „Length and service“ is set to {}.\n\nThe outline decides the number of "
     "chapters. Continue with the outline as it is?\n\n(For a different number click No and run „1. Suggest "
     "outline“ again, or add/remove chapters in the outline.)",
     "Osnova má {} kapitol, ale v „Rozsah a služba“ je nastavené {}.\n\nPočet kapitol určuje osnova. Pokračovať "
     "s osnovou tak, ako je?\n\n(Pre iný počet kliknite na Nie a nechajte znova „1. Navrhnúť osnovu“, alebo "
     "kapitoly v osnove pridajte či zmažte.)",
     "Die Gliederung hat {} Kapitel, unter „Umfang und Dienst“ sind {} eingestellt.\n\nDie Gliederung bestimmt "
     "die Anzahl. Mit der Gliederung wie sie ist fortfahren?\n\n(Für eine andere Anzahl auf Nein klicken und "
     "„1. Gliederung vorschlagen“ erneut ausführen oder Kapitel hinzufügen/löschen.)"),
    ("Délka kapitoly změněna z {} na {} slov", "Chapter length changed from {} to {} words",
     "Dĺžka kapitoly zmenená z {} na {} slov", "Kapitellänge von {} auf {} Wörter geändert"),
    ("Délka kapitoly změněna z {} na {} slov (platí pro kapitoly, které se teprve napíšou).",
     "Chapter length changed from {} to {} words (applies to chapters not yet written).",
     "Dĺžka kapitoly zmenená z {} na {} slov (platí pre kapitoly, ktoré sa ešte napíšu).",
     "Kapitellänge von {} auf {} Wörter geändert (gilt für noch nicht geschriebene Kapitel)."),
    ("Délka kapitoly změněna z {} na {} slov.", "Chapter length changed from {} to {} words.",
     "Dĺžka kapitoly zmenená z {} na {} slov.", "Kapitellänge von {} auf {} Wörter geändert."),
    ("V osnově jste změnil(a) i kapitoly, které už jsou napsané ({}).",
     "You also changed chapters in the outline that are already written ({}).",
     "V osnove ste zmenili aj kapitoly, ktoré sú už napísané ({}).",
     "Sie haben auch bereits geschriebene Kapitel in der Gliederung geändert ({})."),
    ("Napsané kapitoly můžete ponechat a pokračovat dál, nebo začít psát celou knihu znovu (jako nový soubor – "
     "původní zůstane).", "You can keep the written chapters and continue, or start the whole book again (as a "
     "new file – the original stays).", "Napísané kapitoly môžete ponechať a pokračovať ďalej, alebo začať písať "
     "celú knihu znova (ako nový súbor – pôvodný zostane).", "Sie können die geschriebenen Kapitel behalten und "
     "weitermachen oder das ganze Buch neu beginnen (als neue Datei – das Original bleibt)."),
    ("Ponechat napsané a pokračovat", "Keep written chapters and continue", "Ponechať napísané a pokračovať",
     "Geschriebenes behalten und fortfahren"),
    ("Začít znovu od 1. kapitoly", "Start again from chapter 1", "Začať znova od 1. kapitoly",
     "Neu ab Kapitel 1 beginnen"),
    ("Zrušit", "Cancel", "Zrušiť", "Abbrechen"),
    ("Osnova upravena – {} napsaných kapitol zůstává, pokračuje se kapitolou {}.",
     "Outline updated – {} written chapters are kept, continuing with chapter {}.",
     "Osnova upravená – {} napísaných kapitol zostáva, pokračuje sa kapitolou {}.",
     "Gliederung geändert – {} geschriebene Kapitel bleiben, weiter mit Kapitel {}."),
    ("Všechny kapitoly z osnovy už jsou napsané. Pro další kapitoly je přidejte na konec osnovy.",
     "All chapters of the outline are already written. Add more chapters at the end of the outline.",
     "Všetky kapitoly z osnovy sú už napísané. Ďalšie kapitoly pridajte na koniec osnovy.",
     "Alle Kapitel der Gliederung sind geschrieben. Weitere Kapitel am Ende der Gliederung hinzufügen."),
    ("Napsat {} kapitol?\n\n{}\n\nRozepsaná kniha se průběžně ukládá do:\n{}",
     "Write {} chapters?\n\n{}\n\nThe unfinished book is saved continuously to:\n{}",
     "Napísať {} kapitol?\n\n{}\n\nRozpísaná kniha sa priebežne ukladá do:\n{}",
     "{} Kapitel schreiben?\n\n{}\n\nDas angefangene Buch wird laufend gespeichert in:\n{}"),
    ("Zastaveno. Rozepsaná kniha je uložená – pokračujte tlačítkem „2. Napsat knihu“ nebo později přes "
     "Soubor → Otevřít.", "Stopped. The unfinished book is saved – continue with „2. Write the book“ or "
     "later via File → Open.", "Zastavené. Rozpísaná kniha je uložená – pokračujte tlačidlom „2. Napísať knihu“ "
     "alebo neskôr cez Súbor → Otvoriť.", "Gestoppt. Das angefangene Buch ist gespeichert – mit „2. Buch "
     "schreiben“ fortfahren oder später über Datei → Öffnen."),
    ("Kniha je hotová.\n\n{}\n\nOtevřít ji v editoru?", "The book is finished.\n\n{}\n\nOpen it in the editor?",
     "Kniha je hotová.\n\n{}\n\nOtvoriť ju v editore?", "Das Buch ist fertig.\n\n{}\n\nIm Editor öffnen?"),
    ("Kniha zatím nemá napsanou žádnou kapitolu.", "The book has no written chapter yet.",
     "Kniha zatiaľ nemá napísanú žiadnu kapitolu.", "Das Buch hat noch kein geschriebenes Kapitel."),
    ("Upravit knihu", "Edit book", "Upraviť knihu", "Buch bearbeiten"),
    ("Otevřít knihu", "Open book", "Otvoriť knihu", "Buch öffnen"),
    ("Kniha (*{});;Vše (*.*)", "Book (*{});;All (*.*)", "Kniha (*{});;Všetko (*.*)", "Buch (*{});;Alle (*.*)"),
    ("Kniha (*{})", "Book (*{})", "Kniha (*{})", "Buch (*{})"),
    ("Knihu se nepodařilo otevřít:\n{}", "The book could not be opened:\n{}", "Knihu sa nepodarilo otvoriť:\n{}",
     "Das Buch konnte nicht geöffnet werden:\n{}"),
    ("Otevřeno: {} – napsáno {} z {} kapitol.", "Opened: {} – {} of {} chapters written.",
     "Otvorené: {} – napísaných {} z {} kapitol.", "Geöffnet: {} – {} von {} Kapiteln geschrieben."),
    ("Nová kniha", "New book", "Nová kniha", "Neues Buch"),
    ("Začít novou knihu?\n\nPopis a osnova se vyprázdní. Pokud je chcete zachovat, nejdřív klikněte na Uložit.",
     "Start a new book?\n\nThe description and outline will be cleared. To keep them, click Save first.",
     "Začať novú knihu?\n\nPopis a osnova sa vyprázdnia. Ak ich chcete zachovať, najprv kliknite na Uložiť.",
     "Neues Buch beginnen?\n\nBeschreibung und Gliederung werden geleert. Zum Behalten zuerst Speichern klicken."),
    ("Uložit knihu jako", "Save book as", "Uložiť knihu ako", "Buch speichern unter"),
    ("Uložit knihu", "Save book", "Uložiť knihu", "Buch speichern"),
    ("Knihu se nepodařilo uložit:\n{}", "The book could not be saved:\n{}", "Knihu sa nepodarilo uložiť:\n{}",
     "Das Buch konnte nicht gespeichert werden:\n{}"),
    ("💾 Uloženo: {}", "💾 Saved: {}", "💾 Uložené: {}", "💾 Gespeichert: {}"),
    ("Chybí Claude API klíč – zadejte ho v Nastavení (je tam i Návod).",
     "Claude API key missing – enter it in Settings (there is a Guide too).",
     "Chýba Claude API kľúč – zadajte ho v Nastaveniach (je tam aj Návod).",
     "Claude-API-Schlüssel fehlt – in den Einstellungen eintragen (dort gibt es auch eine Anleitung)."),
]

E += [
    # ------------------------------------------------------------ Nastavení
    ("💾 Uložit nastavení", "💾 Save settings", "💾 Uložiť nastavenia", "💾 Einstellungen speichern"),
    ("Klíče se ukládají zašifrovaně (Windows DPAPI) jen pro váš účet ve Windows.",
     "Keys are stored encrypted (Windows DPAPI) for your Windows account only.",
     "Kľúče sa ukladajú zašifrované (Windows DPAPI) len pre váš účet vo Windows.",
     "Schlüssel werden verschlüsselt (Windows DPAPI) nur für Ihr Windows-Konto gespeichert."),
    ("Nastavení uloženo.", "Settings saved.", "Nastavenia uložené.", "Einstellungen gespeichert."),
    ("Služby a klíče", "Services and keys", "Služby a kľúče", "Dienste und Schlüssel"),
    ("Součásti", "Components", "Súčasti", "Komponenten"),
    ("Obecné", "General", "Všeobecné", "Allgemein"),
    ("📘 Návod", "📘 Guide", "📘 Návod", "📘 Anleitung"),
    ("🌐 Získat klíč / web", "🌐 Get a key / website", "🌐 Získať kľúč / web", "🌐 Schlüssel holen / Website"),
    ("✔ Otestovat", "✔ Test", "✔ Otestovať", "✔ Testen"),
    ("Testuji…", "Testing…", "Testujem…", "Teste…"),
    ("Funguje ✓\n\n{}", "Works ✓\n\n{}", "Funguje ✓\n\n{}", "Funktioniert ✓\n\n{}"),
    ("Test – {}", "Test – {}", "Test – {}", "Test – {}"),
    ("Návod – {}", "Guide – {}", "Návod – {}", "Anleitung – {}"),
    ("Návod není k dispozici.", "No guide available.", "Návod nie je k dispozícii.", "Keine Anleitung verfügbar."),
    ("Zavřít", "Close", "Zavrieť", "Schließen"),
    ("Zobrazit / skrýt", "Show / hide", "Zobraziť / skryť", "Anzeigen / ausblenden"),
    ("API klíč", "API key", "API kľúč", "API-Schlüssel"),
    ("API klíč (končí „:fx“)", "API key (ends with „:fx“)", "API kľúč (končí „:fx“)", "API-Schlüssel (endet auf „:fx“)"),
    ("API klíč (nepovinný)", "API key (optional)", "API kľúč (nepovinný)", "API-Schlüssel (optional)"),
    ("KLÍČ 1", "KEY 1", "KĽÚČ 1", "SCHLÜSSEL 1"),
    ("Umístění/oblast (např. westeurope)", "Location/region (e.g. westeurope)", "Umiestnenie/oblasť (napr. westeurope)",
     "Standort/Region (z. B. westeurope)"),
    ("Překlad dokumentu – adresa (nepovinné)", "Document translation – address (optional)",
     "Preklad dokumentu – adresa (nepovinné)", "Dokumentübersetzung – Adresse (optional)"),
    ("Adresa", "Address", "Adresa", "Adresse"),
    ("Adresa serveru", "Server address", "Adresa servera", "Serveradresse"),
    ("Adresa API", "API address", "Adresa API", "API-Adresse"),
    ("Google Překladač", "Google Translate", "Google Prekladač", "Google Übersetzer"),
    ("Ollama (AI v počítači)", "Ollama (AI on your computer)", "Ollama (AI v počítači)", "Ollama (KI auf dem Computer)"),
    ("OpenAI-kompatibilní (OpenAI, DeepSeek, Mistral, OpenRouter, Groq…)",
     "OpenAI-compatible (OpenAI, DeepSeek, Mistral, OpenRouter, Groq…)",
     "OpenAI-kompatibilné (OpenAI, DeepSeek, Mistral, OpenRouter, Groq…)",
     "OpenAI-kompatibel (OpenAI, DeepSeek, Mistral, OpenRouter, Groq…)"),
    ("Placené podle spotřeby. Klíč: platform.claude.com → API Keys.", "Pay as you go. Key: platform.claude.com → "
     "API Keys.", "Platené podľa spotreby. Kľúč: platform.claude.com → API Keys.",
     "Bezahlung nach Verbrauch. Schlüssel: platform.claude.com → API Keys."),
    ("Zdarma 500 000 znaků/měsíc. Klíč: deepl.com → účet → API Keys.", "Free 500,000 characters/month. Key: "
     "deepl.com → account → API Keys.", "Zadarmo 500 000 znakov/mesiac. Kľúč: deepl.com → účet → API Keys.",
     "Kostenlos 500.000 Zeichen/Monat. Schlüssel: deepl.com → Konto → API Keys."),
    ("Bez registrace. Při velkém množství textu může Google dočasně omezit přístup – program pak počká a pokračuje "
     "(celá kniha se proto překládá pomaleji).",
     "No registration. With large amounts of text Google may temporarily limit access – the program then waits "
     "and continues (a whole book is therefore translated more slowly).",
     "Bez registrácie. Pri veľkom množstve textu môže Google dočasne obmedziť prístup – program potom počká "
     "a pokračuje (celá kniha sa preto prekladá pomalšie).",
     "Ohne Registrierung. Bei großen Textmengen kann Google den Zugriff vorübergehend begrenzen – das Programm "
     "wartet dann und macht weiter (ein ganzes Buch dauert daher länger)."),
    ("Oficiální služba Google: zdarma 500 000 znaků/měsíc, pak asi 20 USD za milion. Vyžaduje účet Google Cloud "
     "s platební kartou.",
     "Official Google service: free 500,000 characters/month, then about USD 20 per million. Requires a Google "
     "Cloud account with a payment card.",
     "Oficiálna služba Google: zadarmo 500 000 znakov/mesiac, potom asi 20 USD za milión. Vyžaduje účet Google "
     "Cloud s platobnou kartou.",
     "Offizieller Google-Dienst: kostenlos 500.000 Zeichen/Monat, danach etwa 20 USD pro Million. Erfordert ein "
     "Google-Cloud-Konto mit Zahlungskarte."),
    ("Google Cloud Translation", "Google Cloud Translation", "Google Cloud Translation", "Google Cloud Translation"),
    ("Google Cloud Translation – zdarma 500 000 znaků/měsíc, s klíčem",
     "Google Cloud Translation – free 500,000 characters/month, with key",
     "Google Cloud Translation – zadarmo 500 000 znakov/mesiac, s kľúčom",
     "Google Cloud Translation – kostenlos 500.000 Zeichen/Monat, mit Schlüssel"),
    ("Zdarma 2 mil. znaků/měsíc (úroveň F0). Azure → Translator → Klíče a koncový bod. „Překlad dokumentu“ je druhé "
     "API – přeloží celý DOCX/PDF/PPTX a zachová vzhled.",
     "Free 2 million characters/month (F0 tier). Azure → Translator → Keys and Endpoint. „Document translation“ is "
     "the second API – it translates whole DOCX/PDF/PPTX files and keeps the layout.",
     "Zadarmo 2 mil. znakov/mesiac (úroveň F0). Azure → Translator → Kľúče a koncový bod. „Preklad dokumentu“ je "
     "druhé API – preloží celý DOCX/PDF/PPTX a zachová vzhľad.",
     "Kostenlos 2 Mio. Zeichen/Monat (Stufe F0). Azure → Translator → Schlüssel und Endpunkt. „Dokumentübersetzung“ "
     "ist die zweite API – übersetzt ganze DOCX/PDF/PPTX und behält das Layout."),
    ("Bezplatná úroveň s limity. Klíč: aistudio.google.com → Get API key.", "Free tier with limits. Key: "
     "aistudio.google.com → Get API key.", "Bezplatná úroveň s limitmi. Kľúč: aistudio.google.com → Get API key.",
     "Kostenlose Stufe mit Limits. Schlüssel: aistudio.google.com → Get API key."),
    ("Offline, zdarma. Nainstalujte Ollama a stáhněte model: ollama pull gemma3:12b", "Offline, free. Install "
     "Ollama and download a model: ollama pull gemma3:12b", "Offline, zadarmo. Nainštalujte Ollama a stiahnite "
     "model: ollama pull gemma3:12b", "Offline, kostenlos. Ollama installieren und Modell laden: ollama pull "
     "gemma3:12b"),
    ("Pro pokročilé: vlastní překladový server (v tomto počítači, na jiném počítači nebo NAS v síti). Pro jeden "
     "počítač je jednodušší „Offline v počítači“ – stejné modely bez serveru.",
     "For advanced users: your own translation server (on this computer, another computer or a NAS on your "
     "network). For a single computer, “Offline on this computer” is simpler – same models, no server.",
     "Pre pokročilých: vlastný prekladový server (v tomto počítači, na inom počítači alebo NAS v sieti). Pre jeden "
     "počítač je jednoduchší „Offline v počítači“ – rovnaké modely bez servera.",
     "Für Fortgeschrittene: eigener Übersetzungsserver (auf diesem Computer, einem anderen Computer oder NAS im "
     "Netzwerk). Für einen einzelnen Computer ist „Offline auf diesem Computer“ einfacher – gleiche Modelle, kein "
     "Server."),
    ("Placené podle spotřeby (DeepSeek je velmi levný, OpenRouter má i modely zdarma). Adresu API a název modelu "
     "najdete v Návodu.", "Pay as you go (DeepSeek is very cheap, OpenRouter also has free models). The API address "
     "and model name are in the Guide.", "Platené podľa spotreby (DeepSeek je veľmi lacný, OpenRouter má aj modely "
     "zadarmo). Adresu API a názov modelu nájdete v Návode.", "Bezahlung nach Verbrauch (DeepSeek ist sehr günstig, "
     "OpenRouter hat auch kostenlose Modelle). API-Adresse und Modellname stehen in der Anleitung."),
    ("Claude Opus 5.5 (nejlepší kvalita)", "Claude Opus 5.5 (best quality)", "Claude Opus 5.5 (najlepšia kvalita)",
     "Claude Opus 5.5 (beste Qualität)"),
    ("Claude Sonnet 5.5 (levnější, rychlejší)", "Claude Sonnet 5.5 (cheaper, faster)",
     "Claude Sonnet 5.5 (lacnejší, rýchlejší)", "Claude Sonnet 5.5 (günstiger, schneller)"),
    ("Claude Haiku 5.5 (nejlevnější)", "Claude Haiku 5.5 (cheapest)", "Claude Haiku 5.5 (najlacnejší)",
     "Claude Haiku 5.5 (am günstigsten)"),
    # překladače a OCR
    ("Claude API – placený, nejlepší kvalita", "Claude API – paid, best quality", "Claude API – platený, najlepšia "
     "kvalita", "Claude API – kostenpflichtig, beste Qualität"),
    ("DeepL API Free – zdarma 500 000 znaků/měsíc", "DeepL API Free – free 500,000 characters/month",
     "DeepL API Free – zadarmo 500 000 znakov/mesiac", "DeepL API Free – kostenlos 500.000 Zeichen/Monat"),
    ("Google Překladač – zdarma, bez klíče (u velkých knih pomaleji)",
     "Google Translate – free, no key (slower for large books)",
     "Google Prekladač – zadarmo, bez kľúča (pri veľkých knihách pomalšie)",
     "Google Übersetzer – kostenlos, ohne Schlüssel (bei großen Büchern langsamer)"),
    ("Microsoft Translator – zdarma 2 mil. znaků/měsíc", "Microsoft Translator – free 2 million characters/month",
     "Microsoft Translator – zadarmo 2 mil. znakov/mesiac", "Microsoft Translator – kostenlos 2 Mio. Zeichen/Monat"),
    ("Microsoft – překlad celých dokumentů se zachováním vzhledu (DOCX, PDF, PPTX…)",
     "Microsoft – whole document translation keeping the layout (DOCX, PDF, PPTX…)",
     "Microsoft – preklad celých dokumentov so zachovaním vzhľadu (DOCX, PDF, PPTX…)",
     "Microsoft – Übersetzung ganzer Dokumente mit Layout (DOCX, PDF, PPTX…)"),
    ("Google Gemini – bezplatná úroveň s limity", "Google Gemini – free tier with limits",
     "Google Gemini – bezplatná úroveň s limitmi", "Google Gemini – kostenlose Stufe mit Limits"),
    ("Ollama – AI v počítači, offline, zdarma", "Ollama – AI on your computer, offline, free",
     "Ollama – AI v počítači, offline, zadarmo", "Ollama – KI auf dem Computer, offline, kostenlos"),
    ("OpenAI-kompatibilní – OpenAI, DeepSeek, Mistral, OpenRouter, Groq…", "OpenAI-compatible – OpenAI, DeepSeek, "
     "Mistral, OpenRouter, Groq…", "OpenAI-kompatibilné – OpenAI, DeepSeek, Mistral, OpenRouter, Groq…",
     "OpenAI-kompatibel – OpenAI, DeepSeek, Mistral, OpenRouter, Groq…"),
    ("LibreTranslate – vlastní server (pro pokročilé), zdarma", "LibreTranslate – own server (advanced), free",
     "LibreTranslate – vlastný server (pre pokročilých), zadarmo",
     "LibreTranslate – eigener Server (für Fortgeschrittene), kostenlos"),
    ("Tesseract – zdarma, offline", "Tesseract – free, offline", "Tesseract – zadarmo, offline",
     "Tesseract – kostenlos, offline"),
    ("Google Gemini – bezplatná úroveň", "Google Gemini – free tier", "Google Gemini – bezplatná úroveň",
     "Google Gemini – kostenlose Stufe"),
    ("Claude – placený, nejlepší", "Claude – paid, best", "Claude – platený, najlepší", "Claude – kostenpflichtig, "
     "am besten"),
    # Součásti
    ("Calibre – převody e-knih (AZW3, KFX, MOBI, RTF…)", "Calibre – e-book conversions (AZW3, KFX, MOBI, RTF…)",
     "Calibre – prevody e-kníh (AZW3, KFX, MOBI, RTF…)", "Calibre – E-Book-Umwandlungen (AZW3, KFX, MOBI, RTF…)"),
    ("Zjišťuji…", "Checking…", "Zisťujem…", "Prüfe…"),
    ("Najít…", "Browse…", "Nájsť…", "Suchen…"),
    ("Nainstalovat plugin KFX Input", "Install KFX Input plugin", "Nainštalovať plugin KFX Input",
     "Plugin KFX Input installieren"),
    ("🌐 Web Calibre", "🌐 Calibre website", "🌐 Web Calibre", "🌐 Calibre-Website"),
    ("Tesseract – čtení textu z obrázků a skenů (OCR)", "Tesseract – reading text from images and scans (OCR)",
     "Tesseract – čítanie textu z obrázkov a skenov (OCR)", "Tesseract – Text aus Bildern und Scans lesen (OCR)"),
    ("Jazyky pro OCR (stáhnou se do složky programu; chybějící i automaticky)",
     "OCR languages (downloaded to the program folder; missing ones also automatically)",
     "Jazyky pre OCR (stiahnu sa do priečinka programu; chýbajúce aj automaticky)",
     "OCR-Sprachen (werden in den Programmordner geladen; fehlende auch automatisch)"),
    ("Stáhnout zaškrtnuté jazyky", "Download checked languages", "Stiahnuť zaškrtnuté jazyky",
     "Markierte Sprachen herunterladen"),
    ("Jazyky OCR", "OCR languages", "Jazyky OCR", "OCR-Sprachen"),
    ("Zaškrtněte jazyky, které chcete stáhnout.", "Check the languages you want to download.",
     "Zaškrtnite jazyky, ktoré chcete stiahnuť.", "Markieren Sie die Sprachen zum Herunterladen."),
    ("✓ Jazyky staženy.", "✓ Languages downloaded.", "✓ Jazyky stiahnuté.", "✓ Sprachen heruntergeladen."),
    ("✓ Hotovo.", "✓ Done.", "✓ Hotovo.", "✓ Fertig."),
    ("Najděte {}", "Locate {}", "Nájdite {}", "{} suchen"),
    ("{} ({}*);;Vše (*.*)", "{} ({}*);;All (*.*)", "{} ({}*);;Všetko (*.*)", "{} ({}*);;Alle (*.*)"),
    ("přibalené k programu", "bundled with the program", "pribalené k programu", "im Programm enthalten"),
    ("Calibre nebylo nalezeno – je součástí instalátoru", "Calibre not found – it is part of the installer",
     "Calibre sa nenašlo – je súčasťou inštalátora", "Calibre nicht gefunden – es ist im Installer enthalten"),
    ("Tesseract nebyl nalezen – je součástí instalátoru", "Tesseract not found – it is part of the installer",
     "Tesseract sa nenašiel – je súčasťou inštalátora", "Tesseract nicht gefunden – es ist im Installer enthalten"),
    ("Calibre {}", "Calibre {}", "Calibre {}", "Calibre {}"),
    ("plugin KFX Input je nainstalovaný", "KFX Input plugin is installed", "plugin KFX Input je nainštalovaný",
     "Plugin KFX Input ist installiert"),
    ("chybí plugin KFX Input (nainstaluje se i sám při prvním KFX)", "KFX Input plugin missing (installs itself "
     "with the first KFX)", "chýba plugin KFX Input (nainštaluje sa aj sám pri prvom KFX)",
     "Plugin KFX Input fehlt (installiert sich beim ersten KFX selbst)"),
    ("plugin KFX Input nelze ověřit", "KFX Input plugin cannot be verified", "plugin KFX Input nemožno overiť",
     "Plugin KFX Input kann nicht geprüft werden"),
    ("Tesseract nalezen", "Tesseract found", "Tesseract nájdený", "Tesseract gefunden"),
    ("jazyky: {}", "languages: {}", "jazyky: {}", "Sprachen: {}"),
    ("žádné", "none", "žiadne", "keine"),
    ("angličtina", "English", "angličtina", "Englisch"), ("čeština", "Czech", "čeština", "Tschechisch"),
    ("slovenština", "Slovak", "slovenčina", "Slowakisch"), ("němčina", "German", "nemčina", "Deutsch"),
    ("polština", "Polish", "poľština", "Polnisch"), ("francouzština", "French", "francúzština", "Französisch"),
    ("španělština", "Spanish", "španielčina", "Spanisch"), ("italština", "Italian", "taliančina", "Italienisch"),
    ("ruština", "Russian", "ruština", "Russisch"), ("ukrajinština", "Ukrainian", "ukrajinčina", "Ukrainisch"),
    ("maďarština", "Hungarian", "maďarčina", "Ungarisch"), ("nizozemština", "Dutch", "holandčina", "Niederländisch"),
    ("portugalština", "Portuguese", "portugalčina", "Portugiesisch"), ("japonština", "Japanese", "japončina",
                                                                        "Japanisch"),
    ("čínština (zjednodušená)", "Chinese (simplified)", "čínština (zjednodušená)", "Chinesisch (vereinfacht)"),
    # Obecné
    ("Výstupní složka:", "Output folder:", "Výstupný priečinok:", "Ausgabeordner:"),
    ("Výstupní složka", "Output folder", "Výstupný priečinok", "Ausgabeordner"),
    ("prázdné = výsledek se uloží vedle originálu", "empty = result is saved next to the original",
     "prázdne = výsledok sa uloží vedľa originálu", "leer = Ergebnis neben dem Original speichern"),
    ("Vybrat…", "Browse…", "Vybrať…", "Durchsuchen…"),
    ("Automatické ukládání v editoru knihy", "Autosave in the book editor", "Automatické ukladanie v editore knihy",
     "Automatisches Speichern im Bucheditor"),
    ("Ukládat:", "Save:", "Ukladať:", "Speichern:"),
    ("Interval:", "Interval:", "Interval:", "Intervall:"),
    ("Počet znaků:", "Characters:", "Počet znakov:", "Zeichenanzahl:"),
    (" znaků", " characters", " znakov", " Zeichen"),
    ("Po každé větě", "After every sentence", "Po každej vete", "Nach jedem Satz"),
    ("Po každém slově", "After every word", "Po každom slove", "Nach jedem Wort"),
    ("Po zadaném počtu znaků", "After a number of characters", "Po zadanom počte znakov", "Nach einer Zeichenanzahl"),
    ("Každých N sekund", "Every N seconds", "Každých N sekúnd", "Alle N Sekunden"),
    ("Vypnuto (jen ručně Ctrl+S)", "Off (only manually Ctrl+S)", "Vypnuté (len ručne Ctrl+S)",
     "Aus (nur manuell Strg+S)"),
    ("Na disk se zapisuje nejvýš jednou za 2 sekundy, i když píšete rychle. Předchozí verze zůstává jako záloha "
     "„*.kniha.json.bak“. Psaní knihy přes AI ukládá samo po každé kapitole; dokud je kniha otevřená v editoru, AI "
     "do ní nepíše.", "The disk is written at most once every 2 seconds, even when typing fast. The previous version "
     "stays as a backup „*.kniha.json.bak“. AI writing saves after every chapter; while the book is open in the "
     "editor, the AI does not write into it.", "Na disk sa zapisuje najviac raz za 2 sekundy, aj keď píšete rýchlo. "
     "Predchádzajúca verzia zostáva ako záloha „*.kniha.json.bak“. Písanie knihy cez AI ukladá samo po každej "
     "kapitole; kým je kniha otvorená v editore, AI do nej nepíše.", "Es wird höchstens alle 2 Sekunden gespeichert, "
     "auch beim schnellen Tippen. Die vorige Version bleibt als Sicherung „*.kniha.json.bak“. KI-Schreiben speichert "
     "nach jedem Kapitel; solange das Buch im Editor geöffnet ist, schreibt die KI nicht hinein."),
    ("Verze programu: {}", "Program version: {}", "Verzia programu: {}", "Programmversion: {}"),
    ("🌐 Zkontrolovat novou verzi", "🌐 Check for a new version", "🌐 Skontrolovať novú verziu",
     "🌐 Nach neuer Version suchen"),
    ("Při spuštění zkontrolovat, zda je k dispozici nová verze", "Check for a new version at startup",
     "Pri spustení skontrolovať, či je k dispozícii nová verzia", "Beim Start nach einer neuen Version suchen"),
    ("Psaní textu (editor knihy, popis a osnova)", "Writing text (book editor, description and outline)",
     "Písanie textu (editor knihy, popis a osnova)", "Texteingabe (Bucheditor, Beschreibung und Gliederung)"),
    ("Kontrola pravopisu – chybná slova červeně podtrhnout", "Spell check – underline misspelled words in red",
     "Kontrola pravopisu – chybné slová podčiarknuť červeno", "Rechtschreibprüfung – Fehler rot unterstreichen"),
    ("Návrhy slov při psaní (T9) – Tab vloží návrh, šipkami vyberete jiný",
     "Word suggestions while typing (T9) – Tab inserts, arrows choose another",
     "Návrhy slov pri písaní (T9) – Tab vloží návrh, šípkami vyberiete iný",
     "Wortvorschläge beim Tippen (T9) – Tab fügt ein, Pfeile wählen einen anderen"),
    ("Velké písmeno na začátku věty (po tečce, otazníku, vykřičníku)", "Capital letter at the start of a sentence "
     "(after a full stop, question or exclamation mark)", "Veľké písmeno na začiatku vety (po bodke, otázniku, "
     "výkričníku)", "Großbuchstabe am Satzanfang (nach Punkt, Frage- oder Ausrufezeichen)"),
    ("Pravým tlačítkem na podtržené slovo nabídne opravy, „Přidat do slovníku“ si slovo zapamatuje (jména postav "
     "apod.). Kontrola se zapíná jen u knih v češtině.", "Right-click an underlined word for corrections; „Add to "
     "dictionary“ remembers the word (character names etc.). The check uses the Czech dictionary and is only on "
     "for books in Czech.", "Pravým tlačidlom na podčiarknuté slovo ponúkne opravy, „Pridať do slovníka“ si slovo "
     "zapamätá (mená postáv a pod.). Kontrola používa český slovník a zapína sa len pri knihách v češtine.",
     "Rechtsklick auf ein unterstrichenes Wort zeigt Korrekturen; „Zum Wörterbuch hinzufügen“ merkt sich das Wort "
     "(Figurennamen usw.). Die Prüfung nutzt das tschechische Wörterbuch und gilt nur für tschechische Bücher."),
    ("⬇ Stáhnout český slovník", "⬇ Download Czech dictionary", "⬇ Stiahnuť český slovník",
     "⬇ Tschechisches Wörterbuch laden"),
    ("Stahuji a načítám slovník…", "Downloading and loading the dictionary…", "Sťahujem a načítavam slovník…",
     "Wörterbuch wird geladen…"),
    ("✓ Český slovník je načtený.", "✓ Czech dictionary loaded.", "✓ Český slovník je načítaný.",
     "✓ Tschechisches Wörterbuch geladen."),
    ("Slovník se načítá…", "Loading dictionary…", "Slovník sa načítava…", "Wörterbuch wird geladen…"),
    ("✓ Český slovník je nainstalovaný.", "✓ Czech dictionary installed.", "✓ Český slovník je nainštalovaný.",
     "✓ Tschechisches Wörterbuch installiert."),
    ("Český slovník chybí (je součástí instalátoru, nebo ho stáhněte).", "Czech dictionary missing (part of the "
     "installer, or download it).", "Český slovník chýba (je súčasťou inštalátora, alebo ho stiahnite).",
     "Tschechisches Wörterbuch fehlt (im Installer enthalten oder herunterladen)."),
    ("✗ Slovník se nepodařilo načíst: {}", "✗ The dictionary could not be loaded: {}",
     "✗ Slovník sa nepodarilo načítať: {}", "✗ Wörterbuch konnte nicht geladen werden: {}"),
    ("Nastavení programu: {}", "Program settings: {}", "Nastavenia programu: {}", "Programmeinstellungen: {}"),
    # jazyk programu
    ("Jazyk programu", "Program language", "Jazyk programu", "Programmsprache"),
    ("Jazyk programu:", "Program language:", "Jazyk programu:", "Programmsprache:"),
    ("⬇ Stáhnout další jazyky…", "⬇ Download more languages…", "⬇ Stiahnuť ďalšie jazyky…",
     "⬇ Weitere Sprachen laden…"),
    ("Jazyk se změní po restartu programu. Restartovat teď?", "The language changes after restarting the program. "
     "Restart now?", "Jazyk sa zmení po reštarte programu. Reštartovať teraz?",
     "Die Sprache ändert sich nach einem Neustart. Jetzt neu starten?"),
    ("Vyberte jazyk ke stažení:", "Choose a language to download:", "Vyberte jazyk na stiahnutie:",
     "Sprache zum Herunterladen wählen:"),
    ("Žádné další jazyky ke stažení nejsou.", "There are no more languages to download.",
     "Žiadne ďalšie jazyky na stiahnutie nie sú.", "Keine weiteren Sprachen verfügbar."),
    ("Jazyky se nepodařilo stáhnout:\n{}", "Languages could not be downloaded:\n{}",
     "Jazyky sa nepodarilo stiahnuť:\n{}", "Sprachen konnten nicht heruntergeladen werden:\n{}"),
    ("✓ Jazyk {} je nainstalovaný.", "✓ Language {} installed.", "✓ Jazyk {} je nainštalovaný.",
     "✓ Sprache {} installiert."),
    ("Texty programu; návody ke službám a podrobné chybové hlášky zůstávají česky.", "Program texts; service guides "
     "and detailed error messages stay in Czech.", "Texty programu; návody k službám a podrobné chybové hlásenia "
     "zostávajú po česky.", "Programmtexte; Dienstanleitungen und detaillierte Fehlermeldungen bleiben tschechisch."),
    # offline překlad
    ("Offline v počítači (Argos) – zdarma, bez internetu", "Offline on your computer (Argos) – free, no internet",
     "Offline v počítači (Argos) – zadarmo, bez internetu", "Offline auf dem Computer (Argos) – kostenlos, ohne "
     "Internet"),
    ("Offline překlad – v počítači, bez internetu (Argos Translate)", "Offline translation – on your computer, no "
     "internet (Argos Translate)", "Offline preklad – v počítači, bez internetu (Argos Translate)",
     "Offline-Übersetzung – auf dem Computer, ohne Internet (Argos Translate)"),
    ("Zdarma a bez odesílání textu. Kvalita je nižší než u DeepL nebo Google. Každý balíček má kolem 100 MB. Když "
     "přímý pár chybí, překládá se přes angličtinu (např. němčina → angličtina → čeština) – stačí balíčky „… → "
     "angličtina“ a „angličtina → čeština“.", "Free and without sending text anywhere. Quality is lower than DeepL or "
     "Google. Each package is about 100 MB. If a direct pair is missing, translation goes via English (e.g. German "
     "→ English → Czech) – the packages „… → English“ and „English → Czech“ are enough.",
     "Zadarmo a bez odosielania textu. Kvalita je nižšia ako pri DeepL alebo Google. Každý balík má okolo 100 MB. "
     "Keď priamy pár chýba, prekladá sa cez angličtinu (napr. nemčina → angličtina → čeština) – stačia balíky „… → "
     "angličtina“ a „angličtina → čeština“.", "Kostenlos und ohne Text zu versenden. Qualität geringer als DeepL "
     "oder Google. Jedes Paket hat etwa 100 MB. Fehlt ein direktes Paar, wird über Englisch übersetzt (z. B. "
     "Deutsch → Englisch → Tschechisch) – es genügen „… → Englisch“ und „Englisch → Tschechisch“."),
    ("⬇ Stáhnout zaškrtnuté balíčky", "⬇ Download checked packages", "⬇ Stiahnuť zaškrtnuté balíky",
     "⬇ Markierte Pakete herunterladen"),
    ("🗑 Odebrat zaškrtnuté", "🗑 Remove checked", "🗑 Odobrať zaškrtnuté", "🗑 Markierte entfernen"),
    ("nainstalováno: {}", "installed: {}", "nainštalované: {}", "installiert: {}"),
    ("zatím žádný balíček – zaškrtněte a stáhněte", "no package yet – check and download",
     "zatiaľ žiadny balík – zaškrtnite a stiahnite", "noch kein Paket – markieren und herunterladen"),
    ("Offline překlad", "Offline translation", "Offline preklad", "Offline-Übersetzung"),
    ("Zaškrtněte balíčky, které ještě nemáte.", "Check packages you do not have yet.",
     "Zaškrtnite balíky, ktoré ešte nemáte.", "Markieren Sie Pakete, die noch fehlen."),
    ("Odebrat zaškrtnuté offline balíčky z počítače?", "Remove the checked offline packages from this computer?",
     "Odobrať zaškrtnuté offline balíky z počítača?", "Markierte Offline-Pakete vom Computer entfernen?"),
    ("✓ Offline balíčky staženy.", "✓ Offline packages downloaded.", "✓ Offline balíky stiahnuté.",
     "✓ Offline-Pakete heruntergeladen."),
    ("chybí offline balíček – ⚙ Nastavení → Součásti → Offline překlad", "offline package missing – ⚙ Settings → "
     "Components → Offline translation", "chýba offline balík – ⚙ Nastavenia → Súčasti → Offline preklad",
     "Offline-Paket fehlt – ⚙ Einstellungen → Komponenten → Offline-Übersetzung"),
    ("offline: {}", "offline: {}", "offline: {}", "offline: {}"),
    ("{} → {}", "{} → {}", "{} → {}", "{} → {}"),
    # editor – karta Soubor
    ("Uložit jako…", "Save as…", "Uložiť ako…", "Speichern unter…"),
    ("Uložit knihu do jednoho souboru: DOCX, PDF, MOBI, EPUB, AZW3, ODT, TXT, nebo jako projekt *.kniha.json "
     "(Ctrl+Shift+S)", "Save the book to one file: DOCX, PDF, MOBI, EPUB, AZW3, ODT, TXT, or as a *.kniha.json "
     "project (Ctrl+Shift+S)", "Uložiť knihu do jedného súboru: DOCX, PDF, MOBI, EPUB, AZW3, ODT, TXT, alebo ako "
     "projekt *.kniha.json (Ctrl+Shift+S)", "Buch in eine Datei speichern: DOCX, PDF, MOBI, EPUB, AZW3, ODT, TXT "
     "oder als Projekt *.kniha.json (Strg+Umschalt+S)"),
    ("Náhled tisku", "Print preview", "Náhľad tlače", "Druckvorschau"),
    ("Okno", "Window", "Okno", "Fenster"),
    ("← Zpět", "← Back", "← Späť", "← Zurück"),
    ("Calibre – volitelné, jen pro zápis AZW3, KFX a LIT", "Calibre – optional, only for writing AZW3, KFX and LIT",
     "Calibre – voliteľné, len pre zápis AZW3, KFX a LIT", "Calibre – optional, nur zum Schreiben von AZW3, KFX und LIT"),
    ("⬇ Stáhnout Calibre", "⬇ Download Calibre", "⬇ Stiahnuť Calibre", "⬇ Calibre herunterladen"),
    ("Calibre je zdarma (licence GPL v3). Po instalaci ho Překladač najde sám.",
     "Calibre is free (GPL v3 licence). After installation Translator finds it automatically.",
     "Calibre je zadarmo (licencia GPL v3). Po inštalácii ho Prekladač nájde sám.",
     "Calibre ist kostenlos (GPL v3). Nach der Installation findet der Übersetzer es automatisch."),
    ("Calibre není nainstalované – všechny běžné formáty převádí Překladač sám; Calibre je potřeba jen pro zápis "
     "AZW3, KFX a LIT",
     "Calibre is not installed – Translator converts all common formats itself; Calibre is needed only for writing "
     "AZW3, KFX and LIT",
     "Calibre nie je nainštalované – všetky bežné formáty prevádza Prekladač sám; Calibre je potrebné len pre zápis "
     "AZW3, KFX a LIT",
     "Calibre ist nicht installiert – alle gängigen Formate konvertiert der Übersetzer selbst; Calibre wird nur zum "
     "Schreiben von AZW3, KFX und LIT benötigt"),
    ("FB2 – FictionBook (*.fb2)", "FB2 – FictionBook (*.fb2)", "FB2 – FictionBook (*.fb2)", "FB2 – FictionBook (*.fb2)"),
    ("HTMLZ – web stránka v ZIP (*.htmlz)", "HTMLZ – web page in ZIP (*.htmlz)", "HTMLZ – webová stránka v ZIP (*.htmlz)",
     "HTMLZ – Webseite im ZIP (*.htmlz)"),
    ("Převedeno bez Calibre: {} → {} ({} kapitol, {} obrázků)", "Converted without Calibre: {} → {} ({} chapters, {} images)",
     "Prevedené bez Calibre: {} → {} ({} kapitol, {} obrázkov)", "Ohne Calibre konvertiert: {} → {} ({} Kapitel, {} Bilder)"),
    ("PDB – PalmDoc (*.pdb)", "PDB – PalmDoc (*.pdb)", "PDB – PalmDoc (*.pdb)", "PDB – PalmDoc (*.pdb)"),
    ("AZW3 – Kindle, jen s Calibre (*.azw3)", "AZW3 – Kindle, Calibre only (*.azw3)", "AZW3 – Kindle, len s Calibre (*.azw3)",
     "AZW3 – Kindle, nur mit Calibre (*.azw3)"),
    ("RTF – Rich Text, jen s Calibre (*.rtf)", "RTF – Rich Text, Calibre only (*.rtf)", "RTF – Rich Text, len s Calibre (*.rtf)",
     "RTF – Rich Text, nur mit Calibre (*.rtf)"),
    ("Soubor není projekt knihy z Překladače.", "The file is not a book project from Translator.",
     "Súbor nie je projekt knihy z Prekladača.", "Die Datei ist kein Buchprojekt des Übersetzers."),
    ("Otevírám knihu {} – rozděluji na kapitoly…", "Opening the book {} – splitting it into chapters…",
     "Otváram knihu {} – rozdeľujem na kapitoly…", "Öffne das Buch {} – teile es in Kapitel auf…"),
    ("✓ Kniha {} načtena: {} kapitol. Uložena jako projekt {} – upravíte ji tlačítkem Upravit knihu.",
     "✓ Book {} loaded: {} chapters. Saved as project {} – edit it with Edit book.",
     "✓ Kniha {} načítaná: {} kapitol. Uložená ako projekt {} – upravíte ju tlačidlom Upraviť knihu.",
     "✓ Buch {} geladen: {} Kapitel. Als Projekt {} gespeichert – bearbeiten mit „Buch bearbeiten“."),
    ("Kniha má {} kapitol a je uložená jako projekt:\n{}\n\nOtevřít ji v editoru?",
     "The book has {} chapters and is saved as a project:\n{}\n\nOpen it in the editor?",
     "Kniha má {} kapitol a je uložená ako projekt:\n{}\n\nOtvoriť ju v editore?",
     "Das Buch hat {} Kapitel und ist als Projekt gespeichert:\n{}\n\nIm Editor öffnen?"),
    ("Celá šířka", "Full width", "Celá šírka", "Ganze Breite"),
    ("Stránka přes celou šířku okna – bez šedých okrajů kolem stránky",
     "Page across the full window width – no grey margins around the page",
     "Stránka na celú šírku okna – bez sivých okrajov okolo stránky",
     "Seite über die ganze Fensterbreite – ohne graue Ränder um die Seite"),
    ("Další tlačítka pásu karet", "More ribbon buttons", "Ďalšie tlačidlá pásu kariet", "Weitere Schaltflächen"),
    ("Zobrazit nebo skrýt panel kapitol (F9)", "Show or hide the chapters panel (F9)",
     "Zobraziť alebo skryť panel kapitol (F9)", "Kapitelleiste ein- oder ausblenden (F9)"),
    ("Předchozí kapitola (Ctrl+PgUp)", "Previous chapter (Ctrl+PgUp)", "Predchádzajúca kapitola (Ctrl+PgUp)",
     "Vorheriges Kapitel (Strg+Bild↑)"),
    ("Další kapitola (Ctrl+PgDown)", "Next chapter (Ctrl+PgDown)", "Ďalšia kapitola (Ctrl+PgDown)",
     "Nächstes Kapitel (Strg+Bild↓)"),
    ("Stránka přes celou šířku okna (bez šedých okrajů)", "Page across the full window width (no grey margins)",
     "Stránka na celú šírku okna (bez sivých okrajov)", "Seite über die ganze Fensterbreite (ohne graue Ränder)"),
    ("Zobrazit záznam průběhu dole", "Show the progress log at the bottom", "Zobraziť záznam priebehu dole",
     "Fortschrittsprotokoll unten anzeigen"),
    ("Když je vypnutý, při práci se ukáže jen proužek s poslední zprávou; při chybě se záznam ukáže sám.",
     "When off, only a strip with the latest message is shown while working; the log appears by itself on an "
     "error.",
     "Keď je vypnutý, pri práci sa ukáže len pásik s poslednou správou; pri chybe sa záznam ukáže sám.",
     "Wenn aus, erscheint bei der Arbeit nur ein Streifen mit der letzten Meldung; bei einem Fehler wird das "
     "Protokoll von selbst angezeigt."),
    ("Hlavní okno", "Main window", "Hlavné okno", "Hauptfenster"),
    ("Uložit knihu a vrátit se na stránku Napsat knihu (Alt+←)",
     "Save the book and return to the Write a book page (Alt+←)",
     "Uložiť knihu a vrátiť sa na stránku Napísať knihu (Alt+←)",
     "Buch speichern und zur Seite „Buch schreiben“ zurückkehren (Alt+←)"),
    ("Panel kapitol", "Chapters panel", "Panel kapitol", "Kapitelleiste"),
    ("Zobrazit / skrýt seznam kapitol vlevo (F9)", "Show / hide the chapter list on the left (F9)",
     "Zobraziť / skryť zoznam kapitol vľavo (F9)", "Kapitelliste links ein-/ausblenden (F9)"),
    ("Projekt knihy (*{})", "Book project (*{})", "Projekt knihy (*{})", "Buchprojekt (*{})"),
    ("Word (*.docx)", "Word (*.docx)", "Word (*.docx)", "Word (*.docx)"),
    ("EPUB – e-kniha (*.epub)", "EPUB – e-book (*.epub)", "EPUB – e-kniha (*.epub)", "EPUB – E-Book (*.epub)"),
    ("OpenDocument – LibreOffice (*.odt)", "OpenDocument – LibreOffice (*.odt)", "OpenDocument – LibreOffice (*.odt)",
     "OpenDocument – LibreOffice (*.odt)"),
    ("Prostý text (*.txt)", "Plain text (*.txt)", "Obyčajný text (*.txt)", "Reiner Text (*.txt)"),
    ("Ukládám…", "Saving…", "Ukladám…", "Speichere…"),
    ("Uloženo jako {}", "Saved as {}", "Uložené ako {}", "Gespeichert als {}"),
    ("Uloženo: {}", "Saved: {}", "Uložené: {}", "Gespeichert: {}"),
    ("Uložit jako…", "Save as…", "Uložiť ako…", "Speichern unter…"),
    # obrázky a obálka
    ("Vložení", "Insert", "Vloženie", "Einfügen"),
    ("Obrázek", "Picture", "Obrázok", "Bild"),
    ("Vložit obrázek ze souboru (JPG, PNG…). Jde i Ctrl+V ze schránky nebo přetažením myší. Můžete vybrat i více "
     "obrázků – první se nabídne jako obálka. Velikost, ořez, otočení a celou stránku nastavíte pravým tlačítkem na "
     "obrázku.", "Insert pictures from files (JPG, PNG…). Ctrl+V from the clipboard or drag and drop also works. You "
     "can pick several pictures – the first one is offered as the cover. Right-click a picture for size, crop, "
     "rotation and full page.", "Vložiť obrázok zo súboru (JPG, PNG…). Ide aj Ctrl+V zo schránky alebo "
     "pretiahnutím myšou. Môžete vybrať aj viac obrázkov – prvý sa ponúkne ako obálka. Veľkosť, orez, otočenie a "
     "celú stranu nastavíte pravým tlačidlom na obrázku.", "Bilder aus Dateien einfügen (JPG, PNG…). Auch Strg+V "
     "oder Drag & Drop. Sie können mehrere Bilder wählen – das erste wird als Umschlag angeboten. Größe, "
     "Zuschnitt, Drehung und ganze Seite per Rechtsklick auf das Bild."),
    ("Malý (35 %)", "Small (35 %)", "Malý (35 %)", "Klein (35 %)"),
    ("Střední (55 %)", "Medium (55 %)", "Stredný (55 %)", "Mittel (55 %)"),
    ("Velký (85 %)", "Large (85 %)", "Veľký (85 %)", "Groß (85 %)"),
    ("⛶ Roztáhnout na celou stránku", "⛶ Stretch to full page", "⛶ Roztiahnuť na celú stranu", "⛶ Auf ganze Seite"),
    ("✂ Vyjmout část (oříznout)…", "✂ Crop…", "✂ Vystrihnúť časť (orezať)…", "✂ Zuschneiden…"),
    ("⟳ Otočit doprava", "⟳ Rotate right", "⟳ Otočiť doprava", "⟳ Nach rechts drehen"),
    ("⟲ Otočit doleva", "⟲ Rotate left", "⟲ Otočiť doľava", "⟲ Nach links drehen"),
    ("📕 Použít jako obálku", "📕 Use as cover", "📕 Použiť ako obálku", "📕 Als Umschlag verwenden"),
    ("Vložit obrázky", "Insert pictures", "Vložiť obrázky", "Bilder einfügen"),
    ("Kniha zatím nemá obálku. Použít první obrázek jako obálku?", "The book has no cover yet. Use the first "
     "picture as the cover?", "Kniha zatiaľ nemá obálku. Použiť prvý obrázok ako obálku?", "Das Buch hat noch "
     "keinen Umschlag. Das erste Bild als Umschlag verwenden?"),
    ("📕 Jako obálku", "📕 As cover", "📕 Ako obálku", "📕 Als Umschlag"),
    ("Vložit do textu", "Insert into text", "Vložiť do textu", "In den Text einfügen"),
    ("Vložit další obrázky ({}) do textu na místo kurzoru?", "Insert the other pictures ({}) into the text at the "
     "cursor?", "Vložiť ďalšie obrázky ({}) do textu na miesto kurzora?", "Die weiteren Bilder ({}) an der "
     "Cursorposition einfügen?"),
    ("Obrázek se nepodařilo oříznout:\n{}", "The picture could not be cropped:\n{}",
     "Obrázok sa nepodarilo orezať:\n{}", "Das Bild konnte nicht zugeschnitten werden:\n{}"),
    ("Obálka jen s názvem a autorem (kniha nemá obrázek obálky)", "Cover with title and author only (the book has "
     "no cover picture)", "Obálka len s názvom a autorom (kniha nemá obrázok obálky)", "Umschlag nur mit Titel und "
     "Autor (das Buch hat kein Umschlagbild)"),
    ("Vyjmout část obrázku", "Crop picture", "Vystrihnúť časť obrázka", "Bild zuschneiden"),
    ("Celý", "Whole", "Celý", "Ganz"),
    ("Okraje −5 %", "Margins −5 %", "Okraje −5 %", "Ränder −5 %"),
    ("Okraje −10 %", "Margins −10 %", "Okraje −10 %", "Ränder −10 %"),
    ("Obálka 2:3", "Cover 2:3", "Obálka 2:3", "Umschlag 2:3"),
    ("Čtverec", "Square", "Štvorec", "Quadrat"),
    ("Na šířku 3:2", "Landscape 3:2", "Na šírku 3:2", "Querformat 3:2"),
    ("Tažením myší označte část obrázku, která má zůstat.", "Drag with the mouse to mark the part of the picture "
     "to keep.", "Ťahaním myši označte časť obrázka, ktorá má zostať.", "Ziehen Sie mit der Maus den Bildteil "
     "auf, der bleiben soll."),
    ("Obálka", "Cover", "Obálka", "Umschlag"),
    ("Obálka…", "Cover…", "Obálka…", "Umschlag…"),
    ("Obrázek obálky: v EPUB, MOBI a AZW3 jako obálka e-knihy ve čtečce, v DOCX, PDF a tisku jako první strana.",
     "Cover picture: in EPUB, MOBI and AZW3 as the e-book cover in the reader, in DOCX, PDF and print as the first "
     "page.", "Obrázok obálky: v EPUB, MOBI a AZW3 ako obálka e-knihy v čítačke, v DOCX, PDF a tlači ako prvá "
     "strana.", "Umschlagbild: in EPUB, MOBI und AZW3 als E-Book-Cover im Reader, in DOCX, PDF und Druck als erste "
     "Seite."),
    ("Odebrat obálku", "Remove cover", "Odobrať obálku", "Umschlag entfernen"),
    ("bez\nobálky", "no\ncover", "bez\nobálky", "kein\nUmschlag"),
    ("Obálka knihy", "Book cover", "Obálka knihy", "Buchumschlag"),
    ("Obrázek obálky", "Cover picture", "Obrázok obálky", "Umschlagbild"),
    ("Vložit obrázek", "Insert picture", "Vložiť obrázok", "Bild einfügen"),
    ("🖼 Vložit obrázek…", "🖼 Insert picture…", "🖼 Vložiť obrázok…", "🖼 Bild einfügen…"),
    ("🖼 Obrázek", "🖼 Picture", "🖼 Obrázok", "🖼 Bild"),
    ("Šířka {} %", "Width {} %", "Šírka {} %", "Breite {} %"),
    ("Vlastní šířka…", "Custom width…", "Vlastná šírka…", "Eigene Breite…"),
    ("Nahradit obrázek…", "Replace picture…", "Nahradiť obrázok…", "Bild ersetzen…"),
    ("Nahradit obrázek", "Replace picture", "Nahradiť obrázok", "Bild ersetzen"),
    ("🗑 Smazat obrázek", "🗑 Delete picture", "🗑 Zmazať obrázok", "🗑 Bild löschen"),
    ("Velikost obrázku", "Picture size", "Veľkosť obrázka", "Bildgröße"),
    ("Šířka obrázku v % šířky stránky:", "Picture width in % of the page width:", "Šírka obrázka v % šírky strany:",
     "Bildbreite in % der Seitenbreite:"),
    ("Obrázek se nepodařilo načíst:\n{}", "The picture could not be loaded:\n{}", "Obrázok sa nepodarilo načítať:\n{}",
     "Das Bild konnte nicht geladen werden:\n{}"),
    ("Obrázky (*.jpg *.jpeg *.png *.gif *.bmp *.webp *.tif *.tiff);;Vše (*.*)", "Pictures (*.jpg *.jpeg *.png *.gif "
     "*.bmp *.webp *.tif *.tiff);;All (*.*)", "Obrázky (*.jpg *.jpeg *.png *.gif *.bmp *.webp *.tif *.tiff);;Všetko "
     "(*.*)", "Bilder (*.jpg *.jpeg *.png *.gif *.bmp *.webp *.tif *.tiff);;Alle (*.*)"),
    # Info
    ("🌐 Stránka programu", "🌐 Program website", "🌐 Stránka programu", "🌐 Programm-Website"),
    ("© 2026 Micha741 · zdarma pro osobní použití", "© 2026 Micha741 · free for personal use",
     "© 2026 Micha741 · zadarmo na osobné použitie", "© 2026 Micha741 · kostenlos für den privaten Gebrauch"),
    ("Moje poznámky a nápady", "My notes and ideas", "Moje poznámky a nápady", "Meine Notizen und Ideen"),
    ("Co ještě chcete v programu mít nebo vyzkoušet – uloží se tlačítkem Uložit nastavení.",
     "What else you want in the program or want to try – saved with Save settings.",
     "Čo ešte chcete v programe mať alebo vyskúšať – uloží sa tlačidlom Uložiť nastavenia.",
     "Was Sie sich noch wünschen oder ausprobieren möchten – wird mit Einstellungen speichern gesichert."),
    ("např. přidat tlačítko Přepsat kapitolu, vyzkoušet DeepL u PDF…", "e.g. add a Rewrite chapter button, try "
     "DeepL with PDF…", "napr. pridať tlačidlo Prepísať kapitolu, vyskúšať DeepL pri PDF…",
     "z. B. Schaltfläche Kapitel neu schreiben, DeepL mit PDF testen…"),
    ("Seznam změn není k dispozici.", "The list of changes is not available.", "Zoznam zmien nie je k dispozícii.",
     "Änderungsliste nicht verfügbar."),
    # ------------------------------------------------------------ editor knihy
    ("Domů", "Home", "Domov", "Start"),
    ("Zobrazení", "View", "Zobrazenie", "Ansicht"),
    ("Schránka", "Clipboard", "Schránka", "Zwischenablage"),
    ("Písmo", "Font", "Písmo", "Schriftart"),
    ("Odstavec", "Paragraph", "Odsek", "Absatz"),
    ("Styly", "Styles", "Štýly", "Formatvorlagen"),
    ("Úpravy", "Editing", "Úpravy", "Bearbeiten"),
    ("Zobrazit", "Show", "Zobraziť", "Anzeigen"),
    ("Vložit", "Paste", "Vložiť", "Einfügen"),
    ("Vyjmout", "Cut", "Vystrihnúť", "Ausschneiden"),
    ("Kopírovat", "Copy", "Kopírovať", "Kopieren"),
    ("Kopírovat formát (pak označte text, na který ho přenést)", "Format painter (then select the text to apply it "
     "to)", "Kopírovať formát (potom označte text, na ktorý ho preniesť)", "Format übertragen (dann Zieltext "
     "markieren)"),
    ("Tučné", "Bold", "Tučné", "Fett"),
    ("Kurzíva", "Italic", "Kurzíva", "Kursiv"),
    ("Podtržené", "Underline", "Podčiarknuté", "Unterstrichen"),
    ("Přeškrtnuté", "Strikethrough", "Prečiarknuté", "Durchgestrichen"),
    ("Dolní index", "Subscript", "Dolný index", "Tiefgestellt"),
    ("Horní index", "Superscript", "Horný index", "Hochgestellt"),
    ("Barva písma", "Font color", "Farba písma", "Schriftfarbe"),
    ("Zvýraznění textu", "Text highlight", "Zvýraznenie textu", "Texthervorhebung"),
    ("Další barvy…", "More colors…", "Ďalšie farby…", "Weitere Farben…"),
    ("Bez zvýraznění", "No highlight", "Bez zvýraznenia", "Keine Hervorhebung"),
    ("Vymazat formátování", "Clear formatting", "Vymazať formátovanie", "Formatierung löschen"),
    ("Zvětšit písmo", "Grow font", "Zväčšiť písmo", "Schrift vergrößern"),
    ("Zmenšit písmo", "Shrink font", "Zmenšiť písmo", "Schrift verkleinern"),
    ("Odrážky", "Bullets", "Odrážky", "Aufzählung"),
    ("Číslování", "Numbering", "Číslovanie", "Nummerierung"),
    ("Zmenšit odsazení", "Decrease indent", "Zmenšiť odsadenie", "Einzug verkleinern"),
    ("Zvětšit odsazení", "Increase indent", "Zväčšiť odsadenie", "Einzug vergrößern"),
    ("Řádkování", "Line spacing", "Riadkovanie", "Zeilenabstand"),
    ("Zarovnat vlevo", "Align left", "Zarovnať vľavo", "Linksbündig"),
    ("Zarovnat doleva", "Align left", "Zarovnať doľava", "Linksbündig"),
    ("Zarovnat na střed", "Center", "Zarovnať na stred", "Zentriert"),
    ("Zarovnat doprava", "Align right", "Zarovnať doprava", "Rechtsbündig"),
    ("Do bloku", "Justify", "Do bloku", "Blocksatz"),
    ("Na střed", "Center", "Na stred", "Zentriert"),
    ("Vpravo", "Right", "Vpravo", "Rechts"),
    ("Zalomení stránky", "Page break", "Zalomenie strany", "Seitenumbruch"),
    ("Zalomit řádek", "Line break", "Zalomiť riadok", "Zeilenumbruch"),
    ("⤓ Zalomit stránku", "⤓ Page break", "⤓ Zalomiť stranu", "⤓ Seitenumbruch"),
    ("Normální", "Normal", "Normálny", "Standard"),
    ("Nadpis", "Heading", "Nadpis", "Überschrift"),
    ("Podnadpis", "Subheading", "Podnadpis", "Untertitel"),
    ("Citace", "Quote", "Citácia", "Zitat"),
    ("Najít", "Find", "Nájsť", "Suchen"),
    ("Najít:", "Find:", "Nájsť:", "Suchen:"),
    ("Nahradit:", "Replace:", "Nahradiť:", "Ersetzen:"),
    ("Nahradit", "Replace", "Nahradiť", "Ersetzen"),
    ("Nahradit vše", "Replace all", "Nahradiť všetko", "Alle ersetzen"),
    ("Najít další", "Find next", "Nájsť ďalšie", "Weitersuchen"),
    ("Najít a nahradit", "Find and replace", "Nájsť a nahradiť", "Suchen und ersetzen"),
    ("🔍 Najít a nahradit…", "🔍 Find and replace…", "🔍 Nájsť a nahradiť…", "🔍 Suchen und ersetzen…"),
    ("Rozlišovat velká a malá písmena", "Match case", "Rozlišovať veľké a malé písmená", "Groß-/Kleinschreibung "
     "beachten"),
    ("Hledat v celé knize", "Search the whole book", "Hľadať v celej knihe", "Im ganzen Buch suchen"),
    ("Nenalezeno.", "Not found.", "Nenájdené.", "Nicht gefunden."),
    ("Nahrazeno {}×.", "Replaced {}×.", "Nahradené {}×.", "{}× ersetzt."),
    ("Zpět", "Undo", "Späť", "Rückgängig"),
    ("Znovu", "Redo", "Znova", "Wiederholen"),
    ("Přiblížit", "Zoom in", "Priblížiť", "Vergrößern"),
    ("Oddálit", "Zoom out", "Oddialiť", "Verkleinern"),
    ("Exportovat", "Export", "Exportovať", "Exportieren"),
    ("Export", "Export", "Export", "Export"),
    ("Exportuji…", "Exporting…", "Exportujem…", "Exportiere…"),
    ("Uloženo:\n\n{}", "Saved:\n\n{}", "Uložené:\n\n{}", "Gespeichert:\n\n{}"),
    ("Tisk", "Print", "Tlač", "Drucken"),
    ("Vytisknout knihu (Ctrl+P). Šipkou vyberete tisk kapitoly nebo náhled.", "Print the book (Ctrl+P). Use the "
     "arrow to print a chapter or preview.", "Vytlačiť knihu (Ctrl+P). Šípkou vyberiete tlač kapitoly alebo náhľad.",
     "Buch drucken (Strg+P). Mit dem Pfeil Kapitel drucken oder Vorschau."),
    ("🖨 Vytisknout celou knihu…  (Ctrl+P)", "🖨 Print the whole book…  (Ctrl+P)", "🖨 Vytlačiť celú knihu…  (Ctrl+P)",
     "🖨 Ganzes Buch drucken…  (Strg+P)"),
    ("Vytisknout jen tuto kapitolu…", "Print this chapter only…", "Vytlačiť len túto kapitolu…",
     "Nur dieses Kapitel drucken…"),
    ("🔍 Náhled tisku – celá kniha", "🔍 Print preview – whole book", "🔍 Náhľad tlače – celá kniha",
     "🔍 Druckvorschau – ganzes Buch"),
    ("Náhled tisku – tato kapitola", "Print preview – this chapter", "Náhľad tlače – táto kapitola",
     "Druckvorschau – dieses Kapitel"),
    ("Tisk – celá kniha", "Print – whole book", "Tlač – celá kniha", "Drucken – ganzes Buch"),
    ("Tisk – tato kapitola", "Print – this chapter", "Tlač – táto kapitola", "Drucken – dieses Kapitel"),
    ("Náhled tisku – celá kniha", "Print preview – whole book", "Náhľad tlače – celá kniha",
     "Druckvorschau – ganzes Buch"),
    ("Odesláno na tiskárnu.", "Sent to the printer.", "Odoslané na tlačiareň.", "An den Drucker gesendet."),
    ("Pravítko", "Ruler", "Pravítko", "Lineal"),
    ("Pravítka nad a vlevo od stránky. Na vodorovném jde myší posouvat odsazení odstavce (▽ první řádek, △ levé a "
     "pravé odsazení); dvojklik ho zruší.", "Rulers above and left of the page. Drag the paragraph indents on the "
     "horizontal ruler (▽ first line, △ left and right indent); double-click resets them.", "Pravítka nad a vľavo "
     "od strany. Na vodorovnom možno myšou posúvať odsadenie odseku (▽ prvý riadok, △ ľavé a pravé odsadenie); "
     "dvojklik ho zruší.", "Lineale über und links der Seite. Auf dem waagerechten lassen sich Absatzeinzüge ziehen "
     "(▽ erste Zeile, △ linker und rechter Einzug); Doppelklick setzt sie zurück."),
    ("Pravítko (cm)", "Ruler (cm)", "Pravítko (cm)", "Lineal (cm)"),
    ("Odsazení prvního řádku", "First line indent", "Odsadenie prvého riadku", "Einzug erste Zeile"),
    ("Levé odsazení odstavce", "Left paragraph indent", "Ľavé odsadenie odseku", "Linker Absatzeinzug"),
    ("Pravé odsazení odstavce", "Right paragraph indent", "Pravé odsadenie odseku", "Rechter Absatzeinzug"),
    ("Kapitoly", "Chapters", "Kapitoly", "Kapitel"),
    ("Název:", "Title:", "Názov:", "Titel:"),
    ("Autor:", "Author:", "Autor:", "Autor:"),
    ("Výchozí písmo knihy", "Default book font", "Predvolené písmo knihy", "Standardschrift des Buchs"),
    ("Obsah s odkazy na kapitoly", "Table of contents with chapter links", "Obsah s odkazmi na kapitoly",
     "Inhaltsverzeichnis mit Kapitellinks"),
    ("Název vybrané kapitoly:", "Title of the selected chapter:", "Názov vybranej kapitoly:",
     "Titel des ausgewählten Kapitels:"),
    ("Nová kapitola", "New chapter", "Nová kapitola", "Neues Kapitel"),
    ("Název kapitoly", "Chapter title", "Názov kapitoly", "Kapiteltitel"),
    ("Název kapitoly:", "Chapter title:", "Názov kapitoly:", "Kapiteltitel:"),
    ("Kapitola {}", "Chapter {}", "Kapitola {}", "Kapitel {}"),
    ("Posunout nahoru", "Move up", "Posunúť hore", "Nach oben"),
    ("Posunout dolů", "Move down", "Posunúť dole", "Nach unten"),
    ("Smazat kapitolu", "Delete chapter", "Zmazať kapitolu", "Kapitel löschen"),
    ("Opravdu smazat kapitolu „{}“?", "Really delete chapter „{}“?", "Naozaj zmazať kapitolu „{}“?",
     "Kapitel „{}“ wirklich löschen?"),
    ("Kapitola {}: {} slov, {} odstavců     ", "Chapter {}: {} words, {} paragraphs     ",
     "Kapitola {}: {} slov, {} odsekov     ", "Kapitel {}: {} Wörter, {} Absätze     "),
    ("Kniha: {} kapitol · {} slov · {} odstavců · asi {} stran", "Book: {} chapters · {} words · {} paragraphs · "
     "about {} pages", "Kniha: {} kapitol · {} slov · {} odsekov · asi {} strán",
     "Buch: {} Kapitel · {} Wörter · {} Absätze · etwa {} Seiten"),
    ("● neuloženo", "● not saved", "● neuložené", "● nicht gespeichert"),
    ("✓ uloženo", "✓ saved", "✓ uložené", "✓ gespeichert"),
    ("Automaticky uloženo {}", "Autosaved {}", "Automaticky uložené {}", "Automatisch gespeichert {}"),
    ("Automatické uložení se nepovedlo: {}", "Autosave failed: {}", "Automatické uloženie sa nepodarilo: {}",
     "Automatisches Speichern fehlgeschlagen: {}"),
    ("{}{} – Upravit knihu", "{}{} – Edit book", "{}{} – Upraviť knihu", "{}{} – Buch bearbeiten"),
    ("Uložit změny?", "Save changes?", "Uložiť zmeny?", "Änderungen speichern?"),
    ("🅰 Formát písma", "🅰 Font format", "🅰 Formát písma", "🅰 Schriftformat"),
    ("¶ Odstavec", "¶ Paragraph", "¶ Odsek", "¶ Absatz"),
    # psaní textu (pravé tlačítko)
    ("📖 Psaní a slovník", "📖 Writing and dictionary", "📖 Písanie a slovník", "📖 Schreiben und Wörterbuch"),
    ("Kontrola pravopisu (červené podtržení)", "Spell check (red underline)", "Kontrola pravopisu (červené "
     "podčiarknutie)", "Rechtschreibprüfung (rot unterstrichen)"),
    ("Velké písmeno na začátku věty", "Capital letter at sentence start", "Veľké písmeno na začiatku vety",
     "Großbuchstabe am Satzanfang"),
    ("Návrhy slov při psaní (T9)", "Word suggestions while typing (T9)", "Návrhy slov pri písaní (T9)",
     "Wortvorschläge beim Tippen (T9)"),
    ("➕ Přidat do slovníku", "➕ Add to dictionary", "➕ Pridať do slovníka", "➕ Zum Wörterbuch hinzufügen"),
    ("Ignorovat všude", "Ignore everywhere", "Ignorovať všade", "Überall ignorieren"),
    ("(žádné návrhy)", "(no suggestions)", "(žiadne návrhy)", "(keine Vorschläge)"),
    ("↶ Zpět", "↶ Undo", "↶ Späť", "↶ Rückgängig"),
    ("↷ Znovu", "↷ Redo", "↷ Znova", "↷ Wiederholen"),
    ("✂ Vyjmout", "✂ Cut", "✂ Vystrihnúť", "✂ Ausschneiden"),
    ("📄 Kopírovat", "📄 Copy", "📄 Kopírovať", "📄 Kopieren"),
    ("📋 Vložit", "📋 Paste", "📋 Vložiť", "📋 Einfügen"),
    ("Vložit jen text (bez formátu)", "Paste text only (no formatting)", "Vložiť len text (bez formátu)",
     "Nur Text einfügen (ohne Format)"),
    ("Odstranit", "Delete", "Odstrániť", "Löschen"),
    ("Slovník se načítá…", "Loading dictionary…", "Slovník sa načítava…", "Wörterbuch wird geladen…"),
    ("Tab = vložit návrh · šipky = vybrat · Esc = zavřít", "Tab = insert suggestion · arrows = choose · Esc = close",
     "Tab = vložiť návrh · šípky = vybrať · Esc = zavrieť", "Tab = Vorschlag einfügen · Pfeile = wählen · Esc = "
     "schließen"),
    # ------------------------------------------------------------ vzhled (skiny)
    ("Vzhled", "Appearance", "Vzhľad", "Aussehen"),
    ("Skin mění barvy, písmo, logo, pozadí a ikony programu – podobně jako ve Winampu. Vzhled se změní hned. "
     "Další skiny se dají doinstalovat ze souboru .skin (stačí ho sem přetáhnout nebo na něj ve Windows dvakrát "
     "klepnout).",
     "A skin changes the program's colours, font, logo, background and icons – much like in Winamp. The look "
     "changes immediately. More skins can be installed from a .skin file (drag it here or double-click it in "
     "Windows).",
     "Skin mení farby, písmo, logo, pozadie a ikony programu – podobne ako vo Winampe. Vzhľad sa zmení hneď. "
     "Ďalšie skiny sa dajú doinštalovať zo súboru .skin (stačí ho sem pretiahnuť alebo naň vo Windows dvakrát "
     "kliknúť).",
     "Ein Skin ändert Farben, Schrift, Logo, Hintergrund und Symbole des Programms – ähnlich wie in Winamp. Das "
     "Aussehen ändert sich sofort. Weitere Skins lassen sich aus einer .skin-Datei installieren (hierher ziehen "
     "oder in Windows doppelklicken)."),
    ("📥 Instalovat skin…", "📥 Install skin…", "📥 Inštalovať skin…", "📥 Skin installieren…"),
    ("📤 Uložit jako šablonu…", "📤 Save as template…", "📤 Uložiť ako šablónu…", "📤 Als Vorlage speichern…"),
    ("Uloží vybraný skin do souboru .skin – můžete ho upravit a poslat dál. Uvnitř je NAVOD.txt.",
     "Saves the selected skin to a .skin file – you can edit it and share it. NAVOD.txt inside explains how.",
     "Uloží vybraný skin do súboru .skin – môžete ho upraviť a poslať ďalej. Vnútri je NAVOD.txt.",
     "Speichert den gewählten Skin als .skin-Datei – Sie können ihn bearbeiten und weitergeben. Anleitung in "
     "NAVOD.txt."),
    ("🗑️ Odebrat", "🗑️ Remove", "🗑️ Odobrať", "🗑️ Entfernen"),
    ("📁 Složka skinů", "📁 Skins folder", "📁 Priečinok skinov", "📁 Skin-Ordner"),
    ("Skin", "Skin", "Skin", "Skin"),
    ("Instalovat skin", "Install skin", "Inštalovať skin", "Skin installieren"),
    ("Uložit skin", "Save skin", "Uložiť skin", "Skin speichern"),
    ("Skin nejde nainstalovat:", "The skin cannot be installed:", "Skin sa nedá nainštalovať:",
     "Der Skin kann nicht installiert werden:"),
    ("Skin uložen:", "Skin saved:", "Skin uložený:", "Skin gespeichert:"),
    ("Přejmenujte ho na .zip, rozbalte a upravte barvy v skin.json – návod je v souboru NAVOD.txt.",
     "Rename it to .zip, unpack it and edit the colours in skin.json – see NAVOD.txt for instructions.",
     "Premenujte ho na .zip, rozbaľte a upravte farby v skin.json – návod je v súbore NAVOD.txt.",
     "Benennen Sie ihn in .zip um, entpacken Sie ihn und ändern Sie die Farben in skin.json – Anleitung in "
     "NAVOD.txt."),
    ("Odebrat skin?", "Remove the skin?", "Odobrať skin?", "Skin entfernen?"),
    ("vlastní obrázky", "custom images", "vlastné obrázky", "eigene Bilder"),
    ("vlastní ikony", "custom icons", "vlastné ikony", "eigene Symbole"),
    ("Výchozí (světlý)", "Default (light)", "Predvolený (svetlý)", "Standard (hell)"),
    ("Tmavý", "Dark", "Tmavý", "Dunkel"),
    ("Sépie (papír)", "Sepia (paper)", "Sépia (papier)", "Sepia (Papier)"),
    ("Vysoký kontrast", "High contrast", "Vysoký kontrast", "Hoher Kontrast"),
    ("Původní světlý vzhled s modrými prvky.", "The original light look with blue accents.",
     "Pôvodný svetlý vzhľad s modrými prvkami.", "Das ursprüngliche helle Aussehen mit blauen Akzenten."),
    ("Tmavé okno šetrné k očím večer; stránka knihy zůstává světlá jako papír.",
     "A dark window that is easy on the eyes in the evening; the book page stays light like paper.",
     "Tmavé okno šetrné k očiam večer; stránka knihy zostáva svetlá ako papier.",
     "Ein dunkles Fenster, angenehm für die Augen am Abend; die Buchseite bleibt hell wie Papier."),
    ("Teplé barvy starého papíru a hnědé prvky – jako v knihovně.",
     "Warm colours of old paper with brown accents – like in a library.",
     "Teplé farby starého papiera a hnedé prvky – ako v knižnici.",
     "Warme Farben alten Papiers mit braunen Akzenten – wie in einer Bibliothek."),
    ("Černé pozadí, bílý text a žluté prvky – nejlepší čitelnost, větší písmo.",
     "Black background, white text and yellow accents – best readability, larger font.",
     "Čierne pozadie, biely text a žlté prvky – najlepšia čitateľnosť, väčšie písmo.",
     "Schwarzer Hintergrund, weißer Text und gelbe Akzente – beste Lesbarkeit, größere Schrift."),
    # ------------------------------------------------------------ čtečka (režim Čtení), heslo k PDF
    ('Barvy', 'Colours', 'Farby', 'Farben'),
    ('Další kapitola', 'Next chapter', 'Ďalšia kapitola', 'Nächstes Kapitel'),
    ('Dál', 'Next', 'Ďalej', 'Weiter'),
    ('Heslo nesouhlasí. Zkuste ho zadat znovu:', 'Wrong password. Please try again:', 'Heslo nesúhlasí. Skúste ho zadať znova:', 'Falsches Passwort. Bitte erneut eingeben:'),
    ('Hledat', 'Search', 'Hľadať', 'Suchen'),
    ('Hledat v celé knize…', 'Search the whole book…', 'Hľadať v celej knihe…', 'Im ganzen Buch suchen…'),
    ('Hledat ve slovníčku', 'Search the word list', 'Hľadať v slovníčku', 'In der Wortliste suchen'),
    ('Listování', 'Page turn', 'Listovanie', 'Umblättern'),
    ('Menší', 'Smaller', 'Menšie', 'Kleiner'),
    ('Nalezeno: {}', 'Found: {}', 'Nájdené: {}', 'Gefunden: {}'),
    ('Napište aspoň 2 písmena – na háčcích a velikosti písmen nezáleží.', 'Type at least 2 letters – accents and letter case do not matter.', 'Napíšte aspoň 2 písmená – na mäkčeňoch a veľkosti písmen nezáleží.', 'Mindestens 2 Buchstaben eingeben – Akzente und Groß-/Kleinschreibung spielen keine Rolle.'),
    ('Obsah', 'Contents', 'Obsah', 'Inhalt'),
    ('Okraje', 'Margins', 'Okraje', 'Ränder'),
    ('Označené', 'Marked', 'Označené', 'Markiert'),
    ('PDF je chráněné heslem:', 'The PDF is password-protected:', 'PDF je chránené heslom:', 'Die PDF ist passwortgeschützt:'),
    ('Pomaleji', 'Slower', 'Pomalšie', 'Langsamer'),
    ('Poznámka', 'Note', 'Poznámka', 'Notiz'),
    ('Poznámka k odstavci:', 'Note for the paragraph:', 'Poznámka k odseku:', 'Notiz zum Absatz:'),
    ('Předchozí kapitola', 'Previous chapter', 'Predchádzajúca kapitola', 'Vorheriges Kapitel'),
    ('Překlad odstavce', 'Paragraph translation', 'Preklad odseku', 'Absatzübersetzung'),
    ('Překládám…', 'Translating…', 'Prekladám…', 'Übersetze…'),
    ('Rychleji', 'Faster', 'Rýchlejšie', 'Schneller'),
    ('Rychlost čtení: {}×', 'Reading speed: {}×', 'Rýchlosť čítania: {}×', 'Lesegeschwindigkeit: {}×'),
    ('Slova přeložená ve čtečce (dvojklik na slovo) i s větou, ve které byla.', 'Words translated in the reader (double-click a word) with the sentence they came from.', 'Slová preložené v čítačke (dvojklik na slovo) aj s vetou, v ktorej boli.', 'Im Reader übersetzte Wörter (Doppelklick auf ein Wort) mit dem Satz, aus dem sie stammen.'),
    ('Slovníček', 'Word list', 'Slovníček', 'Wortliste'),
    ('Slovo', 'Word', 'Slovo', 'Wort'),
    ('Strany', 'Pages', 'Strany', 'Seiten'),
    ('Uložit označené a poznámky', 'Save highlights and notes', 'Uložiť označené a poznámky', 'Markierungen und Notizen speichern'),
    ('Uložit slovníček', 'Save word list', 'Uložiť slovníček', 'Wortliste speichern'),
    ('Více než 500 nálezů – upřesněte hledání.', 'More than 500 results – refine the search.', 'Viac než 500 výsledkov – upresnite hľadanie.', 'Mehr als 500 Treffer – Suche eingrenzen.'),
    ('Věta', 'Sentence', 'Veta', 'Satz'),
    ('Větší', 'Larger', 'Väčšie', 'Größer'),
    ('Zadejte heslo k otevření (nebo heslo vlastníka):', 'Enter the password to open it (or the owner password):', 'Zadajte heslo na otvorenie (alebo heslo vlastníka):', 'Passwort zum Öffnen eingeben (oder Besitzerpasswort):'),
    ('Zrušit označení', 'Remove highlight', 'Zrušiť označenie', 'Markierung entfernen'),
    ('Záložka', 'Bookmark', 'Záložka', 'Lesezeichen'),
    ('Záložka uložena: {}', 'Bookmark saved: {}', 'Záložka uložená: {}', 'Lesezeichen gespeichert: {}'),
    ('Čtení', 'Reading', 'Čítanie', 'Lesen'),
    ('Čtení nahlas', 'Read aloud', 'Čítanie nahlas', 'Vorlesen'),
    ('Číst nahlas', 'Read aloud', 'Čítať nahlas', 'Vorlesen'),
    ('✏️ Úpravy', '✏️ Edit', '✏️ Úpravy', '✏️ Bearbeiten'),
    ('✖ Smazat', '✖ Delete', '✖ Zmazať', '✖ Löschen'),
    ('✖ Smazat vybrané', '✖ Delete selected', '✖ Zmazať vybrané', '✖ Ausgewählte löschen'),
    ('🌍 Přeložit odstavec', '🌍 Translate paragraph', '🌍 Preložiť odsek', '🌍 Absatz übersetzen'),
    ('📋 Kopírovat odstavec', '📋 Copy paragraph', '📋 Kopírovať odsek', '📋 Absatz kopieren'),
    ('📋 Kopírovat vše', '📋 Copy all', '📋 Kopírovať všetko', '📋 Alles kopieren'),
    ('📒 Slovníček', '📒 Word list', '📒 Slovníček', '📒 Wortliste'),
    ('📖 Čtení', '📖 Read', '📖 Čítanie', '📖 Lesen'),
    ('📝 Označit a připsat poznámku…', '📝 Highlight and add a note…', '📝 Označiť a pripísať poznámku…', '📝 Markieren und Notiz hinzufügen…'),
    ('📝 Poznámka…', '📝 Note…', '📝 Poznámka…', '📝 Notiz…'),
    ('📝 Upravit poznámku…', '📝 Edit note…', '📝 Upraviť poznámku…', '📝 Notiz bearbeiten…'),
    ('📤 Uložit jako text…', '📤 Save as text…', '📤 Uložiť ako text…', '📤 Als Text speichern…'),
    ('📤 Uložit označené a poznámky…', '📤 Save highlights and notes…', '📤 Uložiť označené a poznámky…', '📤 Markierungen und Notizen speichern…'),
    ('🔊 Číst nahlas odsud', '🔊 Read aloud from here', '🔊 Čítať nahlas odtiaľto', '🔊 Ab hier vorlesen'),
    ('🔒 Heslo k PDF', '🔒 PDF password', '🔒 Heslo k PDF', '🔒 PDF-Passwort'),
    ('🖍 Označit', '🖍 Highlight', '🖍 Označiť', '🖍 Markieren'),
    ('Číst knihu jako v čtečce: stránky, otáčení, hledání, záložky, označování, překlad a čtení nahlas (F6)', 'Read the book like in an e-reader: pages, page turning, search, bookmarks, highlights, translation and read-aloud (F6)', 'Čítať knihu ako v čítačke: strany, otáčanie, hľadanie, záložky, označovanie, preklad a čítanie nahlas (F6)', 'Buch wie im E-Reader lesen: Seiten, Umblättern, Suche, Lesezeichen, Markierungen, Übersetzung und Vorlesen (F6)'),
    ('strana', 'page', 'strana', 'Seite'),
    ('uloženo do slovníčku', 'saved to the word list', 'uložené do slovníčka', 'in der Wortliste gespeichert'),
    ('Čtení nahlas používá hlasy Windows. Na tomto počítači nejsou k dispozici.', 'Read-aloud uses Windows voices. They are not available on this computer.', 'Čítanie nahlas používa hlasy Windows. Na tomto počítači nie sú k dispozícii.', 'Vorlesen verwendet Windows-Stimmen. Auf diesem Computer sind sie nicht verfügbar.'),
    ('Pokračovat', 'Resume', 'Pokračovať', 'Fortsetzen'),
    ('Pozastavit', 'Pause', 'Pozastaviť', 'Pause'),
    ('Číst nahlas od začátku stránky; během čtení pozastavit a pokračovat', 'Read aloud from the top of the page; pause and resume while reading', 'Čítať nahlas od začiatku strany; počas čítania pozastaviť a pokračovať', 'Ab Seitenanfang vorlesen; beim Vorlesen pausieren und fortsetzen'),
    ("Hlas pro čtení nahlas: hlasy Windows (Nastavení → Čas a jazyk → Řeč) a stažené hlasy, které čtou bez internetu",
     "Voice for reading aloud: Windows voices (Settings → Time & language → Speech) and downloaded voices that work "
     "offline", "Hlas na čítanie nahlas: hlasy Windows (Nastavenia → Čas a jazyk → Reč) a stiahnuté hlasy, ktoré "
     "čítajú bez internetu", "Vorlesestimme: Windows-Stimmen (Einstellungen → Zeit und Sprache → Sprache) und "
     "heruntergeladene Stimmen, die offline funktionieren"),
    ("Ve Windows není {} hlas, proto by kniha zněla anglicky.\n\nProgram může stáhnout {} hlas {} (zdarma, asi {} MB). "
     "Čte bez internetu, přímo v počítači.\n\nJiná možnost: v Nastavení Windows → Čas a jazyk → Řeč → Přidat hlasy "
     "zvolte Čeština (hlas Microsoft Jakub) a program ho pak najde sám.",
     "Windows has no {} voice, so the book would sound English.\n\nThe program can download the {} voice {} (free, "
     "about {} MB). It reads offline, right on your computer.\n\nAlternatively: in Windows Settings → Time & "
     "language → Speech → Add voices choose Czech (Microsoft Jakub) and the program will find it.",
     "Vo Windows nie je {} hlas, preto by kniha znela anglicky.\n\nProgram môže stiahnuť {} hlas {} (zadarmo, asi {} "
     "MB). Číta bez internetu, priamo v počítači.\n\nIná možnosť: v Nastaveniach Windows → Čas a jazyk → Reč → "
     "Pridať hlasy zvoľte Slovenčina a program ho potom nájde sám.",
     "Windows hat keine Stimme ({}), das Buch würde englisch klingen.\n\nDas Programm kann die Stimme ({}) {} "
     "herunterladen (kostenlos, etwa {} MB). Sie liest offline auf Ihrem Computer.\n\nAlternativ: Windows-"
     "Einstellungen → Zeit und Sprache → Sprache → Stimmen hinzufügen."),
    ("český", "Czech", "český", "Tschechisch"),
    ("slovenský", "Slovak", "slovenský", "Slowakisch"),
    ("⬇ Stáhnout hlas", "⬇ Download voice", "⬇ Stiahnuť hlas", "⬇ Stimme herunterladen"),
    ("Číst hlasem Windows", "Read with Windows voice", "Čítať hlasom Windows", "Mit Windows-Stimme lesen"),
    ("Zrušit", "Cancel", "Zrušiť", "Abbrechen"),
    ("Stahuji hlas {}…", "Downloading voice {}…", "Sťahujem hlas {}…", "Stimme {} wird heruntergeladen…"),
    ("Hlas se nepodařilo stáhnout:\n{}", "The voice could not be downloaded:\n{}",
     "Hlas sa nepodarilo stiahnuť:\n{}", "Die Stimme konnte nicht heruntergeladen werden:\n{}"),
    ("⬇ Stáhnout hlas {} ({}, bez internetu)…", "⬇ Download voice {} ({}, offline)…",
     "⬇ Stiahnuť hlas {} ({}, bez internetu)…", "⬇ Stimme {} herunterladen ({}, offline)…"),
    ("Stahuji program pro čtení nahlas Piper (asi 22 MB)…", "Downloading the Piper reading program (about 22 MB)…",
     "Sťahujem program na čítanie nahlas Piper (asi 22 MB)…", "Lade das Vorleseprogramm Piper (etwa 22 MB)…"),
    ("Čtečka", "Reader", "Čítačka", "Lesen"),
    ("📖 Čtečka", "📖 Reader", "📖 Čítačka", "📖 Lesen"),
    ("Otevřete knihu a čtěte ji jako v e-čtečce: listování stránek, záložky, označování barvami s poznámkou, "
     "hledání, překlad slova, slovníček a čtení nahlas. Mezi čtením a úpravami knihy přepnete v levém panelu "
     "(Napsat knihu / Čtečka) nebo klávesou F6.", "Open a book and read it like on an e-reader: page turning, "
     "bookmarks, colour highlights with notes, search, word translation, vocabulary and reading aloud. Switch between "
     "reading and editing in the left panel (Write a book / Reader) or with F6.",
     "Otvorte knihu a čítajte ju ako v e-čítačke: listovanie strán, záložky, označovanie farbami s poznámkou, "
     "hľadanie, preklad slova, slovníček a čítanie nahlas. Medzi čítaním a úpravami prepnete v ľavom paneli "
     "(Napísať knihu / Čítačka) alebo klávesom F6.", "Öffnen Sie ein Buch und lesen Sie es wie auf einem E-Reader: "
     "Blättern, Lesezeichen, farbige Markierungen mit Notiz, Suche, Wortübersetzung, Vokabeln und Vorlesen. "
     "Zwischen Lesen und Bearbeiten wechseln Sie im linken Bereich (Buch schreiben / Lesen) oder mit F6."),
    (" Otevřít knihu ke čtení…", " Open a book to read…", " Otvoriť knihu na čítanie…", " Buch zum Lesen öffnen…"),
    ("Otevřít knihu ke čtení", "Open a book to read", "Otvoriť knihu na čítanie", "Buch zum Lesen öffnen"),
    ("EPUB, PDF (i s heslem), DOCX, MOBI, AZW3, FB2, ODT, RTF, TXT nebo projekt knihy *.kniha.json",
     "EPUB, PDF (also password-protected), DOCX, MOBI, AZW3, FB2, ODT, RTF, TXT or a book project *.kniha.json",
     "EPUB, PDF (aj s heslom), DOCX, MOBI, AZW3, FB2, ODT, RTF, TXT alebo projekt knihy *.kniha.json",
     "EPUB, PDF (auch mit Passwort), DOCX, MOBI, AZW3, FB2, ODT, RTF, TXT oder ein Buchprojekt *.kniha.json"),
    ("Naposledy otevřené knihy", "Recently opened books", "Naposledy otvorené knihy", "Zuletzt geöffnete Bücher"),
    ("Zatím žádné – otevřené knihy se objeví tady.", "None yet – opened books will appear here.",
     "Zatiaľ žiadne – otvorené knihy sa objavia tu.", "Noch keine – geöffnete Bücher erscheinen hier."),
    ("Kniha nemá žádný text ke čtení.", "The book has no text to read.", "Kniha nemá žiadny text na čítanie.",
     "Das Buch enthält keinen Text zum Lesen."),
    ('Hlas podle jazyka knihy', 'Voice by book language', 'Hlas podľa jazyka knihy', 'Stimme nach Buchsprache'),
    ('žena', 'female', 'žena', 'weiblich'),
    ('muž', 'male', 'muž', 'männlich'),
]


def build() -> None:
    import json
    from pathlib import Path

    out = Path(__file__).resolve().parents[1] / "assets" / "lang"
    out.mkdir(parents=True, exist_ok=True)
    seen = {}
    for row in E:
        if row[0] in seen and seen[row[0]] != row:
            raise SystemExit(f"Duplicitní klíč s jiným překladem: {row[0]!r}")
        seen[row[0]] = row
    names = {"en": "English", "sk": "Slovenčina", "de": "Deutsch"}
    for i, code in enumerate(("en", "sk", "de"), 1):
        data = {"_name": names[code], "_lang": code}
        data.update({cs: row[i] for cs, row in ((r[0], r) for r in E)})
        (out / f"{code}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (out / "index.json").write_text(json.dumps(names, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(seen)} textů → {', '.join(names)}")


if __name__ == "__main__":
    build()
