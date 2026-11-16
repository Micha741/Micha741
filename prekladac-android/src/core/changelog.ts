// Nápověda a historie verzí aplikace pro Android (Nastavení → Info).
// Při každé změně se přidá řádek k nejnovější verzi; nová verze = zvýšit "version" v app.json a přidat ji sem nahoru.

export interface Release {
  version: string;
  /** datum vydání; prázdné = připravuje se */
  date: string;
  items: string[];
}

export const ANDROID_HISTORY: Release[] = [
  {
    version: '1.2.0',
    date: '',
    items: [
      'Obrázky v knize: velikost (malý až celá stránka), otočení, oříznutí (obálka 2:3, čtverec, 16:9…), použít jako obálku, odebrat.',
      'Více obrázků najednou v pořadí výběru; první se nabídne jako obálka. Obálka: oříznout na 2:3, nebo celý obrázek.',
      'Obálka s názvem nebo „jen název“: s obálkou už není navíc titulní strana (název je v metadatech), bez obálky jen název – jako ve Windows.',
      'Karta Metadata: podtitul, anotace, žánr, série a díl, vydavatel, datum, ISBN, práva – uloží se do EPUB, Kindle, Wordu a projektu a načtou se zpět.',
      'Ochrana knihy: vodoznak „Licence pro: …“ do každé kapitoly (karta Uložit).',
      'Hledat knihy: Wikizdroje (kniha se sestaví z kapitol v pořadí obsahu) a Open Library / Internet Archive přímo v aplikaci, zaškrtávátka zdrojů s počtem výsledků, štítek „otevře Překladač“ / DRM.',
      'Čtečka: 🔊 Číst odsud (podržte prst na odstavci), dvě stránky vedle sebe na šířku, celá obrazovka bez horní lišty.',
      'Nastavení → Info: nápověda a historie verzí.',
      '☁ Synchronizace s Windows přes Google Disk: místo čtení, záložky, označené s poznámkami a knihy – začnete číst v počítači a pokračujete v telefonu (a obráceně).',
    ],
  },
  {
    version: '1.1.0',
    date: '12. 11. 2026',
    items: [
      'Čtení nahlas s pozastavením, rychlostí a výběrem hlasu.',
      '☰ nabídka ve čtečce: kapitoly, hledání v celé knize, označené odstavce.',
      'Zvýraznění 4 barvami s poznámkami, slovníček přeložených slov, animace listování.',
      'Výsledky z katalogu Google Books a našeptávač při hledání; PDF s heslem nebo chráněná proti tisku.',
    ],
  },
  {
    version: '1.0.0',
    date: '10. 11. 2026',
    items: [
      'Převod a překlad knih v telefonu: EPUB, PDF, DOCX, TXT, MOBI, PDB a projekty z Překladače na počítači.',
      'Offline překlad v telefonu (Google ML Kit), Google, DeepL, Claude, Gemini a další.',
      'Čtečka s knihovnou, záložkami a překladem odstavce i slova; hledání knih na Project Gutenberg; skiny.',
    ],
  },
];

export const ANDROID_HELP: { title: string; text: string }[] = [
  { title: 'Čtečka', text: 'Klepnutí vlevo/vpravo = listovat, uprostřed = nabídka. Tažení prstem otáčí stránky. Dvojité klepnutí na slovo ho přeloží a uloží do slovníčku. Podržení prstu na odstavci: překlad, označení barvou, poznámka a 🔊 Číst odsud.' },
  { title: 'Čtení nahlas', text: '🔊 v nabídce čtečky čte od první věty na stránce; dole jde pozastavit, zrychlit/zpomalit a vybrat hlas (🗣). Český hlas doinstalujete v Nastavení telefonu → Převod textu na řeč.' },
  { title: 'Překlad a převod', text: 'Karta Soubor → Otevřít, na kartě Překlad zvolte jazyk a překladač, na kartě Uložit formát a případně vodoznak. Tlačítko ▶ vpravo přeloží nebo převede knihu.' },
  { title: 'Obrázky a obálka', text: 'Karta Obrázky: obálka (oříznout 2:3 nebo celá), obálka s názvem, jen název, vložení více obrázků a Upravit… (velikost, celá stránka, otočit, oříznout, obálka, odebrat).' },
  { title: 'Metadata', text: 'Karta Metadata → Upravit…: anotace, série a díl, ISBN… – uloží se do EPUB, Kindle, Wordu a projektu pro počítač.' },
  { title: 'Hledat knihy', text: 'Zaškrtněte zdroje (Wikizdroje, Open Library, Google Books, Project Gutenberg). U knihy je vidět, jestli ji Překladač otevře, nebo je zašifrovaná (DRM). Obchody a knihovny se otevřou v prohlížeči.' },
  { title: 'Google Disk (synchronizace s Windows)', text: 'Nastavení → Služby a klíče → Google Disk: stejné ID klienta a tajný klíč jako ve Windows, pak Přihlásit (kód se zadá na google.com/device). Knihovna se pak synchronizuje sama: místo čtení, záložky a označené; knihy z počítače se objeví nahoře v Číst → ☁ Google Disk.' },
  { title: 'Klíče', text: 'Klíče ke službám se ukládají zašifrovaně jen v telefonu (Android Keystore) a nikam se neposílají.' },
];
