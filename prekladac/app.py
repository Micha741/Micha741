"""Překladač e-knih a dokumentů – okno pro Windows (a příkazová řádka).

Spuštění bez parametrů otevře okno. Příklad z příkazové řádky:
    python app.py kniha.epub --to azw3 --lang čeština
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

APP_NAME = "Překladač knih a dokumentů"
LANGUAGES = [
    "čeština", "slovenština", "angličtina", "němčina", "polština", "francouzština", "španělština",
    "italština", "ruština", "ukrajinština",
]
SAME_FORMAT = "stejný jako vstup"


# --------------------------------------------------------------- nastavení
def config_path() -> Path:
    base = os.environ.get("APPDATA") or os.path.expanduser("~")
    return Path(base) / "Prekladac" / "config.json"


def load_config() -> dict:
    try:
        return json.loads(config_path().read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_config(cfg: dict) -> None:
    p = config_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")


def make_translator(api_key, model, lang, notes, log, cancel_event):
    from claude_client import ClaudeTranslator

    key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("Chybí Claude API klíč (zadejte ho v okně nebo nastavte ANTHROPIC_API_KEY).")
    return ClaudeTranslator(api_key=key, model=model, target_lang=lang, notes=notes, log=log,
                            cancel_event=cancel_event)


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
        except CalibreMissing as e:
            log(f"  ✗ {e}")
        except Exception as e:  # noqa: BLE001 – chyba jednoho souboru nemá zastavit ostatní
            log(f"  ✗ Chyba: {e}")
            if os.environ.get("PREKLADAC_DEBUG"):
                log(traceback.format_exc())
    if tr is not None and hasattr(tr, "cost_summary"):
        log(tr.cost_summary())
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
    root.geometry("860x700")
    root.minsize(720, 560)

    msgs: queue.Queue = queue.Queue()
    cancel_event = threading.Event()
    files: list[str] = []

    pad = {"padx": 8, "pady": 4}
    main = ttk.Frame(root, padding=10)
    main.pack(fill="both", expand=True)
    main.columnconfigure(0, weight=1)

    # --- soubory
    box = ttk.LabelFrame(main, text="Soubory (EPUB, AZW3, KFX, MOBI, PDF, DOCX, TXT, RTF, JPG, PNG…)")
    box.grid(row=0, column=0, sticky="nsew", **pad)
    box.columnconfigure(0, weight=1)
    listbox = tk.Listbox(box, height=7, selectmode="extended")
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

    # --- volby
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

    ttk.Label(opts, text="Model:").grid(row=2, column=0, sticky="w", **pad)
    model_names = list(MODELS)
    saved_model = cfg.get("model", DEFAULT_MODEL)
    model = tk.StringVar(value=next((n for n, m in MODELS.items() if m == saved_model), model_names[0]))
    ttk.Combobox(opts, textvariable=model, values=model_names, state="readonly").grid(
        row=2, column=1, sticky="ew", **pad)

    ttk.Label(opts, text="Claude API klíč:").grid(row=2, column=2, sticky="w", **pad)
    api_key = tk.StringVar(value=cfg.get("api_key", ""))
    ttk.Entry(opts, textvariable=api_key, show="•").grid(row=2, column=3, sticky="ew", **pad)

    remember = tk.BooleanVar(value=bool(cfg.get("api_key")))
    ttk.Checkbutton(opts, text="Zapamatovat klíč", variable=remember).grid(row=3, column=3, sticky="w", **pad)
    merge = tk.BooleanVar(value=cfg.get("merge_images", True))
    ttk.Checkbutton(opts, text="Více obrázků spojit do jednoho DOCX", variable=merge).grid(
        row=3, column=0, columnspan=2, sticky="w", **pad)

    ttk.Label(opts, text="Výstupní složka:").grid(row=4, column=0, sticky="w", **pad)
    out_dir = tk.StringVar(value=cfg.get("out_dir", ""))
    ttk.Entry(opts, textvariable=out_dir).grid(row=4, column=1, columnspan=2, sticky="ew", **pad)

    def pick_dir():
        d = filedialog.askdirectory()
        if d:
            out_dir.set(d)

    ttk.Button(opts, text="Vybrat… (prázdné = vedle originálu)", command=pick_dir).grid(
        row=4, column=3, sticky="ew", **pad)

    ttk.Label(opts, text="Calibre:").grid(row=5, column=0, sticky="w", **pad)
    calibre = tk.StringVar(value=cfg.get("ebook_convert", "") or (find_ebook_convert() or ""))
    ttk.Entry(opts, textvariable=calibre).grid(row=5, column=1, columnspan=2, sticky="ew", **pad)

    def pick_calibre():
        f = filedialog.askopenfilename(title="Najděte ebook-convert.exe",
                                       filetypes=[("ebook-convert", "ebook-convert*"), ("Vše", "*.*")])
        if f:
            calibre.set(f)

    ttk.Button(opts, text="Najít ebook-convert…", command=pick_calibre).grid(row=5, column=3, sticky="ew", **pad)

    ttk.Label(opts, text="Pokyny pro překlad\n(nepovinné: glosář, styl):").grid(row=6, column=0, sticky="nw", **pad)
    notes = tk.Text(opts, height=3, wrap="word")
    notes.grid(row=6, column=1, columnspan=3, sticky="ew", **pad)
    notes.insert("1.0", cfg.get("notes", ""))

    # --- průběh
    run_box = ttk.Frame(main)
    run_box.grid(row=2, column=0, sticky="ew", **pad)
    run_box.columnconfigure(0, weight=1)
    bar = ttk.Progressbar(run_box, maximum=1.0)
    bar.grid(row=0, column=0, sticky="ew", padx=(0, 8))
    start_btn = ttk.Button(run_box, text="Spustit")
    start_btn.grid(row=0, column=1)
    stop_btn = ttk.Button(run_box, text="Zastavit", state="disabled", command=lambda: cancel_event.set())
    stop_btn.grid(row=0, column=2, padx=(8, 0))

    log_box = ScrolledText(main, height=12, state="disabled", wrap="word")
    log_box.grid(row=3, column=0, sticky="nsew", **pad)
    main.rowconfigure(3, weight=1)

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

    def start():
        if not files:
            messagebox.showwarning(APP_NAME, "Nejdřív přidejte soubory.")
            return
        translate = mode.get() == "translate"
        needs_claude = translate or any(
            Path(f).suffix.lower() in IMAGE_EXT
            or (Path(f).suffix.lower() == ".pdf" and out_fmt.get() in (SAME_FORMAT, "docx"))
            for f in files
        )
        model_id = MODELS[model.get()]
        new_cfg = {
            "mode": mode.get(), "lang": lang.get(), "out_fmt": out_fmt.get(), "model": model_id,
            "merge_images": merge.get(), "out_dir": out_dir.get(), "ebook_convert": calibre.get(),
            "notes": notes.get("1.0", "end").strip(),
            "api_key": api_key.get().strip() if remember.get() else "",
        }
        try:
            save_config(new_cfg)
        except Exception:
            pass

        cancel_event.clear()
        tr = None
        if needs_claude:
            try:
                tr = make_translator(api_key.get().strip(), model_id, lang.get().strip() or "čeština",
                                     new_cfg["notes"], log, cancel_event)
            except Exception as e:
                messagebox.showerror(APP_NAME, str(e))
                return

        start_btn.configure(state="disabled")
        stop_btn.configure(state="normal")
        bar["value"] = 0

        def worker():
            res = []
            try:
                res = run_jobs(list(files), translate, out_fmt.get(), tr, out_dir.get() or None, merge.get(), log,
                               progress, calibre.get() or None, cancel_event)
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
    from claude_client import DEFAULT_MODEL

    ap = argparse.ArgumentParser(description=APP_NAME)
    ap.add_argument("files", nargs="+")
    ap.add_argument("--to", dest="fmt", choices=OUTPUT_FORMATS, help="výstupní formát (výchozí: podle vstupu)")
    ap.add_argument("--lang", default="čeština", help="cílový jazyk (výchozí: čeština)")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--convert-only", action="store_true", help="jen převést / přepsat, nepřekládat")
    ap.add_argument("--out-dir")
    ap.add_argument("--notes", default="", help="pokyny pro překlad (glosář, styl)")
    ap.add_argument("--merge-images", action="store_true", help="více obrázků do jednoho DOCX")
    ap.add_argument("--calibre", help="cesta k ebook-convert")
    a = ap.parse_args(argv)

    cancel = threading.Event()
    translate = not a.convert_only
    needs = translate or any(Path(f).suffix.lower() in IMAGE_EXT | {".pdf"} for f in a.files)
    tr = make_translator(None, a.model, a.lang, a.notes, print, cancel) if needs else None
    res = run_jobs(a.files, translate, a.fmt, tr, a.out_dir, a.merge_images, print, lambda f: None, a.calibre,
                   cancel)
    return 0 if len(res) == len(a.files) or (a.merge_images and res) else 1


if __name__ == "__main__":
    if len(sys.argv) > 1:
        sys.exit(run_cli(sys.argv[1:]))
    run_gui()
