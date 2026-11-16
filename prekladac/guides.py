"""Návody, jak získat klíče ke službám (zobrazují se v Nastavení tlačítkem „Návod“)."""

GUIDES = {
    "google": """Google Překladač – bez klíče

Nic se nenastavuje. Stačí v hlavním okně zvolit překladač „Google Překladač“.

Pozor: jde o neoficiální bezplatný přístup bez zveřejněných limitů. Při překladu
velkého množství textu (celá kniha) může Google přístup na čas omezit (HTTP 429).
Program proto posílá text po jednom kousku s pauzami, při omezení počká (až
několik minut) a pak pokračuje – celá kniha se tak překládá pomaleji.
Na celé knihy je spolehlivější Google Cloud Translation, DeepL Free nebo Gemini.""",

    "google_cloud": """Google Cloud Translation – oficiální služba, zdarma 500 000 znaků měsíčně

Kvalita je stejná jako u bezplatného Google Překladače, ale se zveřejněnými limity,
takže velké knihy se přeloží rychle a bez omezení (HTTP 429).
Cena: prvních 500 000 znaků každý měsíc zdarma, pak zhruba 20 USD za milion znaků.

1. Otevřete https://console.cloud.google.com a přihlaste se účtem Google.
2. Vytvořte projekt (nahoře „Select a project“ → „New project“).
3. Billing (Fakturace): propojte projekt s fakturačním účtem a platební kartou.
   Google to vyžaduje i pro bezplatnou část; v rámci 500 000 znaků nic neplatíte.
4. APIs & Services → Library → vyhledejte „Cloud Translation API“ → Enable (Povolit).
5. APIs & Services → Credentials → Create credentials → API key. Klíč zkopírujte.
6. Doporučeno: u klíče zvolte „Restrict key“ → API restrictions → jen
   „Cloud Translation API“ (klíč pak nejde zneužít pro jiné služby).
7. Klíč vložte sem a klikněte na Otestovat. Ukládá se zašifrovaně (Windows DPAPI).

Hlídání útraty: Billing → Budgets & alerts → nastavte rozpočet třeba 1 USD,
Google vás upozorní e-mailem dřív, než by se něco platilo.""",

    "deepl": """DeepL API Free – zdarma 500 000 znaků měsíčně (zhruba 1 kniha)

1. Otevřete https://www.deepl.com/pro-api a zvolte plán „DeepL API Free“
   (ne „DeepL Pro“ pro běžné překládání).
2. Zaregistrujte se. DeepL ověřuje platební kartu, u plánu Free nic nestrhává.
3. Po přihlášení otevřete Účet → API Keys (https://www.deepl.com/your-account/keys).
4. Zkopírujte klíč – u bezplatného plánu končí na „:fx“.
5. Vložte ho sem do pole „API klíč“, klikněte na Uložit a pak na Otestovat.

Na konci překladu program vypíše, kolik z měsíčního limitu je využito.""",

    "microsoft": """Microsoft Azure Translator – zdarma 2 miliony znaků měsíčně (úroveň F0)

1. Účet Azure: https://azure.microsoft.com/free (Microsoft účet, ověření telefonem a kartou;
   za úroveň F0 se neplatí).
2. Otevřete https://portal.azure.com, nahoře vyhledejte „Translator“ a klikněte na „+ Vytvořit“.
3. Vyplňte: Předplatné, Skupina prostředků („Vytvořit novou“, např. prekladac),
   Oblast (např. West Europe), Název (libovolný jedinečný),
   Cenová úroveň: F0 (Free) – zkontrolujte, že ne S1.
4. „Zkontrolovat a vytvořit“ → „Vytvořit“ → „Přejít k prostředku“.
5. V levém menu otevřete „Klíče a koncový bod“ a sem zkopírujte:
   • KLÍČ 1 → pole „KLÍČ 1“ (pozor, ať je to opravdu klíč této služby Translator),
   • Umístění/oblast (např. westeurope) → pole „Umístění/oblast“
     (u oblasti Global nechte pole prázdné),
   • Překlad dokumentu (https://…cognitiveservices.azure.com/) → pole „Překlad dokumentu – adresa“
     – jen pokud chcete překládat celé dokumenty se zachováním vzhledu.
6. Uložit → Otestovat.

Chyba 401 = špatný klíč nebo oblast. Nová služba se může aktivovat až několik minut.""",

    "gemini": """Google Gemini – bezplatná úroveň s limity

1. Otevřete https://aistudio.google.com a přihlaste se Google účtem.
2. Klikněte na „Get API key“ → „Create API key“.
3. Zkopírujte klíč (začíná „AIza…“) a vložte ho sem do pole „API klíč“.
4. Uložit → Otestovat.

Bezplatná úroveň má limit požadavků za minutu – program při překročení počká a zkusí to znovu.
Text z bezplatné úrovně může Google použít ke zlepšování služeb (na citlivé dokumenty ji nepoužívejte).
Pokud program hlásí „model nenalezen (404)“, zadejte do pole Model aktuální název z AI Studia.""",

    "claude": """Claude API (Anthropic) – placené podle spotřeby, nejlepší kvalita

1. Otevřete https://platform.claude.com a zaregistrujte se.
   (Předplatné Claude Pro/Max z claude.ai se na API nevztahuje.)
2. Nastavení → Billing: dobijte kredit (stačí 5–10 USD).
   Doporučeno: v části Limits nastavte měsíční limit útraty.
3. Nastavení → API Keys → Create Key. Klíč (začíná „sk-ant-“) se zobrazí jen jednou – hned ho zkopírujte.
4. Vložte ho sem do pole „API klíč“, vyberte model, Uložit → Otestovat.

Orientační cena za knihu ~300 stran: Opus 5.5 cca 5–10 USD, Sonnet 5.5 cca 2–5 USD, Haiku 5.5 pod 0,50 USD.
Program před překladem vypíše odhad a na konci skutečnou cenu.""",

    "ollama": """Ollama – AI model ve vašem počítači (zdarma, offline)

NEJDŘÍV: zvládne to váš počítač?
  Model gemma3:12b má ke stažení asi 8 GB a potřebuje zhruba 12–16 GB paměti (ideálně grafickou kartu
  s 12 GB a více). Na běžném notebooku použijte menší gemma3:4b (asi 3 GB). Bez grafické karty se
  překládá pomalu – kniha může trvat i hodiny. Pokud chcete jen překlad bez internetu a bez čekání,
  je jednodušší vestavěný „Offline v počítači“.

1. Stáhněte a nainstalujte Ollama z https://ollama.com (Download → Windows).
   Po instalaci běží na pozadí – ikona lamy vpravo dole u hodin. Když tam není, spusťte Ollama
   z nabídky Start.
2. V příkazovém řádku (Win+R → cmd) stáhněte model:
      ollama pull gemma3:12b        (nebo menší:  ollama pull gemma3:4b)
3. Kontrola: příkaz  ollama list  vypíše stažené modely. V prohlížeči adresa
   http://localhost:11434 musí ukázat „Ollama is running“.
4. Tady nechte v poli „Adresa“ http://localhost:11434, do pole „Model“ napište přesný název
   z „ollama list“ (např. gemma3:4b), Uložit → Otestovat.

ČASTÉ CHYBY
  „neběží žádný server (spojení odmítnuto)“ – Ollama není spuštěná (chybí ikona u hodin) nebo není
    nainstalovaná.
  „model nenalezen (HTTP 404)“ – model není stažený nebo je v Nastavení napsaný jinak než v „ollama list“.
  Ollama na jiném počítači v síti: tam nastavte proměnnou prostředí OLLAMA_HOST=0.0.0.0, restartujte
    Ollama, povolte port 11434 ve firewallu a sem napište http://IP-adresa-počítače:11434.""",

    "libre": """LibreTranslate – vlastní překladový server (zdarma, offline, pro pokročilé)

NEJDŘÍV: potřebujete ho vůbec?
  LibreTranslate překládá stejnými jazykovými modely (Argos) jako překladač „Offline v počítači“,
  který je v Překladači už vestavěný a žádný server nepotřebuje. Pro jeden počítač tedy stačí
  Offline v počítači (Nastavení → Součásti → stáhnout jazyky) – stejná kvalita, nic se neinstaluje.
  Vlastní server se hodí, když chcete:
    • jeden server pro víc počítačů v domácnosti (modely se stahují jen jednou),
    • překládat na výkonnějším počítači nebo domácím serveru / NAS, zatímco pracujete na notebooku,
    • mít webovou stránku pro rychlý překlad v prohlížeči (http://localhost:5000).
  Kvalita češtiny je slabší než u DeepL, Gemini nebo Claude; výhodou je, že text neopouští váš počítač.

MOŽNOST A – Python (jen tento počítač)
  1. Nainstalujte Python 3.12 nebo 3.13 z https://www.python.org (při instalaci zaškrtněte
     „Add python.exe to PATH“). Python 3.14 a novější LibreTranslate zatím nepodporuje.
  2. V příkazovém řádku (Win+R → cmd) vytvořte samostatnou složku pro server:
        py -3.12 -m venv %USERPROFILE%\\libretranslate
        %USERPROFILE%\\libretranslate\\Scripts\\pip install libretranslate
  3. Spusťte server jen s jazyky, které potřebujete (angličtinu nechte vždy – překládá se přes ni):
        %USERPROFILE%\\libretranslate\\Scripts\\libretranslate --load-only en,cs,de
     První spuštění stáhne jazykové modely (stovky MB), chvíli trvá. Okno nechte otevřené –
     zavřením se server vypne.
  4. Zkouška: v prohlížeči otevřete http://localhost:5000 – objeví se překladová stránka.
  5. Tady v poli „Adresa serveru“ nechte http://localhost:5000, Uložit → Otestovat.
  Spouštění se systémem: do souboru libretranslate.bat napište řádek z bodu 3 a soubor dejte do
  složky Po spuštění (Win+R → shell:startup).

MOŽNOST B – Docker (pohodlnější, sám se spouští)
  1. Nainstalujte Docker Desktop (https://www.docker.com/products/docker-desktop/).
  2. V příkazovém řádku jednou spusťte:
        docker run -d --name libretranslate --restart unless-stopped -p 5000:5000 -e LT_LOAD_ONLY=en,cs,de -v lt-local:/home/libretranslate/.local libretranslate/libretranslate
     Server pak běží na pozadí a po restartu počítače se spustí sám (když běží Docker Desktop).
     Modely zůstanou uložené ve svazku lt-local, takže se nestahují znovu.
  3. Zkouška a nastavení jako v A (body 4 a 5). Aktualizace: docker pull libretranslate/libretranslate,
     pak docker rm -f libretranslate a znovu příkaz z bodu 2.

MOŽNOST C – server pro celou domácí síť (jiný počítač, NAS)
  1. Na serveru spusťte LibreTranslate podle A nebo B. U možnosti A přidejte --host 0.0.0.0,
     jinak server odpovídá jen sám sobě:
        libretranslate --host 0.0.0.0 --load-only en,cs,de
  2. Na serveru povolte v bráně Windows Defender Firewall příchozí spojení na port 5000
     (Brána firewall → Upřesnit nastavení → Příchozí pravidla → Nové pravidlo → Port → TCP 5000).
  3. Zjistěte IP adresu serveru (příkaz ipconfig → „Adresa IPv4“, např. 192.168.1.20).
  4. Tady do „Adresa serveru“ napište http://192.168.1.20:5000, Uložit → Otestovat.
  Server nevystavujte do internetu (přesměrováním portu na routeru). Kdo by ho tam chtěl mít,
  ať ho spustí s --api-keys a vytvoří klíče příkazem ltmanage keys add 1000 – klíč pak patří sem
  do pole „API klíč“.

VEŘEJNÝ SERVER
  libretranslate.com nabízí stejný server za měsíční poplatek (klíč zadáte sem). Pro občasný
  překlad je ale výhodnější Google Cloud, DeepL Free nebo Gemini – mají bezplatné limity.

ČASTÉ CHYBY
  „neběží žádný server (spojení odmítnuto)“ – server není spuštěný (okno z možnosti A je zavřené,
    nebo neběží Docker Desktop).
  „odmítl spojení“ u adresy v síti – chybí --host 0.0.0.0 nebo pravidlo ve firewallu.
  Velmi pomalý překlad – server překládá na procesoru; pomůže výkonnější počítač nebo menší
    počet jazyků v --load-only.
  Licence: LibreTranslate je pod licencí AGPL-3.0; Překladač s ním jen komunikuje přes síť,
    nic z něj neobsahuje.""",

    "openai": """OpenAI-kompatibilní služby – OpenAI, DeepSeek, Mistral, OpenRouter, Groq…

Všechny tyto služby mají stejné rozhraní; vyplníte jen Adresu API, API klíč a Model:

  Služba       Adresa API                          Příklad modelu         Cena
  DeepSeek     https://api.deepseek.com/v1         deepseek-chat          velmi levné
  OpenAI       https://api.openai.com/v1           (aktuální model z webu) placené
  Mistral      https://api.mistral.ai/v1           mistral-large-latest   placené, má i bezplatnou zkušební úroveň
  OpenRouter   https://openrouter.ai/api/v1        modely končící „:free“ zdarma s limity
  Groq         https://api.groq.com/openai/v1      (model z jejich webu)  bezplatná úroveň s limity

1. Zaregistrujte se u vybrané služby a vytvořte si API klíč (v účtu obvykle „API Keys“).
   DeepSeek: platform.deepseek.com · OpenAI: platform.openai.com · Mistral: console.mistral.ai ·
   OpenRouter: openrouter.ai/keys · Groq: console.groq.com/keys
2. Placené služby se dobíjejí kreditem předem (stejně jako Claude API) – žádný měsíční paušál.
3. Sem vyplňte Adresu API, API klíč a přesný název modelu (najdete ho v dokumentaci služby).
   Adresa API musí patřit ke stejné službě jako klíč – klíč OpenRouteru na adrese OpenAI skončí
   chybou 401. Klíče OpenRouteru („sk-or-…“) a Groq („gsk_…“) program pozná a při prázdné adrese
   použije správnou sám. U OpenRouteru má model tvar „výrobce/model“, např. deepseek/deepseek-chat.

OpenRouter – jeden klíč na stovky modelů (DeepSeek, Llama, Gemma, Qwen, Mistral…):
  a) openrouter.ai → přihlásit → Keys → Create Key → klíč „sk-or-v1-…“ zkopírujte sem do API klíče.
  b) openrouter.ai/models → vlevo filtr „Prompt pricing“ nastavte na FREE → vyberte model
     (pro češtinu zkuste nejdřív DeepSeek, Gemma nebo Llama) → ikonou vedle názvu zkopírujte jeho ID.
     Modely zdarma končí na „:free“ – jen ty fungují bez kreditu (mají denní limit požadavků).
  c) ID vložte do pole Model, Adresu API nechte prázdnou (program ji podle klíče doplní sám).
  Chyba 402 = vybraný model je placený a na účtu není kredit → použijte „:free“ model nebo dobijte.
  DeepSeek má i vlastní API (platform.deepseek.com, adresa https://api.deepseek.com/v1) – placené,
  ale velmi levné; přes OpenRouter ho máte s jedním klíčem i v bezplatné variantě, pokud je nabízena.
4. Uložit → Otestovat.

Hodí se pro překlad i pro „Napsat knihu“. Kvalita češtiny se liší podle modelu – vyzkoušejte
nejdřív krátký text nebo knihu o 3 kratších kapitolách.""",
    "azure_speech": """Hlasy Microsoft Azure pro čtení nahlas – zdarma 500 000 znaků měsíčně (úroveň F0)

Přirozené české hlasy Vlasta (žena) a Antonín (muž), slovenské Viktória a Lukáš.
Čtou se přes internet; text odstavce se pošle do Microsoftu a vrátí se zvuk.

1. Účet Azure: https://azure.microsoft.com/free (stejný jako pro Azure Translator).
2. Otevřete https://portal.azure.com, nahoře vyhledejte „Speech service“ (Služba Speech)
   a klikněte na „+ Vytvořit“.
3. Vyplňte: Předplatné, Skupina prostředků (např. prekladac), Oblast (např. West Europe),
   Název (libovolný jedinečný), Cenová úroveň: Free F0.
4. „Zkontrolovat a vytvořit“ → „Vytvořit“ → „Přejít k prostředku“.
5. V levém menu „Klíče a koncový bod“ zkopírujte KLÍČ 1 a Umístění/oblast (např. westeurope)
   do polí v Nastavení. Pozor: je to jiný klíč než u Translatoru (jiná služba).
6. Uložit → Otestovat. Ve čtečce pak v kartě Čtení → Nahlas vyberte hlas „Vlasta“ nebo „Antonín“.

Celá kniha mívá 300 000 – 600 000 znaků; nad měsíční limit F0 služba čtení odmítne (nic se neúčtuje).""",
    "webdav": """Synology / WebDAV – knihy a čtení v počítači i v telefonu přes vlastní NAS

Místo Google Disku použijete svůj Synology NAS (nebo Nextcloud, ownCloud či jiný WebDAV server). Na serveru
vznikne složka „Překladač“ s knihami (EPUB) a souborem sync.json (místo čtení, záložky, označené a poznámky).
Data neopustí váš NAS.

1. Balíček WebDAV Server
   V DSM otevřete Centrum balíčků → vyhledejte „WebDAV Server“ → Instalovat → Otevřít.
   Zapněte HTTP (port 5005) a/nebo HTTPS (port 5006) → Použít.

2. Uživatel a sdílená složka (doporučeno)
   Ovládací panel → Sdílená složka → Vytvořit, např. „knihy“.
   Ovládací panel → Uživatel a skupina → Vytvořit uživatele, např. „ctecka“ se silným heslem,
   oprávnění Čtení/zápis jen ke složce „knihy“. (Funguje i váš běžný účet, zvláštní je bezpečnější.)

3. Adresa
   - Doma (stejná Wi-Fi): http://192.168.1.10:5005/knihy  (místo 192.168.1.10 adresa NAS,
     najdete ji v DSM → Ovládací panel → Síť nebo v aplikaci Synology Assistant)
   - Z internetu: https://vas-nas.synology.me:5006/knihy – Ovládací panel → Externí přístup → DDNS
     (adresa …synology.me), Zabezpečení → Certifikát → Přidat → Let's Encrypt, a na routeru přesměrujte port 5006.
     QuickConnect s WebDAV nefunguje.
   Za adresu vždy dejte název sdílené složky (u vlastního účtu může být „home“).

4. Nastavení v Překladači
   Sem vyplňte adresu, uživatele a heslo → Uložit → ✔ Otestovat. Po úspěšném testu se synchronizace přepne
   na Synology (Čtečka → Moje knihy → ☁ → Synology / WebDAV).
   Vlastní certifikát NAS (adresa https://192.168…): zaškrtněte „Důvěřovat vlastnímu certifikátu NAS“ –
   jen v domácí síti. Heslo se ukládá šifrovaně jen v tomto počítači.

5. Telefon
   Aplikace pro Android: Nastavení → Služby a klíče → Synchronizace → Synology / WebDAV → stejná adresa,
   uživatel a heslo → ✔ Otestovat. Telefon nevěří vlastním certifikátům – doma použijte http://…:5005,
   z internetu https s certifikátem Let's Encrypt.

Časté chyby
- HTTP 401 – špatný uživatel nebo heslo (u Synology pozor na dvoufázové ověření – pro WebDAV zvláštní účet).
- HTTP 403 – uživatel nemá právo zápisu do sdílené složky.
- HTTP 404 / 409 – v adrese chybí nebo je špatně název sdílené složky.
- „Server není dostupný“ – NAS je vypnutý, jiný port, nebo jste mimo domácí síť s místní adresou.
""",
    "gdrive": """Google Disk – knihy a čtení v počítači i v telefonu (zdarma)

Začnete číst v počítači a pokračujete v telefonu – a obráceně. Na vašem Google Disku vznikne složka „Překladač“
s knihami (EPUB) a souborem sync.json (místo čtení, záložky, označené a poznámky). Program vidí jen soubory,
které sám vytvořil – zbytek vašeho Disku ne. Přihlašovací klíč si jednou vytvoříte sami (Google to u vlastních
aplikací vyžaduje), zabere to asi 15 minut a je zdarma.

1. Projekt
   Otevřete https://console.cloud.google.com, nahoře „Vybrat projekt“ → „Nový projekt“, název např. Překladač → Vytvořit.

2. Zapnout Google Drive API
   https://console.cloud.google.com/apis/library/drive.googleapis.com → Povolit (Enable).

3. Přihlašovací obrazovka (Google Auth Platform)
   https://console.cloud.google.com/auth/overview → Začínáme (Get started):
   název aplikace „Překladač“, váš e-mail, Cílová skupina (Audience): Externí (External), kontaktní e-mail → Vytvořit.
   Pak v části Cílová skupina (Audience) klikněte na „Publikovat aplikaci“ (Publish app) → V produkci.
   Bez toho Google přihlášení každých 7 dní zruší. Ověření od Googlu není potřeba – program chce jen přístup
   k vlastním souborům (drive.file).

4. Oprávnění
   Přístup k datům (Data access) → Přidat nebo odebrat rozsahy → do pole vložte
   https://www.googleapis.com/auth/drive.file → Přidat do tabulky → Aktualizovat → Uložit.

5. Klient pro přihlášení kódem
   Klienti (Clients) → Vytvořit klienta → Typ aplikace: „TV a zařízení s omezeným vstupem“
   (TVs and Limited Input devices) → název Překladač → Vytvořit.
   Zkopírujte „ID klienta“ a „Tajný klíč klienta“ a vložte je sem do Nastavení → Uložit.
   Klíče se ukládají zašifrovaně jen v tomto počítači – nikomu je neposílejte.

6. Přihlášení
   Klikněte na „🔑 Přihlásit k Disku“. Program ukáže kód – otevřete https://www.google.com/device (klidně
   v telefonu), zadejte kód, vyberte svůj účet Google a povolte přístup. Google může ukázat
   „Aplikace není ověřená“ – je to vaše vlastní aplikace: Rozšířené → Přejít na Překladač.

7. Telefon
   V aplikaci pro Android: Nastavení → Služby a klíče → Google Disk → stejné ID klienta a tajný klíč →
   Přihlásit. Pak Číst → ☁ Synchronizovat.

Jak to funguje
- Při otevření knihy ve čtečce se stáhne místo čtení z Disku – když jste mezitím četli v telefonu, kniha se otevře
  tam. Při čtení se změny po chvíli nahrají zpět (stačí internet).
- Kniha, kterou čtete, se na Disk nahraje jako EPUB, aby se dala otevřít v telefonu. Knihy z telefonu najdete
  ve Čtečce → Moje knihy → ☁ Google Disk.
- Stejná kniha se pozná podle názvu a autora. Smazaná záložka nebo označení zmizí i ve druhém zařízení.

Časté chyby
- „Google nezná ID klienta“ – klient musí být typu „TV a zařízení s omezeným vstupem“, ID a klíč bez mezer.
- „Není zapnuté Google Drive API“ – krok 2, pak pár minut počkejte.
- „Přihlášení vypršelo“ – aplikace není publikovaná (krok 3), přihlaste se znovu.
""",
    "google_tts": """Hlasy Google Cloud pro čtení nahlas – zdarma 1 milion znaků měsíčně (Wavenet)

Přirozený český ženský hlas (Wavenet). Čte se přes internet.

Když už máte klíč pro Google Cloud Translation:
1. Otevřete https://console.cloud.google.com/apis/library/texttospeech.googleapis.com
   (stejný projekt jako pro překlad) a klikněte na „Povolit“ (Enable).
2. Pole „API klíč“ tady nechte prázdné – použije se klíč Google Cloud Translation.
   Pokud má klíč omezení na vybraná API, přidejte k nim „Cloud Text-to-Speech API“.

Nový klíč:
1. https://console.cloud.google.com → vytvořte projekt (účet s platební kartou, limit zdarma se neúčtuje).
2. Povolte „Cloud Text-to-Speech API“ (odkaz výše).
3. „API a služby“ → „Přihlašovací údaje“ → „Vytvořit přihlašovací údaje“ → „Klíč API“.
4. Klíč vložte sem → Uložit → Otestovat. Ve čtečce vyberte hlas „Google Wavenet“.""",
}
