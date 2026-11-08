"""Vytvoří soubor s údaji o verzi pro PyInstaller (--version-file): verze souboru, popis, autorská práva.

    python tools/make_version_info.py build/version_info.txt
Verzi bere z version.py (v CI je tam 1.0.<číslo sestavení>).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

COMPANY = "Micha741"
PRODUCT = "Překladač knih a dokumentů"
COPYRIGHT = "© 2026 Micha741"


def version_tuple(text: str) -> tuple[int, int, int, int]:
    nums = [int(n) for n in re.findall(r"\d+", text)][:4]
    return tuple((nums + [0, 0, 0, 0])[:4]) if nums else (0, 0, 0, 0)


def render(version: str) -> str:
    v = version_tuple(version)
    dotted = ".".join(map(str, v))
    shown = version if v != (0, 0, 0, 0) else "0.0.0.0"
    strings = {
        "CompanyName": COMPANY,
        "FileDescription": PRODUCT,
        "FileVersion": dotted,
        "InternalName": "Prekladac",
        "LegalCopyright": COPYRIGHT,
        "OriginalFilename": "Prekladac.exe",
        "ProductName": PRODUCT,
        "ProductVersion": shown,
    }
    items = ",\n            ".join(f"StringStruct({k!r}, {val!r})" for k, val in strings.items())
    return f"""# UTF-8
VSVersionInfo(
  ffi=FixedFileInfo(filevers={v}, prodvers={v}, mask=0x3f, flags=0x0, OS=0x40004, fileType=0x1, subtype=0x0,
                    date=(0, 0)),
  kids=[
    StringFileInfo([
      StringTable('040504B0', [
            {items}
      ])
    ]),
    VarFileInfo([VarStruct('Translation', [0x0405, 1200])])
  ]
)
"""


def main() -> None:
    from version import VERSION

    out = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "build" / "version_info.txt")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(render(VERSION), encoding="utf-8")
    print(f"{out}: {VERSION}")


if __name__ == "__main__":
    main()
