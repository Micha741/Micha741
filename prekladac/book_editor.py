"""Editor napsané knihy: úprava kapitol, písmo, zalomení, hledání a nahrazení, statistiky, export."""

from __future__ import annotations

import tkinter as tk
from pathlib import Path
from tkinter import font as tkfont
from tkinter import messagebox, ttk
from tkinter.scrolledtext import ScrolledText

import book_writer as bw

COMMON_FONTS = ["Georgia", "Times New Roman", "Cambria", "Garamond", "Palatino Linotype", "Book Antiqua",
                "Calibri", "Arial", "Verdana", "Segoe UI", "Tahoma", "Constantia", "Bookman Old Style"]


def open_editor(root, project: dict, path: Path, ebook_convert: str | None, run_in_thread) -> None:
    """run_in_thread(fn, done) spustí pomalou akci mimo okno (export přes Calibre)."""
    outline = project["outline"]
    fmt = {**bw.DEFAULT_FORMAT, **project.get("format", {})}
    project["format"] = fmt

    w = tk.Toplevel(root)
    w.title(f"Upravit knihu – {outline['title']}")
    w.geometry("1150x800")
    w.minsize(800, 500)
    try:
        w.state("zoomed")  # Windows: rovnou na celou obrazovku
    except tk.TclError:
        pass
    st = {"cur": None, "dirty": False, "loading": False}

    # ---------------------------------------------------- horní lišta
    bar = ttk.Frame(w, padding=(8, 6))
    bar.pack(fill="x")
    ttk.Label(bar, text="Název knihy:").pack(side="left")
    title_var = tk.StringVar(value=outline["title"])
    ttk.Entry(bar, textvariable=title_var, width=34).pack(side="left", padx=(4, 12))
    ttk.Label(bar, text="Autor:").pack(side="left")
    author_var = tk.StringVar(value=project.get("author", ""))
    ttk.Entry(bar, textvariable=author_var, width=20).pack(side="left", padx=(4, 12))
    ttk.Label(bar, text="Písmo:").pack(side="left")
    available = set(tkfont.families(w))
    fonts = [f for f in COMMON_FONTS if f in available] or COMMON_FONTS
    font_var = tk.StringVar(value=fmt["font"])
    ttk.Combobox(bar, textvariable=font_var, values=sorted(set(fonts) | {fmt["font"]}), width=18).pack(
        side="left", padx=4)
    size_var = tk.IntVar(value=int(fmt["size"]))
    ttk.Spinbox(bar, from_=8, to=28, textvariable=size_var, width=4).pack(side="left", padx=(0, 12))
    full = tk.BooleanVar(value=False)

    def toggle_full():
        w.attributes("-fullscreen", full.get())

    ttk.Checkbutton(bar, text="Celá obrazovka (Esc)", variable=full, command=toggle_full).pack(side="right")
    w.bind("<Escape>", lambda e: (full.set(False), toggle_full()))

    # ---------------------------------------------------- hledání
    sbar = ttk.Frame(w, padding=(8, 0, 8, 6))
    sbar.pack(fill="x")
    ttk.Label(sbar, text="Hledat:").pack(side="left")
    find_var = tk.StringVar()
    find_entry = ttk.Entry(sbar, textvariable=find_var, width=28)
    find_entry.pack(side="left", padx=4)
    ttk.Label(sbar, text="Nahradit:").pack(side="left", padx=(8, 0))
    repl_var = tk.StringVar()
    ttk.Entry(sbar, textvariable=repl_var, width=22).pack(side="left", padx=4)
    whole_book = tk.BooleanVar(value=True)
    ttk.Checkbutton(sbar, text="v celé knize", variable=whole_book).pack(side="left", padx=4)
    find_info = ttk.Label(sbar, text="", foreground="#555")

    # ---------------------------------------------------- tělo
    body = ttk.PanedWindow(w, orient="horizontal")
    body.pack(fill="both", expand=True, padx=8)
    left = ttk.Frame(body)
    body.add(left, weight=1)
    ttk.Label(left, text="Kapitoly:").pack(anchor="w")
    chapters_lb = tk.Listbox(left, exportselection=False, width=32)
    chapters_lb.pack(fill="both", expand=True)

    right = ttk.Frame(body)
    body.add(right, weight=4)
    head = ttk.Frame(right)
    head.pack(fill="x")
    ttk.Label(head, text="Název kapitoly:").pack(side="left")
    ch_title = tk.StringVar()
    ttk.Entry(head, textvariable=ch_title).pack(side="left", fill="x", expand=True, padx=4)
    ttk.Button(head, text="Vložit zalomení stránky",
               command=lambda: (text.insert("insert", f"\n{bw.PAGE_BREAK}\n"), mark_dirty())).pack(side="left")
    text = ScrolledText(right, wrap="word", undo=True, padx=24, pady=12)
    text.pack(fill="both", expand=True, pady=(4, 0))
    text.tag_configure("found", background="#ffe066")
    text.tag_configure("pagebreak", foreground="#888", background="#eef")
    ttk.Label(right, text="Prázdný řádek = nový odstavec · Enter = zalomení řádku · "
                         f"{bw.PAGE_BREAK} = zalomení stránky · Ctrl+F hledat · Ctrl+S uložit",
              foreground="#555").pack(anchor="w")

    # ---------------------------------------------------- spodek
    stats = ttk.Label(w, text="", padding=(8, 4, 8, 0))
    stats.pack(fill="x")
    bottom = ttk.Frame(w, padding=8)
    bottom.pack(fill="x")
    toc_var = tk.BooleanVar(value=bool(fmt.get("toc", True)))
    fmt_vars = {f: tk.BooleanVar(value=f in ("epub", "docx")) for f in ("epub", "docx", "pdf", "azw3")}

    # ---------------------------------------------------- funkce
    def apply_font(*_):
        try:
            text.configure(font=(font_var.get(), int(size_var.get()) + 1))
        except (tk.TclError, ValueError):
            pass

    def highlight_breaks():
        text.tag_remove("pagebreak", "1.0", "end")
        start = "1.0"
        while True:
            pos = text.search(bw.PAGE_BREAK, start, stopindex="end")
            if not pos:
                break
            end = f"{pos}+{len(bw.PAGE_BREAK)}c"
            text.tag_add("pagebreak", pos, end)
            start = end

    def store_current():
        i = st["cur"]
        if i is None:
            return
        project["chapters"][i]["text"] = text.get("1.0", "end-1c").strip()
        outline["chapters"][i]["title"] = ch_title.get().strip() or outline["chapters"][i]["title"]

    def refresh_list():
        sel = st["cur"]
        chapters_lb.delete(0, "end")
        for i, _ch in enumerate(project["chapters"]):
            chapters_lb.insert("end", f"{i + 1}. {outline['chapters'][i]['title']}")
        if sel is not None:
            chapters_lb.selection_set(sel)
            chapters_lb.see(sel)

    def update_stats(*_):
        if st["cur"] is not None:
            store_current()
        words, paras, n = bw.book_stats(project)
        def num(x):
            return f"{x:,}".replace(",", " ")

        cur = ""
        if st["cur"] is not None:
            cw, cp = bw.text_stats(project["chapters"][st["cur"]]["text"])
            cur = f"Kapitola {st['cur'] + 1}: {num(cw)} slov, {num(cp)} odstavců   ·   "
        stats.configure(text=cur + f"Kniha: {n} kapitol, {num(words)} slov, {num(paras)} odstavců "
                                   f"(asi {num(max(1, words // 300))} stran)"
                        + ("   ·   ● neuloženo" if st["dirty"] else "   ·   uloženo"))

    def show(i):
        store_current()
        prev_dirty = st["dirty"]
        st["cur"] = i
        st["loading"] = True  # načtení kapitoly není úprava
        text.delete("1.0", "end")
        text.insert("1.0", project["chapters"][i]["text"])
        text.edit_reset()
        text.edit_modified(False)
        ch_title.set(outline["chapters"][i]["title"])
        st["loading"] = False

        def settle():  # události o změně textu dorazí až po načtení – nejsou to úpravy uživatele
            st["dirty"] = prev_dirty
            update_stats()

        w.after(150, settle)
        highlight_breaks()
        refresh_list()
        update_stats()

    def mark_dirty(*_):
        if st["loading"]:
            return
        st["dirty"] = True
        highlight_breaks()
        update_stats()

    def save(*_):
        store_current()
        outline["title"] = title_var.get().strip() or outline["title"]
        project["author"] = author_var.get().strip()
        fmt.update(font=font_var.get().strip() or bw.DEFAULT_FORMAT["font"], size=int(size_var.get()),
                   toc=toc_var.get())
        bw.save_project(path, project)
        st["dirty"] = False
        refresh_list()
        update_stats()
        w.title(f"Upravit knihu – {outline['title']}")
        return "break"

    def find_next(*_):
        needle = find_var.get()
        text.tag_remove("found", "1.0", "end")
        if not needle:
            return "break"
        store_current()
        order = list(range(len(project["chapters"])))
        cur = st["cur"] or 0
        start = text.index("insert+1c")
        pos = text.search(needle, start, stopindex="end", nocase=True)
        if not pos and whole_book.get():
            for j in order[cur + 1:] + order[:cur + 1]:
                if needle.lower() in project["chapters"][j]["text"].lower():
                    show(j)
                    pos = text.search(needle, "1.0", stopindex="end", nocase=True)
                    break
        if not pos:
            pos = text.search(needle, "1.0", stopindex="end", nocase=True)
        if pos:
            end = f"{pos}+{len(needle)}c"
            text.tag_add("found", pos, end)
            text.mark_set("insert", end)
            text.see(pos)
        total = sum(ch["text"].lower().count(needle.lower()) for ch in project["chapters"])
        find_info.configure(text=f"nalezeno celkem {total}×" if total else "nenalezeno")
        return "break"

    def replace_all():
        needle, repl = find_var.get(), repl_var.get()
        if not needle:
            return
        store_current()
        targets = range(len(project["chapters"])) if whole_book.get() else [st["cur"] or 0]
        count = 0
        for j in targets:
            t = project["chapters"][j]["text"]
            count += t.count(needle)
            project["chapters"][j]["text"] = t.replace(needle, repl)
        if count:
            cur = st["cur"] or 0
            st["cur"] = None
            show(cur)
            mark_dirty()  # nahrazení je úprava
        find_info.configure(text=f"nahrazeno {count}×")

    def do_export():
        save()
        formats = [f for f, v in fmt_vars.items() if v.get()] or ["docx"]

        def done(files, err):
            if err:
                messagebox.showerror("Export", str(err), parent=w)
            else:
                messagebox.showinfo("Export", "Uloženo:\n\n" + "\n".join(files), parent=w)

        run_in_thread(lambda: bw.export(project, path.parent, formats, lambda *_: None, ebook_convert), done)

    def on_close():
        store_current()
        if st["dirty"]:
            ans = messagebox.askyesnocancel("Upravit knihu", "Uložit změny?", parent=w)
            if ans is None:
                return
            if ans:
                save()
        w.destroy()

    ttk.Button(sbar, text="Najít další", command=find_next).pack(side="left", padx=4)
    ttk.Button(sbar, text="Nahradit vše", command=replace_all).pack(side="left", padx=4)
    find_info.pack(side="left", padx=8)
    ttk.Checkbutton(bottom, text="Obsah s odkazy na kapitoly", variable=toc_var, command=mark_dirty).pack(
        side="left")
    ttk.Label(bottom, text="   Exportovat jako:").pack(side="left")
    for f, v in fmt_vars.items():
        ttk.Checkbutton(bottom, text=f.upper(), variable=v).pack(side="left", padx=2)
    ttk.Button(bottom, text="Uložit (Ctrl+S)", command=save).pack(side="right")
    ttk.Button(bottom, text="Exportovat", command=do_export).pack(side="right", padx=8)

    chapters_lb.bind("<<ListboxSelect>>",
                     lambda e: chapters_lb.curselection() and chapters_lb.curselection()[0] != st["cur"]
                     and show(chapters_lb.curselection()[0]))
    text.bind("<<Modified>>", lambda e: (text.edit_modified(False), mark_dirty()))
    ch_title.trace_add("write", lambda *_: st["cur"] is not None and mark_dirty())
    font_var.trace_add("write", lambda *_: (apply_font(), mark_dirty()))
    size_var.trace_add("write", lambda *_: (apply_font(), mark_dirty()))
    find_entry.bind("<Return>", find_next)
    for widget in (w, text):
        widget.bind("<Control-f>", lambda e: (find_entry.focus_set(), "break")[1])
        widget.bind("<Control-s>", save)
    w.protocol("WM_DELETE_WINDOW", on_close)

    apply_font()
    if project["chapters"]:
        show(0)
        st["dirty"] = False
        update_stats()
    return w
