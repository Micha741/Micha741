"""Ochrana vlastní knihy při exportu (náhrada DRM, které dávají jen obchody):

- vodoznak („sociální DRM“): do každé kapitoly a na začátek knihy se vloží „Licence pro: …“,
- PDF s heslem: soubor se otevře jen po zadání hesla, volitelně bez tisku a kopírování textu (AES-256).
"""
from __future__ import annotations

import copy
import html
import secrets
from pathlib import Path


def watermark_project(project: dict, licensee: str) -> dict:
    """Kopie knihy s vodoznakem „Licence pro: …“ v popisu a na konci každé kapitoly (originál se nemění)."""
    text = licensee.strip()
    if not text:
        return project
    p = copy.deepcopy(project)
    line = f"Licence pro: {text}"
    note = (f'<p style="text-align:center; font-size:small; color:#777777">'
            f'{html.escape(line)} – šíření bez souhlasu autora je zakázáno.</p>')
    for ch in p.get("chapters", []):
        h = ch.get("html")
        if h:  # celá HTML stránka z editoru: vodoznak před konec těla, jinak by se ignoroval
            i = h.lower().rfind("</body>")
            ch["html"] = h[:i] + note + h[i:] if i >= 0 else h + note
        ch["text"] = (ch.get("text") or "").rstrip() + f"\n\n{line} – šíření bez souhlasu autora je zakázáno."
    p["license_for"] = text
    return p


def protect_pdf(path: str | Path, password: str, no_print_copy: bool = True) -> None:
    """Zašifruje PDF heslem (AES-256). Bez hesla se neotevře; volitelně zakáže tisk a kopírování textu."""
    from pypdf import PdfReader, PdfWriter
    from pypdf.constants import UserAccessPermissions as P

    if not password:
        raise ValueError("Zadejte heslo k PDF.")
    path = Path(path)
    reader = PdfReader(str(path))
    writer = PdfWriter(clone_from=reader)
    blocked = {P.PRINT, P.PRINT_TO_REPRESENTATION, P.EXTRACT, P.EXTRACT_TEXT_AND_GRAPHICS, P.MODIFY,
               P.ADD_OR_MODIFY} if no_print_copy else set()
    allowed = P(0)
    for flag in P:
        if flag not in blocked:
            allowed |= flag
    # heslo vlastníka (pro změnu oprávnění) je náhodné a nikde se neukládá – knihu nikdo „neodemkne“ úplně
    writer.encrypt(user_password=password, owner_password=secrets.token_urlsafe(24), permissions_flag=allowed,
                   algorithm="AES-256")
    tmp = path.with_suffix(".tmp.pdf")
    with open(tmp, "wb") as f:
        writer.write(f)
    tmp.replace(path)
