# Překladač knih pro Android

Mobilní verze Překladače (Expo SDK 57, React Native). Desktopová verze pro Windows je ve složce `../prekladac`.

## Co umí (verze 1.0)

- **Otevře:** EPUB, DOCX, TXT (i starší kódování Windows), MOBI a PRC (bez DRM a bez komprese HUFF), PDB (PalmDoc),
  projekt `*.kniha.json` z desktopového Překladače.
- **Uloží:** EPUB 3 (s obsahem a obálkou), MOBI (Kindle, s obálkou, obrázky a obsahem s odkazy), PDF (A4),
  DOCX, PDB (PalmDoc, jen text), TXT, projekt `*.kniha.json`.
- **Přeloží:** Google (zdarma), Claude (Opus 5.5 / Sonnet 5.5 / Haiku 5.5), Google Gemini, DeepL,
  OpenRouter a další služby kompatibilní s OpenAI.
- **Obrázky:** obálka knihy a vložení obrázku na začátek nebo konec kapitoly.
- Klíče se ukládají zašifrovaně v telefonu (`expo-secure-store`).

Zatím ne: PDF, AZW3 a KFX jako vstup, psaní knihy s AI, offline překlad a OCR.

## Vývoj

```bash
npm install
npm test            # testy jádra (formáty, překlad) v Node
npx tsc --noEmit    # kontrola typů
npx expo start      # spuštění pro vývoj
```

Jádro (`src/core`) je čistý TypeScript bez závislosti na telefonu, proto jde testovat v Node.
Napojení na telefon (soubory, obrázky, PDF, sdílení) je v `src/platform.ts`, obrazovky v `App.tsx`.

## Sestavení APK

```bash
npx eas-cli@latest build --platform android --profile preview
```

Profil `preview` v `eas.json` vytvoří instalovatelný soubor APK.
