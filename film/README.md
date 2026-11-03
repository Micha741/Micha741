# Robot Bzuk – 3D postavička pro krátký film

Skript `robot_film.py` v Blenderu postaví celou scénu (robota, louku, stromy, světla a kameru)
a robota rozpohybuje. Výsledek je 10 sekund při 24 fps (240 snímků).

| Čas | Co se děje |
|---|---|
| 0–4 s | Bzuk přichází zleva a chodí (nohy, ruce, pohupování) |
| 4–5 s | zastaví se, otočí se ke kameře a zvědavě nakloní hlavu |
| 5–7 s | mává |
| 7–8,5 s | přikrčí se a vyskočí (squash & stretch) |
| 8,5–10 s | dopadne a radostí se zatočí, anténa bliká |

Kamera přitom plynule sleduje robota a pomalu se k němu přibližuje. Oči občas mrknou.

## Jak to spustit

1. Nainstaluj si [Blender](https://www.blender.org/download/) (zdarma, verze 4.2 nebo novější).
2. Otevři Blender, přepni se na záložku **Scripting**, dej **Open**, vyber `robot_film.py` a klikni na **Run Script** (▶).
3. Přepni se zpět do **Layout** a mezerníkem spusť přehrávání animace.
4. Video vyrenderuješ přes **Render → Render Animation**. Uloží se jako `film/render/bzuk.mp4`.

Totéž jde i z příkazové řádky:

```bash
blender -b -P film/robot_film.py -- --render
```

```bash
blender -b -P film/robot_film.py -- --render --preview
```

```bash
blender -b -P film/robot_film.py -- --glb
```

Druhý příkaz udělá rychlý náhled v menším rozlišení. Třetí vyexportuje model i s animací
do `bzuk.glb`, který otevřeš v jiných programech (Unity, Unreal, three.js…).

## Úpravy

- **Barva robota:** v `build_robot()` změň barvu u `material("Telo", (0.95, 0.45, 0.10) ...)` (hodnoty R, G, B od 0 do 1).
- **Délka a načasování:** v `animate()` jsou čísla snímků (24 snímků = 1 sekunda).
- **Rychlost chůze:** proměnná `step` (menší číslo znamená rychlejší kroky).
- Celou scénu můžeš po spuštění skriptu dál ručně upravovat přímo v Blenderu.

## Postavička Ela (`postava_film.py`)

Stejný styl a stejné spouštění jako u robota. Výchozí nastavení `SCENA = "film"` postaví
**20sekundový film** ze dvou scén, mezi kterými se přestřihne kamera:

1. **Rozcvička (0–10 s):** protažení, dvakrát panák, otočka dokola, rozkročení a mávání.
2. **Pózy (10–20 s):** ruce nad hlavu, pomalá otočka bokem a zády, ruce do V, dřep s rukama
   nahoře v záběru shora a návrat do klidu.

Jen jednu scénu dostaneš, když na začátku souboru nastavíš `SCENA = "rozcvicka"` nebo
`SCENA = "pozy"`. Barvy oblečení a vlasů se mění hned pod tím.
