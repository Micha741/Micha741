"""Návody, jak získat klíče ke službám (zobrazují se v Nastavení tlačítkem „Návod“)."""

GUIDES = {
    "google": """Google Překladač – bez klíče

Nic se nenastavuje. Stačí v hlavním okně zvolit překladač „Google Překladač“.

Pozor: jde o neoficiální bezplatný přístup. Při překladu velkého množství textu
může Google přístup na čas omezit. Na celé knihy je spolehlivější DeepL Free nebo Gemini.""",

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

1. Stáhněte a nainstalujte Ollama z https://ollama.com.
2. V příkazovém řádku stáhněte model, např.:  ollama pull gemma3:12b
   (menší a rychlejší: gemma3:4b; kvalita češtiny je slabší než u online služeb).
3. Ollama běží na pozadí na adrese http://localhost:11434 – tu nechte v poli „Adresa“.
4. Do pole „Model“ napište název staženého modelu, Uložit → Otestovat.

Potřebuje výkonnější počítač (ideálně s grafickou kartou); překlad knihy může trvat hodiny.""",

    "libre": """LibreTranslate – vlastní překladový server (zdarma, offline)

1. Potřebujete Python (https://www.python.org). V příkazovém řádku:
      pip install libretranslate
2. Spusťte server jen s potřebnými jazyky (angličtinu nechte vždy):
      libretranslate --load-only en,cs,de
   První spuštění stáhne jazykové modely, chvíli trvá. Okno nechte otevřené.
3. Zkouška v PowerShellu (pište curl.exe, ne curl):
      curl.exe -X POST http://localhost:5000/translate -d q="Hello" -d source=en -d target=cs
4. Sem do pole „Adresa serveru“ nechte http://localhost:5000, Uložit → Otestovat.

Kvalita češtiny je slabší než u DeepL, Gemini nebo Claude; výhodou je, že text neopouští počítač.""",

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
   použije správnou sám. U OpenRouteru má model tvar „výrobce/model“, např. deepseek/deepseek-chat
   nebo model končící „:free“ (seznam na openrouter.ai/models).
4. Uložit → Otestovat.

Hodí se pro překlad i pro „Napsat knihu“. Kvalita češtiny se liší podle modelu – vyzkoušejte
nejdřív krátký text nebo knihu o 3 kratších kapitolách.""",
}
