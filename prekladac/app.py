"""Překladač e-knih a dokumentů – okno pro Windows (a příkazová řádka).

Spuštění bez parametrů otevře okno. Příklady z příkazové řádky:
    python app.py kniha.epub --to azw3 --engine google
    python app.py strana.jpg --engine deepl --ocr tesseract --ocr-lang eng
"""

from __future__ import annotations

import argparse
import json
import os
import queue
import sys
import threading
import traceback
from pathlib import Path

from converters import (
    IMAGE_EXT, OUTPUT_FORMATS, SUPPORTED_EXT, CalibreMissing, find_ebook_convert, process_file,
    process_images_together,
)
from free_engines import (
    ENGINE_LABELS, OCR_LABELS, DeepLEngine, EngineError, EngineTranslator, GeminiEngine, GoogleFreeEngine,
    LibreTranslateEngine, MicrosoftEngine, OllamaEngine, Pipeline, TesseractOCR, find_tesseract,
)

APP_NAME = "Překladač knih a dokumentů"
LANGUAGES = [
    "čeština", "slovenština", "angličtina", "němčina", "polština", "francouzština", "španělština",
    "italština", "ruština", "ukrajinština", "maďarština",
]
SAME_FORMAT = "stejný jako vstup"

# Nastavení jednotlivých služeb: (klíč, popisek, tajné, výchozí hodnota, nabídka hodnot nebo None)
ENGINE_FIELDS = {
    "claude": [("api_key", "Claude API klíč", True, "", None), ("model", "Claude model", False, "", "claude_models")],
    "deepl": [("api_key", "DeepL API klíč", True, "", None)],
    "google": [],
    "microsoft": [("api_key", "Microsoft klíč", True, "", None),
                  ("region", "Oblast Azure (např. westeurope)", False, "", None)],
    "gemini": [("api_key", "Gemini API klíč", True, "", None),
               ("model", "Gemini model", False, GeminiEngine.DEFAULT_MODEL, None)],
    "ollama": [("url", "Adresa Ollama", False, "http://localhost:11434", None),
               ("model", "Ollama model", False, OllamaEngine.DEFAULT_MODEL, None)],
    "libre": [("url", "Adresa serveru", False, "http://localhost:5000", None),
              ("api_key", "API klíč (nepovinný)", True, "", None)],
}
ENV_KEYS = {"claude": "ANTHROPIC_API_KEY", "deepl": "DEEPL_API_KEY", "gemini": "GEMINI_API_KEY",
            "microsoft": "AZURE_TRANSLATOR_KEY"}
ENGINE_HELP = {
    "claude": "Klíč: platform.claude.com → API Keys (placené podle spotřeby).",
    "deepl": "Klíč zdarma: deepl.com → API → DeepL API Free (500 000 znaků měsíčně).",
    "google": "Bez registrace. Při velkém množství textu může Google dočasně omezit přístup.",
    "microsoft": "Klíč zdarma: portal.azure.com → Translator, cenová úroveň F0 (2 mil. znaků měsíčně).",
    "gemini": "Klíč zdarma: aistudio.google.com → Get API key. Bezplatná úroveň má limit požadavků za minutu.",
    "ollama": "Nainstalujte ollama.com, pak v příkazovém řádku: ollama pull gemma3:12b. Běží offline.",
    "libre": "Vlastní server LibreTranslate (např. přes Docker) nebo veřejná instance s klíčem.",
}


# --------------------------------------------------------------- nastavení
def config_path() -> Path:
    base = os.environ.get("APPDATA") or os.path.expanduser("~")
    return Path(base) / "Prekladac" / "config.json"


def load_config() -> dict:
    try:
        cfg = json.loads(config_path().read_text(encoding="utf-8"))
    except Exception:
        cfg = {}
    engines = cfg.setdefault("engines", {})
    # převod nastavení ze starší verze
    if cfg.get("api_key") or cfg.get("model"):
        c = engines.setdefault("claude", {})
        c.setdefault("api_key", cfg.pop("api_key", ""))
        c.setdefault("model", cfg.pop("model", ""))
    return cfg


def save_config(cfg: dict) -> None:
    p = config_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")


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
                raise EngineError("Chybí Claude API klíč (platform.claude.com → API Keys).")
            claude = ClaudeTranslator(api_key=key, model=c.get("model") or DEFAULT_MODEL, target_lang=lang,
                                      notes=notes, log=log, cancel_event=cancel_event)
        return claude

    segs = None
    if translate:
        if engine == "claude":
            segs = get_claude()
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
            ocr = TesseractOCR(s.get("ocr_lang") or "eng", s.get("tesseract") or None, log)

    if segs is None and ocr is None:
        return None
    if ocr is None and engine == "claude":
        return segs
    return Pipeline(segs, ocr, lang)


def files_need_ocr(files: list[str], out_fmt: str | None, translate: bool) -> bool:
    """Obrázky vždy; PDF při překladu nebo převodu do DOCX (stejná logika jako process_file)."""
    for f in files:
        ext = Path(f).suffix.lower()
        if ext in IMAGE_EXT:
            return True
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
    root.title(APP_NAME)
    root.geometry("900x820")
    root.minsize(760, 640)

    msgs: queue.Queue = queue.Queue()
    cancel_event = threading.Event()
    files: list[str] = []

    pad = {"padx": 8, "pady": 3}
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

    # --- obecné volby
    opts = ttk.LabelFrame(main, text="Nastavení")
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

    ttk.Label(opts, text="Text z obrázků/skenů:").grid(row=3, column=0, sticky="w", **pad)
    ocr = tk.StringVar(value=OCR_LABELS.get(cfg.get("ocr", "tesseract"), OCR_LABELS["tesseract"]))
    ocr_cb = ttk.Combobox(opts, textvariable=ocr, values=list(OCR_LABELS.values()), state="readonly")
    ocr_cb.grid(row=3, column=1, columnspan=3, sticky="ew", **pad)

    # --- nastavení vybraných služeb (mění se podle výběru)
    svc = ttk.LabelFrame(main, text="Nastavení služby")
    svc.grid(row=2, column=0, sticky="ew", **pad)
    svc.columnconfigure(1, weight=1)

    saved_engines = cfg.get("engines", {})
    engine_vars: dict[str, dict[str, tk.StringVar]] = {}
    for name, fields in ENGINE_FIELDS.items():
        engine_vars[name] = {}
        for key, _label, _secret, default, _choices in fields:
            val = saved_engines.get(name, {}).get(key) or default
            if name == "claude" and key == "model":
                val = next((n for n, m in MODELS.items() if m == (val or DEFAULT_MODEL)), list(MODELS)[0])
            engine_vars[name][key] = tk.StringVar(value=val)
    ocr_lang = tk.StringVar(value=cfg.get("ocr_lang", "eng"))
    tesseract = tk.StringVar(value=cfg.get("tesseract", "") or (find_tesseract() or ""))
    remember = tk.BooleanVar(value=cfg.get("remember_keys", False))

    def rebuild_service_frame(*_):
        for w in svc.winfo_children():
            w.destroy()
        e = engine_names[engine.get()]
        o = ocr_names[ocr.get()]
        shown = [e] if mode.get() == "translate" else []
        if o in ("claude", "gemini") and o not in shown:
            shown.append(o)
        row = 0
        for name in shown:
            ttk.Label(svc, text=ENGINE_HELP[name], foreground="#555").grid(
                row=row, column=0, columnspan=3, sticky="w", **pad)
            row += 1
            for key, label, secret, _d, choices in ENGINE_FIELDS[name]:
                ttk.Label(svc, text=label + ":").grid(row=row, column=0, sticky="w", **pad)
                var = engine_vars[name][key]
                if choices == "claude_models":
                    ttk.Combobox(svc, textvariable=var, values=list(MODELS), state="readonly").grid(
                        row=row, column=1, sticky="ew", **pad)
                else:
                    ttk.Entry(svc, textvariable=var, show="•" if secret else "").grid(
                        row=row, column=1, sticky="ew", **pad)
                row += 1
        if o == "tesseract":
            ttk.Label(svc, text="Jazyk textu na obrázcích (Tesseract, např. eng, ces, deu, eng+deu):").grid(
                row=row, column=0, sticky="w", **pad)
            ttk.Entry(svc, textvariable=ocr_lang, width=20).grid(row=row, column=1, sticky="w", **pad)
            row += 1
            ttk.Label(svc, text="Tesseract:").grid(row=row, column=0, sticky="w", **pad)
            ttk.Entry(svc, textvariable=tesseract).grid(row=row, column=1, sticky="ew", **pad)

            def pick_tess():
                f = filedialog.askopenfilename(title="Najděte tesseract.exe",
                                               filetypes=[("tesseract", "tesseract*"), ("Vše", "*.*")])
                if f:
                    tesseract.set(f)

            ttk.Button(svc, text="Najít…", command=pick_tess).grid(row=row, column=2, **pad)
            row += 1
        if any(f[2] for n in shown for f in ENGINE_FIELDS[n]):
            ttk.Checkbutton(svc, text="Zapamatovat klíče (uloží se do %APPDATA%\\Prekladac)",
                            variable=remember).grid(row=row, column=0, columnspan=2, sticky="w", **pad)
        if not svc.winfo_children():
            ttk.Label(svc, text="Žádné další nastavení není potřeba.").grid(row=0, column=0, sticky="w", **pad)

    engine_cb.bind("<<ComboboxSelected>>", rebuild_service_frame)
    ocr_cb.bind("<<ComboboxSelected>>", rebuild_service_frame)
    mode.trace_add("write", rebuild_service_frame)
    rebuild_service_frame()

    # --- další volby
    more = ttk.LabelFrame(main, text="Další")
    more.grid(row=3, column=0, sticky="ew", **pad)
    more.columnconfigure(1, weight=1)
    merge = tk.BooleanVar(value=cfg.get("merge_images", True))
    ttk.Checkbutton(more, text="Více obrázků spojit do jednoho DOCX", variable=merge).grid(
        row=0, column=0, columnspan=2, sticky="w", **pad)

    ttk.Label(more, text="Výstupní složka:").grid(row=1, column=0, sticky="w", **pad)
    out_dir = tk.StringVar(value=cfg.get("out_dir", ""))
    ttk.Entry(more, textvariable=out_dir).grid(row=1, column=1, sticky="ew", **pad)

    def pick_dir():
        d = filedialog.askdirectory()
        if d:
            out_dir.set(d)

    ttk.Button(more, text="Vybrat… (prázdné = vedle originálu)", command=pick_dir).grid(row=1, column=2, **pad)

    ttk.Label(more, text="Calibre:").grid(row=2, column=0, sticky="w", **pad)
    calibre = tk.StringVar(value=cfg.get("ebook_convert", "") or (find_ebook_convert() or ""))
    ttk.Entry(more, textvariable=calibre).grid(row=2, column=1, sticky="ew", **pad)

    def pick_calibre():
        f = filedialog.askopenfilename(title="Najděte ebook-convert.exe",
                                       filetypes=[("ebook-convert", "ebook-convert*"), ("Vše", "*.*")])
        if f:
            calibre.set(f)

    ttk.Button(more, text="Najít ebook-convert…", command=pick_calibre).grid(row=2, column=2, **pad)

    ttk.Label(more, text="Pokyny pro překlad\n(Claude, Gemini, Ollama):").grid(row=3, column=0, sticky="nw", **pad)
    notes = tk.Text(more, height=2, wrap="word")
    notes.grid(row=3, column=1, columnspan=2, sticky="ew", **pad)
    notes.insert("1.0", cfg.get("notes", ""))

    # --- průběh
    run_box = ttk.Frame(main)
    run_box.grid(row=4, column=0, sticky="ew", **pad)
    run_box.columnconfigure(0, weight=1)
    bar = ttk.Progressbar(run_box, maximum=1.0)
    bar.grid(row=0, column=0, sticky="ew", padx=(0, 8))
    start_btn = ttk.Button(run_box, text="Spustit")
    start_btn.grid(row=0, column=1)
    stop_btn = ttk.Button(run_box, text="Zastavit", state="disabled", command=lambda: cancel_event.set())
    stop_btn.grid(row=0, column=2, padx=(8, 0))

    log_box = ScrolledText(main, height=9, state="disabled", wrap="word")
    log_box.grid(row=5, column=0, sticky="nsew", **pad)
    main.rowconfigure(5, weight=1)

    def log(text: str):
        msgs.put(("log", text))

    def progress(f: float):
        msgs.put(("progress", f))

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
                elif kind == "done":
                    start_btn.configure(state="normal")
                    stop_btn.configure(state="disabled")
                    if val:
                        messagebox.showinfo(APP_NAME, f"Hotovo. Vytvořeno souborů: {len(val)}")
        except queue.Empty:
            pass
        root.after(100, poll)

    def collect_settings() -> dict:
        engines = {}
        for name, fields in ENGINE_FIELDS.items():
            engines[name] = {}
            for key, _l, _secret, _d, _c in fields:
                val = engine_vars[name][key].get().strip()
                if name == "claude" and key == "model":
                    val = MODELS.get(val, DEFAULT_MODEL)
                engines[name][key] = val
        return {
            "mode": mode.get(), "lang": lang.get().strip() or "čeština", "out_fmt": out_fmt.get(),
            "engine": engine_names[engine.get()], "ocr": ocr_names[ocr.get()], "engines": engines,
            "ocr_lang": ocr_lang.get().strip(), "tesseract": tesseract.get().strip(),
            "merge_images": merge.get(), "out_dir": out_dir.get(), "ebook_convert": calibre.get(),
            "notes": notes.get("1.0", "end").strip(), "remember_keys": remember.get(),
        }

    def start():
        if not files:
            messagebox.showwarning(APP_NAME, "Nejdřív přidejte soubory.")
            return
        s = collect_settings()
        to_save = json.loads(json.dumps(s))
        if not s["remember_keys"]:
            for name, fields in ENGINE_FIELDS.items():
                for key, _l, secret, _d, _c in fields:
                    if secret:
                        to_save["engines"][name][key] = ""
        try:
            save_config(to_save)
        except Exception:
            pass

        translate = s["mode"] == "translate"
        cancel_event.clear()
        try:
            tr = build_translator(s, translate, files_need_ocr(files, s["out_fmt"], translate), log, cancel_event)
        except Exception as e:
            messagebox.showerror(APP_NAME, str(e))
            return

        start_btn.configure(state="disabled")
        stop_btn.configure(state="normal")
        bar["value"] = 0

        def worker():
            res = []
            try:
                res = run_jobs(list(files), translate, s["out_fmt"], tr, s["out_dir"] or None, s["merge_images"],
                               log, progress, s["ebook_convert"] or None, cancel_event)
            except Exception as e:  # noqa: BLE001
                log(f"Neočekávaná chyba: {e}")
            msgs.put(("done", res))

        threading.Thread(target=worker, daemon=True).start()

    start_btn.configure(command=start)
    if not find_ebook_convert(calibre.get() or None):
        log("Upozornění: Calibre nebylo nalezeno. Bez něj nepůjdou e-knihy (AZW3, KFX, MOBI, RTF) "
            "ani převody mezi formáty. DOCX, TXT, EPUB, PDF a obrázky fungují i bez něj.")
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
    ap.add_argument("--key", default="", help="API klíč pro zvolený překladač (jinak z proměnné prostředí)")
    ap.add_argument("--model", default="", help="model (Claude, Gemini, Ollama)")
    ap.add_argument("--url", default="", help="adresa serveru (Ollama, LibreTranslate)")
    ap.add_argument("--convert-only", action="store_true", help="jen převést / přepsat, nepřekládat")
    ap.add_argument("--out-dir")
    ap.add_argument("--notes", default="", help="pokyny pro překlad (glosář, styl)")
    ap.add_argument("--merge-images", action="store_true", help="více obrázků do jednoho DOCX")
    ap.add_argument("--calibre", help="cesta k ebook-convert")
    ap.add_argument("--tesseract", help="cesta k tesseract")
    a = ap.parse_args(argv)

    cfg = {k: v for k, v in (("api_key", a.key), ("model", a.model), ("url", a.url)) if v}
    s = {"engine": a.engine, "ocr": a.ocr, "lang": a.lang, "notes": a.notes, "ocr_lang": a.ocr_lang,
         "tesseract": a.tesseract or "", "engines": {a.engine: cfg}}
    cancel = threading.Event()
    translate = not a.convert_only
    try:
        tr = build_translator(s, translate, files_need_ocr(a.files, a.fmt, translate), print, cancel)
    except EngineError as e:
        print(e)
        return 2
    res = run_jobs(a.files, translate, a.fmt, tr, a.out_dir, a.merge_images, print, lambda f: None, a.calibre,
                   cancel)
    return 0 if len(res) == len(a.files) or (a.merge_images and res) else 1


if __name__ == "__main__":
    if len(sys.argv) > 1:
        sys.exit(run_cli(sys.argv[1:]))
    run_gui()
