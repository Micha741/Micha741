"""Obsah nápovědy (levý panel → Nápověda, klávesa F1): popis programu a klávesové zkratky."""

# (oblast, [(zkratka, co dělá)])
SHORTCUTS: list[tuple[str, list[tuple[str, str]]]] = [
    ("Celý program", [
        ("F1", "Nápověda (tato stránka)"),
        ("Ctrl+S", "Uložit (knihu na stránce Napsat knihu, v okně knihy, nastavení v Nastavení)"),
    ]),
    ("Překlad – seznam souborů", [
        ("Ctrl+A", "Vybrat všechny soubory v seznamu"),
        ("Ctrl+klik / Shift+klik", "Vybrat více souborů"),
        ("Delete", "Odebrat vybrané soubory ze seznamu"),
        ("Přetažení myší", "Přidat soubory nebo celou složku"),
    ]),
    ("Napsat knihu", [
        ("Ctrl+N", "Nová kniha"),
        ("Ctrl+O", "Otevřít knihu (projekt nebo hotovou knihu DOCX, EPUB, PDF…)"),
        ("Ctrl+S", "Uložit knihu"),
        ("Ctrl+Shift+S", "Uložit jako…"),
    ]),
    ("Okno knihy – úpravy", [
        ("Ctrl+S", "Uložit"),
        ("Ctrl+Shift+S", "Uložit jako… (DOCX, PDF, EPUB, MOBI, ODT, TXT…)"),
        ("Ctrl+P", "Tisk celé knihy"),
        ("Ctrl+Z / Ctrl+Y", "Zpět / Znovu"),
        ("Ctrl+X / Ctrl+C / Ctrl+V", "Vyjmout / Kopírovat / Vložit (Ctrl+V vloží i obrázek ze schránky)"),
        ("Ctrl+B / Ctrl+I / Ctrl+U", "Tučné / Kurzíva / Podtržené"),
        ("Shift+Enter", "Zalomit řádek (bez nového odstavce)"),
        ("Ctrl+Enter", "Zalomit stránku"),
        ("Ctrl+PgUp / Ctrl+PgDown", "Předchozí / další kapitola"),
        ("F9", "Zobrazit nebo skrýt panel kapitol"),
        ("F6", "Přepnout mezi úpravami a čtením"),
        ("Alt+←", "Zpět do hlavního okna (kniha se uloží)"),
        ("Pravé tlačítko na obrázku", "Velikost, celá stránka, oříznout, otočit, použít jako obálku"),
    ]),
    ("Okno knihy – hledání", [
        ("Ctrl+F", "Karta Hledání (označený text se doplní)"),
        ("Ctrl+H", "Najít a nahradit"),
        ("F3 / Shift+F3", "Další / předchozí výskyt"),
        ("Enter v poli Najít", "Najít další"),
    ]),
    ("Čtečka", [
        ("→ / ↓ / PgDown / mezerník", "Další stránka"),
        ("← / ↑ / PgUp / Backspace", "Předchozí stránka"),
        ("Home / End", "Začátek / konec knihy"),
        ("Kolečko myši, tažení", "Listovat"),
        ("Klik u levého / pravého okraje", "Listovat"),
        ("Klik do textu", "Označit větu, odkud číst nahlas (během čtení přeskočí na ni)"),
        ("Dvojklik na slovo", "Přeložit slovo a uložit do Slovníčku"),
        ("Pravé tlačítko na odstavci", "Přeložit, označit barvou, poznámka, číst nahlas, kopírovat"),
        ("Ctrl+F", "Hledat v celé knize"),
        ("F9", "Zobrazit nebo skrýt panel (obsah, hledání, označené)"),
        ("F11", "Celá obrazovka"),
        ("Esc", "Ukončit celou obrazovku"),
        ("F6", "Přepnout zpět na úpravy"),
    ]),
]

ABOUT = """
<h2>Překladač knih a dokumentů</h2>
<p>Program pro Windows, který <b>překládá</b> knihy a dokumenty, pomáhá <b>napsat knihu</b>
s umělou inteligencí, knihy <b>upravuje</b> a <b>čte</b> jako e-čtečka – včetně čtení nahlas.
Klíče ke službám se ukládají šifrovaně (Windows DPAPI) a nikam se neposílají.</p>

<h3>🌍 Překlad</h3>
<ul>
<li>Přetáhněte do seznamu soubory (EPUB, MOBI, AZW3, KFX, PDF, DOCX, ODT, RTF, TXT, HTML, obrázky JPG/PNG…),
zvolte cílový jazyk, výstupní formát a překladač a klikněte na <b>▶ Spustit</b>.</li>
<li>Režim <b>Jen převést formát</b> změní formát bez překladu (např. PDF → DOCX, EPUB → MOBI).</li>
<li><b>Obrázky a skeny</b> se čtou pomocí OCR (Tesseract v počítači, nebo Gemini / Claude). Více obrázků
jde spojit do jednoho dokumentu, nebo uložit každý zvlášť (karta Obrázky a OCR).</li>
<li>Překladače: Google (zdarma), Google Cloud, DeepL, Microsoft Azure, Claude, Gemini, OpenAI-kompatibilní,
Ollama a LibreTranslate (ve vlastním počítači) a offline překlad bez internetu. Klíče a návody jsou
v <b>⚙ Nastavení → Služby a klíče</b>.</li>
</ul>

<h3>✍️ Napsat knihu</h3>
<ul>
<li>Napište popis (asi 20 vět), zvolte žánr, styl a délku. AI navrhne osnovu, kterou můžete upravit,
a pak píše kapitolu po kapitole.</li>
<li>Hotovou knihu otevřete v <b>okně knihy</b>: úpravy textu jako ve Wordu, obrázky a obálka,
karty Hledání a Export (EPUB, PDF, Word, Kindle…), tisk.</li>
<li>Otevřít jde i hotovou knihu (DOCX, EPUB, PDF, MOBI…) – rozdělí se na kapitoly.</li>
</ul>

<h3>📖 Čtečka</h3>
<ul>
<li>Stránky jako v e-čtečce (jedna nebo dvě), animace listování, obsah, záložky, hledání v knize,
označování 4 barvami s poznámkou, překlad odstavce a slova se Slovníčkem.</li>
<li><b>Čtení nahlas</b> – hlasy Windows, stažený český hlas Jirka (bez internetu), nebo přirozené
hlasy Azure a Google (s klíčem). Kliknutím do textu určíte, odkud číst.</li>
<li><b>Hledat knihy</b> – Project Gutenberg a Google Books přímo v programu, obchody a knihovny v prohlížeči.</li>
<li>Karta <b>Vzhled</b>: barvy Den / Sépie / Noc, písmo, řádkování, okraje, celá obrazovka (F11).</li>
</ul>

<h3>⚙️ Nastavení</h3>
<ul>
<li><b>Služby a klíče</b> – klíče k překladačům a hlasům, tlačítka 📘 Návod a ✔ Otestovat.</li>
<li><b>Součásti</b> – Calibre (volitelně pro AZW3/KFX), Tesseract a jazyky OCR, offline překlad.</li>
<li><b>Obecné</b> – výstupní složka, automatické ukládání, čtečka, jazyk programu, kontrola nových verzí.</li>
<li><b>Vzhled</b> – skiny (vlastní vzhled programu, jdou doinstalovat jako soubor .skin).</li>
</ul>

<h3>💡 Tipy</h3>
<ul>
<li>Na celé knihy je nejspolehlivější Google Cloud, DeepL Free nebo Gemini; Google zdarma může při velkém
množství textu dočasně omezit přístup – program pak počká a pokračuje.</li>
<li>Nová verze programu: Nastavení → Obecné → <i>Zkontrolovat novou verzi</i>.</li>
</ul>
"""


def shortcuts_html(filter_text: str = "") -> str:
    """Zkratky jako HTML tabulka (s filtrem podle textu)."""
    import html

    f = filter_text.strip().lower()
    out = []
    for area, items in SHORTCUTS:
        rows = [(k, d) for k, d in items if not f or f in k.lower() or f in d.lower() or f in area.lower()]
        if not rows:
            continue
        out.append(f"<h3>{html.escape(area)}</h3><table cellspacing='0' cellpadding='4' width='100%'>")
        for k, d in rows:
            out.append(f"<tr><td width='34%'><b><code>{html.escape(k)}</code></b></td><td>{html.escape(d)}</td></tr>")
        out.append("</table>")
    return "".join(out) or "<p>Nic nenalezeno.</p>"
