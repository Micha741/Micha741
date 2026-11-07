"""Volby žánru a stylu pro „Napsat knihu“."""

GENRES = [
    "Román (obecný)", "Detektivka", "Krimi", "Thriller", "Psychologický thriller", "Špionážní román",
    "Horor", "Mysteriózní", "Fantasy", "Epická fantasy", "Urban fantasy", "Pohádková fantasy",
    "Sci-fi", "Space opera", "Cyberpunk", "Steampunk", "Dystopie", "Postapokalyptický",
    "Historický román", "Válečný román", "Dobrodružný", "Western", "Romantika", "Romantická komedie",
    "Erotika", "Paranormální romance", "Humor / komedie", "Satira", "Drama", "Rodinná sága",
    "Young adult", "Dětská kniha", "Pohádky", "Mýty a legendy", "Biografie / memoáry",
    "Literatura faktu", "Cestopis", "Osobní rozvoj", "Duchovní / esoterika", "Právnický / soudní",
    "Lékařský", "Sportovní",
]

AUDIENCES = ["Děti 6–10 let", "Starší děti 10–14 let", "Mládež (young adult)", "Dospělí", "Dospělí 18+"]

NARRATORS = ["Er-forma (3. osoba)", "Ich-forma (1. osoba)", "Vševědoucí vypravěč", "Více vypravěčů",
             "Deníková forma", "V dopisech / zprávách", "Přítomný čas"]

TONES = ["Napínavý", "Temný", "Humorný", "Romantický", "Smyslný", "Melancholický", "Optimistický",
         "Poetický", "Syrový / realistický", "Ironický", "Tajemný", "Dojemný", "Akční", "Hororově děsivý"]

TEMPOS = ["Rychlé, akční", "Vyvážené", "Pomalé, popisné"]

SETTINGS = ["Současnost", "Blízká minulost (20. století)", "Středověk", "Starověk", "Novověk (16.–19. stol.)",
            "Blízká budoucnost", "Vzdálená budoucnost / vesmír", "Vymyšlený svět", "Česko", "Malé město / vesnice",
            "Velkoměsto"]

LANGUAGE_STYLES = ["Spisovná čeština", "Hovorová čeština v dialozích", "Literární, obrazný jazyk",
                   "Jednoduchý jazyk", "Archaický jazyk", "Úsporný, strohý styl"]

CATEGORIES = [  # (klíč, popisek, hodnoty)
    ("genre", "Žánr", GENRES),
    ("audience", "Pro koho", AUDIENCES),
    ("narrator", "Vypravěč", NARRATORS),
    ("tone", "Tón / atmosféra", TONES),
    ("tempo", "Tempo", TEMPOS),
    ("setting", "Prostředí / doba", SETTINGS),
    ("language_style", "Jazyk", LANGUAGE_STYLES),
]

MATURE_NOTE = (
    "Erotika / 18+: Claude a Gemini píší smyslné a romantické scény citlivě, bez explicitních popisů; "
    "explicitní obsah mohou odmítnout. U Ollamy a dalších služeb záleží na zvoleném modelu."
)


def compose_style(parts: dict, extra: str = "") -> str:
    """Složí vybrané volby do jednoho popisu stylu pro AI."""
    items = [f"{label}: {parts[key].strip()}" for key, label, _v in CATEGORIES if parts.get(key, "").strip()]
    if extra.strip():
        items.append(f"Další přání: {extra.strip()}")
    return "; ".join(items)


def is_mature(parts: dict) -> bool:
    return any(w in (parts.get("genre", "") + parts.get("audience", "")).lower() for w in ("erotik", "18+"))
