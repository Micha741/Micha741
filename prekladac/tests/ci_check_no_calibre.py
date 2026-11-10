"""CI: bez Calibre musí AZW3 ohlásit srozumitelně chybějící Calibre (EPUB/MOBI/PDB jdou vlastním kódem)."""
import glob
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import converters  # noqa: E402

converters.find_ebook_convert = lambda *a, **k: None
src = glob.glob("nocal_out/*.epub")[0]
converters.convert(src, "nocal_out/znovu.mobi", print)  # vlastním kódem
try:
    converters.convert(src, "nocal_out/x.azw3", print)
except converters.CalibreMissing as e:
    print("OK:", e)
    sys.exit(0)
sys.exit("AZW3 bez Calibre měl ohlásit chybějící Calibre")
