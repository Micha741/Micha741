"""Překladač e-knih a dokumentů – okno pro Windows (a příkazová řádka).

Spuštění bez parametrů otevře okno. Příklady z příkazové řádky:
    Prekladac.exe kniha.epub --to azw3 --engine google
    Prekladac.exe strana.jpg --engine deepl --ocr tesseract --ocr-lang eng
"""

from __future__ import annotations

import argparse
import json
import os
import queue
import sys
import threading
import traceback
import webbrowser
from pathlib import Path

import components
from guides import GUIDES
from version import VERSION
from converters import (
    DOC_ONLY_EXT, IMAGE_EXT, OUTPUT_FORMATS, SUPPORTED_EXT, CalibreMissing, find_ebook_convert, process_file,
    process_images_together,
)
from free_engines import (
    ENGINE_LABELS, OCR_LABELS, DeepLEngine, EngineError, EngineTranslator, GeminiEngine, GoogleFreeEngine,
    LibreTranslateEngine, MicrosoftDocumentTranslator, MicrosoftEngine, OllamaEngine, OpenAICompatEngine, Pipeline,
    TesseractOCR, find_tesseract,
)

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
}
ENGINE_SERVICE = {"microsoft_doc": "microsoft"}  # překladač → služba, jejíž nastavení používá
ENV_KEYS = {"claude": "ANTHROPIC_API_KEY", "deepl": "DEEPL_API_KEY", "gemini": "GEMINI_API_KEY",
            "microsoft": "AZURE_TRANSLATOR_KEY", "openai": "OPENAI_API_KEY"}
SERVICE_HELP = {
    "claude": ("Placené podle spotřeby. Klíč: platform.claude.com → API Keys.", "https://platform.claude.com"),
    "deepl": ("Zdarma 500 000 znaků/měsíc. Klíč: deepl.com → účet → API Keys.",
              "https://www.deepl.com/your-account/keys"),
    "google": ("Bez registrace. Při velkém množství textu může Google dočasně omezit přístup.", None),
    "microsoft": ("Zdarma 2 mil. znaků/měsíc (úroveň F0). Azure → Translator → Klíče a koncový bod. "
                  "„Překlad dokumentu“ je druhé API – přeloží celý DOCX/PDF/PPTX a zachová vzhled.",
                  "https://portal.azure.com"),
    "gemini": ("Bezplatná úroveň s limity. Klíč: aistudio.google.com → Get API key.",
               "https://aistudio.google.com/apikey"),
    "ollama": ("Offline, zdarma. Nainstalujte Ollama a stáhněte model: ollama pull gemma3:12b", "https://ollama.com"),
    "libre": ("Vlastní server LibreTranslate nebo veřejná instance s klíčem.", "https://libretranslate.com"),
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
    if name == "google":
        return GoogleFreeEngine(lang)
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
        label = Path(paths[0]).name if kind == "file" else f"{len(paths)} obrázků → jeden DOCX"
        log(f"[{n + 1}/{len(jobs)}] {label}")
        step = lambda f, n=n: progress((n + max(0.0, min(1.0, f))) / len(jobs))  # noqa: E731
        try:
            if kind == "images":
                out = process_images_together(sorted(paths), translate, tr, out_dir, log, step)
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
def run_gui() -> None:
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk
    from tkinter.scrolledtext import ScrolledText

    from claude_client import DEFAULT_MODEL, MODELS

    try:  # přetahování souborů myší – volitelné
        from tkinterdnd2 import DND_FILES, TkinterDnD
        root = TkinterDnD.Tk()
        dnd = True
    except Exception:
        root = tk.Tk()
        dnd = False

    cfg = load_config()
    cfg.setdefault("paths", {})
    for old in ("ebook_convert", "tesseract"):  # převod ze starší verze
        if cfg.get(old) and not cfg["paths"].get(old):
            cfg["paths"][old] = cfg.pop(old)
    if not cfg["paths"].get("ebook_convert"):
        cfg["paths"]["ebook_convert"] = find_ebook_convert() or ""
    if not cfg["paths"].get("tesseract"):
        cfg["paths"]["tesseract"] = find_tesseract() or ""

    root.title(f"{APP_NAME} – verze {VERSION}")
    root.geometry("900x760")
    root.minsize(760, 600)

    msgs: queue.Queue = queue.Queue()
    cancel_event = threading.Event()
    files: list[str] = []
    pad = {"padx": 8, "pady": 3}

    def log(text: str):
        msgs.put(("log", text))

    def progress(f: float):
        msgs.put(("progress", f))

    def in_thread(fn, done=None):
        """Spustí pomalou akci mimo okno; výsledek předá funkci done(výsledek, chyba) v hlavním vlákně."""
        def run():
            try:
                res, err = fn(), None
            except Exception as e:  # noqa: BLE001
                res, err = None, e
            if done:
                msgs.put(("call", lambda: done(res, err)))
        threading.Thread(target=run, daemon=True).start()

    main = ttk.Frame(root, padding=10)
    main.pack(fill="both", expand=True)
    main.columnconfigure(0, weight=1)

    # --- soubory
    box = ttk.LabelFrame(main, text="Soubory (EPUB, AZW3, KFX, MOBI, PDF, DOCX, TXT, RTF, JPG, PNG…)")
    box.grid(row=0, column=0, sticky="nsew", **pad)
    box.columnconfigure(0, weight=1)
    listbox = tk.Listbox(box, height=6, selectmode="extended")
    listbox.grid(row=0, column=0, rowspan=4, sticky="nsew", padx=6, pady=6)

    def add_files(paths):
        for p in paths:
            p = str(p).strip("{}")
            if Path(p).suffix.lower() in SUPPORTED_EXT and p not in files:
                files.append(p)
                listbox.insert("end", p)

    def pick_files():
        exts = " ".join(f"*{e}" for e in sorted(SUPPORTED_EXT))
        add_files(filedialog.askopenfilenames(filetypes=[("Podporované soubory", exts), ("Vše", "*.*")]))

    def remove_selected():
        for i in reversed(listbox.curselection()):
            listbox.delete(i)
            files.pop(i)

    def clear_files():
        listbox.delete(0, "end")
        files.clear()

    ttk.Button(box, text="Přidat soubory…", command=pick_files).grid(row=0, column=1, sticky="ew", padx=6)
    ttk.Button(box, text="Odebrat vybrané", command=remove_selected).grid(row=1, column=1, sticky="ew", padx=6)
    ttk.Button(box, text="Vyčistit", command=clear_files).grid(row=2, column=1, sticky="ew", padx=6)
    if dnd:
        listbox.drop_target_register(DND_FILES)
        listbox.dnd_bind("<<Drop>>", lambda e: add_files(root.tk.splitlist(e.data)))
        ttk.Label(box, text="(soubory sem můžete přetáhnout)").grid(row=3, column=1, padx=6)

    # --- hlavní volby
    opts = ttk.LabelFrame(main, text="Překlad")
    opts.grid(row=1, column=0, sticky="ew", **pad)
    for c in (1, 3):
        opts.columnconfigure(c, weight=1)

    mode = tk.StringVar(value=cfg.get("mode", "translate"))
    ttk.Radiobutton(opts, text="Přeložit", variable=mode, value="translate").grid(row=0, column=0, sticky="w", **pad)
    ttk.Radiobutton(opts, text="Jen převést formát / přepsat text z obrázku (bez překladu)", variable=mode,
                    value="convert").grid(row=0, column=1, columnspan=3, sticky="w", **pad)

    ttk.Label(opts, text="Cílový jazyk:").grid(row=1, column=0, sticky="w", **pad)
    lang = tk.StringVar(value=cfg.get("lang", "čeština"))
    ttk.Combobox(opts, textvariable=lang, values=LANGUAGES).grid(row=1, column=1, sticky="ew", **pad)
    ttk.Label(opts, text="Výstupní formát:").grid(row=1, column=2, sticky="w", **pad)
    out_fmt = tk.StringVar(value=cfg.get("out_fmt", SAME_FORMAT))
    ttk.Combobox(opts, textvariable=out_fmt, values=[SAME_FORMAT] + OUTPUT_FORMATS, state="readonly").grid(
        row=1, column=3, sticky="ew", **pad)

    engine_names = {v: k for k, v in ENGINE_LABELS.items()}
    ocr_names = {v: k for k, v in OCR_LABELS.items()}
    ttk.Label(opts, text="Překladač:").grid(row=2, column=0, sticky="w", **pad)
    engine = tk.StringVar(value=ENGINE_LABELS.get(cfg.get("engine", "google"), ENGINE_LABELS["google"]))
    engine_cb = ttk.Combobox(opts, textvariable=engine, values=list(ENGINE_LABELS.values()), state="readonly")
    engine_cb.grid(row=2, column=1, columnspan=3, sticky="ew", **pad)
    status = ttk.Label(opts, text="")
    status.grid(row=3, column=1, columnspan=3, sticky="w", padx=8)

    ttk.Label(opts, text="Text z obrázků/skenů:").grid(row=4, column=0, sticky="w", **pad)
    ocr = tk.StringVar(value=OCR_LABELS.get(cfg.get("ocr", "tesseract"), OCR_LABELS["tesseract"]))
    ocr_cb = ttk.Combobox(opts, textvariable=ocr, values=list(OCR_LABELS.values()), state="readonly")
    ocr_cb.grid(row=4, column=1, sticky="ew", **pad)
    ttk.Label(opts, text="Jazyk originálu (OCR):").grid(row=4, column=2, sticky="w", **pad)
    ocr_lang = tk.StringVar(value=cfg.get("ocr_lang", "eng"))
    ttk.Combobox(opts, textvariable=ocr_lang, values=list(components.OCR_LANGUAGES) + ["eng+ces", "eng+deu"]).grid(
        row=4, column=3, sticky="ew", **pad)

    ttk.Label(opts, text="Pokyny pro překlad\n(Claude, Gemini, Ollama, OpenAI…):").grid(row=5, column=0, sticky="nw", **pad)
    notes = tk.Text(opts, height=2, wrap="word")
    notes.grid(row=5, column=1, columnspan=3, sticky="ew", **pad)
    notes.insert("1.0", cfg.get("notes", ""))
    merge = tk.BooleanVar(value=cfg.get("merge_images", True))
    ttk.Checkbutton(opts, text="Více obrázků spojit do jednoho DOCX", variable=merge).grid(
        row=6, column=1, columnspan=3, sticky="w", **pad)

    def refresh_status(*_):
        e = engine_names[engine.get()]
        ok, text = service_ready(cfg, service_of(e))
        if e == "microsoft_doc" and ok and not cfg["engines"].get("microsoft", {}).get("endpoint"):
            ok, text = False, "chybí adresa „Překlad dokumentu“ – otevřete ⚙ Nastavení"
        o = ocr_names[ocr.get()]
        if o == "tesseract" and not cfg["paths"].get("tesseract"):
            text += " · Tesseract chybí (⚙ Nastavení → Součásti)"
        elif o in ("gemini", "claude") and not service_ready(cfg, o)[0]:
            text += f" · OCR {o}: chybí klíč"
        status.configure(text=("✓ " if ok else "⚠ ") + text, foreground="#1a7f37" if ok else "#b35900")

    engine_cb.bind("<<ComboboxSelected>>", refresh_status)
    ocr_cb.bind("<<ComboboxSelected>>", refresh_status)

    # --- spuštění
    run_box = ttk.Frame(main)
    run_box.grid(row=2, column=0, sticky="ew", **pad)
    run_box.columnconfigure(0, weight=1)
    bar = ttk.Progressbar(run_box, maximum=1.0)
    bar.grid(row=0, column=0, sticky="ew", padx=(0, 8))
    start_btn = ttk.Button(run_box, text="Spustit")
    start_btn.grid(row=0, column=1)
    stop_btn = ttk.Button(run_box, text="Zastavit", state="disabled", command=lambda: cancel_event.set())
    stop_btn.grid(row=0, column=2, padx=(8, 0))
    settings_btn = ttk.Button(run_box, text="⚙ Nastavení")
    settings_btn.grid(row=0, column=3, padx=(8, 0))
    book_btn = ttk.Button(run_box, text="✍ Napsat knihu")
    book_btn.grid(row=0, column=4, padx=(8, 0))

    log_box = ScrolledText(main, height=10, state="disabled", wrap="word")
    log_box.grid(row=3, column=0, sticky="nsew", **pad)
    main.rowconfigure(3, weight=1)

    def poll():
        try:
            while True:
                kind, val = msgs.get_nowait()
                if kind == "log":
                    log_box.configure(state="normal")
                    log_box.insert("end", val + "\n")
                    log_box.see("end")
                    log_box.configure(state="disabled")
                elif kind == "progress":
                    bar["value"] = val
                elif kind == "call":
                    val()
                elif kind == "done":
                    start_btn.configure(state="normal")
                    stop_btn.configure(state="disabled")
                    if val:
                        messagebox.showinfo(APP_NAME, f"Hotovo. Vytvořeno souborů: {len(val)}")
        except queue.Empty:
            pass
        root.after(100, poll)

    def remember_main():
        cfg.update({
            "mode": mode.get(), "lang": lang.get().strip() or "čeština", "out_fmt": out_fmt.get(),
            "engine": engine_names[engine.get()], "ocr": ocr_names[ocr.get()], "ocr_lang": ocr_lang.get().strip(),
            "merge_images": merge.get(), "notes": notes.get("1.0", "end").strip(),
        })
        try:
            save_config(cfg)
        except Exception as e:  # noqa: BLE001
            log(f"Nastavení se nepodařilo uložit: {e}")

    # ============================================== okno Nastavení
    def open_settings():
        win = tk.Toplevel(root)
        win.title("Nastavení")
        win.geometry("760x620")
        win.transient(root)
        bottom = ttk.Frame(win)
        bottom.pack(side="bottom", fill="x", padx=8, pady=(0, 8))
        nb = ttk.Notebook(win)
        nb.pack(fill="both", expand=True, padx=8, pady=8)

        # --- Služby a klíče
        tab_s = ttk.Frame(nb, padding=8)
        nb.add(tab_s, text="Služby a klíče")
        canvas = tk.Canvas(tab_s, highlightthickness=0)
        scroll = ttk.Scrollbar(tab_s, orient="vertical", command=canvas.yview)
        inner = ttk.Frame(canvas)
        inner.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        win_id = canvas.create_window((0, 0), window=inner, anchor="nw")
        canvas.bind("<Configure>", lambda e: canvas.itemconfigure(win_id, width=e.width))
        canvas.configure(yscrollcommand=scroll.set)
        canvas.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")

        def wheel(event):
            if str(event.widget).startswith(str(tab_s)):
                canvas.yview_scroll(-1 if (event.delta > 0 or event.num == 4) else 1, "units")

        for seq in ("<MouseWheel>", "<Button-4>", "<Button-5>"):
            win.bind_all(seq, wheel, add="+")
        inner.columnconfigure(1, weight=1)

        def show_guide(name):
            g = tk.Toplevel(win)
            g.title(f"Návod – {SERVICES[name][0]}")
            g.geometry("720x480")
            g.transient(win)
            txt = ScrolledText(g, wrap="word", font=("Segoe UI", 10))
            txt.pack(fill="both", expand=True, padx=8, pady=8)
            txt.insert("1.0", GUIDES.get(name, "Návod není k dispozici."))
            txt.configure(state="disabled")  # text jde označit a zkopírovat (Ctrl+C)
            ttk.Button(g, text="Zavřít", command=g.destroy).pack(pady=(0, 8))

        svc_vars: dict[str, dict[str, tk.StringVar]] = {}
        row = 0
        for name, (title, fields) in SERVICES.items():
            frame = ttk.LabelFrame(inner, text=title)
            frame.grid(row=row, column=0, columnspan=3, sticky="ew", pady=4)
            frame.columnconfigure(1, weight=1)
            row += 1
            help_text, url = SERVICE_HELP[name]
            ttk.Label(frame, text=help_text, foreground="#555", wraplength=640).grid(
                row=0, column=0, columnspan=3, sticky="w", **pad)
            svc_vars[name] = {}
            r = 1
            for key, label, secret, default, choices in fields:
                val = cfg["engines"].get(name, {}).get(key) or default
                if choices == "claude_models":
                    val = next((n for n, m in MODELS.items() if m == (val or DEFAULT_MODEL)), list(MODELS)[0])
                var = tk.StringVar(value=val)
                svc_vars[name][key] = var
                ttk.Label(frame, text=label + ":").grid(row=r, column=0, sticky="w", **pad)
                if choices == "claude_models":
                    ttk.Combobox(frame, textvariable=var, values=list(MODELS), state="readonly").grid(
                        row=r, column=1, sticky="ew", **pad)
                else:
                    entry = ttk.Entry(frame, textvariable=var, show="•" if secret else "")
                    entry.grid(row=r, column=1, sticky="ew", **pad)
                    if secret:
                        def toggle(e=entry):
                            e.configure(show="" if e.cget("show") else "•")
                        ttk.Button(frame, text="👁", width=3, command=toggle).grid(row=r, column=2, **pad)
                r += 1
            btns = ttk.Frame(frame)
            btns.grid(row=r, column=0, columnspan=3, sticky="w", **pad)
            ttk.Button(btns, text="Návod", command=lambda n=name: show_guide(n)).pack(side="left")
            if url:
                ttk.Button(btns, text="Získat klíč / web", command=lambda u=url: webbrowser.open(u)).pack(
                    side="left", padx=(8, 0))

            def do_test(n=name, b=btns):
                collect_services()
                test_lbl = ttk.Label(b, text="Testuji…")
                test_lbl.pack(side="left", padx=8)

                def done(res, err):
                    test_lbl.destroy()
                    if err:
                        messagebox.showerror(f"Test – {SERVICES[n][0]}", str(err), parent=win)
                    else:
                        messagebox.showinfo(f"Test – {SERVICES[n][0]}", f"Funguje ✓\n\n{res}", parent=win)

                in_thread(lambda: test_service(n, cfg, lang.get().strip() or "čeština"), done)

            ttk.Button(btns, text="Otestovat", command=do_test).pack(side="left", padx=(8, 0))
        ttk.Label(inner, text="Klíče se ukládají zašifrovaně (Windows DPAPI) jen pro váš účet ve Windows.",
                  foreground="#555").grid(row=row, column=0, columnspan=3, sticky="w", **pad)

        def collect_services():
            for n, vars_ in svc_vars.items():
                sect = cfg["engines"].setdefault(n, {})
                for k, var in vars_.items():
                    v = var.get().strip()
                    if n == "claude" and k == "model":
                        v = MODELS.get(v, DEFAULT_MODEL)
                    sect[k] = v

        # --- Součásti
        tab_c = ttk.Frame(nb, padding=8)
        nb.add(tab_c, text="Součásti")
        tab_c.columnconfigure(1, weight=1)
        calibre_path = tk.StringVar(value=cfg["paths"].get("ebook_convert", ""))
        tess_path = tk.StringVar(value=cfg["paths"].get("tesseract", ""))

        cal = ttk.LabelFrame(tab_c, text="Calibre – převody e-knih (AZW3, KFX, MOBI, RTF…)")
        cal.grid(row=0, column=0, columnspan=3, sticky="ew", pady=4)
        cal.columnconfigure(1, weight=1)
        cal_status = ttk.Label(cal, text="Zjišťuji…")
        cal_status.grid(row=0, column=0, columnspan=3, sticky="w", **pad)
        ttk.Label(cal, text="ebook-convert.exe:").grid(row=1, column=0, sticky="w", **pad)
        ttk.Entry(cal, textvariable=calibre_path).grid(row=1, column=1, sticky="ew", **pad)

        def pick(var, title, pattern):
            f = filedialog.askopenfilename(title=title, parent=win, filetypes=[(pattern, pattern + "*"), ("Vše", "*.*")])
            if f:
                var.set(f)
                refresh_components()

        ttk.Button(cal, text="Najít…", command=lambda: pick(calibre_path, "Najděte ebook-convert.exe",
                                                             "ebook-convert")).grid(row=1, column=2, **pad)
        cal_btns = ttk.Frame(cal)
        cal_btns.grid(row=2, column=0, columnspan=3, sticky="w", **pad)

        tes = ttk.LabelFrame(tab_c, text="Tesseract – čtení textu z obrázků a skenů (OCR)")
        tes.grid(row=1, column=0, columnspan=3, sticky="ew", pady=4)
        tes.columnconfigure(1, weight=1)
        tes_status = ttk.Label(tes, text="Zjišťuji…", wraplength=640)
        tes_status.grid(row=0, column=0, columnspan=3, sticky="w", **pad)
        ttk.Label(tes, text="tesseract.exe:").grid(row=1, column=0, sticky="w", **pad)
        ttk.Entry(tes, textvariable=tess_path).grid(row=1, column=1, sticky="ew", **pad)
        ttk.Button(tes, text="Najít…", command=lambda: pick(tess_path, "Najděte tesseract.exe",
                                                             "tesseract")).grid(row=1, column=2, **pad)
        tes_btns = ttk.Frame(tes)
        tes_btns.grid(row=2, column=0, columnspan=3, sticky="w", **pad)

        langs_frame = ttk.LabelFrame(tab_c, text="Jazyky pro OCR (stáhnou se do složky programu, bez práv správce)")
        langs_frame.grid(row=2, column=0, columnspan=3, sticky="ew", pady=4)
        lang_vars: dict[str, tk.BooleanVar] = {}
        lang_checks: dict[str, ttk.Checkbutton] = {}
        for i, (code, name) in enumerate(components.OCR_LANGUAGES.items()):
            var = tk.BooleanVar(value=False)
            cb = ttk.Checkbutton(langs_frame, text=f"{name} ({code})", variable=var)
            cb.grid(row=i // 3, column=i % 3, sticky="w", padx=8, pady=1)
            lang_vars[code], lang_checks[code] = var, cb
        comp_log = ScrolledText(tab_c, height=6, state="disabled", wrap="word")
        comp_log.grid(row=4, column=0, columnspan=3, sticky="nsew", pady=4)
        tab_c.rowconfigure(4, weight=1)

        def clog(text):
            def add():
                comp_log.configure(state="normal")
                comp_log.insert("end", text + "\n")
                comp_log.see("end")
                comp_log.configure(state="disabled")
            msgs.put(("call", add))

        def refresh_components():
            cp = find_ebook_convert(calibre_path.get() or None)
            tp = find_tesseract(tess_path.get() or None)
            if cp and not calibre_path.get():
                calibre_path.set(cp)
            if tp and not tess_path.get():
                tess_path.set(tp)

            def check():
                return components.calibre_kfx_plugin(cp), sorted(components.tesseract_languages(tp))

            def done(res, err):
                kfx, langs = res if res else (None, [])
                if cp:
                    kfx_txt = {True: "plugin KFX Input je nainstalovaný ✓",
                               False: "⚠ chybí plugin KFX Input – klikněte na „Nainstalovat plugin KFX Input“ "
                                      "(nainstaluje se i sám při prvním KFX)",
                               None: "plugin KFX Input nelze ověřit"}[kfx]
                    where = "přibalené k programu" if cp == components.bundled_exe("Calibre2", "ebook-convert") \
                        else "nalezeno"
                    cal_status.configure(text=f"✓ Calibre {where} · {kfx_txt}")
                else:
                    cal_status.configure(text="⚠ Calibre nebylo nalezeno – nainstalujte Prekladac pomocí "
                                              "Prekladac-Setup.exe, který ho obsahuje, nebo zadejte cestu.")
                if tp:
                    tes_status.configure(text=f"✓ Tesseract nalezen · jazyky: {', '.join(langs) or 'žádné'}")
                else:
                    tes_status.configure(text="⚠ Tesseract nebyl nalezen – je součástí Prekladac-Setup.exe "
                                              "(potřebný jen pro obrázky a skeny)")
                for code, cb in lang_checks.items():
                    have = code in langs
                    cb.configure(text=f"{components.OCR_LANGUAGES[code]} ({code}){' ✓' if have else ''}")

            in_thread(check, done)

        def install_kfx():
            def done(_res, err):
                clog(f"✗ {err}" if err else "✓ Hotovo.")
                refresh_components()

            in_thread(lambda: components.install_kfx_plugin(find_ebook_convert(calibre_path.get() or None), clog),
                      done)

        ttk.Button(cal_btns, text="Nainstalovat plugin KFX Input", command=install_kfx).pack(side="left")
        ttk.Button(cal_btns, text="Web Calibre", command=lambda: webbrowser.open(CALIBRE_URL)).pack(
            side="left", padx=8)
        ttk.Button(tes_btns, text="Web Tesseract", command=lambda: webbrowser.open(TESSERACT_URL)).pack(side="left")

        def download_langs():
            chosen = [c for c, v in lang_vars.items() if v.get()]
            if not chosen:
                messagebox.showinfo("Jazyky OCR", "Zaškrtněte jazyky, které chcete stáhnout.", parent=win)
                return

            def job():
                for c in chosen:
                    components.download_tessdata(c, clog)

            in_thread(job, lambda res, err: (clog(f"✗ {err}") if err else clog("✓ Jazyky staženy."),
                                             refresh_components()))

        ttk.Button(tab_c, text="Stáhnout zaškrtnuté jazyky OCR", command=download_langs).grid(
            row=3, column=0, sticky="w", pady=4)
        ttk.Label(tab_c, text="Chybějící jazyk se při OCR stáhne i automaticky.", foreground="#555").grid(
            row=3, column=1, sticky="w", padx=8)
        refresh_components()

        # --- Obecné
        tab_g = ttk.Frame(nb, padding=8)
        nb.add(tab_g, text="Obecné")
        tab_g.columnconfigure(1, weight=1)
        out_dir = tk.StringVar(value=cfg.get("out_dir", ""))
        ttk.Label(tab_g, text="Výstupní složka:").grid(row=0, column=0, sticky="w", **pad)
        ttk.Entry(tab_g, textvariable=out_dir).grid(row=0, column=1, sticky="ew", **pad)

        def pick_dir():
            d = filedialog.askdirectory(parent=win)
            if d:
                out_dir.set(d)

        ttk.Button(tab_g, text="Vybrat…", command=pick_dir).grid(row=0, column=2, **pad)
        ttk.Label(tab_g, text="Prázdné = výsledek se uloží vedle originálu.", foreground="#555").grid(
            row=1, column=1, sticky="w", **pad)
        ttk.Label(tab_g, text=f"Nastavení programu: {config_path()}", foreground="#555").grid(
            row=2, column=0, columnspan=3, sticky="w", **pad)
        ttk.Label(tab_g, text=f"Verze programu: {VERSION}").grid(row=3, column=0, columnspan=2, sticky="w", **pad)
        ttk.Button(tab_g, text="Zkontrolovat novou verzi", command=lambda: webbrowser.open(RELEASES_URL)).grid(
            row=3, column=2, **pad)

        # --- tlačítka (rámeček „bottom“ je vytvořený nahoře, aby se vždy vešel)

        def save_and_close():
            collect_services()
            cfg["paths"]["ebook_convert"] = calibre_path.get().strip()
            cfg["paths"]["tesseract"] = tess_path.get().strip()
            cfg["out_dir"] = out_dir.get().strip()
            try:
                save_config(cfg)
            except Exception as e:  # noqa: BLE001
                messagebox.showerror("Nastavení", f"Nepodařilo se uložit: {e}", parent=win)
                return
            refresh_status()
            win.destroy()

        ttk.Button(bottom, text="Uložit", command=save_and_close).pack(side="right")
        ttk.Button(bottom, text="Zrušit", command=win.destroy).pack(side="right", padx=8)

    settings_btn.configure(command=open_settings)

    # ============================================== okno Napsat knihu
    def open_book_window():
        import book_writer as bw

        BOOK_SERVICES = {
            "Claude (placené, nejlepší kvalita)": "claude",
            "Google Gemini (bezplatná úroveň s limity)": "gemini",
            "OpenAI-kompatibilní (DeepSeek, OpenAI, Mistral, OpenRouter…)": "openai",
            "Ollama (zdarma, v počítači)": "ollama",
        }

        import book_options as bo

        w = tk.Toplevel(root)  # bez transient(): okno jde maximalizovat a minimalizovat
        w.title("Napsat knihu")
        w.geometry("1000x900")
        w.minsize(760, 600)
        frm = ttk.Frame(w, padding=8)
        frm.pack(fill="both", expand=True)
        frm.columnconfigure(1, weight=1)
        frm.columnconfigure(3, weight=1)
        state: dict = {"project": None, "path": None, "cancel": threading.Event(), "busy": False}

        ttk.Label(frm, text="Popis knihy (o čem je, postavy, prostředí, pro koho, jak má skončit…):").grid(
            row=0, column=0, columnspan=4, sticky="w")
        desc = tk.Text(frm, height=7, wrap="word")
        desc.grid(row=1, column=0, columnspan=4, sticky="nsew", pady=(2, 6))

        cat_frame = ttk.LabelFrame(frm, text="Žánr a styl (vyberte nebo napište vlastní)")
        cat_frame.grid(row=2, column=0, columnspan=4, sticky="ew", pady=2)
        for c in (1, 3, 5):
            cat_frame.columnconfigure(c, weight=1)
        cat_vars: dict[str, tk.StringVar] = {}
        for k, (key, label, values) in enumerate(bo.CATEGORIES):
            r, c = divmod(k, 3)
            ttk.Label(cat_frame, text=label + ":").grid(row=r, column=c * 2, sticky="w", padx=(6, 2), pady=2)
            var = tk.StringVar(value="")
            ttk.Combobox(cat_frame, textvariable=var, values=values, height=20).grid(
                row=r, column=c * 2 + 1, sticky="ew", padx=(0, 6), pady=2)
            cat_vars[key] = var
        ttk.Label(cat_frame, text="Další přání:").grid(row=3, column=0, sticky="w", padx=(6, 2), pady=2)
        style = tk.StringVar(value="")  # vlastní doplnění stylu
        ttk.Entry(cat_frame, textvariable=style).grid(row=3, column=1, columnspan=5, sticky="ew", padx=(0, 6), pady=2)
        mature_lbl = ttk.Label(frm, text="", foreground="#b35900", wraplength=900)
        mature_lbl.grid(row=3, column=0, columnspan=4, sticky="w")

        def style_parts():
            return {k: v.get() for k, v in cat_vars.items()}

        def full_style():
            return bo.compose_style(style_parts(), style.get())

        def on_category(*_):
            mature_lbl.configure(text=bo.MATURE_NOTE if bo.is_mature(style_parts()) else "")

        for var in cat_vars.values():
            var.trace_add("write", on_category)

        ttk.Label(frm, text="Jazyk knihy:").grid(row=4, column=0, sticky="w", pady=2)
        blang = tk.StringVar(value=cfg.get("lang", "čeština"))
        ttk.Combobox(frm, textvariable=blang, values=LANGUAGES).grid(row=4, column=1, sticky="ew", pady=2)
        ttk.Label(frm, text="Služba:").grid(row=4, column=2, sticky="w", padx=(8, 0))
        bservice = tk.StringVar(value=next((k for k, v in BOOK_SERVICES.items() if v == cfg.get("book_service")),
                                           list(BOOK_SERVICES)[0]))
        ttk.Combobox(frm, textvariable=bservice, values=list(BOOK_SERVICES), state="readonly").grid(
            row=4, column=3, sticky="ew", pady=2)
        ttk.Label(frm, text="Claude model:").grid(row=5, column=2, sticky="w", padx=(8, 0))
        bmodel = tk.StringVar(value=list(MODELS)[0])
        model_cb = ttk.Combobox(frm, textvariable=bmodel, values=list(MODELS), state="readonly")
        model_cb.grid(row=5, column=3, sticky="ew", pady=2)
        svc_status = ttk.Label(frm, text="", foreground="#555", wraplength=860)
        svc_status.grid(row=6, column=0, columnspan=4, sticky="w")

        ttk.Label(frm, text="Počet kapitol:").grid(row=7, column=0, sticky="w", pady=2)
        nchap = tk.IntVar(value=12)
        ttk.Spinbox(frm, from_=3, to=40, textvariable=nchap, width=6).grid(row=7, column=1, sticky="w")
        ttk.Label(frm, text="Slov na kapitolu:").grid(row=7, column=2, sticky="w", padx=(8, 0))
        nwords = tk.IntVar(value=2500)
        ttk.Spinbox(frm, from_=800, to=6000, increment=100, textvariable=nwords, width=7).grid(
            row=7, column=3, sticky="w")
        est = ttk.Label(frm, text="", foreground="#555", wraplength=860)
        est.grid(row=8, column=0, columnspan=4, sticky="w", pady=(2, 6))

        fmt_frame = ttk.Frame(frm)
        fmt_frame.grid(row=9, column=0, columnspan=4, sticky="w")
        ttk.Label(fmt_frame, text="Uložit jako:").pack(side="left")
        fmt_vars = {f: tk.BooleanVar(value=f in ("epub", "docx")) for f in ("epub", "docx", "pdf", "azw3")}
        for f, v in fmt_vars.items():
            ttk.Checkbutton(fmt_frame, text=f.upper(), variable=v).pack(side="left", padx=4)
        bdir = tk.StringVar(value=cfg.get("out_dir") or str(Path.home() / "Documents" / "Knihy"))
        ttk.Label(frm, text="Složka:").grid(row=10, column=0, sticky="w", pady=2)
        ttk.Entry(frm, textvariable=bdir).grid(row=10, column=1, columnspan=2, sticky="ew", pady=2)

        def pick_bdir():
            d = filedialog.askdirectory(parent=w)
            if d:
                bdir.set(d)

        ttk.Button(frm, text="Vybrat…", command=pick_bdir).grid(row=10, column=3, sticky="w")

        ttk.Label(frm, text="Osnova (můžete ji upravit – kapitoly ve tvaru „1. Název — obsah“):").grid(
            row=11, column=0, columnspan=4, sticky="w", pady=(8, 0))
        outline_box = tk.Text(frm, height=12, wrap="word")
        outline_box.grid(row=12, column=0, columnspan=4, sticky="nsew", pady=2)
        frm.rowconfigure(12, weight=2)

        btns = ttk.Frame(frm)
        btns.grid(row=13, column=0, columnspan=4, sticky="ew", pady=6)
        b_outline = ttk.Button(btns, text="1. Navrhnout osnovu")
        b_outline.pack(side="left")
        b_write = ttk.Button(btns, text="2. Napsat knihu", state="disabled")
        b_write.pack(side="left", padx=8)
        b_stop = ttk.Button(btns, text="Zastavit", state="disabled", command=lambda: state["cancel"].set())
        b_stop.pack(side="left")
        b_load = ttk.Button(btns, text="Pokračovat v rozepsané…")
        b_load.pack(side="right")
        b_edit = ttk.Button(btns, text="📖 Upravit knihu", state="disabled")
        b_edit.pack(side="right", padx=8)
        big = tk.BooleanVar(value=False)

        def toggle_big():
            w.attributes("-fullscreen", big.get())

        ttk.Checkbutton(btns, text="Celá obrazovka (Esc)", variable=big, command=toggle_big).pack(side="right")
        w.bind("<Escape>", lambda e: (big.set(False), toggle_big()))

        def open_book_editor():
            import book_editor

            if not state["project"] or not state["project"]["chapters"]:
                messagebox.showinfo("Upravit knihu", "Kniha zatím nemá napsanou žádnou kapitolu.", parent=w)
                return
            book_editor.open_editor(root, state["project"], state["path"],
                                    cfg["paths"].get("ebook_convert") or None, in_thread)

        b_edit.configure(command=open_book_editor)
        bbar = ttk.Progressbar(frm, maximum=1.0)
        bbar.grid(row=14, column=0, columnspan=4, sticky="ew")
        blog = ScrolledText(frm, height=7, state="disabled", wrap="word")
        blog.grid(row=15, column=0, columnspan=4, sticky="nsew", pady=(4, 0))
        frm.rowconfigure(15, weight=1)

        def wlog(text):
            def add():
                blog.configure(state="normal")
                blog.insert("end", text + "\n")
                blog.see("end")
                blog.configure(state="disabled")
            msgs.put(("call", add))

        def writer():
            svc = BOOK_SERVICES[bservice.get()]
            language = blang.get().strip() or "čeština"
            if svc == "claude":
                c = cfg["engines"].get("claude", {})
                key = c.get("api_key") or os.environ.get("ANTHROPIC_API_KEY")
                if not key:
                    raise EngineError("Chybí Claude API klíč – zadejte ho v ⚙ Nastavení (je tam i Návod).")
                backend = bw.ClaudeBackend(key, MODELS[bmodel.get()], language, wlog, state["cancel"])
            else:
                eng = make_engine(svc, language, cfg["engines"].get(svc, {}), "")
                backend = bw.EngineBackend(eng, state["cancel"])
            return bw.BookWriter(backend, language, wlog)

        def on_service(*_):
            svc = BOOK_SERVICES[bservice.get()]
            model_cb.configure(state="readonly" if svc == "claude" else "disabled")
            ok, text = service_ready(cfg, svc)
            sect = cfg["engines"].get(svc, {})
            model = MODELS[bmodel.get()] if svc == "claude" else (sect.get("model") or {
                "gemini": GeminiEngine.DEFAULT_MODEL, "ollama": OllamaEngine.DEFAULT_MODEL}.get(svc, "?"))
            svc_status.configure(text=("✓ " if ok else "⚠ ") + f"{text} · model: {model}"
                                 + ("" if ok else "  (⚙ Nastavení → Služby a klíče → Návod)"),
                                 foreground="#1a7f37" if ok else "#b35900")
            update_est()

        def update_est(*_):
            try:
                est.configure(text=writer().estimate(int(nchap.get()), int(nwords.get())))
            except Exception as e:  # noqa: BLE001 – např. chybí klíč; vypíše se ve stavovém řádku
                est.configure(text=str(e))

        nchap.trace_add("write", update_est)
        nwords.trace_add("write", update_est)
        bmodel.trace_add("write", lambda *_: on_service())
        bservice.trace_add("write", lambda *_: on_service())

        def busy(on):
            state["busy"] = on
            b_outline.configure(state="disabled" if on else "normal")
            b_load.configure(state="disabled" if on else "normal")
            b_write.configure(state="disabled" if on or not outline_box.get("1.0", "end").strip() else "normal")
            b_stop.configure(state="normal" if on else "disabled")
            has_text = bool(state["project"] and state["project"]["chapters"])
            b_edit.configure(state="normal" if has_text and not on else "disabled")

        def do_outline():
            text = desc.get("1.0", "end").strip()
            if len(text) < 30:
                messagebox.showwarning("Napsat knihu", "Napište popis knihy (aspoň pár vět).", parent=w)
                return
            state["cancel"].clear()
            state["project"] = None
            busy(True)

            def done(o, err):
                busy(False)
                if err:
                    wlog(f"✗ {err}")
                    return
                outline_box.delete("1.0", "end")
                outline_box.insert("1.0", bw.outline_to_text(o))
                state["path"] = None
                try:
                    new_project(o)
                except Exception as e:  # noqa: BLE001
                    wlog(f"! Osnovu se nepodařilo uložit: {e}")
                busy(False)
                wlog("✓ Osnova je hotová. Projděte ji, případně upravte, a klikněte na „2. Napsat knihu“.")

            in_thread(lambda: writer().make_outline(text, int(nchap.get()), int(nwords.get()), full_style()), done)

        def book_dir() -> Path:
            d = Path(bdir.get().strip() or Path.home() / "Documents" / "Knihy")
            d.mkdir(parents=True, exist_ok=True)
            return d

        def new_project(outline: dict) -> None:
            """Založí projekt a hned ho uloží – osnova se neztratí ani při zavření programu."""
            proj = {"description": desc.get("1.0", "end").strip(), "style": full_style(),
                    "style_parts": style_parts(), "style_extra": style.get().strip(),
                    "language": blang.get().strip() or "čeština", "service": BOOK_SERVICES[bservice.get()],
                    "model": MODELS[bmodel.get()], "words": int(nwords.get()), "outline": outline, "chapters": []}
            path = book_dir() / (bw.safe_name(outline["title"]) + bw.PROJECT_SUFFIX)
            n = 2
            while path.exists() and (state["path"] != path):
                path = book_dir() / f"{bw.safe_name(outline['title'])} ({n}){bw.PROJECT_SUFFIX}"
                n += 1
            state.update(project=proj, path=path)
            bw.save_project(path, proj)
            wlog(f"Osnova uložena: {path}")

        def do_write():
            try:
                outline = bw.text_to_outline(outline_box.get("1.0", "end"))
            except bw.BookError as e:
                messagebox.showerror("Napsat knihu", str(e), parent=w)
                return
            formats = [f for f, v in fmt_vars.items() if v.get()] or ["docx"]
            proj = state["project"]
            if proj is None or proj["outline"] != outline:
                if proj is not None and proj["chapters"]:
                    if not messagebox.askyesno("Napsat knihu", "Osnova se změnila – začít psát od první kapitoly?",
                                               parent=w):
                        return
                if proj is not None and not proj["chapters"]:
                    # zatím nic nenapsáno: převezmeme upravenou osnovu i aktuální nastavení
                    proj.update(outline=outline, words=int(nwords.get()), style=full_style(),
                                style_parts=style_parts(), style_extra=style.get().strip(),
                                description=desc.get("1.0", "end").strip(),
                                language=blang.get().strip() or "čeština")
                    bw.save_project(state["path"], proj)
                else:
                    state["path"] = None
                    new_project(outline)
            proj = state["project"]
            out_dir = state["path"].parent
            path = state["path"]
            n = len(outline["chapters"])
            try:
                estimate_text = writer().estimate(n, proj["words"])
            except Exception as e:  # noqa: BLE001
                messagebox.showerror("Napsat knihu", str(e), parent=w)
                return
            cfg["book_service"] = BOOK_SERVICES[bservice.get()]
            if not messagebox.askyesno(
                    "Napsat knihu", f"Napsat {n - len(proj['chapters'])} kapitol?\n\n"
                                    f"{estimate_text}\n\n"
                                    f"Rozepsaná kniha se průběžně ukládá do:\n{path}", parent=w):
                return
            state["cancel"].clear()
            busy(True)
            bbar["value"] = len(proj["chapters"]) / n

            def job():
                from claude_client import Cancelled

                wr = writer()
                try:
                    wr.write(proj, path, lambda f: msgs.put(("call", lambda: bbar.configure(value=f))))
                except Cancelled:
                    return "stopped", wr
                files = bw.export(proj, out_dir, formats, wlog, cfg["paths"].get("ebook_convert") or None)
                return files, wr

            def done(res, err):
                busy(False)
                if err:
                    wlog(f"✗ {err}")
                    return
                files, wr = res
                wlog(wr.backend.cost_summary())
                if files == "stopped":
                    wlog("Zastaveno. Rozepsaná kniha je uložená – pokračujte tlačítkem „2. Napsat knihu“ "
                         "nebo později přes „Pokračovat v rozepsané…“.")
                    return
                for f in files:
                    wlog(f"✓ Uloženo: {f}")
                if messagebox.askyesno("Napsat knihu", "Kniha je hotová.\n\n" + "\n".join(files)
                                       + "\n\nOtevřít ji v editoru (úpravy, písmo, hledání, obsah)?", parent=w):
                    open_book_editor()

            in_thread(job, done)

        def do_load():
            f = filedialog.askopenfilename(parent=w, title="Rozepsaná kniha",
                                           filetypes=[("Rozepsaná kniha", "*" + bw.PROJECT_SUFFIX), ("Vše", "*.*")])
            if not f:
                return
            try:
                proj = bw.load_project(f)
            except Exception as e:  # noqa: BLE001
                messagebox.showerror("Napsat knihu", str(e), parent=w)
                return
            state.update(project=proj, path=Path(f))
            desc.delete("1.0", "end")
            desc.insert("1.0", proj.get("description", ""))
            parts = proj.get("style_parts") or {}
            for key, var in cat_vars.items():
                var.set(parts.get(key, ""))
            style.set(proj.get("style_extra", "") if parts else proj.get("style", ""))
            blang.set(proj.get("language", "čeština"))
            nwords.set(proj.get("words", 2500))
            nchap.set(len(proj["outline"]["chapters"]))
            bmodel.set(next((k for k, v in MODELS.items() if v == proj.get("model")), list(MODELS)[0]))
            bservice.set(next((k for k, v in BOOK_SERVICES.items() if v == proj.get("service", "claude")),
                              list(BOOK_SERVICES)[0]))
            bdir.set(str(Path(f).parent))
            outline_box.delete("1.0", "end")
            outline_box.insert("1.0", bw.outline_to_text(proj["outline"]))
            busy(False)
            wlog(f"Načteno: {len(proj['chapters'])} z {len(proj['outline']['chapters'])} kapitol hotovo.")

        on_service()
        b_outline.configure(command=do_outline)
        b_write.configure(command=do_write)
        b_load.configure(command=do_load)
        outline_box.bind("<KeyRelease>", lambda e: busy(state["busy"]))

    book_btn.configure(command=open_book_window)

    # ============================================== spuštění překladu
    def start():
        if not files:
            messagebox.showwarning(APP_NAME, "Nejdřív přidejte soubory.")
            return
        remember_main()
        translate = cfg["mode"] == "translate"
        e = cfg["engine"]
        if any(Path(f).suffix.lower() in DOC_ONLY_EXT for f in files) and (e != "microsoft_doc" or not translate):
            messagebox.showwarning(APP_NAME, "PPTX, XLSX a MD umí přeložit jen překladač "
                                             "„Microsoft – překlad celých dokumentů“.")
            return
        s = dict(cfg)
        cancel_event.clear()
        try:
            tr = build_translator(s, translate, files_need_ocr(files, cfg["out_fmt"], translate, e), log,
                                  cancel_event)
        except Exception as ex:  # noqa: BLE001
            messagebox.showerror(APP_NAME, str(ex))
            return

        start_btn.configure(state="disabled")
        stop_btn.configure(state="normal")
        bar["value"] = 0

        def worker():
            res = []
            try:
                res = run_jobs(list(files), translate, cfg["out_fmt"], tr, cfg.get("out_dir") or None,
                               cfg["merge_images"], log, progress, cfg["paths"].get("ebook_convert") or None,
                               cancel_event)
            except Exception as ex:  # noqa: BLE001
                log(f"Neočekávaná chyba: {ex}")
            msgs.put(("done", res))

        threading.Thread(target=worker, daemon=True).start()

    start_btn.configure(command=start)
    refresh_status()
    if not cfg["paths"].get("ebook_convert"):
        log("Upozornění: Calibre nebylo nalezeno – bez něj nepůjdou AZW3, KFX, MOBI a RTF. "
            "Je součástí instalátoru Prekladac-Setup.exe (nebo zadejte cestu v ⚙ Nastavení → Součásti).")
    if not cfg["paths"].get("tesseract"):
        log("Tip: Tesseract pro text z obrázků je součástí instalátoru Prekladac-Setup.exe "
            "(nebo zvolte OCR přes Gemini či Claude).")
    poll()
    root.mainloop()


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
    ap.add_argument("--merge-images", action="store_true", help="více obrázků do jednoho DOCX")
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
    if len(sys.argv) > 1:
        sys.exit(run_cli(sys.argv[1:]))
    run_gui()
