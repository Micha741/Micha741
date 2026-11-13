"""Překladač e-knih a dokumentů – okno pro Windows (a příkazová řádka).

Spuštění bez parametrů otevře okno. Příklady z příkazové řádky:
    Prekladac.exe kniha.epub --to azw3 --engine google
    Prekladac.exe strana.jpg --engine deepl --ocr tesseract --ocr-lang eng
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import threading
import traceback
from pathlib import Path

import components
from converters import IMAGE_EXT, OUTPUT_FORMATS, CalibreMissing, process_file, process_images_together
from free_engines import (
    ENGINE_LABELS, OCR_LABELS, DeepLEngine, EngineError, EngineTranslator, GeminiEngine, GoogleCloudEngine,
    GoogleFreeEngine,
    LibreTranslateEngine, MicrosoftDocumentTranslator, MicrosoftEngine, OfflineEngine, OllamaEngine, OpenAICompatEngine,
    Pipeline,
    TesseractOCR,
)
from version import VERSION

APP_NAME = "Překladač knih a dokumentů"
LANGUAGES = [
    "čeština", "slovenština", "angličtina", "němčina", "polština", "francouzština", "španělština",
    "italština", "ruština", "ukrajinština", "maďarština",
]
SAME_FORMAT = "stejný jako vstup"

# Služby a jejich nastavení: (klíč, popisek, tajné, výchozí hodnota, nabídka hodnot nebo None)
SERVICES = {
    "claude": ("Claude (Anthropic)", [("api_key", "API klíč", True, "", None),
                                      ("model", "Model", False, "", "claude_models")]),
    "deepl": ("DeepL", [("api_key", "API klíč (končí „:fx“)", True, "", None)]),
    "google": ("Google Překladač", []),
    "google_cloud": ("Google Cloud Translation", [("api_key", "API klíč", True, "", None)]),
    "microsoft": ("Microsoft Azure Translator", [
        ("api_key", "KLÍČ 1", True, "", None),
        ("region", "Umístění/oblast (např. westeurope)", False, "", None),
        ("endpoint", "Překlad dokumentu – adresa (nepovinné)", False, "", None),
    ]),
    "gemini": ("Google Gemini", [("api_key", "API klíč", True, "", None),
                                 ("model", "Model", False, GeminiEngine.DEFAULT_MODEL, None)]),
    "ollama": ("Ollama (AI v počítači)", [("url", "Adresa", False, "http://localhost:11434", None),
                                          ("model", "Model", False, OllamaEngine.DEFAULT_MODEL, None)]),
    "libre": ("LibreTranslate", [("url", "Adresa serveru", False, "http://localhost:5000", None),
                                 ("api_key", "API klíč (nepovinný)", True, "", None)]),
    "openai": ("OpenAI-kompatibilní (OpenAI, DeepSeek, Mistral, OpenRouter, Groq…)", [
        ("url", "Adresa API", False, "https://api.openai.com/v1", None),
        ("api_key", "API klíč", True, "", None),
        ("model", "Model", False, "", None),
    ]),
    # hlasy pro čtení nahlas ve čtečce (nejsou to překladače)
    "azure_speech": ("Hlasy Microsoft Azure pro čtení nahlas (Vlasta, Antonín)", [
        ("api_key", "KLÍČ 1 (služba Speech)", True, "", None),
        ("region", "Umístění/oblast (např. westeurope)", False, "", None),
    ]),
    "google_tts": ("Hlasy Google Cloud pro čtení nahlas (Wavenet)", [
        ("api_key", "API klíč (prázdné = klíč Google Cloud Translation)", True, "", None),
    ]),
}
TTS_SERVICES = ("azure_speech", "google_tts")
ENGINE_SERVICE = {"microsoft_doc": "microsoft"}  # překladač → služba, jejíž nastavení používá
ENV_KEYS = {"claude": "ANTHROPIC_API_KEY", "deepl": "DEEPL_API_KEY", "gemini": "GEMINI_API_KEY",
            "google_cloud": "GOOGLE_TRANSLATE_API_KEY",
            "microsoft": "AZURE_TRANSLATOR_KEY", "openai": "OPENAI_API_KEY"}
SERVICE_HELP = {
    "claude": ("Placené podle spotřeby. Klíč: platform.claude.com → API Keys.", "https://platform.claude.com"),
    "deepl": ("Zdarma 500 000 znaků/měsíc. Klíč: deepl.com → účet → API Keys.",
              "https://www.deepl.com/your-account/keys"),
    "google": ("Bez registrace. Při velkém množství textu může Google dočasně omezit přístup – program pak "
               "počká a pokračuje (celá kniha se proto překládá pomaleji).", None),
    "google_cloud": ("Oficiální služba Google: zdarma 500 000 znaků/měsíc, pak asi 20 USD za milion. "
                     "Vyžaduje účet Google Cloud s platební kartou.",
                     "https://console.cloud.google.com/apis/library/translate.googleapis.com"),
    "microsoft": ("Zdarma 2 mil. znaků/měsíc (úroveň F0). Azure → Translator → Klíče a koncový bod. "
                  "„Překlad dokumentu“ je druhé API – přeloží celý DOCX/PDF/PPTX a zachová vzhled.",
                  "https://portal.azure.com"),
    "azure_speech": ("Přirozené (neuronové) hlasy pro čtení nahlas ve čtečce – česky Vlasta a Antonín, slovensky "
                     "Viktória a Lukáš. Zdarma 500 000 znaků/měsíc (úroveň F0), potřebuje internet. Azure → Speech "
                     "service → Klíče a koncový bod.", "https://portal.azure.com"),
    "google_tts": ("Přirozený hlas Google (Wavenet) pro čtení nahlas ve čtečce. Zdarma 1 milion znaků/měsíc, "
                   "potřebuje internet. Stačí klíč Google Cloud Translation, když v projektu zapnete Cloud "
                   "Text-to-Speech API.", "https://console.cloud.google.com/apis/library/texttospeech.googleapis.com"),
    "gemini": ("Bezplatná úroveň s limity. Klíč: aistudio.google.com → Get API key.",
               "https://aistudio.google.com/apikey"),
    "ollama": ("Offline, zdarma. Nainstalujte Ollama a stáhněte model: ollama pull gemma3:12b", "https://ollama.com"),
    "libre": ("Pro pokročilé: vlastní překladový server (v tomto počítači, na jiném počítači nebo NAS v síti). Pro "
              "jeden počítač je jednodušší „Offline v počítači“ – stejné modely bez serveru.",
              "https://github.com/LibreTranslate/LibreTranslate"),
    "openai": ("Placené podle spotřeby (DeepSeek je velmi levný, OpenRouter má i modely zdarma). "
               "Adresu API a název modelu najdete v Návodu.", None),
}
TESSERACT_URL = "https://github.com/UB-Mannheim/tesseract/releases"
RELEASES_URL = "https://github.com/Micha741/Micha741/releases/tag/prekladac-latest"
CALIBRE_URL = "https://calibre-ebook.com/download_windows"


def service_of(engine: str) -> str:
    return ENGINE_SERVICE.get(engine, engine)


# --------------------------------------------------------------- nastavení
def config_path() -> Path:
    return components.app_dir() / "config.json"


def load_config() -> dict:
    try:
        cfg = json.loads(config_path().read_text(encoding="utf-8"))
    except Exception:
        cfg = {}
    engines = cfg.setdefault("engines", {})
    if cfg.get("api_key") or cfg.get("model"):  # převod ze první verze
        c = engines.setdefault("claude", {})
        c.setdefault("api_key", cfg.pop("api_key", ""))
        c.setdefault("model", cfg.pop("model", ""))
    for name, (_t, fields) in SERVICES.items():
        sect = engines.setdefault(name, {})
        for key, _l, secret, _d, _c in fields:
            if secret:
                sect[key] = components.unprotect_secret(sect.get(key, ""))
    return cfg


def save_config(cfg: dict) -> None:
    data = json.loads(json.dumps(cfg))
    for name, (_t, fields) in SERVICES.items():
        sect = data.get("engines", {}).get(name, {})
        for key, _l, secret, _d, _c in fields:
            if secret and sect.get(key):
                sect[key] = components.protect_secret(sect[key])
    data.pop("remember_keys", None)
    config_path().write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def service_ready(cfg: dict, service: str) -> tuple[bool, str]:
    """Je služba nastavená? Vrátí (ok, popis) pro stavový řádek v hlavním okně."""
    sect = cfg.get("engines", {}).get(service, {})
    if service in ("google",):
        return True, "připraveno, klíč není potřeba"
    if service == "offline":
        import offline_mt

        pairs = offline_mt.installed()
        if not pairs:
            return False, "chybí offline balíček – ⚙ Nastavení → Součásti → Offline překlad"
        return True, "offline: " + ", ".join(f"{a}→{b}" for a, b in sorted(pairs))
    if service in ("ollama", "libre"):
        return True, f"adresa {sect.get('url') or 'výchozí'}"
    if service == "openai" and not sect.get("model"):
        return False, "chybí název modelu – otevřete ⚙ Nastavení"
    key = sect.get("api_key") or os.environ.get(ENV_KEYS.get(service, ""), "")
    return (True, "klíč nastaven") if key else (False, "chybí klíč – otevřete ⚙ Nastavení")


# ----------------------------------------------------- sestavení překladače
def make_engine(name: str, lang: str, cfg: dict, notes: str):
    key = (cfg.get("api_key") or os.environ.get(ENV_KEYS.get(name, ""), "")).strip()
    if name == "deepl":
        return DeepLEngine(lang, key)
    if name == "offline":
        return OfflineEngine(lang, cfg.get("source", ""))
    if name == "google":
        return GoogleFreeEngine(lang)
    if name == "google_cloud":
        return GoogleCloudEngine(lang, key)
    if name == "microsoft":
        return MicrosoftEngine(lang, key, cfg.get("region", ""))
    if name == "gemini":
        return GeminiEngine(lang, key, cfg.get("model", ""), notes)
    if name == "ollama":
        return OllamaEngine(lang, cfg.get("url", ""), cfg.get("model", ""), notes)
    if name == "libre":
        return LibreTranslateEngine(lang, cfg.get("url", ""), key)
    if name == "openai":
        return OpenAICompatEngine(lang, cfg.get("url", ""), key, cfg.get("model", ""), notes)
    raise EngineError(f"Neznámý překladač: {name}")


def build_translator(s: dict, translate: bool, needs_ocr: bool, log, cancel_event):
    """Podle nastavení vytvoří objekt, který umí překládat a/nebo číst text z obrázků."""
    engine, lang, notes = s["engine"], s["lang"], s.get("notes", "")
    engines = s.get("engines", {})
    claude = None

    def get_claude():
        nonlocal claude
        if claude is None:
            from claude_client import DEFAULT_MODEL, ClaudeTranslator

            c = engines.get("claude", {})
            key = c.get("api_key") or os.environ.get("ANTHROPIC_API_KEY")
            if not key:
                raise EngineError("Chybí Claude API klíč (⚙ Nastavení → Služby a klíče).")
            claude = ClaudeTranslator(api_key=key, model=c.get("model") or DEFAULT_MODEL, target_lang=lang,
                                      notes=notes, log=log, cancel_event=cancel_event)
        return claude

    segs, doc = None, None
    if translate:
        if engine == "claude":
            segs = get_claude()
        elif engine == "microsoft_doc":
            m = engines.get("microsoft", {})
            key = m.get("api_key") or os.environ.get("AZURE_TRANSLATOR_KEY", "")
            doc = MicrosoftDocumentTranslator(lang, key, m.get("endpoint", ""))
            # e-knihy a TXT tato služba neumí → překlad textu stejným klíčem
            segs = EngineTranslator(MicrosoftEngine(lang, key, m.get("region", "")), log, cancel_event)
        else:
            segs = EngineTranslator(make_engine(engine, lang, engines.get(engine, {}), notes), log, cancel_event)

    ocr = None
    if needs_ocr:
        o = s.get("ocr", "tesseract")
        if o == "claude":
            if translate and engine == "claude":
                return get_claude()  # Claude přečte a přeloží v jednom kroku
            ocr = get_claude()
        elif o == "gemini":
            ocr = make_engine("gemini", lang, engines.get("gemini", {}), notes)
        else:
            ocr = TesseractOCR(s.get("ocr_lang") or "eng", s.get("paths", {}).get("tesseract") or None, log)

    if segs is None and ocr is None:
        return None
    if ocr is None and doc is None and engine == "claude":
        return segs
    return Pipeline(segs, ocr, lang, document_translator=doc)


def files_need_ocr(files: list[str], out_fmt: str | None, translate: bool, engine: str = "") -> bool:
    """Obrázky vždy; PDF při překladu nebo převodu do DOCX (stejná logika jako process_file)."""
    for f in files:
        ext = Path(f).suffix.lower()
        if ext in IMAGE_EXT:
            if not translate and out_fmt == "pdf":
                continue  # obrázky jen poskládat do PDF – bez rozpoznávání textu
            return True
        if ext == ".pdf" and engine == "microsoft_doc" and translate:
            continue  # PDF přeloží Microsoft celé
        if ext == ".pdf" and (translate or out_fmt in (None, SAME_FORMAT, "docx")):
            return True
    return False


def run_jobs(files, translate, out_fmt, tr, out_dir, merge_images, log, progress, ebook_convert, cancel_event):
    """Zpracuje seznam souborů; vrátí seznam výsledných cest."""
    from claude_client import Cancelled

    images = [f for f in files if Path(f).suffix.lower() in IMAGE_EXT]
    others = [f for f in files if f not in images]
    jobs: list[tuple[str, list[str]]] = [("file", [f]) for f in others]
    if merge_images and len(images) > 1:
        jobs.append(("images", images))
    else:
        jobs += [("file", [f]) for f in images]

    results = []
    for n, (kind, paths) in enumerate(jobs):
        if cancel_event.is_set():
            log("Zastaveno.")
            break
        merged_fmt = out_fmt if out_fmt not in (None, SAME_FORMAT) else "docx"
        label = Path(paths[0]).name if kind == "file" else f"{len(paths)} obrázků → jeden {merged_fmt.upper()}"
        log(f"[{n + 1}/{len(jobs)}] {label}")
        step = lambda f, n=n: progress((n + max(0.0, min(1.0, f))) / len(jobs))  # noqa: E731
        try:
            if kind == "images":
                out = process_images_together(sorted(paths), translate, tr, out_dir, log, step,
                                              fmt=merged_fmt, ebook_convert=ebook_convert)
            else:
                fmt = None if out_fmt in (None, SAME_FORMAT) else out_fmt
                out = process_file(paths[0], fmt, translate, tr, out_dir, log, step, ebook_convert)
            log(f"  ✓ Uloženo: {out}")
            results.append(out)
        except Cancelled:
            log("Zastaveno.")
            break
        except (CalibreMissing, EngineError) as e:
            log(f"  ✗ {e}")
        except Exception as e:  # noqa: BLE001 – chyba jednoho souboru nemá zastavit ostatní
            log(f"  ✗ Chyba: {e}")
            if os.environ.get("PREKLADAC_DEBUG"):
                log(traceback.format_exc())
    if tr is not None and hasattr(tr, "cost_summary"):
        summary = tr.cost_summary()
        if summary:
            log(summary)
    progress(1.0)
    return results


def test_service(service: str, cfg: dict, lang: str) -> str:
    """Zkusí krátký překlad, aby uživatel hned viděl, jestli klíč funguje."""
    sample = "Hello, this is a test of the translation service."
    sect = cfg.get("engines", {}).get(service, {})
    if service in TTS_SERVICES:
        import tempfile

        import tts_win

        tts_win.configure_cloud(cfg.get("engines", {}))
        voice = next(v for v in tts_win.CLOUD_VOICES["cs"] if v[0] == service.split("_")[0])
        with tempfile.TemporaryDirectory() as tmp:
            out = os.path.join(tmp, "test.wav")
            tts_win.cloud_synthesize("Dobrý den, tohle je hlas pro čtení knih.", voice[0], voice[1], 1.0, out)
            sec = tts_win.wav_seconds(out)
        return f"Hlas {voice[2]} funguje – namluveno {sec:.1f} s zvuku. Vyberte ho ve čtečce v kartě Čtení → Nahlas."
    if service == "claude":
        s = {"engine": "claude", "lang": lang, "engines": cfg.get("engines", {})}
        tr = build_translator(s, True, False, lambda *_: None, threading.Event())
        return tr.translate_segments([sample], markup=False)[0]
    eng = make_engine(service, lang, sect, "")
    out = EngineTranslator(eng, log=lambda *_: None).translate_segments([sample], markup=False)[0]
    if out == sample:
        raise EngineError("Služba vrátila nepřeložený text.")
    result = f"Překlad textu: {out}"
    if service == "microsoft" and sect.get("endpoint"):
        import tempfile

        doc = MicrosoftDocumentTranslator(lang, sect.get("api_key", ""), sect["endpoint"])
        with tempfile.TemporaryDirectory() as tmp:
            src, dst = os.path.join(tmp, "test.txt"), os.path.join(tmp, "out.txt")
            Path(src).write_text(sample, encoding="utf-8")
            doc.translate_document(src, dst, lambda *_: None)
            result += f"\nPřeklad dokumentu: {Path(dst).read_text(encoding='utf-8', errors='replace').strip()}"
    return result


# -------------------------------------------------------------------- GUI
def run_gui(skin_file: str | None = None) -> None:
    from qt_main import main

    main(skin_file)


# ---------------------------------------------------------- příkazová řádka
def run_cli(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=APP_NAME)
    ap.add_argument("files", nargs="+")
    ap.add_argument("--to", dest="fmt", choices=OUTPUT_FORMATS, help="výstupní formát (výchozí: podle vstupu)")
    ap.add_argument("--lang", default="čeština", help="cílový jazyk (výchozí: čeština)")
    ap.add_argument("--engine", default="google", choices=list(ENGINE_LABELS), help="překladač (výchozí: google)")
    ap.add_argument("--ocr", default="tesseract", choices=list(OCR_LABELS), help="OCR pro obrázky a skeny")
    ap.add_argument("--ocr-lang", default="eng", help="jazyk textu pro Tesseract, např. eng, ces, eng+deu")
    ap.add_argument("--key", default="", help="API klíč (jinak z Nastavení programu nebo proměnné prostředí)")
    ap.add_argument("--model", default="", help="model (Claude, Gemini, Ollama)")
    ap.add_argument("--url", default="", help="adresa serveru (Ollama, LibreTranslate)")
    ap.add_argument("--region", default="", help="oblast Azure (Microsoft)")
    ap.add_argument("--endpoint", default="", help="adresa „Překlad dokumentu“ (Microsoft)")
    ap.add_argument("--convert-only", action="store_true", help="jen převést / přepsat, nepřekládat")
    ap.add_argument("--out-dir")
    ap.add_argument("--notes", default="", help="pokyny pro překlad (glosář, styl)")
    ap.add_argument("--merge-images", action="store_true", help="více obrázků do jednoho dokumentu (DOCX, nebo vícestránkové PDF s --to pdf)")
    ap.add_argument("--calibre", help="cesta k ebook-convert")
    ap.add_argument("--tesseract", help="cesta k tesseract")
    ap.add_argument("--log", help="výpis uložit i do tohoto souboru")
    a = ap.parse_args(argv)

    log_file = open(a.log, "w", encoding="utf-8") if a.log else None

    def out(text: str) -> None:
        print(text)
        if log_file:
            log_file.write(text + "\n")
            log_file.flush()

    saved = load_config()
    engines = saved.get("engines", {})
    sect = engines.setdefault(service_of(a.engine), {})
    for key, val in (("api_key", a.key), ("model", a.model), ("url", a.url), ("region", a.region),
                     ("endpoint", a.endpoint)):
        if val:
            sect[key] = val
    paths = saved.get("paths", {})
    s = {"engine": a.engine, "ocr": a.ocr, "lang": a.lang, "notes": a.notes, "ocr_lang": a.ocr_lang,
         "paths": {"tesseract": a.tesseract or paths.get("tesseract", "")}, "engines": engines}
    cancel = threading.Event()
    translate = not a.convert_only
    try:
        tr = build_translator(s, translate, files_need_ocr(a.files, a.fmt, translate, a.engine), out, cancel)
    except EngineError as e:
        out(str(e))
        return 2
    res = run_jobs(a.files, translate, a.fmt, tr, a.out_dir, a.merge_images, out, lambda f: None,
                   a.calibre or paths.get("ebook_convert"), cancel)
    return 0 if len(res) == len(a.files) or (a.merge_images and res) else 1


def _install_offline(pairs: str, report: Path | None = None) -> int:
    """Stáhne offline balíčky (např. „en_cs,de_en“); volá instalátor, když je zaškrtnutý offline překlad."""
    import offline_mt

    lines = []
    try:
        index = offline_mt.available()
        for pair in [p.strip() for p in pairs.split(",") if p.strip()]:
            a, _, b = pair.partition("_")
            if (a, b) in offline_mt.installed():
                lines.append(f"{pair}: už je nainstalovaný")
                continue
            pkg = max((p for p in index if p["from_code"] == a and p["to_code"] == b),
                      key=lambda p: [int(x) for x in re.findall(r"\d+", str(p.get("package_version", "0")))] or [0],
                      default=None)
            if not pkg:
                lines.append(f"{pair}: balíček neexistuje")
                continue
            offline_mt.install(pkg, lines.append)
        code = 0
    except Exception as e:  # noqa: BLE001
        lines.append(f"Chyba: {e}")
        code = 1
    text = "\n".join(lines)
    if report:
        report.write_text(text, encoding="utf-8")
    else:
        print(text)
    return code


def _gui_selftest(report: Path) -> int:
    os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
    try:
        import tempfile

        from PySide6 import QtWidgets

        import qt_main
        from qt_editor import BookEditor

        qapp = QtWidgets.QApplication.instance() or QtWidgets.QApplication([])
        w = qt_main.MainWindow()
        for i in range(3):
            w.nav.setCurrentRow(i)
            qapp.processEvents()
        proj = {"language": "čeština", "words": 1000,
                "outline": {"title": "Test", "synopsis": "", "characters": [],
                            "chapters": [{"title": "Jedna", "summary": ""}]},
                "chapters": [{"text": "Ahoj světe.", "summary": ""}]}
        path = Path(tempfile.mkdtemp()) / "t.kniha.json"
        ed = BookEditor(proj, path, None)
        ed._merge(bold=True)
        ed.save()
        qapp.processEvents()
        # přibalený český slovník a knihovna spylls (kontrola pravopisu, návrhy slov)
        import spell
        from qt_common import asset

        base = spell.find_dictionary()
        if not base:
            raise RuntimeError("chybí český slovník (složka dict)")
        sp = spell.Speller(base)
        if not sp.check("kniha") or sp.check("knyha") or "kniha" not in sp.suggest("knyha"):
            raise RuntimeError("slovník nefunguje")
        if not Path(asset("icon.ico")).is_file():
            raise RuntimeError("chybí ikona assets/icon.ico")
        import i18n

        for code in ("en", "sk", "de"):
            if not i18n.load(code) or i18n.tr("Uložit") == "Uložit":
                raise RuntimeError(f"chybí jazyk programu {code} (assets/lang)")
        i18n.load("cs")
        report.write_text("ok " + VERSION, encoding="utf-8")
        return 0
    except Exception:  # noqa: BLE001
        report.write_text(traceback.format_exc(), encoding="utf-8")
        return 1


def _setup_streams(cli: bool) -> None:
    """Prekladac.exe nemá vlastní konzoli: v režimu příkazové řádky se připojí ke konzoli, ze které byl spuštěn."""
    if cli and sys.platform == "win32" and sys.stdout is None:
        try:
            import ctypes

            if ctypes.windll.kernel32.AttachConsole(-1):  # -1 = konzole rodičovského procesu
                sys.stdout = open("CONOUT$", "w", encoding="utf-8", buffering=1)
                sys.stderr = sys.stdout
        except Exception:
            pass
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w", encoding="utf-8")
    if sys.stderr is None:
        sys.stderr = sys.stdout
    for stream in (sys.stdout, sys.stderr):  # české znaky i v konzoli s jiným kódováním (např. cp1252)
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


if __name__ == "__main__":
    _setup_streams(len(sys.argv) > 1)
    if sys.argv[1:2] == ["--version"]:
        print(VERSION)
        sys.exit(0)
    if sys.argv[1:2] == ["--version-file"] and len(sys.argv) > 2:  # pro kontrolu v CI (okenní .exe nemá konzoli)
        Path(sys.argv[2]).write_text(VERSION, encoding="utf-8")
        sys.exit(0)
    if sys.argv[1:2] == ["--gui-selftest"] and len(sys.argv) > 2:  # CI: okno a editor se dají sestavit
        sys.exit(_gui_selftest(Path(sys.argv[2])))
    if sys.argv[1:2] == ["--install-offline"] and len(sys.argv) > 2:  # instalátor: volitelné offline balíčky
        sys.exit(_install_offline(sys.argv[2], Path(sys.argv[3]) if len(sys.argv) > 3 else None))
    if len(sys.argv) == 2 and sys.argv[1].lower().endswith(".skin") and Path(sys.argv[1]).is_file():
        run_gui(sys.argv[1])  # dvojklik na skin ve Windows
        sys.exit(0)
    if len(sys.argv) > 1:
        sys.exit(run_cli(sys.argv[1:]))
    run_gui()
